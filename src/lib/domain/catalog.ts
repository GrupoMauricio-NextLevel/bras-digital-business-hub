import { and, eq, inArray, or, exists } from "drizzle-orm";
import type { Database } from "@/db/client";
import { productChannels, productPackItems, productPacks, productStoreAccess, productVariants, products, storeProducts, stores } from "@/db/schema";
import { getLevels, type InventoryLevel } from "./inventory";

export type StoreCatalogItem = {
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
    exists(
      db.select()
        .from(productChannels)
        .where(and(
          eq(productChannels.productId, products.id),
          eq(productChannels.area, "SUPERDROP"),
          eq(productChannels.active, true),
        )),
    ),
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

  return rows.map(({ product, storeProduct }) => {
    const pv = variants.filter((v) => v.productId === product.id).sort((a, b) => a.position - b.position).map((v) => ({ ...v, level: levels.get(v.id)! }));
    const pp = packs
      .filter((p) => p.productId === product.id)
      .map((p) => {
        const items = packItems.filter((i) => i.packId === p.id).map((i) => ({ variantId: i.variantId, size: variantById.get(i.variantId)?.size ?? "?", quantity: i.quantity }));
        const available = items.length ? Math.min(...items.map((i) => Math.floor((levels.get(i.variantId)?.available ?? 0) / i.quantity))) : 0;
        return { ...p, items, available };
      });
    return { product, storeProduct, variants: pv, packs: pp };
  });
}

export async function getStoreCatalogItem(db: Database, storeId: string, productSlug: string): Promise<StoreCatalogItem | null> {
  const all = await listStoreCatalog(db, storeId);
  return all.find((i) => i.product.slug === productSlug) ?? null;
}
