import { requireAreaRole } from "@/lib/require-session";
import { hasAreaRole } from "@/lib/domain/access";
import { getDb } from "@/db/client";
import { DISPATCH_COLUMNS, loadEsteira } from "@/lib/domain/operations";
import { EsteiraBoard } from "@/components/dispatch/esteira-board";
import { CutoffBanner } from "@/components/dispatch/cutoff-banner";
import { LiveSync } from "@/components/dispatch/live-sync";
import { DispatchNav } from "@/components/dispatch/dispatch-nav";

export default async function DispatchPage() {
  const session = await requireAreaRole("SUPERDROP", ["SUPPLIER_ADMIN", "OPERATOR"]);
  const e = await loadEsteira(await getDb(), session.actor);
  const columns = DISPATCH_COLUMNS;
  const adm = hasAreaRole(session.actor, "SUPERDROP", "SUPPLIER_ADMIN");

  return (
    <div className="nl-touch">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-semibold">Olá, {session.user.name.split(" ")[0]}</h1><LiveSync /></div>
      <DispatchNav active="/supplier/dispatch" adm={adm} />
      <CutoffBanner big cutoff={{ state: e.cutoff.state, cutoffAt: e.cutoff.cutoffAt, nextWorkingDate: e.cutoff.nextWorkingDate, nextCutoffAt: e.cutoff.nextCutoffAt, timezone: e.ops.timezone }} className="mb-5" />
      <EsteiraBoard orders={e.orders} columns={columns} variant="dispatch" />
    </div>
  );
}
