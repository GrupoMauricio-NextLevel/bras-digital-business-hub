"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { activities, productStoreAccess, productVariants, products, stores, suppliers } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { catalogOwner, ownedBy, type CatalogOwner } from "@/lib/domain/independent";
import { ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { adjustStock, receiveStock } from "@/lib/domain/inventory";
import { newId } from "@/lib/ids";

async function supplierCtx() {
  const session = await getSession();
  if (!session) throw new ForbiddenError("Sessão expirada.");
  // Fornecedor (SuperDrop) ou loja independente da Commerce mexendo no próprio catálogo (D89).
  return { owner: await catalogOwner(await getDb(), session.actor), session };
}

/** Grava a configuração de envio no dono: o fornecedor, ou a própria loja independente. */
async function setShipping(owner: CatalogOwner, values: { shippingProvider?: string | null; shippingStatus?: "NOT_CONFIGURED" | "DEMO" | "CONNECTED"; shippingAccount?: string | null; shippingTokenEnc?: string | null; shippingOriginZip?: string }) {
  const db = await getDb();
  if (owner.supplierId) await db.update(suppliers).set(values).where(eq(suppliers.id, owner.supplierId));
  else await db.update(stores).set({ ...values, updatedAt: new Date().toISOString() }).where(eq(stores.id, owner.storeId!));
}

async function assertOwnsVariant(owner: CatalogOwner, variantId: string) {
  const db = (await getDb());
  const row = await db.select({ id: productVariants.id }).from(productVariants).innerJoin(products, eq(products.id, productVariants.productId)).where(and(eq(productVariants.id, variantId), ownedBy(products, owner))).limit(1);
  if (!row[0]) throw new NotFoundError("Variante não pertence a este fornecedor.");
}

/** Estoque e catálogo aparecem no painel da Central e no do lojista (conta simples): atualiza os dois. */
function revalidatePanels() {
  revalidatePath("/supplier", "layout");
  revalidatePath("/merchant", "layout");
}

const stockSchema = z.object({ variantId: z.string().min(1), quantity: z.coerce.number().int(), note: z.string().optional() });

export async function receiveStockAction(input: z.input<typeof stockSchema>) {
  return runAction(async () => {
    const { owner, session } = await supplierCtx();
    const data = stockSchema.parse(input);
    await assertOwnsVariant(owner, data.variantId);
    await receiveStock((await getDb()), data.variantId, data.quantity, { referenceType: "MANUAL", note: data.note, actorUserId: session.actor.userId });
    revalidatePanels();
    return undefined;
  });
}

export async function adjustStockAction(input: z.input<typeof stockSchema>) {
  return runAction(async () => {
    const { owner, session } = await supplierCtx();
    const data = stockSchema.parse(input);
    await assertOwnsVariant(owner, data.variantId);
    await adjustStock((await getDb()), data.variantId, data.quantity, { referenceType: "MANUAL", note: data.note, actorUserId: session.actor.userId });
    revalidatePanels();
    return undefined;
  });
}

const distributionSchema = z.object({ productId: z.string().min(1), distribution: z.enum(["ALL_NETWORK", "SELECTED_STORES"]), storeIds: z.array(z.string()).default([]) });

export async function setDistributionAction(input: z.input<typeof distributionSchema>) {
  return runAction(async () => {
    const { owner } = await supplierCtx();
    const data = distributionSchema.parse(input);
    const db = (await getDb());
    const product = await db.query.products.findFirst({ where: and(eq(products.id, data.productId), ownedBy(products, owner)) });
    if (!product) throw new NotFoundError("Produto não encontrado.");
    // Distribuição entre lojas é coisa de rede de fornecedor; loja independente vende só na própria loja.
    if (!owner.supplierId) throw new ForbiddenError("Na loja independente o produto aparece só na sua loja.");
    const supplierId = owner.supplierId;
    const selectedStoreIds = data.distribution === "SELECTED_STORES" ? await assertStoresInSupplierNetwork(db, supplierId, data.storeIds) : [];
    await db.transaction(async (tx) => {
      await tx.update(products).set({ distribution: data.distribution, updatedAt: new Date().toISOString() }).where(eq(products.id, product.id));
      await tx.delete(productStoreAccess).where(eq(productStoreAccess.productId, product.id));
      if (selectedStoreIds.length) {
        await tx.insert(productStoreAccess).values(selectedStoreIds.map((storeId) => ({ productId: product.id, storeId })));
      }
      await tx.insert(activities).values({ id: newId("act"), scope: "SUPPLIER", supplierId, type: "DISTRIBUTION", message: `Distribuição de “${product.name}” alterada para ${data.distribution === "ALL_NETWORK" ? "toda a rede" : `${data.storeIds.length} loja(s)`}` });
    });
    revalidatePanels();
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
    const { owner } = await supplierCtx();
    const data = productSchema.parse(input);
    if (data.minimumPriceCents > data.suggestedPriceCents) throw new ForbiddenError("Preço mínimo não pode ser maior que o sugerido.");
    const db = (await getDb());
    const updated = await db.update(products).set({ ...data, updatedAt: new Date().toISOString() }).where(and(eq(products.id, data.productId), ownedBy(products, owner))).returning({ id: products.id });
    if (updated.length === 0) throw new NotFoundError("Produto não encontrado.");
    revalidatePanels();
    return undefined;
  });
}

// ---------------------------------------------------------------------------
// Cadastro e importação de produtos
// ---------------------------------------------------------------------------
import { assertStoresInSupplierNetwork, createProduct, duplicateProduct, setProductsStatus, type CreateProductInput } from "@/lib/domain/products";

export async function createProductAction(input: CreateProductInput) {
  return runAction(async () => {
    const { owner } = await supplierCtx();
    const r = await createProduct(await getDb(), owner, input);
    revalidatePanels();
    return r;
  });
}

export async function duplicateProductAction(productId: string) {
  return runAction(async () => {
    const { owner } = await supplierCtx();
    const r = await duplicateProduct(await getDb(), owner, productId);
    revalidatePanels();
    return r;
  });
}

export async function bulkProductStatusAction(ids: string[], status: "ACTIVE" | "DRAFT" | "ARCHIVED") {
  return runAction(async () => {
    const { owner } = await supplierCtx();
    if (ids.length > 200) throw new ForbiddenError("Limite de 200 produtos por vez.");
    const n = await setProductsStatus(await getDb(), owner, ids, z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).parse(status));
    revalidatePanels();
    return { updated: n };
  });
}

