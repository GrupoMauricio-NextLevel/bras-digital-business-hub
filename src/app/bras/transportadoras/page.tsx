import { headers } from "next/headers";
import { Plus, Truck } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { cargasCarrierLeads, cargasCommissionReport, carrierDocsQueue, listAllLoads, listCarrierAccess, listCarrierDocuments, listCarriers } from "@/lib/domain/cargas/cargas";
import { CARGAS_DOC_LABEL, CARGAS_OPERATION_LABEL, CARGAS_PLAN_LABEL, CARGAS_VEHICLE_LABEL, cargasToday } from "@/lib/cargas/rotulos";
import { LoadCard } from "@/components/cargas/load-card";
import { listCarrierReferrals } from "@/lib/domain/club/indicacoes";
import { DismissReferralButton } from "@/components/frete/frete-forms";
import { CarrierAccessForm, CarrierDocsManager, CarrierForm, CarrierProfileForm, DriverLinkManager, LeadToCarrierButton } from "@/components/cargas/cargas-forms";

export const dynamic = "force-dynamic";

/**
 * NextLevel Cargas no Master (D111): transportadoras (cadastro, plano, acesso, link do motorista), interessados da
 * página pública, coletas de todas as importadoras e a comissão por carga a faturar. Só o Master.
 */
