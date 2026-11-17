import Link from "next/link";
import { formatBRL, formatCompactBRL } from "@/lib/money";
import { diaMes, type Dia, type Periodo } from "@/lib/domain/painel-vivo";
import { Variacao } from "@/components/vida/numero-vivo";

/**
 * Vendas no tempo (D328): linha do período e, tracejada, a do período anterior; marcador do melhor dia; título com a
 * conclusão; troca de período por link (sem JavaScript); tabela para leitor de tela. SVG próprio, cores dos tokens.
 */
export function GraficoVendas({ titulo, atual, anterior, total, delta, melhor, periodo, hrefPeriodo }: {
  titulo: string; atual: Dia[]; anterior: Dia[]; total: number; delta: number | null; melhor: Dia | null; periodo: Periodo; hrefPeriodo: (p: Periodo) => string;
}) {
  const w = 640, h = 200, px = 8, top = 14, base = h - 22;
  const temVenda = atual.some((d) => d.cents > 0);
  // Sem venda: curva de exemplo em cinza, com o selo "Exemplo" (nunca número inventado nos totais).
  const exemplo = [3, 4, 3.5, 5, 4.6, 6, 5.4, 7, 6.2, 7.8, 7.1, 8.4];
  const valores = temVenda ? atual.map((d) => d.cents) : exemplo;
  const prev = temVenda ? anterior.map((d) => d.cents) : [];
  const max = Math.max(1, ...valores, ...prev);
  const x = (i: number, n: number) => px + (i / Math.max(1, n - 1)) * (w - px * 2);
  const y = (v: number) => base - (v / max) * (base - top);
  const linha = (vs: number[]) => vs.map((v, i) => `${x(i, vs.length).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const iMelhor = temVenda && melhor ? atual.findIndex((d) => d.date === melhor.date) : -1;
  const grade = [0.25, 0.5, 0.75, 1].map((g) => ({ g, yy: base - g * (base - top) }));
  return (
    <section className="ds-card ds-enter flex flex-col p-5 sm:p-6" aria-labelledby="vida-graf-t" style={{ "--i": 5 } as React.CSSProperties}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Vendas no tempo</p>
          <h2 id="vida-graf-t" className="mt-1 text-base font-semibold leading-snug tracking-[-.01em]">{titulo}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm"><span className="font-semibold tabular-nums">{formatBRL(total)}</span><Variacao valor={delta} base={`vs. ${periodo} dias anteriores`} /></p>
        </div>
        <nav aria-label="Período do gráfico" className="vida-abas">
          {([7, 30] as Periodo[]).map((p) => <Link key={p} href={hrefPeriodo(p)} scroll={false} aria-current={p === periodo ? "page" : undefined}>{p} dias</Link>)}
        </nav>
      </div>
      <figure className="relative mt-4 flex flex-1 flex-col">
        {!temVenda ? <span className="absolute right-2 top-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Exemplo</span> : null}
        <svg viewBox={`0 0 ${w} ${h}`} className="h-48 w-full flex-1 sm:min-h-56" role="img" preserveAspectRatio="none"
          aria-label={temVenda ? `${titulo} Total do período: ${formatBRL(total)}.` : "Exemplo de como o gráfico vai ficar. Seus números aparecem aqui depois da primeira venda."}>
          <defs><linearGradient id="vida-area-g" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--vida-dinheiro)" stopOpacity="0.32" /><stop offset="100%" stopColor="var(--vida-dinheiro)" stopOpacity="0" /></linearGradient></defs>
          {grade.map(({ g, yy }) => <line key={g} x1={px} x2={w - px} y1={yy} y2={yy} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 5" />)}
          <line x1={px} x2={w - px} y1={base} y2={base} stroke="currentColor" strokeOpacity="0.15" />
          {prev.length > 1 ? <polyline points={linha(prev)} fill="none" stroke="var(--vida-dinheiro)" strokeOpacity="0.4" strokeWidth="1.6" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" /> : null}
          <polygon className="vida-area" points={`${x(0, valores.length)},${base} ${linha(valores)} ${x(valores.length - 1, valores.length)},${base}`} fill={temVenda ? "url(#vida-area-g)" : "currentColor"} fillOpacity={temVenda ? 1 : 0.05} />
          <polyline className="vida-linha" pathLength={1} points={linha(valores)} fill="none" stroke={temVenda ? "var(--vida-dinheiro)" : "currentColor"} strokeOpacity={temVenda ? 1 : 0.25} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          {iMelhor >= 0 ? <g className="vida-area"><circle cx={x(iMelhor, valores.length)} cy={y(valores[iMelhor]!)} r="9" fill="var(--vida-dinheiro)" fillOpacity="0.18" /><circle cx={x(iMelhor, valores.length)} cy={y(valores[iMelhor]!)} r="4.5" fill="var(--vida-dinheiro)" stroke="var(--ds-surface)" strokeWidth="2" /></g> : null}
        </svg>
        <figcaption className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{atual[0] ? diaMes(atual[0].date) : ""}</span>
          <span className="inline-flex items-center gap-3"><span className="inline-flex items-center gap-1"><span aria-hidden className="inline-block h-0.5 w-4 rounded bg-[var(--vida-dinheiro)]" />este período</span>{prev.length ? <span className="inline-flex items-center gap-1"><span aria-hidden className="inline-block w-4 border-t-2 border-dashed border-[var(--vida-dinheiro)] opacity-50" />anterior</span> : null}</span>
          <span>{atual.at(-1) ? diaMes(atual.at(-1)!.date) : ""}</span>
        </figcaption>
        {temVenda ? <table className="sr-only"><caption>Vendas por dia</caption><thead><tr><th scope="col">Dia</th><th scope="col">Vendas</th></tr></thead><tbody>{atual.map((d) => <tr key={d.date}><td>{diaMes(d.date)}</td><td>{formatCompactBRL(d.cents)}</td></tr>)}</tbody></table> : null}
      </figure>
    </section>
  );
}
