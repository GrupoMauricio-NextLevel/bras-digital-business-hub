import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { getStorefront } from "@/lib/queries/storefront";
import { trackOrder } from "@/lib/domain/tracking";
import { OrderJourney } from "@/components/storefront/order-journey";
import { formatBRL } from "@/lib/money";

export const metadata: Metadata = { title: "Acompanhar pedido", robots: { index: false } };

/** Consulta pública: número do pedido e e-mail da compra. Sem login. */
export default async function TrackPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ pedido?: string; email?: string }> }) {
  const { slug } = await params; const sp = await searchParams;
  const sf = await getStorefront(slug); if (!sf) notFound();
  const searched = Boolean(sp.pedido && sp.email);
  const order = searched ? await trackOrder(await getDb(), sf.store.id, { number: sp.pedido!, email: sp.email! }) : null;
  const input = "h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-900";
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Acompanhar pedido</h1>
      <p className="mt-1 text-sm text-neutral-500">Informe o número do pedido e o e-mail usado na compra.</p>
      <form method="get" className="mt-6 grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]" aria-label="Buscar pedido">
        <label className="text-sm font-medium">Número do pedido<input name="pedido" required inputMode="numeric" defaultValue={sp.pedido ?? ""} placeholder="1001" className={`${input} mt-1`} /></label>
        <label className="text-sm font-medium">E-mail da compra<input name="email" type="email" required defaultValue={sp.email ?? ""} placeholder="voce@email.com" className={`${input} mt-1`} /></label>
        <button className="mt-6 h-11 rounded-lg px-6 text-sm font-medium" style={{ background: "var(--sf-primary)", color: "var(--sf-on-primary)" }}>Buscar</button>
      </form>
      {searched && !order ? <p role="alert" className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">Não encontramos um pedido com esses dados. Confira o número e o e-mail. {sf.store.whatsapp ? <a className="underline" href={`https://wa.me/${sf.store.whatsapp}?text=${encodeURIComponent("Olá! Preciso de ajuda para acompanhar o meu pedido.")}`} target="_blank" rel="noreferrer">Falar com a loja</a> : null}</p> : null}
      {order ? (
        <section className="mt-8" aria-label={`Pedido ${order.number}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">Pedido #{order.number}</h2><span className="text-sm text-neutral-500">{formatBRL(order.totalCents)}{order.city ? ` · entrega em ${order.city}/${order.state}` : ""}</span></div>
          <OrderJourney order={order} />
          <ul className="mt-6 divide-y divide-neutral-200 rounded-xl border border-neutral-200 text-sm">{order.items.map((i, n) => <li key={n} className="flex justify-between gap-3 px-4 py-2.5"><span>{i.quantity}× {i.name}</span><span className="text-neutral-500">{i.label}</span></li>)}</ul>
        </section>
      ) : null}
    </div>
  );
}
