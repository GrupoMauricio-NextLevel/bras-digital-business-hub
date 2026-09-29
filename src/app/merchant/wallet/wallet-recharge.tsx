"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, QrCode, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/ui/money-input";
import { checkRechargeAction, createRechargeAction, simulateRechargeAction } from "@/app/actions/wallet";
import { formatBRL } from "@/lib/money";

type Pix = { id: string; pixCode: string; pixQrBase64: string; demo?: boolean; amountCents: number };

export function WalletRecharge({ suggestedCents, demo }: { suggestedCents: number; demo: boolean }) {
  const router = useRouter();
  const [amount, setAmount] = React.useState(Math.max(suggestedCents, 5000));
  const [pix, setPix] = React.useState<Pix | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [paid, setPaid] = React.useState(false);

  const check = React.useCallback(async (id: string) => {
    const r = await checkRechargeAction(id);
    if (r.ok && r.data.paid) { setPaid(true); toast.success("Recarga confirmada! Pedidos liberados automaticamente."); router.refresh(); return true; }
    return false;
  }, [router]);

  React.useEffect(() => {
    if (!pix || paid) return;
    const t = setInterval(() => { void check(pix.id); }, 5000);
    return () => clearInterval(t);
  }, [pix, paid, check]);

  const generate = async () => {
    setBusy(true);
    const r = await createRechargeAction(amount);
    setBusy(false);
    if (!r.ok) return toast.error(r.error);
    setPaid(false);
    setPix({ id: r.data.id, pixCode: r.data.pixCode, pixQrBase64: r.data.pixQrBase64, demo: "demo" in r.data ? Boolean(r.data.demo) : false, amountCents: amount });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <MoneyInput label="Valor da recarga" valueCents={amount} onChange={setAmount} className="w-48" id="recharge-amount" />
        <Button onClick={generate} loading={busy}><QrCode /> Gerar Pix</Button>
      </div>
      {pix ? (
        <div className="rounded-lg border border-border bg-surface-muted p-4" data-testid="pix-box">
          {paid ? (
            <p className="text-sm font-medium text-success">Recarga de {formatBRL(pix.amountCents)} confirmada.</p>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row">
              {pix.pixQrBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="QR Code Pix" src={`data:image/png;base64,${pix.pixQrBase64}`} className="size-40 rounded-md bg-white p-2" />
              ) : null}
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm">Pague <strong>{formatBRL(pix.amountCents)}</strong> por Pix. O saldo é creditado assim que o pagamento for confirmado.</p>
                <code className="block break-all rounded bg-background p-2 text-xs" data-testid="pix-code">{pix.pixCode}</code>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => { void navigator.clipboard?.writeText(pix.pixCode); toast.success("Código Pix copiado"); }}><Copy /> Copiar código</Button>
                  <Button variant="ghost" onClick={async () => { if (!(await check(pix.id))) toast.message("Ainda não confirmado"); }}><RefreshCw /> Já paguei</Button>
                  {demo && pix.demo ? <Button variant="secondary" onClick={async () => { const r = await simulateRechargeAction(pix.id); if (!r.ok) toast.error(r.error); else await check(pix.id); }}>Simular pagamento (demo)</Button> : null}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
