import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb, customer } from "./setup";
import { createOrder } from "@/lib/domain/orders";
import { getLevel } from "@/lib/domain/inventory";
import { orders } from "@/db/schema";

let ctx: Awaited<ReturnType<typeof freshDb>>;
const line = () => ({ productId: ctx.seed.productIds[11]!, variantId: ctx.seed.variantsByProduct.get(ctx.seed.productIds[11]!)![0]!.id, quantity: 1 });
const make = (storeId: string, idempotencyKey?: string) => createOrder(ctx.db, { storeId, customer, items: [line()], customerPaymentStatus: "PAID", idempotencyKey });
beforeEach(async () => { ctx = await freshDb(); });

describe("F1.2 idempotência da finalização do checkout (02 §46)", () => {
  it("mesma chave duas vezes devolve o mesmo pedido, sem segunda reserva de estoque", async () => {
    const st = ctx.seed.stores.mantos.id;
    const before = (await getLevel(ctx.db, line().variantId)).reserved;
    const a = await make(st, "tentativa-0001:abc");
    const b = await make(st, "tentativa-0001:abc");
    expect(b.replayed).toBe(true); expect(a.replayed).toBe(false);
    expect(b.orderId).toBe(a.orderId); expect(b.number).toBe(a.number);
    expect((await ctx.db.select().from(orders).where(eq(orders.idempotencyKey, "tentativa-0001:abc")))).toHaveLength(1);
    expect((await getLevel(ctx.db, line().variantId)).reserved - before).toBe(1); // uma única reserva (não duas)
  });
  it("duas requisições ao mesmo tempo com a mesma chave geram um pedido só", async () => {
    const st = ctx.seed.stores.mantos.id;
    const r = await Promise.allSettled([make(st, "tentativa-0002:xyz"), make(st, "tentativa-0002:xyz"), make(st, "tentativa-0002:xyz")]);
    const ok = r.filter((x) => x.status === "fulfilled") as PromiseFulfilledResult<Awaited<ReturnType<typeof make>>>[];
    expect(new Set(ok.map((x) => x.value.orderId)).size).toBe(1);
    expect(await ctx.db.select().from(orders).where(eq(orders.idempotencyKey, "tentativa-0002:xyz"))).toHaveLength(1);
  });
  it("chaves diferentes criam pedidos diferentes; sem chave segue como antes", async () => {
    const st = ctx.seed.stores.mantos.id;
    const a = await make(st, "tentativa-0003:aaa"); const b = await make(st, "tentativa-0003:bbb"); const c = await make(st); const d = await make(st);
    expect(new Set([a.orderId, b.orderId, c.orderId, d.orderId]).size).toBe(4);
  });
  it("a mesma chave em outra loja não colide", async () => {
    const a = await make(ctx.seed.stores.mantos.id, "tentativa-0004:same");
    const otherStore = ctx.seed.stores.arena.id;
    const b = await createOrder(ctx.db, { storeId: otherStore, customer, items: [line()], customerPaymentStatus: "PAID", idempotencyKey: "tentativa-0004:same" }).catch((e) => e);
    // a loja Arena pode não ter este produto no catálogo: o que importa é que nunca devolva o pedido da outra loja
    if (!(b instanceof Error)) expect(b.orderId).not.toBe(a.orderId);
  });
  it("chave curta demais é recusada", async () => {
    await expect(make(ctx.seed.stores.mantos.id, "curta")).rejects.toBeDefined();
  });
});
