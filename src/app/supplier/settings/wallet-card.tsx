"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { StatusBadge } from "@/components/app/status-badge";
import { connectSupplierWalletAction, disconnectSupplierWalletAction } from "@/app/actions/wallet";

/** Conta Mercado Pago do fornecedor: recebe as recargas Pix dos lojistas (o dinheiro não passa pela NextLevel). */
export function SupplierWalletCard({ connected }: { connected: boolean }) {
  const router = useRouter();
  const [token, setToken] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => {
    setBusy(true); const r = await fn(); setBusy(false);
    if (r.ok) { toast.success(ok); setToken(""); router.refresh(); } else toast.error(r.error ?? "Falha");
  };
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between"><span>Recargas Pix dos lojistas</span><StatusBadge value={connected ? "CONNECTED" : "NOT_CONFIGURED"} /></div>
      {connected ? (
        <Button variant="secondary" loading={busy} onClick={() => run(() => disconnectSupplierWalletAction(), "Conta desconectada")}>Desconectar</Button>
      ) : (
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void run(() => connectSupplierWalletAction({ accessToken: token }), "Conta conectada"); }}>
          <FormField label="Access Token da sua conta Mercado Pago" htmlFor="walletmp" hint="Os lojistas pagam por Pix direto para a sua conta. Use TEST-… para testar."><Input id="walletmp" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="APP_USR-…" required /></FormField>
          <Button type="submit" loading={busy}>Validar e conectar</Button>
        </form>
      )}
    </div>
  );
}
