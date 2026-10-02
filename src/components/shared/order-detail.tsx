import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge, StatusBadge } from "@/components/app/status-badge";
import { PageHeader } from "@/components/app/page-header";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import type { Order, OrderItem } from "@/db/schema";
import { OrderActions } from "./order-actions";
import { OrderNoteForm } from "./order-note-form";
import Link from "next/link";
import { Printer } from "lucide-react";
import type { Role } from "@/lib/domain/access";
import { CheckCircle2, Circle } from "lucide-react";
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

  return (
    <>
      <PageHeader backHref={backHref} title={`Pedido #${order.number}`} badge={<OrderStatusBadge status={order.status} />} description={<span>{store?.name} · {formatDateTime(order.createdAt)} · <StatusBadge value={order.channel} /> <StatusBadge value={order.saleType} /></span>} actions={<div className="flex flex-wrap items-center gap-2"><Link href={`${backHref}/${order.id}/print`} className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-surface-muted"><Printer className="size-4" aria-hidden /> Imprimir</Link><OrderActions role={role} order={order} labels={labels} canFulfil={canFulfil} independent={independent} /></div>} />

      {order.status !== "CANCELED" ? (
        <div className="mb-6 rounded-lg border border-border bg-surface p-4 shadow-sm">
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
