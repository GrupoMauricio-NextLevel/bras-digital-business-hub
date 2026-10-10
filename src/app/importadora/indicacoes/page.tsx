import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { brandByCode } from "@/lib/brand";
import { clubPanel } from "@/lib/domain/club/pontos";
import { ClubPanel } from "@/components/club/club-panel";
import { ReferCarrierForm } from "@/components/frete/frete-forms";

export const dynamic = "force-dynamic";

/** "Indique e ganhe" da importadora (D115): trazer transportadoras e clientes rende pontos. */
export default async function Indicacoes() {
  const session = await requireRole("BRAS_IMPORTER");
  const data = await clubPanel(await getDb(), session.actor);
  return (
    <>
      <PageHeader eyebrow="Importadora · Brás Digital Club" title="Indique e ganhe" description="Traga as transportadoras e os ônibus que já levam a sua carga, e os seus clientes: tudo vira pontos e desconto." />
      <ClubPanel data={data} inviteUrl={`${brandByCode("BRAS_DIGITAL").baseUrl}/c/${data.code}`} inviteMessage="Compre da nossa importadora por caixa fechada na Brás Digital. Entre pelo meu convite:" referSlot={<><h3 className="mb-2 text-sm font-semibold">Indicar transportadora ou ônibus</h3><ReferCarrierForm kinds={["TRANSPORTADORA", "ONIBUS"]} /></>} />
    </>
  );
}
