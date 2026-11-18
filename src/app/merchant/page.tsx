import { and, eq } from "drizzle-orm";
import { orders } from "@/db/schema";
import { BoasVindasCeo } from "@/components/portal/equipe/blocos";
import { mostrarBoasVindas } from "@/lib/marcas/equipe-usos";
import { brandOfStore } from "@/lib/store-brand";
import Link from "next/link";
import { AlarmClock, ArrowRight, BellRing, ExternalLink, MessageCircle, Plus, Printer, Package, ShoppingBasket, ShoppingCart, Wallet, type LucideIcon } from "lucide-react";
import { filaExtraDaLoja } from "@/lib/domain/crm-loja";
import { produtosQuePrecisamDeVoce } from "@/lib/domain/produtos-agora";
import { getSupplierProducts } from "@/lib/queries/supplier";
import { AoVivo } from "@/components/master/ao-vivo";
import { SalesChart } from "@/components/app/sales-chart";
import { OrdersTable } from "@/components/shared/orders-table";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard } from "@/components/app/metric-card";
import { EmptyState } from "@/components/app/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/status-badge";
import { requireStoreAdmin } from "@/lib/require-session";
import { contratosPendentes, parcelasAPagar } from "@/lib/domain/contratos";
import { getDb } from "@/db/client";
import { getBalanceCents } from "@/lib/domain/wallet";
import { getMerchantOverview } from "@/lib/queries/merchant";
import { formatBRL } from "@/lib/money";
import { getStoreReadiness } from "@/lib/domain/readiness";
import { CommerceHome } from "@/components/commerce/commerce-home";
import { modulosDoNegocio, temLoja } from "@/lib/business/modulos";
import { resumoDosContatos } from "@/lib/business/contatos";
import { NOME_GERENCIADOR } from "@/lib/marcas/nextlevel-ecommerce";
import { pendingSurvey } from "@/lib/domain/precos/questionario";
import { benefitsPanel } from "@/lib/domain/beneficios/painel";
import { PainelBeneficios } from "@/components/beneficios/painel-beneficios";
import { QuestionarioPreco } from "@/components/descoberta/questionario-preco";
import { filaDoLojista, pedidosParados, pulsoDaLoja } from "@/lib/domain/fila-do-dia";
import { PulsoLoja } from "@/components/app/pulso-loja";
import { stockDemand } from "@/lib/domain/stock-alerts";
import { perfilAtual } from "@/lib/perfil-loja-server";
import { novidadesDa } from "@/lib/domain/novidades";
import { resumoDeVisitas } from "@/lib/domain/visitas";

const FILA_ICONE: Record<string, LucideIcon> = { publish: ExternalLink, funds: Wallet, labels: Printer, late: AlarmClock, stock: BellRing, conversas: MessageCircle, carrinhos: ShoppingBasket, produtos: Package };

