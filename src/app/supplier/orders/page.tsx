import { Suspense } from "react";
import { AlertTriangle, Package, Printer, Truck } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { OrdersTable } from "@/components/shared/orders-table";
import { FilterBar, FilterChips } from "@/components/app/filter-bar";
import { listOrdersForActor } from "@/lib/domain/orders";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { ORDER_STATUS_LABEL } from "@/lib/domain/order-status";

export default async function SupplierOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await requireRole("SUPPLIER_ADMIN");
  const { status } = await searchParams;
  const selectedStatus = ORDER_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : undefined;
  const allRows = await listOrdersForActor((await getDb()), session.actor);
  const rows = selectedStatus ? allRows.filter((row) => row.order.status === selectedStatus) : allRows;
  const count = (value: OrderStatus) => allRows.filter((row) => row.order.status === value).length;
  const activeCount = allRows.filter((row) => !["DELIVERED", "CANCELED"].includes(row.order.status)).length;
  return (
    <>
      <PageHeader title="Pedidos da rede" description="Todos os pedidos das lojas abastecidas pela Central. Valores de custo são o que a Central recebe." />
      <OperationalPulse className="mb-5" items={[
        { label: "Pedidos ativos", value: activeCount, icon: Truck, tone: activeCount ? "info" : "success", hint: "da rede" },
        { label: "Aguardando saldo", value: count("AWAITING_CENTRAL_PAYMENT"), icon: AlertTriangle, tone: count("AWAITING_CENTRAL_PAYMENT") ? "warning" : "success", hint: "ainda não liberados" },
        { label: "Aguardando etiqueta", value: count("AWAITING_LABEL"), icon: Printer, tone: count("AWAITING_LABEL") ? "warning" : "success", hint: "dependem do lojista" },
        { label: "Prontos para operar", value: count("READY_TO_PICK") + count("PICKING") + count("READY_TO_SHIP"), icon: Package, tone: "info", hint: "separação e saída" },
      ]} />
      <Suspense><FilterBar><FilterChips param="status" options={ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }))} /></FilterBar></Suspense>
      <OrdersTable rows={rows} basePath="/supplier/orders" showCost quickView />
    </>
  );
}
