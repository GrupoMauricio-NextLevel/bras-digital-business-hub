import { Plus } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { brasStaffCan, listWarehouses, myImporter } from "@/lib/domain/bras/importadora";
import { importerLoads, listCarriers, loadableRequests } from "@/lib/domain/cargas/cargas";
import { CARGAS_VEHICLE_LABEL, cargasToday } from "@/lib/cargas/rotulos";
import { LoadCard } from "@/components/cargas/load-card";
import { CallCarrierForm, CarrierForm, ImporterLoadActions } from "@/components/cargas/cargas-forms";

export const dynamic = "force-dynamic";

/**
 * Transportadoras da importadora (D111, NextLevel Cargas v1): chamar a coleta dos pedidos da Brás, acompanhar o aceite
 * e cadastrar a transportadora com quem já trabalha. O frete e a comissão ficam entre a transportadora e a NextLevel.
 */
export default async function Transportadoras() {
  const session = await requireRole("BRAS_IMPORTER");
  const db = await getDb();
  const me = await myImporter(db, session.actor);
  const pode = brasStaffCan(me.staffRole, "pedidos_balcao") || brasStaffCan(me.staffRole, "pedidos_disponibilidade");
  const cadastra = me.staffRole !== "FINANCEIRO";
  const [carriers, reqs, whs, loads] = await Promise.all([listCarriers(db, session.actor), pode ? loadableRequests(db, session.actor) : Promise.resolve([]), listWarehouses(db, session.actor, null), importerLoads(db, session.actor)]);
  const abertas = loads.filter((l) => l.status === "CHAMADA" || l.status === "ACEITA" || l.status === "COLETADA");
  const encerradas = loads.filter((l) => !abertas.includes(l));
  return (
    <>
      <PageHeader eyebrow="Importadora · NextLevel Cargas" title="Transportadoras" description="Junte os pedidos confirmados numa coleta e chame a transportadora. Ela aceita pelo painel da NextLevel Cargas e o motorista retira com o código de cada pedido." />
      {pode ? (
        <section aria-labelledby="t-chamar" className="ds-card mb-8 p-4">
          <h2 id="t-chamar" className="mb-3 text-lg font-bold">Chamar transportadora</h2>
          <CallCarrierForm carriers={carriers} requests={reqs} warehouses={whs.filter((w) => w.active).map((w) => ({ id: w.id, name: w.name, isDefault: w.isDefault }))} today={cargasToday()} />
        </section>
      ) : null}
      <section aria-labelledby="t-and" className="mb-8">
        <h2 id="t-and" className="mb-3 text-lg font-bold">Coletas em andamento ({abertas.length})</h2>
        {abertas.length ? <ul className="grid gap-3 lg:grid-cols-2">{abertas.map((l) => <LoadCard key={l.id} load={l} who="importadora" actions={pode ? <ImporterLoadActions id={l.id} status={l.status} /> : null} />)}</ul> : <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">Nenhuma coleta em andamento.</p>}
      </section>
      {encerradas.length ? (
        <details className="mb-8"><summary className="cursor-pointer text-lg font-bold">Coletas encerradas ({encerradas.length})</summary>
          <ul className="mt-3 grid gap-3 lg:grid-cols-2">{encerradas.slice(0, 40).map((l) => <LoadCard key={l.id} load={l} who="importadora" />)}</ul>
        </details>
      ) : null}
      <section aria-labelledby="t-lista" className="ds-card p-4">
        <h2 id="t-lista" className="mb-3 text-lg font-bold">Transportadoras na NextLevel Cargas ({carriers.length})</h2>
        {carriers.length ? <ul className="grid gap-2 sm:grid-cols-2">{carriers.map((c) => (
          <li key={c.id} className="rounded-lg border border-border p-3 text-sm">
            <p className="flex flex-wrap items-center gap-2 font-semibold">{c.name}{c.operation === "EXCURSAO" ? <Badge tone="neutral">Ônibus de excursão</Badge> : null}{c.groupCompany ? <Badge tone="brand">Empresa do grupo</Badge> : null}{c.docsOk ? <Badge tone="success">Documentação em dia</Badge> : null}{c.insurance ? <Badge tone="success">Seguro de carga</Badge> : null}{c.hasRntrc ? <Badge tone="info">RNTRC</Badge> : null}</p>
            <p className="text-muted-foreground">{c.contactName} · {c.vehicles.map((v) => CARGAS_VEHICLE_LABEL[v as keyof typeof CARGAS_VEHICLE_LABEL] ?? v).join(", ")}</p>
            <p className="text-muted-foreground">Atende: {c.ufs.join(", ")}</p>
            {c.rateNotes ? <p className="text-muted-foreground">Frete: {c.rateNotes}</p> : null}
          </li>
        ))}</ul> : <p className="text-sm text-muted-foreground">Nenhuma transportadora cadastrada ainda.</p>}
        {cadastra ? <details className="mt-4 rounded-lg border border-dashed border-border p-3" open={!carriers.length}><summary className="cursor-pointer text-sm font-semibold"><Plus className="mr-1 inline size-4" aria-hidden />Cadastrar transportadora com quem você já trabalha</summary><div className="mt-3"><CarrierForm /></div></details> : null}
      </section>
    </>
  );
}
