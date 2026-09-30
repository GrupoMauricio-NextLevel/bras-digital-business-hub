import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { activities, categories, productPackItems, productPacks, productStoreAccess, productVariants, products } from "@/db/schema";
import { newId, slugify } from "@/lib/ids";
import { receiveStock } from "./inventory";
import { DomainError } from "./errors";
import { capabilitiesForSupplier } from "./finance";
import { SIZE_GRID_KEYS } from "./size-grids";

const money = z.coerce.number().int().nonnegative();

export const createProductSchema = z.object({
  name: z.string().min(3, "Nome muito curto"),
  sku: z.string().min(2, "Informe o SKU").transform((s) => s.trim().toUpperCase()),
  description: z.string().default(""),
  categoryName: z.string().min(2, "Informe a categoria"),
  images: z.array(z.string().min(1)).default([]),
  costCents: money,
  suggestedPriceCents: money,
  minimumPriceCents: money,
  status: z.enum(["ACTIVE", "DRAFT"]).default("ACTIVE"),
  distribution: z.enum(["ALL_NETWORK", "SELECTED_STORES"]).default("ALL_NETWORK"),
  storeIds: z.array(z.string()).default([]),
  sellsUnit: z.boolean().default(true),
  sellsPack: z.boolean().default(false),
  seoTitle: z.string().max(120).default(""),
  seoDescription: z.string().max(320).default(""),
  sizeGrid: z.enum(SIZE_GRID_KEYS).default("CUSTOM"),
  weightG: z.coerce.number().int().min(1).max(30000).default(300),
  lengthCm: z.coerce.number().int().min(1).max(200).default(30),
  widthCm: z.coerce.number().int().min(1).max(200).default(25),
  heightCm: z.coerce.number().int().min(1).max(200).default(3),
  /** Tamanhos com estoque inicial e, se houver grade, quantidade por tamanho. */
  sizes: z.array(z.object({ size: z.string().min(1).max(6), initialStock: z.coerce.number().int().nonnegative().default(0), packQuantity: z.coerce.number().int().nonnegative().default(0) })).min(1, "Informe ao menos um tamanho"),
  pack: z.object({ name: z.string().min(2).default("Grade 12 peças"), costCents: money, suggestedPriceCents: money, minimumPriceCents: money }).optional(),
});
export type CreateProductInput = z.input<typeof createProductSchema>;

export async function ensureCategory(db: Database, supplierId: string, name: string): Promise<string> {
  const slug = slugify(name);
  const existing = await db.query.categories.findFirst({ where: and(eq(categories.supplierId, supplierId), eq(categories.slug, slug)) });
  if (existing) return existing.id;
  const id = newId("cat");
  await db.insert(categories).values({ id, supplierId, name: name.trim(), slug });
  return id;
}

/** Cadastra um produto completo: variantes, estoque inicial, grade e distribuição. */
export async function createProduct(db: Database, supplierId: string, raw: CreateProductInput): Promise<{ productId: string }> {
  const input = createProductSchema.parse(raw);
  if (!(await capabilitiesForSupplier(db, supplierId)).caps.canManageCatalog) throw new DomainError("SUPPLIER_BLOCKED", "Cadastro de produtos indisponível por pendência financeira com a NextLevel.");
  if (input.minimumPriceCents > input.suggestedPriceCents) throw new DomainError("PRICE_RULE", "Preço mínimo não pode ser maior que o sugerido.");
  if (input.costCents > input.minimumPriceCents) throw new DomainError("PRICE_RULE", "Preço mínimo não pode ser menor que o custo.");
  if (!input.sellsUnit && !input.sellsPack) throw new DomainError("SALE_TYPE", "Escolha venda unitária, grade ou ambas.");
  const sizes = input.sizes.map((s) => ({ ...s, size: s.size.trim().toUpperCase() }));
  if (new Set(sizes.map((s) => s.size)).size !== sizes.length) throw new DomainError("SIZES", "Tamanhos repetidos.");
  if (input.sellsPack) {
    if (!input.pack) throw new DomainError("PACK", "Informe os preços da grade.");
    if (sizes.reduce((s, x) => s + x.packQuantity, 0) === 0) throw new DomainError("PACK", "Defina a quantidade por tamanho da grade.");
  }
  const dupSku = await db.query.products.findFirst({ where: and(eq(products.supplierId, supplierId), eq(products.sku, input.sku)) });
  if (dupSku) throw new DomainError("SKU_TAKEN", `Já existe um produto com o SKU ${input.sku}.`);

  const productId = newId("prd");
  await db.transaction(async (tx) => {
    const categoryId = await ensureCategory(tx, supplierId, input.categoryName);
    let slug = slugify(input.name);
    const dupSlug = await tx.query.products.findFirst({ where: and(eq(products.supplierId, supplierId), eq(products.slug, slug)) });
    if (dupSlug) slug = `${slug}-${input.sku.toLowerCase()}`;
    await tx.insert(products).values({
      id: productId, supplierId, categoryId, name: input.name.trim(), slug, description: input.description, sku: input.sku,
      images: input.images.length ? input.images : [`art:#111827,#ffffff,#9ca3af`],
      costCents: input.costCents, suggestedPriceCents: input.suggestedPriceCents, minimumPriceCents: input.minimumPriceCents,
      status: input.status, distribution: input.distribution, sellsUnit: input.sellsUnit, sellsPack: input.sellsPack,
      seoTitle: input.seoTitle, seoDescription: input.seoDescription,
      sizeGrid: input.sizeGrid, weightG: input.weightG, lengthCm: input.lengthCm, widthCm: input.widthCm, heightCm: input.heightCm,
    });
    const variantRows = sizes.map((s, position) => ({ id: newId("var"), productId, size: s.size, sku: `${input.sku}-${s.size}`, position }));
    await tx.insert(productVariants).values(variantRows);
    for (const [i, v] of variantRows.entries()) {
      const qty = sizes[i]!.initialStock;
      if (qty > 0) await receiveStock(tx, v.id, qty, { referenceType: "INITIAL", note: "Estoque inicial do cadastro" });
    }
    if (input.sellsPack && input.pack) {
      const packId = newId("pck");
      const total = sizes.reduce((s, x) => s + x.packQuantity, 0);
      await tx.insert(productPacks).values({ id: packId, productId, name: input.pack.name, totalQuantity: total, costCents: input.pack.costCents, suggestedPriceCents: input.pack.suggestedPriceCents, minimumPriceCents: input.pack.minimumPriceCents });
      await tx.insert(productPackItems).values(variantRows.map((v, i) => ({ packId, variantId: v.id, quantity: sizes[i]!.packQuantity })).filter((x) => x.quantity > 0));
    }
    if (input.distribution === "SELECTED_STORES" && input.storeIds.length) {
      await tx.insert(productStoreAccess).values(input.storeIds.map((storeId) => ({ productId, storeId })));
    }
    await tx.insert(activities).values({ id: newId("act"), scope: "SUPPLIER", supplierId, type: "PRODUCT_CREATED", message: `Produto “${input.name.trim()}” cadastrado (${input.sku})` });
  });
  return { productId };
}

