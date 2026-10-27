import { BarChart3, Percent, Receipt, Repeat, TrendingUp } from "lucide-react";
import { perfilAtual } from "@/lib/perfil-loja-server";
import { eq, inArray } from "drizzle-orm";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { StatusBadge } from "@/components/app/status-badge";
import { FeatureGate } from "@/components/app/feature-gate";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineArea } from "@/components/finance/charts";
import { Heatmap } from "@/components/finance/heatmap";
import { getDb } from "@/db/client";
import { orderItems, orders } from "@/db/schema";
import { requireStoreAdmin } from "@/lib/require-session";
import { computeStoreAnalytics } from "@/lib/domain/analytics";
import { formatBRL } from "@/lib/money";
import { conversao, resumoDeVisitas, vendasPorOrigem } from "@/lib/domain/visitas";
import { Eye } from "lucide-react";

export default async function AnalyticsPage() {
  const session = await requireStoreAdmin();
  const store = session.store!;
  const perfil = await perfilAtual(store.id);
  const commerce = perfil.ecommerce;
  return (
    <>
      <PageHeader title="Análise de vendas" description={commerce ? "Últimos 30 dias, comparados com os 30 anteriores. Acompanhe vendas, margem, recorrência e comportamento dos clientes." : "Últimos 30 dias, comparados com os 30 anteriores. Margem = venda menos custo da Central."} />
      {perfil.pode.analytics ? <AnalyticsBody storeId={store.id} allowed /> : <FeatureGate offer={store.offer} feature="analytics"><AnalyticsBody storeId={store.id} allowed={false} /></FeatureGate>}
    </>
  );
}

