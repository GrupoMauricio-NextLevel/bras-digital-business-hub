import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { financeInvoices, suppliers } from "@/db/schema";
import { markInvoicePaid, refreshSupplierAccess, supplierBilling } from "@/lib/domain/finance";
import { newId } from "@/lib/ids";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
const now = new Date("2026-10-30T12:00:00Z");
const DAY = 86_400_000;
const addInvoice = async (daysAgo: number, cents = 30000, kind: "SUPPLIER_SUBSCRIPTION" | "SUPPLIER_CLOSING" = "SUPPLIER_SUBSCRIPTION") => {
  const id = newId("fin");
  await ctx.db.insert(financeInvoices).values({ id, dedupeKey: `T:${id}`, payerType: "SUPPLIER", supplierId: ctx.seed.supplierId, kind, period: "2026-10", description: `Fatura teste ${daysAgo}d`, amountCents: cents, lines: [], status: "OPEN", dueDate: new Date(+now - daysAgo * DAY).toISOString() });
  return id;
};
const status = async () => (await ctx.db.query.suppliers.findFirst({ where: eq(suppliers.id, ctx.seed.supplierId) }))!.status;

describe("faturas do fornecedor com prazos flexíveis", () => {
  it("régua: 2 dias sem restrição, 3 aviso, 15 bloqueio parcial, 25 pausado", async () => {
    const id = await addInvoice(2);
    await refreshSupplierAccess(ctx.db, now); expect(await status()).toBe("ACTIVE");
    await ctx.db.update(financeInvoices).set({ dueDate: new Date(+now - 3 * DAY).toISOString() }).where(eq(financeInvoices.id, id));
    await refreshSupplierAccess(ctx.db, now); expect(await status()).toBe("WARNING");
    await ctx.db.update(financeInvoices).set({ dueDate: new Date(+now - 15 * DAY).toISOString() }).where(eq(financeInvoices.id, id));
    await refreshSupplierAccess(ctx.db, now); expect(await status()).toBe("PARTIAL_BLOCK");
    await ctx.db.update(financeInvoices).set({ dueDate: new Date(+now - 25 * DAY).toISOString() }).where(eq(financeInvoices.id, id));
    await refreshSupplierAccess(ctx.db, now); expect(await status()).toBe("SUSPENDED");
  });
  it("resumo mostra vencidas, próximo estágio e dias; pagar libera o acesso na hora", async () => {
    const a = await addInvoice(26, 30000); const b = await addInvoice(1, 5000, "SUPPLIER_CLOSING");
    await refreshSupplierAccess(ctx.db, now);
    const s = await supplierBilling(ctx.db, ctx.seed.supplierId, now);
    expect(s.state).toBe("SUSPENDED");
    expect(s.open.map((i) => i.id)).toEqual([a, b]);
    expect(s.overdueCents).toBe(35000); expect(s.worstOverdueDays).toBe(26);
    expect(s.next).toEqual({ state: "CLOSED", inDays: 64 });
    await markInvoicePaid(ctx.db, a, now);
    // resta uma fatura vencida há 1 dia: ainda não passa do prazo de aviso
    expect(await status()).toBe("ACTIVE");
    expect((await supplierBilling(ctx.db, ctx.seed.supplierId, now)).open.map((i) => i.id)).toEqual([b]);
  });
});
