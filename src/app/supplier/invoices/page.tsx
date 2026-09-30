import { and, desc, eq } from "drizzle-orm";
import { CalendarClock, CheckCircle2, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OverdueDemoButtons } from "./demo-button";
import { InvoicePay } from "@/components/finance/invoice-pay";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { financeInvoices } from "@/db/schema";
import { getPriceBook, supplierBilling } from "@/lib/domain/finance";
import { ACCESS_LABEL } from "@/lib/finance/engine";
import { isDemoMode } from "@/lib/auth";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";

const KIND: Record<string, string> = { SUPPLIER_SETUP: "Setup", SUPPLIER_SUBSCRIPTION: "Mensalidade", SUPPLIER_CLOSING: "Fechamento mensal (taxas)", ADDON: "Add-on", SERVICE: "Serviço" };

/** Módulo de faturas: tudo o que há para pagar à NextLevel, com Pix em um toque e a régua de bloqueio explicada. */
export default async function SupplierInvoicesPage() {
  const session = await requireRole("SUPPLIER_ADMIN");
  const db = await getDb();
  const supplierId = session.supplier!.id;
  const [b, book, all] = await Promise.all([
    supplierBilling(db, supplierId), getPriceBook(db),
    db.select().from(financeInvoices).where(and(eq(financeInvoices.supplierId, supplierId), eq(financeInvoices.payerType, "SUPPLIER"))).orderBy(desc(financeInvoices.dueDate)),
  ]);
  const demo = isDemoMode();
  const d = book.dunning;
  const stages = [
    { days: d.warningDays, title: "Aviso", text: "Avisamos no painel e você segue trabalhando normalmente." },
    { days: d.partialBlockDays, title: "Bloqueio parcial", text: "Sem novos pedidos e novas lojas. Pedidos já pagos continuam sendo enviados." },
    { days: d.suspendedDays, title: "Acesso pausado", text: "O painel mostra só a tela de pagamento com QR code. Pagou, libera na hora." },
    { days: d.closedDays, title: "Encerramento", text: "Conta encerrada. Fale com a NextLevel para reativar." },
  ];
  return (
    <>
      <PageHeader title="Faturas" description="Mensalidade, taxas e serviços da NextLevel. Pague por Pix e o acesso é regularizado na hora, sem burocracia." />
      {demo ? <OverdueDemoButtons /> : null}
      <MetricGrid className="mb-6">
        <MetricCard label="Em aberto" value={formatBRL(b.openCents)} icon={CalendarClock} tone={b.openCents ? "warning" : "success"} hint={`${b.open.length} ${b.open.length === 1 ? "fatura" : "faturas"}`} />
        <MetricCard label="Vencidas" value={formatBRL(b.overdueCents)} icon={ShieldAlert} tone={b.overdueCount ? "danger" : "success"} hint={b.overdueCount ? `A mais antiga há ${b.worstOverdueDays} dias` : "Nada vencido"} />
        <MetricCard label="Situação do acesso" value={ACCESS_LABEL[b.state]} icon={CheckCircle2} tone={b.state === "ACTIVE" ? "success" : "warning"} hint={b.next ? `Próxima etapa em ${b.next.inDays} dia(s) se nada for pago` : "Tudo em dia"} />
      </MetricGrid>

      {b.open.length ? (
        <Card className="mb-6">
          <CardHeader><div><CardTitle>Para pagar agora</CardTitle><CardDescription>Cada pagamento por Pix é confirmado sozinho.</CardDescription></div></CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {b.open.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0"><div className="font-medium">{i.description}</div><div className="text-xs text-muted-foreground">{KIND[i.kind] ?? i.kind} · vence em {formatDate(i.dueDate)}{i.overdueDays > 0 ? <span className="ml-1 font-medium text-danger">· {i.overdueDays} dia(s) de atraso</span> : null}</div></div>
                  <div className="flex items-center gap-3"><b className="tabular-nums">{formatBRL(i.amountCents)}</b><InvoicePay invoiceId={i.id} label="Pagar por Pix" demo={demo} /></div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : <p className="mb-6 flex items-center gap-2 rounded-lg border border-success/30 bg-success-soft/40 p-4 text-sm"><CheckCircle2 className="size-4 text-success" aria-hidden /> Nenhuma fatura em aberto.</p>}

      <Card className="mb-6">
        <CardHeader><div><CardTitle>Prazos e o que acontece se atrasar</CardTitle><CardDescription>Contamos a partir do vencimento. Você tem tempo para se organizar, e o pagamento libera o acesso automaticamente.</CardDescription></div></CardHeader>
        <CardContent><ol className="grid gap-3 md:grid-cols-4">{stages.map((s) => <li key={s.title} className="rounded-lg border border-border p-3 text-sm"><div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Após {s.days} dia(s)</div><div className="mt-1 font-semibold">{s.title}</div><p className="mt-1 text-muted-foreground">{s.text}</p></li>)}</ol></CardContent>
      </Card>

      <h2 className="mb-3 text-base font-semibold">Histórico</h2>
      <DataTable rows={all} rowKey={(i) => i.id} columns={[
        { key: "d", header: "Fatura", primary: true, cell: (i) => <div><div className="font-medium">{i.description}</div><div className="text-xs text-muted-foreground">{KIND[i.kind] ?? i.kind}</div></div> },
        { key: "a", header: "Valor", className: "text-right", cell: (i) => <span className="font-medium tabular-nums">{formatBRL(i.amountCents)}</span> },
        { key: "due", header: "Vencimento", className: "text-right", cell: (i) => formatDate(i.dueDate) },
        { key: "paid", header: "Pago em", className: "text-right", cell: (i) => (i.paidAt ? formatDate(i.paidAt) : "—"), mobile: false },
        { key: "s", header: "Status", cell: (i) => <StatusBadge value={i.status} dot /> },
      ]} />
    </>
  );
}
