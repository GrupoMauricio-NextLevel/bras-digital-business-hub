import { desc, eq, and } from "drizzle-orm";
import { PageHeader } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge, OrderStatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireAreaRole } from "@/lib/require-session";
import { getSupplierFinance } from "@/lib/queries/supplier";
import { getDb } from "@/db/client";
import { financeInvoices, storeAcquisitions, stores } from "@/db/schema";
import { estimateClosing, periodOf } from "@/lib/domain/finance";
import { isWaived } from "@/lib/finance/engine";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { TIER_LABEL } from "@/lib/finance/price-book";
import { isDemoMode } from "@/lib/auth";
import { addonViewsFor } from "@/lib/domain/nextlevel-billing";
import { getPriceBook } from "@/lib/domain/finance";
import { buildRationale } from "@/lib/finance/rationale";
import { InvoicePay } from "@/components/finance/invoice-pay";
import { AddonCards } from "@/components/finance/addon-cards";
import { RationaleList } from "@/components/finance/rationale-list";

const KIND: Record<string, string> = { SUPPLIER_SETUP: "Setup", SUPPLIER_SUBSCRIPTION: "Mensalidade", SUPPLIER_CLOSING: "Fechamento mensal", ADDON: "Add-on", SERVICE: "Serviço" };

