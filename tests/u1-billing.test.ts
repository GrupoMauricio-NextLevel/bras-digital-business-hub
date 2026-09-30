import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { financeInvoices, domainEvents, activities } from "@/db/schema";
import { buyAddon, chargeInvoice, connectNextLevelMp, fulfillPaidInvoice, listInvoicesFor, syncNextLevelPayment } from "@/lib/domain/nextlevel-billing";
import { activeEntitlementKeys, grantEntitlement, hasEntitlement, requireEntitlement } from "@/lib/domain/entitlements";
import { runDunningNotices } from "@/lib/domain/finance";
import { DEFAULT_PRICE_BOOK } from "@/lib/finance/price-book";
import { buildRationale, marginAlerts, storeEconomics, supplierEconomics } from "@/lib/finance/rationale";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

const store = () => ({ type: "STORE" as const, storeId: ctx.seed.stores.mantos.id });
const fakeMp = (state: { status: string; amount: number; ref?: string }) => (async (url: string, init?: RequestInit) => {
  const u = String(url);
  if (u.endsWith("/users/me")) return new Response(JSON.stringify({ id: 1, nickname: "NEXTLEVEL" }), { status: 200 });
  if (init?.method === "POST" && u.endsWith("/v1/payments")) { const b = JSON.parse(String(init.body)); state.ref = b.external_reference; state.amount = b.transaction_amount; return new Response(JSON.stringify({ id: 555, point_of_interaction: { transaction_data: { qr_code: "PIXNL", qr_code_base64: "QQ==" } } }), { status: 201 }); }
  if (u.endsWith("/v1/payments/555")) return new Response(JSON.stringify({ id: 555, status: state.status, external_reference: state.ref, transaction_amount: state.amount }), { status: 200 });
  return new Response("{}", { status: 404 });
}) as never;

describe("entitlements", () => {
  it("concede, expira e renova somando o período", async () => {
    const now = new Date("2026-01-10T12:00:00Z");
    await grantEntitlement(ctx.db, store(), { key: "ACADEMY_STORE", source: "ADD_ON", months: 1, now });
    expect(await hasEntitlement(ctx.db, store(), "ACADEMY_STORE", new Date("2026-02-01T00:00:00Z"))).toBe(true);
    expect(await hasEntitlement(ctx.db, store(), "ACADEMY_STORE", new Date("2026-02-11T00:00:00Z"))).toBe(false);
    await grantEntitlement(ctx.db, store(), { key: "ACADEMY_STORE", source: "ADD_ON", months: 1, now: new Date("2026-02-05T00:00:00Z") });
    expect(await hasEntitlement(ctx.db, store(), "ACADEMY_STORE", new Date("2026-03-01T00:00:00Z"))).toBe(true); // 10/fev + 1 mês
  });
  it("isolamento entre lojas e requireEntitlement explica o bloqueio", async () => {
    await grantEntitlement(ctx.db, store(), { key: "PREMIUM_SUPPORT", source: "COURTESY", months: 3 });
    expect((await activeEntitlementKeys(ctx.db, { type: "STORE", storeId: ctx.seed.stores.arena.id })).size).toBe(0);
    await expect(requireEntitlement(ctx.db, { type: "STORE", storeId: ctx.seed.stores.arena.id }, "PREMIUM_SUPPORT", "Suporte Premium")).rejects.toThrow(/add-on/);
  });
});

