import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { importersForCarrier } from "@/lib/domain/cargas/vias";
import { AskPreferredForm } from "@/components/cargas/vias-forms";
import { fixedLabel } from "@/lib/cargas/rotulos";

export const dynamic = "force-dynamic";

/**
 * Importadoras na rede (D118): a transportadora vê quem vende no Brás, onde retirar e para onde vão os pedidos
 * (agregado por estado, sem cliente e sem valor), e pede para ser preferida. Preferida aparece primeiro quando a
 * importadora chama a coleta.
 */
export default async function Importadoras() {
  const session = await requireRole("CARRIER");
  const list = await importersForCarrier(await getDb(), session.actor);
  const status = { PEDIDO: <Badge tone="warning">Pedido enviado</Badge>, ACEITA: <Badge tone="success">Você é preferida</Badge>, RECUSADA: <Badge tone="neutral">Não aceitou agora</Badge> } as const;
  return (
    <>
      <PageHeader eyebrow="NextLevel Cargas · duas vias" title="Importadoras na rede" description="Veja para onde vão os pedidos de cada importadora do Brás (últimos 30 dias) e peça para ser a transportadora preferida dela. Preferida aparece primeiro quando ela chama a coleta." />
      {list.length ? <ul className="grid gap-3 lg:grid-cols-2">{list.map((i) => (
        <li key={i.id} className="ds-card p-4 text-sm">
          <p className="flex flex-wrap items-center gap-2 text-base font-semibold">{i.name}{i.preference ? status[i.preference.status] : null}</p>
          {i.warehouses.length ? <ul className="mt-1 text-muted-foreground">{i.warehouses.map((w) => <li key={w.name}>{w.name}: {w.address}{w.hours ? ` · ${w.hours}` : ""}</li>)}</ul> : i.pickupAddress ? <p className="mt-1 text-muted-foreground">Retirada: {i.pickupAddress}</p> : null}
          <h3 className="mt-3 text-sm font-semibold">Para onde vão os pedidos</h3>
          {i.demand.length || i.otherRequests ? (
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {i.demand.map((d) => <li key={d.uf} className={`rounded-full border px-2.5 py-0.5 ${d.servesUf ? "border-success bg-success-soft font-semibold" : "border-border"}`}>{d.uf}: {d.requests} {d.requests === 1 ? "pedido" : "pedidos"} · {d.boxes} cx{d.servesUf ? " · você atende" : ""}</li>)}
              {i.otherRequests ? <li className="rounded-full border border-border px-2.5 py-0.5 text-muted-foreground">outros estados: {i.otherRequests} {i.otherRequests === 1 ? "pedido" : "pedidos"}</li> : null}
            </ul>
          ) : <p className="text-muted-foreground">Ainda sem pedidos nos últimos 30 dias.</p>}
          {i.preference?.status === "ACEITA" && fixedLabel(i.preference.weekdays, i.preference.time) ? <p className="mt-2 font-semibold">Coleta fixa: {fixedLabel(i.preference.weekdays, i.preference.time)}</p> : null}
          {!i.preference || i.preference.status === "RECUSADA" ? <div className="mt-3"><AskPreferredForm importerId={i.id} importerName={i.name} again={i.preference?.status === "RECUSADA"} /></div> : null}
        </li>
      ))}</ul> : <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">Nenhuma importadora na rede ainda. Indique as que você já atende em &quot;Indique e ganhe&quot;.</p>}
      <p className="mt-6 text-xs text-muted-foreground">Os números são somados por estado de destino. Estado com poucos pedidos entra em &quot;outros&quot; para não identificar ninguém.</p>
    </>
  );
}
