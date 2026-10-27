"use client";
import * as React from "react";
import { formatBRL } from "@/lib/money";
import { freteGratisAPartirDe, lucroPorPeca, pontoDeEquilibrio, precoComMargem, precoParceladoSemJuros, retornoDoAnuncio, simularPromocao } from "@/lib/ferramentas/calculadoras";

/** Calculadoras (W5, D188): calculam com os números digitados, sem prometer resultado. Usadas no painel e na página pública. */
const reais = (s: string) => Math.round((Number(s.replace(/\./g, "").replace(",", ".")) || 0) * 100);
const bps = (s: string) => Math.round((Number(s.replace(",", ".")) || 0) * 100);
const num = (s: string) => Math.max(0, Math.floor(Number(s) || 0));

function Campo({ id, rotulo, valor, onChange, sufixo }: { id: string; rotulo: string; valor: string; onChange: (v: string) => void; sufixo?: string }) {
  return (
    <label htmlFor={id} className="block text-sm font-medium">{rotulo}
      <span className="mt-1 flex items-center gap-2"><input id={id} inputMode="decimal" value={valor} onChange={(e) => onChange(e.target.value)} className="h-11 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-base" />{sufixo ? <span className="shrink-0 text-sm text-muted-foreground">{sufixo}</span> : null}</span>
    </label>
  );
}
function Cartao({ id, titulo, texto, children, resultado }: { id: string; titulo: string; texto: string; children: React.ReactNode; resultado: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="ds-card space-y-3">
      <h2 id={id} className="text-lg font-semibold">{titulo}</h2>
      <p className="text-sm text-muted-foreground">{texto}</p>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
      <div role="status" aria-live="polite" className="rounded-lg bg-surface-muted p-3 text-sm">{resultado}</div>
    </section>
  );
}

export function CalcPreco() {
  const [c, setC] = React.useState("40,00"); const [f, setF] = React.useState("5,00"); const [t, setT] = React.useState("5"); const [m, setM] = React.useState("30");
  const r = precoComMargem({ custoCents: reais(c), fixoPorPecaCents: reais(f), taxasBps: bps(t), margemBps: bps(m) });
  return (
    <Cartao id="calc-preco" titulo="Preço com margem" texto="Quanto cobrar para sobrar a margem que você quer, já descontando as taxas."
      resultado={r ? <>Preço sugerido: <strong>{formatBRL(r.precoCents)}</strong>. Sobram {formatBRL(r.lucroCents)} por peça depois do custo, da embalagem e de {formatBRL(r.taxasCents)} de taxas.</> : "Taxas e margem somadas passam de 100%: não existe preço que feche essa conta."}>
      <Campo id="p-custo" rotulo="Custo da peça" sufixo="R$" valor={c} onChange={setC} />
      <Campo id="p-fixo" rotulo="Embalagem e outros por peça" sufixo="R$" valor={f} onChange={setF} />
      <Campo id="p-taxas" rotulo="Taxas sobre a venda (pagamento, plataforma)" sufixo="%" valor={t} onChange={setT} />
      <Campo id="p-margem" rotulo="Margem que você quer" sufixo="%" valor={m} onChange={setM} />
    </Cartao>
  );
}

export function CalcPromocao() {
  const [p, setP] = React.useState("120,00"); const [c, setC] = React.useState("50,00"); const [t, setT] = React.useState("5"); const [d, setD] = React.useState("15"); const [v, setV] = React.useState("20");
  const r = simularPromocao({ precoCents: reais(p), custoCents: reais(c), taxasBps: bps(t), descontoBps: bps(d), vendasHoje: num(v) });
  return (
    <Cartao id="calc-promo" titulo="Simulador de promoção" texto="Quanto o desconto tira do lucro por peça e quantas vendas são precisas para manter o mesmo lucro do mês."
      resultado={<>Com desconto, o preço fica {formatBRL(r.novoPrecoCents)} e o lucro por peça vai de {formatBRL(r.lucroAntesCents)} para <strong>{formatBRL(r.lucroDepoisCents)}</strong>. {r.vendasNecessarias === null ? "Com esse desconto a peça não dá lucro: nenhuma quantidade compensa." : <>Para manter o mesmo lucro, seriam <strong>{r.vendasNecessarias} vendas</strong> em vez de {num(v)}.</>}</>}>
      <Campo id="pr-preco" rotulo="Preço de hoje" sufixo="R$" valor={p} onChange={setP} />
      <Campo id="pr-custo" rotulo="Custo da peça" sufixo="R$" valor={c} onChange={setC} />
      <Campo id="pr-taxas" rotulo="Taxas sobre a venda" sufixo="%" valor={t} onChange={setT} />
      <Campo id="pr-desc" rotulo="Desconto" sufixo="%" valor={d} onChange={setD} />
      <Campo id="pr-vendas" rotulo="Vendas por mês hoje" valor={v} onChange={setV} />
    </Cartao>
  );
}

