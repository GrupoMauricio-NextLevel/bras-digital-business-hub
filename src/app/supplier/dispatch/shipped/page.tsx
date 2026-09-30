import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { loadEsteira } from "@/lib/domain/operations";
import { DispatchNav } from "@/components/dispatch/dispatch-nav";
import { EmptyState } from "@/components/app/empty-state";
import { LiveSync } from "@/components/dispatch/live-sync";
import { Truck } from "lucide-react";

export default async function ShippedPage() {
  const session = await requireRole(["SUPPLIER_ADMIN", "SUPPLIER_DISPATCH"]);
  const e = await loadEsteira(await getDb(), session.actor);
  const shipped = e.orders.filter((o) => o.status === "SHIPPED");
  return (
    <div className="nl-touch">
      <div className="mb-4 flex justify-end"><LiveSync /></div>
      <DispatchNav active="/supplier/dispatch/shipped" adm={session.user.role === "SUPPLIER_ADMIN"} />
      {shipped.length === 0 ? <EmptyState icon={Truck} title="Nada enviado hoje" description="Os pedidos marcados como enviados aparecem aqui." /> : (
        <ul className="grid gap-3 md:grid-cols-2">
          {shipped.map((o) => <li key={o.id} className="rounded-lg border border-border bg-surface p-4"><div className="text-lg font-semibold">#{o.number}</div><div className="text-sm text-muted-foreground">{o.storeName} · {o.customerName}{o.city ? ` · ${o.city}/${o.state}` : ""}</div><div className="mt-1 text-sm">{o.itemCount} peça(s)</div></li>)}
        </ul>
      )}
    </div>
  );
}
