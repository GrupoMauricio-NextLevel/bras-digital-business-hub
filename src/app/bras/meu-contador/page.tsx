import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { getMeuContadorSettings, ticketQueue } from "@/lib/domain/fiscal/meu-contador";
import { TicketCard } from "@/components/fiscal/ticket-card";
import { MeuContadorSettingsForm, TicketDesk } from "@/components/fiscal/nota-forms";

export const dynamic = "force-dynamic";

/** Fila do Meu Contador (D117): chamados por prazo (saída do ônibus), indicadores e regras do serviço. */
export default async function MeuContadorMaster() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [q, settings] = await Promise.all([ticketQueue(db, session.actor), getMeuContadorSettings(db)]);
  return (
    <>
      <PageHeader eyebrow="Estúdio Brás Digital · Nota em dia" title="Meu Contador" description="Chamados urgentes de nota, do mais apertado para o mais folgado. Resolva pelo caminho correto: o sistema não emite nota no lugar do vendedor." />
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        {[["Abertos", q.stats.open], ["Em atendimento", q.stats.inProgress], ["Resolvidos", q.stats.resolved], ["Antes do prazo", q.stats.onTimePct === null ? "—" : `${q.stats.onTimePct}%`]].map(([l, v]) => <div key={String(l)} className="ds-card p-4"><p className="text-sm text-muted-foreground">{l}</p><p className="text-2xl font-black tabular-nums">{v}</p></div>)}
      </div>
      <section aria-labelledby="mc-fila" className="mb-6">
        <h2 id="mc-fila" className="mb-3 text-base font-semibold">Fila ({q.open.length}){q.stats.avgMinutes !== null ? <span className="font-normal text-muted-foreground"> · tempo médio para resolver: {q.stats.avgMinutes} min</span> : null}</h2>
        {q.open.length ? <ul className="grid gap-3 lg:grid-cols-2">{q.open.map((t) => <TicketCard key={t.id} t={t}><TicketDesk id={t.id} status={t.status} /></TicketCard>)}</ul> : <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">Nenhum chamado aberto.</p>}
      </section>
      {q.closed.length ? <details className="mb-6"><summary className="cursor-pointer text-base font-semibold">Encerrados ({q.closed.length})</summary><ul className="mt-3 grid gap-3 lg:grid-cols-2">{q.closed.map((t) => <TicketCard key={t.id} t={t} />)}</ul></details> : null}
      {/* Regras e preço do serviço: só o dono e o Financeiro (D138). */}
      {!session.user.masterFunction || session.user.masterFunction === "FINANCEIRO" ? (
        <section aria-labelledby="mc-reg" className="ds-card p-4"><h2 id="mc-reg" className="mb-3 text-base font-semibold">Regras do serviço (rascunho)</h2><MeuContadorSettingsForm value={settings} /></section>
      ) : null}
    </>
  );
}
