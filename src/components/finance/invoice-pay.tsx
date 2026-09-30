"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, QrCode, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { chargeInvoiceAction, checkPaymentAction, simulatePaymentAction } from "@/app/actions/billing";
import { formatBRL } from "@/lib/money";

type Pix = { id: string; pixCode: string; pixQrBase64: string; amountCents: number; demo: boolean };

/** Botão "Pagar por Pix" de uma fatura da NextLevel: mostra o código, confere sozinho e libera a fatura. */
export function InvoicePay({ invoiceId, label = "Pagar por Pix", demo, autoOpen = false, large = false }: { invoiceId: string; label?: string; demo: boolean; autoOpen?: boolean; large?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pix, setPix] = React.useState<Pix | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [paid, setPaid] = React.useState(false);

  const check = React.useCallback(async (id: string) => {
    const r = await checkPaymentAction(id);
    if (r.ok && r.data.paid) { setPaid(true); toast.success("Pagamento confirmado!"); router.refresh(); return true; }
    return false;
  }, [router]);

  React.useEffect(() => {
    if (!pix || paid || !open) return;
    const t = setInterval(() => { void check(pix.id); }, 5000);
    return () => clearInterval(t);
  }, [pix, paid, open, check]);

  const start = async () => {
    setBusy(true);
    const r = await chargeInvoiceAction(invoiceId);
    setBusy(false);
    if (!r.ok) return toast.error(r.error);
    setPaid(false); setPix({ id: r.data.id, pixCode: r.data.pixCode, pixQrBase64: r.data.pixQrBase64, amountCents: r.data.amountCents, demo: r.data.demo }); setOpen(true);
  };

  const auto = React.useRef(false);
  React.useEffect(() => { if (autoOpen && !auto.current) { auto.current = true; void start(); } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);

  return (
    <>
      <Button size={large ? "lg" : "sm"} onClick={start} loading={busy}><QrCode /> {label}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Pagamento por Pix" description={pix ? `Valor: ${formatBRL(pix.amountCents)}. A confirmação é automática.` : undefined}>
          {pix ? (paid ? <p className="text-sm font-medium text-success">Pagamento confirmado. Obrigado!</p> : (
            <div className="space-y-3">
              {pix.demo ? <p role="note" className="rounded bg-warning-soft px-2 py-1 text-xs font-semibold text-warning">PIX SIMULADO · demonstração, nenhum dinheiro real é movimentado</p> : null}
              {pix.pixQrBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="QR Code Pix" src={`data:image/png;base64,${pix.pixQrBase64}`} className="mx-auto size-44 rounded-md bg-white p-2" />
              ) : null}
              <code className="block break-all rounded bg-surface-muted p-2 text-xs" data-testid="invoice-pix-code">{pix.pixCode}</code>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => { void navigator.clipboard?.writeText(pix.pixCode); toast.success("Código copiado"); }}><Copy /> Copiar código</Button>
                <Button variant="ghost" onClick={async () => { if (!(await check(pix.id))) toast.message("Ainda não confirmado"); }}><RefreshCw /> Já paguei</Button>
                {demo && pix.demo ? <Button variant="secondary" onClick={async () => { const r = await simulatePaymentAction(pix.id); if (!r.ok) toast.error(r.error); else await check(pix.id); }}>Simular pagamento (demo)</Button> : null}
              </div>
            </div>
          )) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
