import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { products } from "@/db/schema";
import { createProduct, duplicateProduct, setProductsStatus } from "@/lib/domain/products";
import { listSupplierCatalog } from "@/lib/domain/catalog";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

const base = { name: "Manto Editor 2026", sku: "ed-01", categoryName: "Times", costCents: 5900, suggestedPriceCents: 14990, minimumPriceCents: 11990, seoTitle: "Manto oficial", seoDescription: "Descrição para busca", sellsPack: true, pack: { name: "Grade 10", costCents: 50000, suggestedPriceCents: 110000, minimumPriceCents: 90000 }, sizes: [{ size: "P", initialStock: 5, packQuantity: 4 }, { size: "M", initialStock: 5, packQuantity: 6 }] };

describe("editor de produto", () => {
  it("guarda o SEO no cadastro", async () => {
    const { productId } = await createProduct(ctx.db, ctx.seed.supplierId, base);
    const p = await ctx.db.query.products.findFirst({ where: eq(products.id, productId) });
    expect(p?.seoTitle).toBe("Manto oficial"); expect(p?.seoDescription).toBe("Descrição para busca");
  });
  it("duplica como rascunho, sem estoque, com SKU novo, SEO e grade", async () => {
    const { productId } = await createProduct(ctx.db, ctx.seed.supplierId, base);
    const copy = await duplicateProduct(ctx.db, ctx.seed.supplierId, productId);
    const again = await duplicateProduct(ctx.db, ctx.seed.supplierId, productId);
    const catalog = await listSupplierCatalog(ctx.db, ctx.seed.supplierId);
    const c = catalog.find((x) => x.product.id === copy.productId)!;
    expect(c.product.status).toBe("DRAFT"); expect(c.product.sku).toBe("ED-01-COPIA"); expect(c.product.name).toBe("Manto Editor 2026 (cópia)");
    expect(c.onHand).toBe(0); expect(c.variants.map((v) => v.size)).toEqual(["P", "M"]); expect(c.product.seoTitle).toBe("Manto oficial");
    expect(c.packs[0]?.totalQuantity).toBe(10);
    expect(catalog.find((x) => x.product.id === again.productId)!.product.sku).toBe("ED-01-COPIA2");
  });
  it("não duplica produto de outro fornecedor", async () => {
    const { productId } = await createProduct(ctx.db, ctx.seed.supplierId, base);
    await expect(duplicateProduct(ctx.db, "outro-fornecedor", productId)).rejects.toThrow();
  });
  it("muda o status em lote só dos produtos do fornecedor", async () => {
    const a = await createProduct(ctx.db, ctx.seed.supplierId, base);
    const b = await createProduct(ctx.db, ctx.seed.supplierId, { ...base, sku: "ED-02", name: "Outro Manto" });
    expect(await setProductsStatus(ctx.db, ctx.seed.supplierId, [a.productId, b.productId, "inexistente"], "ARCHIVED")).toBe(2);
    expect(await setProductsStatus(ctx.db, "outro-fornecedor", [a.productId], "ACTIVE")).toBe(0);
    expect((await ctx.db.query.products.findFirst({ where: eq(products.id, a.productId) }))?.status).toBe("ARCHIVED");
  });
});
