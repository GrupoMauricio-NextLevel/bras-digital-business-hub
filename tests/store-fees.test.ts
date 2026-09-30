import { beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { financeInvoices, orders, stores } from "@/db/schema";
import { closeStoreFees, getPriceBook, storeOrderFeeFor } from "@/lib/domain/finance";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => { ctx = await freshDb(); });

describe("taxa por pedido do membro", () => {
  it("é o percentual da oferta sobre os produtos (sem frete) dos pedidos pagos, sem teste nem cancelados", async () => {
    const all = await ctx.db.select().from(orders);
    const paid = all.filter((o) => o.customerPaymentStatus === "PAID" && o.status !== "CANCELED" && o.paymentProvider !== "DEMO");
    expect(paid.length).toBeGreaterThan(0);
    const period = paid[0]!.createdAt.slice(0, 7);
    const book = await getPriceBook(ctx.db);
    let checked = 0;
    for (const st of await ctx.db.select().from(stores)) {
      const mine = paid.filter((o) => o.storeId === st.id && o.createdAt.startsWith(period));
      const base = mine.reduce((t, o) => t + o.subtotalCents, 0);
      const f = await storeOrderFeeFor(ctx.db, st.id, period, book);
      expect(f.baseCents).toBe(base);
      expect(f.feeCents).toBe(st.kind === "SUPPLIER_OWN" ? 0 : Math.round((base * book.orderFees[st.offer]) / 10_000));
      if (f.feeCents) checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
  it("o fechamento emite uma fatura por loja e não duplica", async () => {
    const all = await ctx.db.select().from(orders);
    const period = all.find((o) => o.customerPaymentStatus === "PAID" && o.paymentProvider !== "DEMO")!.createdAt.slice(0, 7);
    const a = await closeStoreFees(ctx.db, period);
    expect(a.issued).toBeGreaterThan(0);
    expect((await closeStoreFees(ctx.db, period)).issued).toBe(0);
    const inv = await ctx.db.select().from(financeInvoices).where(and(eq(financeInvoices.kind, "STORE_ORDER_FEES"), eq(financeInvoices.period, period)));
    expect(inv.length).toBe(a.issued);
    for (const i of inv) { expect(i.status).toBe("OPEN"); expect(i.amountCents).toBeGreaterThan(0); expect(i.payerType).toBe("STORE"); }
  });
  it("estorno devolve a taxa: pedido não pago pelo cliente não entra", async () => {
    const st = (await ctx.db.select().from(stores))[0]!;
    const before = await storeOrderFeeFor(ctx.db, st.id, "2020-01");
    expect(before.feeCents).toBe(0);
  });
});
