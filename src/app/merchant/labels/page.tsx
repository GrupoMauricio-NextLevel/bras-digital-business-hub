import { Tag } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { OrderStatusBadge } from "@/components/app/status-badge";
import { LabelUploader } from "@/components/shared/label-uploader";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { isIndependentStore } from "@/lib/domain/order-policy";
import { labelQueue } from "@/lib/domain/after-sales";
import { formatDateTime } from "@/lib/utils";

export default async function LabelsPage() {
  const session = await requireRole("STORE_OWNER");
  const rows = await labelQueue(await getDb(), session.actor);
  const independent = await isIndependentStore(await getDb(), session.store?.id);
  return (
    <>
      <PageHeader title="Etiquetas" description={independent ? "Gere a etiqueta no SuperFrete e anexe o PDF (máx. 3 MB). Com a etiqueta anexada, o pedido fica pronto para você separar e enviar." : "Gere a etiqueta no SuperFrete e anexe o PDF (máx. 3 MB). Com a etiqueta anexada e o saldo debitado, o pedido entra na fila de expedição da Central."} />
      <DataTable
        rows={rows}
        rowKey={(r) => r.order.id}
        empty={<EmptyState icon={Tag} title="Nenhuma etiqueta pendente" description="Quando um pedido pago precisar de etiqueta, ele aparece aqui." />}
        columns={[
          { key: "n", header: "Pedido", primary: true, cell: (r) => <div><div className="font-medium">#{r.order.number}</div><div className="text-xs text-muted-foreground">{r.order.customerName}</div></div> },
          { key: "items", header: "Itens", cell: (r) => <span className="text-sm">{r.items.map((i) => `${i.quantity}× ${i.productName.replace("Camisa Tailandesa ", "")} (${i.label.split(" (")[0]})`).join(", ")}</span>, mobile: false },
          { key: "dest", header: "Destino", cell: (r) => (r.order.shippingCity ? `${r.order.shippingCity}/${r.order.shippingState}` : "—"), mobile: false },
          { key: "s", header: "Status", cell: (r) => <OrderStatusBadge status={r.order.status} /> },
          { key: "d", header: "Criado", cell: (r) => formatDateTime(r.order.createdAt), mobile: false },
          { key: "f", header: "Etiqueta", className: "text-right", cell: (r) => <span className="relative z-10 inline-flex"><LabelUploader orderId={r.order.id} hasLabel={r.labelCount > 0} primary size="sm" /></span> },
        ]}
      />
    </>
  );
}
