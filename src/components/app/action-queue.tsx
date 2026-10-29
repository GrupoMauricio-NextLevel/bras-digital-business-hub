import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionQueueTone = "neutral" | "info" | "warning" | "danger" | "success";

export type ActionQueueItem = {
  id: string;
  title: string;
  description?: React.ReactNode;
  href?: string;
  actionLabel?: string;
  count?: number;
  tone?: ActionQueueTone;
  icon?: LucideIcon;
};

/** Cor da bolinha de urgência: a mesma do bloco "Precisa de você agora" (D212). */
const PONTO: Record<ActionQueueTone, string> = { neutral: "bg-border-strong", info: "bg-info", warning: "bg-warning", danger: "bg-danger", success: "bg-success" };

/**
 * Fila de ações (D217): mesmo desenho do bloco "Precisa de você agora" (cartão, bolinha da urgência, o que é, por quê e o
 * botão que resolve), para todas as telas do sistema falarem a mesma língua. A API não mudou.
 */
export function ActionQueue({ title = "Fila do dia", description, items, emptyMessage = "Nenhuma ação pendente agora.", className }: {
  title?: string;
  description?: React.ReactNode;
  items: ActionQueueItem[];
  emptyMessage?: string;
  className?: string;
}) {
  const id = React.useId();
  return (
    <section className={cn("ds-card p-5 sm:p-6", className)} aria-labelledby={id}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div><h2 id={id} className="text-base font-semibold">{title}</h2>{description ? <p className="text-xs text-muted-foreground">{description}</p> : null}</div>
        {items.length ? <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">{items.length}</span> : null}
      </div>
      {items.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="size-4 text-success" aria-hidden />{emptyMessage}</p>
      ) : (
        <ol className="mt-3 divide-y divide-border">
          {items.map((item) => {
            const texto = (
              <span className="min-w-0 flex-1 basis-56">
                <span className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-foreground">{item.title}</span>{item.count !== undefined ? <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">{item.count}</span> : null}</span>
                {item.description ? <span className="block text-xs leading-relaxed text-muted-foreground">{item.description}</span> : null}
              </span>
            );
            return (
              <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", PONTO[item.tone ?? "neutral"])} />
                {item.href ? <Link href={item.href} className="min-w-0 flex-1 basis-56 hover:underline">{texto}</Link> : texto}
                {item.href ? <Link href={item.href} className="inline-flex items-center gap-1 text-xs font-bold text-[var(--ds-link)]">{item.actionLabel ?? "Resolver"}<ArrowRight className="size-3.5" aria-hidden /></Link> : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
