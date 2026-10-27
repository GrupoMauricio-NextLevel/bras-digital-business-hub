import { getStorefront, getStorefrontCatalog } from "@/lib/queries/storefront";
import { storeOrigin } from "@/lib/storefront-seo";
import { feedGoogle } from "@/lib/domain/feed-google";

export const dynamic = "force-dynamic";

/** Lista de produtos para o Google Merchant Center / Shopping (D187). Loja não publicada ou em lançamento não lista. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sf = await getStorefront(slug);
  if (!sf || !sf.store.publishedAt || sf.store.showcaseTheme || sf.store.launchMode) return new Response("Não encontrado", { status: 404 });
  const origem = await storeOrigin(sf.store);
  const xml = feedGoogle({ nome: sf.store.name, origem, descricao: sf.store.tagline ?? "" }, await getStorefrontCatalog(sf.store.id));
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=900" } });
}
