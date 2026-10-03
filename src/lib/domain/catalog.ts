import { activationCheck, type ActivationCheck } from "./size-grids";
import { and, eq, inArray, or, exists } from "drizzle-orm";
import type { Database } from "@/db/client";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { productPackItems, productPacks, productStoreAccess, productVariants, products, storeProducts, stores } from "@/db/schema";
import { getLevels, type InventoryLevel } from "./inventory";
import { loadTiers, type Tier } from "./price-tiers";

export type StoreCatalogItem = {
  /** Faixas de preço por quantidade (vazio em loja de rede). */
  tiers: Tier[];
  product: typeof products.$inferSelect;
  storeProduct: typeof storeProducts.$inferSelect;
  variants: (typeof productVariants.$inferSelect & { level: InventoryLevel })[];
  packs: (typeof productPacks.$inferSelect & { items: { variantId: string; size: string; quantity: number }[]; available: number })[];
};

/**
 * Produtos que uma loja pode vender:
 *  - produto ativo do fornecedor da rede da loja
 *  - distribuição ALL_NETWORK ou loja listada em product_store_access
 *  - store_products.active = true
 */
export async function listStoreCatalog(db: Database, storeId: string, opts: { onlyActive?: boolean } = {}): Promise<StoreCatalogItem[]> {
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  if (!store) return [];
  const network = await db.query.networks.findFirst({ where: (n, { eq }) => eq(n.id, store.networkId) });
  if (!network) return [];

  const accessible = and(
    eq(products.supplierId, network.supplierId),
    eq(products.status, "ACTIVE"),
    or(
      eq(products.distribution, "ALL_NETWORK"),
      exists(db.select().from(productStoreAccess).where(and(eq(productStoreAccess.productId, products.id), eq(productStoreAccess.storeId, storeId)))),
    ),
  );

  if (opts.onlyActive === false) {
    // Painel do lojista: todos os produtos acessíveis, com listagem opcional (não ativado = preço sugerido, inativo).
    const rows = await db
      .select({ product: products, storeProduct: storeProducts })
      .from(products)
      .leftJoin(storeProducts, and(eq(storeProducts.productId, products.id), eq(storeProducts.storeId, storeId)))
      .where(accessible)
      .orderBy(products.name);
    return hydrate(db, rows.map((r) => ({ product: r.product, storeProduct: r.storeProduct ?? { storeId, productId: r.product.id, priceCents: r.product.suggestedPriceCents, packPriceCents: null, active: false, featured: false } })));
  }

  const rows = await db
    .select({ product: products, storeProduct: storeProducts })
    .from(storeProducts)
    .innerJoin(products, eq(products.id, storeProducts.productId))
    .where(and(eq(storeProducts.storeId, storeId), eq(storeProducts.active, true), accessible))
    .orderBy(products.name);

  return hydrate(db, rows);
}

export async function listSupplierCatalog(db: Database, supplierId: string) {
  const rows = await db.select().from(products).where(eq(products.supplierId, supplierId));
  const ids = rows.map((r) => r.id);
  const variants = ids.length ? await db.select().from(productVariants).where(inArray(productVariants.productId, ids)) : [];
  const levels = await getLevels(db, variants.map((v) => v.id));
  const packs = ids.length ? await db.select().from(productPacks).where(inArray(productPacks.productId, ids)) : [];
  return rows.map((product) => {
    const pv = variants.filter((v) => v.productId === product.id).sort((a, b) => a.position - b.position).map((v) => ({ ...v, level: levels.get(v.id)! }));
    const onHand = pv.reduce((s, v) => s + v.level.onHand, 0);
    const reserved = pv.reduce((s, v) => s + v.level.reserved, 0);
    return { product, variants: pv, packs: packs.filter((p) => p.productId === product.id), onHand, reserved, available: Math.max(0, onHand - reserved) };
  });
}

