"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, ExternalLink, RefreshCw } from "lucide-react";
import { pollNlOrderAction, simulateNlPaymentAction } from "@/app/actions/nl-sales";
import { formatBRL } from "@/lib/money";

export type PayData = { token: string; method: "PIX" | "CARD"; chargedCents: number; pixCode?: string; pixQrBase64?: string; checkoutUrl?: string; demo: boolean };

const btn = "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2";

/** Pagamento do pedido da Loja NextLevel: Pix (código + QR, confirma sozinho) ou cartão (checkout do Mercado Pago). */
export function PayPanel({ pay, onPaid }: { pay: PayData; onPaid?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const paidRef = React.useRef(false);

  const check = React.useCallback(async (quiet = true) => {
    if (paidRef.current) return true;
    const r = await pollNlOrderAction(pay.token);
    if (r.ok && r.data.status !== "AWAITING_PAYMENT") {
      paidRef.current = true; toast.success("Pagamento confirmado!");
      if (onPaid) onPaid(); else router.refresh();
      return true;
    }
    if (!quiet) toast.message("Ainda não confirmado. Assim que o pagamento cair, esta tela atualiza sozinha.");
    return false;
  }, [pay.token, onPaid, router]);

  React.useEffect(() => { const t = setInterval(() => { void check(); }, 4000); return () => clearInterval(t); }, [check]);

  return (
    <div className="space-y-4" data-testid="nl-pay-panel">
      {pay.demo ? <p role="note" className="rounded-md bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900">PAGAMENTO SIMULADO · demonstração, nenhum dinheiro real é movimentado</p> : null}
      <p className="text-sm text-neutral-600">Valor a pagar: <b className="text-neutral-900 tabular-nums">{formatBRL(pay.chargedCents)}</b> {pay.method === "PIX" ? "no Pix" : "no cartão, em até 6x"}</p>
      {pay.method === "PIX" ? (
        <>
          {pay.pixQrBase64 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="QR Code Pix" src={`data:image/png;base64,${pay.pixQrBase64}`} className="mx-auto size-48 rounded-lg border border-neutral-200 bg-white p-2" />
          ) : null}
          <code className="block break-all rounded-md bg-neutral-100 p-3 text-xs" data-testid="nl-pix-code">{pay.pixCode}</code>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={`${btn} bg-[#0f1c16] text-white hover:bg-[#1c2e25] focus-visible:outline-[#0f1c16]`} onClick={() => { void navigator.clipboard?.writeText(pay.pixCode ?? ""); toast.success("Código copiado"); }}><Copy className="size-4" /> Copiar código Pix</button>
            <button type="button" className={`${btn} border border-neutral-300 hover:bg-neutral-100 focus-visible:outline-[#0f1c16]`} onClick={() => void check(false)}><RefreshCw className="size-4" /> Já paguei</button>
          </div>
        </>
      ) : pay.demo ? null : (
        <a href={pay.checkoutUrl} className={`${btn} w-full bg-[#0f1c16] text-white hover:bg-[#1c2e25] focus-visible:outline-[#0f1c16]`}><ExternalLink className="size-4" /> Pagar no cartão (Mercado Pago)</a>
      )}
      {pay.demo ? (
        <button type="button" disabled={busy} className={`${btn} w-full border border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 focus-visible:outline-amber-500`} onClick={async () => { setBusy(true); const r = await simulateNlPaymentAction(pay.token); setBusy(false); if (!r.ok) toast.error(r.error); else await check(); }}>Simular pagamento (demo)</button>
      ) : null}
      <p className="text-xs text-neutral-500">A confirmação é automática. Guarde o link desta página para acompanhar o seu pedido.</p>
    </div>
  );
}
