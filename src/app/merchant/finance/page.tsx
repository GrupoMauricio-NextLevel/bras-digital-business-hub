import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { DataTable } from "@/components/app/data-table";
import { OrderStatusBadge, StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/require-session";
import { getMerchantFinance } from "@/lib/queries/merchant";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export default async function MerchantFinancePage() {
  const session = await requireRole("STORE_OWNER");
  const f = await getMerchantFinance(session.store!.id);
  return (
    <>
      <PageHeader title="Financeiro" description="Você recebe do cliente e paga o custo dos produtos à Central. A diferença é sua margem." />
      <MetricGrid className="mb-6">
        <MetricCard label="Recebido de clientes" value={formatBRL(f.received)} tone="success" />
        <MetricCard label="A pagar à Central" value={formatBRL(f.owedToCentral)} tone={f.owedToCentral ? "warning" : "neutral"} hint="Pedidos com pagamento Central pendente" />
        <MetricCard label="Pago à Central" value={formatBRL(f.paidToCentral)} />
        <MetricCard label="Margem acumulada" value={formatBRL(f.margin)} tone="info" hint="Vendas − custo dos produtos" />
      </MetricGrid>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle title="Pedidos" />
          <DataTable rows={f.rows} rowKey={(o) => o.id} rowHref={(o) => `/merchant/orders/${o.id}`} columns={[
            { key: "n", header: "Pedido", primary: true, cell: (o) => <div><div className="font-medium">#{o.number}</div><div className="text-xs text-muted-foreground">{o.customerName}</div></div> },
            { key: "status", header: "Status", cell: (o) => <OrderStatusBadge status={o.status} /> },
            { key: "cust", header: "Cliente", cell: (o) => <StatusBadge value={o.customerPaymentStatus} />, mobile: false },
            { key: "central", header: "Central", cell: (o) => <StatusBadge value={o.centralPaymentStatus} /> },
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
    </>
  );
}
