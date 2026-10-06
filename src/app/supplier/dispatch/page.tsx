import { PageHeader } from "@/components/app/page-header";
import { AlertTriangle, Package, PackageCheck, Truck } from "lucide-react";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { DISPATCH_COLUMNS, loadEsteira } from "@/lib/domain/operations";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { EsteiraBoard } from "@/components/dispatch/esteira-board";
import { CutoffBanner } from "@/components/dispatch/cutoff-banner";
import { LiveSync } from "@/components/dispatch/live-sync";
import { DispatchNav } from "@/components/dispatch/dispatch-nav";

export default async function DispatchPage() {
  const session = await requireRole(["SUPPLIER_ADMIN", "SUPPLIER_DISPATCH"]);
  const e = await loadEsteira(await getDb(), session.actor);
  const columns = DISPATCH_COLUMNS;
  const n = (status: string) => e.orders.filter((order) => order.status === status).length;
  const late = e.orders.filter((order) => order.status !== "SHIPPED" && order.ageMinutes > 24 * 60).length;

  return (
    <div className="nl-touch space-y-5">
      <PageHeader eyebrow="Modo expedição" title={`Olá, ${session.user.name.split(" ")[0]}`} description="Separe, confira e despache com o mínimo de toques." actions={<LiveSync />} />

      <DispatchNav active="/supplier/dispatch" adm={session.user.role === "SUPPLIER_ADMIN"} />

      <OperationalPulse
        items={[
          { label: "Prontos", value: n("READY_TO_PICK"), icon: Package, tone: n("READY_TO_PICK") ? "info" : "neutral", hint: "aguardando separação" },
          { label: "Em separação", value: n("PICKING"), icon: PackageCheck, tone: n("PICKING") ? "info" : "neutral", hint: "em bancada" },
          { label: "Conferidos", value: n("READY_TO_SHIP"), icon: Truck, tone: n("READY_TO_SHIP") ? "success" : "neutral", hint: "prontos para sair" },
          { label: "Atrasados", value: late, icon: AlertTriangle, tone: late ? "danger" : "success", hint: late ? "mais de 24h" : "fila em dia" },
        ]}
      />

      <CutoffBanner big cutoff={{ state: e.cutoff.state, cutoffAt: e.cutoff.cutoffAt, nextWorkingDate: e.cutoff.nextWorkingDate, nextCutoffAt: e.cutoff.nextCutoffAt, timezone: e.ops.timezone }} />

      <section aria-labelledby="dispatch-queue-title">
        <div className="mb-3">
          <h2 id="dispatch-queue-title" className="text-lg font-semibold">Fila da expedição</h2>
          <p className="text-sm text-muted-foreground">A ordem abaixo é a fila operacional real da Central.</p>
        </div>
        <EsteiraBoard orders={e.orders} columns={columns} variant="dispatch" />
      </section>
    </div>
  );
}
