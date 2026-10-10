import { describe, it, expect, beforeEach } from "vitest";
import { and, eq, sum } from "drizzle-orm";
import { freshDb, customer } from "./setup";
import { financeInvoices, orders, storeAcquisitions, stores, supplierContracts, suppliers } from "@/db/schema";
import { closeMonth, ensureContract, estimateClosing, financeOverview, getPriceBook, issueSubscriptionInvoices, issueSupplierOnboardingInvoices, markInvoicePaid, periodOf, refreshSupplierAccess, runDailyFinanceJobs, savePriceBook, supplierVolume, voidStoreSetup } from "@/lib/domain/finance";
import { createStore, createSupplier } from "@/lib/domain/provisioning";
import { manualCredit } from "@/lib/domain/wallet";
import { advanceOrder, createOrder, registerShippingLabel } from "@/lib/domain/orders";
import { DEFAULT_PRICE_BOOK } from "@/lib/finance/price-book";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
const period = () => periodOf(new Date());
const v = (i: number, size: string) => ctx.seed.variantsByProduct.get(ctx.seed.productIds[i]!)!.find((x) => x.size === size)!.id;

describe("tabela de preços", () => {
  it("usa os valores acordados por padrão", async () => {
    const b = await getPriceBook(ctx.db);
    expect(b.offers.STORE_OWN).toMatchObject({ setupCents: 200_000, monthlyCents: 19_700 });
    expect(b.channel.setupCommissionBps).toBe(2500);
    expect(b.whiteLabel.setupCents).toBe(1_500_000);
  });
  it("salva alterações e rejeita prazos de atraso fora de ordem", async () => {
    const saved = await savePriceBook(ctx.db, { ...DEFAULT_PRICE_BOOK, superdrop: { ...DEFAULT_PRICE_BOOK.superdrop, volumeFeeBps: 250 } }, ctx.actors.master.userId);
    expect(saved.superdrop.volumeFeeBps).toBe(250);
    expect((await getPriceBook(ctx.db)).superdrop.volumeFeeBps).toBe(250);
    await expect(savePriceBook(ctx.db, { ...DEFAULT_PRICE_BOOK, dunning: { warningDays: 1, partialBlockDays: 20, suspendedDays: 15, closedDays: 30 } }, "u")).rejects.toThrow(/crescentes/);
    await expect(savePriceBook(ctx.db, { ...DEFAULT_PRICE_BOOK, superdrop: { ...DEFAULT_PRICE_BOOK.superdrop, volumeFeeBps: -1 } }, "u")).rejects.toThrow();
  });
});

describe("contratos e faturas de onboarding", () => {
  it("contrato do fornecedor fundador tem isenção e preço travado", async () => {
    const c = await ensureContract(ctx.db, ctx.seed.supplierId);
    expect(c.monthlyWaivedUntil).toBeTruthy();
    expect(new Date(c.monthlyWaivedUntil!).getTime()).toBeGreaterThan(Date.now() + 80 * 86_400_000);
    expect(c.priceLockUntil).toBeTruthy();
    expect(c.volumeFeeBps).toBe(300);
  });

  it("mensalidade do mês do fornecedor isento nasce zerada e é idempotente", async () => {
    const before = await ctx.db.select().from(financeInvoices).where(and(eq(financeInvoices.supplierId, ctx.seed.supplierId), eq(financeInvoices.kind, "SUPPLIER_SUBSCRIPTION")));
    expect(before).toHaveLength(1);
    expect(before[0]).toMatchObject({ amountCents: 0, status: "WAIVED" });
    expect((await issueSubscriptionInvoices(ctx.db, period())).issued).toBe(0);
  });

  it("fornecedor White Label recebe fatura de setup de R$ 15.000 e mensalidade antecipada", async () => {
    const r = await createSupplier(ctx.db, { name: "Marca WL", adminName: "Ana", adminEmail: "ana@wl.com", businessModel: "WHITE_LABEL" });
    const inv = await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.supplierId, r.supplierId));
    const setup = inv.find((i) => i.kind === "SUPPLIER_SETUP")!;
    const sub = inv.find((i) => i.kind === "SUPPLIER_SUBSCRIPTION")!;
    expect(setup).toMatchObject({ amountCents: 1_500_000, status: "OPEN" });
    expect(sub).toMatchObject({ amountCents: 200_000, status: "OPEN" });
    await issueSupplierOnboardingInvoices(ctx.db, r.supplierId);
    expect((await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.supplierId, r.supplierId)))).toHaveLength(2);
  });

  it("parceiro fundador White Label fica com setup e mensalidade isentos", async () => {
    const r = await createSupplier(ctx.db, { name: "Fundador WL", adminName: "Bia", adminEmail: "bia@wl.com", businessModel: "WHITE_LABEL", waiveFees: true });
    const inv = await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.supplierId, r.supplierId));
    expect(inv.every((i) => i.status === "WAIVED" && i.amountCents === 0)).toBe(true);
    expect(inv.find((i) => i.kind === "SUPPLIER_SETUP")?.lines.some((l) => l.kind === "WAIVER")).toBe(true);
  });
});

