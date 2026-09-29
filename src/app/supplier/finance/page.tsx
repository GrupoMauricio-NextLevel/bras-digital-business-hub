import { PageHeader } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge, OrderStatusBadge } from "@/components/app/status-badge";
import { requireRole } from "@/lib/require-session";
import { getSupplierFinance } from "@/lib/queries/supplier";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SupplierFinancePage() {
  const session = await requireRole("SUPPLIER_ADMIN");
  const f = await getSupplierFinance(session.supplier!.id);
  const fee = Math.round((f.gmv * session.supplier!.platformFeePercent) / 100);
  return (
    <>
      <PageHeader title="Financeiro" description="Sem split no MVP: o lojista recebe do cliente e paga o custo dos produtos à Central." />
      <MetricGrid className="mb-6">
        <MetricCard label="Recebido dos lojistas" value={formatBRL(f.received)} tone="success" hint="Pagamentos à Central confirmados" />
        <MetricCard label="A receber" value={formatBRL(f.pending)} tone="warning" hint="Pedidos com Central pendente" />
        <MetricCard label="GMV da rede" value={formatBRL(f.gmv)} hint="Vendas brutas das lojas" />
        <MetricCard label={`Taxa NextLevel (${session.supplier!.platformFeePercent}%)`} value={formatBRL(fee)} tone="info" hint={<StatusBadge value={session.supplier!.businessModel} />} />
      </MetricGrid>
      <Card className="mb-6"><CardHeader><div><CardTitle>Modelo futuro</CardTitle><CardDescription>Cliente → conta do lojista · Lojista → paga custo à Central · NextLevel → cobra % do faturamento. Integração Mercado Pago prevista via adapter.</CardDescription></div></CardHeader></Card>
      <DataTable
        rows={f.rows}
        rowKey={(r) => r.order.id}
        rowHref={(r) => `/supplier/orders/${r.order.id}`}
        columns={[
          { key: "n", header: "Pedido", primary: true, cell: (r) => <div><div className="font-medium">#{r.order.number}</div><div className="text-xs text-muted-foreground">{r.storeName}</div></div> },
          { key: "status", header: "Status", cell: (r) => <OrderStatusBadge status={r.order.status} /> },
          { key: "central", header: "Central", cell: (r) => <StatusBadge value={r.order.centralPaymentStatus} /> },
          { key: "cost", header: "Custo (Central)", className: "text-right", cell: (r) => <span className="font-medium tabular-nums">{formatBRL(r.order.costTotalCents)}</span> },
          { key: "total", header: "Venda (loja)", className: "text-right", cell: (r) => <span className="tabular-nums text-muted-foreground">{formatBRL(r.order.totalCents)}</span> },
          { key: "date", header: "Data", className: "text-right text-muted-foreground", cell: (r) => formatDate(r.order.createdAt) },
        ]}
      />
    </>
  );
}
