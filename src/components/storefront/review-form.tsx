"use client";
import * as React from "react";
import { toast } from "sonner";
import { submitReviewAction } from "@/app/actions/reviews";

type Item = { productId: string; name: string };

export function ReviewForm({ slug, number, email, items }: { slug: string; number: string; email: string; items: Item[] }) {
  const [pending, start] = React.useTransition();
  const [done, setDone] = React.useState<string[]>([]);
  const left = items.filter((i) => !done.includes(i.productId));
  if (left.length === 0) return items.length ? <p className="mt-6 rounded-xl bg-neutral-50 p-4 text-sm">Obrigado pela avaliação! Ela aparece na loja depois de aprovada.</p> : null;
  return (
    <section className="mt-8" aria-label="Avaliar produtos">
      <h2 className="text-lg font-semibold">Avalie sua compra</h2>
      <ul className="mt-3 space-y-4">
        {left.map((it) => (
          <li key={it.productId} className="rounded-xl border border-neutral-200 p-4">
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const rating = Number(fd.get("rating"));
              start(async () => {
                const r = await submitReviewAction(slug, { number, email, productId: it.productId, rating, body: String(fd.get("body") ?? "") });
                if (r.ok) { setDone((d) => [...d, it.productId]); toast.success("Avaliação enviada"); } else toast.error(r.error);
              });
            }}>
              <div className="text-sm font-medium">{it.name}</div>
              <fieldset className="mt-2 flex gap-3 text-sm"><legend className="sr-only">Nota</legend>
                {[1, 2, 3, 4, 5].map((n) => <label key={n} className="flex items-center gap-1"><input type="radio" name="rating" value={n} required /> {n}★</label>)}
              </fieldset>
              <textarea name="body" maxLength={500} placeholder="Conte como foi (opcional)" className="mt-2 min-h-20 w-full rounded-lg border border-neutral-300 p-2 text-sm" />
              <button disabled={pending} className="mt-2 h-10 rounded-lg px-5 text-sm font-medium disabled:opacity-60" style={{ background: "var(--sf-primary)", color: "var(--sf-on-primary)" }}>{pending ? "Enviando…" : "Enviar avaliação"}</button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
