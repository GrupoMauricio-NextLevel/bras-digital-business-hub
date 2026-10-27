import { DataTable } from "@/components/app/data-table";
import { OrderStatusBadge, StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import type { Order } from "@/db/schema";
import { OrderQuickView } from "./order-quick-view";
import { Printer, ShieldAlert, ShoppingCart } from "lucide-react";
import { EstrelaPedido, ProximoPasso } from "./pedido-na-linha";
import { NEXT_ACTION } from "@/lib/domain/order-status";
import { proximaNaLinha } from "@/lib/domain/pedido-mesa-regras";

export type OrderRow = { order: Order; storeName: string; storeSlug: string };

/**
 * `mesa` (W1, D184): estrela, impresso e suspeita de fraude na linha; com `independente`, também o próximo passo.
 */
export function OrdersTable({ rows, basePath, showStore = true, showCost = false, quickView = false, showCentral = true, mesa }: { rows: OrderRow[]; basePath: string; showStore?: boolean; showCost?: boolean; quickView?: boolean; showCentral?: boolean; mesa?: { independente: boolean } }) {
  return (
    <DataTable<OrderRow>
      rows={rows}
      rowKey={(r) => r.order.id}
      rowHref={(r) => `${basePath}/${r.order.id}`}
      empty={<EmptyState icon={ShoppingCart} illustration="ui-vazio-pedidos" title="Nenhum pedido" description="Os pedidos aparecerão aqui assim que forem criados." />}
      columns={[
        { key: "number", header: "Pedido", primary: true, cell: (r) => (
          <div className="flex items-start gap-2">
            {mesa ? <EstrelaPedido orderId={r.order.id} number={r.order.number} ativa={r.order.starred} /> : null}
            <div>
              <div className="flex flex-wrap items-center gap-1.5 font-medium">#{r.order.number}
                {mesa && r.order.printedAt ? <span title="Já impresso" className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground"><Printer className="size-3.5" aria-hidden />impresso</span> : null}
                {mesa && r.order.fraudFlag ? <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 text-xs font-medium text-danger"><ShieldAlert className="size-3.5" aria-hidden />suspeita</span> : null}
              </div>
              <div className="text-xs text-muted-foreground">{r.order.customerName}</div>
            </div>
          </div>
        ) },
        ...(showStore ? [{ key: "store", header: "Loja", cell: (r: OrderRow) => r.storeName }] : []),
        { key: "channel", header: "Canal", cell: (r) => <StatusBadge value={r.order.channel} /> },
        { key: "status", header: "Status", cell: (r) => <OrderStatusBadge status={r.order.status} /> },
        ...(showCentral ? [{ key: "central", header: "Central", cell: (r: OrderRow) => <StatusBadge value={r.order.centralPaymentStatus} />, mobile: false }] : []),
        { key: "label", header: "Etiqueta", cell: (r) => <StatusBadge value={r.order.shippingLabelStatus} />, mobile: false },
        { key: "total", header: showCost ? "Custo" : "Total", className: "text-right", cell: (r) => <span className="font-medium tabular-nums">{formatBRL(showCost ? r.order.costTotalCents : r.order.totalCents)}</span> },
        { key: "date", header: "Data", className: "text-right text-muted-foreground", cell: (r) => formatDateTime(r.order.createdAt) },
        ...(mesa?.independente ? [{ key: "passo", header: "Próximo passo", mobile: false, cell: (r: OrderRow) => { const para = proximaNaLinha(r.order.status, true); return para ? <ProximoPasso orderId={r.order.id} number={r.order.number} para={para} rotulo={NEXT_ACTION[r.order.status]?.label ?? "Avançar"} /> : r.order.status === "READY_TO_SHIP" ? <span className="text-xs text-muted-foreground">Enviar pelo pedido</span> : null; } }] : []),
        ...(quickView ? [{ key: "quick", header: "", className: "w-16 text-right", mobile: false, cell: (r: OrderRow) => <OrderQuickView orderId={r.order.id} number={r.order.number} href={`${basePath}/${r.order.id}`} /> }] : []),
      ]}
    />
  );
}
