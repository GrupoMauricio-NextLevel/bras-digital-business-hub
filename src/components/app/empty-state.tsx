import * as React from "react";
import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function Art() {
  return (
    <svg viewBox="0 0 120 80" className="mb-2 h-20 w-30 text-accent" aria-hidden fill="none">
      <rect x="14" y="20" width="92" height="50" rx="8" className="fill-surface-muted" />
      <rect x="24" y="30" width="34" height="6" rx="3" fill="currentColor" opacity=".35" />
      <rect x="24" y="42" width="60" height="5" rx="2.5" fill="currentColor" opacity=".18" />
      <rect x="24" y="52" width="48" height="5" rx="2.5" fill="currentColor" opacity=".18" />
      <circle cx="96" cy="22" r="14" fill="currentColor" opacity=".14" />
      <circle cx="96" cy="22" r="6" fill="currentColor" opacity=".6" />
    </svg>
  );
}

export function EmptyState({ title, description, icon: Icon = Inbox, action, className, compact }: { title: string; description?: string; icon?: LucideIcon; action?: React.ReactNode; className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface px-6 text-center", compact ? "py-8" : "py-12", className)}>
      {compact ? null : <Art />}
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent"><Icon className="size-5" /></div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title = "Algo deu errado", description, action }: { title?: string; description?: string; action?: React.ReactNode }) {
  return (
    <div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft/40 p-6 text-center">
      <h3 className="text-sm font-semibold text-danger">{title}</h3>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
