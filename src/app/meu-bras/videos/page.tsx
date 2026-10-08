import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { getBrasMemberByUser } from "@/lib/domain/bras/membros";
import { brasAccessFor } from "@/lib/domain/bras/descobertas";
import { listBrasFeed } from "@/lib/domain/bras/catalogo";
import { BrasFeed } from "../feed";

export const dynamic = "force-dynamic";

export default async function Videos() {
  const session = await requireRole("BRAS_MEMBER");
  const db = await getDb();
  const [member, videos] = await Promise.all([getBrasMemberByUser(db, session.user.id), brasAccessFor(db, session).then((a) => listBrasFeed(db, a.level, 60))]);
  return (
    <>
      <PageHeader eyebrow="Meu Brás" title="Descobertas" description="Produtos que encontramos no Brás, com a análise de mercado de cada um: por que é o produto certo, o preço da caixa e as caixas disponíveis." />
      <BrasFeed items={videos} ativo={member?.status === "ACTIVE"} />
    </>
  );
}
