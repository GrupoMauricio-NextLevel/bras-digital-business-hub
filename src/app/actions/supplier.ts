"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { activities, productStoreAccess, productVariants, products } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireSupplierId } from "@/lib/domain/access";
import { ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { adjustStock, receiveStock } from "@/lib/domain/inventory";
import { newId } from "@/lib/ids";

async function supplierCtx() {
  const session = await getSession();
  if (!session) throw new ForbiddenError("Sessão expirada.");
  return { supplierId: requireSupplierId(session.actor), session };
}

async function assertOwnsVariant(supplierId: string, variantId: string) {
  const db = (await getDb());
  const row = await db.select({ id: productVariants.id }).from(productVariants).innerJoin(products, eq(products.id, productVariants.productId)).where(and(eq(productVariants.id, variantId), eq(products.supplierId, supplierId))).limit(1);
  if (!row[0]) throw new NotFoundError("Variante não pertence a este fornecedor.");
}

const stockSchema = z.object({ variantId: z.string().min(1), quantity: z.coerce.number().int(), note: z.string().optional() });

export async function receiveStockAction(input: z.input<typeof stockSchema>) {
  return runAction(async () => {
    const { supplierId } = await supplierCtx();
    const data = stockSchema.parse(input);
    await assertOwnsVariant(supplierId, data.variantId);
    await receiveStock((await getDb()), data.variantId, data.quantity, { referenceType: "MANUAL", note: data.note });
    revalidatePath("/supplier", "layout");
    return undefined;
  });
}

export async function adjustStockAction(input: z.input<typeof stockSchema>) {
  return runAction(async () => {
    const { supplierId } = await supplierCtx();
    const data = stockSchema.parse(input);
    await assertOwnsVariant(supplierId, data.variantId);
    await adjustStock((await getDb()), data.variantId, data.quantity, { referenceType: "MANUAL", note: data.note });
    revalidatePath("/supplier", "layout");
    return undefined;
  });
}

const distributionSchema = z.object({ productId: z.string().min(1), distribution: z.enum(["ALL_NETWORK", "SELECTED_STORES"]), storeIds: z.array(z.string()).default([]) });

export async function setDistributionAction(input: z.input<typeof distributionSchema>) {
  return runAction(async () => {
    const { supplierId } = await supplierCtx();
    const data = distributionSchema.parse(input);
    const db = (await getDb());
    const product = await db.query.products.findFirst({ where: and(eq(products.id, data.productId), eq(products.supplierId, supplierId)) });
    if (!product) throw new NotFoundError("Produto não encontrado.");
    await db.transaction(async (tx) => {
      await tx.update(products).set({ distribution: data.distribution, updatedAt: new Date().toISOString() }).where(eq(products.id, product.id));
      await tx.delete(productStoreAccess).where(eq(productStoreAccess.productId, product.id));
      if (data.distribution === "SELECTED_STORES" && data.storeIds.length) {
        await tx.insert(productStoreAccess).values(data.storeIds.map((storeId) => ({ productId: product.id, storeId })));
      }
      await tx.insert(activities).values({ id: newId("act"), scope: "SUPPLIER", supplierId, type: "DISTRIBUTION", message: `Distribuição de “${product.name}” alterada para ${data.distribution === "ALL_NETWORK" ? "toda a rede" : `${data.storeIds.length} loja(s)`}` });
    });
    revalidatePath("/supplier", "layout");
    revalidatePath("/merchant", "layout");
    return undefined;
  });
}

const productSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(3),
  description: z.string().default(""),
  costCents: z.coerce.number().int().nonnegative(),
  suggestedPriceCents: z.coerce.number().int().nonnegative(),
  minimumPriceCents: z.coerce.number().int().nonnegative(),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]),
  sellsUnit: z.boolean(),
  sellsPack: z.boolean(),
  seoTitle: z.string().max(120).default(""),
  seoDescription: z.string().max(320).default(""),
  weightG: z.coerce.number().int().min(1).max(30000).default(300),
  lengthCm: z.coerce.number().int().min(1).max(200).default(30),
  widthCm: z.coerce.number().int().min(1).max(200).default(25),
  heightCm: z.coerce.number().int().min(1).max(200).default(3),
});

