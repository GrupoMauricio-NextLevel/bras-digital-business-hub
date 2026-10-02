import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb } from "@/db/client";
import { orders } from "@/db/schema";
import { and, eq, sum } from "drizzle-orm";
import { isDemoMode } from "@/lib/auth";
import { requireStoreAdmin } from "@/lib/require-session";
import { getBalanceCents, listWalletEntries } from "@/lib/domain/wallet";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { WalletRecharge } from "./wallet-recharge";

const TYPE_LABEL = { RECHARGE: "Recarga Pix", ORDER_DEBIT: "Custo de pedido", ORDER_REFUND: "Estorno", MANUAL_CREDIT: "Crédito manual", MANUAL_DEBIT: "Débito manual" } as const;

export default async function WalletPage() {
  const session = await requireStoreAdmin();
  const db = await getDb();
  const storeId = session.store!.id;
  const [balance, entries] = await Promise.all([getBalanceCents(db, storeId), listWalletEntries(db, session.actor, storeId, 30)]);
  const [waiting] = await db.select({ cost: sum(orders.costTotalCents) }).from(orders).where(and(eq(orders.storeId, storeId), eq(orders.status, "AWAITING_CENTRAL_PAYMENT")));
  const waitingCents = Number(waiting?.cost ?? 0);
  return (
    <>
      <PageHeader title="Saldo e recargas" description="O custo de cada pedido pago pelo cliente é debitado do seu saldo e o pedido entra na fila de expedição. Sem saldo, ele aguarda a recarga." />
      <MetricGrid className="mb-6">
        <MetricCard label="Saldo disponível" value={formatBRL(balance)} tone={balance > 0 ? "success" : "warning"} />
        <MetricCard label="Aguardando recarga" value={formatBRL(waitingCents)} tone={waitingCents ? "warning" : "neutral"} hint="Custo dos pedidos pagos sem saldo" />
      </MetricGrid>
      <Card className="mb-6">
        <CardHeader><CardTitle>Recarregar por Pix</CardTitle></CardHeader>
        <CardContent><WalletRecharge suggestedCents={Math.max(waitingCents - balance, 0)} demo={isDemoMode()} /></CardContent>
      </Card>
      <SectionTitle title="Extrato" />
      <DataTable rows={entries} rowKey={(e) => e.id} columns={[
        { key: "d", header: "Data", primary: true, cell: (e) => formatDate(e.createdAt) },
        { key: "t", header: "Tipo", cell: (e) => <StatusBadge value={e.amountCents >= 0 ? "CREDITED" : "PENDING"} dot={false} /> },
        { key: "n", header: "Descrição", cell: (e) => <span>{TYPE_LABEL[e.type]}{e.note ? <span className="text-muted-foreground"> · {e.note}</span> : null}</span> },
        { key: "v", header: "Valor", className: "text-right", cell: (e) => <span className={`tabular-nums ${e.amountCents >= 0 ? "text-success" : ""}`}>{formatBRL(e.amountCents)}</span> },
        { key: "b", header: "Saldo", className: "text-right", cell: (e) => <span className="tabular-nums text-muted-foreground">{formatBRL(e.balanceAfterCents)}</span> },
      ]} />
    </>
  );
}
