import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowUpRight, LifeBuoy, ShoppingCart, Store, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { MetricCard } from "@/components/app/metric-card";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/brand/brand-logo";
import { SupportEnterButton } from "@/components/support/support-enter";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { CLIENT_ROLE_LABEL, listClients } from "@/lib/domain/support";
import { listStoresWithPlan } from "@/lib/queries/master";
import { PRODUCT_CONTEXTS } from "@/lib/product-context";
import { formatBRL } from "@/lib/money";

export const dynamic = "force-dynamic";

/** Página de cada marca no Master: saúde do negócio, quem precisa de atenção e atalhos (Grupo → Marca → Cliente). */
const MARCAS = {
  superdrop: { code: "SUPERDROP", ctx: PRODUCT_CONTEXTS.superdrop, links: [["Lojas da marca", "/master/stores?marca=SUPERDROP"], ["Fornecedores", "/master/suppliers"], ["Pedidos", "/master/orders"], ["Clientes e suporte", "/master/clientes?marca=SUPERDROP"], ["Parceiros", "/master/partners"], ["Planos", "/master/plans"]] },
  commerce: { code: "NEXTLEVEL_COMMERCE", ctx: PRODUCT_CONTEXTS.commerce, links: [["Console Commerce", "/commerce"], ["Lojas Commerce", "/commerce/stores"], ["Vendas", "/commerce/orders"], ["Interessados", "/commerce/leads"], ["Clientes e suporte", "/master/clientes?marca=NEXTLEVEL_COMMERCE"], ["Planos", "/commerce/plans"]] },
} as const;

export default async function MarcaPage({ params }: { params: Promise<{ marca: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const m = MARCAS[(await params).marca as keyof typeof MARCAS];
  if (!m) notFound();
  const db = await getDb();
  const [stores, clients] = await Promise.all([listStoresWithPlan({ marca: m.code }), listClients(db, session.actor, { brand: m.code, limit: 300 })]);
  const active = stores.filter((s) => s.store.status === "ACTIVE").length;
  const gmv = stores.reduce((s, r) => s + r.gmv, 0);
  const sales = stores.reduce((s, r) => s + r.orderCount, 0);
  const attention = clients.filter((c) => c.alerts.length && !c.disabled);
  const back = `/master/marcas/${(await params).marca}`;
  return (
    <>
      <div className="mb-2"><BrandLogo brand={{ code: m.code, name: m.ctx.name }} variant="assinatura-completa" className="h-14" priority /></div>
      <PageHeader eyebrow="Marca" title={m.ctx.name} description={`${m.ctx.descriptor}. Saúde do negócio, clientes que precisam de atenção e atalhos para cada painel.`} />
      <section className="ds-kpis mb-6" aria-label="Resumo da marca">
        <MetricCard label="Lojas ativas" value={`${active} de ${stores.length}`} icon={Store} hint={stores.length - active ? `${stores.length - active} fora do ar` : "todas no ar"} />
        <MetricCard label="Vendas pagas" value={formatBRL(gmv)} icon={TrendingUp} hint="desde o início, sem frete" />
        <MetricCard label="Pedidos pagos" value={String(sales)} icon={ShoppingCart} hint="mesma regra do painel do lojista" />
        <MetricCard label="Com alerta" value={String(attention.length)} icon={AlertTriangle} hint={`${clients.length} acessos de clientes`} />
      </section>
      <div className="ds-grid ds-grid--main">
        <section className="ds-card" aria-labelledby="att">
          <h2 id="att" className="mb-3 text-lg font-bold">Precisa de atenção</h2>
          {attention.length ? (
            <ul className="divide-y divide-border">
              {attention.slice(0, 10).map((c) => (
                <li key={c.userId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0"><div className="font-semibold">{c.tenantName ?? c.name}</div><div className="text-xs text-muted-foreground">{CLIENT_ROLE_LABEL[c.role]} · {c.name}</div><div className="mt-1 flex flex-wrap gap-1">{c.alerts.map((a) => <Badge key={a} tone="warning">{a}</Badge>)}</div></div>
                  <SupportEnterButton userId={c.userId} name={c.name} back={back} />
                </li>
              ))}
            </ul>
          ) : <EmptyState title="Nenhum cliente com alerta" description="Lojas e fornecedores desta marca estão em dia." />}
        </section>
        <nav className="ds-card" aria-labelledby="atalhos">
          <h2 id="atalhos" className="mb-3 text-lg font-bold">Atalhos</h2>
          <ul className="grid gap-1">
            {m.links.map(([label, href]) => <li key={href}><Link href={href} className="flex items-center justify-between rounded-[var(--ds-r-control)] px-3 py-2.5 font-semibold hover:bg-[var(--ds-soft)]">{label}<ArrowUpRight className="size-4 text-muted-foreground" aria-hidden /></Link></li>)}
          </ul>
          <Link href={`/master/clientes?marca=${m.code}`} className="ds-btn mt-4 w-full"><LifeBuoy className="size-4" aria-hidden />Abrir painel de um cliente</Link>
        </nav>
      </div>
    </>
  );
}
