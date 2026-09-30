import Link from "next/link";
import { AlertTriangle, ArrowRight, Sparkles, CircleAlert, Factory, Info, ShoppingCart, Store, TrendingUp, Wallet } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { OrdersTable } from "@/components/shared/orders-table";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getPlatformOverview } from "@/lib/queries/master";
import { getBrandHub } from "@/lib/domain/commerce-hub";
import { listOrdersForActor } from "@/lib/domain/orders";
import { listServiceOrders } from "@/lib/domain/services";
import { BAND_LABEL, buildAlerts, healthScore, loadTowerSnapshot, type HealthBand, type Severity } from "@/lib/domain/control-tower";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { formatBRL, formatCompactBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

const SEV: Record<Severity, { icon: typeof Info; box: string; label: string }> = {
  danger: { icon: CircleAlert, box: "border-danger/40 bg-danger-soft/50 text-danger", label: "Urgente" },
  warning: { icon: AlertTriangle, box: "border-warning/40 bg-warning-soft/50 text-warning", label: "Atenção" },
  info: { icon: Info, box: "border-info/40 bg-info-soft/50 text-info", label: "Oportunidade" },
};
const BAND_COLOR: Record<HealthBand, string> = { HEALTHY: "bg-success", ATTENTION: "bg-warning", RISK: "bg-danger" };
const OFFER_LABEL = { DROP_MANUAL: "Drop manual", STORE_SUBDOMAIN: "Loja SuperDrop", STORE_OWN: "Loja própria" } as const;

export default async function MasterDashboard() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [overview, orders, snap] = await Promise.all([getPlatformOverview(), listOrdersForActor(db, session.actor, { limit: 6 }), loadTowerSnapshot(db)]);
  const commerce = await getBrandHub(db, session.actor);
  const serviceOrders = await listServiceOrders(db, session.actor);
  const svcWaiting = serviceOrders.filter((o) => ["REQUESTED", "IN_ANALYSIS"].includes(o.order.status)).length;
  const svcActive = serviceOrders.filter((o) => ["QUOTED", "IN_PROGRESS"].includes(o.order.status)).length;
  const alerts = buildAlerts(snap);
  const health = snap.stores.map((s) => ({ s, h: healthScore(s) }));
  const bands = (["HEALTHY", "ATTENTION", "RISK"] as HealthBand[]).map((b) => ({ band: b, n: health.filter((x) => x.h.band === b).length }));
  const risky = health.filter((x) => x.h.band !== "HEALTHY").sort((a, b) => a.h.score - b.h.score).slice(0, 5);
  const byOffer = (["DROP_MANUAL", "STORE_SUBDOMAIN", "STORE_OWN"] as const).map((o) => ({ offer: o, n: snap.stores.filter((s) => s.offer === o).length }));
  const urgent = alerts.filter((a) => a.severity === "danger").length;

  return (
    <>
      <PageHeader title="Torre de controle" description="O que precisa da sua atenção agora, a saúde da rede e a receita da NextLevel." />
      <Link href="/master/commerce" data-commerce-strip className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border border-border bg-surface p-4 text-sm shadow-sm transition-colors hover:bg-surface-hover">
        <span className="flex items-center gap-2 font-semibold"><Store className="size-4" aria-hidden /> NextLevel Commerce</span>
        <span>{commerce.kpis.stores} {commerce.kpis.stores === 1 ? "loja" : "lojas"} · {commerce.kpis.paying} com plano pago</span>
        <span>{commerce.kpis.leadsNew} interessado(s) novo(s)</span>
        <span className={commerce.ready ? "text-success" : "text-warning"}>{commerce.ready ? "Pronta para lançar" : `Faltam ${commerce.checks.filter((c) => c.severity === "blocker" && !c.ok).length} item(ns) para lançar`}</span>
        <span className="ml-auto inline-flex items-center gap-1 font-semibold">Abrir <ArrowRight className="size-4" aria-hidden /></span>
      </Link>
      <MetricGrid className="lg:grid-cols-5">
        <MetricCard label="Receita NextLevel (mês)" value={formatBRL(overview.platformRevenue)} icon={Wallet} tone="info" hint={`${formatBRL(overview.subscriptionRevenue)} recorrente + ${formatBRL(overview.feeRevenue)} taxas`} href="/master/finance" />
        <MetricCard label="GMV da rede" value={formatCompactBRL(overview.gmv)} icon={TrendingUp} tone="success" hint={`${overview.orders} pedidos`} />
        <MetricCard label="Rede" value={`${overview.suppliers} forn. · ${overview.stores} lojas`} icon={Factory} hint={`${overview.activeStores} ativas · ${overview.suspendedStores} suspensas`} href="/master/suppliers" />
        <MetricCard label="Loja NextLevel" value={`${svcWaiting} aguardando`} icon={Sparkles} tone={svcWaiting ? "warning" : "neutral"} hint={`${svcActive} em orçamento ou execução`} href="/master/services" />
        <MetricCard label="Alertas abertos" value={alerts.length} icon={AlertTriangle} tone={urgent ? "danger" : alerts.length ? "warning" : "success"} hint={urgent ? `${urgent} urgente(s)` : "Nada urgente"} />
      </MetricGrid>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3" aria-labelledby="fila">
          <SectionTitle title="Fila de atenção" description="Ordenada por gravidade. Cada item leva direto à tela que resolve." />
          {alerts.length === 0 ? (
            <EmptyState compact icon={ShoppingCart} title="Tudo em ordem" description="Nenhum alerta aberto. Aproveite para oferecer serviços aos lojistas." />
          ) : (
            <ul className="space-y-2" id="fila">
              {alerts.map((a) => {
                const v = SEV[a.severity]; const Icon = v.icon;
                return (
                  <li key={a.key}>
                    <Link href={a.href} className={cn("group flex items-start gap-3 rounded-lg border p-3 transition hover:shadow-md", v.box)}>
                      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2"><span className="text-sm font-semibold text-foreground">{a.title}</span><span className="rounded-full bg-background/70 px-2 text-xs font-semibold tabular-nums">{a.count}</span><span className="sr-only">{v.label}</span></span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{a.detail}</span>
                      </span>
                      <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-6 lg:col-span-2" aria-label="Saúde da rede">
          <Card>
            <CardHeader><CardTitle>Saúde das lojas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label={bands.map((b) => `${BAND_LABEL[b.band]}: ${b.n}`).join(", ")}>
                {bands.filter((b) => b.n > 0).map((b) => <span key={b.band} className={cn("h-full", BAND_COLOR[b.band])} style={{ flex: b.n }} />)}
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {bands.map((b) => <li key={b.band} className="flex items-center gap-1.5"><span className={cn("size-2.5 rounded-sm", BAND_COLOR[b.band])} aria-hidden />{BAND_LABEL[b.band]} <strong className="tabular-nums">{b.n}</strong></li>)}
              </ul>
              {risky.length ? (
                <ul className="divide-y divide-border text-sm">
                  {risky.map(({ s, h }) => (
                    <li key={s.id} className="py-2">
                      <div className="flex items-center justify-between gap-2"><span className="truncate font-medium">{s.name}</span><span className={cn("rounded px-1.5 text-xs font-semibold tabular-nums", h.band === "RISK" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning")}>{h.score}</span></div>
                      <p className="text-xs text-muted-foreground">{OFFER_LABEL[s.offer]} · {h.reasons[0]}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">Nenhuma loja em atenção.</p>}
              <Link href="/master/stores" className={buttonVariants({ variant: "ghost", size: "sm" })}>Ver todas as lojas <ArrowRight /></Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Lojas por oferta</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {byOffer.map((o) => <li key={o.offer} className="flex items-center justify-between"><span className="flex items-center gap-2"><Store className="size-4 text-muted-foreground" aria-hidden />{OFFER_LABEL[o.offer]}</span><strong className="tabular-nums">{o.n}</strong></li>)}
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle title="Pedidos recentes" action={<Link href="/master/orders" className={buttonVariants({ variant: "ghost", size: "sm" })}>Ver todos</Link>} />
          <OrdersTable rows={orders} basePath="/master/orders" />
        </div>
        <ActivityFeed items={overview.recent} />
      </div>
    </>
  );
}
