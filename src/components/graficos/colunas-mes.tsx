import { formatBRL, formatCompactBRL } from "@/lib/money";
import { mesRotulo } from "@/lib/agencias/fluxo";

/** Colunas por mês (D335): valor em R$ por mês, crescendo ao entrar, com a contagem embaixo do mês (ex.: lojas que pagaram). */
export function ColunasPorMes({ serie, titulo, rotulo, legenda, contagem, i = 4, rodape }: {
  serie: { mes: string; cents: number; n?: number }[]; titulo: string; rotulo: string; legenda: string; contagem?: string; i?: number; rodape?: React.ReactNode;
}) {
  const max = Math.max(1, ...serie.map((s) => s.cents));
  const w = 560, h = 200, base = 156, topo = 18, larg = w / serie.length;
  const y = (v: number) => base - (v / max) * (base - topo);
  return (
    <section className="ds-card ds-enter flex flex-col p-5 sm:p-6" style={{ "--i": i } as React.CSSProperties} aria-labelledby="colunas-mes-t">
      <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">{rotulo}</p>
      <h2 id="colunas-mes-t" className="mt-1 text-base font-semibold leading-snug tracking-[-.01em]">{titulo}</h2>
      <figure className="mt-auto pt-3">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-52 w-full" role="img" aria-label={`${titulo} ${serie.map((s) => `${mesRotulo(s.mes)}: ${formatBRL(s.cents)}${contagem && s.n !== undefined ? `, ${s.n} ${contagem}` : ""}`).join("; ")}.`}>
          <defs><linearGradient id="colunas-mes-g" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--vida-crescimento)" /><stop offset="100%" stopColor="var(--vida-dinheiro)" stopOpacity=".55" /></linearGradient></defs>
          <line x1="0" x2={w} y1={base} y2={base} stroke="currentColor" strokeOpacity=".15" />
          {serie.map((s, n) => { const x = n * larg + larg * 0.22, cw = larg * 0.56, yy = y(s.cents); return <g key={s.mes}>
            {s.cents ? <rect className="vida-coluna" style={{ animationDelay: `${n * 90}ms` }} x={x} y={yy} width={cw} height={Math.max(0, base - yy)} rx="8" fill="url(#colunas-mes-g)" /> : <rect x={x} y={base - 3} width={cw} height="3" rx="1.5" fill="currentColor" opacity=".15" />}
            {s.cents ? <text x={x + cw / 2} y={yy - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="currentColor" opacity=".8">{formatCompactBRL(s.cents).replace("R$ ", "")}</text> : null}
            <text x={x + cw / 2} y={base + 18} textAnchor="middle" fontSize="12" fill="currentColor" opacity=".6">{mesRotulo(s.mes).slice(0, 3)}</text>
            {contagem && s.n !== undefined ? <text x={x + cw / 2} y={base + 36} textAnchor="middle" fontSize="11" fill="currentColor" opacity=".5">{s.n} {s.n === 1 ? contagem.replace(/s$/, "") : contagem}</text> : null}
          </g>; })}
        </svg>
        <figcaption className="mt-1 text-xs text-muted-foreground">{legenda}</figcaption>
      </figure>
      {rodape}
    </section>
  );
}
