import { AlertTriangle, CheckCircle2, ShoppingCart, Wallet } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { ActionQueue, type ActionQueueItem } from "@/components/app/action-queue";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb } from "@/db/client";
import { orders } from "@/db/schema";
import { and, eq, sum } from "drizzle-orm";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/auth";
import { isIndependentStore } from "@/lib/domain/independent";
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
  // Conta simples não tem carteira de recarga da Central: o assunto financeiro dela fica no Financeiro.
  if (await isIndependentStore(db, storeId)) redirect("/merchant/finance");
  const [balance, entries] = await Promise.all([getBalanceCents(db, storeId), listWalletEntries(db, session.actor, storeId, 30)]);
  const [waiting] = await db.select({ cost: sum(orders.costTotalCents) }).from(orders).where(and(eq(orders.storeId, storeId), eq(orders.status, "AWAITING_CENTRAL_PAYMENT")));
  const waitingCents = Number(waiting?.cost ?? 0);
  const missingCents = Math.max(waitingCents - balance, 0);
  const queue: ActionQueueItem[] = missingCents > 0 ? [{
    id: "topup",
    title: "Recarregue para liberar pedidos",
    description: "Faltam " + formatBRL(missingCents) + " para cobrir os pedidos já pagos pelo cliente.",
    count: 1,
    tone: "danger",
    icon: AlertTriangle,
    href: "#recarregar",
    actionLabel: "Recarregar",
  }] : waitingCents > 0 ? [{
    id: "covered",
    title: "Saldo suficiente para os pedidos em espera",
    description: "A Central pode processar " + formatBRL(waitingCents) + " em custo assim que a liberação ocorrer.",
    tone: "success",
    icon: CheckCircle2,
  }] : [];

  return (
    <>
      <PageHeader title="Saldo e recargas" description="Veja quanto está disponível, o que está bloqueado por saldo e recarregue por Pix quando necessário." />

      <OperationalPulse
        className="mb-5"
        items={[
          { label: "Saldo disponível", value: formatBRL(balance), icon: Wallet, tone: balance > 0 ? "success" : "warning", hint: "para novos débitos" },
          { label: "Pedidos aguardando saldo", value: formatBRL(waitingCents), icon: ShoppingCart, tone: waitingCents ? "warning" : "success", hint: waitingCents ? "custo bloqueado" : "nenhum bloqueado" },
          { label: "Falta para liberar", value: formatBRL(missingCents), icon: AlertTriangle, tone: missingCents ? "danger" : "success", hint: missingCents ? "recarga necessária" : "saldo suficiente" },
          { label: "Movimentos recentes", value: entries.length, icon: Wallet, tone: "neutral", hint: "últimos lançamentos" },
        ]}
      />

      <div className="mb-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
        <ActionQueue items={queue} title="Situação do saldo" description="O que está impedindo ou liberando seus pedidos." emptyMessage="Nenhum pedido depende de recarga agora." />
        <Card id="recarregar">
          <CardHeader><CardTitle>Recarregar por Pix</CardTitle></CardHeader>
          <CardContent><WalletRecharge suggestedCents={missingCents} demo={isDemoMode()} /></CardContent>
        </Card>
      </div>

      <SectionTitle title="Extrato" description="Entradas, débitos e estornos do saldo operacional." />
      <DataTable rows={entries} rowKey={(e) => e.id} columns={[
        { key: "d", header: "Data", primary: true, cell: (e) => formatDate(e.createdAt) },
        { key: "t", header: "Tipo", cell: (e) => <StatusBadge value={e.amountCents >= 0 ? "CREDITED" : "PENDING"} dot={false} /> },
        { key: "n", header: "Descrição", cell: (e) => <span>{TYPE_LABEL[e.type]}{e.note ? <span className="text-muted-foreground"> · {e.note}</span> : null}</span> },
        { key: "v", header: "Valor", className: "text-right", cell: (e) => <span className={"tabular-nums " + (e.amountCents >= 0 ? "text-success" : "")}>{formatBRL(e.amountCents)}</span> },
        { key: "b", header: "Saldo", className: "text-right", cell: (e) => <span className="tabular-nums text-muted-foreground">{formatBRL(e.balanceAfterCents)}</span> },
      ]} />
    </>
  );
}
