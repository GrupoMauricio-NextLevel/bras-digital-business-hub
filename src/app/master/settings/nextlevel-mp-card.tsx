"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { StatusBadge } from "@/components/app/status-badge";
import { connectNextLevelMpAction } from "@/app/actions/billing";

export function NextLevelMpCard({ connected, nickname, isTest }: { connected: boolean; nickname?: string; isTest?: boolean }) {
  const router = useRouter();
  const [token, setToken] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center gap-2"><StatusBadge value={connected ? "CONNECTED" : "NOT_CONFIGURED"} />{connected ? <span className="text-muted-foreground">Conta {nickname}{isTest ? " (credencial de teste)" : ""}</span> : null}</div>
      <form className="flex flex-wrap items-end gap-3" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const r = await connectNextLevelMpAction(token); setBusy(false); if (r.ok) { toast.success("Conta conectada"); setToken(""); router.refresh(); } else toast.error(r.error); }}>
        <FormField label={connected ? "Trocar Access Token" : "Access Token da conta NextLevel"} htmlFor="nlmp" className="min-w-72 flex-1" hint="Guardado criptografado. Use TEST-… para testar e APP_USR-… em produção."><Input id="nlmp" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="APP_USR-…" required /></FormField>
        <Button type="submit" loading={busy}>Validar e conectar</Button>
      </form>
    </div>
  );
}
