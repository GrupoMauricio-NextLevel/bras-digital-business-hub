import { PageHeader } from "@/components/app/page-header";
import { ActionQueue, type ActionQueueItem } from "@/components/app/action-queue";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { loadAfterSales } from "@/lib/domain/after-sales";
import { AfterSalesBoard } from "./after-sales-board";
import { Headset, Truck, AlertTriangle, PackageCheck } from "lucide-react";

export default async function AfterSalesPage() {
  const session = await requireRole("STORE_OWNER");
  const d = await loadAfterSales(await getDb(), session.actor);
  const queue = ([
    d.summary.attention > 0 ? { id: "attention", title: "Pedidos precisam de contato ou revisão", description: "Estão parados além do ritmo normal do pós-venda.", count: d.summary.attention, tone: "warning", icon: AlertTriangle, href: "#pos-venda", actionLabel: "Revisar" } : null,
    d.summary.inTransit > 0 ? { id: "transit", title: "Acompanhar pedidos em trânsito", description: "Confirme a evolução do transporte e antecipe problemas de entrega.", count: d.summary.inTransit, tone: "info", icon: Truck, href: "#pos-venda", actionLabel: "Acompanhar" } : null,
    d.summary.delivered > 0 ? { id: "delivered", title: "Aproveite entregas recentes", description: "É o melhor momento para pedir avaliação e reforçar relacionamento.", count: d.summary.delivered, tone: "success", icon: PackageCheck, href: "#pos-venda", actionLabel: "Ver entregues" } : null,
  ] as (ActionQueueItem | null)[]).filter((item): item is ActionQueueItem => Boolean(item));
  return (
    <>
      <PageHeader title="Pós-venda" description="Acompanhe cada pedido até a entrega, fale com o cliente pelo WhatsApp com mensagem pronta e registre o atendimento." />
      <OperationalPulse className="mb-5" items={[
        { label: "Em andamento", value: d.summary.inProgress, icon: Headset, tone: "info", hint: "até a entrega" },
        { label: "Precisam de atenção", value: d.summary.attention, icon: AlertTriangle, tone: d.summary.attention ? "warning" : "success", hint: "parados além do normal" },
        { label: "A caminho", value: d.summary.inTransit, icon: Truck, tone: "info", hint: "enviados, sem entrega" },
        { label: "Entregues · 14 dias", value: d.summary.delivered, icon: PackageCheck, tone: "success", hint: "oportunidade de avaliação" },
      ]} />
      <ActionQueue className="mb-6" items={queue} title="Próximas ações de relacionamento" description="Prioridades do pós-venda para proteger experiência e recompra." emptyMessage="Nenhum acompanhamento prioritário agora." />
      <section id="pos-venda"><AfterSalesBoard byStage={d.byStage} stages={d.stages} labels={d.labels} /></section>
    </>
  );
}
