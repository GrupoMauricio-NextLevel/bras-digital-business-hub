import { Suspense } from "react";
import { PageHeader } from "@/components/app/page-header";
import { OrdersTable } from "@/components/shared/orders-table";
import { FilterBar, FilterChips } from "@/components/app/filter-bar";
import { listOrdersForActor } from "@/lib/domain/orders";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { ORDER_STATUS_LABEL } from "@/lib/domain/order-status";

export default async function MasterOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const { status } = await searchParams;
  const rows = await listOrdersForActor((await getDb()), session.actor, { status: ORDER_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : undefined });
  return (
    <>
      <PageHeader title="Pedidos" description="Visão global de todos os pedidos da plataforma." />
      <Suspense>
        <FilterBar>
          <FilterChips param="status" options={ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }))} />
        </FilterBar>
      </Suspense>
      <OrdersTable rows={rows} basePath="/master/orders" />
    </>
  );
}
