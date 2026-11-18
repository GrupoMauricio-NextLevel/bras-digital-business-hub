import { Trophy } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { vocabularioDaAgencia } from "@/lib/agencias/personalizar";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { placarDoMes } from "@/lib/agencias/gestao";
import { mesRotulo } from "@/lib/agencias/fluxo";

import { formatBRL } from "@/lib/money";
import { Metas } from "@/components/agencia/gestao-cliente";

export const dynamic = "force-dynamic";
export const metadata = { title: "Placar e metas" };

/** Placar e metas da agência (D325), como o Bônus e metas e o Placar do Master. */
export default async function Placar() {
  const session = await requireRole("AGENCY");
  // Personalização (D340): nomes de etapas, tipos e departamentos da empresa.
  const { v: voc } = await vocabularioDaAgencia(await getDb(), session.actor);
  const p = await placarDoMes(await getDb(), session.actor);
  const fmt = (v: number, d?: boolean) => (d ? formatBRL(v) : String(v));
  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      <PageHeader eyebrow="Equipe" title="Placar e metas" description={`Metas de ${mesRotulo(p.mes)} e quem mais fez andar a produção. Os números vêm sozinhos do painel.`} />
      <section aria-label="Metas do mês" className="grid gap-4 md:grid-cols-3">
        {p.itens.map((i) => (
          <article key={i.chave} className="ds-card p-5">
            <p className="text-sm text-muted-foreground">{i.rotulo}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{fmt(i.feito, "dinheiro" in i)}{i.meta ? <span className="text-base font-normal text-muted-foreground"> de {fmt(i.meta, "dinheiro" in i)}</span> : null}</p>
            {i.pct !== null ? <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-label={`${i.rotulo}: ${i.pct}% da meta`} aria-valuenow={Math.min(100, i.pct)} aria-valuemin={0} aria-valuemax={100}><div className={`h-full rounded-full ${i.pct >= 100 ? "bg-success" : "bg-[var(--ds-link)]"}`} style={{ width: `${Math.min(100, i.pct)}%` }} /></div> : <p className="mt-2 text-xs text-muted-foreground">Sem meta definida</p>}
            {i.pct !== null ? <p className="mt-1 text-xs text-muted-foreground">{i.pct >= 100 ? "Meta batida!" : `${i.pct}% da meta`}</p> : null}
          </article>
        ))}
      </section>
      <section className="ds-card p-5 sm:p-6" aria-labelledby="pl-rank">
        <h2 id="pl-rank" className="mb-3 text-base font-semibold">Quem fez a produção andar no mês</h2>
        {p.ranking.length ? <ol className="divide-y divide-border text-sm">{p.ranking.map((r, i) => <li key={r.userId} className="flex flex-wrap items-center justify-between gap-2 py-2"><span><b className="mr-2 tabular-nums">{i + 1}º</b>{r.nome} <span className="text-xs text-muted-foreground">· {voc.funcao[r.funcao]}</span></span><span className="text-xs tabular-nums text-muted-foreground"><b className="text-foreground">{r.etapas}</b> etapas concluídas{r.publicados ? ` · ${r.publicados} publicados` : ""}</span></li>)}</ol> : <EmptyState icon={Trophy} title="Ninguém concluiu etapa neste mês ainda" description="Cada etapa concluída na produção conta ponto aqui." />}
      </section>
      {p.podeDefinir ? <section className="ds-card p-5 sm:p-6" aria-labelledby="pl-metas"><h2 id="pl-metas" className="mb-3 text-base font-semibold">Definir metas de {mesRotulo(p.mes)}</h2><Metas mes={p.mes} inicial={p.meta} verValores={p.verValores} /></section> : null}
    </div>
  );
}
