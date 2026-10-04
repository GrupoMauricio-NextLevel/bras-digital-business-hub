import { beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { createOrder } from "@/lib/domain/orders";
import { getLevel } from "@/lib/domain/inventory";
import { productVariants, products, storeProducts, stores } from "@/db/schema";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => { ctx = await freshDb(); }, 120_000);
const customer = { name: "Cliente Negativo", email: "neg@teste.com" };

async function firstSellable() {
  const st = ctx.seed.stores.mantos.id;
  const sp = (await ctx.db.select().from(storeProducts).where(and(eq(storeProducts.storeId, st), eq(storeProducts.active, true))))[0]!;
  const v = (await ctx.db.select().from(productVariants).where(eq(productVariants.productId, sp.productId)))[0]!;
  return { st, productId: sp.productId, variantId: v.id };
}
const avail = async (variantId: string) => (await getLevel(ctx.db, variantId)).available;

describe("loop comercial: entradas inválidas nunca criam pedido nem mexem no estoque", () => {
  it("quantidade zero, negativa ou fracionada é recusada", async () => {
    const s = await firstSellable(); const before = await avail(s.variantId);
    for (const quantity of [0, -1, 1.5]) await expect(createOrder(ctx.db, { storeId: s.st, customer, items: [{ productId: s.productId, variantId: s.variantId, quantity }] })).rejects.toBeTruthy();
    expect(await avail(s.variantId)).toBe(before);
  });
  it("produto arquivado ou anúncio desativado não é vendável", async () => {
    const s = await firstSellable(); const before = await avail(s.variantId);
    await ctx.db.update(storeProducts).set({ active: false }).where(and(eq(storeProducts.storeId, s.st), eq(storeProducts.productId, s.productId)));
    await expect(createOrder(ctx.db, { storeId: s.st, customer, items: [{ productId: s.productId, variantId: s.variantId, quantity: 1 }] })).rejects.toMatchObject({ code: "PRODUCT_NOT_AVAILABLE" });
    await ctx.db.update(storeProducts).set({ active: true }).where(and(eq(storeProducts.storeId, s.st), eq(storeProducts.productId, s.productId)));
    await ctx.db.update(products).set({ status: "ARCHIVED" }).where(eq(products.id, s.productId));
    await expect(createOrder(ctx.db, { storeId: s.st, customer, items: [{ productId: s.productId, variantId: s.variantId, quantity: 1 }] })).rejects.toMatchObject({ code: "PRODUCT_NOT_AVAILABLE" });
    await ctx.db.update(products).set({ status: "ACTIVE" }).where(eq(products.id, s.productId));
    expect(await avail(s.variantId)).toBe(before);
  });
  it("variante inexistente ou de outro produto é recusada", async () => {
    const s = await firstSellable();
    const other = (await ctx.db.select().from(productVariants).where(eq(productVariants.productId, ctx.seed.productIds[ctx.seed.productIds.length - 1]!)))[0]!;
    const sameProduct = other.productId === s.productId;
    await expect(createOrder(ctx.db, { storeId: s.st, customer, items: [{ productId: s.productId, variantId: "var_inexistente", quantity: 1 }] })).rejects.toMatchObject({ code: "VARIANT_NOT_AVAILABLE" });
    if (!sameProduct) await expect(createOrder(ctx.db, { storeId: s.st, customer, items: [{ productId: s.productId, variantId: other.id, quantity: 1 }] })).rejects.toMatchObject({ code: "VARIANT_NOT_AVAILABLE" });
  });
  it("estoque insuficiente recusa a compra inteira, inclusive com um item bom e outro ruim", async () => {
    const s = await firstSellable(); const before = await avail(s.variantId);
    const many = before + 5;
    await expect(createOrder(ctx.db, { storeId: s.st, customer, items: [{ productId: s.productId, variantId: s.variantId, quantity: 1 }, { productId: s.productId, variantId: s.variantId, quantity: many }] })).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" });
    expect(await avail(s.variantId)).toBe(before);
  });
  it("loja suspensa ou bloqueada não recebe pedido", async () => {
    const s = await firstSellable(); const before = await avail(s.variantId);
    await ctx.db.update(stores).set({ status: "SUSPENDED" }).where(eq(stores.id, s.st));
    await expect(createOrder(ctx.db, { storeId: s.st, customer, items: [{ productId: s.productId, variantId: s.variantId, quantity: 1 }] })).rejects.toMatchObject({ code: "STORE_INACTIVE" });
    await ctx.db.update(stores).set({ status: "ACTIVE", trialEndsAt: "2020-01-01T00:00:00.000Z", paidUntil: null }).where(eq(stores.id, s.st));
    await expect(createOrder(ctx.db, { storeId: s.st, customer, items: [{ productId: s.productId, variantId: s.variantId, quantity: 1 }] })).rejects.toMatchObject({ code: "STORE_BLOCKED" });
    expect(await avail(s.variantId)).toBe(before);
  });
  it("e-mail inválido e carrinho vazio são recusados; produto de outra loja não vende", async () => {
    const s = await firstSellable();
    await expect(createOrder(ctx.db, { storeId: s.st, customer: { name: "A B", email: "nao-e-email" }, items: [{ productId: s.productId, variantId: s.variantId, quantity: 1 }] })).rejects.toBeTruthy();
    await expect(createOrder(ctx.db, { storeId: s.st, customer, items: [] })).rejects.toBeTruthy();
    await expect(createOrder(ctx.db, { storeId: ctx.seed.stores.arena.id, customer, items: [{ productId: "prd_de_outra_loja", variantId: s.variantId, quantity: 1 }] })).rejects.toMatchObject({ code: "PRODUCT_NOT_AVAILABLE" });
  });
});
