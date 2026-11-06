"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Building2, Check, Megaphone, Store, Swords } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { CONSULTA_CONCORRENTES, PERFIS, PERFIL_LISTA, PROGRAMAS_CONCORRENTES, RAIO_X_CONCORRENTES, comparativoDeParceiros, escadaDoPerfil, ganhoNoMes, type PerfilCaptacao, type RegraPerfil } from "@/lib/finance/captacao-regras";
import "./arena.css";

type Props = {
  inicial: PerfilCaptacao;
  regras: Record<PerfilCaptacao, RegraPerfil & { anualBps: number }>;
  planos: { nome: string; mensalCents: number }[];
  marca: string;
  saqueMinimoCents: number;
  atribuicaoDias: number;
};
const ICONE = { criador: Megaphone, vendedor: Store, agencia: Building2 } as const;
const pct = (bps: number) => `${(bps / 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const COR_NIVEL: Record<string, string> = { INICIAL: "#94a3b8", PRATA: "#cbd5e1", OURO: "#22e08a" };
const NIVEL: Record<string, string> = { INICIAL: "Inicial", PRATA: "Prata", OURO: "Ouro", DIAMANTE: "Ouro" };

/**
 * Página de captação de parceiros (D252, regra única na D260, visual e tom da D261): topo com o console da regra,
 * escada em degraus, simulador, raio-x dos concorrentes (ponto fraco + fato + fonte) e a disputa de ganhos.
 * Regra única: o perfil muda só o texto e a chamada; o ganho é o mesmo para todos.
 */
export function CaptacaoInterativa({ inicial, regras, planos, marca, saqueMinimoCents, atribuicaoDias }: Props) {
  const [perfil, setPerfil] = React.useState<PerfilCaptacao>(inicial);
  const [porMes, setPorMes] = React.useState(3);
  const [plano, setPlano] = React.useState(Math.min(1, planos.length - 1));
  const [prazo, setPrazo] = React.useState(24);
  const p = PERFIS[perfil]; const r = regras[perfil];
  const mensal = planos[plano]?.mensalCents ?? 0;
  const exemplo = planos[Math.min(1, planos.length - 1)];
  const escada = exemplo ? escadaDoPerfil(r, exemplo.mensalCents) : [];
  const meses = [1, 12, 24].map((m) => ({ m, ...ganhoNoMes(r, porMes, mensal, m) }));
  const comparacao = comparativoDeParceiros(r, porMes, mensal, prazo);
  const maior = Math.max(...comparacao.map((c) => c.total), 1);
  const nos = comparacao[0]!; const segundo = [...comparacao.slice(1)].sort((a, b) => b.total - a.total)[0];
  const cadastro = `/parceiros/cadastro?perfil=${perfil}`;
  const trocar = (k: PerfilCaptacao) => { setPerfil(k); try { window.history.replaceState(null, "", PERFIS[k].rota); } catch { /* sem histórico */ } };

  return (
    <>
      <section className="ec-cabecalho px-4 !pb-20 md:!pt-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center">
          <div>
            <p className="ec-tag"><i aria-hidden />Programa de Parceiros {marca}</p>
            <div className="mt-6 grid w-full grid-cols-3 gap-1 rounded-full border border-white/15 bg-white/5 p-1 sm:flex sm:w-fit" role="group" aria-label="Escolha o seu perfil">
              {PERFIL_LISTA.map((k) => { const I = ICONE[k]; return (
                <button key={k} type="button" aria-pressed={perfil === k} onClick={() => trocar(k)} className={`inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 text-xs font-semibold transition sm:gap-2 sm:px-4 sm:text-sm ${perfil === k ? "bg-white text-[#12133a]" : "text-white/80 hover:text-white"}`}><I className="size-4" aria-hidden />{PERFIS[k].rotulo}</button>
              ); })}
            </div>
            <h1 className="ec-cabecalho-titulo mt-6 max-w-4xl" aria-live="polite">{p.titulo}</h1>
            <p className="mt-5 max-w-2xl text-lg text-white/80">Na Nuvemshop, na WBuy e na Tray o parceiro começa ganhando pouco, ganha tarde ou ganha uma vez só. Aqui é <b className="text-white">{escada[0] ? pct(escada[0].recBps) : "—"} de toda mensalidade desde o 1º cliente</b>, enquanto ele ficar, chegando a <b className="text-white">{escada[2] ? pct(escada[2].recBps) : "—"}</b> na carteira toda.</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href={cadastro} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-bold text-[#12133a]">{p.chamada} <ArrowRight className="size-4" aria-hidden /></Link>
              <a href="#raio-x" className="font-semibold underline underline-offset-4">Ver o raio-x dos concorrentes</a>
            </div>
          </div>
          <div className="pa-console" aria-label="Resumo da regra">
            <div className="pa-console-barra" aria-hidden><i /><i /><i /></div>
            <p className="text-xs uppercase tracking-[.14em] text-white/60">regra_unica.ts</p>
            <p className="pa-pct mt-2">{escada[0] ? pct(escada[0].recBps) : "—"}</p>
            <p className="mt-1 text-sm text-white/80">de toda mensalidade, desde o 1º cliente</p>
            <dl className="mt-5">
              {escada.slice(1).map((n) => <div key={n.tier}><dt>{n.minimo}+ clientes ativos</dt><dd><b>{pct(n.recBps)}</b> na carteira toda</dd></div>)}
              <div><dt>nível para começar</dt><dd>nenhum</dd></div>
              <div><dt>saque por Pix</dt><dd>a partir de {formatBRL(saqueMinimoCents)}</dd></div>
              <div><dt>link vale</dt><dd>{atribuicaoDias} dias</dd></div>
              <div><dt>CPF ou CNPJ</dt><dd>os dois</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section id="raio-x" className="pa-escuro pa-escuro--rubi scroll-mt-16 px-4 py-16 md:py-24" aria-labelledby="rx-t">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow">Raio-x dos concorrentes</p>
          <h2 id="rx-t" className="im-h2 mt-3 max-w-4xl">Pagam pouco, pagam tarde ou pagam uma vez só. Está escrito nas regras deles.</h2>
          <p className="pa-sub mt-4 max-w-2xl">Cada ponto abaixo vem da página oficial do programa, com o link. Confira você mesmo.</p>
          <ul className="pa-golpes mt-10">
            {RAIO_X_CONCORRENTES.map((g) => (
              <li key={g.id} className="pa-golpe">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="pa-fraco"><Swords className="size-3.5" aria-hidden />Ponto fraco</span><span className="text-sm font-semibold text-white/80">{g.nome}</span></div>
                <h3>{g.golpe}</h3>
                <p className="pa-fato">{g.fato} <a href={g.fonte} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap underline underline-offset-2">Ver a regra deles</a></p>
                <p className="pa-aqui"><Check className="size-4 shrink-0" aria-hidden />{g.resposta}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-white/50">Regras conforme os sites oficiais, consultados em {CONSULTA_CONCORRENTES}. Se mudarem, atualizamos aqui.</p>
        </div>
      </section>

      <section className="pa-escuro px-4 py-16 md:py-24" aria-labelledby="escada-t">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow">Escada de níveis</p>
          <h2 id="escada-t" className="im-h2 mt-3 max-w-3xl">Régua pública. Sem letra miúda.</h2>
          <p className="pa-sub mt-3 max-w-2xl">A mesma regra para criador, vendedor e agência. Valores por cliente no plano {exemplo?.nome} ({exemplo ? formatBRL(exemplo.mensalCents) : "—"}/mês). O nível sobe na hora, vale para a carteira inteira e só desce depois de 2 meses abaixo do mínimo.</p>
          <ol className="pa-degraus mt-10">
            {escada.map((n, i) => (
              <li key={n.tier} className={`pa-degrau ${i === escada.length - 1 ? "pa-degrau--topo" : ""}`} style={{ "--n": i, "--c": COR_NIVEL[n.tier] } as React.CSSProperties}>
                <p className="ec-mono text-white/60">{n.minimo ? `${n.minimo}+ clientes ativos` : "Desde o 1º cliente"}</p>
                <h3 className="mt-2 text-2xl font-extrabold text-white">{n.nome}</h3>
                <p className="mt-3 font-[family-name:var(--nl-font-display)] text-5xl font-extrabold tabular-nums text-white">{pct(n.recBps)}</p>
                <p className="mt-2 text-sm text-white/75">de toda mensalidade · <b className="ec-num text-white">{formatBRL(n.porClienteCents)}</b> por cliente/mês</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="simulador" className="pa-escuro scroll-mt-16 px-4 py-16 md:py-24" aria-labelledby="sim-t">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow">Simulador</p>
          <h2 id="sim-t" className="im-h2 mt-3 max-w-3xl">Quanto a sua carteira pode render.</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
            <div className="pa-controle space-y-6">
              <div>
                <label htmlFor="sim-lojas" className="flex items-baseline justify-between text-sm font-semibold text-white"><span>Lojas novas por mês</span><output htmlFor="sim-lojas" className="ec-num text-3xl font-bold text-[#22e08a]">{porMes}</output></label>
                <input id="sim-lojas" type="range" min={1} max={30} value={porMes} onChange={(e) => setPorMes(Number(e.target.value))} className="cm-range mt-3 w-full" />
              </div>
              <fieldset>
                <legend className="text-sm font-semibold text-white">Plano que elas assinam</legend>
                <div className="mt-2 flex flex-wrap gap-2">{planos.map((pl, i) => <button key={pl.nome} type="button" aria-pressed={plano === i} onClick={() => setPlano(i)} className="pa-chip">{pl.nome} · {formatBRL(pl.mensalCents)}</button>)}</div>
              </fieldset>
              <p className="text-xs text-white/55">Estimativa com as regras atuais, supondo que nenhuma loja cancele. Cancelamentos reduzem o valor. A conta é a mesma para qualquer perfil. Não é promessa de ganho.</p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3" aria-live="polite">
              {meses.map((x, i) => (
                <li key={x.m} className={i === 2 ? "ec-painel p-6" : "pa-controle"}>
                  <p className="ec-mono text-white/60">{x.m === 1 ? "1º mês" : `${x.m}º mês`}</p>
                  <p className={`ec-num mt-3 text-3xl font-bold ${i === 2 ? "text-[#22e08a]" : "text-white"}`}>{formatBRL(x.cents)}</p>
                  <p className="mt-2 text-xs text-white/65">{`${x.carteira} cliente${x.carteira === 1 ? "" : "s"} · nível ${NIVEL[x.tier]} (${pct(x.recBps)})`}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="comparar" className="pa-escuro scroll-mt-16 px-4 py-16 md:py-24" aria-labelledby="cmp-t">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow">Compare o seu programa</p>
          <h2 id="cmp-t" className="im-h2 mt-3 max-w-4xl">{nos.total >= (segundo?.total ?? 0) ? "A mesma carteira em quatro programas. Aqui rende mais." : "Quem paga uma vez só sai na frente no começo. Veja quem paga todo mês."}</h2>
          <p className="pa-sub mt-3 max-w-2xl">Com {porMes} loja{porMes === 1 ? "" : "s"} por mês no plano {planos[plano]?.nome ?? "—"} (mude no simulador acima). Para não ter desculpa: a <b className="text-white">mesma mensalidade</b> para todos e nenhum cancelamento.</p>
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Prazo da comparação">
              {[12, 24, 36].map((m) => <button key={m} type="button" aria-pressed={prazo === m} onClick={() => setPrazo(m)} className="pa-chip">{m} meses</button>)}
            </div>
            {segundo && nos.total > segundo.total ? <div className="lg:text-right"><p className="ec-mono text-white/60">a mais que o 2º colocado</p><p className="pa-vantagem ec-num mt-1">+{formatBRL(Math.max(0, nos.total - segundo.total))}</p></div> : null}
          </div>
          <ol className="pa-disputa mt-8 space-y-3" aria-live="polite">
            {comparacao.map((c) => {
              const eNos = c.id === "nextlevel";
              const fonte = PROGRAMAS_CONCORRENTES.find((x) => x.id === c.id);
              return (
                <li key={c.id} className={eNos ? "pa-nos" : undefined}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="font-bold text-white">{eNos ? marca : c.nome}</p>
                    <p className="ec-num"><b className={`text-2xl font-bold ${eNos ? "text-[#22e08a]" : "text-white"}`}>{formatBRL(c.total)}</b> <span className="text-sm text-white/60">em {prazo} meses</span></p>
                  </div>
                  <div className="pa-trilho mt-3" aria-hidden><span className="pa-cheia" style={{ "--w": `${Math.max(2, Math.round((c.total / maior) * 100))}%` } as React.CSSProperties} /></div>
                  <p className="mt-2 text-xs text-white/65">No {prazo}º mês: <b className="ec-num text-white">{formatBRL(c.ultimo)}</b> por mês · {eNos ? "20% desde o 1º cliente, 24% com 10 e 28% com 25 clientes ativos" : fonte?.regra}{fonte?.ressalva ? ` · ${fonte.ressalva}` : ""}{fonte ? <> · <a href={fonte.fonte} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">fonte</a></> : null}</p>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-xs text-white/50">Regras dos concorrentes conforme os sites oficiais, consultados em {CONSULTA_CONCORRENTES}. Cada plataforma tem a sua mensalidade; aqui usamos a mesma para comparar só a regra de comissão. Simulação, não promessa de ganho.</p>
          <div className="mt-8"><Link href={cadastro} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#22e08a] px-6 font-bold text-[#060a16]">{p.chamada} <ArrowRight className="size-4" aria-hidden /></Link></div>
        </div>
      </section>
    </>
  );
}
