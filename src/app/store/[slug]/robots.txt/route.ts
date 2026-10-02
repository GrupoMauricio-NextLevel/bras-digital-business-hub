import { getStorefront } from "@/lib/queries/storefront";
import { storeOrigin } from "@/lib/storefront-seo";

export const dynamic = "force-dynamic";

/** robots.txt da loja: busca liberada para a vitrine; carrinho, compra, pedido e proposta ficam de fora. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sf = await getStorefront(slug);
  if (!sf || !sf.store.publishedAt) return new Response("User-agent: *\nDisallow: /\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
  const o = await storeOrigin(sf.store);
  const base = new URL(o).pathname.replace(/\/$/, "");
  const body = ["User-agent: *", "Allow: /", `Disallow: ${base}/cart`, `Disallow: ${base}/checkout`, `Disallow: ${base}/order/`, `Disallow: ${base}/proposta/`, `Disallow: ${base}/acompanhar`, "", `Sitemap: ${o}/sitemap.xml`, ""].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
