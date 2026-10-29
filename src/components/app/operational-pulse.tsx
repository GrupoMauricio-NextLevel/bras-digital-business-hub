import * as React from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type PulseTone = "neutral" | "success" | "warning" | "danger" | "info";

export type PulseItem = {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  href?: string;
  icon?: LucideIcon;
  tone?: PulseTone;
  delta?: number;
};

const TONE: Record<PulseTone, string> = {
  neutral: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
};

export function OperationalPulse({ items, label = "Pulso operacional", className }: { items: PulseItem[]; label?: string; className?: string }) {
  return (
    <section className={cn("ds-card ds-card--flush", className)} aria-label={label}>
      {/* D217: duas colunas já no celular (antes, quatro linhas empurravam o que importa para baixo); linhas finas pelo vão de 1 px. */}
      <div className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-[inherit] bg-[var(--ds-line)] [&>*]:bg-surface [&>*:last-child:nth-child(odd)]:col-span-2 xl:[&>*:last-child:nth-child(odd)]:col-span-1", items.length === 3 ? "xl:grid-cols-3" : "xl:grid-cols-4")}>
        {items.map((item, index) => {
          const Icon = item.icon;
          const DeltaIcon = item.delta === undefined ? null : item.delta > 0 ? ArrowUpRight : item.delta < 0 ? ArrowDownRight : Minus;
          const content = (
            <div className="flex h-full min-h-[76px] items-center gap-3 px-4 py-3">
              {Icon ? <span className="flex size-8 shrink-0 max-sm:hidden items-center justify-center rounded-[var(--ds-r-control-sm)] bg-[var(--ds-soft)] text-[var(--ds-link)]"><Icon className="size-4" aria-hidden /></span> : null}
              <div className="min-w-0 flex-1">
                <div className="text-[length:var(--ds-fs-label)] font-bold text-muted-foreground">{item.label}</div>
                <div className={cn("mt-0.5 flex min-w-0 items-baseline gap-2", TONE[item.tone ?? "neutral"])}>
                  <span className="truncate text-lg font-extrabold tabular-nums tracking-tight">{item.value}</span>
                  {DeltaIcon && item.delta !== undefined ? <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"><DeltaIcon className="size-3" aria-hidden />{Math.abs(item.delta).toFixed(1).replace(".", ",")}%</span> : null}
                </div>
                {item.hint ? <div className="mt-0.5 truncate text-xs text-muted-foreground">{item.hint}</div> : null}
              </div>
            </div>
          );
          return item.href ? <Link key={index} href={item.href} className="block transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring">{content}</Link> : <div key={index}>{content}</div>;
        })}
      </div>
    </section>
  );
}
