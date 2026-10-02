"use client";
import * as React from "react";
import { toast } from "sonner";
import { subscribeStockAlertAction } from "@/app/actions/stock-alerts";

export function StockAlertForm({ slug, productId, soldOut }: { slug: string; productId: string; soldOut: { id: string; size: string }[] }) {
  const [pending, start] = React.useTransition();
  const [done, setDone] = React.useState(false);
  if (soldOut.length === 0) return null;
  if (done) return <p className="mt-4 rounded-lg bg-neutral-50 p-3 text-sm">Pronto! A loja vai te avisar quando esse tamanho voltar.</p>;
  return (
    <form className="mt-4 rounded-lg border border-neutral-200 p-3" aria-label="Avise-me quando chegar" onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      start(async () => {
        const r = await subscribeStockAlertAction(slug, { productId, variantId: String(fd.get("variant")), contact: String(fd.get("contact")) });
        if (r.ok) setDone(true); else toast.error(r.error);
      });
    }}>
      <div className="text-sm font-medium">Tamanho esgotado? Avise-me quando chegar</div>
      <div className="mt-2 flex flex-wrap gap-2">
        <select name="variant" aria-label="Tamanho" className="h-10 rounded-lg border border-neutral-300 px-2 text-sm">{soldOut.map((v) => <option key={v.id} value={v.id}>{v.size}</option>)}</select>
        <input name="contact" required aria-label="E-mail ou WhatsApp" placeholder="E-mail ou WhatsApp com DDD" className="h-10 min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 text-sm" />
        <button disabled={pending} className="h-10 rounded-lg border border-neutral-300 px-4 text-sm font-medium disabled:opacity-60">{pending ? "Enviando…" : "Avisar"}</button>
      </div>
      <p className="mt-1 text-[11px] text-neutral-500">Usamos o contato só para avisar deste produto.</p>
    </form>
  );
}
