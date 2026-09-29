"use client";
import * as React from "react";
import { Clock, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export type CutoffView = { state: "OPEN" | "CLOSED" | "NO_SHIPPING"; cutoffAt: string | null; nextWorkingDate: string; nextCutoffAt: string; timezone: string };

const fmtTime = (iso: string, tz: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const fmtDay = (iso: string, tz: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: tz, weekday: "long", day: "2-digit", month: "2-digit" }).format(new Date(iso));

/** Cronômetro do horário de corte: quanto falta hoje ou quando é a próxima expedição. */
export function CutoffBanner({ cutoff, className, big }: { cutoff: CutoffView; className?: string; big?: boolean }) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => { const t = setInterval(() => setNow(Date.now()), 15_000); return () => clearInterval(t); }, []);
  const left = cutoff.state === "OPEN" && cutoff.cutoffAt ? Math.max(0, Math.ceil((new Date(cutoff.cutoffAt).getTime() - now) / 60_000)) : null;
  const urgent = left !== null && left <= 30;
  const tone = cutoff.state === "OPEN" ? (urgent ? "border-warning/50 bg-warning-soft text-warning" : "border-success/40 bg-success-soft text-success") : "border-border bg-surface-muted text-muted-foreground";
  const Icon = cutoff.state === "OPEN" ? Clock : Moon;
  return (
    <div role="status" className={cn("flex flex-wrap items-center gap-3 rounded-lg border px-4 py-2.5", tone, big ? "text-lg" : "text-sm", className)}>
      <Icon className={big ? "size-6" : "size-5"} aria-hidden />
      {cutoff.state === "OPEN" && cutoff.cutoffAt ? (
        <span><strong>Corte hoje às {fmtTime(cutoff.cutoffAt, cutoff.timezone)}</strong> · {left === 0 ? "encerrando agora" : `faltam ${left! >= 60 ? `${Math.floor(left! / 60)}h${String(left! % 60).padStart(2, "0")}` : `${left} min`}`}. Pedidos liberados até lá saem hoje.</span>
      ) : cutoff.state === "CLOSED" ? (
        <span><strong>Corte de hoje encerrado.</strong> Novos pedidos entram na expedição de {fmtDay(cutoff.nextCutoffAt, cutoff.timezone)} (corte às {fmtTime(cutoff.nextCutoffAt, cutoff.timezone)}).</span>
      ) : (
        <span><strong>Sem expedição hoje.</strong> Próxima: {fmtDay(cutoff.nextCutoffAt, cutoff.timezone)} (corte às {fmtTime(cutoff.nextCutoffAt, cutoff.timezone)}).</span>
      )}
    </div>
  );
}
