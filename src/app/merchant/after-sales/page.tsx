import { PageHeader } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { loadAfterSales } from "@/lib/domain/after-sales";
import { AfterSalesBoard } from "./after-sales-board";
import { Headset, Truck, AlertTriangle, PackageCheck } from "lucide-react";

export default async function AfterSalesPage() {
  const session = await requireRole("STORE_OWNER");
  const d = await loadAfterSales(await getDb(), session.actor);
  return (
    <>
      <PageHeader title="Pós-venda" description="Acompanhe cada pedido até a entrega, fale com o cliente pelo WhatsApp com mensagem pronta e registre o atendimento." />
      <MetricGrid className="mb-6">
        <MetricCard label="Em andamento" value={d.summary.inProgress} icon={Headset} hint="Pedidos até a entrega" />
        <MetricCard label="Precisam de atenção" value={d.summary.attention} icon={AlertTriangle} tone={d.summary.attention ? "warning" : "neutral"} hint="Parados além do normal" />
        <MetricCard label="A caminho" value={d.summary.inTransit} icon={Truck} tone="info" hint="Enviados, sem entrega confirmada" />
        <MetricCard label="Entregues (14 dias)" value={d.summary.delivered} icon={PackageCheck} tone="success" hint="Peça uma avaliação" />
      </MetricGrid>
      <AfterSalesBoard byStage={d.byStage} />
    </>
  );
}
