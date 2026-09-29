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
