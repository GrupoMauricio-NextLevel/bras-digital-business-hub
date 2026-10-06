"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { CreditCard, QrCode } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { buyDigitalAction } from "@/app/actions/nl-sales";
import { formatBRL } from "@/lib/money";
import { PayPanel, type PayData } from "./pay-panel";

type Quote = { listCents: number; pixCents: number; pixDiscountCents: number; pixDiscountPct: number; installments: number; installmentCents: number };
const field = "mt-1 h-11 w-full rounded-lg border border-border bg-surface px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring";

/** Compra em 1 clique: nome, e-mail e WhatsApp, escolha Pix (com desconto) ou cartão em até 6x e pague na hora. */
export function BuyButton({ slug, name, quote, affiliateRef, className, label }: { slug: string; name: string; quote: Quote; affiliateRef?: string; className?: string; label?: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [method, setMethod] = React.useState<"PIX" | "CARD">("PIX");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pay, setPay] = React.useState<PayData | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(null);
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const r = await buyDigitalAction({ slug, method, name: String(f.get("name") ?? ""), email: String(f.get("email") ?? ""), phone: String(f.get("phone") ?? ""), affiliateRef });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    if (r.data.method === "CARD" && r.data.checkoutUrl && !r.data.demo) { window.location.href = r.data.checkoutUrl; return; }
    setPay({ token: r.data.token, method: r.data.method, chargedCents: r.data.chargedCents, pixCode: r.data.pixCode, pixQrBase64: r.data.pixQrBase64, checkoutUrl: r.data.checkoutUrl, demo: r.data.demo });
  }

  const opts = [
    { k: "PIX" as const, label: "Pix", Icon: QrCode, price: formatBRL(quote.pixCents), note: `${quote.pixDiscountPct}% de desconto (economia de ${formatBRL(quote.pixDiscountCents)})` },
    { k: "CARD" as const, label: "Cartão de crédito", Icon: CreditCard, price: formatBRL(quote.listCents), note: `em até ${quote.installments}x de ${formatBRL(quote.installmentCents)}` },
  ];
  return (
    <>
      <button type="button" onClick={() => { setOpen(true); }} className={className ?? "inline-flex h-12 w-full items-center justify-center rounded-lg bg-band px-5 text-base font-semibold text-band-foreground transition hover:bg-band-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"}>{label ?? "Comprar agora"}</button>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setPay(null); setError(null); } }}>
        <DialogContent title={pay ? "Finalize o pagamento" : `Comprar ${name}`} description={pay ? undefined : "Compra em 1 clique: só precisamos de como falar com você."} className="max-h-[92vh] overflow-y-auto bg-surface text-foreground">
          {pay ? <PayPanel pay={pay} onPaid={() => router.push(`/loja-nextlevel/pedido/${pay.token}`)} /> : (
            <form onSubmit={submit} className="space-y-4">
              <div role="radiogroup" aria-label="Forma de pagamento" className="grid gap-3 sm:grid-cols-2">
                {opts.map(({ k, label: l, Icon, price, note }) => (
                  <button key={k} type="button" role="radio" aria-checked={method === k} onClick={() => setMethod(k)} className={`rounded-xl border p-3 text-left transition ${method === k ? "border-foreground bg-success-soft ring-2 ring-foreground" : "border-border hover:bg-surface-muted"}`}>
                    <span className="flex items-center gap-2 text-sm font-semibold"><Icon className="size-4" aria-hidden /> {l}</span>
                    <span className="mt-1 block text-xl font-bold tabular-nums">{price}</span>
                    <span className="block text-xs text-muted-foreground">{note}</span>
                  </button>
                ))}
              </div>
              <label className="block text-sm font-medium">Nome completo<input name="name" required minLength={3} autoComplete="name" className={field} placeholder="Seu nome" /></label>
              <label className="block text-sm font-medium">E-mail<input name="email" type="email" required autoComplete="email" className={field} placeholder="voce@email.com" /></label>
              <label className="block text-sm font-medium">WhatsApp com DDD<input name="phone" type="tel" required autoComplete="tel" inputMode="tel" className={field} placeholder="(11) 90000-0000" /></label>
              {error ? <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p> : null}
              <button type="submit" disabled={busy} className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-5 text-base font-bold text-primary-foreground transition hover:bg-primary disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">{busy ? "Gerando pagamento…" : method === "PIX" ? `Pagar ${formatBRL(quote.pixCents)} por Pix` : `Pagar ${formatBRL(quote.listCents)} no cartão`}</button>
              <p className="text-center text-xs text-muted-foreground">Pagamento seguro pelo Mercado Pago. Você recebe o acompanhamento do pedido e a equipe NextLevel fala com você pelo WhatsApp.</p>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
