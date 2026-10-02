import type { Order, OrderItem } from "@/db/schema";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { PrintButton } from "./print-button";

/**
 * Folha de pedido para separação e conferência. É uma lista de conteúdo para uso interno,
 * NÃO é nota fiscal nem recibo fiscal. Notas internas e custos não aparecem aqui.
 */
export function OrderPrintSheet({ order, items, storeName, backHref }: { order: Order; items: OrderItem[]; storeName?: string | null; backHref: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="nl-no-print mb-4 flex items-center justify-between gap-3">
        <a href={backHref} className="text-sm text-muted-foreground underline-offset-2 hover:underline">← Voltar ao pedido</a>
        <PrintButton />
      </div>
      <div className="nl-print rounded-lg border border-border bg-white p-6 text-black print:border-0 print:p-0">
        <header className="flex items-start justify-between gap-4 border-b border-black/20 pb-3">
          <div>
            <h1 className="text-xl font-bold">Pedido #{order.number}</h1>
            <p className="text-sm">{storeName} · {formatDateTime(order.createdAt)}</p>
          </div>
          <p className="text-right text-xs">Lista de separação e<br />declaração de conteúdo<br /><strong>Não é documento fiscal</strong></p>
        </header>
        <section className="mt-4 text-sm">
          <h2 className="font-semibold">Destinatário</h2>
          <p>{order.customerName}{order.customerPhone ? ` · ${order.customerPhone}` : ""}</p>
          {order.shippingAddress ? <p>{order.shippingAddress} — {order.shippingCity}/{order.shippingState} · CEP {order.shippingZip}</p> : <p>Retirada / sem endereço de entrega.</p>}
        </section>
        <table className="mt-4 w-full border-collapse text-sm">
          <thead><tr className="border-b border-black/40 text-left"><th className="py-1 pr-2">✓</th><th className="py-1 pr-2">Produto</th><th className="py-1 pr-2">Tam./Item</th><th className="py-1 pr-2 text-right">Qtd</th><th className="py-1 text-right">Valor</th></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-black/10">
                <td className="py-1 pr-2">☐</td><td className="py-1 pr-2">{it.productName}</td><td className="py-1 pr-2">{it.label}</td><td className="py-1 pr-2 text-right tabular-nums">{it.quantity}</td><td className="py-1 text-right tabular-nums">{formatBRL(it.lineTotalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-right text-sm">Subtotal {formatBRL(order.subtotalCents)} · Frete {formatBRL(order.shippingCents)} · <strong>Total {formatBRL(order.totalCents)}</strong></p>
        {order.shippingLabelCode ? <p className="mt-3 text-xs">Envio: {order.shippingLabelCode} ({order.shippingCarrier})</p> : null}
      </div>
    </div>
  );
}