describe("base da taxa de volume", () => {
  it("soma o custo dos pedidos com pagamento à Central confirmado no mês", async () => {
    const vol = await supplierVolume(ctx.db, ctx.seed.supplierId, period());
    const [direct] = await ctx.db.select({ s: sum(orders.costTotalCents) }).from(orders).where(and(eq(orders.supplierId, ctx.seed.supplierId), eq(orders.centralPaymentStatus, "PAID")));
    const canceled = await ctx.db.select({ s: sum(orders.costTotalCents) }).from(orders).where(and(eq(orders.supplierId, ctx.seed.supplierId), eq(orders.centralPaymentStatus, "PAID"), eq(orders.status, "CANCELED")));
    expect(vol.baseCents).toBe(Number(direct?.s ?? 0) - Number(canceled[0]?.s ?? 0));
    expect(vol.baseCents).toBeGreaterThan(0);
  });
  it("não conta pedidos ainda sem pagamento à Central nem de outro mês", async () => {
    const r = await createOrder(ctx.db, { storeId: ctx.seed.stores.arena.id, customer, items: [{ productId: ctx.seed.productIds[4]!, variantId: v(4, "M"), quantity: 1 }], customerPaymentStatus: "PAID" });
    expect(r.status).toBe("AWAITING_CENTRAL_PAYMENT");
    const before = await supplierVolume(ctx.db, ctx.seed.supplierId, period());
    await manualCredit(ctx.db, ctx.actors.supplier, ctx.seed.stores.arena.id, { amountCents: 2_000_000, note: "Teste de recarga" });
    const after = await supplierVolume(ctx.db, ctx.seed.supplierId, period());
    expect(after.baseCents).toBeGreaterThan(before.baseCents);
    expect((await supplierVolume(ctx.db, ctx.seed.supplierId, "2020-01")).baseCents).toBe(0);
  });
});

