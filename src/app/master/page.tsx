import Link from "next/link";
import { ArrowRight, CircleAlert } from "lucide-react";
import { BusinessPortal } from "@/components/app/business-portal";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { OrdersTable } from "@/components/shared/orders-table";
import { getPlatformOverview, listStoresWithPlan } from "@/lib/queries/master";
import { redirect } from "next/navigation";
import { getBrand, marcaDoMaster } from "@/lib/brand-server";
import { listOrdersForActor } from "@/lib/domain/orders";
import { buildAlerts, loadTowerSnapshot } from "@/lib/domain/control-tower";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { formatBRL, formatCompactBRL } from "@/lib/money";
import { PRODUCT_CONTEXTS } from "@/lib/product-context";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard } from "@/components/app/metric-card";
import { EmptyState } from "@/components/app/empty-state";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date()));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export default async function MasterDashboard() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  if ((await getBrand()).code === "NEXTLEVEL_COMMERCE") redirect("/commerce");
  // Master trancado na Commerce (D200): a primeira tela é a "Agora".
  if ((await marcaDoMaster()) === "NEXTLEVEL_COMMERCE") redirect("/master/agora");
  const db = await getDb();
  const [overview, orders, snap, cmStores] = await Promise.all([
    getPlatformOverview(),
    listOrdersForActor(db, session.actor, { limit: 6 }),
    loadTowerSnapshot(db),
    listStoresWithPlan({ marca: "NEXTLEVEL_COMMERCE" }),
  ]);
  // Cada cartão de negócio mostra só os números daquela marca (mesma conta da página da marca e da lista de lojas).
  const brandNumbers = (rows: Awaited<ReturnType<typeof listStoresWithPlan>>) => ({ gmv: rows.reduce((s, r) => s + r.gmv, 0), sales: rows.reduce((s, r) => s + r.orderCount, 0), stores: rows.length, active: rows.filter((r) => r.store.status === "ACTIVE").length });
  const cm = brandNumbers(cmStores);
  const alerts = buildAlerts(snap);
  const urgent = alerts.filter((a) => a.severity === "danger").length;
  const firstName = session.user.name.split(" ")[0];

  return (
    <>
      <PageHeader eyebrow="NextLevel Control Center" title={`${greeting()}, ${firstName}.`} description="Visão de todos os produtos do ecossistema." />
      <section className="ds-kpis mb-6" aria-label="Resumo da rede">
        <MetricCard label="Volume da rede" value={formatBRL(overview.gmv)} hint={`${overview.orders} vendas pagas (sem frete)`} />
        <MetricCard label="Receita NextLevel" value={formatBRL(overview.platformRevenue)} hint={`${formatBRL(overview.subscriptionRevenue)} recorrente`} />
        <MetricCard label="Rede ativa" value={overview.activeStores} hint={`${overview.suppliers} forn. · ${overview.stores} lojas`} />
        <MetricCard label="Atenção" value={alerts.length} hint={urgent ? `${urgent} urgente(s)` : "nenhum urgente"} tone={urgent ? "danger" : "neutral"} />
      </section>

      <section className="mb-6" aria-labelledby="business-title">
        <SectionTitle title="Seus negócios" description="Cada negócio mantém sua operação e seu contexto." action={<Link href="/master/mapa" className="text-sm font-semibold text-link underline">Ver o mapa do ecossistema</Link>} />
        <div className="grid gap-3">
        <BusinessPortal product={PRODUCT_CONTEXTS.commerce} metrics={[
          { label: "Vendas pagas", value: formatCompactBRL(cm.gmv) },
          { label: "Pedidos pagos", value: cm.sales },
          { label: "Lojas", value: `${cm.active} de ${cm.stores} no ar` },
        ]} />
              </div>
      </section>
      <div className="ds-grid ds-grid--main mb-6">
        <section className="ds-card">
          <SectionTitle title="O que exige atenção" action={<Link href="/master/errors" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[var(--ds-link)]">Ver alertas <ArrowRight className="size-4" aria-hidden /></Link>} />
          {alerts.length ? <ol className="divide-y divide-border">{alerts.slice(0, 6).map((a) => <li key={a.key}><Link href={a.href} className="group flex min-h-16 items-center gap-4 py-3"><CircleAlert className="size-4 shrink-0 text-[var(--ds-link)]" aria-hidden /><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{a.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{a.detail}</span></span><span className="ds-pill">{a.count}</span><ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden /></Link></li>)}</ol> : <EmptyState compact title="Operação limpa" description="Nenhuma situação exige sua atenção agora." />}
        </section>
        <section className="ds-card"><SectionTitle title="Fluxo do ecossistema" /><ActivityFeed items={overview.recent} /></section>
      </div>

      <section>
        <div className="flex items-end justify-between"><SectionTitle title="Pedidos recentes" /><Link href="/master/orders" className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[var(--ds-link)]">Ver todos <ArrowRight className="size-4" aria-hidden /></Link></div>
        <OrdersTable rows={orders} basePath="/master/orders" />
      </section>
    </>
  );
}
