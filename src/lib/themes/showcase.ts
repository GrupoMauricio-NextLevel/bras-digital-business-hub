import { randomBytes } from "node:crypto";
import { and, eq, isNotNull } from "drizzle-orm";
import type { Database } from "@/db/client";
import { storeProducts, stores, themeTemplates, users } from "@/db/schema";
import { actorFromUser } from "@/lib/domain/access";
import { catalogSupplierId } from "@/lib/domain/independent";
import { createProduct } from "@/lib/domain/products";
import { signupMember } from "@/lib/domain/store-access";
import { THEME_CATALOG } from "./catalog";
import { applyThemeToStore, presetContextFor } from "./install";
import { buildPreset } from "./presets";
import { normalizeTemplate, sameTemplate } from "./template";
import { PAGE_KINDS } from "./types";

/**
 * Lojas de demonstração dos temas (uma por tema): lojas de verdade, mas fictícias, com o tema instalado. Servem à página
 * pública de temas e ao link de demonstração. Regras: nunca recebem pedido (createOrder recusa), não têm dono com acesso
 * (usuário desativado), não aparecem nas contagens do Master e não são indexadas. Idempotentes e só criam o que falta.
 */
export const showcaseSlug = (themeKey: string) => `demo-${themeKey}`;
const IMG = (n: string) => `/portal/commerce/${n}.webp`;
const FAR = "2099-12-31T00:00:00.000Z";

type Item = { name: string; sku: string; price: number; photo: string; category: string; featured?: boolean };
type ShowcaseSet = { products: Item[]; images: { hero: string; about: string } };
/** Produtos de exemplo, com fotos do acervo do repositório. Os preços são ilustrativos. */
const MODA: ShowcaseSet = {
  images: { hero: IMG("moda-hero-wide"), about: IMG("moda-2") },
  products: [
    { name: "Conjunto de moletom amarelo", sku: "EX-01", price: 24990, photo: "moda-hero", category: "Roupas", featured: true },
    { name: "Jaqueta de couro sintético", sku: "EX-02", price: 28990, photo: "moda-3", category: "Roupas", featured: true },
    { name: "Poncho de tricô cru", sku: "EX-03", price: 17990, photo: "moda-1", category: "Roupas", featured: true },
    { name: "Terno azul xadrez", sku: "EX-04", price: 54990, photo: "moda-5", category: "Roupas" },
    { name: "Camiseta verde-musgo", sku: "EX-05", price: 7990, photo: "moda-2", category: "Roupas" },
    { name: "Bolsa estruturada vermelha", sku: "EX-06", price: 32990, photo: "ace-1", category: "Bolsas", featured: true },
    { name: "Bolsa de palha laranja", sku: "EX-07", price: 26990, photo: "ace-2", category: "Bolsas" },
    { name: "Mochila azul urbana", sku: "EX-08", price: 19990, photo: "ace-5", category: "Bolsas" },
    { name: "Brincos dourados trançados", sku: "EX-09", price: 8990, photo: "ace-3", category: "Acessórios e calçados" },
    { name: "Carteira de couro marrom", sku: "EX-10", price: 11990, photo: "ace-4", category: "Acessórios e calçados" },
    { name: "Sandálias de salto bloco", sku: "EX-11", price: 21990, photo: "moda-4", category: "Acessórios e calçados" },
    { name: "Fones de ouvido sem fio", sku: "EX-12", price: 15990, photo: "ace-6", category: "Acessórios e calçados" },
  ],
};
const CASA: ShowcaseSet = {
  images: { hero: IMG("casa-hero-wide"), about: IMG("casa-3") },
  products: [
    { name: "Sofá de veludo verde", sku: "EX-01", price: 289900, photo: "casa-1", category: "Sofás", featured: true },
    { name: "Sofá de couro caramelo", sku: "EX-02", price: 349900, photo: "casa-2", category: "Sofás", featured: true },
    { name: "Sofá laranja com almofada", sku: "EX-03", price: 259900, photo: "casa-3", category: "Sofás", featured: true },
    { name: "Poltrona amarela", sku: "EX-04", price: 119900, photo: "casa-hero", category: "Cadeiras e poltronas", featured: true },
    { name: "Cadeira estofada cinza", sku: "EX-05", price: 49900, photo: "casa-4", category: "Cadeiras e poltronas" },
    { name: "Banco alto de madeira", sku: "EX-06", price: 29900, photo: "casa-5", category: "Cadeiras e poltronas" },
  ],
};
const SET_OF: Record<string, ShowcaseSet> = { ninho: CASA };
const setOf = (themeKey: string) => SET_OF[themeKey] ?? MODA;
export const SHOWCASE_PRODUCTS = MODA.products;
/** Logo de cada tema (arquivo em public/temas); temas sem logo usam só o texto. */
const LOGO: Record<string, string> = { lume: "/temas/lume-logo.svg", ninho: "/temas/ninho-logo.svg" };
export const themeLogo = (key: string): string | null => LOGO[key] ?? null;

