import { TrendingUp } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { escopoDaAgencia, pode } from "@/lib/agencias/acesso";
import { crescimentoDaAgencia } from "@/lib/agencias/gestao";
import { mesRotulo } from "@/lib/agencias/fluxo";
import { formatBRL } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Crescimento" };

/** Crescimento da agência (D325), como o Crescimento do Master: carteira, recorrência e cancelamentos mês a mês. */
export default async function Crescimento() {
  const session = await requireRole("AGENCY");
  const db = await getDb();
  const { membro } = await escopoDaAgencia(db, session.actor);
  if (!pode.verValores(membro)) return <><PageHeader title="Crescimento" /><EmptyState icon={TrendingUp} title="O crescimento é do administrador e do financeiro" description="Fale com o administrador da agência." /></>;
  const serie = await crescimentoDaAgencia(db, session.actor);
  const atual = serie.at(-1)!; const antes = serie.at(-2);
  const maior = Math.max(1, ...serie.map((s) => s.recorrenteCents));
  return (
    <div className="mx-auto min-w-0 max-w-[1100px] space-y-5">
      <PageHeader eyebrow="Gestão" title="Crescimento" description="Clientes ativos, receita recorrente e cancelamentos dos últimos 6 meses, calculados pela carteira." />
      <section aria-label="Resumo" className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[["Clientes ativos", String(atual.ativos), antes ? `${atual.ativos - antes.ativos >= 0 ? "+" : ""}${atual.ativos - antes.ativos} no mês` : ""], ["Receita recorrente", formatBRL(atual.recorrenteCents), "contratos ativos por mês"], ["Novos no mês", String(atual.novos), `${atual.encerrados} encerrado(s)`], ["Cancelamento", atual.cancelamentoPct === null ? "—" : `${atual.cancelamentoPct}%`, "dos ativos no começo do mês"]].map(([l, v, n]) => <article key={l} className="ds-card min-w-0 p-4 sm:p-5"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-1 break-words text-xl font-semibold tabular-nums sm:text-2xl">{v}</p><p className="text-xs text-muted-foreground">{n}</p></article>)}
      </section>
      <section className="ds-card min-w-0 overflow-hidden p-5 sm:p-6" aria-labelledby="cr-serie">
        <h2 id="cr-serie" className="mb-4 text-base font-semibold">Mês a mês</h2>
        <div className="relative max-w-full overflow-x-auto" tabIndex={0} role="region" aria-label="Tabela mês a mês (role para o lado)">
          <table className="w-full min-w-[560px] text-sm">
            <caption className="sr-only">Crescimento dos últimos 6 meses</caption>
            <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2 font-medium">Mês</th><th className="font-medium">Ativos</th><th className="font-medium">Novos</th><th className="font-medium">Encerrados</th><th className="font-medium">Receita recorrente</th><th className="font-medium">Recebido</th></tr></thead>
            <tbody className="divide-y divide-border">{serie.map((s) => <tr key={s.mes}><td className="py-2">{mesRotulo(s.mes)}</td><td className="tabular-nums">{s.ativos}</td><td className="tabular-nums">{s.novos}</td><td className="tabular-nums">{s.encerrados}</td><td><span className="flex items-center gap-2"><span className="h-2 rounded-full bg-[var(--ds-link)]" style={{ width: `${Math.max(4, Math.round((s.recorrenteCents / maior) * 120))}px` }} aria-hidden /><span className="tabular-nums">{formatBRL(s.recorrenteCents)}</span></span></td><td className="tabular-nums">{formatBRL(s.recebidoCents)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