describe("fechamento mensal", () => {
  it("gera a fatura líquida de comissões, marca comissões como creditadas e é idempotente", async () => {
    const est = await estimateClosing(ctx.db, ctx.seed.supplierId, period(), true);
    expect(est.closing.commissionCreditCents).toBe(50_000 + 5_000);
    const r = await closeMonth(ctx.db, period());
    expect(r.closed).toBeGreaterThanOrEqual(1);
    const inv = await ctx.db.query.financeInvoices.findFirst({ where: eq(financeInvoices.dedupeKey, `CLOSE:${ctx.seed.supplierId}:${period()}`) });
    expect(inv?.amountCents).toBe(est.closing.netCents);
    expect(inv?.lines.reduce((s, l) => s + l.amountCents, 0)).toBe(est.closing.netCents);
    expect(inv?.lines.filter((l) => l.kind === "COMMISSION_CREDIT")).toHaveLength(2);
    const acqs = await ctx.db.select().from(storeAcquisitions);
    expect(acqs.every((a) => a.status === "CREDITED" && a.creditedInvoiceId === inv?.id)).toBe(true);
    const c = await ctx.db.query.supplierContracts.findFirst({ where: eq(supplierContracts.supplierId, ctx.seed.supplierId) });
    expect(c?.creditBalanceCents).toBe(est.closing.carryOutCents);
    const again = await closeMonth(ctx.db, period());
    expect(again.closed).toBe(0);
    expect((await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.kind, "SUPPLIER_CLOSING")))).toHaveLength(1);
  });

  it("fornecedor sem volume paga o piso mensal", async () => {
    const r = await createSupplier(ctx.db, { name: "Sem Volume", adminName: "Cris", adminEmail: "c@x.com" });
    await closeMonth(ctx.db, period());
    const inv = await ctx.db.query.financeInvoices.findFirst({ where: eq(financeInvoices.dedupeKey, `CLOSE:${r.supplierId}:${period()}`) });
    expect(inv?.amountCents).toBe(30_000);
    expect(inv?.lines.some((l) => l.kind === "MIN_FEE_TOPUP")).toBe(true);
  });
});

describe("loja adquirida pelo fornecedor", () => {
  it("loja própria nasce pendente com fatura de R$ 2.197 e comissão de R$ 500", async () => {
    const s = await createStore(ctx.db, ctx.seed.supplierId, { name: "Loja Nova Própria", ownerName: "Dono Novo", ownerEmail: "novo@loja.com", offer: "STORE_OWN" });
    expect(s).toMatchObject({ requiresPayment: true, setupCents: 200_000, commissionCents: 50_000 });
    const store = await ctx.db.query.stores.findFirst({ where: eq(stores.id, s.storeId) });
    expect(store).toMatchObject({ status: "PENDING_PAYMENT", offer: "STORE_OWN" });
    const inv = await ctx.db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, s.invoiceId!) });
    expect(inv?.amountCents).toBe(200_000 + 19_700);
    expect(inv?.payerType).toBe("STORE");
  });

  it("loja pendente não vende; depois do pagamento fica ativa e a comissão entra em garantia por 7 dias", async () => {
    const s = await createStore(ctx.db, ctx.seed.supplierId, { name: "Loja Aguarda", ownerName: "Dono", ownerEmail: "aguarda@loja.com", offer: "STORE_SUBDOMAIN" });
    await expect(createOrder(ctx.db, { storeId: s.storeId, customer, items: [{ productId: ctx.seed.productIds[11]!, variantId: v(11, "M"), quantity: 1 }] })).rejects.toThrow(/não está ativa/);
    const now = new Date();
    await markInvoicePaid(ctx.db, s.invoiceId!, now);
    expect((await ctx.db.query.stores.findFirst({ where: eq(stores.id, s.storeId) }))?.status).toBe("ACTIVE");
    const acq = await ctx.db.query.storeAcquisitions.findFirst({ where: eq(storeAcquisitions.storeId, s.storeId) });
    expect(acq?.status).toBe("GUARANTEE");
    expect(acq?.commissionCents).toBe(5_000);
    const days = Math.round((new Date(acq!.eligibleAt!).getTime() - now.getTime()) / 86_400_000);
    expect(days).toBe(7);
    await markInvoicePaid(ctx.db, s.invoiceId!, now);
    expect((await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.id, s.invoiceId!)))[0]?.status).toBe("PAID");
  });

  it("comissão em garantia não é abatida antes do prazo", async () => {
    const s = await createStore(ctx.db, ctx.seed.supplierId, { name: "Loja Recente", ownerName: "Dono", ownerEmail: "recente@loja.com", offer: "STORE_OWN" });
    // Pago no dia 28: os 7 dias de garantia terminam no mês seguinte, qualquer que seja a data do teste.
    const today = new Date();
    await markInvoicePaid(ctx.db, s.invoiceId!, new Date(today.getFullYear(), today.getMonth(), 28, 12));
    const est = await estimateClosing(ctx.db, ctx.seed.supplierId, period(), true);
    expect(est.closing.lines.filter((l) => l.kind === "COMMISSION_CREDIT")).toHaveLength(2);
    await closeMonth(ctx.db, period());
    expect((await ctx.db.query.storeAcquisitions.findFirst({ where: eq(storeAcquisitions.storeId, s.storeId) }))?.status).toBe("GUARANTEE");
  });

  it("estorno antes do crédito cancela a comissão; depois do crédito debita o saldo", async () => {
    const fresh = await createStore(ctx.db, ctx.seed.supplierId, { name: "Loja Estorno", ownerName: "Dono", ownerEmail: "estorno@loja.com", offer: "STORE_OWN" });
    await markInvoicePaid(ctx.db, fresh.invoiceId!);
    expect((await voidStoreSetup(ctx.db, fresh.storeId)).clawbackCents).toBe(0);
    expect((await ctx.db.query.storeAcquisitions.findFirst({ where: eq(storeAcquisitions.storeId, fresh.storeId) }))?.status).toBe("CANCELED");
    expect((await ctx.db.query.stores.findFirst({ where: eq(stores.id, fresh.storeId) }))?.status).toBe("SUSPENDED");

    await closeMonth(ctx.db, period());
    const before = (await ctx.db.query.supplierContracts.findFirst({ where: eq(supplierContracts.supplierId, ctx.seed.supplierId) }))!.creditBalanceCents;
    const credited = await ctx.db.query.storeAcquisitions.findFirst({ where: and(eq(storeAcquisitions.storeId, ctx.seed.stores.mantos.id)) });
    expect(credited?.status).toBe("CREDITED");
    const r = await voidStoreSetup(ctx.db, ctx.seed.stores.mantos.id);
    expect(r.clawbackCents).toBe(50_000);
    expect((await ctx.db.query.supplierContracts.findFirst({ where: eq(supplierContracts.supplierId, ctx.seed.supplierId) }))!.creditBalanceCents).toBe(before - 50_000);
  });
});

