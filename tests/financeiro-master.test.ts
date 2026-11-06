import { beforeEach, describe, expect, it } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import { freshDb } from "./setup";
import { catalogPriceVersions, corporateOrders, emailOutbox, entitlements, financeInvoices, gatewayTransactions, nlSubscriptions, orders, partnerCommissions, partnerLeads, partners, serviceDeliveries, stores } from "@/db/schema";
import { installmentPlan, quotePrice, type PriceRule } from "@/lib/finance/catalog-pricing";
import { addPriceVersion, getCatalogItem, listCatalog, setCatalogStatus, updateCatalogProduct } from "@/lib/domain/nl-catalog";
import { listFinancialAudit, recordFinancialAudit, CORPORATE } from "@/lib/domain/fin-audit";
import { checkOwnTransaction, createCorporateCheckout, handleGatewayEvent, listCorporateOrders, refundCorporateOrder, simulateCorporatePayment, syncTransaction } from "@/lib/domain/corporate-checkout";
import { choosePlan, ensureSubscriptionInvoice, runSubscriptionJobs, subscriptionOf } from "@/lib/domain/commerce-plans";
import { signupMember } from "@/lib/domain/store-access";
import { markInvoicePaid, storeOrderFeeFor } from "@/lib/domain/finance";
import { connectNextLevelMp } from "@/lib/domain/nextlevel-billing";
import { commissionBase, partnerStatement, resolveAttribution } from "@/lib/domain/corporate-commissions";
import { releaseCommissions } from "@/lib/domain/partners";
import { verifyWebhookAuth } from "@/lib/payments/pagarme";
import { chooseGateway } from "@/lib/payments/gateway";
import { hashPassword } from "@/lib/security/password";
import { users } from "@/db/schema";
import { newId } from "@/lib/ids";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); await ctx.db.update(users).set({ passwordHash: hashPassword("senha-master-1") }).where(eq(users.id, ctx.actors.master.userId)); });

/** Mensagem do erro do banco (o Drizzle embrulha a exceção do Postgres em `cause`). */
const dbError = (p: PromiseLike<unknown>) => Promise.resolve(p).then(() => "sem erro", (e: Error & { cause?: Error }) => String(e.cause?.message ?? e.message));
const rule = (p: Partial<PriceRule>): PriceRule => ({ id: "v", version: 1, cycle: "ONE_TIME", amountCents: 199_700, methods: ["PIX", "CARD"], pixDiscountBps: 1000, cardMaxInstallments: 10, cardMarkupBps: 1600, ...p });

describe("preço: Pix 10%, cartão 10x × 1,16, parceiro e anual", () => {
  it("Loja Pronta Essencial e Profissional: valores aprovados", () => {
    expect(quotePrice(rule({}), { method: "PIX" }).totalCents).toBe(179_730);
    const card = quotePrice(rule({}), { method: "CARD", installments: 10 });
    expect(card.totalCents).toBe(231_652);
    expect(card.installmentCents * 9 + card.lastInstallmentCents).toBe(231_652);
    expect(card.pixDiscountCents).toBe(0); // nunca Pix e acréscimo juntos
    expect(quotePrice(rule({ amountCents: 499_700 }), { method: "PIX" }).totalCents).toBe(449_730);
    expect(quotePrice(rule({ amountCents: 499_700 }), { method: "CARD", installments: 3 }).totalCents).toBe(579_652);
    expect(() => quotePrice(rule({}), { method: "CARD", installments: 11 })).toThrow(/até 10x/);
  });
  it("parcelas fecham o total exato", () => {
    expect(installmentPlan(1000, 3)).toEqual({ installmentCents: 334, lastInstallmentCents: 332 });
    expect(installmentPlan(1000, 1)).toEqual({ installmentCents: 1000, lastInstallmentCents: 1000 });
  });
  it("desconto do parceiro até 10%, não acumula com Pix nem com o anual", () => {
    expect(() => quotePrice(rule({}), { method: "PIX", partnerDiscountBps: 1500, partnerDiscountMaxBps: 1000 })).toThrow(/até 10%/);
    const pix = quotePrice(rule({ pixDiscountBps: 500 }), { method: "PIX", partnerDiscountBps: 1000, partnerDiscountMaxBps: 1000 });
    expect(pix).toMatchObject({ partnerDiscountCents: 19_970, pixDiscountCents: 0, totalCents: 179_730 });
    const annual = quotePrice(rule({ cycle: "ANNUAL", amountCents: 134_100, pixDiscountBps: 0, cardMarkupBps: 0, cardMaxInstallments: 1 }), { method: "PIX", partnerDiscountBps: 1000, partnerDiscountMaxBps: 1000 });
    expect(annual.totalCents).toBe(134_100);
    expect(annual.rule).toMatch(/não cumulativo/);
  });
  it("sob consulta não gera cobrança", () => {
    expect(() => quotePrice(rule({ cycle: "QUOTE", amountCents: null }), { method: "PIX" })).toThrow(/proposta/);
  });
});

