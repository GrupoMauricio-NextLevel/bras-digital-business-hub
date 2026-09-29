import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { listOrdersForActor } from "@/lib/domain/orders";
import { getDb } from "@/db/client";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/app/status-badge";
import { formatDateTime } from "@/lib/utils";
import { OrderActions } from "@/components/shared/order-actions";
import { EmptyState } from "@/components/app/empty-state";
import { Truck } from "lucide-react";
import type { OrderStatus } from "@/db/schema";

const COLUMNS: { status: OrderStatus; title: string; hint: string }[] = [
  { status: "READY_TO_PICK", title: "Pronto para separar", hint: "Central paga + etiqueta ok" },
  { status: "PICKING", title: "Em separação", hint: "Conferir e embalar" },
  { status: "READY_TO_SHIP", title: "Pronto para envio", hint: "Aguardando coleta" },
  { status: "SHIPPED", title: "Enviados", hint: "Em trânsito" },
];

export default async function ShippingPage() {
  const session = await requireRole("SUPPLIER_ADMIN");
  const all = await listOrdersForActor((await getDb()), session.actor);
  return (
    <>
      <PageHeader title="Expedição" description="Fila operacional da Central. Um pedido só entra aqui após pagamento à Central e etiqueta registrada pelo lojista." />
      <div className="nl-scroll grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const rows = all.filter((r) => r.order.status === col.status);
          return (
            <section key={col.status} className="rounded-lg border border-border bg-surface-muted/60 p-3">
              <header className="mb-3 flex items-center justify-between px-1"><div><h2 className="text-sm font-semibold">{col.title}</h2><p className="text-xs text-muted-foreground">{col.hint}</p></div><span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium tabular-nums">{rows.length}</span></header>
              <div className="space-y-2">
                {rows.length === 0 ? <EmptyState icon={Truck} title="Vazio" className="py-6" /> : rows.map((r) => (
                  <Card key={r.order.id}>
                    <CardContent className="space-y-2 p-3">
                      <div className="flex flex-col gap-1">
                        <OrderStatusBadge status={r.order.status} />
                        <Link href={`/supplier/orders/${r.order.id}`} className="text-sm font-medium hover:underline">#{r.order.number} · {r.storeName}</Link>
                      </div>
                      <div className="text-xs text-muted-foreground">{r.order.customerName} · {r.order.shippingCity ?? "—"}/{r.order.shippingState ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.order.shippingLabelCode} · {r.order.shippingCarrier} · {formatDateTime(r.order.createdAt)}</div>
                      <div className="[&_button]:h-8 [&_button]:w-full [&_button]:text-xs [&>div]:flex-col [&>div]:items-stretch"><OrderActions role="SUPPLIER_ADMIN" order={r.order} /></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
