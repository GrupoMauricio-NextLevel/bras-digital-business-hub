import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { DISPATCH_COLUMNS, loadEsteira } from "@/lib/domain/operations";
import { EsteiraBoard } from "@/components/dispatch/esteira-board";
import { CutoffBanner } from "@/components/dispatch/cutoff-banner";
import { LiveSync } from "@/components/dispatch/live-sync";
import { DispatchNav } from "@/components/dispatch/dispatch-nav";

export default async function DispatchPage() {
  const session = await requireRole(["SUPPLIER_ADMIN", "SUPPLIER_DISPATCH"]);
  const e = await loadEsteira(await getDb(), session.actor);
  // Expedição enxerga só a operação; o gestor que abre esta tela vê o mesmo (sem dinheiro).
  const columns = DISPATCH_COLUMNS;
  return (
    <div className="nl-touch">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-semibold">Olá, {session.user.name.split(" ")[0]}</h1><LiveSync /></div>
      <DispatchNav active="/supplier/dispatch" adm={session.user.role === "SUPPLIER_ADMIN"} />
      <CutoffBanner big cutoff={{ state: e.cutoff.state, cutoffAt: e.cutoff.cutoffAt, nextWorkingDate: e.cutoff.nextWorkingDate, nextCutoffAt: e.cutoff.nextCutoffAt, timezone: e.ops.timezone }} className="mb-5" />
      <EsteiraBoard orders={e.orders} columns={columns} variant="dispatch" />
    </div>
  );
}
