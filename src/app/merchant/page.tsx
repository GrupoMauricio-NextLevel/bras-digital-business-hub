import Link from "next/link";
import { ArrowRight, ExternalLink, Plus, Printer, ShoppingCart, Wallet } from "lucide-react";
import { SalesChart } from "@/components/app/sales-chart";
import { OrdersTable } from "@/components/shared/orders-table";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/status-badge";
import { requireStoreAdmin } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { getBalanceCents } from "@/lib/domain/wallet";
import { getMerchantOverview } from "@/lib/queries/merchant";
import { formatBRL } from "@/lib/money";
import { isCommerceStore } from "@/lib/store-brand";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date()));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export default async function MerchantHome() {
  const session = await requireStoreAdmin();
  const store = session.store!;
  const db = await getDb();
  const [o, commerce] = await Promise.all([getMerchantOverview(store), isCommerceStore(db, store)]);
  const isLite = !commerce && store.offer !== "STORE_OWN" && store.kind !== "SUPPLIER_OWN";
  const balance = isLite ? await getBalanceCents(db, store.id) : 0;
  const waitingCents = o.pendingCentral.reduce((sum, ord) => sum + ord.costTotalCents, 0);
  const needsTopUp = waitingCents > balance;
  const attention = (commerce ? [
    !store.publishedAt ? { key:"publish", title:"Sua loja ainda não está publicada", detail:"Revise a vitrine e publique quando estiver pronta para receber clientes.", count:1, href:"/merchant/storefront", action:"Revisar loja", icon:ExternalLink } : null,
    o.onboarding.percent < 100 ? { key:"onboarding", title:"Configuração da loja incompleta", detail:`Seu checklist está em ${o.onboarding.percent}%. Complete os itens para deixar a operação pronta.`, count:100-o.onboarding.percent, href:"/merchant/storefront", action:"Continuar", icon:ShoppingCart } : null,
    o.pendingCustomer.length ? { key:"customer", title:"Vendas aguardando pagamento", detail:"Pedidos iniciados por clientes que ainda não tiveram o pagamento confirmado.", count:o.pendingCustomer.length, href:"/merchant/orders?status=PENDING", action:"Ver vendas", icon:ShoppingCart } : null,
    o.inProgress.length ? { key:"progress", title:"Pedidos em preparação", detail:"Acompanhe os pedidos pagos que ainda estão no fluxo de atendimento.", count:o.inProgress.length, href:"/merchant/orders", action:"Acompanhar", icon:ShoppingCart } : null,
  ] : [
    o.pendingCentral.length ? { key:"funds", title:needsTopUp ? "Saldo insuficiente para liberar pedidos" : "Pedidos aguardando liberação", detail:needsTopUp ? "Faltam " + formatBRL(waitingCents - balance) + " para a operação seguir." : "Seu saldo cobre os pedidos em espera.", count:o.pendingCentral.length, href:"/merchant/wallet", action:needsTopUp ? "Recarregar" : "Ver saldo", icon:Wallet } : null,
    o.pendingLabel.length ? { key:"labels", title:"Etiquetas pendentes", detail:"A Central só inicia a separação depois do PDF da etiqueta.", count:o.pendingLabel.length, href:"/merchant/labels", action:"Enviar", icon:Printer } : null,
    o.pendingCustomer.length ? { key:"customer", title:"Clientes não concluíram o pagamento", detail:"Pedidos iniciados que ainda não avançaram para a operação.", count:o.pendingCustomer.length, href:"/merchant/orders?status=PENDING", action:"Ver pedidos", icon:ShoppingCart } : null,
  ]).filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <div className="mx-auto max-w-[1180px]">
      <section className="border-b border-border pb-9 pt-2">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--product-accent)]">{commerce ? "NextLevel Commerce / Minha loja" : "SuperDrop / Minha operação"}</p><h1 className="mt-4 text-[clamp(2.35rem,6vw,5rem)] font-semibold leading-[.92] tracking-[-.055em]">{greeting()},<br/><span className="text-muted-foreground">{session.user.name.split(" ")[0]}.</span></h1><div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><span>{store.name}</span><span>·</span><StatusBadge value={store.status} dot /><span>·</span><span>{store.publishedAt ? "Loja publicada" : "Loja não publicada"}</span></div></div>
          <div className="flex gap-2"><a href={"/store/" + store.slug} target="_blank" rel="noreferrer" className={buttonVariants({ variant:"secondary" })}><ExternalLink/>Ver loja</a><Link href="/merchant/orders/new" className={buttonVariants()}><Plus/>Novo pedido</Link></div>
        </div>

        <div className="mt-10 grid gap-6 border-t border-border pt-6 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div><div className="text-[10px] font-semibold uppercase tracking-[.14em] text-subtle-foreground">Vendas · 30 dias</div><div className="mt-2 text-3xl font-semibold tracking-[-.04em] tabular-nums sm:text-4xl">{formatBRL(o.sales)}</div><div className="mt-1 text-sm text-muted-foreground">{o.last30Count} pedidos no período</div></div>
          <div><div className="text-[10px] font-semibold uppercase tracking-[.14em] text-subtle-foreground">Margem estimada</div><div className="mt-2 text-xl font-semibold tabular-nums">{formatBRL(o.margin)}</div><div className="mt-1 text-xs text-muted-foreground">resultado operacional</div></div>
          <div><div className="text-[10px] font-semibold uppercase tracking-[.14em] text-subtle-foreground">{commerce ? "Pedidos · 30 dias" : isLite ? "Saldo operacional" : "Pedidos"}</div><div className="mt-2 text-xl font-semibold tabular-nums">{commerce ? o.last30Count : isLite ? formatBRL(balance) : o.ordersCount}</div><div className="mt-1 text-xs text-muted-foreground">{commerce ? "vendas no período" : isLite ? (needsTopUp ? "recarga necessária" : "disponível") : "no total"}</div></div>
          <div><div className="text-[10px] font-semibold uppercase tracking-[.14em] text-subtle-foreground">Clientes</div><div className="mt-2 text-xl font-semibold tabular-nums">{o.customers}</div><div className="mt-1 text-xs text-muted-foreground">base da loja</div></div>
        </div>
      </section>

      <section className="grid gap-10 py-9 lg:grid-cols-[1fr_.72fr]">
        <div>
          <div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-subtle-foreground">Prioridade</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.03em]">O que precisa de você</h2></div></div>
          {attention.length ? <ol className="divide-y divide-border border-y border-border">{attention.map((item) => { const Icon=item.icon; return <li key={item.key}><Link href={item.href} className="group flex min-h-20 items-center gap-4 py-4"><Icon className="size-4 shrink-0 text-[var(--product-accent)]"/><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.title}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{item.detail}</span></span><span className="text-sm font-semibold tabular-nums">{item.count}</span><span className="hidden text-xs font-semibold sm:block">{item.action}</span><ArrowRight className="size-4 text-subtle-foreground transition-transform group-hover:translate-x-1"/></Link></li>})}</ol> : <div className="border-y border-border py-8"><p className="text-lg font-medium">Operação limpa.</p><p className="mt-1 text-sm text-muted-foreground">Nenhuma pendência bloqueando seus pedidos agora.</p></div>}
        </div>
        <div className="border-l-0 border-border lg:border-l lg:pl-8"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-subtle-foreground">Loja</p><div className="mt-4 flex items-baseline justify-between border-b border-border pb-3"><span className="text-sm text-muted-foreground">Publicação</span><span className="text-sm font-medium">{store.publishedAt ? "No ar" : "Não publicada"}</span></div><div className="flex items-baseline justify-between border-b border-border py-3"><span className="text-sm text-muted-foreground">Onboarding</span><span className="text-sm font-medium tabular-nums">{o.onboarding.percent}%</span></div>{isLite ? <div className="flex items-baseline justify-between border-b border-border py-3"><span className="text-sm text-muted-foreground">Pedidos aguardando saldo</span><span className="text-sm font-medium tabular-nums">{o.pendingCentral.length}</span></div> : null}<Link href={isLite ? "/merchant/wallet" : "/merchant/storefront"} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.1em] text-[var(--product-accent)]">{isLite ? "Gerenciar saldo" : commerce ? "Administrar vitrine" : "Gerenciar loja"} <ArrowRight className="size-4"/></Link></div>
      </section>

      <section className="grid gap-10 border-t border-border py-9 lg:grid-cols-[1fr_.45fr]">
        <div><div className="mb-5"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-subtle-foreground">Performance</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.03em]">Vendas por dia</h2><p className="mt-1 text-xs text-muted-foreground">Últimos 30 dias</p></div><SalesChart data={o.daily}/></div>
        <div><p className="mb-5 text-[10px] font-semibold uppercase tracking-[.16em] text-subtle-foreground">Fluxo recente</p><ActivityFeed items={o.recent}/></div>
      </section>

      <section className="border-t border-border py-9"><div className="mb-5 flex items-end justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-subtle-foreground">Operação</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.03em]">Pedidos recentes</h2></div><Link href="/merchant/orders" className="flex items-center gap-2 text-xs font-semibold">Ver todos <ArrowRight className="size-4"/></Link></div><OrdersTable rows={o.recentOrders.map((order) => ({ order, storeName:store.name, storeSlug:store.slug }))} basePath="/merchant/orders" showStore={false}/></section>
    </div>
  );
}
