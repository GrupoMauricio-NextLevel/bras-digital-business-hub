import { notFound } from "next/navigation";
import { AlertTriangle, Package, Printer, ShoppingCart, Wallet, Truck } from "lucide-react";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { StatusBadge, OrderStatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { Stepper, Timeline } from "@/components/app/stepper";
import { UpgradeCard } from "@/components/app/feature-gate";
import { ServiceCard } from "@/components/app/service-card";
import { ActionQueue } from "@/components/app/action-queue";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { Button } from "@/components/ui/button";
import { Showcase } from "./showcase";

export const metadata = { title: "Design system" };

const PANELS = ["master", "supplier", "dispatch", "lite", "pro"] as const;

export default function DesignPage() {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_DEMO_MODE !== "true") notFound();
  return (
    <main className="mx-auto max-w-6xl space-y-10 p-4 sm:p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">NextLevel UI Foundation</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Design system v4</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Validação dos componentes compartilhados antes da migração das 114 páginas do ecossistema.</p>
      </header>

      <section className="space-y-4" data-panel="supplier">
        <div>
          <h2 className="text-lg font-semibold">Componentes-assinatura</h2>
          <p className="text-sm text-muted-foreground">A home deixa de ser coleção de cards e passa a priorizar situação e ação.</p>
        </div>
        <OperationalPulse items={[
          { label: "Vendas hoje", value: "R$ 8.420,00", icon: Wallet, tone: "success", delta: 12.4 },
          { label: "Prontos para separar", value: "18", icon: Package, tone: "info", hint: "7 antes do corte" },
          { label: "Sem etiqueta", value: "5", icon: Printer, tone: "warning", hint: "ação do lojista" },
          { label: "Atrasados", value: "2", icon: AlertTriangle, tone: "danger", hint: "mais de 24h" },
        ]} />
        <div className="grid gap-4 lg:grid-cols-5">
          <ActionQueue
            className="lg:col-span-3"
            items={[
              { id: "1", title: "Separar pedidos antes do corte", description: "7 pedidos já pagos e com etiqueta.", count: 7, tone: "info", icon: Package, href: "#", actionLabel: "Abrir esteira" },
              { id: "2", title: "Cobrar etiquetas pendentes", description: "5 pedidos aguardam arquivo de envio.", count: 5, tone: "warning", icon: Printer, href: "#", actionLabel: "Ver pedidos" },
              { id: "3", title: "Revisar pedidos atrasados", description: "2 pedidos ultrapassaram 24 horas.", count: 2, tone: "danger", icon: AlertTriangle, href: "#", actionLabel: "Revisar" },
            ]}
          />
          <div className="lg:col-span-2">
            <ActionQueue title="Tudo em dia" description="Exemplo de estado vazio" items={[]} />
          </div>
        </div>
      </section>

      <Showcase />

      <h2 className="text-lg font-semibold">Base existente nos 5 climas</h2>
      {PANELS.map((p) => (
        <section key={p} data-panel={p} className="space-y-4 rounded-xl border border-border bg-background p-5">
          <h2 className="text-lg font-semibold capitalize">Painel: {p}</h2>
          <MetricGrid>
            <MetricCard label="Vendas" value="R$ 12.480,00" icon={Wallet} tone="success" delta={8.4} trend={[3, 5, 4, 7, 6, 9, 11]} hint="vs. mês anterior" />
            <MetricCard label="Pedidos" value="143" icon={ShoppingCart} delta={-2.1} goodWhen="up" hint="7 dias" href="#" />
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
