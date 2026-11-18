import Link from "next/link";
import { AlarmClock, CheckCircle2, FileSignature, HandCoins, Plus, Wallet } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { LinkTabs } from "@/components/app/link-tabs";
import { Kpi } from "@/components/commerce/commerce-home";
import { escopoDaAgencia, pode } from "@/lib/agencias/acesso";
import { FILTROS_CONTRATO, MODELO_ROTULO, contratosDaAgencia, type FiltroContrato } from "@/lib/agencias/contratos";
import { contratosDoMasterParaTrazer } from "@/lib/agencias/migrar-contrato-master";
import { formatBRL } from "@/lib/money";
import { TrazerDoMaster } from "./contratos-cliente";
import { TOM_SITUACAO } from "@/components/agencia/texto-contrato";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contratos" };

const dm = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");

/** Contratos da agência (D331): mensalidades e projetos, com o que já foi pago, o que espera aceite e os trazidos do Master. */
export default async function ContratosDaAgencia({ searchParams }: { searchParams: Promise<{ filtro?: string; q?: string }> }) {
  const session = await requireRole("AGENCY");
  const db = await getDb();
  const { membro } = await escopoDaAgencia(db, session.actor);
  if (!pode.editarContrato(membro)) return <><PageHeader title="Contratos" /><EmptyState icon={FileSignature} title="Os contratos são do administrador e do financeiro" description="Fale com o administrador da agência se precisar de algo sobre um contrato." /></>;
  const sp = await searchParams;
  const filtro = (sp.filtro && sp.filtro in FILTROS_CONTRATO ? sp.filtro : "todos") as FiltroContrato;
  const q = (sp.q ?? "").slice(0, 80);
  const r = await contratosDaAgencia(db, session.actor, filtro, q);
  const doMaster = r.podeTrazerDoMaster ? await contratosDoMasterParaTrazer(db, session.actor) : [];
  const n = r.numeros;
  const href = (f: string) => `/agencia/contratos${f === "todos" ? "" : `?filtro=${f}`}${q ? `${f === "todos" ? "?" : "&"}q=${encodeURIComponent(q)}` : ""}`;
  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      <PageHeader eyebrow="Clientes" title="Contratos" description="Mensalidades e projetos com entrega. O cliente lê e aceita no portal; a cópia assinada chega por e-mail aos dois lados. Contrato aceito não muda: para mudar, faça um aditivo."
        actions={<Link href="/agencia/contratos/novo" className="ds-btn [&_svg]:size-4"><Plus className="size-4" aria-hidden /> Novo contrato</Link>} />
      <section aria-label="Números dos contratos" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi i={1} icon={AlarmClock} label="Aguardando aceite" value={String(n.aguardando)} note={n.aguardando ? "lembre o cliente pelo WhatsApp" : "nenhum pendente"} />
        <Kpi i={2} icon={CheckCircle2} label="Aceitos no mês" value={String(n.aceitosNoMes)} note="assinados pelo portal" />
        <Kpi i={3} icon={HandCoins} label="Projetos no mês" value={formatBRL(n.projetosNoMesCents)} note="valor dos projetos enviados" />
        <Kpi i={4} icon={Wallet} label="A receber" value={formatBRL(n.aReceberCents)} note="parcelas em aberto dos contratos" />
      </section>
      {doMaster.length ? (
        <section className="ds-card p-5 sm:p-6" aria-labelledby="do-master">
          <h2 id="do-master" className="text-base font-semibold">Contratos de serviço no Master</h2>
          <p className="mb-3 mt-1 text-sm text-muted-foreground">Contratos aceitos no painel da loja que ainda não vieram para cá. Trazer não muda nada para o cliente: o texto, a impressão digital e a prova do aceite continuam os mesmos. No Master, o contrato fica marcado como transferido.</p>
          <ul className="divide-y divide-border">{doMaster.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 text-sm">
              <span className="min-w-0 flex-1 basis-64"><b className="block">{c.loja}</b><span className="text-xs text-muted-foreground">{c.numero} · {c.cliente} · aceito{c.aceitoEm ? ` em ${dm(c.aceitoEm)}` : ""}</span></span>
              <span className="font-semibold tabular-nums">{formatBRL(c.valorCents)}</span>
              <TrazerDoMaster id={c.id} loja={c.loja} />
            </li>
          ))}</ul>
        </section>
      ) : null}
      <LinkTabs label="Filtrar contratos" active={filtro} items={Object.entries(FILTROS_CONTRATO).map(([k, l]) => ({ key: k, label: l, href: href(k) }))} />
      <form className="flex max-w-md gap-2" action="/agencia/contratos" role="search">
        {filtro !== "todos" ? <input type="hidden" name="filtro" value={filtro} /> : null}
        <label className="sr-only" htmlFor="busca-contrato">Buscar contrato</label>
        <input id="busca-contrato" name="q" defaultValue={q} placeholder="Cliente ou número" className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm" />
        <button className="ds-btn ds-btn--secondary">Buscar</button>
      </form>
      <section className="ds-card ds-card--flush" aria-label="Lista de contratos">
        {r.lista.length ? (
          <ul className="divide-y divide-border">{r.lista.map((c) => {
            const pct = c.totalCents ? Math.round((c.pagoCents / c.totalCents) * 100) : 0;
            return (
              <li key={c.id}>
                <Link href={`/agencia/contratos/${c.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 text-sm hover:bg-surface-muted/60 focus-visible:bg-surface-muted/60">
                  <span className="min-w-0 flex-1 basis-64">
                    <b className="block">{c.cliente}</b>
                    <span className="text-xs text-muted-foreground">{c.numero} · {MODELO_ROTULO[c.modelo]}{c.aditivo ? " · aditivo" : ""}{c.origem === "MASTER" ? " · trazido do Master" : ""} · enviado em {dm(c.enviadoEm)}</span>
                  </span>
                  {c.totalCents ? (
                    <span className="w-full sm:w-44">
                      <span className="flex justify-between text-xs"><span className="tabular-nums font-semibold">{formatBRL(c.pagoCents)}</span><span className="text-muted-foreground">de {formatBRL(c.totalCents)}</span></span>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden><span className="block h-full rounded-full bg-success" style={{ width: `${pct}%` }} /></span>
                      <span className="sr-only">{pct}% pago</span>
                    </span>
                  ) : <span className="text-xs text-muted-foreground sm:w-44">mensalidade</span>}
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TOM_SITUACAO[c.situacao.tom]}`}>{c.situacao.rotulo}</span>
                </Link>
              </li>
            );
          })}</ul>
        ) : <div className="p-5"><EmptyState icon={FileSignature} title={filtro === "todos" && !q ? "Nenhum contrato ainda" : "Nada por aqui"} description={filtro === "todos" && !q ? "Comece pelo \"Novo contrato\": escolha o cliente e o serviço, confira a prévia e envie." : "Mude o filtro ou a busca."} /></div>}
      </section>
    </div>
  );
}
