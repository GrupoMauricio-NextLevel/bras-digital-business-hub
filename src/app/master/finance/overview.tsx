import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { TIER_LABEL } from "@/lib/finance/price-book";
import { Wallet, TrendingUp, HandCoins, Clock, AlertTriangle, Percent } from "lucide-react";
import type { financeOverview } from "@/lib/domain/finance";

type Overview = Awaited<ReturnType<typeof financeOverview>>;

export function Overview({ data }: { data: Overview }) {
  const { mrr, perSupplier } = data;
  return (
    <div className="space-y-6">
      <MetricGrid>
        <MetricCard label="Receita recorrente contratada" value={formatBRL(mrr.total)} icon={Wallet} tone="success" hint={`${formatBRL(mrr.suppliers)} fornecedores · ${formatBRL(mrr.stores)} lojistas`} />
        <MetricCard label={`Taxas de volume de ${data.period}`} value={formatBRL(data.estimatedVolumeFees)} icon={TrendingUp} tone="info" hint="Estimativa até o fechamento, já com o piso mensal" />
        <MetricCard label="Recebido no mês" value={formatBRL(data.receivedInPeriod)} icon={HandCoins} hint={`${formatBRL(data.setupsPaidInPeriod)} em setups`} />
        <MetricCard label="A receber" value={formatBRL(data.receivable)} icon={Clock} tone={data.receivable ? "warning" : "neutral"} hint="Faturas abertas ou vencidas" />
      </MetricGrid>
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Em atraso" value={formatBRL(data.overdue)} icon={AlertTriangle} tone={data.overdue ? "danger" : "neutral"} hint="Aciona bloqueios por dias de atraso" />
        <MetricCard label="Comissões em garantia" value={formatBRL(data.commissions.guarantee)} icon={Percent} hint={`${formatBRL(data.commissions.pending)} aguardando pagamento do setup`} />
        <MetricCard label="Comissões já abatidas" value={formatBRL(data.commissions.credited)} icon={Percent} tone="success" hint="Descontadas em faturas de fechamento" />
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold">Fornecedores</h2>
        <DataTable
          rows={perSupplier}
          rowKey={(r) => r.supplier.id}
          columns={[
            { key: "name", header: "Fornecedor", primary: true, cell: (r) => <div><div className="font-medium">{r.supplier.name}</div><div className="text-xs text-muted-foreground">{r.supplier.businessModel === "WHITE_LABEL" ? "White Label" : `SuperDrop · ${TIER_LABEL[r.terms.tier]}`}</div></div> },
            { key: "monthly", header: "Mensalidade", className: "text-right", cell: (r) => r.waived ? <div className="text-right"><Badge tone="brand">Isenta até {formatDate(r.terms.monthlyWaivedUntil)}</Badge></div> : <span className="tabular-nums">{formatBRL(r.monthlyCents)}</span> },
            { key: "rate", header: "Taxa", className: "text-right", cell: (r) => <span className="tabular-nums">{r.terms.volumeFeeBps / 100}% · mín. {formatBRL(r.terms.minMonthlyFeeCents)}</span> },
            { key: "base", header: "Pago à Central no mês", className: "text-right", cell: (r) => <span className="tabular-nums">{formatBRL(r.baseCents)}</span> },
            { key: "fee", header: "Taxa estimada", className: "text-right", cell: (r) => <div className="text-right"><span className="font-medium tabular-nums">{formatBRL(r.feeCents)}</span>{r.minAdjustmentCents > 0 ? <div className="text-[11px] text-muted-foreground">piso aplicado</div> : null}</div> },
            { key: "access", header: "Acesso", cell: (r) => <StatusBadge value={r.accessState} dot /> },
          ]}
        />
      </div>

      <Card>
        <CardHeader><div><CardTitle>Lojas adquiridas pelos fornecedores</CardTitle><CardDescription>Origem da comissão de canal sobre o setup.</CardDescription></div></CardHeader>
        <CardContent className="px-0 pb-0">
          <DataTable
            className="rounded-none border-0 shadow-none"
            rows={data.acquisitions}
            rowKey={(r) => r.acq.id}
            columns={[
              { key: "store", header: "Loja", primary: true, cell: (r) => <div><div className="font-medium">{r.storeName}</div><div className="text-xs text-muted-foreground">via {r.supplierName}</div></div> },
              { key: "offer", header: "Oferta", cell: (r) => <StatusBadge value={r.acq.offer} /> },
              { key: "setup", header: "Setup", className: "text-right", cell: (r) => <span className="tabular-nums">{formatBRL(r.acq.setupCents)}</span> },
              { key: "comm", header: "Comissão", className: "text-right", cell: (r) => <span className="font-medium tabular-nums">{formatBRL(r.acq.commissionCents)}</span> },
              { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.acq.status} dot /> },
              { key: "elig", header: "Elegível em", className: "text-right", cell: (r) => formatDate(r.acq.eligibleAt) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