async function AnalyticsBody({ storeId, allowed }: { storeId: string; allowed: boolean }) {
  if (!allowed) return null;
  const db = await getDb();
  const rows = await db.select().from(orders).where(eq(orders.storeId, storeId));
  const items = rows.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, rows.map((r) => r.id))) : [];
  const a = computeStoreAnalytics(rows, items, new Date());
  // Visitas da loja (D185): contagem sem cookie; aparece mesmo antes da primeira venda.
  const v = await resumoDeVisitas(db, storeId, 30);
  const origem = vendasPorOrigem(rows, 30);
  const conv = conversao(origem.pagos, v.total);
  const blocoVisitas = <VisitasDaLoja v={v} conv={conv} origem={origem} />;
  if (a.orders === 0 && a.previousSalesCents === 0) return <div className="space-y-8">{blocoVisitas}<EmptyState icon={BarChart3} title="Ainda não há vendas para analisar" description="Assim que os primeiros pedidos entrarem, os gráficos aparecem aqui." /></div>;
  const change = a.changePercent === null ? "Sem período anterior" : `${a.changePercent >= 0 ? "+" : ""}${a.changePercent}% vs. 30 dias antes`;
  return (
    <div className="space-y-8">
      <MetricGrid>
        <MetricCard label="Vendas" value={formatBRL(a.salesCents)} icon={TrendingUp} tone={a.changePercent !== null && a.changePercent < 0 ? "warning" : "success"} hint={change} />
        <MetricCard label="Margem" value={formatBRL(a.marginCents)} icon={Percent} tone="info" hint={`${a.marginPercent.toLocaleString("pt-BR")}% das vendas`} />
        <MetricCard label="Ticket médio" value={formatBRL(a.avgTicketCents)} icon={Receipt} hint={`${a.orders} ${a.orders === 1 ? "pedido" : "pedidos"}`} />
        <MetricCard label="Clientes recorrentes" value={`${a.repeatRate}%`} icon={Repeat} hint={`${a.repeatCustomers} de ${a.totalCustomers} compraram mais de uma vez`} />
      </MetricGrid>
      {blocoVisitas}
      <Card>
        <CardHeader><CardTitle>Vendas por dia</CardTitle></CardHeader>
        <CardContent><LineArea ariaLabel="Vendas por dia nos últimos 30 dias" color="var(--series-1)" points={a.days.map((d) => ({ label: d.label, value: d.salesCents }))} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Quando os clientes compram</CardTitle></CardHeader>
        <CardContent><Heatmap grid={a.heatmap.grid} max={a.heatmap.max} peak={a.heatmap.peak} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Clientes e vendas por estado</CardTitle></CardHeader>
        <CardContent>{a.byState.length === 0 ? <p className="text-sm text-muted-foreground">Ainda sem pedidos com endereço de entrega no período.</p> : (
          <ul className="space-y-2" aria-label="Vendas por estado">{a.byState.slice(0, 10).map((s) => (
            <li key={s.state} className="flex items-center gap-3 text-sm"><span className="w-8 font-semibold">{s.state}</span><span className="h-2.5 rounded bg-accent" style={{ width: `${Math.max(3, Math.round((s.salesCents / a.byState[0]!.salesCents) * 60))}%` }} aria-hidden /><span className="tabular-nums">{formatBRL(s.salesCents)}</span><span className="text-muted-foreground">{s.orders} pedido(s) · {s.customers} cliente(s)</span></li>
          ))}</ul>
        )}</CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle title="Produtos campeões" />
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {a.topProducts.map((p) => <li key={p.name} className="flex items-center justify-between gap-3 px-4 py-3 text-sm"><span className="min-w-0"><span className="block truncate font-medium">{p.name}</span><span className="text-xs text-muted-foreground">{p.units} un. · margem {formatBRL(p.marginCents)}</span></span><span className="tabular-nums font-semibold">{formatBRL(p.salesCents)}</span></li>)}
          </ul>
        </section>
        <section>
          <SectionTitle title="Canais de venda" />
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {a.byChannel.map((c) => <li key={c.channel} className="flex items-center justify-between gap-3 px-4 py-3 text-sm"><span className="flex items-center gap-2"><StatusBadge value={c.channel} /><span className="text-xs text-muted-foreground">{c.orders} {c.orders === 1 ? "pedido" : "pedidos"}</span></span><span className="tabular-nums font-semibold">{formatBRL(c.salesCents)}</span></li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}

/** Visitas, conversão, mais visitados e de onde vêm as vendas (D185). "Visitas" são páginas abertas, não pessoas únicas. */
function VisitasDaLoja({ v, conv, origem }: { v: Awaited<ReturnType<typeof resumoDeVisitas>>; conv: number | null; origem: ReturnType<typeof vendasPorOrigem> }) {
  const lista = (titulo: string, itens: { nome: string; valor: string }[], vazio: string) => (
    <section>
      <SectionTitle title={titulo} />
      {itens.length === 0 ? <p className="text-sm text-muted-foreground">{vazio}</p> : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">{itens.map((i) => <li key={i.nome} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"><span className="min-w-0 truncate">{i.nome}</span><span className="tabular-nums text-muted-foreground">{i.valor}</span></li>)}</ul>
      )}
    </section>
  );
  const APARELHO: Record<string, string> = { MOBILE: "Celular", DESKTOP: "Computador", TABLET: "Tablet" };
  return (
    <section aria-labelledby="visitas-t" className="space-y-5">
      <h2 id="visitas-t" className="text-lg font-semibold">Visitas da loja</h2>
      <MetricGrid>
        <MetricCard label="Visitas · 30 dias" value={v.total.toLocaleString("pt-BR")} icon={Eye} hint="páginas abertas na loja" />
        <MetricCard label="Visitas hoje" value={v.hoje.toLocaleString("pt-BR")} hint="desde a meia-noite" />
        <MetricCard label="Conversão" value={conv === null ? "—" : `${conv.toLocaleString("pt-BR")}%`} icon={Percent} hint={conv === null ? "aparece com as primeiras visitas" : `${origem.pagos} pedidos pagos a cada ${v.total.toLocaleString("pt-BR")} visitas`} />
      </MetricGrid>
      {v.porDia.length ? <Card><CardHeader><CardTitle>Visitas por dia</CardTitle></CardHeader><CardContent><LineArea ariaLabel="Visitas por dia nos últimos 30 dias" color="var(--series-2)" points={v.porDia.map((d) => ({ label: d.day.slice(8, 10) + "/" + d.day.slice(5, 7), value: d.views }))} /></CardContent></Card> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        {lista("Produtos mais visitados", v.maisVisitados.map((p) => ({ nome: p.name, valor: `${p.views.toLocaleString("pt-BR")} visitas` })), "Ainda sem visitas em páginas de produto.")}
        {lista("De onde vêm as visitas", v.porOrigem.map((o) => ({ nome: o.source, valor: `${o.views.toLocaleString("pt-BR")}` })).concat(v.porAparelho.map((o) => ({ nome: APARELHO[o.device] ?? o.device, valor: `${o.views.toLocaleString("pt-BR")}` }))), "As visitas aparecem aqui assim que a loja publicada receber clientes.")}
        {lista("Vendas por origem", origem.origem.map((o) => ({ nome: o.nome, valor: `${o.pedidos} · ${formatBRL(o.vendasCents)}` })), "Sem vendas pagas no período.")}
        {lista("Vendas por aparelho", origem.aparelho.map((o) => ({ nome: o.nome, valor: `${o.pedidos} · ${formatBRL(o.vendasCents)}` })), "Sem vendas pagas no período.")}
      </div>
      <p className="text-xs text-muted-foreground">Visitas são páginas abertas na loja publicada (robôs e o editor de tema não contam). Para usar uma campanha, divulgue o link com ?utm_source=nome (por exemplo, ?utm_source=instagram). Baixe tudo em planilha na tela de clientes.</p>
    </section>
  );
}
