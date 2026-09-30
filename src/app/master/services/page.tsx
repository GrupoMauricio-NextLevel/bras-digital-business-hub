import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { StatusBadge } from "@/components/app/status-badge";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Sparkles } from "lucide-react";
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
  return (
    <>
      <PageHeader title="Loja NextLevel" description="Fila de pedidos de serviço de fornecedores e lojistas, orçamentos e a vitrine que eles enxergam." />
      <MetricGrid className="mb-8">
        <MetricCard label="Pedidos abertos" value={open.length} icon={Sparkles} hint={`${waiting.length} aguardando orçamento`} tone={waiting.length ? "warning" : "neutral"} />
        <MetricCard label="Em orçamento/execução" value={formatBRL(pipeline)} tone="info" hint="Valor orçado em andamento" />
        <MetricCard label="Entregue" value={formatBRL(delivered)} tone="success" hint="Receita de serviços concluídos" />
        <MetricCard label="Catálogo" value={`${catalog.filter((c) => c.active).length}/${catalog.length}`} hint="Serviços visíveis" />
      </MetricGrid>

      <SectionTitle title="Fila de pedidos" />
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
