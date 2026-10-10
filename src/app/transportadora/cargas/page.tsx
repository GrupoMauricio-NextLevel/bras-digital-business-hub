import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { LinkTabs } from "@/components/app/link-tabs";
import { carrierLoads } from "@/lib/domain/cargas/cargas";
import { LoadCard } from "@/components/cargas/load-card";
import { CarrierLoadActions } from "@/components/cargas/cargas-forms";

export const dynamic = "force-dynamic";

/** Todas as cargas da transportadora: em aberto ou encerradas (entregues, recusadas, canceladas). */
export default async function Cargas({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const session = await requireRole("CARRIER");
  const encerradas = (await searchParams).ver === "encerradas";
  const { loads, usage } = await carrierLoads(await getDb(), session.actor);
  const open = (s: string) => s === "CHAMADA" || s === "ACEITA" || s === "COLETADA";
  const rows = loads.filter((l) => open(l.status) !== encerradas);
  return (
    <>
      <PageHeader eyebrow="NextLevel Cargas" title="Cargas" description="Cada coleta junta pedidos de uma importadora do Brás. Do comprador você vê só o endereço de entrega." />
      <LinkTabs label="Filtro" active={encerradas ? "E" : "A"} items={[{ key: "A", label: "Em aberto", href: "/transportadora/cargas" }, { key: "E", label: "Encerradas", href: "/transportadora/cargas?ver=encerradas" }]} />
      {rows.length ? <ul className="mt-6 grid gap-3 lg:grid-cols-2">{rows.map((l) => <LoadCard key={l.id} load={l} who="transportadora" actions={<CarrierLoadActions id={l.id} status={l.status} commissionPct={String(usage.commissionBps / 100).replace(".", ",")} />} />)}</ul> : <p className="mt-6 rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">Nenhuma carga aqui.</p>}
    </>
  );
}