describe("bloqueio por inadimplência", () => {
  async function overdue(daysAgo: number) {
    await ctx.db.insert(financeInvoices).values({ id: "fin_test", dedupeKey: "TEST:overdue", payerType: "SUPPLIER", supplierId: ctx.seed.supplierId, kind: "SUPPLIER_CLOSING", period: "2026-01", description: "Fatura teste", amountCents: 100_000, lines: [], status: "OPEN", dueDate: new Date(Date.now() - daysAgo * 86_400_000).toISOString() });
    return refreshSupplierAccess(ctx.db);
  }
  const status = async () => (await ctx.db.query.suppliers.findFirst({ where: eq(suppliers.id, ctx.seed.supplierId) }))?.status;
  const place = () => createOrder(ctx.db, { storeId: ctx.seed.stores.mantos.id, customer, items: [{ productId: ctx.seed.productIds[11]!, variantId: v(11, "M"), quantity: 1 }], customerPaymentStatus: "PAID" });

  it("em dia: tudo liberado", async () => { expect(await status()).toBe("ACTIVE"); await expect(place()).resolves.toBeTruthy(); });

  it("5 dias de atraso: apenas aviso", async () => { await overdue(5); expect(await status()).toBe("WARNING"); await expect(place()).resolves.toBeTruthy(); });

  it("12 dias: bloqueio parcial impede pedidos novos mas mantém a expedição de pedidos pagos", async () => {
    const o = await place();
    await registerShippingLabel(ctx.db, ctx.actors.mantos, o.orderId, { code: "ME123456BR", carrier: "Melhor Envio" });
    await overdue(12);
    expect(await status()).toBe("PARTIAL_BLOCK");
    await expect(place()).rejects.toThrow(/novos pedidos/);
    await expect(advanceOrder(ctx.db, ctx.actors.supplier, o.orderId, "PICKING")).resolves.toBeTruthy();
    await expect(createStore(ctx.db, ctx.seed.supplierId, { name: "Bloqueada", ownerName: "Dono", ownerEmail: "b@l.com" })).rejects.toThrow(/bloqueadas/);
  });

  it("16 dias: suspenso bloqueia também a expedição; pagar a fatura restabelece o acesso", async () => {
    const o = await place();
    await registerShippingLabel(ctx.db, ctx.actors.mantos, o.orderId, { code: "ME123456BR", carrier: "Melhor Envio" });
    await overdue(16);
    expect(await status()).toBe("SUSPENDED");
    await expect(advanceOrder(ctx.db, ctx.actors.supplier, o.orderId, "PICKING")).rejects.toThrow(/Expedição indisponível/);
    await markInvoicePaid(ctx.db, "fin_test");
    expect(await status()).toBe("ACTIVE");
    await expect(advanceOrder(ctx.db, ctx.actors.supplier, o.orderId, "PICKING")).resolves.toBeTruthy();
  });

  it("31 dias: encerrado", async () => { await overdue(31); expect(await status()).toBe("CLOSED"); });
});

