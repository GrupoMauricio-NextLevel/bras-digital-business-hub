import Link from "next/link";
import { AlarmClock, CheckCircle2, Hourglass, Workflow } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { Kpi } from "@/components/commerce/commerce-home";
import { PrazoTexto } from "@/components/agencia/producao";
import { FUNCAO_ROTULO } from "@/lib/agencias/acesso";
import { cockpitDaAgencia } from "@/lib/agencias/clientes";
import { resumoDaSemana, type PecaNaLista } from "@/lib/agencias/producao";
import { formatBRL } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Resumo da semana" };

const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const card = "ds-card p-5 sm:p-6";

function Lista({ titulo, itens, vazio }: { titulo: string; itens: PecaNaLista[]; vazio: string }) {
  return (
    <section className={card} aria-label={titulo}>
      <h2 className="mb-2 flex items-baseline justify-between text-base font-semibold"><span>{titulo}</span><span className="text-sm tabular-nums text-muted-foreground">{itens.length}</span></h2>
      {itens.length ? (
        <ul className="divide-y divide-border">{itens.slice(0, 8).map((p) => <li key={p.id}><Link href={`/agencia/producao/${p.id}`} className="flex min-h-11 items-center gap-3 py-2 text-sm"><span className="min-w-0 flex-1"><span className="block truncate font-medium">{p.titulo}</span><span className="block truncate text-xs text-muted-foreground">{p.clienteNome} · {p.responsavelNome ? `com ${p.responsavelNome.split(" ")[0]}` : "sem responsável"}</span></span><span className="text-xs"><PrazoTexto prazo={p.prazo} atrasada={p.atrasada} /></span></Link></li>)}</ul>
      ) : <p className="text-sm text-muted-foreground">{vazio}</p>}
      {itens.length > 8 ? <p className="mt-2 text-xs text-muted-foreground">e mais {itens.length - 8} na Produção.</p> : null}
    </section>
  );
}

/** Resumo da Semana (D316): para a reunião interna, o que foi entregue, o que acumulou e o que vem pela frente. */
export default async function ResumoDaSemana() {
  const session = await requireRole("AGENCY");
  const db = await getDb();
  const [r, k] = await Promise.all([resumoDaSemana(db, session.actor), cockpitDaAgencia(db, session.actor)]);
  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      <PageHeader eyebrow="Reunião da semana" title="Resumo da semana" description={`Entregas de ${dm(r.desde)} até hoje e o que vem até ${dm(r.ate)}.`} />
      <section aria-label="Números da semana" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi i={1} icon={CheckCircle2} label="Publicados na semana" value={String(r.publicadas.length)} />
        <Kpi i={2} icon={Workflow} label="Etapas concluídas" value={String(r.etapasConcluidas)} note="passagens de uma etapa para a outra" />
        <Kpi i={3} icon={AlarmClock} label="Atrasados" value={String(r.atrasadas.length)} note="pendências acumuladas" />
        <Kpi i={4} icon={Hourglass} label="Aguardando aprovação" value={String(r.aprovacoes.length)} note="do cliente" />
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={card} aria-labelledby="sm-dep">
          <h2 id="sm-dep" className="mb-3 text-base font-semibold">Prioridades de cada departamento</h2>
          {r.departamentos.length ? <ul className="space-y-2 text-sm">{r.departamentos.map((d) => <li key={d.funcao} className="flex items-baseline justify-between gap-2"><span className="font-medium">{FUNCAO_ROTULO[d.funcao]}</span><span className="tabular-nums text-muted-foreground">{d.abertas} na fila{d.atrasadas ? <b className="ml-1 text-danger">· {d.atrasadas} atrasada{d.atrasadas > 1 ? "s" : ""}</b> : null}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhuma peça aberta.</p>}
        </section>
        <section className={card} aria-labelledby="sm-pes">
          <h2 id="sm-pes" className="mb-3 text-base font-semibold">Entregas por pessoa na semana</h2>
          {r.porPessoa.length ? <ul className="space-y-2 text-sm">{r.porPessoa.map((p) => <li key={p.nome} className="flex justify-between gap-2"><span>{p.nome}</span><span className="tabular-nums text-muted-foreground">{p.etapas} etapa{p.etapas > 1 ? "s" : ""} concluída{p.etapas > 1 ? "s" : ""}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhuma etapa concluída nos últimos 7 dias.</p>}
        </section>
        <Lista titulo="Pendências acumuladas (atrasadas)" itens={r.atrasadas} vazio="Nada atrasado." />
        <Lista titulo="Gravações previstas" itens={r.gravacoes} vazio="Nenhuma gravação prevista para os próximos 7 dias." />
        <Lista titulo="Vídeos para editar" itens={r.paraEditar} vazio="Nada na edição." />
        <Lista titulo="Publicações a programar e programadas" itens={r.programadas} vazio="Nada com o social media agora." />
        <Lista titulo="Aprovações pendentes" itens={r.aprovacoes} vazio="Nenhum conteúdo esperando o cliente." />
        {k.verValores ? (
          <section className={card} aria-labelledby="sm-pag">
            <h2 id="sm-pag" className="mb-2 text-base font-semibold">Pagamentos próximos</h2>
            {k.vencimentos.length ? <ul className="divide-y divide-border text-sm">{k.vencimentos.map((v) => <li key={v.id} className="flex min-h-11 items-center justify-between gap-2"><span>{dm(v.data)} · {v.nome}</span><span className="font-semibold tabular-nums">{formatBRL(v.valorCents)}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhum vencimento nos próximos 7 dias.</p>}
          </section>
        ) : null}
      </div>
    </div>
  );
}
