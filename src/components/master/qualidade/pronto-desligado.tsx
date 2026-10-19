import { ArrowRight, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OffGroup, OffState } from "@/lib/domain/qualidade-desligados";
import { DecisaoDesligado } from "./decisao-desligado";

const TONE: Record<OffState, "success" | "warning" | "neutral"> = { LIGADO: "success", PARCIAL: "warning", DESLIGADO: "neutral" };
const LABEL: Record<OffState, string> = { LIGADO: "Ligado", PARCIAL: "Em parte", DESLIGADO: "Desligado" };

/** Aba "Pronto e desligado" (D145): o que já está no ar esperando o dono ligar, com o estado de agora e onde ligar. Só leitura. */
export function ProntoDesligado({ groups }: { groups: OffGroup[] }) {
  const items = groups.flatMap((g) => g.items);
  const off = items.filter((i) => i.state !== "LIGADO").length;
  return (
    <div className="grid gap-5">
      <p className="max-w-prose text-sm text-muted-foreground">
        Tudo aqui já foi feito e publicado, mas fica <b className="text-foreground">desligado de propósito</b> até você decidir. Nada é ligado por esta tela: cada item leva ao lugar certo
        (uma tela do Master ou a chave no Render). <b className="text-foreground">{off} de {items.length}</b> ainda desligados ou em parte.
        Uma vez por mês, registre em cada um: ligar, manter desligado ou aposentar. Cada item traz a minha sugestão; a decisão é sua.
      </p>
      {groups.map((g) => (
        <section key={g.key} aria-labelledby={`pd-${g.key}`} className="grid gap-2">
          <div>
            <h2 id={`pd-${g.key}`} className="text-base font-bold">{g.title}</h2>
            <p className="text-sm text-muted-foreground">{g.hint}</p>
          </div>
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {g.items.map((i) => (
              <li key={i.key} className={`grid gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4 ${i.next ? "bg-accent-soft/40" : ""}`}>
                <div className="grid min-w-0 gap-1">
                  <span className="flex flex-wrap items-center gap-2 font-semibold">
                    {i.step ? <span className="font-mono text-xs text-muted-foreground">Passo {i.step}</span> : null}
                    {i.title}
                    <Badge tone={TONE[i.state]}>{LABEL[i.state]}</Badge>
                    {i.next ? <Badge tone="info">Próximo a ligar</Badge> : null}
                  </span>
                  <span className="text-sm text-muted-foreground">{i.detail}</span>
                </div>
                {i.how.kind === "tela" ? (
                  <a href={i.how.href} className="ds-btn ds-btn--secondary ds-btn--sm justify-self-start sm:justify-self-end">{i.state === "LIGADO" ? "Ver" : "Onde ligar"} <ArrowRight className="size-4" aria-hidden /></a>
                ) : (
                  <span className="grid gap-1 justify-self-start text-xs sm:justify-self-end sm:text-right">
                    <span className="inline-flex items-center gap-1 font-semibold text-muted-foreground sm:justify-end"><Server className="size-3.5" aria-hidden /> No Render (Environment)</span>
                    <span className="flex flex-wrap gap-1 sm:justify-end">{i.how.vars.map((v) => <code key={v} className="break-all rounded bg-surface-muted px-1.5 py-0.5">{v}</code>)}</span>
                  </span>
                )}
                {i.state !== "LIGADO" ? <DecisaoDesligado itemKey={i.key} titulo={i.title} sugestao={i.sugestao} decisao={i.decisao} /> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
