"use client";
import * as React from "react";
import Link from "next/link";
import { Eye, Printer } from "lucide-react";
import { Drawer } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge, StatusBadge } from "@/components/app/status-badge";
import { orderQuickViewAction } from "@/app/actions/orders";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";

type Data = NonNullable<Awaited<ReturnType<typeof orderQuickViewAction>>>;

/** Botão "Ver" que abre o pedido em uma gaveta lateral, sem sair da lista. */
export function OrderQuickView({ orderId, number, href }: { orderId: string; number: number; href: string }) {
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState<Data | null | undefined>(undefined);
  const show = async () => { setOpen(true); setData(undefined); setData(await orderQuickViewAction(orderId)); };
  return (
    <>
      <Button variant="ghost" size="sm" className="relative z-10" onClick={show} aria-label={`Ver pedido ${number} rapidamente`}><Eye aria-hidden /> Ver</Button>
      <Drawer open={open} onOpenChange={setOpen} title={`Pedido #${number}`} description={data ? `${data.order.customerName} · ${formatDateTime(data.order.createdAt)}` : undefined} className="max-w-lg">
        {data === undefined ? <div className="space-y-3"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-24 w-full" /><Skeleton className="h-32 w-full" /></div>
          : data === null ? <p className="text-sm text-muted-foreground">Não foi possível abrir este pedido.</p> : (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap items-center gap-2"><OrderStatusBadge status={data.order.status} /><StatusBadge value={data.order.channel} /><StatusBadge value={data.order.customerPaymentStatus} /></div>
            <section aria-label="Produtos">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Produtos</h3>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {data.items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0"><div className="truncate font-medium">{it.productName}</div><div className="text-xs text-muted-foreground">{it.label} · {it.quantity} × {formatBRL(it.unitPriceCents)}</div></div>
                    <div className="font-medium tabular-nums">{formatBRL(it.lineTotalCents)}</div>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 space-y-1">
                <div className="flex justify-between text-muted-foreground"><dt>Frete</dt><dd className="tabular-nums">{formatBRL(data.order.shippingCents)}</dd></div>
                <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatBRL(data.order.totalCents)}</dd></div>
              </dl>
            </section>
            <section aria-label="Histórico">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Histórico</h3>
              <ol className="relative space-y-3 border-l border-border pl-4">
                {data.events.map((e) => (
                  <li key={e.id} className="relative"><span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-surface bg-border-strong" aria-hidden /><p>{e.message}</p><p className="text-xs text-muted-foreground">{formatDateTime(e.createdAt)}</p></li>
                ))}
              </ol>
            </section>
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Link href={href} className={buttonVariants()}>Abrir pedido completo</Link>
              <Button variant="secondary" onClick={() => setOpen(false)}>Fechar</Button>
              <Button variant="ghost" onClick={() => window.print()}><Printer aria-hidden /> Imprimir</Button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