describe("cobrança NextLevel no Mercado Pago", () => {
  it("só o master conecta; token inválido é recusado", async () => {
    await expect(connectNextLevelMp(ctx.db, ctx.actors.mantos, "TEST-1234567890abcdefghij", fakeMp({ status: "x", amount: 0 }))).rejects.toThrow();
    await expect(connectNextLevelMp(ctx.db, ctx.actors.master, "invalido-1234567890abcdefgh")).rejects.toThrow(/começar com/);
    await expect(connectNextLevelMp(ctx.db, ctx.actors.master, "TEST-1234567890abcdefghij", fakeMp({ status: "x", amount: 0 }))).resolves.toMatchObject({ nickname: "NEXTLEVEL" });
  });

  it("compra de add-on: fatura, Pix, aprovação idempotente e direito liberado", async () => {
    const state = { status: "pending", amount: 0 } as { status: string; amount: number; ref?: string };
    const f = fakeMp(state);
    await connectNextLevelMp(ctx.db, ctx.actors.master, "TEST-1234567890abcdefghij", f);
    const { invoiceId, amountCents } = await buyAddon(ctx.db, ctx.actors.mantos, "ACADEMY_STORE", "MONTHLY");
    expect(amountCents).toBe(DEFAULT_PRICE_BOOK.addons.ACADEMY_STORE.monthlyCents);
    expect((await buyAddon(ctx.db, ctx.actors.mantos, "ACADEMY_STORE", "MONTHLY")).invoiceId).toBe(invoiceId); // não duplica
    const pix = await chargeInvoice(ctx.db, ctx.actors.mantos, invoiceId, { fetchImpl: f });
    expect(pix.pixCode).toBe("PIXNL");
    expect((await chargeInvoice(ctx.db, ctx.actors.mantos, invoiceId, { fetchImpl: f })).id).toBe(pix.id); // reaproveita Pix válido
    expect((await syncNextLevelPayment(ctx.db, pix.id, f)).paid).toBe(false);
    expect(await hasEntitlement(ctx.db, store(), "ACADEMY_STORE")).toBe(false);
    state.status = "approved";
    expect((await syncNextLevelPayment(ctx.db, pix.id, f)).paid).toBe(true);
    await syncNextLevelPayment(ctx.db, pix.id, f);
    const inv = await ctx.db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, invoiceId) });
    expect(inv?.status).toBe("PAID");
    await fulfillPaidInvoice(ctx.db, inv!); // repetir não estende de novo
    expect(await hasEntitlement(ctx.db, store(), "ACADEMY_STORE")).toBe(true);
    const events = await ctx.db.select().from(domainEvents);
    expect(events.filter((e) => e.type === "ADDON_ACTIVATED")).toHaveLength(1);
    expect(events.filter((e) => e.type === "INVOICE_PAID")).toHaveLength(1);
  });

  it("sem conta da NextLevel conectada a cobrança falha com mensagem clara", async () => {
    const { invoiceId } = await buyAddon(ctx.db, ctx.actors.mantos, "ADVANCED_REPORTS", "MONTHLY");
    await expect(chargeInvoice(ctx.db, ctx.actors.mantos, invoiceId)).rejects.toThrow(/conta de recebimento/);
  });

  it("valor pago menor é recusado; fatura de outro tenant é inacessível", async () => {
    const state = { status: "approved", amount: 0 } as { status: string; amount: number; ref?: string };
    const f = fakeMp(state);
    await connectNextLevelMp(ctx.db, ctx.actors.master, "TEST-1234567890abcdefghij", f);
    const { invoiceId } = await buyAddon(ctx.db, ctx.actors.mantos, "ACADEMY_STORE", "ANNUAL");
    await expect(chargeInvoice(ctx.db, ctx.actors.arena, invoiceId, { fetchImpl: f })).rejects.toThrow(/não permitido/);
    const pix = await chargeInvoice(ctx.db, ctx.actors.mantos, invoiceId, { fetchImpl: f });
    state.amount = 1;
    await expect(syncNextLevelPayment(ctx.db, pix.id, f)).rejects.toThrow(/menor/);
    expect((await listInvoicesFor(ctx.db, ctx.actors.arena)).some((i) => i.id === invoiceId)).toBe(false);
  });

  it("add-on de fornecedor não é vendido ao lojista e vice-versa", async () => {
    await expect(buyAddon(ctx.db, ctx.actors.mantos, "EXTRA_DISPATCH_SEAT", "MONTHLY")).rejects.toThrow(/perfil/);
    await expect(buyAddon(ctx.db, ctx.actors.supplier, "ACADEMY_STORE", "MONTHLY")).rejects.toThrow(/perfil/);
    await expect(buyAddon(ctx.db, ctx.actors.supplier, "EXTRA_DISPATCH_SEAT", "MONTHLY")).resolves.toBeTruthy();
    await expect(buyAddon(ctx.db, ctx.actors.mantos, "NAO_EXISTE", "MONTHLY")).rejects.toThrow(/não encontrado/);
  });
});

describe("régua de cobrança", () => {
  it("avisa em D-3, D0, D+3 e D+7, uma vez por marco", async () => {
    const { invoiceId } = await buyAddon(ctx.db, ctx.actors.mantos, "ACADEMY_STORE", "MONTHLY");
    const inv = (await ctx.db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, invoiceId) }))!;
    const due = new Date(inv.dueDate);
    const at = (d: number) => new Date(due.getTime() + d * 86_400_000 + 3_600_000);
    const before = (await ctx.db.select().from(activities).where(eq(activities.type, "DUNNING"))).length;
    expect((await runDunningNotices(ctx.db, at(-3))).notices).toBeGreaterThanOrEqual(1);
    expect((await runDunningNotices(ctx.db, at(-3))).notices).toBe(0);
    expect((await runDunningNotices(ctx.db, at(-1))).notices).toBe(0);
    await runDunningNotices(ctx.db, at(0)); await runDunningNotices(ctx.db, at(3)); await runDunningNotices(ctx.db, at(7));
    const own = (await ctx.db.select().from(domainEvents)).filter((e) => e.type === "DUNNING_NOTICE" && (e.payload as { invoiceId: string }).invoiceId === invoiceId);
    expect(own).toHaveLength(4);
    expect((await ctx.db.select().from(activities).where(eq(activities.type, "DUNNING"))).length).toBeGreaterThan(before);
  });
});

describe("racional de preços", () => {
  it("todo item tem cobre/entrega/âncora e o texto usa os valores vigentes", () => {
    const r = buildRationale(DEFAULT_PRICE_BOOK);
    expect(r.length).toBeGreaterThanOrEqual(3 + 3 + 2 + 4);
    for (const x of r) { expect(x.covers.length).toBeGreaterThan(10); expect(x.delivers.length).toBeGreaterThan(5); expect(x.anchor.length).toBeGreaterThan(10); }
    expect(r.find((x) => x.key === "fee:volume")!.perOrder).toContain("R$ 4,50");
    const changed = structuredClone(DEFAULT_PRICE_BOOK); changed.superdrop.volumeFeeBps = 500;
    expect(buildRationale(changed).find((x) => x.key === "fee:volume")!.price).toContain("5%");
  });
  it("margem por perfil é coerente e o alerta dispara quando abaixo da meta", () => {
    const e = storeEconomics(DEFAULT_PRICE_BOOK, "STORE_SUBDOMAIN");
    expect(e.marginCents).toBe(e.revenueCents - e.costCents);
    expect(supplierEconomics(DEFAULT_PRICE_BOOK, "GROWTH").marginBps).toBeGreaterThan(0);
    expect(marginAlerts(DEFAULT_PRICE_BOOK)).toEqual([]);
    const cheap = structuredClone(DEFAULT_PRICE_BOOK); cheap.offers.DROP_MANUAL.monthlyCents = 1_500;
    expect(marginAlerts(cheap).map((a) => a.key)).toContain("offer:DROP_MANUAL");
  });
});
