"use client";
import * as React from "react";
import { formatBRL } from "@/lib/money";

/**
 * Simulador de ganhos do parceiro (D220): quantas lojas por mês e qual plano. Mostra o 1º mês e o mês 12 (com a carteira
 * acumulada), para indicador e agência. Estimativa pelas regras vigentes, sem promessa de ganho (cancelamentos reduzem).
 */
export function SimuladorParceiro({ planos, indicador, agencia }: { planos: { nome: string; mensalCents: number }[]; indicador: { primeiraBps: number; recorrenteBps: number; meses: number }; agencia: { primeiraBps: number; recorrenteBps: number; meses: number } }) {
  const [porMes, setPorMes] = React.useState(5);
  const [plano, setPlano] = React.useState(Math.min(1, planos.length - 1));
  const m = planos[plano]?.mensalCents ?? 0;
  const ganho = (r: { primeiraBps: number; recorrenteBps: number; meses: number }, mes: number) => {
    // no mês N: as lojas novas do mês pagam a 1ª; as dos meses anteriores (dentro do prazo da recorrência) pagam a recorrente.
    const novas = porMes * m * r.primeiraBps / 10_000;
    const antigas = Math.min(mes - 1, r.meses) * porMes * m * r.recorrenteBps / 10_000;
    return Math.round(novas + antigas);
  };
  const linha = (t: string, r: typeof indicador, destaque?: boolean) => (
    <div className={destaque ? "ec-painel p-6 text-white" : "ec-cartao"}>
      <p className={`text-sm font-semibold ${destaque ? "text-white/70" : "text-muted-foreground"}`}>{t}</p>
      <p className="mt-3 text-sm">No 1º mês</p>
      <p className="font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tabular-nums">{formatBRL(ganho(r, 1))}</p>
      <p className="mt-3 text-sm">No 12º mês, com a carteira acumulada</p>
      <p className={`font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tabular-nums ${destaque ? "text-emerald-300" : "text-success"}`}>{formatBRL(ganho(r, 12))}<span className="text-base font-semibold">/mês</span></p>
    </div>
  );
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
      <div className="ec-cartao space-y-6">
        <div>
          <label htmlFor="sim-lojas" className="flex items-baseline justify-between text-sm font-semibold"><span>Lojas indicadas por mês</span><output htmlFor="sim-lojas" className="text-2xl font-extrabold tabular-nums text-link">{porMes}</output></label>
          <input id="sim-lojas" type="range" min={1} max={30} value={porMes} onChange={(e) => setPorMes(Number(e.target.value))} className="cm-range mt-3 w-full" />
        </div>
        <fieldset>
          <legend className="text-sm font-semibold">Plano que elas assinam</legend>
          <div className="mt-2 flex flex-wrap gap-2">{planos.map((p, i) => <button key={p.nome} type="button" aria-pressed={plano === i} onClick={() => setPlano(i)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${plano === i ? "border-transparent bg-foreground text-surface" : "border-border hover:border-foreground/40"}`}>{p.nome} · {formatBRL(p.mensalCents)}</button>)}</div>
        </fieldset>
        <p className="text-xs text-muted-foreground">Estimativa com as regras atuais do programa, supondo que as lojas continuam pagando. Cancelamentos reduzem o valor. Não é promessa de ganho.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{linha("Como indicador", indicador)}{linha("Como agência parceira", agencia, true)}</div>
    </div>
  );
}