describe("catálogo Master: semente, versões imutáveis, publicação e auditoria", () => {
  it("todos os planos e produtos aprovados com os preços certos", async () => {
    const items = await listCatalog(ctx.db);
    const by = (k: string) => items.find((i) => i.key === k)!;
    expect(by("COMMERCE_START").prices.MONTHLY?.amountCents).toBe(5_700); // D220: taxa zero e mensalidades novas
    expect(by("COMMERCE_START").prices.ANNUAL?.amountCents).toBe(44_400);
    expect(by("COMMERCE_START").prices.MONTHLY?.platformFeeBps).toBe(0);
    expect(by("COMMERCE_PRO").prices.ANNUAL?.amountCents).toBe(142_800);
    expect(by("COMMERCE_PRO").prices.MONTHLY?.platformFeeBps).toBe(0);
    expect(by("COMMERCE_SCALE").prices.MONTHLY?.amountCents).toBe(34_700);
    expect(by("COMMERCE_SCALE").prices.ANNUAL?.amountCents).toBe(356_400);
    expect(by("COMMERCE_SCALE").prices.MONTHLY?.platformFeeBps).toBe(0);
    expect(by("COMMERCE_ENTERPRISE").kind).toBe("quote_required");
    expect(by("LOJA_PRONTA_ESSENCIAL").prices.ONE_TIME).toMatchObject({ amountCents: 199_700, pixDiscountBps: 1000, cardMarkupBps: 1600, cardMaxInstallments: 10 });
    expect(by("LOJA_PRONTA_PROFISSIONAL").prices.ONE_TIME?.amountCents).toBe(499_700);
    expect(by("LOJA_PRONTA_PREMIUM").kind).toBe("quote_required");
    expect(by("MIGRACAO_LITE").prices.ONE_TIME?.amountCents).toBe(149_700);
    expect(by("MIGRACAO_PRO").prices.ONE_TIME?.amountCents).toBe(399_700);
    expect(by("MIGRACAO_SCALE").kind).toBe("quote_required");
    expect(by("WHITE_LABEL_PARCEIRO")).toMatchObject({ kind: "quote_required", meta: { setupCents: 2_500_000 } });
    expect(by("MKT_META_ADS").meta.mediaSpendPaidByClient).toBe(true);
    expect(items.filter((i) => i.family === "TEMA").every((t) => t.kind === "one_time")).toBe(true);
  });

  it("só o Master edita; preço novo exige senha e cria versão sem mexer na anterior", async () => {
    const p = (await getCatalogItem(ctx.db, { key: "MIGRACAO_LITE" }))!;
    await expect(updateCatalogProduct(ctx.db, ctx.actors.mantos, p.id, { tagline: "Hackeado pelo lojista" })).rejects.toThrow(/NextLevel/);
    await expect(addPriceVersion(ctx.db, ctx.actors.supplier, p.id, { cycle: "ONE_TIME", amountCents: 1, reason: "teste de invasão" }, "x")).rejects.toThrow();
    await expect(addPriceVersion(ctx.db, ctx.actors.master, p.id, { cycle: "ONE_TIME", amountCents: 159_700, reason: "Reajuste anual" }, "senha-errada")).rejects.toThrow(/senha/);
    const v = await addPriceVersion(ctx.db, ctx.actors.master, p.id, { cycle: "ONE_TIME", amountCents: 159_700, pixDiscountBps: 1000, cardMaxInstallments: 10, cardMarkupBps: 1600, reason: "Reajuste anual" }, "senha-master-1");
    expect(v.version).toBe(2);
    expect((await getCatalogItem(ctx.db, { key: "MIGRACAO_LITE" }))!.prices.ONE_TIME?.amountCents).toBe(159_700);
    // A versão anterior é imutável no banco.
    expect(await dbError(ctx.db.update(catalogPriceVersions).set({ amountCents: 1 }).where(eq(catalogPriceVersions.productId, p.id)))).toMatch(/só-inserção/);
    expect(await dbError(ctx.db.delete(catalogPriceVersions).where(eq(catalogPriceVersions.productId, p.id)))).toMatch(/só-inserção/);
    const audit = await listFinancialAudit(ctx.db, ctx.actors.master);
    expect(audit.some((a) => a.action === "PRICE_VERSION_CREATED" && a.domain === "nextlevel_corporate_finance")).toBe(true);
    await expect(listFinancialAudit(ctx.db, ctx.actors.mantos)).rejects.toThrow();
  });

  it("pausar impede compra nova mas não mexe no que já foi comprado; trilha é só-inserção", async () => {
    const p = (await getCatalogItem(ctx.db, { key: "MIGRACAO_LITE" }))!;
    const paid = await createCorporateCheckout(ctx.db, ctx.actors.mantos, { productKey: "MIGRACAO_LITE", method: "PIX", idempotencyKey: "k-pausa-0001" }, { demo: true, returnPath: "/merchant/services" });
    await simulateCorporatePayment(ctx.db, ctx.actors.mantos, paid.txId);
    await setCatalogStatus(ctx.db, ctx.actors.master, p.id, "PAUSED", "Fila de migrações cheia");
    await expect(createCorporateCheckout(ctx.db, ctx.actors.arena, { productKey: "MIGRACAO_LITE", method: "PIX", idempotencyKey: "k-pausa-0002" }, { demo: true, returnPath: "/x" })).rejects.toThrow(/não encontrado|não está disponível/);
    expect((await ctx.db.query.corporateOrders.findFirst({ where: eq(corporateOrders.id, paid.orderId) }))!.status).toBe("PAID");
    await recordFinancialAudit(ctx.db, null, { domain: CORPORATE, action: "X", entityType: "y" });
    expect(await dbError(ctx.db.execute(sql`delete from financial_audit_log`))).toMatch(/só-inserção/);
  });
});

