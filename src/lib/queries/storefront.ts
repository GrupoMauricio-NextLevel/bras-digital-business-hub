import { eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db/client";
import { categories, storeThemes, stores, themeSettings, themes, type Store } from "@/db/schema";
import { resolveGlobals } from "@/lib/themes/store";
import { listStoreCatalog, type StoreCatalogItem } from "@/lib/domain/catalog";
import { canUse } from "@/lib/features";
import { defaultThemeSettings } from "./merchant";

export type StorefrontContext = {
  store: typeof stores.$inferSelect;
  settings: ReturnType<typeof defaultThemeSettings>;
  themeKey: string;
  categories: { id: string; name: string; slug: string }[];
};

export const getStorefront = cache(async (slug: string): Promise<StorefrontContext | null> => {
  const db = (await getDb());
  const store = await db.query.stores.findFirst({ where: eq(stores.slug, slug) });
  if (!store || !canUse(store.offer, "storefront")) return null; // Drop manual não tem vitrine pública
  // L5 (D246): leituras independentes juntas; o catálogo é o mesmo da página (cache da requisição, lido uma vez só).
  const [settings, theme, catalog] = await Promise.all([
    db.query.themeSettings.findFirst({ where: eq(themeSettings.storeId, store.id) }),
    db.select({ key: themes.key }).from(storeThemes).innerJoin(themes, eq(themes.id, storeThemes.themeId)).where(eq(storeThemes.storeId, store.id)).limit(1),
    getStorefrontCatalog(store.id),
  ]);
  const catIds = [...new Set(catalog.map((c) => c.product.categoryId).filter((x): x is string => !!x))];
  const cats = catIds.length ? await db.select().from(categories).where(inArray(categories.id, catIds)) : [];
  return { store, settings: settings?.settings ?? defaultThemeSettings(), themeKey: theme[0]?.key ?? "starter", categories: cats };
});

/** Estilo e cabeçalho/rodapé da loja, lido uma vez por requisição (layout e página usam o mesmo; L5, D246). */
export const getStorefrontGlobals = cache(async (store: Store, draft: boolean) => (await resolveGlobals(await getDb(), store, { draft })).globals);

export const getStorefrontCatalog = cache(async (storeId: string): Promise<StoreCatalogItem[]> => {
  return listStoreCatalog((await getDb()), storeId);
});

/** Item serializável para client components. */
export function toPublicProduct(item: StoreCatalogItem, categoryName?: string) {
  const available = item.variants.reduce((s, v) => s + v.level.available, 0);
  return {
    id: item.product.id,
    slug: item.product.slug,
    name: item.product.name,
    description: item.product.description,
    seoTitle: item.product.seoTitle,
    seoDescription: item.product.seoDescription,
    images: item.product.images,
    categoryId: item.product.categoryId,
    categoryName: categoryName ?? "",
    priceCents: item.storeProduct.priceCents,
    packPriceCents: item.storeProduct.packPriceCents,
    tiers: item.tiers,
    featured: item.storeProduct.featured,
    sellsUnit: item.product.sellsUnit,
    sellsPack: item.product.sellsPack,
    available,
    variants: item.variants.map((v) => ({ id: v.id, size: v.size, available: v.level.available })),
    packs: item.packs.map((p) => ({ id: p.id, name: p.name, totalQuantity: p.totalQuantity, available: p.available, priceCents: item.storeProduct.packPriceCents ?? p.suggestedPriceCents, items: p.items })),
  };
}
export type PublicProduct = ReturnType<typeof toPublicProduct>;

/**
 * Seleção por SKU (links de campanha: `/catalog?produtos=SKU1,SKU2`): ids dos produtos da loja com esses SKUs, na ordem
 * pedida. SKU que a loja não tem é ignorado (nunca inventa produto); no máximo 50 por link.
 */
export function idsBySkus(catalog: { product: { id: string; sku: string } }[], raw: string | undefined): string[] | null {
  const skus = (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 50);
  if (!skus.length) return null;
  const bySku = new Map(catalog.map((c) => [c.product.sku.toUpperCase(), c.product.id]));
  return skus.map((s) => bySku.get(s.toUpperCase())).filter((x): x is string => !!x);
}
