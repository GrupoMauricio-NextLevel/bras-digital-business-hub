import { CalendarDays } from "lucide-react";
import { quando } from "@/lib/bras/quando";

/** Semana das descobertas (D101): meta do dono (4 por semana no começo), o que já entrou e o que está agendado. */
export function WeekPlan({ start, goal, items, missing, now }: { start: string; goal: number; items: { id: string; title: string; at: string; scheduled: boolean }[]; missing: number; now: string }) {
  const dias = Array.from({ length: 7 }, (_, i) => new Date(new Date(start).getTime() + i * 86400_000));
  const diaDe = (iso: string) => Math.floor((new Date(iso).getTime() - new Date(start).getTime()) / 86400_000);
  const hoje = diaDe(now);
  return (
    <section aria-labelledby="semana-t" className="ds-card mb-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="semana-t" className="flex items-center gap-2 text-base font-semibold"><CalendarDays className="size-5 text-[var(--bd-laranja)]" aria-hidden />Semana das descobertas</h2>
        <p className={`rounded-full px-3 py-1 text-sm font-semibold ${missing ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}`}>{missing ? `Faltam ${missing} para a meta de ${goal}` : `Meta de ${goal} cumprida`} · {items.length} na semana</p>
      </div>
      <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7" aria-label="Dias da semana">
        {dias.map((d, i) => {
          const doDia = items.filter((it) => diaDe(it.at) === i);
          return (
            <li key={i} className={`min-h-20 rounded-lg border p-2 text-xs ${i === hoje ? "border-[var(--bd-laranja)]" : "border-border"}`}>
              <p className="font-semibold capitalize">{d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }).replace(".", "")}{i === hoje ? " · hoje" : ""}</p>
              {doDia.length ? <ul className="mt-1 space-y-1">{doDia.map((it) => <li key={it.id} className="line-clamp-2" title={quando(it.at)}>{it.scheduled ? "⏱ " : "✓ "}{it.title}</li>)}</ul> : <p className="mt-1 text-muted-foreground">—</p>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
