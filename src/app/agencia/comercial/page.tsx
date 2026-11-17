import Link from "next/link";
import { AlarmClock, CalendarCheck, Handshake, Percent, Wallet } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Kpi } from "@/components/commerce/commerce-home";
import { escopoDaAgencia, pode } from "@/lib/agencias/acesso";
import { ETAPA_COMERCIAL_ROTULO, ORIGEM_ROTULO, listarOportunidades, resumoDoFunil, type OportunidadeNaLista } from "@/lib/agencias/comercial";
import { hojeEmSaoPaulo } from "@/lib/agencias/clientes";
import { listarEquipe } from "@/lib/agencias/agencias";
import { formatBRL } from "@/lib/money";
import { OPORTUNIDADE_ETAPAS } from "@/db/schema";
import { NovaOportunidade } from "./comercial-cliente";

export const dynamic = "force-dynamic";
export const metadata = { title: "Comercial" };

const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
function Cartao({ o }: { o: OportunidadeNaLista }) {
  return (
    <Link href={`/agencia/comercial/${o.id}`} className={`ds-card ds-lift block !p-3.5 text-sm ${o.atrasada ? "border-danger/50" : ""}`}>
      <b className="block font-semibold leading-snug">{o.empresa}</b>
      <span className="mt-0.5 block truncate text-xs text-muted-foreground">{[o.segmento, ORIGEM_ROTULO[o.origem]].filter(Boolean).join(" · ")}</span>
      {o.valorPropostoCents ? <span className="mt-1.5 block text-xs font-semibold tabular-nums">{formatBRL(o.valorPropostoCents)}/mês</span> : null}
      <span className={`mt-1.5 block text-xs ${o.atrasada ? "font-semibold text-danger" : o.hoje ? "font-semibold text-warning" : "text-muted-foreground"}`}>{o.proximaAtividade || o.proximaAtividadeEm ? `${o.proximaAtividade ?? "Próxima atividade"}${o.proximaAtividadeEm ? ` · ${o.atrasada ? "atrasada " : o.hoje ? "hoje " : ""}${ddmm(o.proximaAtividadeEm)}` : ""}` : "sem próxima atividade"}</span>
      <span className="mt-1 block truncate text-xs text-muted-foreground">{o.responsavelNome ? `com ${o.responsavelNome.split(" ")[0]}` : "sem responsável"}</span>
    </Link>
  );
}

/** Comercial da agência (D317): o funil do briefing, da prospecção ao contrato fechado. */
export default async function Comercial() {
  const session = await requireRole("AGENCY");
  const db = await getDb();
  const { membro } = await escopoDaAgencia(db, session.actor);
  if (!pode.editarClientes(membro)) return <><PageHeader title="Comercial" /><EmptyState icon={Handshake} title="O comercial é do administrador, do gestor e do atendimento" description="Fale com o administrador da agência se precisar acompanhar as negociações." /></>;
  const hoje = hojeEmSaoPaulo();
  const [lista, equipe] = await Promise.all([listarOportunidades(db, session.actor, hoje), listarEquipe(db, session.actor)]);
  const r = resumoDoFunil(lista, hoje);
  const colunas = OPORTUNIDADE_ETAPAS.filter((e) => e !== "PERDIDO");
  const perdidas = lista.filter((o) => o.etapa === "PERDIDO");
  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <PageHeader eyebrow="Novos clientes" title="Comercial" description="Cada empresa em negociação, da prospecção ao contrato. Fechou: &quot;Virar cliente&quot; leva para a carteira com o onboarding." actions={<NovaOportunidade equipe={equipe.filter((p) => !p.desligadoEm).map((p) => ({ id: p.userId, nome: p.nome }))} />} />
      <section aria-label="Números do funil" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi i={1} icon={Handshake} label="Em negociação" value={String(r.abertas)} note={r.semProxima ? `${r.semProxima} sem próxima atividade` : "todas com próxima atividade"} />
        <Kpi i={2} icon={Wallet} label="Valor em negociação" value={formatBRL(r.valorEmNegociacaoCents)} note="por mês, somando as propostas" />
        <Kpi i={3} icon={AlarmClock} label="Para hoje e atrasadas" value={`${r.hoje} · ${r.atrasadas}`} note="próximas atividades" />
        <Kpi i={4} icon={r.conversao === null ? CalendarCheck : Percent} label="Fechadas no mês" value={String(r.fechadasNoMes)} note={r.conversao === null ? "nenhuma decisão no mês ainda" : `conversão de ${r.conversao}% (${r.perdidasNoMes} perdida${r.perdidasNoMes === 1 ? "" : "s"})`} />
      </section>
      {lista.length ? (
        <section aria-label="Funil por etapa" className="max-w-full overflow-x-auto pb-2">
          <div className="grid auto-cols-[minmax(220px,1fr)] grid-flow-col gap-3">
            {colunas.map((e) => { const col = lista.filter((o) => o.etapa === e); return (
              <div key={e} className="min-w-0 rounded-2xl bg-surface-muted/60 p-2.5">
                <h2 className="mb-2 flex items-center justify-between px-1 text-sm font-semibold"><span>{ETAPA_COMERCIAL_ROTULO[e]}</span><span className="rounded-full bg-surface px-2 py-0.5 text-xs tabular-nums">{col.length}</span></h2>
                <div className="space-y-2">{col.map((o) => <Cartao key={o.id} o={o} />)}</div>
              </div>
            ); })}
          </div>
        </section>
      ) : <EmptyState icon={Handshake} title="Nenhuma negociação ainda" description="Cadastre a primeira oportunidade: a empresa, o que ela quer e a próxima atividade." />}
      {perdidas.length ? <details className="ds-card !p-4"><summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">Perdidas ({perdidas.length})</summary><ul className="mt-2 divide-y divide-border text-sm">{perdidas.map((o) => <li key={o.id}><Link href={`/agencia/comercial/${o.id}`} className="flex min-h-11 items-center justify-between gap-2"><span>{o.empresa}</span><span className="text-xs text-muted-foreground">{o.motivoPerda}</span></Link></li>)}</ul></details> : null}
    </div>
  );
}
