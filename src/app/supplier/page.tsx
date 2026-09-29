import Link from "next/link";
import { ShoppingCart, Store, Package, Boxes, Clock, Truck, TrendingUp, Wallet } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { OrdersTable } from "@/components/shared/orders-table";
import { requireRole } from "@/lib/require-session";
import { getSupplierOverview } from "@/lib/queries/supplier";
import { listOrdersForActor } from "@/lib/domain/orders";
import { getDb } from "@/db/client";
import { formatBRL } from "@/lib/money";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function SupplierHome() {
  const session = await requireRole("SUPPLIER_ADMIN");
  const supplierId = session.supplier!.id;
  const [o, orders] = await Promise.all([getSupplierOverview(supplierId), listOrdersForActor(getDb(), session.actor, { limit: 6 })]);

  return (
    <>
      <PageHeader title={`Olá, ${session.user.name.split(" ")[0]}`} description={`${session.supplier!.name} · Rede com ${o.stores} lojas`} actions={<Link href="/supplier/shipping" className={buttonVariants()}><Truck /> Expedição ({o.readyToShip})</Link>} />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Card className={o.awaiting ? "border-warning/40" : ""}>
          <CardContent className="flex items-center gap-4 py-4">
            <span className="flex size-10 items-center justify-center rounded-md bg-warning-soft text-warning"><Clock className="size-5" /></span>
            <div className="flex-1"><div className="text-sm font-medium">{o.awaiting} pedidos aguardando ação do lojista</div><div className="text-xs text-muted-foreground">Pagamento à Central ou etiqueta pendente</div></div>
            <Link href="/supplier/orders?status=AWAITING_CENTRAL_PAYMENT" className={buttonVariants({ variant: "secondary", size: "sm" })}>Ver</Link>
          </CardContent>
        </Card>
        <Card className={o.readyToShip ? "border-info/40" : ""}>
          <CardContent className="flex items-center gap-4 py-4">
            <span className="flex size-10 items-center justify-center rounded-md bg-info-soft text-info"><Truck className="size-5" /></span>
            <div className="flex-1"><div className="text-sm font-medium">{o.readyToShip} pedidos prontos para expedição</div><div className="text-xs text-muted-foreground">Separar, embalar e enviar</div></div>
            <Link href="/supplier/shipping" className={buttonVariants({ variant: "secondary", size: "sm" })}>Expedir</Link>
          </CardContent>
        </Card>
      </div>

      <MetricGrid>
        <MetricCard label="Vendas da rede" value={formatBRL(o.salesCents)} icon={TrendingUp} tone="success" hint={`${o.ordersCount} pedidos válidos`} />
        <MetricCard label="Receita Central" value={formatBRL(o.costCents)} icon={Wallet} tone="info" hint="Custo dos produtos vendidos" />
        <MetricCard label="Lojas da rede" value={o.stores} icon={Store} hint={`${o.activeStores} ativas`} />
        <MetricCard label="Produtos" value={o.products} icon={Package} hint="No catálogo central" />
      </MetricGrid>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <MetricCard label="Estoque físico" value={o.onHand} icon={Boxes} hint="Peças em mãos" />
        <MetricCard label="Reservado" value={o.reserved} hint="Em pedidos abertos" tone="warning" />
        <MetricCard label="Disponível" value={o.available} hint="on_hand − reserved" tone="success" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle title="Pedidos recentes da rede" action={<Link href="/supplier/orders" className={buttonVariants({ variant: "ghost", size: "sm" })}><ShoppingCart /> Ver todos</Link>} />
          <OrdersTable rows={orders} basePath="/supplier/orders" />
        </div>
        <ActivityFeed items={o.recent} />
      </div>
    </>
  );
}
