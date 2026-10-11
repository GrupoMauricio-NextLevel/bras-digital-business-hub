"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, QrCode, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBRL } from "@/lib/money";
import { checkFreightPixAction, connectCarrierMpAction, createFreightPixAction, disconnectCarrierMpAction, registerParcelPaymentAction, trustClientAction } from "@/app/actions/frete-pix";

/** Telas do frete por Pix do ônibus (D119). */
type Result = { ok: boolean; error?: string };
function useRun() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return { pending, run: <T extends Result>(fn: () => Promise<T>, msg: string | null, after?: (r: T) => void) => start(async () => { const r = await fn(); if (r.ok) { if (msg) toast.success(msg); after?.(r); router.refresh(); } else toast.error(r.error); }) };
}

/** Perfil do ônibus: conectar o Mercado Pago (o frete cai direto na conta do dono). */
export function CarrierMpForm({ connected, accountId, pixOnline }: { connected: boolean; accountId: string | null; pixOnline: boolean }) {
  const { pending, run } = useRun();
  const [token, setToken] = React.useState("");
  return (
    <div className="grid gap-3 text-sm">
      {connected ? (
        <p className="flex flex-wrap items-center gap-2"><ShieldCheck className="size-4 text-success" aria-hidden /><b>Mercado Pago conectado</b><span className="text-muted-foreground">conta {accountId}</span></p>
      ) : <p className="text-muted-foreground">Conecte a sua conta do Mercado Pago para receber o frete por Pix antes da viagem, direto na sua conta. A NextLevel não toca no dinheiro do frete.</p>}
      {!pixOnline ? <p role="note" className="rounded-lg bg-surface-muted px-3 py-2">O Pix do frete ainda não foi ligado pela NextLevel Cargas. Enquanto isso, você combina o pagamento com o cliente, como hoje.</p> : null}
      <form className="grid gap-2" aria-label="Conectar Mercado Pago" onSubmit={(e) => { e.preventDefault(); run(() => connectCarrierMpAction(token), "Mercado Pago conectado", () => setToken("")); }}>
        <label className="flex flex-col font-medium">Access Token do Mercado Pago<Input type="password" autoComplete="off" required minLength={20} value={token} onChange={(e) => setToken(e.target.value)} placeholder="APP_USR-..." className="mt-1" /></label>
        <p className="text-xs text-muted-foreground">No Mercado Pago: Seu negócio → Configurações → Credenciais de produção. O token fica guardado criptografado e não aparece mais na tela.</p>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={pending}>{connected ? "Trocar token" : "Conectar"}</Button>
          {connected ? <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => { if (confirm("Desconectar o Mercado Pago? Novos fardos voltam a combinar o pagamento.")) run(() => disconnectCarrierMpAction(), "Mercado Pago desconectado"); }}>Desconectar</Button> : null}
        </div>
      </form>
    </div>
  );
}

type Pix = { id: string; amountCents: number; pixCode: string; expiresAt: string };
/** Cliente: pagar por Pix os fardos aceitos da viagem; o QR aparece aqui e o "Já paguei" confere no Mercado Pago. */
export function FreightPixPay({ tripId, tripNumber, open }: { tripId: string; tripNumber: number; open?: Pix | null }) {
  const { pending, run } = useRun();
  const [pix, setPix] = React.useState<Pix | null>(open ?? null);
  const [qr, setQr] = React.useState("");
  React.useEffect(() => {
    if (!pix?.pixCode) return;
    let alive = true;
    void import("qrcode").then((m) => m.default.toDataURL(pix.pixCode, { margin: 1, width: 220, errorCorrectionLevel: "M" })).then((u) => { if (alive) setQr(u); });
    return () => { alive = false; };
  }, [pix?.pixCode]);
  if (!pix) return <Button size="sm" disabled={pending} onClick={() => run(() => createFreightPixAction(tripId), null, (r) => setPix((r as unknown as { data: Pix }).data))}><QrCode className="size-4" aria-hidden />Pagar o frete por Pix</Button>;
  return (
    <div className="mt-2 grid gap-2 rounded-lg border border-border p-3" aria-label={`Pix do frete da viagem ${tripNumber}`} role="group">
      <p className="font-semibold">Pix de {formatBRL(pix.amountCents)} para o dono do ônibus</p>
      {/* eslint-disable-next-line @next/next/no-img-element -- QR gerado no navegador (data URL) */}
      {qr ? <img src={qr} alt="QR Code do Pix do frete" width={180} height={180} className="rounded bg-white p-1" /> : null}
      <p className="break-all rounded bg-surface-muted p-2 font-mono text-xs">{pix.pixCode}</p>
      <p className="text-xs text-muted-foreground">Vale até {new Date(pix.expiresAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })}. O dinheiro vai direto para a conta do ônibus.</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => { void navigator.clipboard?.writeText(pix.pixCode); toast.success("Código Pix copiado"); }}><Copy className="size-4" aria-hidden />Copiar código</Button>
        <Button size="sm" disabled={pending} onClick={() => run(() => checkFreightPixAction(pix.id), null, (r) => { const paid = (r as unknown as { data: { paid: boolean } }).data.paid; if (paid) toast.success("Pagamento confirmado"); else toast.message("Ainda não chegou. Se já pagou, aguarde um minuto e confira de novo."); })}><Check className="size-4" aria-hidden />Já paguei</Button>
      </div>
    </div>
  );
}

/** Dono do ônibus: cliente de confiança (paga na chegada), "recebi na chegada" e "já devolvi o Pix". */
export function TrustClientButton({ parcelId, name }: { parcelId: string; name: string }) {
  const { pending, run } = useRun();
  return <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => trustClientAction(parcelId, true), `${name} paga na chegada`)} aria-label={`Marcar ${name} como cliente de confiança`}><ShieldCheck className="size-4" aria-hidden />Cliente de confiança</Button>;
}
export function RegisterPaymentButton({ parcelId, label, what }: { parcelId: string; label: string; what: "RECEBIDO" | "DEVOLVIDO" }) {
  const { pending, run } = useRun();
  return <Button size="sm" variant={what === "RECEBIDO" ? "primary" : "secondary"} disabled={pending} onClick={() => run(() => registerParcelPaymentAction(parcelId, what), what === "RECEBIDO" ? "Recebimento registrado" : "Devolução registrada")} aria-label={what === "RECEBIDO" ? `Recebi o frete do fardo ${label}` : `Já devolvi o Pix do fardo ${label}`}>{what === "RECEBIDO" ? <Check className="size-4" aria-hidden /> : <RotateCcw className="size-4" aria-hidden />}{what === "RECEBIDO" ? "Recebi" : "Já devolvi"}</Button>;
}
