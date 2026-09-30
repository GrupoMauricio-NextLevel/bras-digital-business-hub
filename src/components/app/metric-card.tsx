import * as React from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";
const TONE: Record<Tone, string> = { neutral: "text-muted-foreground bg-surface-muted", success: "text-success bg-success-soft", warning: "text-warning bg-warning-soft", danger: "text-danger bg-danger-soft", info: "text-info bg-info-soft" };

function Spark({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const w = 96, h = 28, min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * w).toFixed(1)},${(h - 3 - ((v - min) / span) * (h - 6)).toFixed(1)}`).join(" ");
  return <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-24 shrink-0 text-accent-foreground" aria-hidden><polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** KPI tile. `delta` em % (positivo = subiu); `goodWhen` diz se subir é bom. */
export function MetricCard({ label, value, hint, icon: Icon, tone = "neutral", className, delta, goodWhen = "up", trend, href }: {
  label: string; value: React.ReactNode; hint?: React.ReactNode; icon?: LucideIcon; tone?: Tone; className?: string;
  delta?: number; goodWhen?: "up" | "down"; trend?: number[]; href?: string;
}) {
  const good = delta === undefined || delta === 0 ? null : (delta > 0) === (goodWhen === "up");
  const DeltaIcon = delta === undefined ? null : delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        {Icon ? <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", TONE[tone])}><Icon className="size-4" /></span> : null}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="min-w-0 truncate font-display text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
        {trend ? <Spark data={trend} /> : null}
      </div>
      {(hint || DeltaIcon) ? (
        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {DeltaIcon && delta !== undefined ? <span className={cn("inline-flex items-center gap-0.5 font-medium", good === null ? "" : good ? "text-success" : "text-danger")}><DeltaIcon className="size-3.5" aria-hidden />{Math.abs(delta).toFixed(1).replace(".", ",")}%<span className="sr-only">{delta > 0 ? " de alta" : delta < 0 ? " de queda" : " estável"}</span></span> : null}
          {hint ? <span className="min-w-0">{hint}</span> : null}
        </div>
      ) : null}
    </>
  );
  const cls = cn("block min-w-0 rounded-lg border border-border bg-surface p-4 shadow-sm", href && "transition hover:border-accent/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-accent", className);
  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

export function MetricGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4 [&>*]:min-w-0", className)}>{children}</div>;
}
