"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, CreditCard, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { checkCorporatePaymentAction, corporateCheckoutAction, simulateCorporatePaymentAction } from "@/app/actions/financeiro";
import { formatBRL } from "@/lib/money";

export type CheckoutPrice = { baseCents: number; pixCents: number | null; pixDiscountPct: number; cardTotalCents: number | null; cardMaxInstallments: number; cardMarkupPct: number };

/**
 * Checkout rápido: mostra total, parcelas, acréscimo e política ANTES de confirmar; cria o pedido uma vez (chave de
 * idempotência gerada ao abrir) e só confirma quando o gateway confirma (consulta a cada 5 s). Sem cartão guardado.
 */
export function CheckoutDialog({ productKey, productName, price, policy, returnPath, demo, triggerLabel = "Contratar" }: { productKey: string; productName: string; price: CheckoutPrice; policy?: string; returnPath: string; demo: boolean; triggerLabel?: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [method, setMethod] = React.useState<"PIX" | "CARD">(price.pixCents !== null ? "PIX" : "CARD");
  const [inst, setInst] = React.useState(Math.max(1, price.cardMaxInstallments));
  const [key, setKey] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [charge, setCharge] = React.useState<{ txId: string; code: string; pixCode?: string; pixQrBase64?: string; checkoutUrl?: string; demo: boolean; totalCents: number } | null>(null);
  const [paid, setPaid] = React.useState(false);

  React.useEffect(() => {
    if (!charge || paid || !open) return;
    const t = setInterval(async () => { const r = await checkCorporatePaymentAction(charge.txId); if (r.ok && r.data.paid) { setPaid(true); toast.success("Pagamento confirmado!"); } }, 5000);
    return () => clearInterval(t);
  }, [charge, paid, open]);

  const total = method === "PIX" ? price.pixCents ?? price.baseCents : price.cardTotalCents ?? price.baseCents;
  const installment = method === "CARD" ? Math.ceil(total / inst) : total;
  const confirm = async () => {
    setBusy(true);
    const r = await corporateCheckoutAction({ productKey, method, installments: method === "CARD" ? inst : 1, idempotencyKey: `${key}-${method}-${method === "CARD" ? inst : 1}`, returnPath });
    setBusy(false);
    if (!r.ok) return toast.error(r.error);
    setCharge(r.data);
    if (r.data.checkoutUrl) window.location.href = r.data.checkoutUrl;
  };
  // A tela só é atualizada ao fechar: o produto muda de estado (e este botão pode sumir) depois do pagamento.
  const reset = (o: boolean) => { setOpen(o); if (!o) { if (paid) router.refresh(); setCharge(null); setPaid(false); setKey(""); } };

  return (
    <>
      <Button onClick={() => { if (!key) setKey(`${productKey}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`); setOpen(true); }}>{triggerLabel}</Button>
      <Dialog open={open} onOpenChange={reset}>
        <DialogContent title={paid ? "Pagamento confirmado" : `Contratar ${productName}`} description={paid ? "Tudo certo. Acompanhe a entrega em Meus pedidos da NextLevel." : "Confira o valor antes de confirmar. A liberação acontece quando o pagamento é confirmado pelo gateway."}>
          {paid ? <div className="flex justify-end"><Button onClick={() => reset(false)}>Fechar</Button></div> : charge ? (
            <div className="space-y-3">
              <p className="text-sm">Pedido <strong>{charge.code}</strong> · {formatBRL(charge.totalCents)}</p>
              {charge.pixCode ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- QR em base64 gerado pelo gateway */}
                  {charge.pixQrBase64 ? <img alt="QR Code Pix" className="mx-auto size-48" src={`data:image/png;base64,${charge.pixQrBase64}`} /> : null}
                  <div className="rounded-md border border-border bg-surface-muted p-2 font-mono text-xs break-all">{charge.pixCode}</div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="secondary" onClick={async () => { await navigator.clipboard.writeText(charge.pixCode!); toast.success("Código Pix copiado"); }}><Copy /> Copiar código</Button>
                    {charge.demo && demo ? <Button variant="secondary" onClick={async () => { const r = await simulateCorporatePaymentAction(charge.txId); if (r.ok) setPaid(true); else toast.error(r.error); }}>Simular pagamento (demonstração)</Button> : null}
                  </div>
                  <p className="text-xs text-muted-foreground" role="status">Aguardando a confirmação do Pix. Esta janela confere sozinha.</p>
                </>
              ) : charge.checkoutUrl ? <p className="text-sm">Abrindo o pagamento seguro do cartão… <a className="font-semibold underline" href={charge.checkoutUrl}>Abrir agora</a></p> : (
                <div className="space-y-2"><p className="text-sm">Cartão de demonstração criado.</p>{charge.demo && demo ? <Button variant="secondary" onClick={async () => { const r = await simulateCorporatePaymentAction(charge.txId); if (r.ok) setPaid(true); else toast.error(r.error); }}>Simular pagamento (demonstração)</Button> : null}</div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <fieldset className="grid gap-2 sm:grid-cols-2">
                <legend className="mb-1 text-sm font-semibold">Forma de pagamento</legend>
                {price.pixCents !== null ? <label className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${method === "PIX" ? "border-accent bg-accent-soft/40" : "border-border"}`}><input type="radio" name={`m-${productKey}`} checked={method === "PIX"} onChange={() => setMethod("PIX")} /><span><span className="flex items-center gap-1 font-semibold"><QrCode className="size-4" aria-hidden /> Pix</span><span className="block tabular-nums">{formatBRL(price.pixCents)}</span>{price.pixDiscountPct ? <span className="text-xs text-muted-foreground">{price.pixDiscountPct}% de desconto sobre {formatBRL(price.baseCents)}</span> : null}</span></label> : null}
                {price.cardTotalCents !== null ? <label className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${method === "CARD" ? "border-accent bg-accent-soft/40" : "border-border"}`}><input type="radio" name={`m-${productKey}`} checked={method === "CARD"} onChange={() => setMethod("CARD")} /><span><span className="flex items-center gap-1 font-semibold"><CreditCard className="size-4" aria-hidden /> Cartão</span><span className="block tabular-nums">{formatBRL(price.cardTotalCents)}</span><span className="text-xs text-muted-foreground">{price.cardMarkupPct ? `preço-base × ${(1 + price.cardMarkupPct / 100).toFixed(2).replace(".", ",")} (acréscimo de ${formatBRL(price.cardTotalCents - price.baseCents)})` : "sem acréscimo"}</span></span></label> : null}
              </fieldset>
              {method === "CARD" && price.cardMaxInstallments > 1 ? (
                <label className="block text-sm"><span className="font-semibold">Parcelas</span>
                  <select className="ds-input mt-1" value={inst} onChange={(e) => setInst(Number(e.target.value))}>{Array.from({ length: price.cardMaxInstallments }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}x de {formatBRL(Math.ceil(total / n))} (total {formatBRL(total)})</option>)}</select>
                </label>
              ) : null}
              <div className="rounded-lg bg-surface-muted p-3 text-sm" aria-live="polite">
                <div className="flex justify-between"><span>Total</span><strong className="tabular-nums">{formatBRL(total)}</strong></div>
                {method === "CARD" ? <div className="flex justify-between text-muted-foreground"><span>{inst}x de</span><span className="tabular-nums">{formatBRL(installment)}</span></div> : null}
                {policy ? <p className="mt-2 text-xs text-muted-foreground">{policy}</p> : null}
              </div>
              <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => reset(false)}>Cancelar</Button><Button loading={busy} onClick={confirm}>{method === "PIX" ? "Gerar Pix" : "Ir para o pagamento"}</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
