import Link from "next/link";
import { ArrowRight, CircleAlert } from "lucide-react";
import { BusinessPortal } from "@/components/app/business-portal";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { OrdersTable } from "@/components/shared/orders-table";
import { getPlatformOverview } from "@/lib/queries/master";
import { redirect } from "next/navigation";
import { getBrand } from "@/lib/brand-server";
import { listOrdersForActor } from "@/lib/domain/orders";
import { buildAlerts, loadTowerSnapshot } from "@/lib/domain/control-tower";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { formatBRL, formatCompactBRL } from "@/lib/money";
import { PRODUCT_CONTEXTS } from "@/lib/product-context";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date()));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export default async function MasterDashboard() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  if ((await getBrand()).code === "NEXTLEVEL_COMMERCE") redirect("/master/commerce");
  const db = await getDb();
  const [overview, orders, snap] = await Promise.all([
    getPlatformOverview(),
    listOrdersForActor(db, session.actor, { limit: 6 }),
    loadTowerSnapshot(db),
  ]);
  const alerts = buildAlerts(snap);
  const urgent = alerts.filter((a) => a.severity === "danger").length;
  const firstName = session.user.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-[1180px]">
      <section className="border-b border-border pb-10 pt-2">
        <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--product-accent)]">NextLevel Control Center</p>
        <h1 className="mt-4 max-w-4xl text-[clamp(2.5rem,6vw,5.5rem)] font-semibold leading-[.9] tracking-[-.055em]">
          {greeting()},<br /><span className="text-muted-foreground">{firstName}.</span>
        </h1>
        <div className="mt-10 grid gap-6 border-t border-border pt-6 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div><div className="text-[11px] font-semibold uppercase tracking-[.14em] text-subtle-foreground">Volume da rede</div><div className="mt-2 text-3xl font-semibold tracking-[-.035em] tabular-nums sm:text-4xl">{formatBRL(overview.gmv)}</div><div className="mt-1 text-sm text-muted-foreground">{overview.orders} pedidos processados</div></div>
          <div><div className="text-[11px] font-semibold uppercase tracking-[.14em] text-subtle-foreground">Receita NextLevel</div><div className="mt-2 text-xl font-semibold tabular-nums">{formatBRL(overview.platformRevenue)}</div><div className="mt-1 text-xs text-muted-foreground">{formatBRL(overview.subscriptionRevenue)} recorrente</div></div>
          <div><div className="text-[11px] font-semibold uppercase tracking-[.14em] text-subtle-foreground">Rede ativa</div><div className="mt-2 text-xl font-semibold tabular-nums">{overview.activeStores}</div><div className="mt-1 text-xs text-muted-foreground">{overview.suppliers} forn. · {overview.stores} lojas</div></div>
          <div><div className="text-[11px] font-semibold uppercase tracking-[.14em] text-subtle-foreground">Atenção</div><div className="mt-2 text-xl font-semibold tabular-nums">{alerts.length}</div><div className="mt-1 text-xs text-muted-foreground">{urgent ? urgent + " urgente(s)" : "nenhum urgente"}</div></div>
        </div>
      </section>

      <section className="py-10" aria-labelledby="business-title">
        <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-subtle-foreground">Ecossistema</p><h2 id="business-title" className="mt-1 text-2xl font-semibold tracking-[-.03em]">Seus negócios</h2></div><p className="hidden max-w-sm text-right text-xs leading-relaxed text-muted-foreground sm:block">Entre em uma operação sem sair do NextLevel OS. Cada negócio mantém sua própria identidade e contexto.</p></div>
        <BusinessPortal product={PRODUCT_CONTEXTS.superdrop} attention={alerts.length ? alerts.length + " situação(ões) na operação" : "Operação sem alertas críticos"} metrics={[
          { label: "GMV", value: formatCompactBRL(overview.gmv) },
          { label: "Pedidos", value: overview.orders },
          { label: "Rede", value: overview.stores + " lojas" },
        ]} />
        <BusinessPortal product={PRODUCT_CONTEXTS.commerce} metrics={[
          { label: "Função", value: "Core" },
          { label: "Escopo", value: "Commerce" },
          { label: "Estado", value: "Ativo" },
        ]} />
        <BusinessPortal product={PRODUCT_CONTEXTS.bras} metrics={[{ label: "Modelo", value: "B2B" }, { label: "Mercado", value: "Atacado" }, { label: "Estado", value: "Preparação" }]} />
        <BusinessPortal product={PRODUCT_CONTEXTS.creators} metrics={[{ label: "Modelo", value: "Creators" }, { label: "Canal", value: "Social" }, { label: "Estado", value: "Preparação" }]} />
        <BusinessPortal product={PRODUCT_CONTEXTS.china} metrics={[{ label: "Modelo", value: "Cross-border" }, { label: "Mercado", value: "Brasil ↔ China" }, { label: "Estado", value: "Preparação" }]} />
      </section>

      <section className="grid gap-10 border-t border-border py-10 lg:grid-cols-[1fr_.65fr]">
        <div>
          <div className="mb-5 flex items-end justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-subtle-foreground">Agora</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.03em]">O que exige atenção</h2></div></div>
          {alerts.length ? <ol className="divide-y divide-border border-y border-border">{alerts.slice(0,6).map((a) => <li key={a.key}><Link href={a.href} className="group flex min-h-16 items-center gap-4 py-4"><CircleAlert className="size-4 shrink-0 text-[var(--product-accent)]" /><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{a.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{a.detail}</span></span><span className="tabular-nums text-sm font-semibold">{a.count}</span><ArrowRight className="size-4 text-subtle-foreground transition-transform group-hover:translate-x-1" /></Link></li>)}</ol> : <div className="border-y border-border py-8"><p className="text-lg font-medium">Operação limpa.</p><p className="mt-1 text-sm text-muted-foreground">Nenhuma situação exige sua atenção agora.</p></div>}
        </div>
        <div><p className="mb-5 text-[10px] font-semibold uppercase tracking-[.16em] text-subtle-foreground">Fluxo do ecossistema</p><ActivityFeed items={overview.recent} /></div>
      </section>

      <section className="border-t border-border py-10">
        <div className="mb-5 flex items-end justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-subtle-foreground">Rede</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.03em]">Pedidos recentes</h2></div><Link href="/master/orders" className="flex items-center gap-2 text-xs font-semibold">Ver todos <ArrowRight className="size-4" /></Link></div>
        <OrdersTable rows={orders} basePath="/master/orders" />
      </section>
    </div>
  );
}
