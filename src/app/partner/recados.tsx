import { Megaphone, Trophy } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";

type Aviso = { id: string; title: string; body: string; createdAt: string | Date };
type Desafio = { id: string; title: string; target: number; bonusCents: number; feitos: number; batido: boolean };

/** Avisos da NextLevel e desafios do mês no painel do parceiro (D251). */
export function RecadosDoParceiro({ avisos, desafios }: { avisos: Aviso[]; desafios: Desafio[] }) {
  return (
    <div className="mb-6 grid gap-4 lg:grid-cols-2">
      {desafios.length ? (
        <section aria-labelledby="des-t" className="ds-card p-5">
          <h2 id="des-t" className="flex items-center gap-2 text-base font-semibold"><Trophy className="size-4 text-warning" aria-hidden />Desafio do mês</h2>
          <ul className="mt-3 grid gap-3">{desafios.map((d) => (
            <li key={d.id}>
              <div className="flex items-baseline justify-between gap-2 text-sm"><b>{d.title}</b><span className="tabular-nums">{d.feitos} de {d.target} · bônus {formatBRL(d.bonusCents)}</span></div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-valuemin={0} aria-valuemax={d.target} aria-valuenow={d.feitos} aria-label={`${d.title}: ${d.feitos} de ${d.target}`}>
                <div className={`h-full rounded-full ${d.batido ? "bg-success" : "bg-[var(--brand-signal,var(--ds-primary))]"}`} style={{ width: `${Math.round((d.feitos / d.target) * 100)}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{d.batido ? "Meta batida: o bônus entra no seu extrato." : `Faltam ${d.target - d.feitos} loja${d.target - d.feitos === 1 ? "" : "s"} nova${d.target - d.feitos === 1 ? "" : "s"} este mês.`}</p>
            </li>
          ))}</ul>
        </section>
      ) : null}
      {avisos.length ? (
        <section aria-labelledby="avi-t" className="ds-card p-5">
          <h2 id="avi-t" className="flex items-center gap-2 text-base font-semibold"><Megaphone className="size-4 text-muted-foreground" aria-hidden />Avisos da NextLevel</h2>
          <ul className="mt-3 grid gap-3">{avisos.map((a) => <li key={a.id}><p className="text-sm font-semibold">{a.title} <span className="ml-1 text-xs font-normal text-muted-foreground">{formatDate(String(a.createdAt))}</span></p><p className="text-sm text-body">{a.body}</p></li>)}</ul>
        </section>
      ) : null}
    </div>
  );
}
