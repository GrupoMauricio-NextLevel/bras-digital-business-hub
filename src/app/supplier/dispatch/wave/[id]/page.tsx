import { notFound } from "next/navigation";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { loadWave, pickingListFor } from "@/lib/domain/operations";
import { DomainError } from "@/lib/domain/errors";
import { DispatchNav } from "@/components/dispatch/dispatch-nav";
import { PrintButtons } from "./print-buttons";
import { formatDateTime } from "@/lib/utils";

export default async function WavePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["SUPPLIER_ADMIN", "SUPPLIER_DISPATCH"]);
  const { id } = await params;
  const db = await getDb();
  let data;
  try { data = await loadWave(db, session.actor, id); } catch (e) { if (e instanceof DomainError) notFound(); throw e; }
  const list = await pickingListFor(db, session.actor, data.orderIds);
  const total = list.lines.reduce((s, l) => s + l.quantity, 0);
  return (
    <div className="nl-touch">
      <DispatchNav active="/supplier/dispatch/print" adm={session.user.role === "SUPPLIER_ADMIN"} />
      <div className="nl-no-print mb-6 space-y-3 rounded-lg border border-border bg-surface p-4">
        <h1 className="text-2xl font-semibold">Onda {data.wave.number} <span className="text-base font-normal text-muted-foreground">· {data.orderIds.length} pedido(s) · criada {formatDateTime(data.wave.createdAt)}</span></h1>
        <p className="text-sm text-muted-foreground">1) Imprima as etiquetas (um PDF com todas). 2) Imprima a lista de separação e passe uma vez pela prateleira. 3) Volte à fila, inicie a separação e confira cada pedido.</p>
        <PrintButtons waveId={id} orderIds={data.orderIds} />
      </div>
      <section className="rounded-lg border border-border bg-surface p-5 print:border-0 print:p-0" aria-label="Lista de separação">
        <div className="mb-3 flex items-baseline justify-between"><div className="text-xl font-semibold">Lista de separação · Onda {data.wave.number}</div><div className="text-sm text-muted-foreground">{total} peça(s)</div></div>
        <table className="w-full text-left text-base">
          <thead><tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground"><th className="py-2 pr-3">Produto</th><th className="py-2 pr-3">Variação</th><th className="py-2 pr-3 text-right">Qtd</th><th className="py-2">Pedidos</th></tr></thead>
          <tbody>{list.lines.map((l) => <tr key={l.key} className="border-b border-border/60"><td className="py-2 pr-3 font-medium">{l.productName}</td><td className="py-2 pr-3">{l.label}</td><td className="py-2 pr-3 text-right text-lg font-bold tabular-nums">{l.quantity}</td><td className="py-2 text-sm text-muted-foreground">{l.orders.map((n) => `#${n}`).join(" ")}</td></tr>)}</tbody>
        </table>
      </section>
    </div>
  );
}
