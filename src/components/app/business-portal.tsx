import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ProductContext } from "@/lib/product-context";

export function BusinessPortal({ product, metrics, attention }: {
  product: ProductContext;
  metrics: Array<{ label: string; value: string | number }>;
  attention?: string;
}) {
  const body = (
    <div className="group grid gap-5 border-t border-border py-7 transition-colors sm:grid-cols-[minmax(220px,.8fr)_1.2fr_auto] sm:items-center sm:gap-8">
      <div className="flex min-w-0 gap-4">
        <span className="mt-1 h-12 w-[3px] shrink-0 transition-[height] group-hover:h-16" style={{ background: product.accent }} aria-hidden />
        <div><h3 className="text-xl font-semibold tracking-[-.025em]">{product.name}</h3><p className="mt-1 text-sm text-muted-foreground">{product.descriptor}</p>{attention ? <p className="mt-3 text-xs font-medium text-foreground">{attention}</p> : null}</div>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        {metrics.map((metric) => <div key={metric.label} className="min-w-0"><dt className="text-[10px] font-semibold uppercase tracking-[.13em] text-subtle-foreground">{metric.label}</dt><dd className="mt-1 truncate text-base font-semibold tabular-nums">{metric.value}</dd></div>)}
      </dl>
      <div className="flex items-center justify-end gap-2 text-xs font-semibold uppercase tracking-[.12em]" style={{ color: product.accent }}>
        {product.available ? <>Entrar <ArrowUpRight className="size-4" /></> : <span className="text-subtle-foreground">Em preparação</span>}
      </div>
    </div>
  );
  return product.available && product.href ? <Link href={product.href} className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--product-accent)]">{body}</Link> : body;
}
