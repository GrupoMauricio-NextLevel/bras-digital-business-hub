import Link from "next/link";
import { ArrowRight, ExternalLink, Plus, Printer, ShoppingCart, Wallet } from "lucide-react";
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
import { QuestionarioPreco } from "@/components/descoberta/questionario-preco";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date()));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export default async function MerchantHome() {
  const session = await requireStoreAdmin();
  const store = session.store!;
  const db = await getDb();
  const [o, commerce, survey] = await Promise.all([getMerchantOverview(store), isCommerceStore(db, store), pendingSurvey(db, session.actor)]);
  const surveyCard = survey ? <QuestionarioPreco product={survey.product} /> : null;
  const isLite = !commerce && store.offer !== "STORE_OWN" && store.kind !== "SUPPLIER_OWN";
  const balance = isLite ? await getBalanceCents(db, store.id) : 0;
  const readiness = commerce ? await getStoreReadiness(db, store.id) : null;
  const firstMissing = readiness?.missingBlocking[0];
  const waitingCents = o.pendingCentral.reduce((sum, ord) => sum + ord.costTotalCents, 0);
  const needsTopUp = waitingCents > balance;
  const attention = (commerce ? [
    firstMissing ? { key:"readiness", title:"Sua loja ainda não está pronta para vender", detail:`Falta: ${firstMissing.label.toLowerCase()}. ${firstMissing.detail}`, count:readiness!.missingBlocking.length, href:firstMissing.fixHref, action:"Resolver", icon:ShoppingCart } : null,
    !store.publishedAt ? { key:"publish", title:"Sua loja ainda não está publicada", detail:"Revise a vitrine e publique quando estiver pronta para receber clientes.", count:1, href:"/merchant/storefront", action:"Revisar loja", icon:ExternalLink } : null,
    o.onboarding.percent < 100 ? { key:"onboarding", title:"Configuração da loja incompleta", detail:`Seu checklist está em ${o.onboarding.percent}%. Complete os itens para deixar a operação pronta.`, count:o.onboarding.steps.filter((st) => !st.done).length, href:"/merchant/storefront", action:"Continuar", icon:ShoppingCart } : null,
    o.pendingCustomer.length ? { key:"customer", title:"Vendas aguardando pagamento", detail:"Pedidos iniciados por clientes que ainda não tiveram o pagamento confirmado.", count:o.pendingCustomer.length, href:"/merchant/orders?status=PENDING", action:"Ver vendas", icon:ShoppingCart } : null,
    o.inProgress.length ? { key:"progress", title:"Pedidos em preparação", detail:"Acompanhe os pedidos pagos que ainda estão no fluxo de atendimento.", count:o.inProgress.length, href:"/merchant/orders", action:"Acompanhar", icon:ShoppingCart } : null,
  ] : [
    o.pendingCentral.length ? { key:"funds", title:needsTopUp ? "Saldo insuficiente para liberar pedidos" : "Pedidos aguardando liberação", detail:needsTopUp ? "Faltam " + formatBRL(waitingCents - balance) + " para a operação seguir." : "Seu saldo cobre os pedidos em espera.", count:o.pendingCentral.length, href:"/merchant/wallet", action:needsTopUp ? "Recarregar" : "Ver saldo", icon:Wallet } : null,
    o.pendingLabel.length ? { key:"labels", title:"Etiquetas pendentes", detail:"A Central só inicia a separação depois do PDF da etiqueta.", count:o.pendingLabel.length, href:"/merchant/labels", action:"Enviar", icon:Printer } : null,
    o.pendingCustomer.length ? { key:"customer", title:"Clientes não concluíram o pagamento", detail:"Pedidos iniciados que ainda não avançaram para a operação.", count:o.pendingCustomer.length, href:"/merchant/orders?status=PENDING", action:"Ver pedidos", icon:ShoppingCart } : null,
  ]).filter((x): x is NonNullable<typeof x> => Boolean(x));

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
          <SectionTitle title="O que precisa de você" />
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