async function hydrate(db: Database, rows: { product: typeof products.$inferSelect; storeProduct: typeof storeProducts.$inferSelect }[]): Promise<StoreCatalogItem[]> {
  const ids = rows.map((r) => r.product.id);
  if (ids.length === 0) return [];
  const variants = await db.select().from(productVariants).where(inArray(productVariants.productId, ids));
  const levels = await getLevels(db, variants.map((v) => v.id));
  const packs = await db.select().from(productPacks).where(inArray(productPacks.productId, ids));
  const packItems = packs.length ? await db.select().from(productPackItems).where(inArray(productPackItems.packId, packs.map((p) => p.id))) : [];
  const variantById = new Map(variants.map((v) => [v.id, v]));
  const tierMap = await loadTiers(db, [...new Set(rows.map((r) => r.storeProduct.storeId))], ids);

  return rows.map(({ product, storeProduct }) => {
    const pv = variants.filter((v) => v.productId === product.id).sort((a, b) => a.position - b.position).map((v) => ({ ...v, level: levels.get(v.id)! }));
    const pp = packs
      .filter((p) => p.productId === product.id)
      .map((p) => {
        const items = packItems.filter((i) => i.packId === p.id).map((i) => ({ variantId: i.variantId, size: variantById.get(i.variantId)?.size ?? "?", quantity: i.quantity }));
        const available = items.length ? Math.min(...items.map((i) => Math.floor((levels.get(i.variantId)?.available ?? 0) / i.quantity))) : 0;
        return { ...p, items, available };
      });
    return { product, storeProduct, variants: pv, packs: pp, tiers: (tierMap.get(`${storeProduct.storeId}:${product.id}`) ?? []).sort((a, b) => a.minQty - b.minQty) };
  });
}

export async function getStoreCatalogItem(db: Database, storeId: string, productSlug: string): Promise<StoreCatalogItem | null> {
  const all = await listStoreCatalog(db, storeId);
  return all.find((i) => i.product.slug === productSlug) ?? null;
}

/** Estoque mínimo por tamanho definido pelo fornecedor (padrão 4) para as lojas ativarem um produto. */
export async function getMinActivationStock(db: Database, supplierId: string): Promise<number> {
  const ops = await db.query.supplierOps.findFirst({ where: (o, { eq }) => eq(o.supplierId, supplierId) });
  return ops?.minActivationStock ?? 4;
}

/** Confere se o produto tem, em todos os tamanhos, ao menos o mínimo de peças disponíveis. */
export async function checkProductActivation(db: Database, productId: string): Promise<ActivationCheck> {
  const product = await db.query.products.findFirst({ where: eq(products.id, productId) });
  if (!product) return { ok: false, min: 0, short: [] };
  const min = await getMinActivationStock(db, product.supplierId);
  const variants = await db.select().from(productVariants).where(eq(productVariants.productId, productId));
  const levels = await getLevels(db, variants.map((v) => v.id));
  return activationCheck(variants.map((v) => ({ size: v.size, available: levels.get(v.id)?.available ?? 0 })), min);
}


/**
 * A loja só lista produto ativo do catálogo da sua própria rede (ou da sua Central, na conta simples) e,
 * quando a distribuição é "lojas selecionadas", só se tiver acesso concedido. Nunca de outro fornecedor.
 */
export async function assertProductListable(db: Database, storeId: string, product: typeof products.$inferSelect | undefined | null): Promise<void> {
  if (!product || product.status !== "ACTIVE") throw new NotFoundError("Produto indisponível.");
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  const network = store ? await db.query.networks.findFirst({ where: (n, { eq }) => eq(n.id, store.networkId) }) : null;
  if (!network || product.supplierId !== network.supplierId) throw new NotFoundError("Produto indisponível.");
  if (product.distribution === "SELECTED_STORES") {
    const access = await db.query.productStoreAccess.findFirst({ where: and(eq(productStoreAccess.productId, product.id), eq(productStoreAccess.storeId, storeId)) });
    if (!access) throw new ForbiddenError("Este produto não está distribuído para sua loja.");
  }
}

/**
 * Piso de preço do fornecedor no servidor: a unidade não pode ficar abaixo de `minimumPriceCents` e a grade não pode ficar
 * abaixo do maior piso entre as grades do produto (Constituição art. 10; 02 §73).
 */
export async function assertListingPrices(db: Database, product: Pick<typeof products.$inferSelect, "id" | "minimumPriceCents">, prices: { priceCents: number; packPriceCents?: number | null }): Promise<void> {
  if (prices.priceCents < product.minimumPriceCents) throw new DomainError("BELOW_MINIMUM", "Preço abaixo do mínimo definido pelo fornecedor.");
  if (prices.packPriceCents === null || prices.packPriceCents === undefined) return;
  const packs = await db.select({ minimumPriceCents: productPacks.minimumPriceCents }).from(productPacks).where(eq(productPacks.productId, product.id));
  const packMinimum = packs.reduce((max, p) => Math.max(max, p.minimumPriceCents), 0);
  if (packMinimum > 0 && prices.packPriceCents < packMinimum) throw new DomainError("BELOW_MINIMUM", "Preço da grade abaixo do mínimo definido pelo fornecedor.");
}