describe("Commerce: oferta de entrada, planos, assinatura e taxa de plataforma", () => {
  const signup = (email: string, taxId: string, plan: "COMMERCE_START" | "COMMERCE_PRO" | "COMMERCE_SCALE" = "COMMERCE_START", cycle: "MONTHLY" | "ANNUAL" = "MONTHLY", now = new Date("2026-10-01T12:00:00Z")) =>
    signupMember(ctx.db, { storeName: `Loja ${email}`, ownerName: "Dona Teste", email, password: "senha-segura-1", taxId, brand: "NEXTLEVEL_COMMERCE", independent: true, plan, cycle }, now);

  it("3 dias grátis e depois o valor do plano, sem 1º mês de R$ 9,90 (D233); uma vez por CPF/CNPJ", async () => {
    const now = new Date("2026-10-01T12:00:00Z");
    const r = await signup("a@loja.com", "529.982.247-25");
    expect(r.trial).toBe(true);
    const store = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    expect(new Date(store.trialEndsAt!).toISOString()).toBe(new Date(now.getTime() + 3 * 86_400_000).toISOString());
    const inv = (await ensureSubscriptionInvoice(ctx.db, store, now))!;
    expect(inv.amountCents).toBe(5_700);
    expect((await ensureSubscriptionInvoice(ctx.db, store, now))!.invoiceId).toBe(inv.invoiceId); // não duplica
    await markInvoicePaid(ctx.db, inv.invoiceId, new Date("2026-10-02T12:00:00Z"));
    await markInvoicePaid(ctx.db, inv.invoiceId, new Date("2026-10-02T12:00:00Z")); // repetido: nada muda
    const paid = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    expect(new Date(paid.paidUntil!).toISOString()).toBe("2026-11-04T12:00:00.000Z"); // começa no fim do teste (4/out) + 1 mês
    expect((await subscriptionOf(ctx.db, r.storeId))!.status).toBe("active");
    const next = (await ensureSubscriptionInvoice(ctx.db, paid, new Date("2026-11-02T12:00:00Z")))!;
    expect(next.amountCents).toBe(5_700);
    // Mesmo CPF em outra loja: sem teste.
    const again = await signup("b@loja.com", "529.982.247-25");
    expect(again.trial).toBe(false);
    const s2 = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, again.storeId) }))!;
    expect((await ensureSubscriptionInvoice(ctx.db, s2, now))!.amountCents).toBe(5_700);
  });

  it("anual: R$ 444 (Start, D220) em uma fatura que libera 12 meses", async () => {
    const r = await signup("c@loja.com", "111.444.777-35", "COMMERCE_START", "ANNUAL");
    const store = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    const inv = (await ensureSubscriptionInvoice(ctx.db, store))!;
    expect(inv.amountCents).toBe(44_400);
    await markInvoicePaid(ctx.db, inv.invoiceId, new Date("2026-10-02T12:00:00Z"));
    expect(new Date((await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!.paidUntil!).toISOString()).toBe("2027-10-04T12:00:00.000Z");
  });

  it("taxa zero sobre as vendas com Mercado Pago, antes e depois da carência (D220)", async () => {
    const r = await signup("d@loja.com", "390.533.447-05", "COMMERCE_PRO");
    const mk = async (createdAt: string, subtotal: number) => ctx.db.insert(orders).values({ id: newId("ord"), number: Math.floor(Math.random() * 1e6), storeId: r.storeId, customerName: "Cli", customerEmail: "cli@x.com", subtotalCents: subtotal, totalCents: subtotal, costTotalCents: 0, customerPaymentStatus: "PAID", paymentProvider: "MERCADO_PAGO", createdAt } as never);
    await mk("2026-12-15T12:00:00Z", 100_000); // dentro da carência (até 1/jan)
    await mk("2027-01-10T12:00:00Z", 100_000);
    expect((await storeOrderFeeFor(ctx.db, r.storeId, "2026-12")).feeCents).toBe(0);
    expect((await storeOrderFeeFor(ctx.db, r.storeId, "2027-01"))).toMatchObject({ feeCents: 0, bps: 0 });
  });

  it("troca de plano refaz a fatura aberta; ciclo da rotina: teste → aguardando → expirada", async () => {
    const r = await signup("e@loja.com", "153.509.460-56");
    const store = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    const owner = (await ctx.db.query.users.findFirst({ where: eq(users.storeId, r.storeId) }))!;
    const actor = { userId: owner.id, role: "STORE_OWNER" as const, organizationId: owner.organizationId, supplierId: null, storeId: r.storeId };
    const first = (await ensureSubscriptionInvoice(ctx.db, store))!;
    // Fora da Black (D229): na Black o anual sairia com 2 meses grátis (coberto em campanha-black.test.ts).
    await choosePlan(ctx.db, actor, { productKey: "COMMERCE_SCALE", cycle: "ANNUAL" }, new Date("2026-10-02T12:00:00Z"));
    expect((await ctx.db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, first.invoiceId) }))!.status).toBe("CANCELED");
    expect((await ensureSubscriptionInvoice(ctx.db, store))!.amountCents).toBe(356_400);
    await runSubscriptionJobs(ctx.db, new Date("2026-10-05T12:00:00Z"));
    expect((await subscriptionOf(ctx.db, r.storeId))!.status).toBe("pending_payment");
    await expect(choosePlan(ctx.db, ctx.actors.mantos, { productKey: "COMMERCE_PRO", cycle: "MONTHLY" })).rejects.toThrow(/Commerce/); // loja SuperDrop
  });
});

