"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarCheck, CheckCircle2, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { closeMonthAction, issueSubscriptionsAction, markInvoicePaidAction, refreshAccessAction } from "@/app/actions/finance";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export type InvoiceView = { id: string; kind: string; description: string; payer: string; period: string | null; amountCents: number; status: string; dueDate: string; paidAt: string | null; lines: { kind: string; description: string; amountCents: number }[] };

const KIND: Record<string, string> = { SUPPLIER_SETUP: "Setup do fornecedor", SUPPLIER_SUBSCRIPTION: "Mensalidade do fornecedor", SUPPLIER_CLOSING: "Fechamento mensal", STORE_SETUP: "Ativação de loja" };

export function Invoices({ invoices, period }: { invoices: InvoiceView[]; period: string }) {
  const router = useRouter();
  const [p, setP] = React.useState(period);
  const [pending, start] = React.useTransition();
  const [open, setOpen] = React.useState<string | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string; data?: unknown }>, ok: (d: unknown) => string) => start(async () => { const r = await fn(); if (r.ok) { toast.success(ok(r.data)); router.refresh(); } else toast.error(r.error ?? "Erro"); });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><div><CardTitle>Rotina mensal</CardTitle><CardDescription>Emita as mensalidades antecipadas no início do mês e feche a competência para cobrar a taxa de volume, já líquida das comissões de canal.</CardDescription></div></CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-1"><label htmlFor="period" className="text-xs font-medium text-muted-foreground">Competência</label><Input id="period" type="month" value={p} onChange={(e) => setP(e.target.value)} className="w-44" /></div>
          <Button variant="secondary" loading={pending} onClick={() => run(() => issueSubscriptionsAction(p), (d) => `${(d as { issued: number }).issued} mensalidade(s) emitida(s)`)}><FileText /> Emitir mensalidades</Button>
          <ConfirmDialog trigger={<Button loading={pending}><CalendarCheck /> Fechar competência</Button>} title={`Fechar ${p}`} description="Gera a fatura de taxa de volume de cada fornecedor e abate as comissões elegíveis. Só pode ser feito uma vez por fornecedor e competência." confirmLabel="Fechar competência" onConfirm={async () => { const r = await closeMonthAction(p); if (r.ok) { toast.success(`${r.data.closed} fechamento(s) gerado(s)${r.data.skipped ? `, ${r.data.skipped} já existiam` : ""}`); router.refresh(); } else toast.error(r.error); }} />
          <Button variant="ghost" loading={pending} onClick={() => run(() => refreshAccessAction(), (d) => { const n = (d as { changed: unknown[] }).changed.length; return n ? `${n} fornecedor(es) com acesso alterado` : "Nenhuma mudança de acesso"; })}><RefreshCw /> Atualizar atrasos</Button>
        </CardContent>
      </Card>

      <DataTable
        rows={invoices}
        rowKey={(i) => i.id}
        columns={[
          { key: "desc", header: "Fatura", primary: true, cell: (i) => <div><button type="button" className="text-left font-medium hover:underline" onClick={() => setOpen(open === i.id ? null : i.id)}>{i.description}</button><div className="text-xs text-muted-foreground">{KIND[i.kind]} · {i.payer}</div>{open === i.id ? <ul className="mt-2 space-y-0.5 rounded-md bg-surface-muted p-2 text-xs">{i.lines.map((l, k) => <li key={k} className="flex justify-between gap-4"><span>{l.description}</span><span className="tabular-nums">{formatBRL(l.amountCents)}</span></li>)}</ul> : null}</div> },
          { key: "period", header: "Competência", cell: (i) => i.period ?? "—", mobile: false },
          { key: "amount", header: "Valor", className: "text-right", cell: (i) => <span className="font-medium tabular-nums">{formatBRL(i.amountCents)}</span> },
          { key: "due", header: "Vencimento", className: "text-right", cell: (i) => formatDate(i.dueDate) },
          { key: "status", header: "Status", cell: (i) => <StatusBadge value={i.status} dot /> },
          { key: "act", header: "", className: "text-right", cell: (i) => i.status === "OPEN" || i.status === "OVERDUE" ? <ConfirmDialog trigger={<Button size="sm" variant="secondary"><CheckCircle2 /> Confirmar recebimento</Button>} title="Confirmar recebimento" description={`${i.description}: ${formatBRL(i.amountCents)}. Para ativação de loja, a loja é liberada e a comissão do fornecedor entra em garantia.`} confirmLabel="Confirmar" onConfirm={async () => { const r = await markInvoicePaidAction(i.id); if (r.ok) { toast.success("Recebimento confirmado"); router.refresh(); } else toast.error(r.error); }} /> : <span className="text-xs text-muted-foreground">{i.paidAt ? `pago em ${formatDate(i.paidAt)}` : ""}</span> },
        ]}
      />
    </div>
  );
}