function greeting() {
  const h = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date()));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export default async function MerchantHome({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const periodo = (await searchParams).periodo === "7d" ? 7 : 30;
  const session = await requireStoreAdmin();
  const store = session.store!;
  const db = await getDb();
  const [o, commerce, survey] = await Promise.all([getMerchantOverview(store), perfilAtual(store.id).then((p) => p.ecommerce), pendingSurvey(db, session.actor)]);
  const benefits = await benefitsPanel(db, session.actor);
  // NextLevel Business (NB1, D306): com a chave ligada, o topo diz "NextLevel Business · Visão geral do negócio"; num SITE,
  // a fila mostra só o que é do negócio (clientes esperando, atendimento), sem as pendências de montar uma loja.
  const negocio = commerce ? await modulosDoNegocio(db, store.id) : null;
  const ehSite = !!negocio?.business && !temLoja(negocio);
  // Recado do fundador ao lojista novo (D181): 14 primeiros dias, até a primeira venda paga.
  const temVendaPaga = (await db.select({ id: orders.id }).from(orders).where(and(eq(orders.storeId, store.id), eq(orders.customerPaymentStatus, "PAID"))).limit(1)).length > 0;
  const boasVindas = mostrarBoasVindas({ criadaEm: store.createdAt, temVendaPaga })
    ? <BoasVindasCeo primeiroNome={session.user.name.split(" ")[0]!} marca={(await brandOfStore(db, store)).name} className="mb-6" site={ehSite} /> : null;
  // "O que mudou" (D183): a novidade mais recente da marca, com link para a lista.
  const novidade = novidadesDa((await brandOfStore(db, store)).code, 1)[0];
  // Contrato esperando o aceite (D276): aviso no topo, antes de tudo.
  const pendentes = await contratosPendentes(db, session.actor);
  // CT3 (D277): parcela do contrato vencendo em até 3 dias (ou vencida) e ainda sem aviso de Pix.
  const aPagar = pendentes.length ? [] : await parcelasAPagar(db, session.actor);
  const faixaContrato = pendentes.length ? <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-[#294cdc] bg-[#eef3ff] px-4 py-3 text-sm text-[#101a33]"><span><span className="font-semibold">Você tem {pendentes.length === 1 ? "um contrato" : `${pendentes.length} contratos`} da NextLevel para aceitar.</span> Leia com calma e dê o aceite aqui no painel.</span><Link href={pendentes.length === 1 ? `/merchant/contratos/${pendentes[0]!.id}` : "/merchant/contratos"} className="rounded-md bg-[#294cdc] px-3 py-2 font-semibold text-white">Ler e aceitar</Link></div> : null;
  const faixaPix = aPagar.length ? <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-[#294cdc] bg-[#eef3ff] px-4 py-3 text-sm text-[#101a33]"><span><span className="font-semibold">Pagamento do contrato: {aPagar[0]!.descricao.toLowerCase()} de {(aPagar[0]!.valorCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span> {((v, h) => (v < h ? `venceu em ${v.split("-").reverse().join("/")}` : v === h ? "é para hoje" : `até ${v.split("-").reverse().join("/")}`))(aPagar[0]!.vencimento, new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date()))}. Já pagou? Avise com um clique.</span><Link href={`/merchant/contratos/${aPagar[0]!.contratoId}`} className="rounded-md bg-[#294cdc] px-3 py-2 font-semibold text-white">Pagar ou avisar o Pix</Link></div> : null;
  const faixaNovidade = <>{faixaContrato}{faixaPix}{novidade ? <p className="mb-4 text-sm"><span className="font-semibold">Novidade:</span> {novidade.titulo}. <Link href="/merchant/novidades" className="font-medium underline underline-offset-2">Ver o que mudou</Link></p> : null}</>;
  const surveyCard = <>{faixaNovidade}{boasVindas}{benefits ? <PainelBeneficios data={benefits} /> : null}{survey ? <QuestionarioPreco product={survey.product} /> : null}</>;
  const isLite = !commerce && store.offer !== "STORE_OWN" && store.kind !== "SUPPLIER_OWN";
  const balance = isLite ? await getBalanceCents(db, store.id) : 0;
  const readiness = commerce ? await getStoreReadiness(db, store.id) : null;
    const waitingCents = o.pendingCentral.reduce((sum, ord) => sum + ord.costTotalCents, 0);
  const needsTopUp = waitingCents > balance;
  const stockBack = (await stockDemand(db, store.id)).filter((g) => g.available > 0).length;
  // Escritório do lojista (D207): clientes esperando resposta e carrinhos recentes entram no topo da fila.
  const extra = commerce ? await filaExtraDaLoja(db, store.id) : [];
  // NextLevel Business (NB3, D309): pedidos do site ainda sem resposta vão para o topo da fila.
  if (negocio?.business) {
    const r = await resumoDosContatos(db, store.id);
    if (r.novos) extra.unshift({ key: "contatos", title: `${r.novos} pedido(s) de orçamento sem resposta`, detail: "Quem responde primeiro tem mais chance de fechar.", count: r.novos, href: "/merchant/contatos?situacao=NOVO", action: "Responder", tone: "warning" } as (typeof extra)[number]);
  }
  // D211: produtos que travam venda (sem estoque, sem preço, sem foto) entram na fila e abrem a lista do catálogo.
  const travando = commerce && o.independent ? produtosQuePrecisamDeVoce((await getSupplierProducts({ storeId: store.id })).items.map((r) => ({ id: r.product.id, name: r.product.name, images: r.product.images, suggestedPriceCents: r.product.suggestedPriceCents, status: r.product.status, available: r.available }))).filter((p) => p.tom !== "info") : [];
  if (travando.length) extra.push({ key: "produtos", title: `${travando.length} produto(s) travando venda`, detail: travando.slice(0, 2).map((p) => `${p.nome}: ${p.motivo.toLowerCase()}`).join(" · "), count: travando.length, href: "/merchant/catalogo?ver=atencao", action: "Resolver", tone: travando.some((p) => p.tom === "danger") ? "danger" : "warning" });
  const attention = [...extra, ...filaDoLojista({
    commerce, independent: o.independent, published: Boolean(store.publishedAt), readinessMissing: readiness?.missingBlocking ?? null,
    onboarding: { percent: o.onboarding.percent, missing: o.onboarding.steps.filter((st) => !st.done).length },
    pendingCustomer: o.pendingCustomer, pendingCentral: o.pendingCentral, pendingLabel: o.pendingLabel, inProgress: o.inProgress, inTransit: o.inTransit,
    balanceCents: balance, stockBack, now: new Date(),
  })].map((item) => ({ ...item, icon: FILA_ICONE[item.key] ?? ShoppingCart }));
  const pulso = pulsoDaLoja({
    hoje: o.today, commerce, publicada: Boolean(store.publishedAt), faltaParaVender: ehSite ? 0 : readiness?.missingBlocking.length ?? 0, precisaRecarga: isLite && needsTopUp,
    parados: pedidosParados({ pendingCustomer: o.pendingCustomer, pendingCentral: o.pendingCentral, pendingLabel: o.pendingLabel, inProgress: o.inProgress, inTransit: o.inTransit, independent: o.independent, now: new Date() }),
  });

  const filaFinal = ehSite ? attention.filter((a) => extra.some((e) => e.key === a.key) && a.key !== "produtos") : attention;
  // Painéis com vida (D331): uma faixa por vez no topo; a novidade vai para o pé da tela; visitas para a conversão.
  const visitas30 = commerce ? (await resumoDeVisitas(db, store.id, 30)).total : null;
  const rodapeNovidade = novidade ? <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Novidade:</span> {novidade.titulo}. <Link href="/merchant/novidades" className="font-medium underline underline-offset-2">Ver o que mudou</Link></p> : null;
  if (commerce) return <>{faixaContrato}{faixaPix}{boasVindas}<CommerceHome periodo={periodo} visitas30={visitas30} rodape={rodapeNovidade} negocio={negocio?.business ? { nome: NOME_GERENCIADOR.nome, site: ehSite } : undefined} firstName={session.user.name.split(" ")[0]!} greeting={greeting()} store={store} o={o} readiness={ehSite ? null : readiness} attention={filaFinal} pulso={<PulsoLoja pulso={pulso} semVendas className="mt-3" />} /><div className="sr-only"><AoVivo segundos={30} /></div>{benefits || survey ? <div className="mx-auto mt-6 max-w-[1240px]">{benefits ? <PainelBeneficios data={benefits} /> : null}{survey ? <QuestionarioPreco product={survey.product} /> : null}</div> : null}</>;

  const first = session.user.name.split(" ")[0]!;
  const actions = <><a href={"/store/" + store.slug} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "secondary" })}><ExternalLink />Ver loja</a><Link href="/merchant/orders/new" className={buttonVariants()}><Plus />Novo pedido</Link></>;
  return (
    <>
      <PageHeader eyebrow="SuperDrop / Minha operação" title={`${greeting()}, ${first}.`} actions={actions}
        description={<span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1"><span className="font-semibold text-foreground">{store.name}</span><span aria-hidden>·</span><StatusBadge value={store.status} dot /><span aria-hidden>·</span><span>{store.publishedAt ? "Loja publicada" : "Loja não publicada"}</span></span>} />
      <PulsoLoja pulso={pulso} className="-mt-2 mb-6" />
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
