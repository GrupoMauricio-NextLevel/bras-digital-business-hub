import { AlertTriangle, Store, Wallet } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ActionQueue, type ActionQueueItem } from "@/components/app/action-queue";
import { OperationalPulse } from "@/components/app/operational-pulse";
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
  const stuckOrders = stuck.reduce((s, x) => s + x.awaitingOrders, 0);
  const stuckCents = stuck.reduce((s, x) => s + x.awaitingCents, 0);
  const queue: ActionQueueItem[] = [
    stuckOrders > 0 ? { id: "stuck", title: "Lojistas com pedidos bloqueados", description: formatBRL(stuckCents) + " em custo aguardando saldo.", count: stuckOrders, tone: "warning", icon: AlertTriangle, href: "#lojistas", actionLabel: "Ver lojistas" } : null,
    low.length > 0 ? { id: "low", title: "Saldos baixos podem travar novos pedidos", description: "Lojistas ativos com menos de R$ 20,00 disponíveis.", count: low.length, tone: "warning", icon: Store, href: "#lojistas", actionLabel: "Acompanhar" } : null,
  ].filter((item): item is ActionQueueItem => Boolean(item));

  return (
    <>
      <PageHeader title="Recargas dos lojistas" description="Acompanhe saldos, pedidos bloqueados e a entrada de recursos na Central." />

      {!session.supplier?.walletMpTokenEnc ? <div role="alert" className="mb-5 rounded-lg border border-warning/40 bg-warning-soft/50 p-4 text-sm"><b>Mercado Pago não conectado.</b> Os lojistas ainda não conseguem recarregar. <a className="font-medium underline" href="/supplier/settings">Conectar agora</a></div> : null}

      <OperationalPulse
        className="mb-5"
        items={[
          { label: "Recebido em recargas", value: formatBRL(o.receivedCents), icon: Wallet, tone: "success", hint: o.rechargeCount + " recarga(s) confirmada(s)" },
          { label: "Pedidos bloqueados", value: stuckOrders, icon: AlertTriangle, tone: stuckOrders ? "warning" : "success", hint: formatBRL(stuckCents) + " em custo" },
          { label: "Lojistas com saldo baixo", value: low.length, icon: Store, tone: low.length ? "warning" : "success", hint: "menos de R$ 20,00" },
          { label: "Lojistas acompanhados", value: o.stores.length, icon: Store, tone: "neutral", hint: "na rede" },
        ]}
      />

      <ActionQueue className="mb-6" items={queue} title="Atenção financeira da rede" description="Situações que podem interromper a expedição." emptyMessage="Nenhum lojista está travando a operação por saldo agora." />

      <section id="lojistas" aria-labelledby="wallet-stores-title">
        <div className="mb-3">
          <h2 id="wallet-stores-title" className="text-base font-semibold">Saldos por lojista</h2>
          <p className="text-sm text-muted-foreground">Use esta lista para identificar rapidamente quem precisa de acompanhamento.</p>
        </div>
        <DataTable rows={o.stores} rowKey={(s) => s.storeId} columns={[
          { key: "n", header: "Lojista", primary: true, cell: (s) => <div><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground"><StatusBadge value={s.offer} /></div></div> },
          { key: "b", header: "Saldo", className: "text-right", cell: (s) => <span className="font-medium tabular-nums">{formatBRL(s.balanceCents)}</span> },
          { key: "w", header: "Aguardando recarga", className: "text-right", cell: (s) => s.awaitingOrders ? <span className="tabular-nums text-warning">{s.awaitingOrders} pedido(s) · {formatBRL(s.awaitingCents)}</span> : <span className="text-muted-foreground">—</span> },
          { key: "l", header: "Última recarga", cell: (s) => s.lastRechargeAt ? formatDate(s.lastRechargeAt) + " · " + formatBRL(s.lastRechargeCents ?? 0) : "—", mobile: false },
          { key: "a", header: "", className: "text-right", cell: (s) => <span className="relative z-10"><CreditButton storeId={s.storeId} storeName={s.name} /></span> },
        ]} />
      </section>
    </>
  );
}
