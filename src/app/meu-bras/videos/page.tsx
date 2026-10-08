import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { brasCommercialAccessFor, getBrasMemberByUser } from "@/lib/domain/bras/membros";
import { listBrasFeed } from "@/lib/domain/bras/catalogo";
import { BrasFeed } from "../feed";

export const dynamic = "force-dynamic";

export default async function Videos() {
  const session = await requireRole("BRAS_MEMBER");
  const db = await getDb();
  const [member, videos] = await Promise.all([getBrasMemberByUser(db, session.user.id), brasCommercialAccessFor(db, session).then((a) => listBrasFeed(db, a, 60))]);
  return (
    <>
      <PageHeader eyebrow="Meu Brás" title="Produtos" description="Análise de cada produto em vídeo, com o preço da caixa e as caixas disponíveis. Toque em Quero comprar para fazer o pedido." />
      <BrasFeed items={videos} ativo={member?.status === "ACTIVE"} company={member?.companyName ?? session.user.name} />
    </>
  );
}