export default async function TransportadorasMaster() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [carriers, leads, loads, report, referrals] = await Promise.all([listCarriers(db, session.actor), cargasCarrierLeads(db, session.actor), listAllLoads(db, session.actor), cargasCommissionReport(db, session.actor), listCarrierReferrals(db, session.actor)]);
  const convidadas = referrals.filter((r) => r.status === "CONVIDADO");
  const [access, docs, docsQueue] = await Promise.all([
    Promise.all(carriers.map((c) => listCarrierAccess(db, session.actor, c.id))),
    Promise.all(carriers.map((c) => listCarrierDocuments(db, session.actor, c.id))),
    carrierDocsQueue(db, session.actor),
  ]);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "cargas.nextlevelgroup.com.br";
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${host.replace(/^(master|bras)\./, "cargas.")}`;
  const abertas = loads.filter((l) => l.status === "CHAMADA" || l.status === "ACEITA" || l.status === "COLETADA");
  const mesAtual = cargasToday().slice(0, 7);
  const comissaoMes = report.reduce((s, c) => s + (c.months.find((m) => m.month === mesAtual)?.commissionCents ?? 0), 0);
  return (
    <>
      <PageHeader eyebrow="Estúdio Brás Digital · NextLevel Cargas" title="Transportadoras" description="Quem leva as caixas do Brás. A importadora chama, a transportadora aceita com o frete e a comissão da NextLevel fica congelada no aceite, pelo plano dela." />
      <MetricGrid className="mb-6">
        <MetricCard label="Transportadoras ativas" value={carriers.filter((c) => c.status === "ATIVA").length} icon={Truck} hint={`${carriers.length} cadastradas`} />
        <MetricCard label="Coletas em andamento" value={abertas.length} icon={Truck} tone={abertas.some((l) => l.status === "CHAMADA") ? "warning" : "neutral"} hint={`${abertas.filter((l) => l.status === "CHAMADA").length} aguardando resposta`} />
        <MetricCard label="Comissão do mês" value={formatBRL(comissaoMes)} icon={Truck} hint="Cobrada por fatura mensal" />
        <MetricCard label="Interessados novos" value={leads.length} icon={Plus} tone={leads.length ? "warning" : "neutral"} hint="Da página da Cargas" />
      </MetricGrid>

      {docsQueue.pending.length || docsQueue.expiring.length ? (
        <section aria-labelledby="m-docs" className="ds-card mb-6 p-4">
          <h2 id="m-docs" className="mb-2 text-base font-semibold">Autorizações para conferir</h2>
          <ul className="space-y-1 text-sm">
            {docsQueue.pending.map((d) => <li key={d.id}><b>{d.carrierName}</b>: {CARGAS_DOC_LABEL[d.kind]} nº {d.number}{d.issuer ? ` (${d.issuer})` : ""} aguardando conferência (abra Gerenciar).</li>)}
            {docsQueue.expiring.map((d) => <li key={d.id} className={d.expired ? "text-danger" : ""}><b>{d.carrierName}</b>: {CARGAS_DOC_LABEL[d.kind]} {d.expired ? "vencida" : "vence"} em {d.validUntil.split("-").reverse().join("/")}.</li>)}
          </ul>
        </section>
      ) : null}
      {leads.length ? (
        <section aria-labelledby="m-leads" className="ds-card mb-6 p-4">
          <h2 id="m-leads" className="mb-3 text-base font-semibold">Interessados da página da Cargas</h2>
          <ul className="grid gap-2 lg:grid-cols-2">{leads.map((l) => (
            <li key={l.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-semibold">{l.company || l.name} <span className="font-normal text-muted-foreground">· {l.name} · {l.phone}</span></p>
              <p className="whitespace-pre-line text-muted-foreground">{l.message}</p>
              <div className="mt-2"><LeadToCarrierButton leadId={l.id} /></div>
            </li>
          ))}</ul>
        </section>
      ) : null}

      {convidadas.length ? (
        <section aria-labelledby="m-refs" className="ds-card mb-6 p-4">
          <h2 id="m-refs" className="mb-1 text-base font-semibold">Indicadas por clientes ({convidadas.length})</h2>
          <p className="mb-3 text-sm text-muted-foreground">Transportadoras e ônibus que os clientes já usam e ainda não estão na rede. Quem entrar com o mesmo WhatsApp fica ligado à indicação.</p>
          <ul className="grid gap-2 lg:grid-cols-2">{convidadas.map((r) => (
            <li key={r.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-semibold">{r.name} <span className="font-normal text-muted-foreground">· {r.kind === "ONIBUS" ? "ônibus de excursão" : "transportadora"}{r.city ? ` · ${r.city}/${r.uf}` : r.uf ? ` · ${r.uf}` : ""}</span></p>
              <p className="text-muted-foreground">{r.contactName ? `${r.contactName} · ` : ""}{r.phone} · indicada por {r.referrer}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2"><a href={r.whatsappUrl} target="_blank" rel="noopener noreferrer" className="ds-btn ds-btn--secondary ds-btn--sm">Convidar no WhatsApp</a><DismissReferralButton id={r.id} /></div>
            </li>
          ))}</ul>
        </section>
      ) : null}
      <section aria-labelledby="m-carr" className="ds-card mb-6 p-4">
        <h2 id="m-carr" className="mb-3 text-base font-semibold">Transportadoras ({carriers.length})</h2>
        {carriers.length ? <ul className="space-y-2">{carriers.map((c, i) => (
          <li key={c.id} className="rounded-lg border border-border p-3 text-sm">
            <p className="flex flex-wrap items-center gap-2 font-semibold">{c.name}<Badge tone="info">{CARGAS_PLAN_LABEL[c.plan]}</Badge><Badge tone="neutral">{CARGAS_OPERATION_LABEL[c.operation]}</Badge>{c.groupCompany ? <Badge tone="brand">Empresa do grupo</Badge> : null}{c.docsOk ? <Badge tone="success">Documentação em dia</Badge> : null}{c.status !== "ATIVA" ? <Badge tone="warning">Pausada</Badge> : null}{c.insurance ? <Badge tone="success">Seguro</Badge> : null}</p>
            <p className="text-muted-foreground">{c.docType} {c.document} · {c.contactName} · {c.phone} · {c.vehicles.map((v) => CARGAS_VEHICLE_LABEL[v as keyof typeof CARGAS_VEHICLE_LABEL] ?? v).join(", ")} · atende {c.ufs.join(", ")}</p>
            <p className="text-muted-foreground">{access[i]!.length ? `Acesso: ${access[i]!.map((a) => `${a.name} (${a.email})`).join(", ")}` : "Sem acesso ao painel ainda"}{c.createdByImporterId ? " · cadastrada por uma importadora" : ""}</p>
            <details className="mt-2"><summary className="cursor-pointer font-semibold text-link">Gerenciar</summary>
              <div className="mt-3 grid gap-4 xl:grid-cols-2">
                <div><h3 className="mb-2 font-semibold">Perfil, plano e situação</h3><CarrierProfileForm carrierId={c.id} master value={{ contactName: c.contactName, phone: c.phone, email: c.email ?? null, ufs: c.ufs, vehicles: c.vehicles, rntrc: c.rntrc ?? null, insurance: c.insurance, rateNotes: c.rateNotes, plan: c.plan, status: c.status, operation: c.operation }} /></div>
                <div className="space-y-4">
                  <div><h3 className="mb-2 font-semibold">Acesso ao painel</h3><CarrierAccessForm carrierId={c.id} /></div>
                  <div><h3 className="mb-2 font-semibold">Autorizações</h3><CarrierDocsManager carrierId={c.id} docs={docs[i]!} master /></div>
                  <div><h3 className="mb-2 font-semibold">Link do motorista</h3><DriverLinkManager carrierId={c.id} has={c.hasDriverLink} origin={origin} /></div>
                </div>
              </div>
            </details>
          </li>
        ))}</ul> : <p className="text-sm text-muted-foreground">Nenhuma transportadora cadastrada.</p>}
        <details className="mt-4 rounded-lg border border-dashed border-border p-3" open={!carriers.length}><summary className="cursor-pointer text-sm font-semibold"><Plus className="mr-1 inline size-4" aria-hidden />Cadastrar transportadora</summary><div className="mt-3"><CarrierForm /></div></details>
      </section>

      <section aria-labelledby="m-com" className="ds-card mb-6 p-4">
        <h2 id="m-com" className="mb-1 text-base font-semibold">Comissão por carga a faturar</h2>
        <p className="mb-3 text-sm text-muted-foreground">Percentual pelo plano (Regras da Brás → Transportadoras), congelado no aceite. Sem cobrança automática nesta fase.</p>
        {report.length ? (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <caption className="sr-only">Comissão por transportadora e mês</caption>
            <thead><tr className="border-b border-border text-left"><th scope="col" className="p-2">Transportadora</th><th scope="col" className="p-2">Mês</th><th scope="col" className="p-2 text-right">Cargas</th><th scope="col" className="p-2 text-right">Frete</th><th scope="col" className="p-2 text-right">Comissão</th></tr></thead>
            <tbody>{report.flatMap((c) => c.months.map((m) => <tr key={`${c.carrierId}-${m.month}`} className="border-b border-border last:border-0"><th scope="row" className="p-2 text-left font-medium">{c.name} <span className="font-normal text-muted-foreground">({CARGAS_PLAN_LABEL[c.plan]})</span></th><td className="p-2">{m.month.slice(5)}/{m.month.slice(0, 4)}</td><td className="p-2 text-right tabular-nums">{m.loads}</td><td className="p-2 text-right tabular-nums">{formatBRL(m.freightCents)}</td><td className="p-2 text-right tabular-nums">{formatBRL(m.commissionCents)}</td></tr>))}</tbody>
          </table></div>
        ) : <p className="text-sm text-muted-foreground">Nenhuma carga aceita ainda.</p>}
      </section>

      <section aria-labelledby="m-loads">
        <h2 id="m-loads" className="mb-3 text-base font-semibold">Coletas recentes ({loads.length})</h2>
        {loads.length ? <ul className="grid gap-3 lg:grid-cols-2">{loads.slice(0, 60).map((l) => <LoadCard key={l.id} load={l} who="master" />)}</ul> : <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">Nenhuma coleta ainda.</p>}
      </section>
    </>
  );
}
