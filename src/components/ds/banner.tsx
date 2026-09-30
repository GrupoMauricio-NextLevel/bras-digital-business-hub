import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, OctagonAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  info: { box: "border-info/30 bg-info-soft/60", icon: Info, color: "text-info", role: "status" },
  success: { box: "border-success/30 bg-success-soft/60", icon: CheckCircle2, color: "text-success", role: "status" },
  warning: { box: "border-warning/40 bg-warning-soft/70", icon: AlertTriangle, color: "text-warning", role: "status" },
  critical: { box: "border-danger/40 bg-danger-soft/60", icon: OctagonAlert, color: "text-danger", role: "alert" },
} as const;

export function Banner({ tone = "info", title, children, action, onDismiss, className }: { tone?: keyof typeof TONES; title?: string; children?: React.ReactNode; action?: React.ReactNode; onDismiss?: () => void; className?: string }) {
  const t = TONES[tone]; const Icon = t.icon;
  return (
    <div role={t.role} className={cn("flex items-start gap-3 rounded-lg border p-3.5 text-sm", t.box, className)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", t.color)} aria-hidden />
      <div className="min-w-0 flex-1">{title ? <p className="font-semibold">{title}</p> : null}{children ? <div className={cn("text-muted-foreground", title && "mt-0.5")}>{children}</div> : null}{action ? <div className="mt-2">{action}</div> : null}</div>
      {onDismiss ? <button type="button" onClick={onDismiss} className="rounded p-0.5 text-muted-foreground hover:text-foreground" aria-label="Dispensar aviso"><X className="size-4" /></button> : null}
    </div>
  );
}
