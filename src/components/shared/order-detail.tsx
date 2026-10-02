import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge, StatusBadge } from "@/components/app/status-badge";
import { PageHeader } from "@/components/app/page-header";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import type { Order, OrderItem } from "@/db/schema";
import { OrderActions } from "./order-actions";
import { OrderNoteForm } from "./order-note-form";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Circle, Package, Printer, Truck, Wallet } from "lucide-react";
import type { Role } from "@/lib/domain/access";
import { cn } from "@/lib/utils";

type Props = {
  role: Role;
  backHref: string;
  order: Order;
  items: OrderItem[];
  events: { id: string; type: string; message: string; actorRole: string | null; createdAt: string }[];
  store: { name: string; slug: string } | null | undefined;
  labels?: { id: string; filename: string; sizeBytes: number }[];
  /** Calculados no servidor (política de pedido): o botão só aparece; a regra real está no domínio. */
  canFulfil?: boolean;
  independent?: boolean;
};

export function OrderDetail({ role, backHref, order, items, events, store, labels, canFulfil, independent }: Props) {
  const steps: { label: string; done: boolean }[] = [
    { label: "Pagamento do cliente", done: order.customerPaymentStatus === "PAID" },
    ...(independent ? [] : [{ label: "Custo debitado do saldo", done: order.centralPaymentStatus === "PAID" }]),
    { label: "Etiqueta de envio", done: order.shippingLabelStatus === "READY" },
    { label: "Separação", done: ["PICKING", "READY_TO_SHIP", "SHIPPED", "DELIVERED"].includes(order.status) },
    { label: "Enviado", done: ["SHIPPED", "DELIVERED"].includes(order.status) },
    { label: "Entregue", done: order.status === "DELIVERED" },
  ];
  const showCost = role !== "STORE_OWNER" || true;
  const nextStep = (() => {
    if (order.status === "CANCELED") return { title: "Pedido cancelado", detail: "Nenhuma ação operacional é necessária.", owner: "Concluído", tone: "danger" as const, icon: AlertTriangle };
    if (order.status === "PENDING") return { title: "Aguardando pagamento do cliente", detail: "O estoque permanece reservado enquanto o pagamento é concluído.", owner: "Cliente", tone: "warning" as const, icon: Wallet };
    if (order.status === "AWAITING_CENTRAL_PAYMENT") return { title: "Aguardando saldo do lojista", detail: "O pedido só entra na operação da Central após o débito do custo.", owner: role === "STORE_OWNER" ? "Você" : "Lojista", tone: "warning" as const, icon: Wallet };
    if (order.status === "AWAITING_LABEL") return { title: "Aguardando etiqueta de envio", detail: "A etiqueta precisa estar pronta antes da separação.", owner: role === "STORE_OWNER" ? "Você" : "Lojista", tone: "warning" as const, icon: Printer };
    if (order.status === "READY_TO_PICK") return { title: "Pronto para separação", detail: "Pagamento e etiqueta estão confirmados. O pedido pode entrar na bancada.", owner: role === "STORE_OWNER" ? "Central" : "Expedição", tone: "info" as const, icon: Package };
    if (order.status === "PICKING") return { title: "Em separação", detail: "A expedição está preparando e conferindo os itens.", owner: "Expedição", tone: "info" as const, icon: Package };
    if (order.status === "READY_TO_SHIP") return { title: "Pronto para despachar", detail: "A separação terminou e o pedido pode sair da Central.", owner: "Expedição", tone: "success" as const, icon: Truck };
    if (order.status === "SHIPPED") return { title: "Pedido enviado", detail: "Acompanhe o transporte até a entrega ao cliente.", owner: "Transportadora", tone: "success" as const, icon: Truck };
    return { title: "Pedido entregue", detail: "Fluxo operacional concluído.", owner: "Concluído", tone: "success" as const, icon: CheckCircle2 };
  })();
  const NextIcon = nextStep.icon;

  return (
    <>
      <PageHeader backHref={backHref} title={`Pedido #${order.number}`} badge={<OrderStatusBadge status={order.status} />} description={<span>{store?.name} · {formatDateTime(order.createdAt)} · <StatusBadge value={order.channel} /> <StatusBadge value={order.saleType} /></span>} actions={<div className="flex flex-wrap items-center gap-2"><Link href={`${backHref}/${order.id}/print`} className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-surface-muted"><Printer className="size-4" aria-hidden /> Imprimir</Link><OrderActions role={role} order={order} labels={labels} canFulfil={canFulfil} independent={independent} /></div>} />

      <section className="mb-5 overflow-hidden rounded-lg border border-border bg-surface" aria-label="Próxima ação do pedido">
        <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex items-start gap-3 p-4 sm:p-5">
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-muted", nextStep.tone === "danger" ? "text-danger" : nextStep.tone === "warning" ? "text-warning" : nextStep.tone === "success" ? "text-success" : "text-info")}><NextIcon className="size-4" aria-hidden /></span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Situação atual</p>
              <h2 className="mt-0.5 text-base font-semibold">{nextStep.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{nextStep.detail}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-border bg-surface-muted/40 px-4 py-3 md:min-w-48 md:flex-col md:items-start md:justify-center md:border-l md:border-t-0">
            <span className="text-xs font-medium text-muted-foreground">Responsável agora</span>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold">{nextStep.owner}<ArrowRight className="size-3.5" aria-hidden /></span>
          </div>
        </div>
      </section>

      {order.status !== "CANCELED" ? (
        <div className="mb-6 rounded-lg border border-border bg-surface p-4">
          <ol className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-xs sm:flex-col sm:items-start">
                {s.done ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : <Circle className="size-4 shrink-0 text-border-strong" />}
                <span className={cn(s.done ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Itens</CardTitle></CardHeader>
            <CardContent className="px-0 pb-0">
              <ul className="divide-y divide-border">
                {items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium">{it.productName}</div>
                      <div className="text-xs text-muted-foreground">{it.label} · {it.quantity} × {formatBRL(it.unitPriceCents)}{showCost ? <> · custo {formatBRL(it.unitCostCents)}</> : null}</div>
                    </div>
                    <div className="font-medium tabular-nums">{formatBRL(it.lineTotalCents)}</div>
                  </li>
                ))}
              </ul>
              <dl className="space-y-1 border-t border-border px-5 py-4 text-sm">
                <div className="flex justify-between text-muted-foreground"><dt>Subtotal</dt><dd className="tabular-nums">{formatBRL(order.subtotalCents)}</dd></div>
                {order.discountCents > 0 ? <div className="flex justify-between text-success"><dt>Desconto{order.discountCode ? ` (${order.discountCode})` : ""}</dt><dd className="tabular-nums">− {formatBRL(order.discountCents)}</dd></div> : null}
                <div className="flex justify-between text-muted-foreground"><dt>Frete</dt><dd className="tabular-nums">{formatBRL(order.shippingCents)}</dd></div>
                <div className="flex justify-between font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatBRL(order.totalCents)}</dd></div>
                <div className="flex justify-between pt-2 text-xs text-muted-foreground"><dt>{independent ? "Custo dos produtos" : "Custo à Central"}</dt><dd className="tabular-nums">{formatBRL(order.costTotalCents)}</dd></div>
                {role === "STORE_OWNER" ? <div className="flex justify-between text-xs text-success"><dt>Sua margem estimada</dt><dd className="tabular-nums">{formatBRL(order.subtotalCents - order.costTotalCents)}</dd></div> : null}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
            <CardContent>
              <OrderNoteForm orderId={order.id} />
              <ol className="relative space-y-4 border-l border-border pl-4">
                {events.map((e) => (
                  <li key={e.id} className="relative text-sm">
                    <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-surface bg-border-strong" />
                    <p>{e.type === "NOTE_INTERNAL" ? <><span className="mr-1 rounded bg-warning-soft px-1.5 py-0.5 text-xs font-medium text-warning">Nota interna</span>{e.message}</> : e.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(e.createdAt)}{e.actorRole ? ` · ${e.actorRole === "SYSTEM" ? "sistema" : e.actorRole === "STORE_OWNER" ? "lojista" : e.actorRole === "SUPPLIER_ADMIN" ? "fornecedor" : "NextLevel"}` : ""}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Pagamentos e envio</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Cliente</span><StatusBadge value={order.customerPaymentStatus} /></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Saldo (custo)</span><StatusBadge value={order.centralPaymentStatus} /></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Etiqueta</span><StatusBadge value={order.shippingLabelStatus} /></div>
              {labels && labels.length ? (
                <ul className="space-y-1">
                  {labels.map((l) => <li key={l.id} className="flex items-center justify-between gap-2 rounded-md bg-surface-muted px-3 py-2 text-xs"><a className="min-w-0 truncate font-medium text-accent-foreground underline-offset-2 hover:underline" href={`/api/labels/${order.id}/${l.id}`} target="_blank" rel="noreferrer">{l.filename}</a><span className="shrink-0 text-muted-foreground">{Math.max(1, Math.round(l.sizeBytes / 1024))} KB</span></li>)}
                </ul>
              ) : null}
              {order.shippingLabelCode ? <div className="rounded-md bg-surface-muted px-3 py-2 text-xs"><div className="font-medium">{order.shippingLabelCode}</div><div className="text-muted-foreground">{order.shippingCarrier}</div></div> : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="font-medium">{order.customerName}</div>
              <div className="text-muted-foreground">{order.customerEmail}</div>
              {order.customerPhone ? <div className="text-muted-foreground">{order.customerPhone}</div> : null}
              {order.shippingAddress ? (
                <div className="mt-3 border-t border-border pt-3 text-muted-foreground">
                  <div>{order.shippingAddress}</div>
                  <div>{order.shippingCity}/{order.shippingState} · {order.shippingZip}</div>
                </div>
              ) : null}
              {order.notes ? <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{order.notes}</div> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
