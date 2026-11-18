import { formatCompactBRL } from "@/lib/money";

const CORES = ["var(--vida-dinheiro)", "var(--vida-pedidos)", "var(--vida-clientes)", "var(--vida-visitas)", "var(--ds-muted)"];

/** Vendas por canal real (D331): rosca com até 4 canais + Outros e o total no meio. Sem venda, não aparece. */
export function RoscaCanais({ fatias, total }: { fatias: { nome: string; cents: number; pct: number }[]; total: number }) {
  if (!fatias.length) return null;
  const r = 52, c = 2 * Math.PI * r;
  // Início de cada fatia (soma das anteriores), calculado antes de desenhar.
  const inicios = fatias.map((_, i) => fatias.slice(0, i).reduce((acc, f) => acc + (f.pct / 100) * c, 0));
  return (
    <section className="ds-card ds-enter p-5 sm:p-6" aria-labelledby="vida-canais-t" style={{ "--i": 7 } as React.CSSProperties}>
      <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Últimos 30 dias</p>
      <h2 id="vida-canais-t" className="mt-1 text-base font-semibold tracking-[-.01em]">Por onde você vende</h2>
      <div className="mt-4 flex flex-wrap items-center gap-5">
        <div className="relative size-40 shrink-0">
          <svg viewBox="0 0 140 140" className="size-full -rotate-90" role="img" aria-label={`Vendas por canal: ${fatias.map((f) => `${f.nome} ${f.pct}%`).join(", ")}`}>
            <circle cx="70" cy="70" r={r} fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="16" />
            {fatias.map((f, i) => { const len = (f.pct / 100) * c; const el = <circle key={f.nome} className="vida-fatia" style={{ animationDelay: `${i * 90}ms` }} cx="70" cy="70" r={r} fill="none" stroke={CORES[i]} strokeWidth="16" strokeDasharray={`${Math.max(0, len - 2)} ${c}`} strokeDashoffset={-inicios[i]!} />; return el; })}
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center leading-tight"><span className="text-sm font-bold" style={{ fontFamily: "var(--nl-font-display)" }}>{formatCompactBRL(total)}</span><span className="text-[11px] text-muted-foreground">total</span></span>
        </div>
        <ul className="min-w-0 flex-1 space-y-2 text-sm">
          {fatias.map((f, i) => <li key={f.nome} className="flex items-center gap-2"><span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: CORES[i] }} /><span className="min-w-0 flex-1 truncate">{f.nome}</span><span className="font-semibold tabular-nums">{f.pct}%</span></li>)}
        </ul>
      </div>
    </section>
  );
}
