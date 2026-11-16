import { getDb } from "@/db/client";
import { listarPaginas } from "@/lib/business/paginas";
import { lojaFechadaNaVitrine } from "@/lib/business/vitrine";
import { getStorefront, getStorefrontCatalog } from "@/lib/queries/storefront";
import { storeOrigin } from "@/lib/storefront-seo";

export const dynamic = "force-dynamic";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** sitemap.xml da loja: início, catálogo e os produtos ativos. Loja não publicada não lista nada. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sf = await getStorefront(slug);
  if (!sf || !sf.store.publishedAt || sf.store.showcaseTheme) return new Response("Não encontrado", { status: 404 });
  const o = await storeOrigin(sf.store);
  // Páginas livres do site (NB2, D307): publicadas, não arquivadas e marcadas para indexar (campanha fica fora).
  const paginas = (await listarPaginas(await getDb(), sf.store.id)).filter((p) => p.published && !p.arquivadaEm && p.indexar).map((p) => `${o}/${p.slug}`);
  // NB1 (D306): negócio no caminho Site, sem loja, lista só o início (catálogo e produtos não existem na vitrine).
  if (await lojaFechadaNaVitrine(sf.store.id)) return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${esc(o)}</loc></url>\n${paginas.map((u) => `  <url><loc>${esc(u)}</loc></url>\n`).join("")}</urlset>\n`, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
  const products = await getStorefrontCatalog(sf.store.id);
  const urls = [o, ...paginas, `${o}/catalog`, ...products.map((c) => `${o}/product/${c.product.slug}`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
