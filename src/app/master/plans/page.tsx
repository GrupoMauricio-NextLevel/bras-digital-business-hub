import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { listPlansWithSubs } from "@/lib/queries/master";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";

export default async function PlansPage() {
  const { plans, subs, invoices } = await listPlansWithSubs();
  const inv = (s: string) => invoices.find((i) => i.status === s);
  return (
    <>
      <PageHeader title="Planos e assinaturas" description="Mensalidade das lojas. Regra futura: 15 dias de atraso → SUSPENDED · 30 dias → CLOSED." />
      <MetricGrid className="mb-6">
        <MetricCard label="MRR" value={formatBRL(subs.filter((s) => s.sub.status === "ACTIVE").reduce((a, s) => a + s.planPrice, 0))} hint="Assinaturas ativas" tone="success" />
        <MetricCard label="Faturas pagas" value={inv("PAID")?.n ?? 0} hint={formatBRL(Number(inv("PAID")?.total ?? 0))} />
        <MetricCard label="Em aberto" value={inv("OPEN")?.n ?? 0} hint={formatBRL(Number(inv("OPEN")?.total ?? 0))} tone="warning" />
        <MetricCard label="Vencidas" value={inv("OVERDUE")?.n ?? 0} hint={formatBRL(Number(inv("OVERDUE")?.total ?? 0))} tone="danger" />
      </MetricGrid>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.id}>
            <CardHeader><div><CardTitle className="text-base">{p.name}</CardTitle><div className="mt-1 text-2xl font-semibold">{formatBRL(p.priceCents)}<span className="text-sm font-normal text-muted-foreground">/mês</span></div></div></CardHeader>
            <CardContent><ul className="space-y-1 text-sm">{p.features.map((f) => <li key={f} className="flex items-center gap-2"><Check className="size-3.5 text-success" />{f}</li>)}</ul></CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8">
        <SectionTitle title="Assinaturas" />
        <DataTable
          rows={subs}
          rowKey={(r) => r.sub.id}
          columns={[
            { key: "store", header: "Loja", primary: true, cell: (r) => <span className="font-medium">{r.storeName}</span> },
            { key: "plan", header: "Plano", cell: (r) => `${r.planName} · ${formatBRL(r.planPrice)}` },
            { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.sub.status} dot /> },
            { key: "due", header: "Próximo vencimento", className: "text-right", cell: (r) => formatDate(r.sub.currentPeriodEnd) },
          ]}
        />
      </div>
    </>
  );
}