describe("checkout rápido: idempotência, liberação só após confirmação, reembolso", () => {
  it("mesma chave devolve o mesmo pedido; tema liberado só depois do pagamento", async () => {
    const a = await createCorporateCheckout(ctx.db, ctx.actors.mantos, { productKey: "TEMA_ATELIER", method: "PIX", idempotencyKey: "k-tema-0001" }, { demo: true, returnPath: "/merchant/services" });
    const b = await createCorporateCheckout(ctx.db, ctx.actors.mantos, { productKey: "TEMA_ATELIER", method: "PIX", idempotencyKey: "k-tema-0001" }, { demo: true, returnPath: "/merchant/services" });
    expect(b.orderId).toBe(a.orderId);
    expect((await ctx.db.select().from(corporateOrders)).length).toBe(1);
    const ent = () => ctx.db.select().from(entitlements).where(and(eq(entitlements.storeId, ctx.seed.stores.mantos.id), eq(entitlements.key, "THEME_ATELIER")));
    expect((await ent()).length).toBe(0);
    await simulateCorporatePayment(ctx.db, ctx.actors.mantos, a.txId);
    await simulateCorporatePayment(ctx.db, ctx.actors.mantos, a.txId); // repetido
    expect((await ent()).length).toBe(1);
    expect((await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "NL_CORPORATE_PAID"))).length).toBe(1);
    // Outra loja não enxerga o pedido.
    await expect(checkOwnTransaction(ctx.db, ctx.actors.arena, a.txId)).rejects.toThrow();
    await expect(listCorporateOrders(ctx.db, ctx.actors.mantos)).rejects.toThrow();
    // Reembolso (Master, com senha): revoga o tema.
    await expect(refundCorporateOrder(ctx.db, ctx.actors.master, a.orderId, { password: "errada", reason: "Cliente desistiu" })).rejects.toThrow(/senha/);
    await refundCorporateOrder(ctx.db, ctx.actors.master, a.orderId, { password: "senha-master-1", reason: "Cliente desistiu" });
    expect((await ent()).length).toBe(0);
  });

  it("serviço vira entrega com prazo e checklist; sob consulta e plano não passam pelo checkout", async () => {
    const r = await createCorporateCheckout(ctx.db, ctx.actors.mantos, { productKey: "LOJA_PRONTA_ESSENCIAL", method: "CARD", installments: 10, idempotencyKey: "k-lp-000001" }, { demo: true, returnPath: "/x" });
    expect(r.totalCents).toBe(231_652);
    await simulateCorporatePayment(ctx.db, ctx.actors.mantos, r.txId);
    const d = await ctx.db.select().from(serviceDeliveries).where(eq(serviceDeliveries.orderId, r.orderId));
    expect(d).toHaveLength(1);
    expect(d[0]!.checklist.at(-1)!.label).toMatch(/Aceite/);
    await expect(createCorporateCheckout(ctx.db, ctx.actors.mantos, { productKey: "LOJA_PRONTA_PREMIUM", method: "PIX", idempotencyKey: "k-prem-00001" }, { demo: true, returnPath: "/x" })).rejects.toThrow(/proposta/);
    await expect(createCorporateCheckout(ctx.db, ctx.actors.mantos, { productKey: "COMMERCE_START", method: "PIX", idempotencyKey: "k-plan-00001" }, { demo: true, returnPath: "/x" })).rejects.toThrow(/assinatura/);
  });
});

