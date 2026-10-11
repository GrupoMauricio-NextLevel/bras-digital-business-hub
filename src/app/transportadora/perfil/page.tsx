import { headers } from "next/headers";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { carrierLoads, listCarrierDocuments } from "@/lib/domain/cargas/cargas";
import { CarrierDocsManager, CarrierProfileForm, DriverLinkManager } from "@/components/cargas/cargas-forms";
import { CarrierMpForm } from "@/components/cargas/frete-pix-forms";
import { carrierPixStatus } from "@/lib/domain/cargas/frete-pix";

export const dynamic = "force-dynamic";

/** Perfil (rota, veículos, documentos, tabela) e o link do motorista. Plano e situação só a NextLevel muda. */
export default async function Perfil() {
  const session = await requireRole("CARRIER");
  const db = await getDb();
  const [{ carrier: c }, docs, pix] = await Promise.all([carrierLoads(db, session.actor), listCarrierDocuments(db, session.actor, null), carrierPixStatus(db, session.actor)]);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host") ?? "cargas.nextlevelgroup.com.br"}`;
  return (
    <>
      <PageHeader eyebrow="NextLevel Cargas" title="Perfil e motorista" description="Mantenha os estados atendidos e os veículos em dia: é por eles que as importadoras escolhem quem chamar." />
      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="p-mot" className="ds-card p-4"><h2 id="p-mot" className="mb-3 text-base font-semibold">Link do motorista</h2><DriverLinkManager carrierId={null} has={c.hasDriverLink} origin={origin} /></section>
        {c.operation === "EXCURSAO" ? <section aria-labelledby="p-pix" className="ds-card p-4"><h2 id="p-pix" className="mb-3 text-base font-semibold">Receber o frete por Pix</h2><CarrierMpForm connected={pix.connected} accountId={pix.accountId} pixOnline={pix.pixOnline} /></section> : null}
        <section aria-labelledby="p-doc" className="ds-card p-4"><h2 id="p-doc" className="mb-3 text-base font-semibold">Autorizações</h2><CarrierDocsManager carrierId={null} docs={docs} master={false} /></section>
        <section aria-labelledby="p-per" className="ds-card p-4"><h2 id="p-per" className="mb-3 text-base font-semibold">Perfil da transportadora</h2><CarrierProfileForm carrierId={null} master={false} value={c} /></section>
      </div>
    </>
  );
}
