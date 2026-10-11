import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { brandByCode } from "@/lib/brand";
import { clubPanel } from "@/lib/domain/club/pontos";
import { ClubPanel } from "@/components/club/club-panel";
import { RankingCard } from "@/components/club/ranking-card";
import { cityRanking } from "@/lib/domain/club/ranking";
import { ReferCarrierForm } from "@/components/frete/frete-forms";

export const dynamic = "force-dynamic";

/** "Indique e ganhe" da transportadora e do ônibus (D115): trazer importadoras e clientes rende pontos. */
export default async function Indicacoes() {
  const session = await requireRole("CARRIER");
  const data = await clubPanel(await getDb(), session.actor);
  const ranking = await cityRanking(await getDb(), session.actor);
  return (
    <>
      <PageHeader eyebrow="NextLevel Cargas · Brás Digital Club" title="Indique e ganhe" description="Traga as importadoras que você já atende e os seus clientes: mais carga para você e pontos que viram desconto." />
      <ClubPanel data={data} inviteUrl={`${brandByCode("BRAS_DIGITAL").baseUrl}/c/${data.code}`} inviteMessage="Acompanhe sua carga do Brás pelo painel e compre direto das importadoras na Brás Digital. Entre pelo meu convite:" referSlot={<><h3 className="mb-2 text-sm font-semibold">Indicar uma importadora que você já atende</h3><ReferCarrierForm kinds={["IMPORTADORA"]} /></>} />
      <RankingCard ranking={ranking} />
    </>
  );
}
