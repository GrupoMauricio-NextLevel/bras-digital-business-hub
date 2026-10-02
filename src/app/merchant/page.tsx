import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, Circle, ExternalLink, Plus, Printer, ShoppingCart, TrendingUp, Users, Wallet } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { ActionQueue, type ActionQueueItem } from "@/components/app/action-queue";
import { OperationalPulse, type PulseItem } from "@/components/app/operational-pulse";
import { SalesChart } from "@/components/app/sales-chart";
import { OrdersTable } from "@/components/shared/orders-table";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/status-badge";
import { requireStoreAdmin } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { ServiceSpotlight } from "@/components/services/spotlight";
import { getServicesHub } from "@/lib/queries/services-hub";
import { getBalanceCents } from "@/lib/domain/wallet";
import { getMerchantOverview } from "@/lib/queries/merchant";
import { formatBRL } from "@/lib/money";
import { formatDate, cn } from "@/lib/utils";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date()));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export default async function MerchantHome() {
  const session = await requireStoreAdmin();
  const store = session.store!;
  const o = await getMerchantOverview(store);
  const hub = await getServicesHub(session);
  const isLite = store.offer !== "STORE_OWN" && store.kind !== "SUPPLIER_OWN";
  const balance = isLite ? await getBalanceCents(await getDb(), store.id) : 0;
  const waitingCents = o.pendingCentral.reduce((sum, ord) => sum + ord.costTotalCents, 0);
  const needsTopUp = waitingCents > balance;

  const queue: ActionQueueItem[] = [
    o.pendingCentral.length > 0 ? {
      id: "funds",
      title: needsTopUp ? "Recarregue para liberar pedidos" : "Pedidos aguardando liberação pela Central",
      description: needsTopUp ? "Faltam " + formatBRL(waitingCents - balance) + " para liberar " + o.pendingCentral.length + " pedido(s) já pago(s) pelo cliente." : "Seu saldo cobre os pedidos em espera.",
      count: o.pendingCentral.length,
      tone: needsTopUp ? "danger" : "warning",
      icon: Wallet,
      href: "/merchant/wallet",
      actionLabel: needsTopUp ? "Recarregar" : "Ver saldo",
    } : null,
    o.pendingLabel.length > 0 ? {
      id: "label",
      title: "Envie as etiquetas pendentes",
      description: "Sem o PDF da etiqueta a Central não consegue colocar o pedido na separação.",
      count: o.pendingLabel.length,
      tone: "warning",
      icon: Printer,
      href: "/merchant/labels",
      actionLabel: "Enviar etiqueta",
    } : null,
    o.pendingCustomer.length > 0 ? {
      id: "customer",
      title: "Clientes ainda não concluíram o pagamento",
      description: "Acompanhe os pedidos pendentes e retome o contato quando necessário.",
      count: o.pendingCustomer.length,
      tone: "neutral",
      icon: ShoppingCart,
      href: "/merchant/orders?status=PENDING",
      actionLabel: "Ver pedidos",
    } : null,
    o.inProgress.length > 0 ? {
      id: "progress",
      title: "Pedidos em preparação na Central",
      description: "Já estão em separação, conferência ou envio.",
      count: o.inProgress.length,
      tone: "info",
      icon: ShoppingCart,
      href: "/merchant/orders?status=READY_TO_PICK",
      actionLabel: "Acompanhar",
    } : null,
  ].filter((item): item is ActionQueueItem => Boolean(item));

  const pulse: PulseItem[] = isLite ? [
    { label: "Saldo para pedidos", value: formatBRL(balance), icon: Wallet, tone: needsTopUp ? "danger" : "success", hint: needsTopUp ? "recarga necessária" : "disponível agora", href: "/merchant/wallet" },
    { label: "Pedidos aguardando saldo", value: o.pendingCentral.length, icon: ShoppingCart, tone: o.pendingCentral.length ? "warning" : "success", hint: o.pendingCentral.length ? formatBRL(waitingCents) + " em custo" : "nenhum bloqueado", href: "/merchant/orders?status=AWAITING_CENTRAL_PAYMENT" },
    { label: "Vendas · 30 dias", value: formatBRL(o.sales), icon: TrendingUp, tone: "success", delta: o.salesDelta, hint: o.last30Count + " pedidos" },
    { label: "Margem estimada", value: formatBRL(o.margin), icon: Wallet, tone: "info", delta: o.marginDelta, hint: o.independent ? "venda − custo dos produtos" : "venda − custo Central" },
  ] : [
    { label: "Vendas · 30 dias", value: formatBRL(o.sales), icon: TrendingUp, tone: "success", delta: o.salesDelta, hint: o.last30Count + " pedidos" },
    { label: "Pedidos · 30 dias", value: o.last30Count, icon: ShoppingCart, tone: "info", delta: o.countDelta, hint: o.ordersCount + " no total", href: "/merchant/orders" },
    { label: "Margem estimada", value: formatBRL(o.margin), icon: Wallet, tone: "info", delta: o.marginDelta, hint: o.independent ? "venda − custo dos produtos" : "venda − custo Central" },
    { label: "Clientes", value: o.customers, icon: Users, tone: "neutral", hint: "da sua loja", href: "/merchant/customers" },
  ];

  return (
    <>
      <PageHeader
        title={greeting() + ", " + session.user.name.split(" ")[0]}
        description={<span>{store.name} · <StatusBadge value={store.status} dot /> {store.publishedAt ? <span className="text-success">Loja publicada</span> : <span className="text-warning">Loja não publicada</span>}</span>}
        actions={<><a href={"/store/" + store.slug} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "secondary" })}><ExternalLink /> Ver loja</a><Link href="/merchant/orders/new" className={buttonVariants()}><Plus /> Novo pedido</Link></>}
      />

      <OperationalPulse className="mb-5" items={pulse} />

      <div className="mb-6 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <ActionQueue
          items={queue}
          title="O que precisa de você agora"
          description="As prioridades da sua operação, em ordem de impacto."
          emptyMessage="Tudo em dia. Nenhuma pendência nos pedidos."
        />
        <Card className="overflow-hidden">
          <CardHeader className="pb-2"><CardTitle className="text-base">Sua loja</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Status</span><StatusBadge value={store.status} dot /></div>
            <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Publicação</span><span className={store.publishedAt ? "font-medium text-success" : "font-medium text-warning"}>{store.publishedAt ? "Publicada" : "Não publicada"}</span></div>
            {isLite ? <Link href="/merchant/wallet" className={buttonVariants({ className: "mt-2 w-full" })}><Wallet /> {needsTopUp ? "Recarregar agora" : "Recarregar por Pix"}</Link> : <Link href="/merchant/storefront" className={buttonVariants({ variant: "secondary", className: "mt-2 w-full" })}>Gerenciar loja</Link>}
          </CardContent>
        </Card>
      </div>

      {o.onboarding.percent < 100 ? (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div><CardTitle className="text-base">Sua loja está {o.onboarding.percent}% pronta</CardTitle><p className="text-sm text-muted-foreground">Complete as etapas para vender com tudo configurado.</p></div>
            <span className="text-2xl font-semibold tabular-nums">{o.onboarding.steps.filter((s) => s.done).length}/{o.onboarding.steps.length}</span>
          </CardHeader>
          <CardContent>
            <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-surface-muted"><div className="h-full rounded-full bg-brand transition-all" style={{ width: String(o.onboarding.percent) + "%" }} /></div>
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

      <div className="mb-6"><ServiceSpotlight hub={hub} base="/merchant" /></div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-2"><div><CardTitle className="text-base">Vendas por dia</CardTitle><p className="text-sm text-muted-foreground">Últimos 30 dias</p></div></CardHeader>
            <CardContent><SalesChart data={o.daily} /></CardContent>
          </Card>
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
