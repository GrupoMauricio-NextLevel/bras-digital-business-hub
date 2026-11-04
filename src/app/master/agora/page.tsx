import Link from "next/link";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { agoraEcommerce, rotuloTipoAgora, type ItemAgora } from "@/lib/domain/agora-ecommerce";
import { DEGRAUS } from "@/lib/domain/funil-ecommerce";
import { formatBRL } from "@/lib/money";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard } from "@/components/app/metric-card";
import { EmptyState } from "@/components/app/empty-state";
import { AoVivo } from "@/components/master/ao-vivo";
import { pendenciasDoDono } from "@/lib/domain/pendencias-dono";

export const dynamic = "force-dynamic";

const TOM: Record<ItemAgora["tom"], string> = { danger: "var(--ds-danger)", warning: "var(--ds-warning)", info: "var(--ds-info)", success: "var(--ds-success)" };
const ha = (iso: string, agora: Date) => {
  const m = Math.max(0, Math.round((agora.getTime() - new Date(iso).getTime()) / 60_000));
  return m < 1 ? "agora" : m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : `há ${Math.round(m / 1440)} dia(s)`;
};

/** Agora (D200): o escritório comercial da E-commerce ao vivo. O que fazer primeiro, com a ação a um clique. */
export default async function AgoraPage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const agora = new Date();
  const a = await agoraEcommerce(await getDb(), session.actor, agora);
  const pend = pendenciasDoDono().filter((p) => !p.feita);
  const k = a.contadores;
  const pct = Math.min(100, Math.round((k.pagantes / Math.max(1, k.meta)) * 100));
  return (
    <>
      <PageHeader eyebrow="NextLevel E-commerce" title="Agora" description="Quem atender primeiro, quem está perto de pagar e quem travou. Atualiza sozinho." actions={<AoVivo />} />

      <section className="ds-kpis mb-6" aria-label="Números de agora">
        <MetricCard label="Conversas esperando" value={k.conversas} hint={k.conversas ? "responda primeiro" : "ninguém esperando"} tone={k.conversas ? "danger" : "neutral"} />
        <MetricCard label="Novos nas últimas 24 h" value={k.novos24h} hint="cadastros e interessados" />
        <MetricCard label="Em teste" value={k.teste} hint="lojas testando agora" />
        <MetricCard label="Pagantes" value={`${k.pagantes} de ${k.meta}`} hint={`meta do mês${k.cortesia ? ` · ${k.cortesia} cortesia` : ""}`} />
        <MetricCard label="Receita mensal" value={formatBRL(k.mrrCents)} hint="planos ativos (anual ÷ 12)" />
      </section>

      <div className="ds-grid ds-grid--main">
        <section className="ds-card" aria-labelledby="fila-t">
          <SectionTitle title="Fila de agora" description="Em ordem de urgência. O relógio mostra há quanto tempo cada um espera." />
          <h2 id="fila-t" className="sr-only">Fila de agora</h2>
          {a.fila.length ? (
            <ol className="divide-y divide-border" aria-live="polite">
              {a.fila.map((i) => (
                <li key={i.key} className="flex flex-wrap items-center gap-3 py-3">
                  <span aria-hidden className="h-10 w-1 shrink-0 rounded-full" style={{ background: TOM[i.tom] }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: TOM[i.tom] }}>{rotuloTipoAgora(i.tipo)} · <span className="font-semibold normal-case tracking-normal text-muted-foreground">{ha(i.desde, agora)}</span></p>
                    <p className="truncate font-bold">{i.titulo}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{i.detalhe}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {i.acoes.map((ac) => ac.externo
                      ? <a key={ac.href} href={ac.href} target="_blank" rel="noreferrer" className="ds-btn ds-btn--sm ds-btn--secondary"><MessageCircle className="size-4" aria-hidden />{ac.rotulo}</a>
                      : <Link key={ac.href} href={ac.href} className="ds-btn ds-btn--sm">{ac.rotulo}<ArrowRight className="size-4" aria-hidden /></Link>)}
                  </div>
                </li>
              ))}
            </ol>
          ) : <EmptyState compact icon={Sparkles} title="Tudo em dia" description="Quando alguém conversar no site, criar uma loja ou travar num passo, aparece aqui na hora." />}
        </section>

        <aside className="grid content-start gap-6">
          {pend.length ? (
            <section className="ds-card" aria-labelledby="pend-t">
              <h2 id="pend-t" className="text-lg font-bold">Suas pendências</h2>
              <p className="mt-1 text-sm text-muted-foreground">Só você pode fazer. Somem daqui quando ficarem prontas.</p>
              <ul className="mt-3 grid gap-3">
                {pend.map((p) => (
                  <li key={p.key} className="rounded-xl border border-border p-3">
                    <p className="font-semibold">{p.titulo}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{p.porque}</p>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{p.passos.map((x) => <li key={x}>{x}</li>)}</ol>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <section className="ds-card" aria-labelledby="meta-t">
            <h2 id="meta-t" className="text-lg font-bold">Meta do mês</h2>
            <p className="mt-1 text-sm text-muted-foreground">{k.pagantes} de {k.meta} lojistas pagantes</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-valuemin={0} aria-valuemax={k.meta} aria-valuenow={k.pagantes} aria-label="Meta de pagantes"><span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
          </section>
          <section className="ds-card" aria-labelledby="funil-t">
            <h2 id="funil-t" className="text-lg font-bold">Funil de ativação</h2>
            {a.funil.total ? (
              <ol className="mt-3 grid gap-2">
                {a.funil.degraus.map((d, n) => (
                  <li key={d.key} className="grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-2 text-sm">
                    <span className="truncate">{n + 1}. {d.rotulo}</span><b className="text-right tabular-nums">{d.n}</b>
                    <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden><span className="block h-full bg-primary" style={{ width: `${d.pct}%` }} /></span>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-2 text-sm text-muted-foreground">Nenhuma loja ainda. O funil começa no primeiro cadastro ({DEGRAUS.length} passos até pagar).</p>}
            <Link href="/commerce" className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[var(--ds-link)]">Ver detalhes <ArrowRight className="size-4" aria-hidden /></Link>
          </section>
        </aside>
      </div>
    </>
  );
}