export async function updateProductAction(input: z.input<typeof productSchema>) {
  return runAction(async () => {
    const { supplierId } = await supplierCtx();
    const data = productSchema.parse(input);
    if (data.minimumPriceCents > data.suggestedPriceCents) throw new ForbiddenError("Preço mínimo não pode ser maior que o sugerido.");
    const db = (await getDb());
    const updated = await db.update(products).set({ ...data, updatedAt: new Date().toISOString() }).where(and(eq(products.id, data.productId), eq(products.supplierId, supplierId))).returning({ id: products.id });
    if (updated.length === 0) throw new NotFoundError("Produto não encontrado.");
    revalidatePath("/supplier", "layout");
    revalidatePath("/merchant", "layout");
    return undefined;
  });
}

// ---------------------------------------------------------------------------
// Cadastro e importação de produtos
// ---------------------------------------------------------------------------
import { createProduct, duplicateProduct, setProductsStatus, type CreateProductInput } from "@/lib/domain/products";

export async function createProductAction(input: CreateProductInput) {
  return runAction(async () => {
    const { supplierId } = await supplierCtx();
    const r = await createProduct(await getDb(), supplierId, input);
    revalidatePath("/supplier", "layout");
    revalidatePath("/merchant", "layout");
    return r;
  });
}

export async function duplicateProductAction(productId: string) {
  return runAction(async () => {
    const { supplierId } = await supplierCtx();
    const r = await duplicateProduct(await getDb(), supplierId, productId);
    revalidatePath("/supplier", "layout");
    return r;
  });
}

export async function bulkProductStatusAction(ids: string[], status: "ACTIVE" | "DRAFT" | "ARCHIVED") {
  return runAction(async () => {
    const { supplierId } = await supplierCtx();
    if (ids.length > 200) throw new ForbiddenError("Limite de 200 produtos por vez.");
    const n = await setProductsStatus(await getDb(), supplierId, ids, z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).parse(status));
    revalidatePath("/supplier", "layout");
    revalidatePath("/merchant", "layout");
    return { updated: n };
  });
}

export type ImportResult = { created: number; updated: number; skipped: number; failed: { line: number; name: string; error: string }[] };

const importSchema = z.object({ source: z.discriminatedUnion("kind", [z.object({ kind: z.literal("csv"), text: z.string().max(3_000_000) }), z.object({ kind: z.literal("xlsx"), base64: z.string().max(9_000_000) })]), mode: z.enum(["skip", "update"]).default("skip") });

/** Confere a planilha sem gravar nada: mostra o que será criado, atualizado, ignorado e os erros linha a linha. */
export async function previewProductsImportAction(input: z.input<typeof importSchema>) {
  return runAction(async () => {
    const { supplierId } = await supplierCtx();
    const data = importSchema.parse(input);
    const { readSpreadsheet, previewImport } = await import("@/lib/domain/product-import-server");
    const matrix = await readSpreadsheet(data.source);
    if (matrix.length < 2) throw new ForbiddenError("Planilha vazia ou sem linhas de produto.");
    return previewImport(await getDb(), supplierId, matrix, data.mode);
  });
}

/** Importa produtos de CSV ou XLSX. Cada linha é independente: erros não impedem as demais. */
export async function importProductsCsvAction(input: z.input<typeof importSchema> | string) {
  return runAction(async (): Promise<ImportResult> => {
    const { supplierId } = await supplierCtx();
    const data = importSchema.parse(typeof input === "string" ? { source: { kind: "csv", text: input } } : input);
    const { readSpreadsheet, importRows } = await import("@/lib/domain/product-import-server");
    const matrix = await readSpreadsheet(data.source);
    if (matrix.length < 2) throw new ForbiddenError("Planilha vazia ou sem linhas de produto.");
    const result = await importRows(await getDb(), supplierId, matrix, data.mode);
    revalidatePath("/supplier", "layout");
    revalidatePath("/merchant", "layout");
    return result;
  });
}

const imagesSchema = z.object({ productId: z.string().min(1), images: z.array(z.string().min(1)).max(6) });

export async function updateProductImagesAction(input: z.input<typeof imagesSchema>) {
  return runAction(async () => {
    const { supplierId } = await supplierCtx();
    const data = imagesSchema.parse(input);
    const db = await getDb();
    const updated = await db.update(products).set({ images: data.images.length ? data.images : ["art:#111827,#ffffff,#9ca3af"], updatedAt: new Date().toISOString() }).where(and(eq(products.id, data.productId), eq(products.supplierId, supplierId))).returning({ id: products.id });
    if (updated.length === 0) throw new NotFoundError("Produto não encontrado.");
    revalidatePath("/supplier", "layout");
    revalidatePath("/merchant", "layout");
    return undefined;
  });
}
