import { ASSUMPTIONS, type Rationale } from "@/lib/finance/rationale";
import { formatBRL } from "@/lib/money";

/** "Por que cobramos isto?" em linguagem simples. `showMargin` só para o master. */
export function RationaleList({ items, showMargin = false }: { items: Rationale[]; showMargin?: boolean }) {
  return (
    <div className="space-y-3">
      {items.map((r) => (
        <details key={r.key} className="group rounded-lg border border-border bg-surface p-4 open:shadow-sm">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
            <span className="font-medium">{r.label}{r.toValidate ? <span className="ml-2 rounded bg-warning-soft px-1.5 py-0.5 text-[11px] font-medium text-warning">a validar</span> : null}</span>
            <span className="text-sm tabular-nums text-muted-foreground">{r.price}</span>
          </summary>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">O que o valor cobre</dt><dd className="mt-1">{r.covers}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">O que você recebe</dt><dd className="mt-1">{r.delivers}</dd></div>
            <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Comparação de mercado</dt><dd className="mt-1">{r.anchor}</dd></div>
          </dl>
          {r.perOrder ? <p className="mt-3 rounded-md bg-surface-muted px-3 py-2 text-sm">{r.perOrder}</p> : null}
          {showMargin && r.margin ? (
            <div className="mt-3 border-t border-border pt-3 text-sm">
              <p className="mb-1 font-medium">Economia unitária (mensal): receita {formatBRL(r.margin.revenueCents)} · custo {formatBRL(r.margin.costCents)} · margem {formatBRL(r.margin.marginCents)} ({(r.margin.marginBps / 100).toFixed(0)}%)</p>
              <ul className="text-xs text-muted-foreground">{r.margin.lines.map((l) => <li key={l.label} className="flex justify-between"><span>{l.label}</span><span className="tabular-nums">{formatBRL(l.cents)}</span></li>)}</ul>
            </div>
          ) : null}
        </details>
      ))}
      {showMargin ? <p className="text-xs text-muted-foreground">Premissas: {ASSUMPTIONS.storesPerSupplier} lojas por fornecedor, pedido típico de {formatBRL(ASSUMPTIONS.typicalOrderCostCents)} de custo, {ASSUMPTIONS.supportMinutesPerStoreMonth} min de suporte por loja/mês a {formatBRL(ASSUMPTIONS.supportCostPerHourCents)}/hora. Ajuste os preços em “Regras e preços”.</p> : null}
    </div>
  );
}
