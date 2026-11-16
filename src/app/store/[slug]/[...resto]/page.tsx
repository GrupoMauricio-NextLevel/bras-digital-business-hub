import { notFound, permanentRedirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { stores } from "@/db/schema";
import { destinoDoRedirecionamento } from "@/lib/domain/migrar";
import { paginaPublica } from "@/lib/business/paginas";
import { isPreviewMode } from "@/lib/themes/preview";
import { StorePage } from "@/components/storefront/store-page";
import { getStorefront } from "@/lib/queries/storefront";
import { storeOrigin } from "@/lib/storefront-seo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

/** Título e descrição da página livre do site (NB2, D307). */
export async function generateMetadata({ params }: { params: Promise<{ slug: string; resto: string[] }> }): Promise<Metadata> {
  const { slug, resto } = await params;
  if (resto.length !== 1) return {};
  const sf = await getStorefront(slug); if (!sf) return {};
  const achada = await paginaPublica(await getDb(), sf.store.id, decodeURIComponent(resto[0]!));
  if (!achada) return {};
  const p = achada.pagina; const origem = await storeOrigin(sf.store);
  return { title: p.seoTitulo || `${p.titulo} · ${sf.store.name}`, description: p.seoDescricao ?? undefined, alternates: { canonical: `${origem}/${p.slug}` }, robots: p.indexar ? undefined : { index: false, follow: true } };
}

/**
 * Página livre do site (NB2, D307): `/<endereço>` de uma página publicada vence; senão vale o endereço antigo (D187).
 *
 * Endereço que a loja não tem (D187): se o lojista cadastrou o endereço antigo (de outra plataforma), manda para o novo
 * com redirecionamento permanente; o Google passa a força do endereço antigo para o novo. Senão, "não encontrada".
 */
export default async function EnderecoAntigo({ params }: { params: Promise<{ slug: string; resto: string[] }> }) {
  const { slug, resto } = await params;
  const db = await getDb();
  const store = await db.query.stores.findFirst({ where: eq(stores.slug, slug), columns: { id: true } });
  if (!store) notFound();
  if (resto.length === 1) {
    const achada = await paginaPublica(db, store.id, decodeURIComponent(resto[0]!), { previa: await isPreviewMode(store.id) });
    if (achada) return <StorePage slug={slug} page="home" pagina={achada.pagina.slug} />;
  }
  const destino = await destinoDoRedirecionamento(db, store.id, `/${resto.map(decodeURIComponent).join("/")}`);
  if (!destino) notFound();
  permanentRedirect(`/store/${slug}${destino === "/" ? "" : destino}`);
}
