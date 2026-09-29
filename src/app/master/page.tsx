import Link from "next/link";
import { Factory, Store, ShoppingCart, TrendingUp, Wallet, PauseCircle } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { OrdersTable } from "@/components/shared/orders-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlatformOverview, listStoresWithPlan } from "@/lib/queries/master";
import { listOrdersForActor } from "@/lib/domain/orders";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { formatBRL, formatCompactBRL } from "@/lib/money";
import { StatusBadge } from "@/components/app/status-badge";
import { buttonVariants } from "@/components/ui/button";

export default async function MasterDashboard() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const [overview, stores, orders] = await Promise.all([getPlatformOverview(), listStoresWithPlan(), listOrdersForActor((await getDb()), session.actor, { limit: 6 })]);

  return (
    <>
      <PageHeader title="Visão geral da plataforma" description="NextLevel Commerce Engine · SuperDrop. Dados de demonstração." />
      <MetricGrid>
        <MetricCard label="Fornecedores" value={overview.suppliers} icon={Factory} hint="Centrais ativas na plataforma" />
        <MetricCard label="Lojas" value={overview.stores} icon={Store} hint={<span><span className="text-success">{overview.activeStores} ativas</span> · <span className="text-warning">{overview.suspendedStores} suspensas</span></span>} />
        <MetricCard label="Pedidos" value={overview.orders} icon={ShoppingCart} hint="Excluindo cancelados" />
        <MetricCard label="GMV" value={formatCompactBRL(overview.gmv)} icon={TrendingUp} tone="success" hint="Volume bruto transacionado" />
      </MetricGrid>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Receita estimada NextLevel" value={formatBRL(overview.platformRevenue)} icon={Wallet} tone="info" hint={`${formatBRL(overview.feeRevenue)} taxa sobre GMV + ${formatBRL(overview.subscriptionRevenue)} mensalidades`} className="sm:col-span-2" />
        <MetricCard label="Lojas suspensas" value={overview.suspendedStores} icon={PauseCircle} tone={overview.suspendedStores ? "warning" : "neutral"} hint="Inadimplência ≥ 15 dias" />
        <MetricCard label="Ticket médio" value={overview.orders ? formatBRL(Math.round(overview.gmv / overview.orders)) : "—"} hint="GMV / pedidos" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle title="Pedidos recentes" action={<Link href="/master/orders" className={buttonVariants({ variant: "ghost", size: "sm" })}>Ver todos</Link>} />
          <OrdersTable rows={orders} basePath="/master/orders" />
          <div className="mt-6">
            <SectionTitle title="Lojas" action={<Link href="/master/stores" className={buttonVariants({ variant: "ghost", size: "sm" })}>Gerenciar</Link>} />
            <div className="grid gap-3 sm:grid-cols-3">
              {stores.map((s) => (
                <Card key={s.store.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2"><span className="flex size-6 items-center justify-center rounded text-[10px] font-bold text-white" style={{ background: s.store.primaryColor }}>{s.store.logoText}</span>{s.store.name}</CardTitle>
                    <StatusBadge value={s.store.status} dot />
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <div>{s.orderCount} pedidos · {formatBRL(s.gmv)}</div>
                    <div className="text-xs">Plano {s.planName ?? "—"} · {s.supplierName}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <ActivityFeed items={overview.recent} />
      </div>
    </>
  );
}
