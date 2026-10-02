"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, CreditCard, QrCode } from "lucide-react";
import { useCart } from "@/components/storefront/cart-context";
import { SfButton } from "@/components/storefront/sf-button";
import { formatBRL } from "@/lib/money";
import { shippingFor } from "@/lib/storefront-rules";
import { placeStorefrontOrderAction } from "@/app/actions/storefront";
import { cn } from "@/lib/utils";

const input = "h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-900";

export function CheckoutForm({ slug, storeName }: { slug: string; storeName: string }) {
  const cart = useCart();
  const router = useRouter();
  const [f, setF] = React.useState({ name: "", email: "", phone: "", zip: "", address: "", city: "", state: "SP", marketingOptIn: false });
  const [payment, setPayment] = React.useState<"pix" | "card">("pix");
  const [pending, start] = React.useTransition();
  const shipping = shippingFor(cart.subtotal);
  const base = `/store/${slug}`;

  if (cart.ready && cart.lines.length === 0) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center text-sm text-neutral-500">Seu carrinho está vazio. <Link href={`${base}/catalog`} className="underline">Voltar ao catálogo</Link></div>;
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await placeStorefrontOrderAction(slug, {
        customer: { name: f.name, email: f.email, phone: f.phone || undefined, marketingOptIn: f.marketingOptIn },
        shipping: { address: f.address, city: f.city, state: f.state, zip: f.zip, costCents: shipping },
        items: cart.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, packId: l.packId, quantity: l.quantity })),
        saleType: cart.lines.some((l) => l.packId) ? "WHOLESALE" : "RETAIL",
        notes: payment === "pix" ? "Preferência de pagamento: Pix" : "Preferência de pagamento: Cartão",
      });
      if (!r.ok) { toast.error(r.error); return; }
      cart.clear();
      if (r.data.checkoutUrl) window.location.assign(r.data.checkoutUrl);
      else router.push(`${base}/order/${r.data.orderId}`);
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Finalizar compra</h1>
      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="mb-3 text-base font-semibold">1. Seus dados</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={input} placeholder="Nome completo" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <input className={input} type="email" placeholder="E-mail" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
              <input className={input} placeholder="WhatsApp" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-base font-semibold">2. Entrega</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <input className={input} placeholder="CEP" required value={f.zip} onChange={(e) => setF({ ...f, zip: e.target.value })} />
              <input className={cn(input, "sm:col-span-2")} placeholder="Endereço e número" required value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
              <input className={cn(input, "sm:col-span-2")} placeholder="Cidade" required value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
              <select className={input} value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })}>{["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((s) => <option key={s}>{s}</option>)}</select>
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-base font-semibold">3. Pagamento</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {([["pix", "Pix", "Disponível no Mercado Pago quando habilitado", QrCode], ["card", "Cartão de crédito", "Parcelamento conforme sua conta Mercado Pago", CreditCard]] as const).map(([k, t, d, Icon]) => (
                <button type="button" key={k} onClick={() => setPayment(k)} className={cn("flex items-center gap-3 rounded-lg border p-4 text-left", payment === k ? "border-neutral-900 ring-1 ring-neutral-900" : "border-neutral-300")}><Icon className="size-5 text-neutral-500" /><div><div className="text-sm font-medium">{t}</div><div className="text-xs text-neutral-500">{d}</div></div></button>
              ))}
            </div>
            <label className="mt-4 flex items-start gap-2 text-xs text-neutral-600"><input type="checkbox" className="mt-0.5" checked={f.marketingOptIn} onChange={(e) => setF({ ...f, marketingOptIn: e.target.checked })} /> Aceito receber novidades e promoções da {storeName} por WhatsApp. Você pode revogar quando quiser.</label>
          </section>
        </div>
        <aside className="h-fit rounded-2xl border border-neutral-200 p-5 lg:sticky lg:top-24">
          <h2 className="text-base font-semibold">Resumo do pedido</h2>
          <ul className="mt-3 space-y-2 text-sm">{cart.lines.map((l) => <li key={l.key} className="flex justify-between gap-3"><span className="text-neutral-600">{l.quantity}× {l.name} <span className="text-neutral-400">({l.label.split(" (")[0]})</span></span><span className="tabular-nums">{formatBRL(l.unitPriceCents * l.quantity)}</span></li>)}</ul>
          <dl className="mt-4 space-y-2 border-t border-neutral-200 pt-3 text-sm">
            <div className="flex justify-between text-neutral-600"><dt>Subtotal</dt><dd className="tabular-nums">{formatBRL(cart.subtotal)}</dd></div>
            <div className="flex justify-between text-neutral-600"><dt>Frete</dt><dd className="tabular-nums">{shipping === 0 ? "Grátis" : formatBRL(shipping)}</dd></div>
            <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatBRL(cart.subtotal + shipping)}</dd></div>
          </dl>
          <SfButton type="submit" className="mt-5 h-12 w-full" disabled={pending || !cart.ready}><Lock className="size-4" /> {pending ? "Processando…" : "Ir para o pagamento"}</SfButton>
          <p className="mt-3 text-center text-[11px] text-neutral-500">Quando o Mercado Pago estiver conectado, você será levado ao ambiente seguro dele para escolher a forma de pagamento disponível.</p>
        </aside>
      </form>
    </div>
  );
}
