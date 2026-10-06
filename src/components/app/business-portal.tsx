import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ProductContext } from "@/lib/product-context";

/** Linha de um negócio do ecossistema. A cor lateral (orientação) vem do tema do produto; o resto é geometria do sistema. */
export function BusinessPortal({ product, metrics, attention }: {
  product: ProductContext;
  metrics: Array<{ label: string; value: string | number }>;
  attention?: string;
}) {
  const body = (
    <div className="ds-card ds-lift group grid gap-5 sm:grid-cols-[minmax(220px,.8fr)_1.2fr_auto] sm:items-center sm:gap-8">
      <div className="flex min-w-0 gap-4">
        <span className="mt-1 h-12 w-[4px] shrink-0 rounded-full" style={{ background: product.accent }} aria-hidden />
        <div><h3 className="text-lg font-extrabold tracking-[-.02em]">{product.name}</h3><p className="mt-0.5 text-sm text-muted-foreground">{product.descriptor}</p>{attention ? <p className="mt-2 text-xs font-semibold text-foreground">{attention}</p> : null}</div>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        {metrics.map((metric) => <div key={metric.label} className="min-w-0"><dt className="text-[length:var(--ds-fs-label)] font-bold text-muted-foreground">{metric.label}</dt><dd className="mt-0.5 truncate text-base font-extrabold tabular-nums">{metric.value}</dd></div>)}
      </dl>
      <div className="flex items-center justify-end gap-2 text-sm font-bold text-[var(--ds-link)]">
        {product.available ? <>Entrar <ArrowUpRight className="size-4" aria-hidden /></> : <span className="ds-pill ds-pill--mute">Em preparação</span>}
      </div>
    </div>
  );
  return product.available && product.href ? <Link href={product.href} className="block">{body}</Link> : body;
}
