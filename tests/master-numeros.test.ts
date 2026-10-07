import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { orders } from "@/db/schema";
import { isEligibleSale, netSaleCents } from "@/lib/domain/analytics";
import { getPlatformOverview, listStoresWithPlan } from "@/lib/queries/master";

// As consultas do Master usam o banco do processo (getDb); aqui ele aponta para um banco de teste.
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => {
  ctx = await freshDb();
  (globalThis as unknown as { __nlDb?: Promise<{ db: unknown; close: () => Promise<void> }> }).__nlDb = Promise.resolve({ db: ctx.db, close: async () => {} });
}, 120_000);

const expected = async () => {
  const rows = await ctx.db.select().from(orders);
  const sales = rows.filter(isEligibleSale);
  return { n: sales.length, gmv: sales.reduce((s, o) => s + netSaleCents(o), 0), byStore: (id: string) => sales.filter((o) => o.storeId === id).reduce((s, o) => s + netSaleCents(o), 0) };
};

describe("números do Master usam o mesmo contrato de venda do lojista", () => {
  it("volume da rede = vendas pagas, não canceladas, sem frete", async () => {
    const [first] = await ctx.db.select().from(orders).limit(1);
    // um pedido pago com desconto e frete, outro cancelado e outro sem pagamento: só o primeiro conta (sem o frete)
    await ctx.db.update(orders).set({ customerPaymentStatus: "PAID", status: "DELIVERED", discountCents: 500, shippingCents: 2_000 }).where(eq(orders.id, first!.id));
    const e = await expected();
    const o = await getPlatformOverview();
    expect(o.gmv).toBe(e.gmv);
    expect(o.orders).toBe(e.n);
  });

  it("cancelar um pedido pago tira o valor do Master e da loja", async () => {
    const rows = await ctx.db.select().from(orders);
    const paid = rows.find(isEligibleSale)!;
    const before = await getPlatformOverview();
    const storeBefore = (await listStoresWithPlan()).find((r) => r.store.id === paid.storeId)!;
    await ctx.db.update(orders).set({ status: "CANCELED" }).where(eq(orders.id, paid.id));
    const after = await getPlatformOverview();
    const storeAfter = (await listStoresWithPlan()).find((r) => r.store.id === paid.storeId)!;
    expect(before.gmv - after.gmv).toBe(netSaleCents(paid));
    expect(storeBefore.gmv - storeAfter.gmv).toBe(netSaleCents(paid));
    expect(storeAfter.gmv).toBe((await expected()).byStore(paid.storeId));
  });

  it("a soma das lojas por marca bate com o volume da rede", async () => {
    const all = await listStoresWithPlan();
    const byBrand = [...new Set(all.map((r) => r.brand))];
    let total = 0;
    for (const brand of byBrand) total += (await listStoresWithPlan({ marca: brand })).reduce((s, r) => s + r.gmv, 0);
    expect(total).toBe(all.reduce((s, r) => s + r.gmv, 0));
  });
});
