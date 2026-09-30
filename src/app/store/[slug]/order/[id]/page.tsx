import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { getDb } from "@/db/client";
import { orderItems, orders } from "@/db/schema";
import { getStorefront } from "@/lib/queries/storefront";
import { formatBRL } from "@/lib/money";
import { PaidBanner, PaymentWatcher } from "./payment-status";

export default async function OrderConfirmationPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const sf = await getStorefront(slug);
  if (!sf) notFound();
  const db = (await getDb());
  // Isolamento: o pedido precisa pertencer a esta loja.
  const order = await db.query.orders.findFirst({ where: and(eq(orders.id, id), eq(orders.storeId, sf.store.id)) });
  if (!order) notFound();
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const paid = order.customerPaymentStatus === "PAID";
  const base = `/store/${slug}`;
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-12" style={{ color: "var(--sf-accent)" }} />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{order.status === "CANCELED" ? "Pedido cancelado" : paid ? "Pedido confirmado!" : "Pedido recebido"}</h1>
        <p className="mt-1 text-sm text-neutral-500">{order.status === "CANCELED" ? "O pagamento não foi concluído a tempo e o estoque foi liberado. Você pode fazer um novo pedido." : `Obrigado, ${order.customerName.split(" ")[0]}. Enviaremos os detalhes para ${order.customerEmail}.`}</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-1.5 text-sm">Pedido <b>#{order.number}</b></div>
      </div>
      {order.status !== "CANCELED" && !paid && order.paymentProvider === "MERCADO_PAGO" ? <PaymentWatcher slug={slug} orderId={order.id} checkoutUrl={order.paymentCheckoutUrl} expiresAt={order.reservationExpiresAt} /> : null}
      {order.status !== "CANCELED" && !paid && order.paymentProvider === "MANUAL" ? <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700">A loja entrará em contato para combinar o pagamento. Seus itens estão reservados.</div> : null}
      {paid ? <PaidBanner /> : null}
      <div className="mt-8 rounded-2xl border border-neutral-200 p-5">
        <ul className="divide-y divide-neutral-200 text-sm">{items.map((it) => <li key={it.id} className="flex justify-between gap-3 py-2.5"><span>{it.quantity}× {it.productName} <span className="text-neutral-400">({it.label.split(" (")[0]})</span></span><span className="tabular-nums">{formatBRL(it.lineTotalCents)}</span></li>)}</ul>
        <dl className="mt-3 space-y-1.5 border-t border-neutral-200 pt-3 text-sm">
          <div className="flex justify-between text-neutral-600"><dt>Frete</dt><dd className="tabular-nums">{order.shippingCents === 0 ? "Grátis" : formatBRL(order.shippingCents)}</dd></div>
          <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatBRL(order.totalCents)}</dd></div>
        </dl>
        {order.shippingAddress ? <div className="mt-4 border-t border-neutral-200 pt-3 text-sm text-neutral-600"><div className="text-xs font-medium uppercase tracking-wide text-neutral-400">Entrega</div>{order.shippingAddress} · {order.shippingCity}/{order.shippingState} · {order.shippingZip}</div> : null}
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href={`${base}/catalog`} className="flex h-11 flex-1 items-center justify-center rounded-lg text-sm font-medium" style={{ background: "var(--sf-primary)", color: "var(--sf-on-primary)" }}>Continuar comprando</Link>
        {sf.store.whatsapp ? <a href={`https://wa.me/${sf.store.whatsapp}?text=${encodeURIComponent(`Olá! Fiz o pedido #${order.number}`)}`} target="_blank" rel="noreferrer" className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-300 text-sm font-medium"><MessageCircle className="size-4" /> Acompanhar no WhatsApp</a> : null}
      </div>
    </div>
  );
}
