import { notFound, permanentRedirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { stores } from "@/db/schema";
import { destinoDoRedirecionamento } from "@/lib/domain/migrar";

export const dynamic = "force-dynamic";

/**
 * Endereço que a loja não tem (D187): se o lojista cadastrou o endereço antigo (de outra plataforma), manda para o novo
 * com redirecionamento permanente; o Google passa a força do endereço antigo para o novo. Senão, "não encontrada".
 */
export default async function EnderecoAntigo({ params }: { params: Promise<{ slug: string; resto: string[] }> }) {
  const { slug, resto } = await params;
  const db = await getDb();
  const store = await db.query.stores.findFirst({ where: eq(stores.slug, slug), columns: { id: true } });
  if (!store) notFound();
  const destino = await destinoDoRedirecionamento(db, store.id, `/${resto.map(decodeURIComponent).join("/")}`);
  if (!destino) notFound();
  permanentRedirect(`/store/${slug}${destino === "/" ? "" : destino}`);
}