describe("visão geral do Master", () => {
  it("soma receita recorrente contratada, taxas do mês e comissões", async () => {
    const o = await financeOverview(ctx.db, period());
    expect(o.mrr.suppliers).toBe(0);
    expect(o.mrr.stores).toBe(19_700 + 9_700);
    expect(o.estimatedVolumeFees).toBeGreaterThanOrEqual(30_000);
    expect(o.commissions.guarantee).toBe(55_000);
    expect(o.perSupplier[0]?.waived).toBe(true);
  });
});

describe("rotina diária", () => {
  it("no dia 1 fecha o mês anterior e emite as mensalidades; repetir não duplica", async () => {
    const first = new Date(Date.UTC(2026, 10, 1, 3, 0, 0));
    const r1 = await runDailyFinanceJobs(ctx.db, first);
    expect(r1).toMatchObject({ period: "2026-11", closedPeriod: "2026-10" });
    expect(r1.closed).toBeGreaterThanOrEqual(1);
    const total = (await ctx.db.select().from(financeInvoices)).length;
    const r2 = await runDailyFinanceJobs(ctx.db, first);
    expect(r2.closed).toBe(0);
    expect(r2.subscriptionsIssued).toBe(0);
    expect((await ctx.db.select().from(financeInvoices)).length).toBe(total);
  });
  it("em dias comuns só atualiza atrasos e acesso", async () => {
    const mid = new Date(Date.UTC(2026, 10, 15, 3, 0, 0));
    const r = await runDailyFinanceJobs(ctx.db, mid);
    expect(r.closedPeriod).toBeNull();
    expect(r.closed).toBe(0);
  });
  it("a fatura vencida gera bloqueio automático pela rotina", async () => {
    await ctx.db.insert(financeInvoices).values({ id: "fin_cron", dedupeKey: "TEST:cron", payerType: "SUPPLIER", supplierId: ctx.seed.supplierId, kind: "SUPPLIER_CLOSING", period: "2026-01", description: "Teste", amountCents: 50_000, lines: [], status: "OPEN", dueDate: new Date(Date.now() - 12 * 86_400_000).toISOString() });
    const r = await runDailyFinanceJobs(ctx.db);
    expect(r.accessChanged).toBe(1);
    expect((await ctx.db.query.suppliers.findFirst({ where: eq(suppliers.id, ctx.seed.supplierId) }))?.status).toBe("PARTIAL_BLOCK");
  });
});
