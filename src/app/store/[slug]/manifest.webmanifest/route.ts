import { getStorefront } from "@/lib/queries/storefront";
import { manifestoDaLoja } from "@/lib/domain/integracoes";

export const dynamic = "force-dynamic";

/** Loja instalável no celular (I-10, D189): só com a chave ligada e a loja publicada. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sf = await getStorefront(slug);
  if (!sf || !sf.store.publishedAt || sf.store.showcaseTheme || !sf.store.integrations?.pwa) return new Response("Não encontrado", { status: 404 });
  return Response.json(manifestoDaLoja(sf.store, `/store/${slug}`), { headers: { "content-type": "application/manifest+json; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
