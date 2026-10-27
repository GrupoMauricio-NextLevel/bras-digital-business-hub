import { Check, Minus } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { nomeDaCompetencia, TAXA_ENTRA, TAXA_NAO_ENTRA, type TaxaDoMes } from "@/lib/domain/taxa-transparente";

const pct = (bps: number) => `${(bps / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

/** "Sua taxa" (W0, D183): a conta inteira da taxa sobre vendas, o que entra, o que não entra e quando fecha. */
export function SuaTaxa({ t }: { t: TaxaDoMes }) {
  const ultimoDia = new Date(new Date(t.fechaEm).getTime() - 1);
  return (
    <section id="taxa" aria-labelledby="taxa-t" className="ds-card scroll-mt-24">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="taxa-t" className="text-lg font-semibold">Sua taxa sobre vendas · {nomeDaCompetencia(t.competencia)}</h3>
        <span className="text-sm text-muted-foreground">{t.bps > 0 ? `${pct(t.bps)} do seu plano` : "Sem taxa neste mês"}</span>
      </div>
      <dl className="mt-4 grid gap-4 sm:grid-cols-4">
        <div><dt className="text-xs text-muted-foreground">Vendas que contam</dt><dd className="text-lg font-semibold tabular-nums">{formatBRL(t.baseCents)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Pedidos</dt><dd className="text-lg font-semibold tabular-nums">{t.pedidos}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Taxa até agora</dt><dd className="text-lg font-semibold tabular-nums">{formatBRL(t.taxaCents)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">O mês fecha em</dt><dd className="text-lg font-semibold">{formatDate(ultimoDia.toISOString())}</dd></div>
      </dl>
      <p className="mt-3 text-sm text-body">A conta é {formatBRL(t.baseCents)} × {pct(t.bps)} = {formatBRL(t.taxaCents)}. A fatura da taxa sai no dia 1º do mês seguinte, separada do plano. O dinheiro das suas vendas continua todo na sua conta.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
        <div><p className="font-semibold">Entra na conta</p><ul className="mt-2 space-y-1">{TAXA_ENTRA.map((x) => <li key={x} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />{x}</li>)}</ul></div>
        <div><p className="font-semibold">Não entra</p><ul className="mt-2 space-y-1">{TAXA_NAO_ENTRA.map((x) => <li key={x} className="flex gap-2"><Minus className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />{x}</li>)}</ul></div>
      </div>
      {t.historico.length ? (
        <div className="mt-4">
          <p className="text-sm font-semibold">Meses anteriores</p>
          <ul className="mt-2 divide-y divide-border rounded-lg border border-border text-sm">
            {t.historico.map((h) => <li key={h.competencia} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"><span>{nomeDaCompetencia(h.competencia)}</span><span className="tabular-nums">{formatBRL(h.taxaCents)} · <span className="text-muted-foreground">{h.situacao}</span></span></li>)}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
