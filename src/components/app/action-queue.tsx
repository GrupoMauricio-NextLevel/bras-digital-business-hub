import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Circle, Info, type LucideIcon } from "lucide-react";
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

const TONE: Record<ActionQueueTone, { icon: LucideIcon; rail: string; iconClass: string }> = {
  neutral: { icon: Circle, rail: "bg-border-strong", iconClass: "text-muted-foreground" },
  info: { icon: Info, rail: "bg-info", iconClass: "text-info" },
  warning: { icon: AlertTriangle, rail: "bg-warning", iconClass: "text-warning" },
  danger: { icon: AlertTriangle, rail: "bg-danger", iconClass: "text-danger" },
  success: { icon: CheckCircle2, rail: "bg-success", iconClass: "text-success" },
};

export function ActionQueue({ title = "Fila do dia", description, items, emptyMessage = "Nenhuma ação pendente agora.", className }: {
  title?: string;
  description?: React.ReactNode;
  items: ActionQueueItem[];
  emptyMessage?: string;
  className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-lg border border-border bg-surface", className)} aria-labelledby="action-queue-title">
      <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-3 sm:px-5">
        <div>
          <h2 id="action-queue-title" className="text-sm font-semibold">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {items.length ? <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">{items.length}</span> : null}
      </header>
      {items.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-5 text-sm text-muted-foreground sm:px-5">
          <CheckCircle2 className="size-4 text-success" aria-hidden />
          {emptyMessage}
        </div>
      ) : (
        <ol className="divide-y divide-border">
          {items.map((item) => {
            const tone = TONE[item.tone ?? "neutral"];
            const Icon = item.icon ?? tone.icon;
            const body = (
              <>
                <span className={cn("absolute inset-y-0 left-0 w-1", tone.rail)} aria-hidden />
                <Icon className={cn("mt-0.5 size-4 shrink-0", tone.iconClass)} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{item.title}</span>
                    {item.count !== undefined ? <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">{item.count}</span> : null}
                  </span>
                  {item.description ? <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.description}</span> : null}
                </span>
                {item.href ? <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-foreground">{item.actionLabel ?? "Resolver"}<ArrowRight className="size-3.5" aria-hidden /></span> : null}
              </>
            );
            return (
              <li key={item.id} className="relative">
                {item.href ? (
                  <Link href={item.href} className="flex min-h-14 items-start gap-3 px-4 py-3 pl-5 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring sm:px-5 sm:pl-6">
                    {body}
                  </Link>
                ) : (
                  <div className="flex min-h-14 items-start gap-3 px-4 py-3 pl-5 sm:px-5 sm:pl-6">{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
