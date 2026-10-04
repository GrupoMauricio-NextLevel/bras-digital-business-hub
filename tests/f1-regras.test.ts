import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { assertListingPrices } from "@/lib/domain/catalog";
import { assertStoresInSupplierNetwork, createProduct } from "@/lib/domain/products";
import { signupMember } from "@/lib/domain/store-access";
import { productStoreAccess, products } from "@/db/schema";

let ctx: Awaited<ReturnType<typeof freshDb>>;
let foreignStoreId: string;
beforeAll(async () => {
  ctx = await freshDb();
  const r = await signupMember(ctx.db, { storeName: "Loja de Outra Rede", ownerName: "Fulano", email: "fulano@outra.rede", password: "senha-forte-123", taxId: "111.444.777-35", offer: "STORE_SUBDOMAIN", independent: true, brand: "NEXTLEVEL_COMMERCE" });
  foreignStoreId = r.storeId;
}, 120_000);

const base = { categoryName: "Teste", images: [], costCents: 1000, suggestedPriceCents: 3000, minimumPriceCents: 2000, sizes: [{ size: "M", initialStock: 5, packQuantity: 2 }] };

describe("F1.2b: piso de preço da grade no servidor", () => {
  it("unidade abaixo do piso recusa; igual ao piso aceita", async () => {
    const { productId } = await createProduct(ctx.db, ctx.seed.supplierId, { ...base, name: "Prod unidade", sku: "F1-U" } as never);
    const p = (await ctx.db.query.products.findFirst({ where: eq(products.id, productId) }))!;
    await expect(assertListingPrices(ctx.db, p, { priceCents: 1999 })).rejects.toMatchObject({ code: "BELOW_MINIMUM" });
    await expect(assertListingPrices(ctx.db, p, { priceCents: 2000 })).resolves.toBeUndefined();
  });
  it("grade abaixo do piso da grade recusa; igual aceita; sem grade informada aceita", async () => {
    const { productId } = await createProduct(ctx.db, ctx.seed.supplierId, { ...base, name: "Prod grade", sku: "F1-G", sellsPack: true, pack: { name: "Grade", costCents: 5000, suggestedPriceCents: 9000, minimumPriceCents: 7000 } } as never);
    const p = (await ctx.db.query.products.findFirst({ where: eq(products.id, productId) }))!;
    await expect(assertListingPrices(ctx.db, p, { priceCents: 2500, packPriceCents: 6999 })).rejects.toMatchObject({ code: "BELOW_MINIMUM", message: expect.stringContaining("grade") });
    await expect(assertListingPrices(ctx.db, p, { priceCents: 2500, packPriceCents: 7000 })).resolves.toBeUndefined();
    await expect(assertListingPrices(ctx.db, p, { priceCents: 2500, packPriceCents: null })).resolves.toBeUndefined();
    await expect(assertListingPrices(ctx.db, p, { priceCents: 2500 })).resolves.toBeUndefined();
  });
});

describe("F2: distribuição só para lojas da própria rede", () => {
  const own = () => ctx.seed.stores.mantos.id;
  it("loja de outra rede recusa e nada é gravado", async () => {
    await expect(createProduct(ctx.db, ctx.seed.supplierId, { ...base, name: "Prod F2a", sku: "F2-A", distribution: "SELECTED_STORES", storeIds: [foreignStoreId] } as never)).rejects.toMatchObject({ name: "ForbiddenError" });
    expect(await ctx.db.query.products.findFirst({ where: eq(products.sku, "F2-A") })).toBeUndefined();
  });
  it("mistura de loja válida e inválida recusa tudo", async () => {
    await expect(createProduct(ctx.db, ctx.seed.supplierId, { ...base, name: "Prod F2b", sku: "F2-B", distribution: "SELECTED_STORES", storeIds: [own(), foreignStoreId] } as never)).rejects.toMatchObject({ name: "ForbiddenError" });
    expect(await ctx.db.query.products.findFirst({ where: eq(products.sku, "F2-B") })).toBeUndefined();
  });
  it("lojas da própria rede, repetidas ou não, são aceitas sem duplicar", async () => {
    const { productId } = await createProduct(ctx.db, ctx.seed.supplierId, { ...base, name: "Prod F2c", sku: "F2-C", distribution: "SELECTED_STORES", storeIds: [own(), own()] } as never);
    expect(await ctx.db.select().from(productStoreAccess).where(eq(productStoreAccess.productId, productId))).toHaveLength(1);
  });
  it("lista vazia é aceita e o fornecedor de outra rede não vê lojas alheias como suas", async () => {
    await expect(assertStoresInSupplierNetwork(ctx.db, ctx.seed.supplierId, [])).resolves.toEqual([]);
    const other = (await ctx.db.query.stores.findFirst({ where: (s, { eq: e }) => e(s.id, foreignStoreId) }))!;
    await expect(assertStoresInSupplierNetwork(ctx.db, "sup_inexistente", [other.id])).rejects.toMatchObject({ name: "ForbiddenError" });
  });
});

describe("F1.3: frete cobrado exige endereço", () => {
  it("com frete sem endereço recusa; sem frete ou com endereço completo aceita", async () => {
    const { createOrderSchema } = await import("@/lib/domain/orders");
    const base = { storeId: "s", customer: { name: "Fulano", email: "f@x.com" }, items: [{ productId: "p", variantId: "v", quantity: 1 }] };
    expect(createOrderSchema.safeParse({ ...base, shipping: { costCents: 1500 } }).success).toBe(false);
    expect(createOrderSchema.safeParse({ ...base, shipping: { costCents: 0 } }).success).toBe(true);
    expect(createOrderSchema.safeParse({ ...base, shipping: { costCents: 1500, address: "Rua A, 1", city: "SP", state: "SP", zip: "01310-100" } }).success).toBe(true);
  });
});
