import { getStorefront } from "@/lib/queries/storefront";
import { iconeDaLoja } from "@/lib/domain/integracoes";
import { readableOn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Ícone da loja instalável (I-10, D189): as iniciais na cor da loja. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sf = await getStorefront(slug);
  if (!sf || !sf.store.integrations?.pwa) return new Response("Não encontrado", { status: 404 });
  return new Response(iconeDaLoja(sf.store, readableOn(sf.store.primaryColor)), { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600" } });
}
