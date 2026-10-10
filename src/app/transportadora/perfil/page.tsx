import { headers } from "next/headers";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { carrierLoads } from "@/lib/domain/cargas/cargas";
import { CarrierProfileForm, DriverLinkManager } from "@/components/cargas/cargas-forms";

export const dynamic = "force-dynamic";

/** Perfil (rota, veículos, documentos, tabela) e o link do motorista. Plano e situação só a NextLevel muda. */
export default async function Perfil() {
  const session = await requireRole("CARRIER");
  const { carrier: c } = await carrierLoads(await getDb(), session.actor);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host") ?? "cargas.nextlevelgroup.com.br"}`;
  return (
    <>
      <PageHeader eyebrow="NextLevel Cargas" title="Perfil e motorista" description="Mantenha os estados atendidos e os veículos em dia: é por eles que as importadoras escolhem quem chamar." />
      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="p-mot" className="ds-card p-4"><h2 id="p-mot" className="mb-3 text-base font-semibold">Link do motorista</h2><DriverLinkManager carrierId={null} has={c.hasDriverLink} origin={origin} /></section>
        <section aria-labelledby="p-per" className="ds-card p-4"><h2 id="p-per" className="mb-3 text-base font-semibold">Perfil da transportadora</h2><CarrierProfileForm carrierId={null} master={false} value={c} /></section>
      </div>
    </>
  );
}
