import { AlertTriangle, ReceiptText, TrendingUp, Wallet } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { ActionQueue, type ActionQueueItem } from "@/components/app/action-queue";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { DataTable } from "@/components/app/data-table";
import { OrderStatusBadge, StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStoreAdmin } from "@/lib/require-session";
import { getMerchantFinance } from "@/lib/queries/merchant";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { isDemoMode } from "@/lib/auth";
import { getDb } from "@/db/client";
import { addonViewsFor, listInvoicesFor } from "@/lib/domain/nextlevel-billing";
import { getPriceBook, periodOf, storeOrderFeeFor } from "@/lib/domain/finance";
import { buildRationale } from "@/lib/finance/rationale";
import { isIndependentStore } from "@/lib/domain/order-policy";
import { InvoicePay } from "@/components/finance/invoice-pay";
import { AddonCards } from "@/components/finance/addon-cards";
import { RationaleList } from "@/components/finance/rationale-list";
import { isCommerceStore } from "@/lib/store-brand";
import { CommerceEvolution, FinanceAreas, Opportunities } from "@/components/nl-store/evolution";
import { finFlag } from "@/lib/finance/flags";
import { nomePlanoEc } from "@/lib/marcas/nextlevel-ecommerce";

export default async function MerchantFinancePage() {
  const session = await requireStoreAdmin();
  const f = await getMerchantFinance(session.store!.id);
  const db = await getDb();
  // Assinatura Commerce em teste/aguardando/atraso: a fatura do ciclo já fica disponível para pagar aqui (idempotente).
  const { subscriptionOf, ensureSubscriptionInvoice, STATUS_LABEL: NL_SUB_STATUS } = await import("@/lib/domain/commerce-plans");
  const nlSub = await subscriptionOf(db, session.store!.id);
  if (nlSub && ["trial", "pending_payment", "past_due", "suspended"].includes(nlSub.status)) await ensureSubscriptionInvoice(db, session.store!);
  const [addons, invoices, book] = await Promise.all([addonViewsFor(db, session.actor), listInvoicesFor(db, session.actor), getPriceBook(db)]);
  const feeNow = await storeOrderFeeFor(db, session.store!.id, periodOf(new Date()), book);
  const independent = await isIndependentStore(db, session.store!.id);
  const commerce = await isCommerceStore(db, session.store!);
  const demo = isDemoMode();
  const openInvoices = invoices.filter((i) => (i.status === "OPEN" || i.status === "OVERDUE") && i.amountCents > 0);
  const overdueInvoices = openInvoices.filter((i) => i.status === "OVERDUE");
  const openInvoiceCents = openInvoices.reduce((sum, i) => sum + i.amountCents, 0);
  const overdueCents = overdueInvoices.reduce((sum, i) => sum + i.amountCents, 0);
  const queue = ([
    overdueInvoices.length > 0 ? { id: "overdue", title: "Faturas vencidas com a NextLevel", description: formatBRL(overdueCents) + " precisam ser regularizados.", count: overdueInvoices.length, tone: "danger", icon: AlertTriangle, href: "#faturas", actionLabel: "Regularizar" } : null,
    f.owedToCentral > 0 && !independent ? { id: "central", title: "Pedidos pagos aguardam saldo", description: formatBRL(f.owedToCentral) + " em custo ainda não foi liberado para a Central.", tone: "warning", icon: Wallet, href: "/merchant/wallet", actionLabel: "Ver saldo" } : null,
  ] as (ActionQueueItem | null)[]).filter((item): item is ActionQueueItem => Boolean(item));
  return (
    <>
      <PageHeader title={commerce ? "Financeiro da loja" : "Financeiro"} description={commerce ? "Acompanhe o dinheiro que entra pelas vendas, o custo dos produtos e a margem da sua operação." : independent ? "Você recebe do cliente e desconta o custo dos produtos. A diferença é sua margem." : "Você recebe do cliente e o custo dos produtos é debitado do seu saldo. A diferença é sua margem."} actions={<a href="/api/finance/export?tipo=vendas" className="ds-btn ds-btn--secondary">Exportar extrato (CSV)</a>} />
      {finFlag("FIN_CATALOG_MASTER") ? <FinanceAreas /> : null}
      <h2 id="operacao" className="mb-3 scroll-mt-24 text-lg font-semibold">Minha operação</h2>
      <OperationalPulse className="mb-5" items={[
        { label: "Recebido de clientes", value: formatBRL(f.received), icon: TrendingUp, tone: "success", hint: "vendas confirmadas" },
        { label: "Margem acumulada", value: formatBRL(f.margin), icon: Wallet, tone: "info", hint: "vendas − custo" },
        { label: commerce ? "Custos dos produtos" : independent ? "Taxa do mês" : "Aguardando saldo", value: commerce ? formatBRL(f.paidToCentral) : independent ? formatBRL(feeNow.feeCents) : formatBRL(f.owedToCentral), icon: ReceiptText, tone: !independent && f.owedToCentral ? "warning" : "neutral", hint: commerce ? "nas vendas processadas" : independent ? "fechamento NextLevel" : "pedidos pagos sem liberação" },
        { label: commerce ? "A receber" : "Faturas em aberto", value: commerce ? formatBRL(f.rows.filter((o) => o.customerPaymentStatus !== "PAID").reduce((s,o)=>s+o.totalCents,0)) : formatBRL(openInvoiceCents), icon: AlertTriangle, tone: commerce ? "neutral" : overdueInvoices.length ? "danger" : openInvoices.length ? "warning" : "success", hint: commerce ? "pedidos ainda não pagos" : openInvoices.length ? openInvoices.length + " pendência(s)" : "nenhuma pendência" },
      ]} />
      {commerce ? null : <ActionQueue className="mb-6" items={queue} title="Atenção financeira" description="Pendências que podem afetar sua operação." emptyMessage="Nenhuma pendência financeira crítica agora." />}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle title={commerce ? "Caixa da loja: movimentação das vendas" : "Pedidos"} description={commerce ? "Dinheiro que entra pelos pedidos dos seus clientes." : undefined} />
          <DataTable rows={f.rows} rowKey={(o) => o.id} rowHref={(o) => `/merchant/orders/${o.id}`} columns={[
            { key: "n", header: "Pedido", primary: true, cell: (o) => <div><div className="font-medium">#{o.number}</div><div className="text-xs text-muted-foreground">{o.customerName}</div></div> },
            { key: "status", header: "Status", cell: (o) => <OrderStatusBadge status={o.status} /> },
            { key: "cust", header: "Cliente", cell: (o) => <StatusBadge value={o.customerPaymentStatus} />, mobile: false },
            ...(independent ? [] : [{ key: "central", header: "Saldo", cell: (o: (typeof f.rows)[number]) => <StatusBadge value={o.centralPaymentStatus} /> }]),
            { key: "total", header: "Venda", className: "text-right", cell: (o) => <span className="tabular-nums">{formatBRL(o.totalCents)}</span> },
            { key: "cost", header: "Custo", className: "text-right", cell: (o) => <span className="tabular-nums text-muted-foreground">{formatBRL(o.costTotalCents)}</span> },
            { key: "margin", header: "Margem", className: "text-right", cell: (o) => <span className="font-medium tabular-nums text-success">{formatBRL(o.subtotalCents - o.costTotalCents)}</span> },
          ]} />
        </div>
        <div id="assinatura" className="scroll-mt-24 space-y-4">
          <SectionTitle title="Assinatura NextLevel" description="O que você paga à plataforma, separado do dinheiro das suas vendas." />
          {commerce && nlSub ? (
            <Card>
              <CardHeader><CardTitle>Mensalidade</CardTitle><span className="text-sm font-medium">{NL_SUB_STATUS[nlSub.status]}</span></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><div className="text-xs text-muted-foreground">Plano atual</div><div className="text-lg font-semibold">{nomePlanoEc(nlSub.productKey)} · {formatBRL(nlSub.amountCents)}/{nlSub.cycle === "ANNUAL" ? "ano" : "mês"}</div></div>
                {nlSub.currentPeriodEnd || nlSub.trialEndsAt ? <div><div className="text-xs text-muted-foreground">{nlSub.status === "trial" ? "Teste até" : "Próximo vencimento"}</div><div className="font-medium">{formatDate((nlSub.status === "trial" ? nlSub.trialEndsAt : nlSub.currentPeriodEnd) ?? nlSub.currentPeriodEnd!)}</div></div> : null}
                <a href="#evolucao" className="inline-block font-medium text-[var(--brand-primary)] underline-offset-2 hover:underline">Ver plano e trocar</a>
              </CardContent>
            </Card>
          ) : !commerce && f.subscription ? (
            <Card>
              <CardHeader><CardTitle>Mensalidade</CardTitle><StatusBadge value={f.subscription.sub.status} dot /></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><div className="text-xs text-muted-foreground">Plano atual</div><div className="text-lg font-semibold">{f.subscription.plan.name} · {formatBRL(f.subscription.plan.priceCents)}/mês</div></div>
                <div><div className="text-xs text-muted-foreground">Próximo vencimento</div><div className="font-medium">{formatDate(f.subscription.sub.currentPeriodEnd)}</div></div>
                <ul className="divide-y divide-border border-t border-border pt-2">
                  {f.subscription.invoices.map((inv) => <li key={inv.id} className="flex items-center justify-between py-2"><span className="text-muted-foreground">Venc. {formatDate(inv.dueDate)}</span><span className="flex items-center gap-2 tabular-nums">{formatBRL(inv.amountCents)} <StatusBadge value={inv.status} /></span></li>)}
                </ul>
                <p className="text-xs text-muted-foreground">Regra: 15 dias de atraso suspende a loja; 30 dias encerra.</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
      <div className="mt-8 space-y-6">
        <h2 id="evolucao" className="scroll-mt-24 text-lg font-semibold">Minha evolução com a NextLevel</h2>
        {finFlag("FIN_CATALOG_MASTER") ? <CommerceEvolution session={session} /> : null}
        {openInvoices.length ? (
          <section id="faturas">
            <h2 className="mb-3 text-base font-semibold">Faturas em aberto com a NextLevel</h2>
            <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
              {openInvoices.map((i) => <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"><span><span className="font-medium">{i.description}</span> <span className="text-muted-foreground">· vence {formatDate(i.dueDate)}</span></span><span className="flex items-center gap-3"><span className="tabular-nums">{formatBRL(i.amountCents)}</span><InvoicePay invoiceId={i.id} demo={demo} /></span></li>)}
            </ul>
          </section>
        ) : null}
        <section><h2 className="mb-3 text-base font-semibold">Add-ons</h2><AddonCards addons={addons} demo={demo} /></section>
        {finFlag("FIN_CATALOG_MASTER") ? <section aria-labelledby="oportunidades"><h2 id="oportunidades" className="mb-3 scroll-mt-24 text-lg font-semibold">Oportunidades</h2><Opportunities session={session} /></section> : null}
        <section><h2 className="mb-3 text-base font-semibold">Por que cobramos</h2><RationaleList items={buildRationale(book).filter((r) => r.audience !== "SUPPLIER" && (r.key.startsWith("addon:") || (!commerce && r.key === `offer:${session.store!.offer}`)))} /></section>
      </div>
    </>
  );
}
