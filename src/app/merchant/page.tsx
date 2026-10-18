import Link from "next/link";
import { AlarmClock, ArrowRight, BellRing, ExternalLink, Plus, Printer, ShoppingCart, Wallet, type LucideIcon } from "lucide-react";
import { SalesChart } from "@/components/app/sales-chart";
import { OrdersTable } from "@/components/shared/orders-table";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard } from "@/components/app/metric-card";
import { EmptyState } from "@/components/app/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/status-badge";
import { requireStoreAdmin } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { getBalanceCents } from "@/lib/domain/wallet";
import { getMerchantOverview } from "@/lib/queries/merchant";
import { formatBRL } from "@/lib/money";
import { isCommerceStore } from "@/lib/store-brand";
import { getStoreReadiness } from "@/lib/domain/readiness";
import { CommerceHome } from "@/components/commerce/commerce-home";
import { pendingSurvey } from "@/lib/domain/precos/questionario";
import { benefitsPanel } from "@/lib/domain/beneficios/painel";
import { PainelBeneficios } from "@/components/beneficios/painel-beneficios";
import { QuestionarioPreco } from "@/components/descoberta/questionario-preco";
import { filaDoLojista } from "@/lib/domain/fila-do-dia";
import { stockDemand } from "@/lib/domain/stock-alerts";

const FILA_ICONE: Record<string, LucideIcon> = { publish: ExternalLink, funds: Wallet, labels: Printer, late: AlarmClock, stock: BellRing };

function greeting() {
  const h = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date()));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export default async function MerchantHome() {
  const session = await requireStoreAdmin();
  const store = session.store!;
  const db = await getDb();
  const [o, commerce, survey] = await Promise.all([getMerchantOverview(store), isCommerceStore(db, store), pendingSurvey(db, session.actor)]);
  const benefits = await benefitsPanel(db, session.actor);
  const surveyCard = <>{benefits ? <PainelBeneficios data={benefits} /> : null}{survey ? <QuestionarioPreco product={survey.product} /> : null}</>;
  const isLite = !commerce && store.offer !== "STORE_OWN" && store.kind !== "SUPPLIER_OWN";
  const balance = isLite ? await getBalanceCents(db, store.id) : 0;
  const readiness = commerce ? await getStoreReadiness(db, store.id) : null;
    const waitingCents = o.pendingCentral.reduce((sum, ord) => sum + ord.costTotalCents, 0);
  const needsTopUp = waitingCents > balance;
  const stockBack = (await stockDemand(db, store.id)).filter((g) => g.available > 0).length;
  const attention = filaDoLojista({
    commerce, independent: o.independent, published: Boolean(store.publishedAt), readinessMissing: readiness?.missingBlocking ?? null,
    onboarding: { percent: o.onboarding.percent, missing: o.onboarding.steps.filter((st) => !st.done).length },
    pendingCustomer: o.pendingCustomer, pendingCentral: o.pendingCentral, pendingLabel: o.pendingLabel, inProgress: o.inProgress, inTransit: o.inTransit,
    balanceCents: balance, stockBack, now: new Date(),
  }).map((item) => ({ ...item, icon: FILA_ICONE[item.key] ?? ShoppingCart }));

  if (commerce) return <>{surveyCard}<CommerceHome firstName={session.user.name.split(" ")[0]!} greeting={greeting()} store={store} o={o} readiness={readiness} attention={attention} /></>;

  const first = session.user.name.split(" ")[0]!;
  const actions = <><a href={"/store/" + store.slug} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "secondary" })}><ExternalLink />Ver loja</a><Link href="/merchant/orders/new" className={buttonVariants()}><Plus />Novo pedido</Link></>;
  return (
    <>
      <PageHeader eyebrow="SuperDrop / Minha operação" title={`${greeting()}, ${first}.`} actions={actions}
        description={<span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1"><span className="font-semibold text-foreground">{store.name}</span><span aria-hidden>·</span><StatusBadge value={store.status} dot /><span aria-hidden>·</span><span>{store.publishedAt ? "Loja publicada" : "Loja não publicada"}</span></span>} />
      {surveyCard}

      <section className="ds-kpis mb-6" aria-label="Resumo dos últimos 30 dias">
        <MetricCard label="Vendas · 30 dias" value={formatBRL(o.sales)} hint={`${o.last30Count} pedidos no período`} icon={Wallet} delta={o.salesDelta} />
        <MetricCard label="Margem estimada" value={formatBRL(o.margin)} hint="resultado operacional" />
        <MetricCard label={isLite ? "Saldo operacional" : "Pedidos"} value={isLite ? formatBRL(balance) : o.ordersCount} hint={isLite ? (needsTopUp ? "recarga necessária" : "disponível") : "no total"} tone={isLite && needsTopUp ? "warning" : "neutral"} />
        <MetricCard label="Clientes" value={o.customers} hint="base da loja" />
      </section>

      <div className="ds-grid ds-grid--main mb-6">
        <section className="ds-card" aria-labelledby="att-h">
          <SectionTitle title="Fila do dia" description="O que precisa de você agora, do mais urgente ao menos urgente." />
          {attention.length ? <ol className="divide-y divide-border">{attention.map((item) => { const Icon = item.icon; return <li key={item.key}><Link href={item.href} className="group flex min-h-[64px] items-center gap-4 py-3"><span className="ds-kpi-icon !size-10"><Icon className="size-[18px]" aria-hidden /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{item.title}</span><span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.detail}</span></span><span className="ds-pill">{item.count}</span><span className="hidden text-xs font-bold text-[var(--ds-link)] sm:block">{item.action}</span><ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden /></Link></li>; })}</ol> : <EmptyState compact title="Operação limpa" description="Nenhuma pendência bloqueando seus pedidos agora." />}
        </section>
        <section className="ds-card" aria-labelledby="loja-h">
          <SectionTitle title="Loja" />
          <dl className="divide-y divide-border text-sm">
            <div className="flex items-baseline justify-between py-2.5"><dt className="text-muted-foreground">Publicação</dt><dd className="font-semibold">{store.publishedAt ? "No ar" : "Não publicada"}</dd></div>
            <div className="flex items-baseline justify-between py-2.5"><dt className="text-muted-foreground">Onboarding</dt><dd className="font-semibold tabular-nums">{o.onboarding.percent}%</dd></div>
            {isLite ? <div className="flex items-baseline justify-between py-2.5"><dt className="text-muted-foreground">Pedidos aguardando saldo</dt><dd className="font-semibold tabular-nums">{o.pendingCentral.length}</dd></div> : null}
          </dl>
          <Link href={isLite ? "/merchant/wallet" : "/merchant/storefront"} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--ds-link)]">{isLite ? "Gerenciar saldo" : "Gerenciar loja"} <ArrowRight className="size-4" aria-hidden /></Link>
        </section>
      </div>

      <div className="ds-grid ds-grid--main mb-6">
        <section className="ds-card"><SectionTitle title="Vendas por dia" description="Últimos 30 dias" /><SalesChart data={o.daily} /></section>
        <section className="ds-card"><SectionTitle title="Fluxo recente" /><ActivityFeed items={o.recent} /></section>
      </div>

      <section>
        <div className="flex items-end justify-between"><SectionTitle title="Pedidos recentes" /><Link href="/merchant/orders" className="mb-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--ds-link)]">Ver todos <ArrowRight className="size-4" aria-hidden /></Link></div>
        <OrdersTable rows={o.recentOrders.map((order) => ({ order, storeName: store.name, storeSlug: store.slug }))} basePath="/merchant/orders" showStore={false} showCentral={!o.independent} />
      </section>
    </>
  );
}
