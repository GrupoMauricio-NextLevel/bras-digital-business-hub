import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import type { Aula } from "@/lib/conhecimento/aulas";
import { QuizAula } from "@/components/master/quiz-aula";

/** Aula e barra de progresso do Aprender (BC1, D266), usadas no Master e no Painel da Agência (D317). */
export function Barra({ feitas, total, rotulo, className = "" }: { feitas: number; total: number; rotulo: string; className?: string }) {
  const pct = total ? Math.round((feitas / total) * 100) : 0;
  return <div role="progressbar" aria-label={rotulo} aria-valuemin={0} aria-valuemax={total} aria-valuenow={feitas} className={`h-1.5 overflow-hidden rounded-full bg-surface-muted ${className}`}><div className={`h-full rounded-full ${pct === 100 ? "bg-success" : "bg-foreground"}`} style={{ width: `${pct}%` }} /></div>;
}

export function AulaView({ aula, trilha, perguntas, concluida, responder }: { aula: Omit<Aula, "trilha">; trilha: string; perguntas: { pergunta: string; opcoes: string[] }[]; concluida: boolean; responder?: React.ComponentProps<typeof QuizAula>["responder"] }) {
  return (
    <article className="ds-card p-5 sm:p-7" aria-labelledby="aula-t">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{trilha}</span>·<span className={`rounded-full px-2 py-0.5 font-semibold ${aula.estado === "no-ar" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>{aula.estado === "no-ar" ? "No ar" : "Em breve"}</span>{aula.decisoes.map((d) => <span key={d} className="rounded-full border border-border px-2 py-0.5 font-mono">{d}</span>)}</div>
      <h2 id="aula-t" className="mt-3 text-2xl font-bold tracking-tight">{aula.titulo}</h2>
      <p className="mt-2 text-base text-muted-foreground">{aula.oQue}</p>
      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">A regra</h3>
      <ul className="mt-2 space-y-2">{aula.regra.map((r) => <li key={r} className="flex gap-2 text-sm"><ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden /><span>{r}</span></li>)}</ul>
      {aula.exemplo ? <><h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Exemplo</h3><p className="mt-2 rounded-xl bg-surface-muted p-3 text-sm">{aula.exemplo}</p></> : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div><h3 className="text-sm font-semibold uppercase tracking-wider text-success">O que dizer</h3><ul className="mt-2 space-y-2">{aula.dizer.map((d) => <li key={d} className="flex gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /><span>{d}</span></li>)}</ul></div>
        <div><h3 className="text-sm font-semibold uppercase tracking-wider text-danger">Nunca dizer ou fazer</h3><ul className="mt-2 space-y-2">{aula.nunca.map((d) => <li key={d} className="flex gap-2 text-sm"><X className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden /><span>{d}</span></li>)}</ul></div>
      </div>
      {aula.link ? <Link href={aula.link.href} className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-surface">{aula.link.rotulo} <ArrowRight className="size-4" aria-hidden /></Link> : null}
      {perguntas.length ? <QuizAula key={aula.id} aulaId={aula.id} perguntas={perguntas} concluida={concluida} responder={responder} /> : null}
    </article>
  );
}