/** Duplica um produto como rascunho: mesmos dados, variantes e grade, sem estoque, com SKU "-COPIA". */
export async function duplicateProduct(db: Database, supplierId: string, productId: string): Promise<{ productId: string }> {
  const src = await db.query.products.findFirst({ where: and(eq(products.id, productId), eq(products.supplierId, supplierId)) });
  if (!src) throw new DomainError("NOT_FOUND", "Produto não encontrado.");
  const variants = await db.select().from(productVariants).where(eq(productVariants.productId, src.id)).orderBy(productVariants.position);
  const packs = await db.select().from(productPacks).where(eq(productPacks.productId, src.id));
  const category = src.categoryId ? await db.query.categories.findFirst({ where: eq(categories.id, src.categoryId) }) : null;
  let sku = `${src.sku}-COPIA`; let n = 2;
  while (await db.query.products.findFirst({ where: and(eq(products.supplierId, supplierId), eq(products.sku, sku)) })) sku = `${src.sku}-COPIA${n++}`;
  const packItems = packs.length ? await db.select().from(productPackItems).where(eq(productPackItems.packId, packs[0]!.id)) : [];
  const created = await createProduct(db, supplierId, {
    name: `${src.name} (cópia)`, sku, description: src.description, categoryName: category?.name ?? "Geral", images: src.images,
    costCents: src.costCents, suggestedPriceCents: src.suggestedPriceCents, minimumPriceCents: src.minimumPriceCents,
    status: "DRAFT", distribution: "ALL_NETWORK", storeIds: [], sellsUnit: src.sellsUnit, sellsPack: src.sellsPack, seoTitle: src.seoTitle, seoDescription: src.seoDescription,
    sizeGrid: src.sizeGrid, weightG: src.weightG, lengthCm: src.lengthCm, widthCm: src.widthCm, heightCm: src.heightCm,
    sizes: variants.map((v) => ({ size: v.size, initialStock: 0, packQuantity: packItems.find((i) => i.variantId === v.id)?.quantity ?? 0 })),
    pack: packs[0] ? { name: packs[0].name, costCents: packs[0].costCents, suggestedPriceCents: packs[0].suggestedPriceCents, minimumPriceCents: packs[0].minimumPriceCents } : undefined,
  });
  return created;
}

/** Muda o status de vários produtos do fornecedor de uma vez (edição em lote). */
export async function setProductsStatus(db: Database, supplierId: string, ids: string[], status: "ACTIVE" | "DRAFT" | "ARCHIVED"): Promise<number> {
  if (ids.length === 0) return 0;
  const rows = await db.select({ id: products.id }).from(products).where(and(eq(products.supplierId, supplierId), inArray(products.id, ids)));
  if (rows.length === 0) return 0;
  await db.update(products).set({ status, updatedAt: new Date().toISOString() }).where(and(eq(products.supplierId, supplierId), inArray(products.id, rows.map((r) => r.id))));
  return rows.length;
}

// A importação (CSV e XLSX) vive em ./product-import; estas exportações mantêm a API antiga.
export { parseProductsCsv, CSV_TEMPLATE, CSV_COLUMNS, type CsvRow } from "./product-import";
