import { Award, Check, Flame, Lock, Medal, Target } from "lucide-react";
import type { Engajamento } from "@/lib/domain/engajamento";

const pts = (c: number) => (c / 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

/**
 * "Sua semana" (BG2, D272): missões, sequência, selos e ranking. Reconhecimento sem dinheiro; o dinheiro fica no
 * cartão "Seus bônus". A celebração respeita "reduzir movimento".
 */
export function SuaSemana({ e }: { e: Engajamento }) {
  const m = e.missoes;
  const r = e.ranking;
  return (
    <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]" aria-label="Sua semana" data-sua-semana>
      <article className={`relative overflow-hidden rounded-2xl border p-5 ${m.completa ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" : "border-border bg-surface"}`}>
        {m.completa ? <div aria-hidden className="nl-confete pointer-events-none absolute inset-0" /> : null}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-semibold"><Target className="size-5 text-[var(--ds-primary)]" aria-hidden />Missões da semana</h2>
          <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold tabular-nums">{m.feitas} de {m.total}</span>
        </div>
        {m.completa ? <p className="mt-2 font-semibold text-emerald-700 dark:text-emerald-300" role="status">Semana completa! Selo garantido.</p> : null}
        <ul className="mt-3 grid gap-2">
          {m.lista.map((x) => (
            <li key={x.id} className={`flex items-start gap-3 rounded-xl border px-3 py-2 ${x.feita ? "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20" : "border-border"}`}>
              <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${x.feita ? "bg-emerald-500 text-white" : "border border-border"}`}>{x.feita ? <Check className="size-4" aria-label="Feita" /> : null}</span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-2"><b className="text-sm">{x.titulo}</b><span className="text-xs tabular-nums text-muted-foreground">{Math.min(x.atual, x.meta)}/{x.meta}</span></span>
                {!x.feita ? <span className="block text-xs text-muted-foreground">{x.dica}</span> : null}
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden><span className="block h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, Math.round((x.atual / x.meta) * 100))}%` }} /></span>
              </span>
            </li>
          ))}
        </ul>
      </article>

      <div className="grid gap-4">
        <article className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center gap-3">
            <span className={`grid size-12 place-items-center rounded-2xl ${e.sequencia.atual ? "bg-orange-100 text-orange-600 dark:bg-orange-950/40" : "bg-surface-muted text-muted-foreground"}`}><Flame className="size-6" aria-hidden /></span>
            <div>
              <p className="text-2xl font-bold tabular-nums">{e.sequencia.atual} semana{e.sequencia.atual === 1 ? "" : "s"}</p>
              <p className="text-xs text-muted-foreground">{e.sequencia.atual ? (e.sequencia.emRisco ? "seguidas com venda: feche uma venda esta semana para não perder" : "seguidas com venda") : "Feche uma venda esta semana para começar sua sequência"}{e.sequencia.melhor > e.sequencia.atual ? ` · recorde: ${e.sequencia.melhor}` : ""}</p>
            </div>
          </div>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold"><Medal className="size-5 text-amber-500" aria-hidden />Ranking {e.publico === "RUA" ? "dos executivos" : "dos parceiros"}</h2>
          <p className="mt-1 text-sm">{r.semana.posicao ? <>Semana: <b>{r.semana.posicao}º de {r.semana.total}</b>{r.semana.acima ? <> · faltam {pts(r.semana.acima.faltaCent)} pts para passar {r.semana.acima.nome}</> : r.semana.total > 1 ? " · você lidera!" : null}</> : "Venda nesta semana para entrar no ranking."}</p>
          <p className="text-sm">{r.mes.posicao ? <>Mês: <b>{r.mes.posicao}º de {r.mes.total}</b>{r.mes.acima ? <> · faltam {pts(r.mes.acima.faltaCent)} pts para passar {r.mes.acima.nome}</> : null}</> : null}</p>
          <ol className="mt-3 grid gap-1 text-sm">{r.semana.top.map((x) => <li key={`${x.posicao}-${x.nome}`} className={`flex justify-between gap-2 rounded-lg px-2 py-1 ${x.voce ? "bg-surface-muted font-semibold" : ""}`}><span><span className="font-mono text-xs text-muted-foreground">{x.posicao}º</span> {x.nome}</span><span className="tabular-nums">{pts(x.pontos)} pts</span></li>)}</ol>
        </article>
      </div>

      <article className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2">
        <h2 className="flex items-center gap-2 text-base font-semibold"><Award className="size-5 text-[var(--ds-primary)]" aria-hidden />Seus selos <span className="text-sm font-normal text-muted-foreground">{e.selos.filter((s) => s.ganhou).length} de {e.selos.length}</span></h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {e.selos.map((s) => (
            <li key={s.id} className={`rounded-xl border p-3 text-center ${s.ganhou ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30" : "border-border opacity-70"}`}>
              <span className={`mx-auto grid size-10 place-items-center rounded-full ${s.ganhou ? "bg-amber-400 text-amber-950" : "bg-surface-muted text-muted-foreground"}`}>{s.ganhou ? <Award className="size-5" aria-hidden /> : <Lock className="size-4" aria-hidden />}</span>
              <b className="mt-2 block text-sm">{s.nome}</b>
              <span className="block text-xs text-muted-foreground">{s.ganhou ? "Conquistado" : s.descricao}</span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
