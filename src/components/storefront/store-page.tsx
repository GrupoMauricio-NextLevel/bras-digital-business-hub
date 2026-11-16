import { notFound } from "next/navigation";
import { lojaFechadaNaVitrine } from "@/lib/business/vitrine";
import { menuDoSite, paginaPublica } from "@/lib/business/paginas";
import { servicosPublicos } from "@/lib/business/servicos";
import { escolherRelacionados } from "@/lib/domain/venda-junto";
import { SectionList } from "@/components/storefront/sections";
import { getDb } from "@/db/client";
import { getStorefront, getStorefrontCatalog, getStorefrontGlobals, idsBySkus, toPublicProduct } from "@/lib/queries/storefront";
import { isPreviewMode } from "@/lib/themes/preview";
import { tryingTheme } from "@/lib/themes/try";
import { resolveTemplate } from "@/lib/themes/store";
import { planProducts } from "@/lib/themes/template";
import { welcomeOffer } from "@/lib/domain/welcome-coupon";
import type { PageKind } from "@/lib/themes/types";
import { brandCodeOfStore } from "@/lib/store-brand";

/** Espaçamento externo de cada página (o mesmo que as páginas tinham antes dos modelos). */
const WRAP: Record<PageKind, string> = { home: "mx-auto max-w-6xl px-4 pb-16 sm:px-6", product: "mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10", collection: "mx-auto max-w-6xl px-4 py-8 sm:px-6", cart: "mx-auto max-w-6xl px-4 pb-12 sm:px-6" };

/**
 * Monta uma página da loja a partir do modelo (publicado, ou o rascunho na prévia do dono),
 * com os produtos já repartidos entre as seções.
 */
export async function StorePage({ slug, page, productSlug, query, pagina }: { slug: string; page: PageKind; productSlug?: string; query?: { category?: string; q?: string; sort?: string; produtos?: string }; /** Página livre do site (NB2, D307): endereço `/<slug>`; desenhada como página inicial. */ pagina?: string }) {
  const sf = await getStorefront(slug);
  if (!sf) notFound();
  // NB1 (D306): negócio no caminho Site, sem o módulo Loja, não tem catálogo, produto nem carrinho na vitrine.
  const semLoja = await lojaFechadaNaVitrine(sf.store.id);
  if (page !== "home" && semLoja) notFound();
  const db = await getDb();
  // Página livre (NB2, D307): publicada para o visitante; o rascunho só na prévia do dono.
  const livre = pagina ? await paginaPublica(db, sf.store.id, pagina, { previa: await isPreviewMode(sf.store.id) }) : null;
  if (pagina && !livre) notFound();
  // Teste de tema ("ver com seus produtos"): só o dono vê, nada é gravado. L5 (D246): leituras independentes juntas.
  const [preview, trial, catalog, brandCode] = await Promise.all([
    isPreviewMode(sf.store.id), tryingTheme(db, sf.store), getStorefrontCatalog(sf.store.id),
    page === "product" || page === "cart" ? brandCodeOfStore(db, sf.store) : Promise.resolve(undefined), // carrinho (D213): barra de frete grátis só na Commerce
  ]);
  const [template, globals] = trial && !livre ? [trial.preset.pages[page], trial.preset.globals] : await Promise.all([
    livre ? Promise.resolve(livre.modelo) : resolveTemplate(db, sf.store, page, { draft: preview, themeKey: sf.themeKey }).then((r) => r.template),
    getStorefrontGlobals(sf.store, preview),
  ]);
  const catName = new Map(sf.categories.map((c) => [c.id, c.name]));
  const all = catalog.map((c) => toPublicProduct(c, c.product.categoryId ? catName.get(c.product.categoryId) : undefined));

  let products = all; let product; let related; let categoryId: string | null = null;
  if (page === "product") {
    product = all.find((p) => p.slug === productSlug);
    if (!product) notFound();
    // "Compre junto" (D186): os relacionados escolhidos pela loja primeiro, depois os da mesma categoria.
    const escolhidos = catalog.find((c) => c.product.id === product!.id)?.storeProduct.relatedIds ?? [];
    related = escolherRelacionados(all, product, escolhidos, 8);
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
  // NextLevel Business (NB2, D307): serviços só quando a página usa a seção; menu do site para quem não tem loja.
  const servicos = Object.values(template.sections).some((x) => (x.type === "services-grid" || x.type === "lead-form") && !x.hidden) ? await servicosPublicos(db, sf.store.id) : undefined;
  const menuSite = semLoja ? (await menuDoSite(db, sf.store.id)).map((m) => ({ label: m.label, href: `/store/${slug}/${m.slug}` })) : undefined;
  // Cupom de boas-vindas: a janela só aparece se o cupom configurado existe e vale agora (o código não vai para a página).
  const wc = page === "home" ? Object.values(template.sections).find((x) => x.type === "welcome-coupon" && !x.hidden) : undefined;
  const welcome = wc && typeof wc.settings.code === "string" && wc.settings.code ? await welcomeOffer(db, sf.store.id, wc.settings.code) : null;
  return (
    <div className={WRAP[page]}>
      <SectionList animate={globals.style.animations} template={template} ctx={{ servicos, semLoja, menuSite, slug, base: `/store/${slug}`, store: sf.store, brandCode, categories: sf.categories, products, planned: lists, hero, globals, page, product, related, query, now: new Date(), categoryId, editing: preview || !!trial, welcome }} />
    </div>
  );
}
