import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { products } from "@/db/schema";
import { createProduct } from "@/lib/domain/products";
import { createCategory, deleteCategory, listCategories, renameCategory } from "@/lib/domain/categories";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

describe("Onda 2 — categorias", () => {
  it("cria, conta produtos, renomeia sem duplicar e exclui sem apagar produtos", async () => {
    const sup = ctx.seed.supplierId;
    const { id } = await createCategory(ctx.db, sup, "Blusas Teste");
    const { productId } = await createProduct(ctx.db, sup, { name: "Blusa X", sku: "BLX-1", categoryName: "Blusas Teste", costCents: 1000, suggestedPriceCents: 3000, minimumPriceCents: 2000, sizes: [{ size: "M", initialStock: 3 }] });
    expect((await listCategories(ctx.db, sup)).find((c) => c.id === id)?.productCount).toBe(1);
    await createCategory(ctx.db, sup, "Outra Teste");
    await expect(renameCategory(ctx.db, sup, id, "outra teste")).rejects.toThrow(/Já existe/);
    await renameCategory(ctx.db, sup, id, "Blusas e Camisas");
    expect((await deleteCategory(ctx.db, sup, id)).released).toBe(1);
    const p = (await ctx.db.query.products.findFirst({ where: eq(products.id, productId) }))!;
    expect(p.categoryId).toBeNull();
  });

  it("outra Central não mexe na categoria alheia", async () => {
    const { id } = await createCategory(ctx.db, ctx.seed.supplierId, "Privada Teste");
    await expect(renameCategory(ctx.db, "sup_outro", id, "Invadida")).rejects.toThrow(/não encontrada/);
    await expect(deleteCategory(ctx.db, "sup_outro", id)).rejects.toThrow(/não encontrada/);
  });
});
