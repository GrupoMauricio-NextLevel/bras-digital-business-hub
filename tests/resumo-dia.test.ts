import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb, customer } from "./setup";
import { emailOutbox, financeInvoices, orders } from "@/db/schema";
import { buildDailySummary, renderSummary, sendDailySummary, summaryForMaster } from "@/lib/domain/daily-summary";
import { createOrder } from "@/lib/domain/orders";
import { recordError } from "@/lib/domain/error-log";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
const v = () => ctx.seed.variantsByProduct.get(ctx.seed.productIds[11]!)![0]!.id;

describe("Resumo do dia", () => {
  it("conta só vendas pagas das últimas 24 h, ignora pendentes e antigas, e destaca o que precisa de atenção", async () => {
    const mk = (paid: boolean) => createOrder(ctx.db, { storeId: ctx.seed.stores.mantos.id, customer, items: [{ productId: ctx.seed.productIds[11]!, variantId: v(), quantity: 1 }], customerPaymentStatus: paid ? "PAID" : "PENDING" });
    const base = await buildDailySummary(ctx.db);
    const a = await mk(true); await mk(false);
    const old = await mk(true);
    await ctx.db.update(orders).set({ createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString() }).where(eq(orders.id, old.orderId));
    await recordError(ctx.db, { origin: "SERVER", route: "/x", message: "falha qualquer" });
    const s = await buildDailySummary(ctx.db);
    expect(s.sales.orders - base.sales.orders).toBe(1); // só a paga e recente; a pendente e a de 3 dias atrás ficam de fora
    expect(s.sales.cents).toBeGreaterThan(base.sales.cents);
    expect(s.errors).toEqual({ open: 1, new24h: 1 });
    expect(s.lateJobs.length).toBe(2); // nenhuma rotina rodou ainda
    const m = renderSummary(s);
    expect(m.attention.length).toBeGreaterThanOrEqual(2);
    expect(m.subject).toMatch(/ponto\(s\) de atenção/);
    expect(m.text).not.toMatch(/@|Cliente Teste/); // sem dado de cliente
    void a;
  });

  it("fatura vencida entra no resumo; só o Master consulta; envio é uma vez por dia e por pessoa", async () => {
    const [inv] = await ctx.db.select().from(financeInvoices).limit(1);
    if (inv) await ctx.db.update(financeInvoices).set({ status: "OVERDUE" }).where(eq(financeInvoices.id, inv.id));
    const s = await buildDailySummary(ctx.db);
    if (inv) expect(s.overdueInvoices.count).toBeGreaterThanOrEqual(1);
    await expect(summaryForMaster(ctx.db, ctx.actors.mantos)).rejects.toThrow();
    const first = await sendDailySummary(ctx.db);
    expect(first.recipients).toBeGreaterThanOrEqual(1);
    const again = await sendDailySummary(ctx.db);
    expect(again.recipients).toBe(0);
    expect((await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "DAILY_SUMMARY"))).length).toBe(first.recipients);
  });
});
