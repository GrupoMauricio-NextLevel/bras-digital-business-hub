import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { carrierStatement } from "@/lib/domain/cargas/cargas";
import { formatBRL } from "@/lib/money";

export const dynamic = "force-dynamic";

const mes = (m: string) => { const [y, mm] = m.split("-"); return new Date(Date.UTC(Number(y), Number(mm) - 1, 15)).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }); };

/** Extrato (D111): cargas aceitas por mês, frete informado e a comissão da NextLevel Cargas (cobrada por fatura mensal). */
export default async function Extrato() {
  const session = await requireRole("CARRIER");
  const rows = await carrierStatement(await getDb(), session.actor);
  return (
    <>
      <PageHeader eyebrow="NextLevel Cargas" title="Extrato" description="O frete você recebe direto de quem contratou. A comissão da NextLevel Cargas é somada no mês e cobrada por fatura." />
      {rows.length ? (
        <div className="ds-card overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Cargas aceitas por mês</caption>
            <thead><tr className="border-b border-border text-left"><th scope="col" className="p-3">Mês</th><th scope="col" className="p-3 text-right">Cargas</th><th scope="col" className="p-3 text-right">Frete</th><th scope="col" className="p-3 text-right">Comissão NextLevel</th></tr></thead>
            <tbody>{rows.map((r) => <tr key={r.month} className="border-b border-border last:border-0"><th scope="row" className="p-3 text-left font-medium capitalize">{mes(r.month)}</th><td className="p-3 text-right tabular-nums">{r.loads}</td><td className="p-3 text-right tabular-nums">{formatBRL(r.freightCents)}</td><td className="p-3 text-right tabular-nums">{formatBRL(r.commissionCents)}</td></tr>)}</tbody>
          </table>
        </div>
      ) : <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">Nenhuma carga aceita ainda.</p>}
    </>
  );
}
