import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, Package, Plus, Printer, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { OrdersTable } from "@/components/shared/orders-table";
import { FilterBar, FilterChips } from "@/components/app/filter-bar";
import { listOrdersForActor } from "@/lib/domain/orders";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { ORDER_STATUS_LABEL } from "@/lib/domain/order-status";
import { buttonVariants } from "@/components/ui/button";
import { SimulateOrderButton } from "./simulate-order-button";
import { isIndependentStore } from "@/lib/domain/order-policy";
import { isDemoMode } from "@/lib/auth";

export default async function MerchantOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await requireRole("STORE_OWNER");
  const { status } = await searchParams;
  const rows = await listOrdersForActor((await getDb()), session.actor, { status: ORDER_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : undefined });
  const independent = await isIndependentStore(await getDb(), session.store?.id);
  const statuses = ORDER_STATUSES.filter((s) => !independent || s !== "AWAITING_CENTRAL_PAYMENT");
  const count = (value: OrderStatus) => rows.filter((row) => row.order.status === value).length;
  const activeCount = rows.filter((row) => !["DELIVERED", "CANCELED"].includes(row.order.status)).length;
  return (
    <>
      <PageHeader title="Pedidos" description="Pedidos da loja virtual, WhatsApp, Instagram e vendas manuais — todos com o mesmo catálogo e estoque." actions={<div className="flex flex-wrap items-center gap-2">{isDemoMode() ? <SimulateOrderButton /> : null}<Link href="/merchant/orders/propostas" className={buttonVariants({ variant: "ghost" })}>Propostas</Link><Link href="/merchant/orders/new" className={buttonVariants()}><Plus /> Novo pedido</Link></div>} />
      <OperationalPulse className="mb-5" items={[
        { label: "Pedidos ativos", value: activeCount, icon: ShoppingCart, tone: activeCount ? "info" : "success", hint: "ainda não concluídos" },
        { label: "Aguardando saldo", value: count("AWAITING_CENTRAL_PAYMENT"), icon: AlertTriangle, tone: count("AWAITING_CENTRAL_PAYMENT") ? "warning" : "success", hint: "dependem de recarga" },
        { label: "Aguardando etiqueta", value: count("AWAITING_LABEL"), icon: Printer, tone: count("AWAITING_LABEL") ? "warning" : "success", hint: "precisam do PDF" },
        { label: "Na Central", value: count("READY_TO_PICK") + count("PICKING") + count("READY_TO_SHIP"), icon: Package, tone: "info", hint: "separação e expedição" },
      ]} />
      <Suspense><FilterBar><FilterChips param="status" options={statuses.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }))} /></FilterBar></Suspense>
      <OrdersTable rows={rows} basePath="/merchant/orders" showStore={false} quickView showCentral={!independent} />
    </>
  );
}
