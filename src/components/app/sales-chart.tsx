import { formatBRL } from "@/lib/money";

/** Gráfico de área simples (SVG puro, sem biblioteca): vendas por dia. Acessível por texto alternativo e tabela oculta. */
export function SalesChart({ data }: { data: { date: string; cents: number }[] }) {
  const w = 640, h = 180, pad = 8;
  const max = Math.max(1, ...data.map((d) => d.cents));
  const x = (i: number) => pad + (i / Math.max(1, data.length - 1)) * (w - pad * 2);
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2 - 12);
  const line = data.map((d, i) => `${x(i).toFixed(1)},${y(d.cents).toFixed(1)}`).join(" ");
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;
  const total = data.reduce((s, d) => s + d.cents, 0);
  const best = data.reduce((b, d) => (d.cents > b.cents ? d : b), data[0] ?? { date: "", cents: 0 });
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full text-accent-foreground" role="img" aria-label={`Vendas dos últimos ${data.length} dias: total ${formatBRL(total)}; melhor dia ${best.date.split("-").reverse().join("/")} com ${formatBRL(best.cents)}`} preserveAspectRatio="none">
        <defs><linearGradient id="sc-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity="0.28" /><stop offset="100%" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
        {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={pad} x2={w - pad} y1={h - pad - g * (h - pad * 2 - 12)} y2={h - pad - g * (h - pad * 2 - 12)} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 4" />)}
        <polygon points={area} fill="url(#sc-fill)" />
        <polyline points={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-muted-foreground"><span>{data[0]?.date.split("-").reverse().slice(0, 2).join("/")}</span><span>Total {formatBRL(total)}</span><span>{data.at(-1)?.date.split("-").reverse().slice(0, 2).join("/")}</span></figcaption>
    </figure>
  );
}