describe("gateways: Mercado Pago (padrão) e Pagar.me com webhooks válidos, inválidos, duplicados e fora de ordem", () => {
  const mp = (state: { status: string; amount: number; ref?: string; next?: number }) => (async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.endsWith("/users/me")) return new Response(JSON.stringify({ id: 1, nickname: "NEXTLEVEL" }), { status: 200 });
    if (init?.method === "POST" && u.endsWith("/v1/payments")) { const b = JSON.parse(String(init.body)); state.ref = b.external_reference; state.amount = b.transaction_amount; state.next = (state.next ?? 776) + 1; return new Response(JSON.stringify({ id: state.next, point_of_interaction: { transaction_data: { qr_code: "PIXMP", qr_code_base64: "" } } }), { status: 201 }); }
    if (/\/v1\/payments\/77\d$/.test(u)) return new Response(JSON.stringify({ id: 777, status: state.status, external_reference: state.ref, transaction_amount: state.amount, fee_details: [{ amount: 1.5 }], transaction_details: { net_received_amount: state.amount - 1.5 } }), { status: 200 });
    return new Response("{}", { status: 404 });
  }) as never;

  it("Mercado Pago: pendente não libera; webhook duplicado não processa duas vezes; aprovado libera uma vez", async () => {
    const state = { status: "pending", amount: 0 } as { status: string; amount: number; ref?: string };
    const f = mp(state);
    await connectNextLevelMp(ctx.db, ctx.actors.master, "TEST-1234567890abcdefghij", f);
    expect(await chooseGateway(ctx.db, null)).toBe("MERCADOPAGO");
    const c = await createCorporateCheckout(ctx.db, ctx.actors.mantos, { productKey: "TEMA_ARENA", method: "PIX", idempotencyKey: "k-mp-000001" }, { returnPath: "/x", fetchImpl: f });
    expect(c.pixCode).toBe("PIXMP");
    expect(state.ref).toBe(c.txId);
    expect((await syncTransaction(ctx.db, c.txId, f)).status).toBe("PENDING");
    state.status = "approved";
    const ev = { gateway: "MERCADOPAGO" as const, eventKey: "mp:evt-1", type: "payment.updated", txId: c.txId, externalId: "777" };
    expect((await handleGatewayEvent(ctx.db, ev, f)).result).toBe("PROCESSED");
    expect((await handleGatewayEvent(ctx.db, ev, f)).result).toBe("IGNORED");
    const tx = (await ctx.db.query.gatewayTransactions.findFirst({ where: eq(gatewayTransactions.id, c.txId) }))!;
    expect(tx).toMatchObject({ status: "PAID", feeCents: 150 });
    // Evento atrasado de "pendente" depois do pago não volta o estado.
    state.status = "pending";
    await handleGatewayEvent(ctx.db, { ...ev, eventKey: "mp:evt-0-atrasado" }, f);
    expect((await ctx.db.query.gatewayTransactions.findFirst({ where: eq(gatewayTransactions.id, c.txId) }))!.status).toBe("PAID");
    // Pagamento de outra referência é recusado.
    state.status = "approved"; state.ref = "gtx_outro";
    const c2 = await createCorporateCheckout(ctx.db, ctx.actors.arena, { productKey: "TEMA_ARENA", method: "PIX", idempotencyKey: "k-mp-000002" }, { returnPath: "/x", fetchImpl: f });
    state.ref = "gtx_outro";
    await expect(syncTransaction(ctx.db, c2.txId, f)).rejects.toThrow(/não pertence/);
  });

  it("Pagar.me: autenticação do webhook e confirmação pela API", async () => {
    const env = { PAGARME_WEBHOOK_USER: "nl", PAGARME_WEBHOOK_PASSWORD: "segredo-forte" };
    expect(verifyWebhookAuth(`Basic ${Buffer.from("nl:segredo-forte").toString("base64")}`, env)).toBe(true);
    expect(verifyWebhookAuth(`Basic ${Buffer.from("nl:errado").toString("base64")}`, env)).toBe(false);
    expect(verifyWebhookAuth(null, env)).toBe(false);
    expect(verifyWebhookAuth(`Basic ${Buffer.from("nl:segredo-forte").toString("base64")}`, {})).toBe(false); // sem configuração: recusa
    process.env.PAGARME_SECRET_KEY = "sk_test_abc123"; process.env.FIN_PAGARME = "true";
    try {
      expect(await chooseGateway(ctx.db, "PAGARME")).toBe("PAGARME");
      const state = { status: "pending" } as { status: string; code?: string; amount?: number };
      const f = (async (url: string, init?: RequestInit) => {
        const u = String(url);
        if (init?.method === "POST" && u.endsWith("/orders")) { const b = JSON.parse(String(init.body)); state.code = b.code; state.amount = b.items[0].amount; expect((init.headers as Record<string, string>)["Idempotency-Key"]).toBeTruthy(); return new Response(JSON.stringify({ id: "or_abc", status: "pending", amount: b.items[0].amount, charges: [{ id: "ch_1", status: "pending", amount: b.items[0].amount, last_transaction: { qr_code: "PIXPG" } }] }), { status: 200 }); }
        if (u.endsWith("/orders/or_abc")) return new Response(JSON.stringify({ id: "or_abc", code: state.code, status: state.status, amount: state.amount, charges: [{ id: "ch_1", status: state.status, amount: state.amount, paid_amount: state.status === "paid" ? state.amount : 0 }] }), { status: 200 });
        return new Response("{}", { status: 404 });
      }) as never;
      const { getCatalogItem: get } = await import("@/lib/domain/nl-catalog");
      const p = (await get(ctx.db, { key: "TEMA_PODIO" }))!;
      await updateCatalogProduct(ctx.db, ctx.actors.master, p.id, { gateway: "PAGARME" });
      const c = await createCorporateCheckout(ctx.db, ctx.actors.mantos, { productKey: "TEMA_PODIO", method: "PIX", idempotencyKey: "k-pg-000001" }, { returnPath: "/x", fetchImpl: f });
      expect(c).toMatchObject({ gateway: "PAGARME", pixCode: "PIXPG" });
      state.status = "paid";
      expect((await handleGatewayEvent(ctx.db, { gateway: "PAGARME", eventKey: "pg:hook_1", type: "order.paid", txId: c.txId, externalId: "or_abc" }, f)).status).toBe("PAID");
      expect((await handleGatewayEvent(ctx.db, { gateway: "PAGARME", eventKey: "pg:hook_1", type: "order.paid", txId: c.txId, externalId: "or_abc" }, f)).result).toBe("IGNORED");
      // Evento de um gateway para cobrança de outro é rejeitado.
      expect((await handleGatewayEvent(ctx.db, { gateway: "MERCADOPAGO", eventKey: "mp:cruzado", type: "payment", txId: c.txId, externalId: null }, f)).result).toBe("REJECTED");
    } finally { delete process.env.PAGARME_SECRET_KEY; delete process.env.FIN_PAGARME; }
  });
});

