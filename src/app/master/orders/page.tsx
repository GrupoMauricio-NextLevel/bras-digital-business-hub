import { Suspense } from "react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { OrdersTable } from "@/components/shared/orders-table";
import { FilterBar, FilterChips } from "@/components/app/filter-bar";
import { LinkTabs } from "@/components/app/link-tabs";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { EmptyState } from "@/components/app/empty-state";
import { StatusBadge } from "@/components/app/status-badge";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { listOrdersForActor } from "@/lib/domain/orders";
import { supplierOrderControl, storeOrderControl } from "@/lib/domain/master-control";
import { periodOf } from "@/lib/domain/finance";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { ORDER_STATUS_LABEL } from "@/lib/domain/order-status";
import { formatBRL } from "@/lib/money";
import { Factory } from "lucide-react";

export const dynamic = "force-dynamic";
const num = "text-right tabular-nums";

/** Escolhe a competência: os últimos 6 meses, começando pelo mês atual. */
const periods = () => { const d = new Date(); return Array.from({ length: 6 }, (_, i) => periodOf(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1)))); };

export default async function MasterOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; tab?: string; period?: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const { status, tab: rawTab, period: rawPeriod } = await searchParams;
  const tab = rawTab === "fornecedores" ? "fornecedores" : "lojas";
  const opts = periods();
  const period = opts.includes(rawPeriod ?? "") ? rawPeriod! : opts[0]!;
  const db = await getDb();
  const link = (t: string, p = period) => `/master/orders?tab=${t}&period=${p}`;
  return (
    <>
      <PageHeader title="Pedidos e comissões" description="Pedidos das lojas e pedidos dos fornecedores em telas separadas, cada uma com a comissão da NextLevel." />
      <LinkTabs label="Tipo de pedido" active={tab} items={[{ key: "lojas", label: "Pedidos das lojas", href: link("lojas") }, { key: "fornecedores", label: "Pedidos dos fornecedores", href: link("fornecedores") }]} />
      <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-label="Competência">
        <span className="text-sm text-muted-foreground">Competência:</span>
        {opts.map((p) => <a key={p} href={link(tab, p)} aria-current={p === period ? "true" : undefined} className={`rounded-full border px-3 py-1 text-xs font-medium ${p === period ? "border-accent bg-accent-soft text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>{p}</a>)}
      </div>
      {tab === "fornecedores" ? <SupplierTab period={period} /> : <StoreTab period={period} status={status} />}
    </>
  );

  async function StoreTab({ period, status }: { period: string; status?: string }) {
    const [ctl, rows] = await Promise.all([storeOrderControl(db, session.actor, period), listOrdersForActor(db, session.actor, { status: ORDER_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : undefined })]);
    return (
      <>
        <MetricGrid className="mb-6">
          <MetricCard label="Pedidos pagos" value={ctl.totals.orders} hint={`Competência ${period}`} />
          <MetricCard label="Vendas das lojas" value={formatBRL(ctl.totals.sales)} tone="info" hint="Produtos, sem frete" />
          <MetricCard label="Margem dos lojistas" value={formatBRL(ctl.totals.margin)} tone="success" hint="Venda menos custo da Central" />
          <MetricCard label="Comissão NextLevel" value={formatBRL(ctl.totals.fee)} tone="info" hint={`Taxa de volume atribuída às lojas · mais ${formatBRL(ctl.totals.memberFee)} de taxa por pedido dos membros`} />
        </MetricGrid>
        <SectionTitle title="Comissão por loja" description="A taxa do fornecedor à NextLevel repartida pelas lojas que geraram o volume. O complemento até a taxa mínima não entra aqui." />
        {ctl.rows.length === 0 ? <EmptyState compact icon={Factory} title="Sem pedidos pagos nesta competência" description="Escolha outro mês ou aguarde as primeiras vendas." /> : (
          <Card><Table>
            <THead><TR><TH>Loja</TH><TH>Fornecedor</TH><TH>Oferta</TH><TH className={num}>Pedidos</TH><TH className={num}>Vendas</TH><TH className={num}>Custo</TH><TH className={num}>Margem</TH><TH className={num}>Comissão NextLevel</TH><TH className={num}>Taxa por pedido (membro)</TH><TH className={num}>Comissão de setup (canal)</TH></TR></THead>
            <TBody>{ctl.rows.map((r) => (
              <TR key={r.storeId}><TD className="font-medium">{r.name}</TD><TD>{r.supplierName}</TD><TD><StatusBadge value={r.offer} /></TD><TD className={num}>{r.orders}</TD><TD className={num}>{formatBRL(r.salesCents)}</TD><TD className={num}>{formatBRL(r.costCents)}</TD><TD className={num}>{formatBRL(r.marginCents)}</TD><TD className={`${num} font-semibold`}>{formatBRL(r.nextlevelFeeCents)}</TD><TD className={num}>{formatBRL(r.memberFeeCents)}</TD><TD className={num}>{r.setupCommissionStatus ? <>{formatBRL(r.setupCommissionCents)} <StatusBadge value={r.setupCommissionStatus} /></> : "—"}</TD></TR>
            ))}</TBody>
          </Table></Card>
        )}
        <div className="mt-10">
          <SectionTitle title="Todos os pedidos das lojas" />
          <Suspense><FilterBar><FilterChips param="status" options={ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }))} /></FilterBar></Suspense>
          <OrdersTable rows={rows} basePath="/master/orders" quickView />
        </div>
      </>
    );
  }

  async function SupplierTab({ period }: { period: string }) {
    const ctl = await supplierOrderControl(db, session.actor, period);
    return (
      <>
        <MetricGrid className="mb-6">
          <MetricCard label="Pedidos na Central" value={ctl.totals.orders} hint={`Pagos à Central em ${period}`} />
          <MetricCard label="Base de cobrança" value={formatBRL(ctl.totals.base)} tone="info" hint="Custo pago à Central" />
          <MetricCard label="Comissão NextLevel" value={formatBRL(ctl.totals.fee)} tone="info" hint="Taxa de volume, por pedido e mínimo" />
          <MetricCard label="Comissões de canal" value={formatBRL(ctl.totals.channel)} tone="warning" hint="Abatidas dos fornecedores no fechamento" />
        </MetricGrid>
        <SectionTitle title="Comissão por fornecedor" description="É o que a NextLevel cobra de cada fornecedor no fechamento do mês, já com as comissões de canal a abater. Fornecedores não veem as taxas uns dos outros." />
        <Card><Table>
          <THead><TR><TH>Fornecedor</TH><TH>Modelo</TH><TH className={num}>Pedidos</TH><TH className={num}>Base</TH><TH className={num}>Taxa</TH><TH className={num}>Comissão NextLevel</TH><TH className={num}>Abatimento de canal</TH><TH className={num}>A cobrar</TH><TH>Fatura</TH></TR></THead>
          <TBody>{ctl.rows.map((r) => (
            <TR key={r.supplierId}><TD className="font-medium">{r.name}</TD><TD>{r.model === "WHITE_LABEL" ? "White Label" : "SuperDrop"}</TD><TD className={num}>{r.centralOrders}</TD><TD className={num}>{formatBRL(r.baseCents)}</TD><TD className={num}>{r.volumeFeeBps / 100}%</TD><TD className={`${num} font-semibold`}>{formatBRL(r.nextlevelFeeCents)}</TD><TD className={num}>{r.channelCommissionCents ? `− ${formatBRL(r.channelCommissionCents)}` : "—"}</TD><TD className={num}>{formatBRL(r.netCents)}</TD><TD>{r.invoiceStatus ? <StatusBadge value={r.invoiceStatus} /> : <span className="text-xs text-muted-foreground">Não fechada</span>}</TD></TR>
          ))}</TBody>
        </Table></Card>
      </>
    );
  }
}
