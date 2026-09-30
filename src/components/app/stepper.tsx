import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Step = { key: string; label: string; hint?: string };

/** Etapas lineares; `current` é o índice da etapa em andamento (etapas anteriores = concluídas). */
export function Stepper({ steps, current, className }: { steps: Step[]; current: number; className?: string }) {
  return (
    <ol className={cn("flex w-full items-start gap-2", className)} aria-label="Progresso">
      {steps.map((s, i) => {
        const done = i < current, active = i === current;
        return (
          <li key={s.key} className="flex min-w-0 flex-1 flex-col gap-1" aria-current={active ? "step" : undefined}>
            <div className="flex items-center gap-2">
              <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold", done ? "border-accent bg-accent text-on-accent" : active ? "border-accent text-accent-foreground" : "border-border text-muted-foreground")}>{done ? <Check className="size-3.5" aria-hidden /> : i + 1}</span>
              {i < steps.length - 1 ? <span className={cn("h-0.5 flex-1 rounded", done ? "bg-accent" : "bg-border")} aria-hidden /> : null}
            </div>
            <span className={cn("truncate text-xs", active ? "font-semibold" : "text-muted-foreground")}>{s.label}</span>
            {s.hint ? <span className="hidden truncate text-[11px] text-muted-foreground sm:block">{s.hint}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

export type TimelineItem = { key: string; title: string; when?: string; detail?: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" };

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  const dot = { neutral: "bg-muted-foreground", success: "bg-success", warning: "bg-warning", danger: "bg-danger" };
  return (
    <ol className={cn("relative space-y-4 border-l border-border pl-5", className)}>
      {items.map((it) => (
        <li key={it.key} className="relative">
          <span className={cn("absolute -left-[25px] top-1.5 size-2.5 rounded-full ring-4 ring-surface", dot[it.tone ?? "neutral"])} aria-hidden />
          <div className="flex flex-wrap items-baseline gap-x-2"><span className="text-sm font-medium">{it.title}</span>{it.when ? <span className="text-xs text-muted-foreground">{it.when}</span> : null}</div>
          {it.detail ? <div className="mt-0.5 text-sm text-muted-foreground">{it.detail}</div> : null}
        </li>
      ))}
    </ol>
  );
}