describe("parceiros: atribuição, autoindicação, carência, estorno e extrato próprio", () => {
  async function partner(code: string, taxId: string, email: string) {
    const { registerPartner } = await import("@/lib/domain/partners");
    const r = await registerPartner(ctx.db, { name: `Parceiro ${code}`, email, phone: "11988887777", taxId, password: "senha-parceiro-1", acceptTerms: true } as never);
    const p = (await ctx.db.query.partners.findFirst({ where: eq(partners.userId, r.userId) }))!;
    await ctx.db.update(partners).set({ code }).where(eq(partners.id, p.id));
    return { ...p, code, actor: { userId: r.userId, role: "AFFILIATE" as const, organizationId: "", supplierId: null, storeId: null } };
  }

  it("comissão de 20% no tema sobre a base líquida, em carência de 14 dias, e estorno anula", async () => {
    const p = await partner("ANA", "52998224725", "ana@parceira.com");
    const c = await createCorporateCheckout(ctx.db, ctx.actors.mantos, { productKey: "TEMA_ATELIER", method: "PIX", idempotencyKey: "k-com-00001", refCode: "ANA" }, { demo: true, returnPath: "/x" });
    await simulateCorporatePayment(ctx.db, ctx.actors.mantos, c.txId);
    const rows = await ctx.db.select().from(partnerCommissions).where(eq(partnerCommissions.orderId, c.orderId));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "SALE", rateBps: 2000, status: "PENDING", amountCents: Math.round(c.totalCents * 0.2) });
    expect(commissionBase(10_000, 300, 600)).toBe(9_100);
    const st = await partnerStatement(ctx.db, p.actor);
    expect(st.totals.em_carencia).toBe(rows[0]!.amountCents);
    await expect(partnerStatement(ctx.db, ctx.actors.mantos)).rejects.toThrow();
    await refundCorporateOrder(ctx.db, ctx.actors.master, c.orderId, { password: "senha-master-1", reason: "Arrependimento" });
    expect((await ctx.db.select().from(partnerCommissions).where(eq(partnerCommissions.orderId, c.orderId)))[0]!.status).toBe("VOID");
  });

  it("liberada depois da carência; estorno depois de liberada vira débito", async () => {
    await partner("BIA", "11144477735", "bia@parceira.com");
    const c = await createCorporateCheckout(ctx.db, ctx.actors.mantos, { productKey: "MIGRACAO_LITE", method: "PIX", idempotencyKey: "k-com-00002", refCode: "BIA" }, { demo: true, returnPath: "/x" });
    await simulateCorporatePayment(ctx.db, ctx.actors.mantos, c.txId);
    await releaseCommissions(ctx.db, new Date(Date.now() + 29 * 86_400_000));
    expect((await ctx.db.select().from(partnerCommissions).where(eq(partnerCommissions.orderId, c.orderId)))[0]!.status).toBe("PENDING"); // serviço: 30 dias
    await releaseCommissions(ctx.db, new Date(Date.now() + 31 * 86_400_000));
    await refundCorporateOrder(ctx.db, ctx.actors.master, c.orderId, { password: "senha-master-1", reason: "Chargeback simulado" });
    const all = await ctx.db.select().from(partnerCommissions).where(eq(partnerCommissions.orderId, c.orderId));
    expect(all.map((r) => r.kind).sort()).toEqual(["CLAWBACK", "SALE"]);
    expect(all.reduce((s, r) => s + r.amountCents, 0)).toBe(0);
  });

  it("autoindicação não comissiona; lead registrado por um parceiro tem prioridade sobre o link de outro", async () => {
    const a = await partner("CAIO", "39053344705", "caio@parceiro.com");
    const b = await partner("DUDA", "15350946056", "duda@parceira.com");
    const self = await resolveAttribution(ctx.db, { buyerEmail: "caio@parceiro.com", refCode: "CAIO" });
    expect(self).toMatchObject({ partnerId: a.id, flagged: true });
    await ctx.db.insert(partnerLeads).values({ id: newId("pld"), partnerId: b.id, name: "Cliente", email: "cliente@empresa.com" });
    expect(await resolveAttribution(ctx.db, { buyerEmail: "cliente@empresa.com", refCode: "CAIO" })).toMatchObject({ partnerId: b.id, via: "LEAD", flagged: false });
    // Lead duplicado por outro parceiro é recusado pelo banco.
    await expect(ctx.db.insert(partnerLeads).values({ id: newId("pld"), partnerId: a.id, name: "Cliente", email: "cliente@empresa.com" })).rejects.toThrow();
  });

  it("assinatura Commerce comissiona o percentual do nível em toda mensalidade (D260; 15% no CPF, D263), sem Black, pela regra e não pela manutenção antiga", async () => {
    const p = await partner("EVA", "52998224725", "eva@parceira.com");
    const r = await signupMember(ctx.db, { storeName: "Loja Eva", ownerName: "Cliente Eva", email: "cli@eva.com", password: "senha-segura-1", taxId: "111.444.777-35", brand: "NEXTLEVEL_COMMERCE", independent: true, plan: "COMMERCE_START", ref: "EVA" });
    const store = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    expect(store.partnerId).toBe(p.id);
    const i1 = (await ensureSubscriptionInvoice(ctx.db, store))!;
    await markInvoicePaid(ctx.db, i1.invoiceId);
    const i2 = (await ensureSubscriptionInvoice(ctx.db, (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!))!;
    await markInvoicePaid(ctx.db, i2.invoiceId);
    const rows = await ctx.db.select().from(partnerCommissions).where(eq(partnerCommissions.partnerId, p.id));
    // EVA se cadastrou com CPF: Programa de Indicações (D263), 15% de toda mensalidade.
    expect(rows.map((x) => [x.kind, x.rateBps, x.amountCents])).toEqual(expect.arrayContaining([["SALE", 1500, 855], ["RECURRING", 1500, 855]]));
    expect(rows.some((x) => x.kind === "MAINTENANCE")).toBe(false);
    // Agência (D260): a mesma regra de todos.
    const { findRule } = await import("@/lib/domain/corporate-commissions");
    expect(await findRule(ctx.db, { family: "COMMERCE_PLAN", productKey: "COMMERCE_PRO", cycle: "MONTHLY", partnerKind: "AGENCY" })).toMatchObject({ firstBps: 2000, recurringBps: 2000 });
    expect((await ctx.db.select().from(nlSubscriptions)).length).toBe(1);
  });
});
