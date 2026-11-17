import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { AulaView, Barra } from "@/components/master/aula-view";
import { escopoDaAgencia, FUNCAO_ROTULO, pode } from "@/lib/agencias/acesso";
import { AULAS_AGENCIA, TRILHAS_AGENCIA, perguntasDaAulaAgencia, progressoDaAgencia, trilhasDaFuncao } from "@/lib/agencias/aprender";
import { responderAulaDaAgenciaAction } from "@/app/actions/agencias";

export const dynamic = "force-dynamic";
export const metadata = { title: "Aprender" };

/** Aprender da agência (D317): o mesmo Aprender do Master, com as trilhas do Painel da Agência por função. */
export default async function AprenderAgencia({ searchParams }: { searchParams: Promise<{ trilha?: string; aula?: string; aba?: string }> }) {
  const session = await requireRole("AGENCY");
  const db = await getDb();
  const { membro } = await escopoDaAgencia(db, session.actor);
  const sp = await searchParams;
  const minhas = trilhasDaFuncao(membro.funcao);
  const trilhas = TRILHAS_AGENCIA.filter((t) => minhas.includes(t.id));
  const progresso = await progressoDaAgencia(db, session.actor);
  const eu = progresso.find((p) => p.id === session.user.id);
  const feitas = new Set(eu?.concluidas ?? []);
  const admin = pode.gerirEquipe(membro);
  const aba = sp.aba === "equipe" && admin ? "equipe" : "trilhas";
  const trilhaAtual = trilhas.find((t) => t.id === sp.trilha) ?? trilhas[0]!;
  const visiveis = AULAS_AGENCIA.filter((a) => minhas.includes(a.trilha));
  const aula = visiveis.find((a) => a.id === sp.aula) ?? visiveis.find((a) => a.trilha === trilhaAtual.id) ?? null;
  const url = (p: Record<string, string | undefined>) => `/agencia/aprender?${new URLSearchParams(Object.entries(p).filter(([, v]) => v) as [string, string][])}`;
  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      <PageHeader eyebrow="Treinamento da equipe" title="Aprender" description={`Como usar o Painel da Agência no dia a dia. Trilhas da sua função (${FUNCAO_ROTULO[membro.funcao]}), com perguntas rápidas para fixar.`} />
      <div className="flex flex-wrap items-center gap-3">
        {admin ? (
          <nav className="flex gap-1 rounded-full border border-border bg-surface p-1" aria-label="Seções">
            <Link href={url({})} aria-current={aba === "trilhas" ? "page" : undefined} className={`inline-flex min-h-9 items-center rounded-full px-4 text-sm font-semibold ${aba === "trilhas" ? "bg-foreground text-surface" : "text-muted-foreground"}`}>Trilhas</Link>
            <Link href={url({ aba: "equipe" })} aria-current={aba === "equipe" ? "page" : undefined} className={`inline-flex min-h-9 items-center rounded-full px-4 text-sm font-semibold ${aba === "equipe" ? "bg-foreground text-surface" : "text-muted-foreground"}`}>Quem está pronto</Link>
          </nav>
        ) : null}
        {eu ? <span className="flex flex-wrap items-center gap-2 text-sm"><span className="font-semibold">Seu progresso: {eu.feitas} de {eu.total} aulas</span><Barra feitas={eu.feitas} total={eu.total} rotulo="Seu progresso" className="w-40" />{eu.total && eu.feitas === eu.total ? <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success"><CircleCheck className="size-3.5" aria-hidden />Pronto</span> : null}</span> : null}
      </div>
      {aba === "equipe" ? (
        <ul className="grid gap-3 md:grid-cols-2" aria-label="Progresso da equipe">
          {progresso.map((p) => <li key={p.id} className="ds-card p-4"><div className="flex items-start justify-between gap-2"><span className="min-w-0"><b className="block truncate">{p.nome}</b><span className="text-xs text-muted-foreground">{FUNCAO_ROTULO[p.funcao]}</span></span><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.total && p.feitas === p.total ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>{p.total && p.feitas === p.total ? "Pronto" : `${p.feitas} de ${p.total}`}</span></div><Barra feitas={p.feitas} total={p.total} rotulo={`Progresso de ${p.nome}`} className="mt-3" /></li>)}
        </ul>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <nav aria-label="Trilhas" className="space-y-2">
            {trilhas.map((t) => {
              const atual = t.id === trilhaAtual.id;
              const lista = visiveis.filter((a) => a.trilha === t.id);
              const ok = lista.filter((a) => feitas.has(a.id)).length;
              return (
                <div key={t.id} className={`ds-card p-3 ${atual ? "ring-1 ring-foreground/20" : ""}`}>
                  <Link href={url({ trilha: t.id })} aria-current={atual ? "true" : undefined} className="flex items-start gap-2"><span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-surface-muted font-mono text-xs font-bold">{t.numero}</span><span><span className="block text-sm font-semibold">{t.titulo}</span><span className="block text-xs text-muted-foreground">{ok} de {lista.length} aulas · {t.resumo}</span></span></Link>
                  <Barra feitas={ok} total={lista.length} rotulo={`Progresso em ${t.titulo}`} className="mt-2" />
                  {atual ? <ul className="mt-2 space-y-0.5 border-t border-border pt-2">{lista.map((a) => <li key={a.id}><Link href={url({ trilha: t.id, aula: a.id })} aria-current={aula?.id === a.id ? "page" : undefined} className={`flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-sm ${aula?.id === a.id ? "bg-surface-muted font-semibold" : "text-muted-foreground hover:text-foreground"}`}>{feitas.has(a.id) ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-label="Concluída" /> : <span aria-hidden className="mt-0.5 size-4 shrink-0 rounded-full border border-border" />}<span>{a.titulo}</span></Link></li>)}</ul> : null}
                </div>
              );
            })}
          </nav>
          {aula ? <div className={sp.aula ? "order-first lg:order-none" : undefined}><AulaView aula={aula} trilha={TRILHAS_AGENCIA.find((t) => t.id === aula.trilha)?.titulo ?? ""} perguntas={perguntasDaAulaAgencia(aula.id).map(({ pergunta, opcoes }) => ({ pergunta, opcoes }))} concluida={feitas.has(aula.id)} responder={responderAulaDaAgenciaAction} /></div> : null}
        </div>
      )}
    </div>
  );
}
