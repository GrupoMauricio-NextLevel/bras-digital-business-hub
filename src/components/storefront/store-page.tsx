import { notFound } from "next/navigation";
import { SectionList } from "@/components/storefront/sections";
import { getDb } from "@/db/client";
import { getStorefront, getStorefrontCatalog, idsBySkus, toPublicProduct } from "@/lib/queries/storefront";
import { isPreviewMode } from "@/lib/themes/preview";
import { tryingTheme } from "@/lib/themes/try";
import { resolveGlobals, resolveTemplate } from "@/lib/themes/store";
import { planProducts } from "@/lib/themes/template";
import { welcomeOffer } from "@/lib/domain/welcome-coupon";
import type { PageKind } from "@/lib/themes/types";

/** Espaçamento externo de cada página (o mesmo que as páginas tinham antes dos modelos). */
const WRAP: Record<PageKind, string> = { home: "mx-auto max-w-6xl px-4 pb-16 sm:px-6", product: "mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10", collection: "mx-auto max-w-6xl px-4 py-8 sm:px-6", cart: "" };

/**
 * Monta uma página da loja a partir do modelo (publicado, ou o rascunho na prévia do dono),
 * com os produtos já repartidos entre as seções.
 */
export async function StorePage({ slug, page, productSlug, query }: { slug: string; page: PageKind; productSlug?: string; query?: { category?: string; q?: string; sort?: string; produtos?: string } }) {
  const sf = await getStorefront(slug);
  if (!sf) notFound();
  const db = await getDb();
  const preview = await isPreviewMode(sf.store.id);
  // Teste de tema ("ver com seus produtos"): só o dono vê, nada é gravado.
  const trial = await tryingTheme(db, sf.store);
  const template = trial ? trial.preset.pages[page] : (await resolveTemplate(db, sf.store, page, { draft: preview, themeKey: sf.themeKey })).template;
  const globals = trial ? trial.preset.globals : (await resolveGlobals(db, sf.store, { draft: preview })).globals;
  const catalog = await getStorefrontCatalog(sf.store.id);
  const catName = new Map(sf.categories.map((c) => [c.id, c.name]));
  const all = catalog.map((c) => toPublicProduct(c, c.product.categoryId ? catName.get(c.product.categoryId) : undefined));

  let products = all; let product; let related; let categoryId: string | null = null;
  if (page === "product") {
    product = all.find((p) => p.slug === productSlug);
    if (!product) notFound();
    related = all.filter((p) => p.id !== product!.id && p.categoryId === product!.categoryId).slice(0, 8);
  }
  if (page === "collection") {
    const cat = sf.categories.find((c) => c.slug === query?.category); categoryId = cat?.id ?? null;
    products = all.filter((p) => (!cat || p.categoryId === cat.id) && (!query?.q || p.name.toLowerCase().includes(query.q.toLowerCase())));
    const picked = idsBySkus(catalog, query?.produtos);
    if (picked) products = picked.map((id) => products.find((p) => p.id === id)).filter((p): p is (typeof products)[number] => !!p);
    const sort = query?.sort;
    if (sort === "price-asc") products = [...products].sort((a, b) => a.priceCents - b.priceCents);
    else if (sort === "price-desc") products = [...products].sort((a, b) => b.priceCents - a.priceCents);
    else if (sort === "name") products = [...products].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    else if (sort === "newest") products = [...products].reverse();
  }
  const { lists, hero } = planProducts(template, products);
  // Cupom de boas-vindas: a janela só aparece se o cupom configurado existe e vale agora (o código não vai para a página).
  const wc = page === "home" ? Object.values(template.sections).find((x) => x.type === "welcome-coupon" && !x.hidden) : undefined;
  const welcome = wc && typeof wc.settings.code === "string" && wc.settings.code ? await welcomeOffer(db, sf.store.id, wc.settings.code) : null;
  return (
    <div className={WRAP[page]}>
      <SectionList animate={globals.style.animations} template={template} ctx={{ slug, base: `/store/${slug}`, store: sf.store, categories: sf.categories, products, planned: lists, hero, globals, page, product, related, query, now: new Date(), categoryId, editing: preview || !!trial, welcome }} />
    </div>
  );
}