async function createShowcaseStore(db: Database, themeKey: string, themeName: string) {
  const email = `demo-${themeKey}@demonstracao.nextlevel.invalid`;
  const r = await signupMember(db, { storeName: "Loja Exemplo", ownerName: `Demonstração ${themeName}`, email, password: randomBytes(24).toString("base64url"), taxId: "111.444.777-35", offer: "STORE_SUBDOMAIN", independent: true, brand: "NEXTLEVEL_COMMERCE" });
  const owner = actorFromUser((await db.query.users.findFirst({ where: eq(users.id, r.userId) }))!);
  const supplierId = await catalogSupplierId(db, owner);
  for (const p of setOf(themeKey).products) {
    const { productId } = await createProduct(db, supplierId, { name: p.name, sku: p.sku, description: "Produto de exemplo, usado só para mostrar como o tema fica.", categoryName: p.category, images: [IMG(p.photo)], costCents: Math.round(p.price * 0.4), suggestedPriceCents: p.price, minimumPriceCents: Math.round(p.price * 0.6), sizes: [{ size: "M", initialStock: 40 }, { size: "G", initialStock: 40 }] });
    await db.insert(storeProducts).values({ storeId: r.storeId, productId, priceCents: p.price, packPriceCents: null, active: true, featured: !!p.featured });
  }
  // Sem dono com acesso; a loja fica fora das contagens (CLOSED) mas aparece na vitrine pública pelo marcador de demonstração.
  await db.update(users).set({ disabledAt: new Date().toISOString() }).where(eq(users.id, r.userId));
  await db.update(stores).set({ slug: showcaseSlug(themeKey), showcaseTheme: themeKey, status: "CLOSED", publishedAt: new Date().toISOString(), paidUntil: FAR, trialEndsAt: null, tagline: `Demonstração do tema ${themeName}`, logoText: "EX", logoUrl: themeLogo(themeKey), updatedAt: new Date().toISOString() }).where(eq(stores.id, r.storeId));
  return r.storeId;
}

/** Cria o que falta e deixa cada loja de demonstração com o visual atual do tema. Devolve o que mudou. */
export async function ensureShowcaseStores(db: Database, now = new Date()): Promise<string[]> {
  const log: string[] = [];
  for (const info of THEME_CATALOG) {
    let store = await db.query.stores.findFirst({ where: and(eq(stores.showcaseTheme, info.key), isNotNull(stores.showcaseTheme)) });
    if (!store) { const id = await createShowcaseStore(db, info.key, info.name); store = (await db.query.stores.findFirst({ where: eq(stores.id, id) }))!; log.push(`loja de demonstração do tema ${info.key} criada`); }
    const { ctx } = await presetContextFor(db, store, now);
    const preset = buildPreset(info.key, { ...ctx, images: setOf(info.key).images });
    const rows = await db.select().from(themeTemplates).where(eq(themeTemplates.storeId, store.id));
    const upToDate = !!preset && PAGE_KINDS.every((page) => { const r = rows.find((x) => x.page === page); return !!r?.published && sameTemplate(normalizeTemplate(r.published, "content", page).template, normalizeTemplate(preset.pages[page], "content", page).template); });
    if (!upToDate) { await applyThemeToStore(db, store, info.key, store.id, now, setOf(info.key).images); log.push(`tema ${info.key} aplicado na loja de demonstração`); }
  }
  return log;
}