export default async function SupplierFinancePage() {
  const session = await requireAreaRole("SUPERDROP", "SUPPLIER_ADMIN");
  const supplier = session.supplier!;
  const db = await getDb();
  const period = periodOf(new Date());
  const [f, est, invoices, acquisitions] = await Promise.all([
    getSupplierFinance(supplier.id),
    estimateClosing(db, supplier.id, period, true),
    db.select().from(financeInvoices).where(and(eq(financeInvoices.supplierId, supplier.id), eq(financeInvoices.payerType, "SUPPLIER"))).orderBy(desc(financeInvoices.createdAt)),
    db.select({ acq: storeAcquisitions, storeName: stores.name }).from(storeAcquisitions).innerJoin(stores, eq(stores.id, storeAcquisitions.storeId)).where(eq(storeAcquisitions.supplierId, supplier.id)).orderBy(desc(storeAcquisitions.createdAt)),
  ]);
  const [addons, book] = await Promise.all([addonViewsFor(db, session.actor), getPriceBook(db)]);
  const demo = isDemoMode();
  const t = est.terms;
  const waived = isWaived(t.monthlyWaivedUntil, new Date());
  const open = invoices.filter((i) => i.status === "OPEN" || i.status === "OVERDUE");

  return (
    <>
      <PageHeader title="Financeiro" description="Seu contrato com a NextLevel, o que será cobrado no fechamento e as comissões pelas lojas que você traz." />
      {supplier.status !== "ACTIVE" ? (
        <div className="mb-6 rounded-lg border border-danger/30 bg-danger-soft/50 p-4 text-sm"><div className="font-semibold">Acesso com restrição: <StatusBadge value={supplier.status} /></div><p className="mt-1 text-muted-foreground">Há faturas vencidas com a NextLevel. Regularize para restabelecer todas as funções.</p></div>
      ) : null}

      <MetricGrid className="mb-6">
        <MetricCard label="Mensalidade" value={waived ? "Isenta" : formatBRL(t.monthlyFeeCents)} tone={waived ? "success" : "neutral"} hint={waived ? `Até ${formatDate(t.monthlyWaivedUntil)}` : t.model === "SUPERDROP" ? `Faixa ${TIER_LABEL[t.tier]}` : "White Label"} />
        <MetricCard label="Taxa de volume" value={`${t.volumeFeeBps / 100}%`} hint={`Mínimo mensal de ${formatBRL(t.minMonthlyFeeCents)}`} />
        <MetricCard label={`Pago à Central em ${period}`} value={formatBRL(est.baseCents)} tone="info" hint={`${est.orders} ${est.orders === 1 ? "pedido" : "pedidos"} com pagamento confirmado`} />
        <MetricCard label="A pagar no fechamento" value={formatBRL(est.closing.netCents)} tone={est.closing.netCents ? "warning" : "success"} hint={est.closing.commissionCreditCents ? `Já abate ${formatBRL(est.closing.commissionCreditCents)} de comissões` : "Estimativa do mês corrente"} />
      </MetricGrid>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><div><CardTitle>Estimativa do fechamento de {period}</CardTitle><CardDescription>Cobrado depois do fim do mês, com vencimento no dia 5.</CardDescription></div></CardHeader>
          <CardContent>
            <ul className="divide-y divide-border text-sm">
              {est.closing.lines.map((l, i) => <li key={i} className="flex justify-between gap-4 py-2"><span className="text-muted-foreground">{l.description}</span><span className={`tabular-nums ${l.amountCents < 0 ? "text-success" : ""}`}>{formatBRL(l.amountCents)}</span></li>)}
              <li className="flex justify-between gap-4 py-2 font-semibold"><span>Total estimado</span><span className="tabular-nums">{formatBRL(est.closing.netCents)}</span></li>
            </ul>
            {est.closing.carryOutCents > 0 ? <p className="mt-2 text-xs text-muted-foreground">Sobram {formatBRL(est.closing.carryOutCents)} de comissão que ficam como saldo a seu favor no mês seguinte.</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div><CardTitle>Como você ganha com lojas novas</CardTitle><CardDescription>Cada loja trazida por você paga o setup direto à NextLevel.</CardDescription></div></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Você recebe <b>{t.storeSetupCommissionBps / 100}%</b> do setup, liberados depois do prazo de garantia e abatidos da sua fatura de fechamento.</p>
            <p className="text-muted-foreground">Com uma loja própria de R$ 2.000, a comissão é de {formatBRL(Math.round((200000 * t.storeSetupCommissionBps) / 10000))}. Estorno do setup cancela a comissão.</p>
            <div className="flex flex-wrap gap-2 pt-1"><Badge tone="info">{acquisitions.filter((a) => a.acq.status === "GUARANTEE").length} em garantia</Badge><Badge tone="success">{acquisitions.filter((a) => a.acq.status === "CREDITED").length} já abatidas</Badge><Badge tone="warning">{acquisitions.filter((a) => a.acq.status === "PENDING_PAYMENT").length} aguardando pagamento</Badge></div>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 text-base font-semibold">Faturas da NextLevel {open.length ? <span className="ml-1 text-sm font-normal text-warning">{open.length} em aberto</span> : null}</h2>
      <DataTable rows={invoices} rowKey={(i) => i.id} columns={[
        { key: "d", header: "Fatura", primary: true, cell: (i) => <div><div className="font-medium">{i.description}</div><div className="text-xs text-muted-foreground">{KIND[i.kind]}</div></div> },
        { key: "a", header: "Valor", className: "text-right", cell: (i) => <span className="font-medium tabular-nums">{formatBRL(i.amountCents)}</span> },
        { key: "due", header: "Vencimento", className: "text-right", cell: (i) => formatDate(i.dueDate) },
        { key: "s", header: "Status", cell: (i) => <StatusBadge value={i.status} dot /> },
        { key: "pay", header: "", className: "text-right", cell: (i) => (i.status === "OPEN" || i.status === "OVERDUE") && i.amountCents > 0 ? <span className="relative z-10"><InvoicePay invoiceId={i.id} demo={demo} /></span> : null },
      ]} />

      <h2 className="mb-3 mt-8 text-base font-semibold">Add-ons</h2>
      <AddonCards addons={addons} demo={demo} />

      <h2 className="mb-3 mt-8 text-base font-semibold">Por que cobramos</h2>
      <RationaleList items={buildRationale(book).filter((r) => r.audience !== "STORE")} />

      <h2 className="mb-3 mt-8 text-base font-semibold">Comissões de canal</h2>
      <DataTable rows={acquisitions} rowKey={(a) => a.acq.id} columns={[
        { key: "s", header: "Loja", primary: true, cell: (a) => <span className="font-medium">{a.storeName}</span> },
        { key: "o", header: "Oferta", cell: (a) => <StatusBadge value={a.acq.offer} /> },
        { key: "su", header: "Setup", className: "text-right", cell: (a) => <span className="tabular-nums">{formatBRL(a.acq.setupCents)}</span> },
        { key: "c", header: "Sua comissão", className: "text-right", cell: (a) => <span className="font-medium tabular-nums">{formatBRL(a.acq.commissionCents)}</span> },
        { key: "st", header: "Status", cell: (a) => <StatusBadge value={a.acq.status} dot /> },
        { key: "e", header: "Elegível em", className: "text-right", cell: (a) => formatDate(a.acq.eligibleAt) },
      ]} />

      <h2 className="mb-3 mt-8 text-base font-semibold">Pedidos e custo recebido dos lojistas</h2>
      <p className="mb-3 text-sm text-muted-foreground">Recargas e pagamentos à Central caem na sua conta Mercado Pago. A NextLevel não guarda esse dinheiro.</p>
      <DataTable rows={f.rows} rowKey={(r) => r.order.id} rowHref={(r) => `/supplier/orders/${r.order.id}`} columns={[
        { key: "n", header: "Pedido", primary: true, cell: (r) => <div><div className="font-medium">#{r.order.number}</div><div className="text-xs text-muted-foreground">{r.storeName}</div></div> },
        { key: "status", header: "Status", cell: (r) => <OrderStatusBadge status={r.order.status} /> },
        { key: "central", header: "Central", cell: (r) => <StatusBadge value={r.order.centralPaymentStatus} /> },
        { key: "cost", header: "Custo (Central)", className: "text-right", cell: (r) => <span className="font-medium tabular-nums">{formatBRL(r.order.costTotalCents)}</span> },
        { key: "date", header: "Data", className: "text-right text-muted-foreground", cell: (r) => formatDate(r.order.createdAt) },
      ]} />
    </>
  );
}
