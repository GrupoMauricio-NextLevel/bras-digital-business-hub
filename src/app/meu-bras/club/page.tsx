import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { brandByCode } from "@/lib/brand";
import { clubPanel } from "@/lib/domain/club/pontos";
import { ClubPanel } from "@/components/club/club-panel";
import { ReferCarrierForm } from "@/components/frete/frete-forms";

export const dynamic = "force-dynamic";

/** Brás Digital Club no Meu Brás (D115): "Indique e ganhe" com pontos que viram desconto. */
export default async function Club() {
  const session = await requireRole("BRAS_MEMBER");
  const data = await clubPanel(await getDb(), session.actor);
  return (
    <>
      <PageHeader eyebrow="Brás Digital Club" title="Indique e ganhe" description="Traga clientes, transportadoras, ônibus e importadoras para a rede. Cada indicação ativada vira pontos, e os pontos viram desconto." />
      <ClubPanel data={data} inviteUrl={`${brandByCode("BRAS_DIGITAL").baseUrl}/c/${data.code}`} inviteMessage="Compre do Brás por caixa fechada na Brás Digital. Entre pelo meu convite:" referSlot={<><h3 className="mb-2 text-sm font-semibold">Indicar transportadora, ônibus ou importadora</h3><ReferCarrierForm kinds={["TRANSPORTADORA", "ONIBUS", "IMPORTADORA"]} /></>} />
    </>
  );
}
