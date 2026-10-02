import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { DataTable } from "@/components/app/data-table";
import { OrderStatusBadge, StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStoreAdmin } from "@/lib/require-session";
import { getMerchantFinance } from "@/lib/queries/merchant";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { isDemoMode } from "@/lib/auth";
import { getDb } from "@/db/client";
import { addonViewsFor, listInvoicesFor } from "@/lib/domain/nextlevel-billing";
import { getPriceBook, periodOf, storeOrderFeeFor } from "@/lib/domain/finance";
import { buildRationale } from "@/lib/finance/rationale";
import { isIndependentStore } from "@/lib/domain/order-policy";
import { InvoicePay } from "@/components/finance/invoice-pay";
import { AddonCards } from "@/components/finance/addon-cards";
import { RationaleList } from "@/components/finance/rationale-list";

export default async function MerchantFinancePage() {
  const session = await requireStoreAdmin();
  const f = await getMerchantFinance(session.store!.id);
  const db = await getDb();
  const [addons, invoices, book] = await Promise.all([addonViewsFor(db, session.actor), listInvoicesFor(db, session.actor), getPriceBook(db)]);
  const feeNow = await storeOrderFeeFor(db, session.store!.id, periodOf(new Date()), book);
  const independent = await isIndependentStore(db, session.store!.id);
  const demo = isDemoMode();
  const openInvoices = invoices.filter((i) => (i.status === "OPEN" || i.status === "OVERDUE") && i.amountCents > 0);
  return (
    <>
      <PageHeader title="Financeiro" description={independent ? "Você recebe do cliente e desconta o custo dos produtos. A diferença é sua margem." : "Você recebe do cliente e o custo dos produtos é debitado do seu saldo. A diferença é sua margem."} />
      <MetricGrid className="mb-6">
        {feeNow.bps > 0 ? <MetricCard label="Taxa por pedido (mês)" value={formatBRL(feeNow.feeCents)} hint={`${feeNow.bps / 100}% sobre ${formatBRL(feeNow.baseCents)} em ${feeNow.orders} pedido(s), cobrada no fechamento`} /> : null}
        <MetricCard label="Recebido de clientes" value={formatBRL(f.received)} tone="success" />
        {independent ? null : <MetricCard label="Aguardando recarga" value={formatBRL(f.owedToCentral)} tone={f.owedToCentral ? "warning" : "neutral"} hint="Custo de pedidos pagos sem saldo" />}
        {independent ? null : <MetricCard label="Custo debitado do saldo" value={formatBRL(f.paidToCentral)} />}
        <MetricCard label="Margem acumulada" value={formatBRL(f.margin)} tone="info" hint="Vendas − custo dos produtos" />
      </MetricGrid>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle title="Pedidos" />
          <DataTable rows={f.rows} rowKey={(o) => o.id} rowHref={(o) => `/merchant/orders/${o.id}`} columns={[
            { key: "n", header: "Pedido", primary: true, cell: (o) => <div><div className="font-medium">#{o.number}</div><div className="text-xs text-muted-foreground">{o.customerName}</div></div> },
            { key: "status", header: "Status", cell: (o) => <OrderStatusBadge status={o.status} /> },
            { key: "cust", header: "Cliente", cell: (o) => <StatusBadge value={o.customerPaymentStatus} />, mobile: false },
            ...(independent ? [] : [{ key: "central", header: "Saldo", cell: (o: (typeof f.rows)[number]) => <StatusBadge value={o.centralPaymentStatus} /> }]),
            { key: "total", header: "Venda", className: "text-right", cell: (o) => <span className="tabular-nums">{formatBRL(o.totalCents)}</span> },
            { key: "cost", header: "Custo", className: "text-right", cell: (o) => <span className="tabular-nums text-muted-foreground">{formatBRL(o.costTotalCents)}</span> },
            { key: "margin", header: "Margem", className: "text-right", cell: (o) => <span className="font-medium tabular-nums text-success">{formatBRL(o.subtotalCents - o.costTotalCents)}</span> },
          ]} />
        </div>
        <div className="space-y-4">
          {f.subscription ? (
            <Card>
              <CardHeader><CardTitle>Mensalidade</CardTitle><StatusBadge value={f.subscription.sub.status} dot /></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><div className="text-xs text-muted-foreground">Plano atual</div><div className="text-lg font-semibold">{f.subscription.plan.name} · {formatBRL(f.subscription.plan.priceCents)}/mês</div></div>
                <div><div className="text-xs text-muted-foreground">Próximo vencimento</div><div className="font-medium">{formatDate(f.subscription.sub.currentPeriodEnd)}</div></div>
                <ul className="divide-y divide-border border-t border-border pt-2">
                  {f.subscription.invoices.map((inv) => <li key={inv.id} className="flex items-center justify-between py-2"><span className="text-muted-foreground">Venc. {formatDate(inv.dueDate)}</span><span className="flex items-center gap-2 tabular-nums">{formatBRL(inv.amountCents)} <StatusBadge value={inv.status} /></span></li>)}
                </ul>
                <p className="text-xs text-muted-foreground">Regra: 15 dias de atraso suspende a loja; 30 dias encerra.</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
      <div className="mt-8 space-y-6">
        {openInvoices.length ? (
          <section>
            <h2 className="mb-3 text-base font-semibold">Faturas em aberto com a NextLevel</h2>
            <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
              {openInvoices.map((i) => <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"><span><span className="font-medium">{i.description}</span> <span className="text-muted-foreground">· vence {formatDate(i.dueDate)}</span></span><span className="flex items-center gap-3"><span className="tabular-nums">{formatBRL(i.amountCents)}</span><InvoicePay invoiceId={i.id} demo={demo} /></span></li>)}
            </ul>
          </section>
        ) : null}
        <section><h2 className="mb-3 text-base font-semibold">Add-ons</h2><AddonCards addons={addons} demo={demo} /></section>
        <section><h2 className="mb-3 text-base font-semibold">Por que cobramos</h2><RationaleList items={buildRationale(book).filter((r) => r.audience !== "SUPPLIER" && (r.key.startsWith("addon:") || r.key === `offer:${session.store!.offer}`))} /></section>
      </div>
    </>
  );
}
