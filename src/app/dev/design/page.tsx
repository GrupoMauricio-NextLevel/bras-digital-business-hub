import { notFound } from "next/navigation";
import { Package, Wallet, Truck } from "lucide-react";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { StatusBadge, OrderStatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { Stepper, Timeline } from "@/components/app/stepper";
import { UpgradeCard } from "@/components/app/feature-gate";
import { ServiceCard } from "@/components/app/service-card";
import { Button } from "@/components/ui/button";
import { Showcase } from "./showcase";

export const metadata = { title: "Design system" };

const PANELS = ["master", "supplier", "dispatch", "lite", "pro"] as const;

export default function DesignPage() {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_DEMO_MODE !== "true") notFound();
  return (
    <main className="mx-auto max-w-5xl space-y-10 p-6">
      <h1 className="text-2xl font-semibold">Design system v3</h1>
      <Showcase />
      <h2 className="text-lg font-semibold">Base (v2) nos 5 climas</h2>
      {PANELS.map((p) => (
        <section key={p} data-panel={p} className="space-y-4 rounded-xl border border-border bg-background p-5">
          <h2 className="text-lg font-semibold capitalize">Painel: {p}</h2>
          <MetricGrid>
            <MetricCard label="Vendas" value="R$ 12.480,00" icon={Wallet} tone="success" delta={8.4} trend={[3, 5, 4, 7, 6, 9, 11]} hint="vs. mês anterior" />
            <MetricCard label="Pedidos" value="143" icon={Package} delta={-2.1} goodWhen="up" hint="7 dias" href="#" />
            <MetricCard label="Em separação" value="12" icon={Truck} tone="warning" />
            <MetricCard label="Saldo" value="R$ 340,00" tone="info" />
          </MetricGrid>
          <div className="flex flex-wrap items-center gap-2">
            <Button>Primário</Button><Button variant="secondary">Secundário</Button>
            <StatusBadge value="ACTIVE" /><StatusBadge value="PENDING" /><StatusBadge value="OVERDUE" /><StatusBadge value="DEMO" />
            <OrderStatusBadge status="SHIPPED" /><OrderStatusBadge status="AWAITING_CENTRAL_PAYMENT" />
          </div>
          <Stepper current={2} steps={[{ key: "a", label: "Pedido" }, { key: "b", label: "Saldo debitado" }, { key: "c", label: "Separação" }, { key: "d", label: "Enviado" }]} />
          <div className="grid gap-4 md:grid-cols-2">
            <Timeline items={[{ key: "1", title: "Pedido criado", when: "10:02", tone: "success" }, { key: "2", title: "Aguardando recarga", when: "10:03", tone: "warning", detail: "Falta R$ 45,00" }]} />
            <EmptyState compact title="Sem pedidos" description="Quando chegar um pedido ele aparece aqui." />
          </div>
          <UpgradeCard feature="analytics" />
          <div className="grid gap-3 sm:grid-cols-3"><ServiceCard title="Tráfego pago" description="Gestão de anúncios com relatório semanal." priceLabel="a partir de R$ 490/mês" href="#" badge="Popular" /></div>
        </section>
      ))}
    </main>
  );
}
