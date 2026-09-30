import { notFound } from "next/navigation";
import { SectionList } from "@/components/storefront/sections";
import { getDb } from "@/db/client";
import { getStorefront, getStorefrontCatalog, toPublicProduct } from "@/lib/queries/storefront";
import { isPreviewMode } from "@/lib/themes/preview";
import { resolveGlobals, resolveTemplate } from "@/lib/themes/store";
import { defaultTemplate, normalizeTemplate, planProducts } from "@/lib/themes/template";
import type { PageKind } from "@/lib/themes/types";

/** Espaçamento externo de cada página (o mesmo que as páginas tinham antes dos modelos). */
const WRAP: Record<PageKind, string> = { home: "mx-auto max-w-6xl px-4 pb-16 sm:px-6", product: "mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10", collection: "mx-auto max-w-6xl px-4 py-8 sm:px-6", cart: "" };

/**
 * Monta uma página da loja a partir do modelo (publicado, ou o rascunho na prévia do dono),
 * com os produtos já repartidos entre as seções.
 */
export async function StorePage({ slug, page, productSlug, query, themeParam }: { slug: string; page: PageKind; productSlug?: string; query?: { category?: string; q?: string; sort?: string }; themeParam?: string }) {
  const sf = await getStorefront(slug);
  if (!sf) notFound();
  const db = await getDb();
  const preview = await isPreviewMode(sf.store.id);
  // "?theme=" só mostra como ficaria outro tema; o tema ativo não muda.
  const trying = themeParam && themeParam !== sf.themeKey ? themeParam : null;
  const template = trying ? normalizeTemplate(defaultTemplate(page, sf.settings, trying), "content", page).template : (await resolveTemplate(db, sf.store, page, { draft: preview, themeKey: sf.themeKey })).template;
  const { globals } = await resolveGlobals(db, sf.store, { draft: preview });
  const catalog = await getStorefrontCatalog(sf.store.id);
  const catName = new Map(sf.categories.map((c) => [c.id, c.name]));
  const all = catalog.map((c) => toPublicProduct(c, c.product.categoryId ? catName.get(c.product.categoryId) : undefined));

  let products = all; let product; let related;
  if (page === "product") {
    product = all.find((p) => p.slug === productSlug);
    if (!product) notFound();
    related = all.filter((p) => p.id !== product!.id && p.categoryId === product!.categoryId).slice(0, 8);
  }
  if (page === "collection") {
    const cat = sf.categories.find((c) => c.slug === query?.category);
    products = all.filter((p) => (!cat || p.categoryId === cat.id) && (!query?.q || p.name.toLowerCase().includes(query.q.toLowerCase())));
    const sort = query?.sort;
    if (sort === "price-asc") products = [...products].sort((a, b) => a.priceCents - b.priceCents);
    else if (sort === "price-desc") products = [...products].sort((a, b) => b.priceCents - a.priceCents);
    else if (sort === "name") products = [...products].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    else if (sort === "newest") products = [...products].reverse();
  }
  const { lists, hero } = planProducts(template, products);
  return (
    <div className={WRAP[page]}>
      {trying ? <div className="mt-4 rounded-md bg-neutral-100 px-3 py-2 text-center text-xs text-neutral-600">Pré-visualizando o tema <b className="capitalize">{trying}</b>. Seu tema ativo continua sendo <b className="capitalize">{sf.themeKey}</b>.</div> : null}
      <SectionList animate={globals.style.animations} template={template} ctx={{ slug, base: `/store/${slug}`, store: sf.store, categories: sf.categories, products, planned: lists, hero, globals, page, product, related, query }} />
    </div>
  );
}
