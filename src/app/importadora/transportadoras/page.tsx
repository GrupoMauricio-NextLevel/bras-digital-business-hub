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
import { MarkReadyButton, ParcelInvoiceForm } from "@/components/cargas/excursao-forms";
import { importerParcels } from "@/lib/domain/cargas/excursao";
import { PARCEL_SIZE_LABEL } from "@/lib/domain/cargas/regras-excursao";
import { LOAD_QUICK_MESSAGES, fixedPickupPlan, importerPreferences, ratedLoadIds } from "@/lib/domain/cargas/vias";
import { AnswerPreferred, FixedPickupCall, FixedPickupForm, LoadMessageForm, MarkPreferredButton, RateLoadForm, RatingBadge } from "@/components/cargas/vias-forms";
import { fixedLabel } from "@/lib/cargas/rotulos";

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
  const [carriers, reqs, whs, loads, parcels, prefs, rated] = await Promise.all([listCarriers(db, session.actor), pode ? loadableRequests(db, session.actor) : Promise.resolve([]), listWarehouses(db, session.actor, null), importerLoads(db, session.actor), importerParcels(db, session.actor), importerPreferences(db, session.actor), ratedLoadIds(db, session.actor)]);
  // Duas vias (D118): preferidas primeiro ao chamar a coleta; pedidos de preferida para responder; avaliação depois da coleta.
  const preferidas = new Set(prefs.filter((p) => p.status === "ACEITA").map((p) => p.carrierId));
  const pedidosPref = prefs.filter((p) => p.status === "PEDIDO");
  const aceitas = prefs.filter((p) => p.status === "ACEITA");
  const fixas = pode ? fixedPickupPlan(aceitas, reqs) : [];
  const conversa = (l: (typeof loads)[number]) => l.status === "CHAMADA" || l.status === "ACEITA" || l.status === "COLETADA" ? <LoadMessageForm loadId={l.id} number={l.number} quick={LOAD_QUICK_MESSAGES.importadora} /> : null;
  const avaliar = (l: (typeof loads)[number]) => (l.status === "COLETADA" || l.status === "ENTREGUE") && !rated.has(l.id) && cadastra ? <RateLoadForm loadId={l.id} number={l.number} /> : null;
  const abertas = loads.filter((l) => l.status === "CHAMADA" || l.status === "ACEITA" || l.status === "COLETADA");
  const encerradas = loads.filter((l) => !abertas.includes(l));
  return (
    <>
      <PageHeader eyebrow="Importadora · NextLevel Cargas" title="Transportadoras" description="Junte os pedidos confirmados numa coleta e chame a transportadora. Ela aceita pelo painel da NextLevel Cargas e o motorista retira com o código de cada pedido." />
      {pode ? (
        <section aria-labelledby="t-chamar" className="ds-card mb-8 p-4">
          <h2 id="t-chamar" className="mb-3 text-lg font-bold">Chamar transportadora</h2>
          {fixas.length ? <div className="mb-4 grid gap-2">{fixas.map((f) => <FixedPickupCall key={f.carrierId} plan={f} today={cargasToday()} />)}</div> : null}
          <CallCarrierForm carriers={carriers.map((c) => ({ ...c, preferred: preferidas.has(c.id) }))} requests={reqs} warehouses={whs.filter((w) => w.active).map((w) => ({ id: w.id, name: w.name, isDefault: w.isDefault }))} today={cargasToday()} />
        </section>
      ) : null}
      {pedidosPref.length || aceitas.length ? (
        <section aria-labelledby="t-pref" className="ds-card mb-8 p-4">
          <h2 id="t-pref" className="mb-1 text-lg font-bold">Transportadoras preferidas</h2>
          <p className="mb-3 text-sm text-muted-foreground">Preferida aparece primeiro quando você chama a coleta. Combine uma coleta fixa e ela já aparece no painel da transportadora no dia.</p>
          {pedidosPref.length ? <ul className="mb-4 grid gap-3 lg:grid-cols-2">{pedidosPref.map((p) => (
            <li key={p.id} className="rounded-lg border border-warning/50 bg-warning-soft p-3 text-sm">
              <p className="font-semibold">{p.name} quer ser sua preferida</p>
              <p className="text-muted-foreground">{p.operation === "EXCURSAO" ? "Ônibus de excursão" : "Transportadora"} · atende {p.ufs.join(", ")} · {p.contactName}</p>
              {p.message ? <p className="mt-1">&ldquo;{p.message}&rdquo;</p> : null}
              {cadastra ? <div className="mt-2"><AnswerPreferred id={p.id} name={p.name} /></div> : null}
            </li>
          ))}</ul> : null}
          {aceitas.length ? <ul className="grid gap-3 lg:grid-cols-2">{aceitas.map((p) => (
            <li key={p.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="flex flex-wrap items-center gap-2 font-semibold">{p.name}<Badge tone="success">Preferida</Badge></p>
              <p className="mb-2 text-muted-foreground">Atende {p.ufs.join(", ")}{fixedLabel(p.weekdays, p.time) ? ` · coleta fixa: ${fixedLabel(p.weekdays, p.time)}` : ""}</p>
              {cadastra ? <FixedPickupForm id={p.id} name={p.name} weekdays={p.weekdays} time={p.time} /> : null}
            </li>
          ))}</ul> : null}
        </section>
      ) : null}
      {parcels.length ? (
        <section aria-labelledby="t-fardos" className="ds-card mb-8 p-4">
          <h2 id="t-fardos" className="mb-1 text-lg font-bold">Fardos para ônibus de excursão ({parcels.length})</h2>
          <p className="mb-3 text-sm text-muted-foreground">O cliente escolheu mandar estes pedidos pelo ônibus. Escreva o código da etiqueta no fardo, informe a nota e marque &quot;pronto&quot;: o ajudante do ônibus vê na lista dele.</p>
          <ul className="grid gap-3 lg:grid-cols-2">{parcels.map((p) => (
            <li key={p.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="flex flex-wrap items-center gap-2"><b className="font-mono text-base">{p.label}</b> · {PARCEL_SIZE_LABEL[p.size]} · pedido {p.requestNumber}</p>
              <p className="text-muted-foreground">{p.carrierName} · sai {new Date(p.departAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · embarque: {p.brasPoint}</p>
              <p className="mt-1">{p.status === "PRONTO" ? "Pronto: aguardando o ajudante" : p.status === "COLETADO" ? "Coletado pelo ônibus" : p.status === "ACEITO" ? "Aceito pelo ônibus" : "Aguardando o ônibus aceitar"}{p.hasInvoice ? " · nota registrada" : " · sem nota"}</p>
              {!p.hasInvoice && p.status !== "COLETADO" ? <ParcelInvoiceForm parcelId={p.id} /> : null}
              {p.status === "ACEITO" ? <div className="mt-2"><MarkReadyButton parcelId={p.id} /></div> : null}
            </li>
          ))}</ul>
        </section>
      ) : null}
      <section aria-labelledby="t-and" className="mb-8">
        <h2 id="t-and" className="mb-3 text-lg font-bold">Coletas em andamento ({abertas.length})</h2>
        {abertas.length ? <ul className="grid gap-3 lg:grid-cols-2">{abertas.map((l) => <LoadCard key={l.id} load={l} who="importadora" actions={<>{pode ? <ImporterLoadActions id={l.id} status={l.status} /> : null}{conversa(l)}{avaliar(l)}</>} />)}</ul> : <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">Nenhuma coleta em andamento.</p>}
      </section>
      {encerradas.length ? (
        <details className="mb-8"><summary className="cursor-pointer text-lg font-bold">Coletas encerradas ({encerradas.length})</summary>
          <ul className="mt-3 grid gap-3 lg:grid-cols-2">{encerradas.slice(0, 40).map((l) => <LoadCard key={l.id} load={l} who="importadora" actions={avaliar(l)} />)}</ul>
        </details>
      ) : null}
      <section aria-labelledby="t-lista" className="ds-card p-4">
        <h2 id="t-lista" className="mb-3 text-lg font-bold">Transportadoras na NextLevel Cargas ({carriers.length})</h2>
        {carriers.length ? <ul className="grid gap-2 sm:grid-cols-2">{carriers.map((c) => (
          <li key={c.id} className="rounded-lg border border-border p-3 text-sm">
            <p className="flex flex-wrap items-center gap-2 font-semibold">{c.name}{c.operation === "EXCURSAO" ? <Badge tone="neutral">Ônibus de excursão</Badge> : null}{c.groupCompany ? <Badge tone="brand">Empresa do grupo</Badge> : null}{c.docsOk ? <Badge tone="success">Documentação em dia</Badge> : null}{c.insurance ? <Badge tone="success">Seguro de carga</Badge> : null}{c.hasRntrc ? <Badge tone="info">RNTRC</Badge> : null}{preferidas.has(c.id) ? <Badge tone="success">Preferida</Badge> : null}<RatingBadge rating={c.rating} /></p>
            <p className="text-muted-foreground">{c.contactName} · {c.vehicles.map((v) => CARGAS_VEHICLE_LABEL[v as keyof typeof CARGAS_VEHICLE_LABEL] ?? v).join(", ")}</p>
            <p className="text-muted-foreground">Atende: {c.ufs.join(", ")}</p>
            {c.rateNotes ? <p className="text-muted-foreground">Frete: {c.rateNotes}</p> : null}
            {cadastra && !preferidas.has(c.id) ? <div className="mt-2"><MarkPreferredButton carrierId={c.id} name={c.name} /></div> : null}
          </li>
        ))}</ul> : <p className="text-sm text-muted-foreground">Nenhuma transportadora cadastrada ainda.</p>}
        {cadastra ? <details className="mt-4 rounded-lg border border-dashed border-border p-3" open={!carriers.length}><summary className="cursor-pointer text-sm font-semibold"><Plus className="mr-1 inline size-4" aria-hidden />Cadastrar transportadora com quem você já trabalha</summary><div className="mt-3"><CarrierForm /></div></details> : null}
      </section>
    </>
  );
}