export function CalcParcelado() {
  const [p, setP] = React.useState("200,00"); const [t, setT] = React.useState("8");
  const r = precoParceladoSemJuros({ precoCents: reais(p), taxaParcelasBps: bps(t) });
  return (
    <Cartao id="calc-parc" titulo="Parcelado sem juros" texto="Se a loja paga a taxa das parcelas, qual preço mantém o mesmo valor recebido."
      resultado={r ? <>Preço no parcelado: <strong>{formatBRL(r)}</strong> para receber {formatBRL(reais(p))}.</> : "Taxa de 100% ou mais não fecha a conta."}>
      <Campo id="pa-preco" rotulo="Quanto você quer receber" sufixo="R$" valor={p} onChange={setP} />
      <Campo id="pa-taxa" rotulo="Taxa das parcelas" sufixo="%" valor={t} onChange={setT} />
    </Cartao>
  );
}

export function CalcFreteGratis() {
  const [f, setF] = React.useState("25,00"); const [m, setM] = React.useState("30");
  const r = freteGratisAPartirDe({ freteMedioCents: reais(f), margemBps: bps(m) });
  return (
    <Cartao id="calc-frete" titulo="Frete grátis a partir de" texto="A partir de qual valor de pedido a sua margem paga o frete médio sem prejuízo."
      resultado={r ? <>Ofereça frete grátis a partir de <strong>{formatBRL(r)}</strong>: nesse valor, a margem cobre o frete médio de {formatBRL(reais(f))}.</> : "Informe uma margem maior que zero."}>
      <Campo id="fg-frete" rotulo="Frete médio por pedido" sufixo="R$" valor={f} onChange={setF} />
      <Campo id="fg-margem" rotulo="Margem média dos pedidos" sufixo="%" valor={m} onChange={setM} />
    </Cartao>
  );
}

export function CalcEquilibrio() {
  const [fx, setFx] = React.useState("3000,00"); const [p, setP] = React.useState("120,00"); const [c, setC] = React.useState("50,00"); const [t, setT] = React.useState("5");
  const lucro = lucroPorPeca({ precoCents: reais(p), custoCents: reais(c), taxasBps: bps(t) }).lucroCents;
  const r = pontoDeEquilibrio({ custosFixosMesCents: reais(fx), lucroPorPecaCents: lucro });
  return (
    <Cartao id="calc-equil" titulo="Ponto de equilíbrio" texto="Quantas peças por mês pagam os custos fixos (aluguel, internet, plano, salários)."
      resultado={r ? <>São <strong>{r} peças por mês</strong> para cobrir {formatBRL(reais(fx))} de custos fixos ({formatBRL(lucro)} de lucro por peça).</> : "Com esses números a peça não dá lucro."}>
      <Campo id="eq-fixos" rotulo="Custos fixos do mês" sufixo="R$" valor={fx} onChange={setFx} />
      <Campo id="eq-preco" rotulo="Preço médio da peça" sufixo="R$" valor={p} onChange={setP} />
      <Campo id="eq-custo" rotulo="Custo médio da peça" sufixo="R$" valor={c} onChange={setC} />
      <Campo id="eq-taxas" rotulo="Taxas sobre a venda" sufixo="%" valor={t} onChange={setT} />
    </Cartao>
  );
}

export function CalcAnuncio() {
  const [g, setG] = React.useState("500,00"); const [v, setV] = React.useState("2000,00"); const [n, setN] = React.useState("10");
  const r = retornoDoAnuncio({ gastoCents: reais(g), vendasCents: reais(v), clientesNovos: num(n) });
  return (
    <Cartao id="calc-anuncio" titulo="Retorno do anúncio" texto="Quanto voltou em vendas a cada real investido (ROAS) e quanto custou cada cliente novo (CAC)."
      resultado={<>{r.roas !== null ? <>Cada R$ 1,00 investido trouxe <strong>{formatBRL(Math.round(r.roas * 100))}</strong> em vendas. </> : "Informe o valor investido. "}{r.cacCents !== null ? <>Cada cliente novo custou <strong>{formatBRL(r.cacCents)}</strong>.</> : ""}</>}>
      <Campo id="an-gasto" rotulo="Investido no anúncio" sufixo="R$" valor={g} onChange={setG} />
      <Campo id="an-vendas" rotulo="Vendas vindas do anúncio" sufixo="R$" valor={v} onChange={setV} />
      <Campo id="an-clientes" rotulo="Clientes novos" valor={n} onChange={setN} />
    </Cartao>
  );
}
