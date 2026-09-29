import { eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db/client";
import { categories, storeThemes, stores, themeSettings, themes } from "@/db/schema";
import { listStoreCatalog, type StoreCatalogItem } from "@/lib/domain/catalog";
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
  if (!store) return null;
  const settings = await db.query.themeSettings.findFirst({ where: eq(themeSettings.storeId, store.id) });
  const theme = await db.select({ key: themes.key }).from(storeThemes).innerJoin(themes, eq(themes.id, storeThemes.themeId)).where(eq(storeThemes.storeId, store.id)).limit(1);
  const catalog = await listStoreCatalog(db, store.id);
  const catIds = [...new Set(catalog.map((c) => c.product.categoryId).filter((x): x is string => !!x))];
  const cats = catIds.length ? await db.select().from(categories).where(inArray(categories.id, catIds)) : [];
  return { store, settings: settings?.settings ?? defaultThemeSettings(), themeKey: theme[0]?.key ?? "starter", categories: cats };
});

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
    images: item.product.images,
    categoryId: item.product.categoryId,
    categoryName: categoryName ?? "",
    priceCents: item.storeProduct.priceCents,
    packPriceCents: item.storeProduct.packPriceCents,
    featured: item.storeProduct.featured,
    sellsUnit: item.product.sellsUnit,
    sellsPack: item.product.sellsPack,
    available,
    variants: item.variants.map((v) => ({ id: v.id, size: v.size, available: v.level.available })),
    packs: item.packs.map((p) => ({ id: p.id, name: p.name, totalQuantity: p.totalQuantity, available: p.available, priceCents: item.storeProduct.packPriceCents ?? p.suggestedPriceCents, items: p.items })),
  };
}
export type PublicProduct = ReturnType<typeof toPublicProduct>;
