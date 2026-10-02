import Link from "next/link";
import { AlertTriangle, ArrowRight, Sparkles, CircleAlert, Factory, Info, ShoppingCart, Store, TrendingUp, Wallet } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { ActionQueue, type ActionQueueItem } from "@/components/app/action-queue";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { OrdersTable } from "@/components/shared/orders-table";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getPlatformOverview } from "@/lib/queries/master";
import { redirect } from "next/navigation";
import { getBrand } from "@/lib/brand-server";
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
  // Cada marca tem a sua casa: no endereço da Commerce o início do Master é a área da marca.
  if ((await getBrand()).code === "NEXTLEVEL_COMMERCE") redirect("/master/commerce");
  const db = await getDb();
  const [overview, orders, snap] = await Promise.all([getPlatformOverview(), listOrdersForActor(db, session.actor, { limit: 6 }), loadTowerSnapshot(db)]);
  const serviceOrders = await listServiceOrders(db, session.actor);
  const svcWaiting = serviceOrders.filter((o) => ["REQUESTED", "IN_ANALYSIS"].includes(o.order.status)).length;
  const svcActive = serviceOrders.filter((o) => ["QUOTED", "IN_PROGRESS"].includes(o.order.status)).length;
  const alerts = buildAlerts(snap);
  const health = snap.stores.map((s) => ({ s, h: healthScore(s) }));
  const bands = (["HEALTHY", "ATTENTION", "RISK"] as HealthBand[]).map((b) => ({ band: b, n: health.filter((x) => x.h.band === b).length }));
  const risky = health.filter((x) => x.h.band !== "HEALTHY").sort((a, b) => a.h.score - b.h.score).slice(0, 5);
  const byOffer = (["DROP_MANUAL", "STORE_SUBDOMAIN", "STORE_OWN"] as const).map((o) => ({ offer: o, n: snap.stores.filter((s) => s.offer === o).length }));
  const urgent = alerts.filter((a) => a.severity === "danger").length;
  const queue: ActionQueueItem[] = alerts.map((a) => ({
    id: a.key,
    title: a.title,
    description: a.detail,
    count: a.count,
    tone: a.severity === "danger" ? "danger" : a.severity === "warning" ? "warning" : "info",
    icon: a.severity === "danger" ? CircleAlert : a.severity === "warning" ? AlertTriangle : Info,
    href: a.href,
    actionLabel: "Resolver",
  }));

  return (
    <>
      <PageHeader title="Torre de controle" description="O que precisa da sua atenção agora, a saúde da rede e a receita da NextLevel." />
      <OperationalPulse className="mb-6" items={[
        { label: "Receita NextLevel · mês", value: formatBRL(overview.platformRevenue), icon: Wallet, tone: "info", hint: formatBRL(overview.subscriptionRevenue) + " recorrente", href: "/master/finance" },
        { label: "GMV da rede", value: formatCompactBRL(overview.gmv), icon: TrendingUp, tone: "success", hint: overview.orders + " pedidos" },
        { label: "Rede ativa", value: overview.activeStores, icon: Factory, tone: overview.suspendedStores ? "warning" : "success", hint: overview.suppliers + " forn. · " + overview.stores + " lojas", href: "/master/suppliers" },
        { label: "Alertas", value: alerts.length, icon: AlertTriangle, tone: urgent ? "danger" : alerts.length ? "warning" : "success", hint: urgent ? urgent + " urgente(s)" : "nada urgente" },
      ]} />

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3" aria-labelledby="fila">
          <ActionQueue items={queue} title="Fila de atenção" description="Ordenada por gravidade. Cada item leva direto à tela que resolve." emptyMessage="Tudo em ordem. Nenhum alerta aberto agora." />
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
