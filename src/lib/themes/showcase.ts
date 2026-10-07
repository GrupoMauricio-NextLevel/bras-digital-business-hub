import { randomBytes } from "node:crypto";
import { statSync } from "node:fs";
import { join } from "node:path";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import type { Database } from "@/db/client";
import { products, storeProducts, stores, themeTemplates, users } from "@/db/schema";
import { actorFromUser } from "@/lib/domain/access";
import { catalogSupplierId } from "@/lib/domain/independent";
import { createProduct } from "@/lib/domain/products";
import { signupMember } from "@/lib/domain/store-access";
import { hasPublicDemo, THEME_BY_KEY, THEME_CATALOG } from "./catalog";
import { brandLogo, categoryImages, slotImage } from "./pacotes";
import { demoFamilyOf, type AssetStatus, type DemoProduct, type FamilyAsset, type FamilyDemo } from "./families";
import { applyThemeToStore, presetContextFor } from "./install";
import { buildPreset, type PresetContext } from "./presets";
import { normalizeTemplate, sameTemplate } from "./template";
import { PAGE_KINDS } from "./types";

/**
 * Lojas de demonstração dos temas (uma por tema): lojas de verdade, mas fictícias, com o tema instalado. Regras de isolamento:
 * nunca recebem pedido (createOrder recusa; o checkout é simulado só no navegador), não têm dono com acesso (usuário desativado),
 * ficam fora das contagens do Master (CLOSED) e não são indexadas. Idempotentes: só criam/ajustam o que falta.
 * Dentro de uma família, todas as lojas usam os mesmos produtos e imagens (comparação justa entre níveis).
 */
export const showcaseSlug = (themeKey: string) => `demo-${themeKey}`;
const FAR = "2099-12-31T00:00:00.000Z";

const demoOf = (themeKey: string): FamilyDemo => demoFamilyOf(THEME_BY_KEY[themeKey]!.family)!;
/** Produtos de exemplo da família Moda (catálogo de referência das demonstrações). */
export const SHOWCASE_PRODUCTS = demoFamilyOf("moda")!.products;

/** Logo de cada tema (arquivo em public/temas); temas sem logo usam só o texto. */
const LOGO: Record<string, string> = { lume: "/temas/lume-logo.svg", ninho: "/temas/ninho-logo.svg" };
export const themeLogo = (key: string): string | null => LOGO[key] ?? null;
/** Logo da loja de demonstração: a da identidade da loja (pacote visual) quando existe; senão a do tema, ou só o nome. */
const demoLogo = (themeKey: string, demo: FamilyDemo) => brandLogo(demo.family) ?? themeLogo(themeKey);

const fileOk = (publicPath: string) => { try { return statSync(join(process.cwd(), "public", publicPath)).size > 0; } catch { return false; } };
/**
 * Imagem de uma posição do tema: a do pacote visual da loja (pacotes.ts) quando existe; senão a provisória declarada; senão
 * pendente (fundo nas cores do tema). Estado "integrado" = imagem real do pacote no lugar.
 */
export function resolveAsset(a: FamilyAsset): { image: string; imageMobile: string; alt: string; status: AssetStatus } {
  const pkg = slotImage(a.family, a.id);
  if (pkg && fileOk(pkg.image)) return { image: pkg.image, imageMobile: pkg.imageMobile && fileOk(pkg.imageMobile) ? pkg.imageMobile : "", alt: pkg.alt || a.alt, status: "integrado" };
  if (a.provisional) return { image: a.provisional, imageMobile: "", alt: a.alt, status: "provisório" };
  return { image: "", imageMobile: "", alt: a.alt, status: "pendente" };
}
const mediaOf = (d: FamilyDemo): NonNullable<PresetContext["media"]> => Object.fromEntries(d.assets.map((a) => { const r = resolveAsset(a); return [a.id, { image: r.image, imageMobile: r.imageMobile, alt: r.alt }]; }));
/** Fotos dos temas que ainda usam `images` (Starter, Signature, Arena): as da família da demonstração. */
const imagesOf = (d: FamilyDemo, m: NonNullable<PresetContext["media"]>) => ({ hero: m[`${d.family}-hero-1`]?.image || "", about: m[`${d.family}-sobre`]?.image || "" });
/** Fotos do produto: as do pacote visual (todas as existentes, a principal primeiro). */
export const productPhotos = (p: DemoProduct) => (p.photos.length ? p.photos : [p.photo]);

async function addProducts(db: Database, storeId: string, supplierId: string, list: DemoProduct[]) {
  for (const p of list) {
    const { productId } = await createProduct(db, supplierId, { name: p.name, sku: p.sku, description: p.description, categoryName: p.category, images: productPhotos(p), costCents: Math.round(p.price * 0.4), suggestedPriceCents: p.price, minimumPriceCents: Math.round(p.price * 0.6), sizes: p.variants.map((v) => ({ size: v, initialStock: p.soldOut ? 0 : 40 })) });
    await db.insert(storeProducts).values({ storeId, productId, priceCents: p.price, packPriceCents: null, active: true, featured: !!p.featured });
  }
}

