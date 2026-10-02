import { BriefcaseBusiness, CheckCircle2, Sparkles, Wallet } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { ActionQueue, type ActionQueueItem } from "@/components/app/action-queue";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { EmptyState } from "@/components/app/empty-state";
import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { getDb } from "@/db/client";
import { services, stores, suppliers } from "@/db/schema";
import { requireRole } from "@/lib/require-session";
import { listServiceOrders } from "@/lib/domain/services";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { ServiceCatalogRow, ServiceOrderActions } from "./service-admin";

const STATUS_LABEL: Record<string, string> = { REQUESTED: "Novo", IN_ANALYSIS: "Em análise", QUOTED: "Orçado", IN_PROGRESS: "Em execução", DELIVERED: "Entregue", CANCELED: "Cancelado" };

export default async function MasterServicesPage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [orders, catalog, storeRows, supplierRows] = await Promise.all([listServiceOrders(db, session.actor), db.select().from(services).orderBy(services.category, services.name), db.select().from(stores), db.select().from(suppliers)]);
  const who = (o: (typeof orders)[number]["order"]) => (o.requesterType === "STORE" ? storeRows.find((s) => s.id === o.storeId)?.name : supplierRows.find((s) => s.id === o.supplierId)?.name) ?? "—";
  const open = orders.filter((o) => !["DELIVERED", "CANCELED"].includes(o.order.status));
  const waiting = orders.filter((o) => ["REQUESTED", "IN_ANALYSIS"].includes(o.order.status));
  const pipeline = orders.filter((o) => o.order.status === "QUOTED" || o.order.status === "IN_PROGRESS").reduce((s, o) => s + (o.order.quotedCents ?? 0), 0);
  const delivered = orders.filter((o) => o.order.status === "DELIVERED").reduce((s, o) => s + (o.order.quotedCents ?? 0), 0);
  const queue: ActionQueueItem[] = [
    waiting.length > 0 ? { id: "waiting", title: "Pedidos aguardando análise ou orçamento", description: "Entradas novas da Loja NextLevel ainda sem avanço comercial.", count: waiting.length, tone: "warning", icon: Sparkles, href: "#fila", actionLabel: "Atender" } : null,
    open.filter((o) => o.order.status === "IN_PROGRESS").length > 0 ? { id: "progress", title: "Serviços em execução", description: "Acompanhe prazos e comunicação com o cliente.", count: open.filter((o) => o.order.status === "IN_PROGRESS").length, tone: "info", icon: BriefcaseBusiness, href: "#fila", actionLabel: "Acompanhar" } : null,
  ].filter((item): item is ActionQueueItem => Boolean(item));
  return (
    <>
      <PageHeader title="Loja NextLevel" description="Fila de pedidos de serviço de fornecedores e lojistas, orçamentos e a vitrine que eles enxergam." />
      <OperationalPulse className="mb-5" items={[
        { label: "Pedidos abertos", value: open.length, icon: BriefcaseBusiness, tone: open.length ? "info" : "success", hint: waiting.length + " aguardando orçamento" },
        { label: "Pipeline", value: formatBRL(pipeline), icon: Wallet, tone: pipeline ? "info" : "neutral", hint: "valor orçado em andamento" },
        { label: "Entregue", value: formatBRL(delivered), icon: CheckCircle2, tone: "success", hint: "receita concluída" },
        { label: "Catálogo ativo", value: catalog.filter((c) => c.active).length, icon: Sparkles, tone: "neutral", hint: catalog.length + " serviços cadastrados" },
      ]} />
      <ActionQueue className="mb-6" items={queue} title="Fila comercial da Loja NextLevel" description="Prioridades que precisam de resposta ou acompanhamento." emptyMessage="Nenhum serviço aguardando atenção agora." />

      <div id="fila"><SectionTitle title="Fila de pedidos" /></div>
      {orders.length === 0 ? <EmptyState compact icon={Sparkles} title="Nenhum pedido ainda" description="Quando um fornecedor ou lojista contratar um serviço, ele aparece aqui." /> : (
        <ul className="space-y-3">
          {orders.map(({ order: o, serviceName }) => (
            <li key={o.id}>
              <Card><CardContent className="space-y-3 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0"><span className="font-medium">{serviceName}</span> <span className="text-sm text-muted-foreground">· {who(o)} ({o.requesterType === "STORE" ? "lojista" : "fornecedor"})</span></div>
                  <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</span><StatusBadge value={o.status === "DELIVERED" ? "PAID" : o.status === "CANCELED" ? "CANCELED" : "PENDING"} dot={false} /><span className="text-xs font-medium">{STATUS_LABEL[o.status]}</span></div>
                </div>
                <p className="rounded-md bg-surface-muted p-3 text-sm">{o.briefing}</p>
                <Link href={`/master/services/${o.id}`} className="text-sm font-medium text-accent-foreground hover:underline">Abrir conversa</Link>
                {o.quotedCents ? <p className="text-sm">Orçamento: <strong className="tabular-nums">{formatBRL(o.quotedCents)}</strong></p> : null}
                <ServiceOrderActions id={o.id} status={o.status} defaultQuote={o.quotedCents ?? catalog.find((c) => c.name === serviceName)?.priceFromCents ?? 0} />
              </CardContent></Card>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10">
        <SectionTitle title="Vitrine (catálogo)" description="Preço inicial, destaque e visibilidade. Os públicos são definidos no cadastro do serviço." />
        <div className="space-y-2">
          {catalog.map((c) => <ServiceCatalogRow key={c.id} id={c.id} name={c.name} priceCents={c.priceFromCents ?? 0} active={c.active} featured={c.featured} />)}
        </div>
      </div>
    </>
  );
}
