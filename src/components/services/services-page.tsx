import { BriefcaseBusiness, CheckCircle2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { ServicesHub } from "@/components/services/services-hub";
import { getServicesHub } from "@/lib/queries/services-hub";
import type { Session } from "@/lib/auth";

export async function ServicesPage({ session, base, pedir }: { session: Session; base: string; pedir?: string }) {
  const hub = await getServicesHub(session);
  const activeOrders = hub.orders.filter((order) => !["DONE", "CANCELED"].includes(order.status)).length;
  const completedOrders = hub.orders.filter((order) => order.status === "DONE").length;
  return (
    <>
      <PageHeader title="Loja NextLevel" description="Especialistas para acelerar o seu negócio. Peça, receba o orçamento e acompanhe cada etapa aqui." />
      <OperationalPulse className="mb-5" items={[
        { label: "Serviços disponíveis", value: hub.catalog.length, icon: Sparkles, tone: "neutral", hint: "catálogo NextLevel" },
        { label: "Recomendados", value: hub.recommended.length, icon: Sparkles, tone: hub.recommended.length ? "info" : "neutral", hint: "para o seu momento" },
        { label: "Em andamento", value: activeOrders, icon: BriefcaseBusiness, tone: activeOrders ? "info" : "success", hint: "pedidos ativos" },
        { label: "Concluídos", value: completedOrders, icon: CheckCircle2, tone: "success", hint: "entregas finalizadas" },
      ]} />
      <ServicesHub catalog={hub.catalog} recommended={hub.recommended} orders={hub.orders} base={base} autoOpenKey={pedir} />
    </>
  );
}
