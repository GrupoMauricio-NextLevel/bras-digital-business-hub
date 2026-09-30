import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { getStorefront, getStorefrontCatalog, toPublicProduct } from "@/lib/queries/storefront";
import { isPreviewMode } from "@/lib/themes/preview";
import { resolveGlobals, resolveTemplate } from "@/lib/themes/store";
import { defaultTemplate, normalizeTemplate, planProducts } from "@/lib/themes/template";
import { SectionList } from "@/components/storefront/sections";

/** Página inicial da loja: desenhada pelas seções do modelo publicado (ou do rascunho, na prévia do editor). */
export default async function StoreHome({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ theme?: string }> }) {
  const { slug } = await params;
  const { theme } = await searchParams;
  const sf = await getStorefront(slug);
  if (!sf) notFound();
  const db = await getDb();
  const preview = await isPreviewMode(sf.store.id);
  // "?theme=" só mostra como ficaria outro tema (a Loja de temas); o tema ativo não muda.
  const trying = theme && theme !== sf.themeKey ? theme : null;
  const template = trying ? normalizeTemplate(defaultTemplate("home", sf.settings, trying), "content", "home").template : (await resolveTemplate(db, sf.store, "home", { draft: preview, themeKey: sf.themeKey })).template;
  const { globals } = await resolveGlobals(db, sf.store, { draft: preview });
  const catalog = await getStorefrontCatalog(sf.store.id);
  const catName = new Map(sf.categories.map((c) => [c.id, c.name]));
  const products = catalog.map((c) => toPublicProduct(c, c.product.categoryId ? catName.get(c.product.categoryId) : undefined));
  const { lists, hero } = planProducts(template, products);
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      {trying ? <div className="mt-4 rounded-md bg-neutral-100 px-3 py-2 text-center text-xs text-neutral-600">Pré-visualizando o tema <b className="capitalize">{trying}</b>. Seu tema ativo continua sendo <b className="capitalize">{sf.themeKey}</b>.</div> : null}
      <SectionList template={template} ctx={{ slug, base: `/store/${slug}`, store: sf.store, categories: sf.categories, products, planned: lists, hero, globals }} />
    </div>
  );
}
