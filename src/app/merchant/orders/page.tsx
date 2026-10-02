import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
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
  const selectedStatus = ORDER_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : undefined;
  const allRows = await listOrdersForActor((await getDb()), session.actor);
  const rows = selectedStatus ? allRows.filter((row) => row.order.status === selectedStatus) : allRows;
  const independent = await isIndependentStore(await getDb(), session.store?.id);
  const statuses = ORDER_STATUSES.filter((s) => !independent || s !== "AWAITING_CENTRAL_PAYMENT");
  const count = (value: OrderStatus) => allRows.filter((row) => row.order.status === value).length;
  const activeCount = allRows.filter((row) => !["DELIVERED", "CANCELED"].includes(row.order.status)).length;
  return (
    <>
      <div className="mb-7 border-b border-border pb-6"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[var(--product-accent)]">SuperDrop / Operação</p><div className="mt-2 flex flex-wrap items-end justify-between gap-5"><div><h1 className="text-4xl font-semibold tracking-[-.045em]">Pedidos</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Loja virtual, WhatsApp, Instagram e vendas manuais no mesmo fluxo.</p></div><div className="flex flex-wrap items-center gap-2">{isDemoMode() ? <SimulateOrderButton /> : null}<Link href="/merchant/orders/propostas" className={buttonVariants({ variant: "ghost" })}>Propostas</Link><Link href="/merchant/orders/new" className={buttonVariants()}><Plus /> Novo pedido</Link></div></div></div>
      <section className="mb-7 border-y border-border py-5" aria-label="Resumo dos pedidos">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <div><dt className="text-[10px] font-semibold uppercase tracking-[.14em] text-subtle-foreground">Ativos</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{activeCount}</dd></div>
          <div><dt className="text-[10px] font-semibold uppercase tracking-[.14em] text-subtle-foreground">Aguardando saldo</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{count("AWAITING_CENTRAL_PAYMENT")}</dd></div>
          <div><dt className="text-[10px] font-semibold uppercase tracking-[.14em] text-subtle-foreground">Aguardando etiqueta</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{count("AWAITING_LABEL")}</dd></div>
          <div><dt className="text-[10px] font-semibold uppercase tracking-[.14em] text-subtle-foreground">Na Central</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{count("READY_TO_PICK") + count("PICKING") + count("READY_TO_SHIP")}</dd></div>
        </dl>
      </section>
      <Suspense><FilterBar><FilterChips param="status" options={statuses.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }))} /></FilterBar></Suspense>
      <OrdersTable rows={rows} basePath="/merchant/orders" showStore={false} quickView showCentral={!independent} />
    </>
  );
}