async function createShowcaseStore(db: Database, themeKey: string, themeName: string, demo: FamilyDemo) {
  const email = `demo-${themeKey}@demonstracao.nextlevel.invalid`;
  const r = await signupMember(db, { storeName: demo.storeName, ownerName: `Demonstração ${themeName}`, email, password: randomBytes(24).toString("base64url"), taxId: "111.444.777-35", offer: "STORE_SUBDOMAIN", independent: true, brand: "NEXTLEVEL_COMMERCE" });
  const owner = actorFromUser((await db.query.users.findFirst({ where: eq(users.id, r.userId) }))!);
  await addProducts(db, r.storeId, await catalogSupplierId(db, owner), demo.products);
  // Sem dono com acesso; a loja fica fora das contagens (CLOSED) mas aparece na vitrine pública pelo marcador de demonstração.
  await db.update(users).set({ disabledAt: new Date().toISOString() }).where(eq(users.id, r.userId));
  await db.update(stores).set({ slug: showcaseSlug(themeKey), showcaseTheme: themeKey, status: "CLOSED", publishedAt: new Date().toISOString(), paidUntil: FAR, trialEndsAt: null, tagline: demo.tagline, logoText: demo.storeName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(), logoUrl: demoLogo(themeKey, demo), updatedAt: new Date().toISOString() }).where(eq(stores.id, r.storeId));
  return r.storeId;
}

/** Deixa o catálogo da demonstração igual ao da família (acrescenta o que falta, desativa o que saiu, ajusta destaque). */
async function syncProducts(db: Database, store: typeof stores.$inferSelect, demo: FamilyDemo): Promise<boolean> {
  const rows = await db.select({ productId: storeProducts.productId, active: storeProducts.active, featured: storeProducts.featured, sku: products.sku, images: products.images }).from(storeProducts).innerJoin(products, eq(products.id, storeProducts.productId)).where(eq(storeProducts.storeId, store.id));
  const want = new Map(demo.products.map((p) => [p.sku, p]));
  const missing = demo.products.filter((p) => !rows.some((r) => r.sku === p.sku));
  let changed = false;
  if (missing.length) {
    const owner = (await db.select().from(users).where(eq(users.organizationId, store.organizationId)))[0]!;
    await addProducts(db, store.id, await catalogSupplierId(db, actorFromUser(owner)), missing); changed = true;
  }
  for (const r of rows) {
    const p = want.get(r.sku);
    const active = !!p, featured = !!p?.featured;
    // Foto final entregue pelo dono troca a provisória sem recriar o produto.
    if (p && JSON.stringify(r.images) !== JSON.stringify(productPhotos(p))) { await db.update(products).set({ images: productPhotos(p) }).where(eq(products.id, r.productId)); changed = true; }
    if (r.active !== active || r.featured !== featured) { await db.update(storeProducts).set({ active, featured }).where(and(eq(storeProducts.storeId, store.id), eq(storeProducts.productId, r.productId))); changed = true; }
  }
  const logo = demoLogo(store.showcaseTheme ?? "", demo);
  if (store.name !== demo.storeName || store.tagline !== demo.tagline || store.logoUrl !== logo) { await db.update(stores).set({ name: demo.storeName, tagline: demo.tagline, logoUrl: logo, logoText: demo.storeName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(), updatedAt: new Date().toISOString() }).where(eq(stores.id, store.id)); changed = true; }
  return changed;
}

/** Cria o que falta e deixa cada loja de demonstração com o catálogo da família e o visual atual do tema. */
export async function ensureShowcaseStores(db: Database, now = new Date()): Promise<string[]> {
  const log: string[] = [];
  for (const info of THEME_CATALOG.filter(hasPublicDemo)) {
    const demo = demoOf(info.key);
    let store = await db.query.stores.findFirst({ where: and(eq(stores.showcaseTheme, info.key), isNotNull(stores.showcaseTheme)) });
    if (!store) { const id = await createShowcaseStore(db, info.key, info.name, demo); store = (await db.query.stores.findFirst({ where: eq(stores.id, id) }))!; log.push(`loja de demonstração do tema ${info.key} criada`); }
    else if (await syncProducts(db, store, demo)) { store = (await db.query.stores.findFirst({ where: eq(stores.id, store.id) }))!; log.push(`catálogo da demonstração ${info.key} ajustado`); }
    const media = mediaOf(demo);
    const cats = await demoCategories(db, store.id);
    const extra = { images: imagesOf(demo, media), media, categories: cats, categoryImages: categoryImages(demo.family) };
    const { ctx } = await presetContextFor(db, store, now);
    const preset = buildPreset(info.key, { ...ctx, ...extra });
    const rows = await db.select().from(themeTemplates).where(eq(themeTemplates.storeId, store.id));
    const upToDate = !!preset && PAGE_KINDS.every((page) => { const r = rows.find((x) => x.page === page); return !!r?.published && sameTemplate(normalizeTemplate(r.published, "content", page).template, normalizeTemplate(preset.pages[page], "content", page).template); });
    if (!upToDate) { await applyThemeToStore(db, store, info.key, store.id, now, extra.images, extra); log.push(`tema ${info.key} aplicado na loja de demonstração`); }
  }
  return log;
}

/** Categorias com produto ativo na loja (para o menu grande do N4). */
async function demoCategories(db: Database, storeId: string) {
  const { categories } = await import("@/db/schema");
  const rows = await db.select({ categoryId: products.categoryId }).from(storeProducts).innerJoin(products, eq(products.id, storeProducts.productId)).where(and(eq(storeProducts.storeId, storeId), eq(storeProducts.active, true)));
  const ids = [...new Set(rows.map((r) => r.categoryId).filter((x): x is string => !!x))];
  if (!ids.length) return [];
  return (await db.select({ name: categories.name, slug: categories.slug }).from(categories).where(inArray(categories.id, ids))).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
