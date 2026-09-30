import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { walletOverviewForSupplier } from "@/lib/domain/wallet";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { CreditButton } from "./credit-button";

export default async function WalletsPage() {
  const session = await requireRole("SUPPLIER_ADMIN");
  const o = await walletOverviewForSupplier(await getDb(), session.actor);
  const stuck = o.stores.filter((s) => s.awaitingOrders > 0);
  const low = o.stores.filter((s) => s.balanceCents < 2000 && s.status === "ACTIVE");
  return (
    <>
      <PageHeader title="Recargas dos lojistas" description="O dinheiro das recargas cai direto na sua conta Mercado Pago. Aqui você acompanha saldos e pedidos parados por falta de saldo." />
      {!session.supplier?.walletMpTokenEnc ? <div role="alert" className="mb-6 rounded-lg border border-warning/40 bg-warning-soft/50 p-4 text-sm"><b>Mercado Pago não conectado.</b> Os lojistas ainda não conseguem recarregar. <a className="font-medium underline" href="/supplier/settings">Conectar agora</a></div> : null}
      <MetricGrid className="mb-6">
        <MetricCard label="Recebido em recargas" value={formatBRL(o.receivedCents)} icon={Wallet} tone="success" hint={`${o.rechargeCount} recarga(s) confirmada(s)`} />
        <MetricCard label="Pedidos parados por saldo" value={stuck.reduce((s, x) => s + x.awaitingOrders, 0)} tone={stuck.length ? "warning" : "neutral"} hint={formatBRL(stuck.reduce((s, x) => s + x.awaitingCents, 0)) + " em custo"} />
        <MetricCard label="Lojistas com saldo baixo" value={low.length} tone={low.length ? "warning" : "neutral"} hint="Menos de R$ 20,00" />
      </MetricGrid>
      <DataTable rows={o.stores} rowKey={(s) => s.storeId} columns={[
        { key: "n", header: "Lojista", primary: true, cell: (s) => <div><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground"><StatusBadge value={s.offer} /></div></div> },
        { key: "b", header: "Saldo", className: "text-right", cell: (s) => <span className="font-medium tabular-nums">{formatBRL(s.balanceCents)}</span> },
        { key: "w", header: "Aguardando recarga", className: "text-right", cell: (s) => s.awaitingOrders ? <span className="tabular-nums text-warning">{s.awaitingOrders} pedido(s) · {formatBRL(s.awaitingCents)}</span> : <span className="text-muted-foreground">—</span> },
        { key: "l", header: "Última recarga", cell: (s) => s.lastRechargeAt ? `${formatDate(s.lastRechargeAt)} · ${formatBRL(s.lastRechargeCents ?? 0)}` : "—", mobile: false },
        { key: "a", header: "", className: "text-right", cell: (s) => <span className="relative z-10"><CreditButton storeId={s.storeId} storeName={s.name} /></span> },
      ]} />
    </>
  );
}
