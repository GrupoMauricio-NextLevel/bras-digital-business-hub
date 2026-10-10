import Link from "next/link";
import { BellRing, PackageCheck, Truck } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { carrierLoads } from "@/lib/domain/cargas/cargas";
import { LoadCard } from "@/components/cargas/load-card";
import { CarrierLoadActions } from "@/components/cargas/cargas-forms";
import { ExcursionBoard } from "@/components/cargas/excursion-board";
import { busBoard } from "@/lib/domain/cargas/excursao";

export const dynamic = "force-dynamic";

const pct = (bps: number) => String(bps / 100).replace(".", ",");

/** Hoje (D111): responder chamadas, coletar no Brás e entregar, numa tela só. */
export default async function Hoje() {
  const session = await requireRole("CARRIER");
  const db = await getDb();
  const { carrier, loads, usage } = await carrierLoads(db, session.actor);
  const excursao = carrier.operation === "EXCURSAO";
  const trips = excursao ? await busBoard(db, session.actor) : [];
  const chamadas = loads.filter((l) => l.status === "CHAMADA");
  const coletar = loads.filter((l) => l.status === "ACEITA");
  const transito = loads.filter((l) => l.status === "COLETADA");
  const bloco = (id: string, icon: React.ReactNode, title: string, hint: string, items: typeof loads) => (
    <section aria-labelledby={id} className="mb-8">
      <h2 id={id} className="mb-1 flex items-center gap-2 text-xl font-bold">{icon}{title} <span className="rounded-full bg-[var(--brand-primary)]/15 px-2 text-base tabular-nums">{items.length}</span></h2>
      <p className="mb-3 text-sm text-muted-foreground">{hint}</p>
      {items.length ? <ul className="grid gap-3 lg:grid-cols-2">{items.map((l) => <LoadCard key={l.id} load={l} who="transportadora" actions={<CarrierLoadActions id={l.id} status={l.status} commissionPct={pct(usage.commissionBps)} />} />)}</ul> : <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">Nada aqui agora.</p>}
    </section>
  );
  return (
    <>
      <PageHeader eyebrow="NextLevel Cargas" title={`Olá, ${carrier.contactName}`} description={excursao ? `Fardos do Brás para o ônibus ${carrier.name}: aceite as chamadas, colete pela etiqueta e entregue com o código do cliente.` : `Coletas das importadoras do Brás para a ${carrier.name}. Comissão da NextLevel no seu plano: ${pct(usage.commissionBps)}% do frete.`} />
      {usage.freeLimit !== null && !excursao ? <p role="note" className="mb-6 rounded-lg bg-surface-muted px-4 py-3 text-sm">Plano grátis: <b className="tabular-nums">{usage.acceptedThisMonth} de {usage.freeLimit}</b> cargas aceitas neste mês.</p> : null}
      {!carrier.hasDriverLink ? <p className="mb-6 rounded-lg bg-warning-soft px-4 py-3 text-sm">Gere o link do motorista para ele ver endereço, horário e códigos no celular. <Link href="/transportadora/perfil" className="font-semibold text-link underline">Gerar link</Link></p> : null}
      {excursao ? <section aria-label="Viagens do ônibus" className="mb-10"><ExcursionBoard trips={trips} /><Link href="/transportadora/rotas" className="mt-4 inline-block text-sm font-semibold text-link underline">Rotas, preços e nova viagem</Link></section> : null}
      {excursao && !loads.length ? null : <>
      {bloco("t-cham", <BellRing className="size-5 text-[var(--brand-primary)]" aria-hidden />, "Chamadas para responder", "Aceite informando o frete combinado, ou recuse com o motivo (a importadora chama outra).", chamadas)}
      {bloco("t-col", <PackageCheck className="size-5 text-[var(--brand-primary)]" aria-hidden />, "Coletar no Brás", "No balcão, o motorista mostra o código de cada pedido. Sem código, a importadora não entrega.", coletar)}
      {bloco("t-tra", <Truck className="size-5 text-[var(--brand-primary)]" aria-hidden />, "Em trânsito", "Marque a entrega quando deixar a carga no destino.", transito)}
      </>}
    </>
  );
}
