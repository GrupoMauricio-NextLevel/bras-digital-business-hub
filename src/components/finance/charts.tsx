"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export const compactBRL = (cents: number) => {
  const v = cents / 100, a = Math.abs(v), sign = v < 0 ? "−" : "";
  if (a >= 1_000_000) return `${sign}R$ ${(a / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  if (a >= 1_000) return `${sign}R$ ${(a / 1_000).toFixed(a >= 10_000 ? 0 : 1).replace(".", ",")} mil`;
  return `${sign}R$ ${Math.round(a)}`;
};
export const fullBRL = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function niceScale(min: number, max: number, ticks = 4) {
  const span = Math.max(max - min, 1);
  const raw = span / ticks, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const out: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v));
  return { lo, hi, ticks: out };
}

const W = 720, H = 300, ML = 84, MR = 12, MT = 12, MB = 30;

export type Series = { key: string; label: string; color: string };
export type Column = { label: string; values: Record<string, number> };

/** Colunas empilhadas: barra fina, 4px de arredondamento no topo, 2px de respiro entre segmentos. */
export function StackedColumns({ columns, series, height = H, ariaLabel }: { columns: Column[]; series: Series[]; height?: number; ariaLabel: string }) {
  const [hover, setHover] = React.useState<number | null>(null);
  const [table, setTable] = React.useState(false);
  const totals = columns.map((c) => series.reduce((s, x) => s + Math.max(0, c.values[x.key] ?? 0), 0));
  const scale = niceScale(0, Math.max(...totals, 1));
  const plotW = W - ML - MR, plotH = height - MT - MB;
  const slot = plotW / Math.max(columns.length, 1);
  const bw = Math.min(24, slot * 0.6);
  const y = (v: number) => MT + plotH - ((v - scale.lo) / (scale.hi - scale.lo)) * plotH;
  const GAP = 2, R = 4;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legenda">
          {series.map((s) => <li key={s.key} className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px]" style={{ background: s.color }} />{s.label}</li>)}
        </ul>
        <button type="button" onClick={() => setTable(!table)} className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-surface-muted hover:text-foreground">{table ? "Ver gráfico" : "Ver como tabela"}</button>
      </div>
      {table ? (
        <div className="nl-scroll overflow-x-auto rounded-md border border-border">
          <table className="w-full text-xs tabular-nums">
            <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="px-3 py-2 font-medium">Mês</th>{series.map((s) => <th key={s.key} className="px-3 py-2 text-right font-medium">{s.label}</th>)}<th className="px-3 py-2 text-right font-medium">Total</th></tr></thead>
            <tbody>{columns.map((c, i) => <tr key={c.label} className="border-b border-border last:border-0"><td className="px-3 py-1.5">{c.label}</td>{series.map((s) => <td key={s.key} className="px-3 py-1.5 text-right">{fullBRL(c.values[s.key] ?? 0)}</td>)}<td className="px-3 py-1.5 text-right font-medium">{fullBRL(totals[i] ?? 0)}</td></tr>)}</tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${height}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
            {scale.ticks.map((t) => (
              <g key={t}>
                <line x1={ML} x2={W - MR} y1={y(t)} y2={y(t)} stroke="var(--viz-grid)" strokeWidth={1} />
                <text x={ML - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--muted-foreground)">{compactBRL(t)}</text>
              </g>
            ))}
            <line x1={ML} x2={W - MR} y1={y(0)} y2={y(0)} stroke="var(--viz-axis)" strokeWidth={1} />
            {columns.map((c, i) => {
              const x = ML + slot * i + (slot - bw) / 2;
              let acc = 0;
              const segs = series.map((s) => ({ s, v: Math.max(0, c.values[s.key] ?? 0) })).filter((g) => g.v > 0);
              return (
                <g key={c.label} opacity={hover === null || hover === i ? 1 : 0.55}>
                  {segs.map((g, k) => {
                    const y0 = y(acc), y1 = y(acc + g.v);
                    acc += g.v;
                    const top = k === segs.length - 1;
                    const h = Math.max(y0 - y1 - (k === 0 ? 0 : GAP), 0.5);
                    const yt = y1;
                    const r = top ? Math.min(R, h) : 0;
                    const d = `M${x},${yt + h} L${x},${yt + r} Q${x},${yt} ${x + r},${yt} L${x + bw - r},${yt} Q${x + bw},${yt} ${x + bw},${yt + r} L${x + bw},${yt + h} Z`;
                    return <path key={g.s.key} d={d} fill={g.s.color} />;
                  })}
                  <text x={x + bw / 2} y={height - 10} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)">{c.label}</text>
                </g>
              );
            })}
            {columns.map((c, i) => <rect key={c.label} x={ML + slot * i} y={MT} width={slot} height={plotH + MB} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} role="img" aria-label={`${c.label}: ${fullBRL(totals[i] ?? 0)}`} />)}
          </svg>
          {hover !== null && columns[hover] ? (
            <div className="pointer-events-none absolute top-2 z-10 w-56 rounded-lg border border-border bg-surface p-3 text-xs shadow-md" style={{ left: `${Math.min(Math.max(((ML + slot * hover + slot / 2) / W) * 100, 16), 84)}%`, transform: "translateX(-50%)" }}>
              <div className="mb-1.5 font-semibold">{columns[hover]!.label}</div>
              {series.map((s) => (columns[hover]!.values[s.key] ?? 0) > 0 ? <div key={s.key} className="flex items-center justify-between gap-2 py-0.5"><span className="flex items-center gap-1.5 text-muted-foreground"><span className="size-2 rounded-[2px]" style={{ background: s.color }} />{s.label}</span><span className="tabular-nums">{fullBRL(columns[hover]!.values[s.key] ?? 0)}</span></div> : null)}
              <div className="mt-1.5 flex justify-between border-t border-border pt-1.5 font-semibold"><span>Total</span><span className="tabular-nums">{fullBRL(totals[hover] ?? 0)}</span></div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** Linha única com área a 10%, ponto final com anel de 2px e linha de zero. Um eixo só. */
export function LineArea({ points, color, ariaLabel, height = 220, className }: { points: { label: string; value: number }[]; color: string; ariaLabel: string; height?: number; className?: string }) {
  const [hover, setHover] = React.useState<number | null>(null);
  const values = points.map((p) => p.value);
  const scale = niceScale(Math.min(0, ...values), Math.max(0, ...values));
  const plotW = W - ML - MR, plotH = height - MT - MB;
  const x = (i: number) => ML + (points.length === 1 ? plotW / 2 : (plotW * i) / (points.length - 1));
  const y = (v: number) => MT + plotH - ((v - scale.lo) / (scale.hi - scale.lo)) * plotH;
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const last = points[points.length - 1];
  const step = Math.max(1, Math.ceil(points.length / 12));
  return (
    <div className={cn("relative", className)}>
      <svg viewBox={`0 0 ${W} ${height}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
        {scale.ticks.map((t) => (
          <g key={t}>
            <line x1={ML} x2={W - MR} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--viz-axis)" : "var(--viz-grid)"} strokeWidth={1} />
            <text x={ML - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--muted-foreground)">{compactBRL(t)}</text>
          </g>
        ))}
        <path d={area} fill={color} opacity={0.1} />
        <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (i % step === 0 || i === points.length - 1) ? <text key={p.label} x={x(i)} y={height - 10} textAnchor="middle" fontSize={11} fill="var(--muted-foreground)">{p.label}</text> : null)}
        {last ? <><circle cx={x(points.length - 1)} cy={y(last.value)} r={6} fill="var(--surface)" /><circle cx={x(points.length - 1)} cy={y(last.value)} r={4} fill={color} /></> : null}
        {hover !== null ? <><line x1={x(hover)} x2={x(hover)} y1={MT} y2={MT + plotH} stroke="var(--viz-axis)" strokeWidth={1} /><circle cx={x(hover)} cy={y(points[hover]!.value)} r={6} fill="var(--surface)" /><circle cx={x(hover)} cy={y(points[hover]!.value)} r={4} fill={color} /></> : null}
        {points.map((p, i) => <rect key={p.label} x={x(i) - plotW / points.length / 2} y={MT} width={plotW / points.length} height={plotH + MB} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} role="img" aria-label={`${p.label}: ${fullBRL(p.value)}`} />)}
      </svg>
      {hover !== null && points[hover] ? (
        <div className="pointer-events-none absolute top-1 z-10 rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md" style={{ left: `${Math.min(Math.max((x(hover) / W) * 100, 12), 88)}%`, transform: "translateX(-50%)" }}>
          <div className="font-semibold">{points[hover]!.label}</div><div className="tabular-nums text-muted-foreground">{fullBRL(points[hover]!.value)}</div>
        </div>
      ) : null}
    </div>
  );
}
