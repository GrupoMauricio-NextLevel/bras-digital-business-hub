"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Building2, Megaphone, Store } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { PERFIS, PERFIL_LISTA, escadaDoPerfil, ganhoNoMes, type PerfilCaptacao, type RegraPerfil } from "@/lib/finance/captacao-regras";

type Props = {
  inicial: PerfilCaptacao;
  regras: Record<PerfilCaptacao, RegraPerfil & { anualBps: number }>;
  planos: { nome: string; mensalCents: number }[];
  bonus: { ativacaoCents: number; metaCents: number; metaAtivacoes: number };
  marca: string;
};
const ICONE = { criador: Megaphone, vendedor: Store, agencia: Building2 } as const;
const pct = (bps: number) => `${(bps / 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const COR_NIVEL: Record<string, string> = { INICIAL: "#94a3b8", PRATA: "#cbd5e1", OURO: "#facc15", DIAMANTE: "#67e8f9" };

/**
 * Topo com seletor de perfil + escada de níveis + simulador (D252, PV4). O perfil muda o texto, a comissão, a escada,
 * o simulador e a chamada sem sair da página; as subpáginas só trocam o perfil inicial.
 */
export function CaptacaoInterativa({ inicial, regras, planos, bonus, marca }: Props) {
  const [perfil, setPerfil] = React.useState<PerfilCaptacao>(inicial);
  const [porMes, setPorMes] = React.useState(3);
  const [plano, setPlano] = React.useState(Math.min(1, planos.length - 1));
  const p = PERFIS[perfil]; const r = regras[perfil];
  const mensal = planos[plano]?.mensalCents ?? 0;
  const exemplo = planos[Math.min(1, planos.length - 1)];
  const escada = exemplo ? escadaDoPerfil(r, p.kind, exemplo.mensalCents) : [];
  const meses = [1, 12, 24].map((m) => ({ m, ...ganhoNoMes(r, p.kind, porMes, mensal, m) }));
  const cadastro = `/parceiros/cadastro?perfil=${perfil}`;
  const trocar = (k: PerfilCaptacao) => { setPerfil(k); try { window.history.replaceState(null, "", PERFIS[k].rota); } catch { /* sem histórico */ } };

  return (
    <>
      <section className="ec-cabecalho px-4 !pb-20 md:!pt-20">
        <div className="mx-auto max-w-6xl">
          <p className="ec-tag"><i aria-hidden />Programa de Parceiros {marca}</p>
          <div className="mt-6 inline-flex flex-wrap gap-1 rounded-full border border-white/15 bg-white/5 p-1" role="group" aria-label="Escolha o seu perfil">
            {PERFIL_LISTA.map((k) => { const I = ICONE[k]; return (
              <button key={k} type="button" aria-pressed={perfil === k} onClick={() => trocar(k)} className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${perfil === k ? "bg-white text-[#12133a]" : "text-white/80 hover:text-white"}`}><I className="size-4" aria-hidden />{PERFIS[k].rotulo}</button>
            ); })}
          </div>
          <h1 className="ec-cabecalho-titulo mt-6 max-w-4xl" aria-live="polite">{p.titulo}</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">Ganhe <b className="text-white">{pct(r.primeiraBps)}</b> da 1ª mensalidade e <b className="text-white">{pct(r.recorrenteBps)} todo mês enquanto o cliente ficar</b>, já no nível inicial.{perfil === "vendedor" ? <> E mais <b className="text-white">{formatBRL(bonus.ativacaoCents)} por loja ativada</b> e <b className="text-white">{formatBRL(bonus.metaCents)}</b> ao chegar a {bonus.metaAtivacoes} no mês.</> : null} Quanto mais clientes ativos, mais você ganha.</p>
          <p className="mt-3 text-sm text-white/60">Para quem: {p.quem}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href={cadastro} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-bold text-[#12133a]">{p.chamada} <ArrowRight className="size-4" aria-hidden /></Link>
            <a href="#simulador" className="font-semibold underline underline-offset-4">Simular meus ganhos</a>
          </div>
        </div>
      </section>

      <section className="bg-surface px-4 py-16 md:py-24" aria-labelledby="escada-t">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow im-eyebrow--claro">Escada de níveis</p>
          <h2 id="escada-t" className="im-h2 mt-3 max-w-3xl text-foreground">Quanto mais clientes ativos, maior a sua parte de cada mensalidade.</h2>
          <p className="mt-3 max-w-2xl text-body">Valores do perfil <b>{p.rotulo.replace("Sou ", "")}</b>, por cliente no plano {exemplo?.nome} ({exemplo ? formatBRL(exemplo.mensalCents) : "—"}/mês). O nível sobe na hora e só desce depois de 2 meses abaixo do mínimo.</p>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {escada.map((n, i) => (
              <li key={n.tier} className={`relative overflow-hidden ${i === 3 ? "ec-painel p-6 text-white" : "ec-cartao"}`}>
                <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: COR_NIVEL[n.tier] }} />
                <p className={`text-xs font-semibold uppercase tracking-wider ${i === 3 ? "text-white/70" : "text-muted-foreground"}`}>{n.minimo ? `${n.minimo}+ clientes ativos` : "Desde o 1º cliente"}</p>
                <h3 className="mt-2 text-2xl font-extrabold">{n.nome}</h3>
                <p className="mt-4 font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tabular-nums">{pct(n.recBps)}</p>
                <p className={`text-sm ${i === 3 ? "text-white/80" : "text-body"}`}>todo mês, por cliente: <b className="tabular-nums">{formatBRL(n.porClienteCents)}</b></p>
                <p className={`mt-3 text-xs ${i === 3 ? "text-white/70" : "text-muted-foreground"}`}>{n.efeito}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="simulador" className="scroll-mt-16 bg-canvas px-4 py-16 md:py-24" aria-labelledby="sim-t">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow im-eyebrow--claro">Simulador</p>
          <h2 id="sim-t" className="im-h2 mt-3 max-w-3xl text-foreground">Quanto a sua carteira pode render.</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
            <div className="ec-cartao space-y-6">
              <fieldset>
                <legend className="text-sm font-semibold">Perfil</legend>
                <div className="mt-2 flex flex-wrap gap-2">{PERFIL_LISTA.map((k) => <button key={k} type="button" aria-pressed={perfil === k} onClick={() => trocar(k)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${perfil === k ? "border-transparent bg-foreground text-surface" : "border-border hover:border-foreground/40"}`}>{PERFIS[k].rotulo.replace("Sou ", "")}</button>)}</div>
              </fieldset>
              <div>
                <label htmlFor="sim-lojas" className="flex items-baseline justify-between text-sm font-semibold"><span>Lojas novas por mês</span><output htmlFor="sim-lojas" className="text-2xl font-extrabold tabular-nums text-link">{porMes}</output></label>
                <input id="sim-lojas" type="range" min={1} max={30} value={porMes} onChange={(e) => setPorMes(Number(e.target.value))} className="cm-range mt-3 w-full" />
              </div>
              <fieldset>
                <legend className="text-sm font-semibold">Plano que elas assinam</legend>
                <div className="mt-2 flex flex-wrap gap-2">{planos.map((pl, i) => <button key={pl.nome} type="button" aria-pressed={plano === i} onClick={() => setPlano(i)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${plano === i ? "border-transparent bg-foreground text-surface" : "border-border hover:border-foreground/40"}`}>{pl.nome} · {formatBRL(pl.mensalCents)}</button>)}</div>
              </fieldset>
              <p className="text-xs text-muted-foreground">Estimativa com as regras atuais, supondo que nenhuma loja cancele. Cancelamentos reduzem o valor. Na Black, a 1ª mensalidade paga 100% (não entra aqui). Não é promessa de ganho.</p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3" aria-live="polite">
              {meses.map((x, i) => (
                <li key={x.m} className={i === 2 ? "ec-painel p-6 text-white" : "ec-cartao"}>
                  <p className={`text-sm font-semibold ${i === 2 ? "text-white/70" : "text-muted-foreground"}`}>{x.m === 1 ? "No 1º mês" : `No ${x.m}º mês`}</p>
                  <p className={`mt-2 font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tabular-nums ${i === 2 ? "text-emerald-300" : ""}`}>{formatBRL(x.cents)}</p>
                  <p className={`mt-2 text-xs ${i === 2 ? "text-white/70" : "text-muted-foreground"}`}>{x.m === 1 ? `${porMes} loja${porMes === 1 ? "" : "s"} nova${porMes === 1 ? "" : "s"}` : `${porMes * (x.m - 1)} clientes na carteira · nível ${PERFIL_NIVEL[x.tier]} (${pct(x.recBps)})`}{x.bonusCents ? ` · inclui ${formatBRL(x.bonusCents)} de bônus` : ""}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-8"><Link href={cadastro} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-foreground px-6 font-bold text-surface">{p.chamada} <ArrowRight className="size-4" aria-hidden /></Link></div>
        </div>
      </section>
    </>
  );
}
const PERFIL_NIVEL: Record<string, string> = { INICIAL: "Inicial", PRATA: "Prata", OURO: "Ouro", DIAMANTE: "Diamante" };
