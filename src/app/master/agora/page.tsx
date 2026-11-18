import Link from "next/link";
import { ArrowRight, GraduationCap, MessageCircle, Sparkles } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { agoraEcommerce, rotuloTipoAgora, type ItemAgora } from "@/lib/domain/agora-ecommerce";
import { DEGRAUS } from "@/lib/domain/funil-ecommerce";
import { formatBRL } from "@/lib/money";
import { SectionTitle } from "@/components/app/page-header";
import { NumeroVivo } from "@/components/vida/numero-vivo";
import { AnelMeta, FundoAbertura } from "@/components/vida/abertura";
import { HandCoins, MessagesSquare, Rocket, UserPlus } from "lucide-react";
import { saudacao } from "@/lib/finance/executivo-regras";
import { EmptyState } from "@/components/app/empty-state";
import { AoVivo } from "@/components/master/ao-vivo";
import { pendenciasDoDono } from "@/lib/domain/pendencias-dono";
import { pendenteDoAprender } from "@/lib/domain/aprender";

export const dynamic = "force-dynamic";

const TOM: Record<ItemAgora["tom"], string> = { danger: "var(--ds-danger)", warning: "var(--ds-warning)", info: "var(--ds-info)", success: "var(--ds-success)" };
const ha = (iso: string, agora: Date) => {
  const m = Math.max(0, Math.round((agora.getTime() - new Date(iso).getTime()) / 60_000));
  return m < 1 ? "agora" : m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : `há ${Math.round(m / 1440)} dia(s)`;
};

/** Agora (D200): o escritório comercial da Commerce ao vivo. O que fazer primeiro, com a ação a um clique. */
export default async function AgoraPage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const agora = new Date();
  const db = await getDb();
  const [a, aprender] = await Promise.all([agoraEcommerce(db, session.actor, agora), pendenteDoAprender(db, session.actor)]);
  const pend = pendenciasDoDono().filter((p) => !p.feita);
  const k = a.contadores;
  return (
    <>
      {/* Painéis com vida (D333): a estrela-guia (lojistas pagantes) em destaque no topo, sobre a constelação do Brasil. */}
      <section className="ds-hero ds-enter mb-6 !py-5 px-5 sm:!py-6 sm:px-8">
        <FundoAbertura nome="pv-abertura-master-escuro" />
        <div className="relative flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--ds-link)]">NextLevel Commerce · Agora</p>
            <h1 className="mt-1.5 text-[clamp(1.5rem,3.2vw,2.25rem)] font-semibold leading-[1.05] tracking-[-.04em]">{saudacao()}, {session.user.name.split(" ")[0]}.</h1>
            <p className="mt-1.5 max-w-md text-sm">Quem atender primeiro, quem está perto de pagar e quem travou.</p>
            <div className="mt-3"><AoVivo /></div>
          </div>
          <div className="vida-hoje flex items-center gap-5">
            <AnelMeta feito={k.pagantes} meta={k.meta} rotulo="Lojistas pagantes" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.18em]">Estrela-guia</p>
              <p className="mt-1 text-lg font-semibold leading-tight">Lojistas pagantes</p>
              <p className="mt-1 text-sm">{k.pagantes >= k.meta ? "Meta do mês batida!" : `Faltam ${k.meta - k.pagantes} para a meta do mês`}{k.cortesia ? ` · ${k.cortesia} em cortesia` : ""}</p>
              <p className="mt-2 text-sm"><span className="font-semibold tabular-nums">{formatBRL(k.mrrCents)}</span> de receita mensal</p>
            </div>
          </div>
        </div>
      </section>

      {aprender ? (
        <Link href="/master/aprender" className="ds-card mb-6 flex flex-wrap items-center gap-3 p-4 hover:border-foreground/30">
          <GraduationCap className="size-6 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1"><span className="block font-semibold">Sua trilha no Aprender: {aprender.feitas} de {aprender.total} aulas</span><span className="block text-sm text-muted-foreground">Termine as aulas da sua função para atender com as regras de agora.</span></span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold">Continuar <ArrowRight className="size-4" aria-hidden /></span>
        </Link>
      ) : null}

      <section className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Números de agora">
        <NumeroVivo i={1} familia="clientes" icone={MessagesSquare} rotulo="Conversas esperando" valor={String(k.conversas)} nota={k.conversas ? "responda primeiro" : "ninguém esperando"} href="/master/ia" />
        <NumeroVivo i={2} familia="crescimento" icone={UserPlus} rotulo="Novos nas últimas 24 h" valor={String(k.novos24h)} nota="cadastros e interessados" href="/master/comercial" />
        <NumeroVivo i={3} familia="pedidos" icone={Rocket} rotulo="Em teste" valor={String(k.teste)} nota="lojas testando agora" href="/commerce" />
        <NumeroVivo i={4} familia="dinheiro" icone={HandCoins} rotulo="Receita mensal" valor={formatBRL(k.mrrCents)} nota="planos ativos (anual ÷ 12)" href="/master/receita" />
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
          <section className="ds-card" aria-labelledby="funil-t">
            <h2 id="funil-t" className="text-lg font-bold">Funil de ativação</h2>
            {a.funil.total ? (
              <ol className="mt-3 grid gap-2">
                {a.funil.degraus.map((d, n) => (
                  <li key={d.key} className="grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-2 text-sm">
                    <span className="truncate">{n + 1}. {d.rotulo}</span><b className="text-right tabular-nums">{d.n}</b>
                    <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden><span className="block h-full rounded-full" style={{ width: `${d.pct}%`, background: `linear-gradient(90deg, var(--vida-dinheiro), var(--vida-crescimento))` }} /></span>
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
