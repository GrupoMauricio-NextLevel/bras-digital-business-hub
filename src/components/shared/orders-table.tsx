import { DataTable } from "@/components/app/data-table";
import { OrderStatusBadge, StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import type { Order } from "@/db/schema";
import { OrderQuickView } from "./order-quick-view";
import { ShoppingCart } from "lucide-react";

export type OrderRow = { order: Order; storeName: string; storeSlug: string };

export function OrdersTable({ rows, basePath, showStore = true, showCost = false, quickView = false, showCentral = true }: { rows: OrderRow[]; basePath: string; showStore?: boolean; showCost?: boolean; quickView?: boolean; showCentral?: boolean }) {
  return (
    <DataTable<OrderRow>
      rows={rows}
      rowKey={(r) => r.order.id}
      rowHref={(r) => `${basePath}/${r.order.id}`}
      empty={<EmptyState icon={ShoppingCart} illustration="ui-vazio-pedidos" title="Nenhum pedido" description="Os pedidos aparecerão aqui assim que forem criados." />}
      columns={[
        { key: "number", header: "Pedido", primary: true, cell: (r) => <div><div className="font-medium">#{r.order.number}</div><div className="text-xs text-muted-foreground">{r.order.customerName}</div></div> },
        ...(showStore ? [{ key: "store", header: "Loja", cell: (r: OrderRow) => r.storeName }] : []),
        { key: "channel", header: "Canal", cell: (r) => <StatusBadge value={r.order.channel} /> },
        { key: "status", header: "Status", cell: (r) => <OrderStatusBadge status={r.order.status} /> },
        ...(showCentral ? [{ key: "central", header: "Central", cell: (r: OrderRow) => <StatusBadge value={r.order.centralPaymentStatus} />, mobile: false }] : []),
        { key: "label", header: "Etiqueta", cell: (r) => <StatusBadge value={r.order.shippingLabelStatus} />, mobile: false },
        { key: "total", header: showCost ? "Custo" : "Total", className: "text-right", cell: (r) => <span className="font-medium tabular-nums">{formatBRL(showCost ? r.order.costTotalCents : r.order.totalCents)}</span> },
        { key: "date", header: "Data", className: "text-right text-muted-foreground", cell: (r) => formatDateTime(r.order.createdAt) },
        ...(quickView ? [{ key: "quick", header: "", className: "w-16 text-right", mobile: false, cell: (r: OrderRow) => <OrderQuickView orderId={r.order.id} number={r.order.number} href={`${basePath}/${r.order.id}`} /> }] : []),
      ]}
    />
  );
}
