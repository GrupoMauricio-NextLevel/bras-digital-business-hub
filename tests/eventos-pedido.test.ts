import { beforeAll, describe, expect, it } from "vitest";
import { eq, like } from "drizzle-orm";
import { freshDb } from "./setup";
import { cancelOrder, createOrder, markCustomerPaidBySystem } from "@/lib/domain/orders";
import { domainEvents } from "@/db/schema";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => { ctx = await freshDb(); }, 120_000);

const customer = { name: "Cliente Evento", email: "evento@teste.com", phone: "11999990000" };
async function line() {
  const p = ctx.seed.productIds[0]!;
  const row = (await ctx.db.query.products.findFirst({ where: (t, { eq: e }) => e(t.id, p) }))!;
  const v = (await ctx.db.query.productVariants.findFirst({ where: (t, { eq: e }) => e(t.productId, row.id) }))!;
  return { productId: row.id, variantId: v.id, quantity: 1 } as never;
}
const ofType = async (type: string) => ctx.db.select().from(domainEvents).where(eq(domainEvents.type, type));

describe("F3: eventos de pedido com significado", () => {
  it("criar, pagar e cancelar emitem um evento cada, sem dados pessoais e sem repetir", async () => {
    const st = ctx.seed.stores.mantos.id;
    const o = await createOrder(ctx.db, { storeId: st, customer, items: [await line()] } as never);
    const created = await ofType("ORDER_CREATED");
    expect(created.some((e) => (e.payload as { orderId: string }).orderId === o.orderId)).toBe(true);
    await markCustomerPaidBySystem(ctx.db, o.orderId, { provider: "DEMO", reference: "ref-evt-1" });
    await markCustomerPaidBySystem(ctx.db, o.orderId, { provider: "DEMO", reference: "ref-evt-1" });
    const paid = (await ofType("PAYMENT_APPROVED")).filter((e) => (e.payload as { orderId: string }).orderId === o.orderId);
    expect(paid).toHaveLength(1);
    await cancelOrder(ctx.db, ctx.actors.mantos, o.orderId);
    await cancelOrder(ctx.db, ctx.actors.mantos, o.orderId).catch(() => undefined);
    expect((await ofType("ORDER_CANCELED")).filter((e) => (e.payload as { orderId: string }).orderId === o.orderId)).toHaveLength(1);
    const all = JSON.stringify(await ctx.db.select().from(domainEvents).where(like(domainEvents.type, "ORDER_%")));
    expect(all).not.toContain("evento@teste.com"); expect(all).not.toContain("Cliente Evento");
  });
});
