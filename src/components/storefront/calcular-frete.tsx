"use client";
import * as React from "react";
import { Truck } from "lucide-react";
import { quoteShippingAction } from "@/app/actions/storefront";
import type { ShippingQuote } from "@/lib/shipping/quote";
import { formatBRL } from "@/lib/money";

/** Calcular frete na página do produto (D213): a mesma cotação do fechamento, feita no servidor pelo CEP. */
export function CalcularFrete({ slug, item, freeFromCents }: { slug: string; item: { productId: string; variantId?: string; packId?: string; quantity: number } | null; freeFromCents?: number | null }) {
  const [cep, setCep] = React.useState("");
  const [res, setRes] = React.useState<{ options: ShippingQuote[]; error?: string } | null>(null);
  const [pending, start] = React.useTransition();
  const digits = cep.replace(/\D/g, "").slice(0, 8);
  const calcular = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || digits.length !== 8) return setRes({ options: [], error: "Digite os 8 números do CEP." });
    start(async () => {
      const r = await quoteShippingAction(slug, { zip: digits, items: [item] });
      setRes(r.ok ? { options: r.data.options } : { options: [], error: r.error ?? "Não foi possível calcular agora." });
    });
  };
  return (
    <div className="mt-6 rounded-xl border border-neutral-200 p-4">
      <form onSubmit={calcular} className="flex flex-wrap items-center gap-2">
        <label htmlFor="sf-cep" className="flex items-center gap-2 text-sm font-medium"><Truck className="size-4" aria-hidden />Calcular frete</label>
        <input id="sf-cep" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits} onChange={(e) => setCep(e.target.value)}
          className="h-10 w-32 rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-900" />
        <button type="submit" disabled={pending} className="h-10 rounded-lg border border-neutral-300 px-4 text-sm font-medium hover:border-neutral-900 disabled:opacity-50">{pending ? "Calculando…" : "Calcular"}</button>
      </form>
      {freeFromCents ? <p className="mt-2 text-xs text-neutral-500">Frete grátis em compras a partir de {formatBRL(freeFromCents)}.</p> : null}
      {res?.error ? <p role="alert" className="mt-2 text-xs text-red-700">{res.error}</p> : null}
      {res?.options.length ? (
        <ul className="mt-3 divide-y divide-neutral-200 text-sm" aria-live="polite">
          {res.options.map((o) => <li key={o.serviceId} className="flex items-center justify-between gap-3 py-2"><span>{o.name}{o.days !== null ? <span className="text-neutral-500"> · até {o.days} dia(s) úteis</span> : null}</span><b className="tabular-nums">{o.priceCents === 0 ? "Grátis" : formatBRL(o.priceCents)}</b></li>)}
        </ul>
      ) : null}
    </div>
  );
}
