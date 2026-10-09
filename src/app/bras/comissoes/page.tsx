import Link from "next/link";
import { Download, Receipt } from "lucide-react";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { brasCommissionReport, getBrasDefaultCommissionBps } from "@/lib/domain/bras/comissoes";
import { EmptyState } from "@/components/app/empty-state";
import { formatBRL } from "@/lib/money";
import { EstudioHeader } from "../header";
import { estudioData } from "../data";
import { SettleButton } from "./settle";

export const dynamic = "force-dynamic";

const mesNome = (m: string) => { const t = new Date(`${m}-15T12:00:00Z`).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }); return t[0]!.toUpperCase() + t.slice(1); };
const pct = (bps: number) => `${(bps / 100).toString().replace(".", ",")}%`;

/** Comissões das importadoras (D102): o sistema calcula por importadora e mês; o dono cobra e marca como recebida. */
export default async function Comissoes() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [d, lines, defaultBps] = await Promise.all([estudioData(session.actor), brasCommissionReport(db, session.actor), getBrasDefaultCommissionBps(db)]);
  const aReceber = lines.filter((l) => !l.settlement).reduce((s, l) => s + l.commissionCents, 0);
  return (
    <>
      <EstudioHeader title="Comissões" description="Controle manual: o sistema calcula a comissão de cada importadora por mês, com o percentual congelado em cada pedido pago. A cobrança é feita por você." {...d} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">A receber (últimos 6 meses): <b className="tabular-nums">{formatBRL(aReceber)}</b> · comissão padrão {pct(defaultBps)} (<Link href="/bras/importadoras" className="text-link underline">alterar</Link>)</p>
        <a href="/bras/comissoes/csv" className="ds-btn ds-btn--secondary ds-btn--sm"><Download className="size-4" aria-hidden />Exportar CSV</a>
      </div>
      {lines.length === 0 ? <EmptyState icon={Receipt} title="Nenhum pedido pago ainda" description="Quando você marcar um pedido como pago, ele entra aqui no mês do pagamento, com a comissão calculada." /> : (
        <ul className="space-y-4" aria-label="Comissões por importadora e mês">
          {lines.map((l) => (
            <li key={`${l.importerId}-${l.month}`} className="ds-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{mesNome(l.month)}</p>
                  <h2 className="text-lg font-bold">{l.importerName}</h2>
                  <p className="text-sm">{l.requests.length} pedido(s) · {formatBRL(l.totalCents)} em vendas · comissão <b className="tabular-nums">{formatBRL(l.commissionCents)}</b></p>
                </div>
                <SettleButton importerId={l.importerId} importerName={l.importerName} month={l.month} amountCents={l.commissionCents} settlement={l.settlement} />
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold">Ver pedidos</summary>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[32rem] text-sm">
                    <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-1">Pedido</th><th>Produto</th><th className="text-right">Caixas</th><th className="text-right">Valor</th><th className="text-right">%</th><th className="text-right">Comissão</th></tr></thead>
                    <tbody>{l.requests.map((r) => <tr key={r.id} className="border-t border-border"><td className="py-1.5 tabular-nums">{r.number}</td><td>{r.productTitle}</td><td className="text-right tabular-nums">{r.boxes}</td><td className="text-right tabular-nums">{formatBRL(r.totalCents)}</td><td className="text-right tabular-nums">{pct(r.bps)}</td><td className="text-right tabular-nums">{formatBRL(r.commissionCents)}</td></tr>)}</tbody>
                  </table>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