export type ImportResult = { created: number; updated: number; skipped: number; failed: { line: number; name: string; error: string }[] };

const importSchema = z.object({ source: z.discriminatedUnion("kind", [z.object({ kind: z.literal("csv"), text: z.string().max(3_000_000) }), z.object({ kind: z.literal("xlsx"), base64: z.string().max(9_000_000) })]), mode: z.enum(["skip", "update"]).default("skip") });

/** Confere a planilha sem gravar nada: mostra o que será criado, atualizado, ignorado e os erros linha a linha. */
export async function previewProductsImportAction(input: z.input<typeof importSchema>) {
  return runAction(async () => {
    const { owner } = await supplierCtx();
    const data = importSchema.parse(input);
    const { readSpreadsheet, previewImport } = await import("@/lib/domain/product-import-server");
    const matrix = await readSpreadsheet(data.source);
    if (matrix.length < 2) throw new ForbiddenError("Planilha vazia ou sem linhas de produto.");
    return previewImport(await getDb(), owner, matrix, data.mode);
  });
}

/** Importa produtos de CSV ou XLSX. Cada linha é independente: erros não impedem as demais. */
export async function importProductsCsvAction(input: z.input<typeof importSchema> | string) {
  return runAction(async (): Promise<ImportResult> => {
    const { owner } = await supplierCtx();
    const data = importSchema.parse(typeof input === "string" ? { source: { kind: "csv", text: input } } : input);
    const { readSpreadsheet, importRows } = await import("@/lib/domain/product-import-server");
    const matrix = await readSpreadsheet(data.source);
    if (matrix.length < 2) throw new ForbiddenError("Planilha vazia ou sem linhas de produto.");
    const result = await importRows(await getDb(), owner, matrix, data.mode);
    revalidatePanels();
    return result;
  });
}

const imagesSchema = z.object({ productId: z.string().min(1), images: z.array(z.string().min(1)).max(6) });

