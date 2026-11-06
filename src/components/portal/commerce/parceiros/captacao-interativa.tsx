"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Building2, Check, IdCard, Megaphone, Store, Swords, Users, X } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { BARREIRAS, CAMBIO_USD, CONSULTA_CONCORRENTES, PERFIS, PERFIL_LISTA, PROGRAMAS_CONCORRENTES, RAIO_X_CONCORRENTES, SHOPIFY_BR_CENTS, SHOPIFY_BR_USD, comparativoDeParceiros, escadaDoPerfil, MESES_DA_DISPUTA, ganhoNoMes, trilhaDoPerfil, type PerfilCaptacao, type RegraPerfil, type Trilha } from "@/lib/finance/captacao-regras";
import "./arena.css";

type Props = {
  inicial: PerfilCaptacao;
  regras: Record<PerfilCaptacao, RegraPerfil & { anualBps: number }>;
  planos: { nome: string; mensalCents: number }[];
  marca: string;
  saqueMinimoCents: number;
  atribuicaoDias: number;
};
const ICONE = { indicacao: Users, criador: Megaphone, vendedor: Store, agencia: Building2 } as const;
const pct = (bps: number) => `${(bps / 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const COR_NIVEL: Record<string, string> = { INICIAL: "#94a3b8", PRATA: "#cbd5e1", OURO: "#22e08a" };
const NIVEL: Record<string, string> = { INICIAL: "Inicial", PRATA: "Prata", OURO: "Ouro", DIAMANTE: "Ouro" };
const NOME_TRILHA: Record<Trilha, string> = { cpf: "Programa de Indicações (CPF)", cnpj: "Programa de Parceiros (CNPJ)" };

/**
 * Página de captação de parceiros (D252; regra única D260; tom e visual D261; trilhas CPF e CNPJ na D263).
 * Duas frentes: Indicações pelo CPF (5 pontos a menos) e Parceiros com CNPJ (criador, vendedor, agência; a agência tem
 * benefícios exclusivos, que a equipe apresenta). Cada trilha é comparada com o programa equivalente dos concorrentes,
 * pela renda que entra por mês.
 */
export function CaptacaoInterativa({ inicial, regras, planos, marca, saqueMinimoCents, atribuicaoDias }: Props) {
  const [perfil, setPerfil] = React.useState<PerfilCaptacao>(inicial);
  const [trilha, setTrilha] = React.useState<Trilha>(trilhaDoPerfil(inicial));
  const [porMes, setPorMes] = React.useState(3);
  const [plano, setPlano] = React.useState(Math.min(1, planos.length - 1));
  const [mes, setMes] = React.useState(24);
  const p = PERFIS[perfil]; const r = regras[perfil];
  const pf = trilha === "cpf";
  const mensal = planos[plano]?.mensalCents ?? 0;
  const exemplo = planos[Math.min(1, planos.length - 1)];
  const escadaCnpj = exemplo ? escadaDoPerfil(r, exemplo.mensalCents, false) : [];
  const escadaCpf = exemplo ? escadaDoPerfil(r, exemplo.mensalCents, true) : [];
  const escada = pf ? escadaCpf : escadaCnpj;
  const meses = [1, 12, 24].map((m) => ({ m, ...ganhoNoMes(r, porMes, mensal, m, pf) }));
  const disputa = comparativoDeParceiros(r, porMes, mensal, mes, trilha);
  const nos = disputa[0]!; const melhorRival = [...disputa.slice(1)].sort((a, b) => b.porMesCents - a.porMesCents)[0];
  const maior = Math.max(...disputa.map((c) => c.porMesCents), 1);
  const cadastro = `/parceiros/cadastro?perfil=${perfil}`;
  const trocar = (k: PerfilCaptacao) => { setPerfil(k); setTrilha(trilhaDoPerfil(k)); try { window.history.replaceState(null, "", PERFIS[k].rota); } catch { /* sem histórico */ } };

  return (
    <>
      <section className="ec-cabecalho px-4 !pb-20 md:!pt-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center">
          <div>
            <p className="ec-tag"><i aria-hidden />Programa de Parceiros {marca}</p>
            <div className="mt-6 grid w-full grid-cols-2 gap-1 rounded-3xl border border-white/15 bg-white/5 p-1 sm:flex sm:w-fit sm:rounded-full" role="group" aria-label="Escolha o seu perfil">
              {PERFIL_LISTA.map((k) => { const I = ICONE[k]; return (
                <button key={k} type="button" aria-pressed={perfil === k} onClick={() => trocar(k)} className={`inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-semibold transition sm:gap-2 sm:px-4 sm:text-sm ${perfil === k ? "bg-white text-[#12133a]" : "text-white/80 hover:text-white"}`}><I className="size-4" aria-hidden />{PERFIS[k].rotulo}</button>
              ); })}
            </div>
            <h1 className="ec-cabecalho-titulo mt-6 max-w-4xl" aria-live="polite">{p.titulo}</h1>
            {perfil === "indicacao" ? (
              <p className="mt-5 max-w-2xl text-lg text-white/80">Nuvemshop e WBuy exigem nota fiscal para pagar comissão. A Shopify paga US$ {SHOPIFY_BR_USD} uma vez e acabou. Aqui você indica com o seu <b className="text-white">CPF</b> e ganha <b className="text-white">{escadaCpf[0] ? pct(escadaCpf[0].recBps) : "—"} de toda mensalidade</b>, todo mês, chegando a <b className="text-white">{escadaCpf[2] ? pct(escadaCpf[2].recBps) : "—"}</b>. Saque por Pix, sem nota.</p>
            ) : (
              <p className="mt-5 max-w-2xl text-lg text-white/80">Parceiro com CNPJ ganha <b className="text-white">{escadaCnpj[0] ? pct(escadaCnpj[0].recBps) : "—"} de toda mensalidade desde o 1º cliente</b>, enquanto ele ficar, chegando a <b className="text-white">{escadaCnpj[2] ? pct(escadaCnpj[2].recBps) : "—"}</b> na carteira toda. Sem nível para começar e sem anexar nota para receber.{perfil === "agencia" ? <> <b className="text-white">Agências têm benefícios exclusivos</b>, apresentados pela nossa equipe depois do cadastro.</> : null}</p>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href={cadastro} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-bold text-[#12133a]">{p.chamada} <ArrowRight className="size-4" aria-hidden /></Link>
              <a href="#raio-x" className="font-semibold underline underline-offset-4">Ver o raio-x dos concorrentes</a>
            </div>
          </div>
          <div className="pa-console" aria-label="Resumo da regra">
            <div className="pa-console-barra" aria-hidden><i /><i /><i /></div>
            <p className="text-xs uppercase tracking-[.14em] text-white/60">{pf ? "indicacao_cpf.ts" : "parceiro_cnpj.ts"}</p>
            <p className="pa-pct mt-2">{escada[0] ? pct(escada[0].recBps) : "—"}</p>
            <p className="mt-1 text-sm text-white/80">de toda mensalidade, desde o 1º cliente</p>
            <dl className="mt-5">
              {escada.slice(1).map((n) => <div key={n.tier}><dt>{n.minimo}+ clientes ativos</dt><dd><b>{pct(n.recBps)}</b> na carteira toda</dd></div>)}
              <div><dt>documento</dt><dd>{pf ? "CPF" : "CNPJ"}</dd></div>
              <div><dt>nota fiscal p/ receber</dt><dd>não precisa</dd></div>
              <div><dt>saque por Pix</dt><dd>a partir de {formatBRL(saqueMinimoCents)}</dd></div>
              <div><dt>link vale</dt><dd>{atribuicaoDias} dias</dd></div>
              {perfil === "agencia" ? <div><dt>agência</dt><dd><b>benefícios exclusivos</b></dd></div> : null}
            </dl>
          </div>
        </div>
      </section>

      <section id="raio-x" className="pa-escuro pa-escuro--rubi scroll-mt-16 px-4 py-16 md:py-24" aria-labelledby="rx-t">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow">Raio-x dos concorrentes</p>
          <h2 id="rx-t" className="im-h2 mt-3 max-w-4xl">Pedem nota fiscal, pagam em dólar ou pagam uma vez só. Está escrito nas regras deles.</h2>
          <p className="pa-sub mt-4 max-w-2xl">Cada ponto abaixo vem da página oficial do programa, com o link. Confira você mesmo.</p>
          <ul className="pa-golpes mt-10">
            {RAIO_X_CONCORRENTES.map((g) => (
              <li key={g.id} className={`pa-golpe ${g.destaque ? "pa-golpe--destaque" : ""}`}>
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

      <section className="pa-escuro px-4 py-16 md:py-24" aria-labelledby="cpf-t">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:items-center">
          <div>
            <p className="im-eyebrow">A barreira deles</p>
            <h2 id="cpf-t" className="im-h2 mt-3 max-w-3xl">Eles exigem nota fiscal para te pagar. Aqui, não.</h2>
            <p className="pa-sub mt-4 max-w-2xl">Para receber a comissão na Nuvemshop ou na WBuy, você precisa emitir nota fiscal. Sem empresa, a Nuvemshop ainda desconta INSS, IRRF e ISS. Aqui, você recebe por Pix direto do painel, no CPF ou no CNPJ, a partir de {formatBRL(saqueMinimoCents)}.</p>
          </div>
          <ul className="space-y-3">
            <li className="pa-aqui !items-start"><IdCard className="mt-0.5 size-5 shrink-0" aria-hidden /><span><b>{marca}:</b> CPF ou CNPJ. Pix pelo painel, sem anexar nota fiscal.</span></li>
            {BARREIRAS.map((b) => (
              <li key={b.nome} className="pa-barreira"><X className="mt-0.5 size-5 shrink-0" aria-hidden /><span><b>{b.nome}:</b> {b.barreira} <a href={b.fonte} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Ver a regra deles</a></span></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="pa-escuro px-4 py-16 md:py-24" aria-labelledby="escada-t">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow">Escada de níveis</p>
          <h2 id="escada-t" className="im-h2 mt-3 max-w-3xl">Régua pública. Sem letra miúda.</h2>
          <p className="pa-sub mt-3 max-w-2xl">Duas frentes: <b className="text-white">Parceiros com CNPJ</b> (criador, vendedor e agência) e <b className="text-white">Indicações pelo CPF</b>, para qualquer pessoa. Valores por cliente no plano {exemplo?.nome} ({exemplo ? formatBRL(exemplo.mensalCents) : "—"}/mês). O nível sobe na hora, vale para a carteira inteira e só desce depois de 2 meses abaixo do mínimo.</p>
          <ol className="pa-degraus mt-10">
            {escadaCnpj.map((n, i) => (
              <li key={n.tier} className={`pa-degrau ${i === escadaCnpj.length - 1 ? "pa-degrau--topo" : ""}`} style={{ "--n": i, "--c": COR_NIVEL[n.tier] } as React.CSSProperties}>
                <p className="ec-mono text-white/60">{n.minimo ? `${n.minimo}+ clientes ativos` : "Desde o 1º cliente"}</p>
                <h3 className="mt-2 text-2xl font-extrabold text-white">{n.nome}</h3>
                <p className="mt-3 font-[family-name:var(--nl-font-display)] text-5xl font-extrabold tabular-nums text-white">{pct(n.recBps)}</p>
                <p className="mt-2 text-sm text-white/75">com CNPJ · <b className="ec-num text-white">{formatBRL(n.porClienteCents)}</b> por cliente/mês</p>
                <p className="mt-1 text-sm text-white/60">pelo CPF: <b className="ec-num text-white/90">{escadaCpf[i] ? pct(escadaCpf[i]!.recBps) : "—"}</b> · {escadaCpf[i] ? formatBRL(escadaCpf[i]!.porClienteCents) : "—"}</p>
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
              <fieldset>
                <legend className="text-sm font-semibold text-white">Vou receber no</legend>
                <div className="mt-2 flex flex-wrap gap-2">{(["cpf", "cnpj"] as const).map((t) => <button key={t} type="button" aria-pressed={trilha === t} onClick={() => setTrilha(t)} className="pa-chip">{t === "cpf" ? "CPF (indicações)" : "CNPJ (parceiro)"}</button>)}</div>
              </fieldset>
              <div>
                <label htmlFor="sim-lojas" className="flex items-baseline justify-between text-sm font-semibold text-white"><span>Lojas novas por mês</span><output htmlFor="sim-lojas" className="ec-num text-3xl font-bold text-[#22e08a]">{porMes}</output></label>
                <input id="sim-lojas" type="range" min={1} max={30} value={porMes} onChange={(e) => setPorMes(Number(e.target.value))} className="cm-range mt-3 w-full" />
              </div>
              <fieldset>
                <legend className="text-sm font-semibold text-white">Plano que elas assinam</legend>
                <div className="mt-2 flex flex-wrap gap-2">{planos.map((pl, i) => <button key={pl.nome} type="button" aria-pressed={plano === i} onClick={() => setPlano(i)} className="pa-chip">{pl.nome} · {formatBRL(pl.mensalCents)}</button>)}</div>
              </fieldset>
              <p className="text-xs text-white/55">Estimativa com as regras atuais, supondo que nenhuma loja cancele. Cancelamentos reduzem o valor. Não é promessa de ganho.</p>
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
          <p className="im-eyebrow">Compare o seu programa · {NOME_TRILHA[trilha]}</p>
          <h2 id="cmp-t" className="im-h2 mt-3 max-w-4xl">{pf ? "Indicação contra indicação: quanto entra todo mês." : "Parceiro contra parceiro: quanto entra todo mês."}</h2>
          <p className="pa-sub mt-3 max-w-2xl">{pf ? "Comparado com os programas de indicação da Shopify e da Nuvemshop." : "Comparado com os programas de parceiros da Nuvemshop, da Tray e da WBuy."} Com {porMes} loja{porMes === 1 ? "" : "s"} por mês no plano {planos[plano]?.nome ?? "—"} (mude no simulador acima), a <b className="text-white">mesma mensalidade</b> para todos e nenhum cancelamento.</p>
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Mês da comparação">
              {MESES_DA_DISPUTA.map((m) => <button key={m} type="button" aria-pressed={mes === m} onClick={() => setMes(m)} className="pa-chip">{m}º mês</button>)}
            </div>
            {melhorRival && nos.porMesCents > melhorRival.porMesCents ? <div className="lg:text-right"><p className="ec-mono text-white/60">por mês a mais que o 2º colocado</p><p className="pa-vantagem ec-num mt-1">+{formatBRL(nos.porMesCents - melhorRival.porMesCents)}</p></div> : null}
          </div>
          <ol className="pa-disputa mt-8 space-y-3" aria-live="polite">
            {disputa.map((c) => {
              const eNos = c.id === "nextlevel";
              const prog = PROGRAMAS_CONCORRENTES.find((x) => x.id === c.id);
              return (
                <li key={c.id} className={eNos ? "pa-nos" : prog?.destaque ? "pa-rival" : undefined}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="font-bold text-white">{eNos ? `${marca} · ${pf ? "Indicações (CPF)" : "Parceiros (CNPJ)"}` : c.nome}</p>
                    <p className="ec-num"><b className={`text-2xl font-bold ${eNos ? "text-[#22e08a]" : "text-white"}`}>{formatBRL(c.porMesCents)}</b> <span className="text-sm text-white/60">por mês no {mes}º mês</span></p>
                  </div>
                  <div className="pa-trilho mt-3" aria-hidden><span className="pa-cheia" style={{ "--w": `${Math.max(2, Math.round((c.porMesCents / maior) * 100))}%` } as React.CSSProperties} /></div>
                  <p className="mt-2 text-xs text-white/65">{eNos ? `${escada.map((n) => `${pct(n.recBps)} ${n.minimo ? `com ${n.minimo}` : "desde o 1º cliente"}`).join(", ")} clientes ativos · Pix sem nota fiscal` : <>{prog?.regra} · <b className="text-[#ffb3c8]">{prog?.barreira}</b> · <a href={prog?.fonte} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">fonte</a></>}</p>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-xs text-white/50">Regras dos concorrentes conforme os sites oficiais, consultados em {CONSULTA_CONCORRENTES}. Cada plataforma tem a sua mensalidade; aqui usamos a mesma para comparar só a regra de comissão. Shopify convertida pelo dólar oficial (PTAX) de {CAMBIO_USD.data}: US$ {SHOPIFY_BR_USD} ≈ {formatBRL(SHOPIFY_BR_CENTS)}. Simulação, não promessa de ganho.</p>
          <div className="mt-8"><Link href={cadastro} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#22e08a] px-6 font-bold text-[#060a16]">{p.chamada} <ArrowRight className="size-4" aria-hidden /></Link></div>
        </div>
      </section>
    </>
  );
}
