import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { OrdersTable } from "@/components/shared/orders-table";
import { FilterBar, FilterChips, FilterTabs } from "@/components/app/filter-bar";
import { listOrdersForActor } from "@/lib/domain/orders";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { ORDER_STATUS_LABEL } from "@/lib/domain/order-status";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { SimulateOrderButton } from "./simulate-order-button";
import { isDemoMode } from "@/lib/auth";
import { MetricCard } from "@/components/app/metric-card";
import { perfilAtual } from "@/lib/perfil-loja-server";

const COMMERCE_TABS: OrderStatus[] = ["PENDING", "SHIPPED", "DELIVERED"];

export default async function MerchantOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await requireRole("STORE_OWNER");
  const { status } = await searchParams;
  const selectedStatus = ORDER_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : undefined;
  const db = await getDb();
  const allRows = await listOrdersForActor(db, session.actor);
  const rows = selectedStatus ? allRows.filter((row) => row.order.status === selectedStatus) : allRows;
  const perfil = await perfilAtual(session.store!.id);
  const { independente: independent, ecommerce: commerce } = perfil;
  const statuses = ORDER_STATUSES.filter((s) => !independent || s !== "AWAITING_CENTRAL_PAYMENT");
  const count = (value: OrderStatus) => allRows.filter((row) => row.order.status === value).length;
  const activeCount = allRows.filter((row) => !["DELIVERED", "CANCELED"].includes(row.order.status)).length;
  return (
    <>
      <PageHeader eyebrow={commerce ? "NextLevel E-commerce / Vendas" : "SuperDrop / Operação"} title="Pedidos" description="Loja virtual, WhatsApp, Instagram e vendas manuais no mesmo fluxo."
        actions={<>{isDemoMode() ? <SimulateOrderButton /> : null}<Link href="/merchant/orders/propostas" className={buttonVariants({ variant: "ghost" })}>Propostas</Link><Link href="/merchant/orders/new" className={buttonVariants()}><Plus /> Novo pedido</Link></>} />
      <section className="ds-kpis mb-6" aria-label="Resumo dos pedidos">
        <MetricCard label="Ativos" value={activeCount} />
        {commerce ? <>
          <MetricCard label="Aguardando pagamento" value={count("PENDING")} />
          <MetricCard label="Em preparação" value={count("READY_TO_PICK") + count("PICKING") + count("READY_TO_SHIP")} />
          <MetricCard label="Enviados" value={count("SHIPPED")} />
        </> : <>
          <MetricCard label="Aguardando saldo" value={count("AWAITING_CENTRAL_PAYMENT")} />
          <MetricCard label="Aguardando etiqueta" value={count("AWAITING_LABEL")} />
          <MetricCard label="Na Central" value={count("READY_TO_PICK") + count("PICKING") + count("READY_TO_SHIP")} />
        </>}
      </section>
      <Suspense><FilterBar>{commerce
        ? <FilterTabs param="status" primary={COMMERCE_TABS.filter((s) => statuses.includes(s)).map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s], count: count(s) }))} rest={statuses.filter((s) => !COMMERCE_TABS.includes(s)).map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }))} />
        : <FilterChips param="status" options={statuses.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }))} />}</FilterBar></Suspense>
      <OrdersTable rows={rows} basePath="/merchant/orders" showStore={false} quickView showCentral={!independent} />
    </>
  );
}