export async function updateProductImagesAction(input: z.input<typeof imagesSchema>) {
  return runAction(async () => {
    const { owner } = await supplierCtx();
    const data = imagesSchema.parse(input);
    const db = await getDb();
    const updated = await db.update(products).set({ images: data.images.length ? data.images : ["art:#111827,#ffffff,#9ca3af"], updatedAt: new Date().toISOString() }).where(and(eq(products.id, data.productId), ownedBy(products, owner))).returning({ id: products.id });
    if (updated.length === 0) throw new NotFoundError("Produto não encontrado.");
    revalidatePanels();
    return undefined;
  });
}

// ---------------------------------------------------------------------------
// Plataforma de envio do fornecedor
// ---------------------------------------------------------------------------
import { NOVAS_PLATAFORMAS_DE_ENVIO, SHIPPING_PROVIDER_KEYS, ShippingError, verifyShippingToken, type ShippingProviderKey } from "@/lib/shipping/providers";
import { storeModality } from "@/lib/domain/order-policy";
import { encryptSecret } from "@/lib/security/crypto";
import { isDemoMode } from "@/lib/auth";

const shippingSchema = z.object({ provider: z.enum(SHIPPING_PROVIDER_KEYS as [ShippingProviderKey, ...ShippingProviderKey[]]), token: z.string().min(20, "Cole o token completo").optional() });

/** Conecta a plataforma de envio: valida o token na própria plataforma e guarda criptografado. Em demonstração, aceita conexão simulada. */
export async function connectShippingAction(input: z.input<typeof shippingSchema>) {
  return runAction(async () => {
    const { owner } = await supplierCtx();
    const data = shippingSchema.parse(input);
    // Frenet, Kangu e Correios com contrato (D190): só a loja independente da E-commerce, por enquanto.
    if (NOVAS_PLATAFORMAS_DE_ENVIO.includes(data.provider) && (!owner.storeId || (await storeModality(await getDb(), owner.storeId)) !== "INDEPENDENT")) throw new ForbiddenError("Disponível na loja da NextLevel E-commerce.");
    if (!data.token) {
      if (!isDemoMode()) throw new ForbiddenError("Cole o token da plataforma de envio.");
      await setShipping(owner, { shippingProvider: data.provider, shippingStatus: "DEMO", shippingAccount: "conta de demonstração", shippingTokenEnc: null });
      revalidatePanels();
      return { account: "conta de demonstração" };
    }
    let account: string;
    try { account = (await verifyShippingToken(data.provider, data.token.trim())).account; } catch (e) { throw new ForbiddenError(e instanceof ShippingError ? e.message : "Não foi possível validar o token."); }
    await setShipping(owner, { shippingProvider: data.provider, shippingStatus: "CONNECTED", shippingAccount: account, shippingTokenEnc: encryptSecret(data.token.trim()) });
    revalidatePanels();
    return { account };
  });
}

/** CEP de onde saem os pedidos (origem das cotações de frete). Serve ao fornecedor e à conta simples. */
export async function setOriginZipAction(zip: string) {
  return runAction(async () => {
    const { owner } = await supplierCtx();
    const digits = zip.replace(/\D/g, "");
    if (digits.length !== 8) throw new ForbiddenError("Informe um CEP válido (8 números).");
    await setShipping(owner, { shippingOriginZip: digits });
    revalidatePanels();
    return undefined;
  });
}

export async function disconnectShippingAction() {
  return runAction(async () => {
    const { owner } = await supplierCtx();
    await setShipping(owner, { shippingProvider: null, shippingStatus: "NOT_CONFIGURED", shippingAccount: null, shippingTokenEnc: null });
    revalidatePanels();
    return undefined;
  });
}

// ---------------------------------------------------------------------------
// Categorias
// ---------------------------------------------------------------------------
import { createCategory, deleteCategory, renameCategory } from "@/lib/domain/categories";

export async function createCategoryAction(name: string) {
  return runAction(async () => {
    const { owner } = await supplierCtx();
    await createCategory(await getDb(), owner, name);
    revalidatePanels();
    return undefined;
  });
}

export async function renameCategoryAction(id: string, name: string) {
  return runAction(async () => {
    const { owner } = await supplierCtx();
    await renameCategory(await getDb(), owner, id, name);
    revalidatePanels();
    return undefined;
  });
}

export async function deleteCategoryAction(id: string) {
  return runAction(async () => {
    const { owner } = await supplierCtx();
    const r = await deleteCategory(await getDb(), owner, id);
    revalidatePanels();
    return r;
  });
}
