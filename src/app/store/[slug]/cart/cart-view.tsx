"use client";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/components/storefront/cart-context";
import { ProductArt } from "@/components/app/product-art";
import { formatBRL } from "@/lib/money";
import { SHIPPING_FLAT_CENTS, FREE_SHIPPING_FROM_CENTS } from "@/lib/storefront-rules";

export function CartView({ slug }: { slug: string }) {
  const cart = useCart();
  const base = `/store/${slug}`;
  const shipping = cart.subtotal >= FREE_SHIPPING_FROM_CENTS ? 0 : SHIPPING_FLAT_CENTS;
  if (!cart.ready) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-neutral-500">Carregando carrinho…</div>;
  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <ShoppingBag className="mx-auto size-10 text-neutral-300" />
        <h1 className="mt-4 text-xl font-semibold">Seu carrinho está vazio</h1>
        <p className="mt-1 text-sm text-neutral-500">Explore o catálogo e encontre seu manto.</p>
        <Link href={`${base}/catalog`} className="mt-6 inline-flex h-11 items-center rounded-lg px-6 text-sm font-medium" style={{ background: "var(--sf-primary)", color: "var(--sf-on-primary)" }}>Ver catálogo</Link>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Carrinho <span className="text-base font-normal text-neutral-500">({cart.count} {cart.count === 1 ? "item" : "itens"})</span></h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <ul className="divide-y divide-neutral-200 lg:col-span-2">
          {cart.lines.map((l) => (
            <li key={l.key} className="flex gap-4 py-4">
              <ProductArt images={l.images} size="sm" className="size-20 shrink-0 rounded-lg bg-neutral-100" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3"><div><div className="text-sm font-medium">{l.name}</div><div className="text-xs text-neutral-500">{l.label}</div></div><div className="text-sm font-semibold tabular-nums">{formatBRL(l.unitPriceCents * l.quantity)}</div></div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-9 items-center rounded-lg border border-neutral-300"><button className="px-2.5" onClick={() => cart.update(l.key, l.quantity - 1)} aria-label="Menos"><Minus className="size-3.5" /></button><span className="w-7 text-center text-sm tabular-nums">{l.quantity}</span><button className="px-2.5 disabled:opacity-40" disabled={l.quantity >= l.max} onClick={() => cart.update(l.key, l.quantity + 1)} aria-label="Mais"><Plus className="size-3.5" /></button></div>
                  <span className="text-xs text-neutral-500">{formatBRL(l.unitPriceCents)} cada</span>
                  <button className="ml-auto inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-red-600" onClick={() => cart.remove(l.key)}><Trash2 className="size-3.5" /> Remover</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="h-fit rounded-2xl border border-neutral-200 p-5 lg:sticky lg:top-24">
          <h2 className="text-base font-semibold">Resumo</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-neutral-600"><dt>Subtotal</dt><dd className="tabular-nums">{formatBRL(cart.subtotal)}</dd></div>
            <div className="flex justify-between text-neutral-600"><dt>Frete</dt><dd className="tabular-nums">{shipping === 0 ? <span className="font-medium text-green-700">Grátis</span> : formatBRL(shipping)}</dd></div>
            <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatBRL(cart.subtotal + shipping)}</dd></div>
          </dl>
          {shipping > 0 ? <p className="mt-2 text-xs text-neutral-500">Faltam {formatBRL(FREE_SHIPPING_FROM_CENTS - cart.subtotal)} para frete grátis.</p> : null}
          <Link href={`${base}/checkout`} className="mt-5 flex h-12 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all hover:brightness-95" style={{ background: "var(--sf-primary)", color: "var(--sf-on-primary)" }}>Finalizar compra <ArrowRight className="size-4" /></Link>
          <Link href={`${base}/catalog`} className="mt-3 block text-center text-sm text-neutral-500 hover:text-neutral-900">Continuar comprando</Link>
        </aside>
      </div>
    </div>
  );
}
