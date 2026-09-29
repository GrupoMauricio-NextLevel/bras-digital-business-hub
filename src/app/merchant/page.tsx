import Link from "next/link";
import { Plus, ShoppingCart, TrendingUp, Users, Wallet, ExternalLink, AlertCircle, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { OrdersTable } from "@/components/shared/orders-table";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/status-badge";
import { requireRole } from "@/lib/require-session";
import { getMerchantOverview } from "@/lib/queries/merchant";
import { formatBRL } from "@/lib/money";
import { formatDate, cn } from "@/lib/utils";

export default async function MerchantHome() {
  const session = await requireRole("STORE_OWNER");
  const store = session.store!;
  const o = await getMerchantOverview(store);
  const pendencies = [
    { n: o.pendingCustomer.length, label: "aguardando pagamento do cliente", href: "/merchant/orders?status=PENDING", tone: "neutral" },
    { n: o.pendingCentral.length, label: "para pagar à Central", href: "/merchant/orders?status=AWAITING_CENTRAL_PAYMENT", tone: "warning" },
    { n: o.pendingLabel.length, label: "aguardando etiqueta", href: "/merchant/orders?status=AWAITING_LABEL", tone: "warning" },
    { n: o.inProgress.length, label: "em separação/envio na Central", href: "/merchant/orders?status=READY_TO_PICK", tone: "info" },
  ].filter((p) => p.n > 0);

  return (
    <>
      <PageHeader
        title={`Olá, ${session.user.name.split(" ")[0]}`}
        description={<span>{store.name} · <StatusBadge value={store.status} dot /> {store.publishedAt ? <span className="text-success">Loja publicada</span> : <span className="text-warning">Loja não publicada</span>}</span>}
        actions={<><a href={`/store/${store.slug}`} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "secondary" })}><ExternalLink /> Ver loja</a><Link href="/merchant/orders/new" className={buttonVariants()}><Plus /> Novo pedido</Link></>}
      />

      {o.onboarding.percent < 100 ? (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div><CardTitle className="text-base">Sua loja está {o.onboarding.percent}% pronta</CardTitle><p className="text-sm text-muted-foreground">Complete as etapas para começar a vender com tudo configurado.</p></div>
            <span className="text-2xl font-semibold tabular-nums">{o.onboarding.steps.filter((s) => s.done).length}/{o.onboarding.steps.length}</span>
          </CardHeader>
          <CardContent>
            <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-surface-muted"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${o.onboarding.percent}%` }} /></div>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {o.onboarding.steps.map((s) => (
                <li key={s.key}>
                  <Link href={s.href} className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors", s.done ? "border-transparent bg-surface-muted text-muted-foreground" : "border-border hover:bg-surface-hover")}>
                    {s.done ? <CheckCircle2 className="size-4 text-success" /> : <Circle className="size-4 text-border-strong" />}
                    <span className={s.done ? "line-through" : ""}>{s.label}</span>
                    {!s.done ? <ArrowRight className="ml-auto size-3.5 text-subtle-foreground" /> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <MetricGrid>
        <MetricCard label="Vendas (30 dias)" value={formatBRL(o.sales)} icon={TrendingUp} tone="success" hint={`${o.last30Count} pedidos`} />
        <MetricCard label="Margem estimada" value={formatBRL(o.margin)} icon={Wallet} tone="info" hint="Venda − custo Central" />
        <MetricCard label="Pedidos" value={o.ordersCount} icon={ShoppingCart} hint="Total válidos" />
        <MetricCard label="Clientes" value={o.customers} icon={Users} hint="Da sua loja" />
      </MetricGrid>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <SectionTitle title="O que preciso fazer agora?" />
            {pendencies.length === 0 ? (
              <Card><CardContent className="flex items-center gap-3 py-5 text-sm"><CheckCircle2 className="size-5 text-success" /> Tudo em dia. Nenhuma pendência nos pedidos.</CardContent></Card>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {pendencies.map((p) => (
                  <Link key={p.label} href={p.href} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:bg-surface-hover">
                    <AlertCircle className={cn("size-5", p.tone === "warning" ? "text-warning" : p.tone === "info" ? "text-info" : "text-muted-foreground")} />
                    <div className="text-sm"><span className="font-semibold">{p.n}</span> {p.n === 1 ? "pedido" : "pedidos"} {p.label}</div>
                    <ArrowRight className="ml-auto size-4 text-subtle-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div>
            <SectionTitle title="Pedidos recentes" action={<Link href="/merchant/orders" className={buttonVariants({ variant: "ghost", size: "sm" })}>Ver todos</Link>} />
            <OrdersTable rows={o.recentOrders.map((order) => ({ order, storeName: store.name, storeSlug: store.slug }))} basePath="/merchant/orders" showStore={false} />
          </div>
        </div>
        <div className="space-y-6">
          {o.subscription ? (
            <Card>
              <CardHeader><CardTitle>Plano {o.subscription.plan.name}</CardTitle><StatusBadge value={o.subscription.sub.status} dot /></CardHeader>
              <CardContent className="text-sm"><div className="text-xl font-semibold">{formatBRL(o.subscription.plan.priceCents)}<span className="text-sm font-normal text-muted-foreground">/mês</span></div><div className="text-muted-foreground">Próximo vencimento {formatDate(o.subscription.sub.currentPeriodEnd)}</div><Link href="/merchant/finance" className="mt-3 inline-block text-xs underline">Ver faturas</Link></CardContent>
            </Card>
          ) : null}
          <ActivityFeed items={o.recent} />
        </div>
      </div>
    </>
  );
}
