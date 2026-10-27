"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { conectarErpAction, desconectarErpAction, tentarDeNovoErpAction } from "@/app/actions/erp";

export function ConectarErp() {
  const router = useRouter();
  const [provider, setProvider] = React.useState<"TINY" | "OMIE">("TINY");
  const [token, setToken] = React.useState("");
  const [appKey, setAppKey] = React.useState("");
  const [appSecret, setAppSecret] = React.useState("");
  const [pending, start] = React.useTransition();
  const pronto = provider === "TINY" ? token.trim().length >= 20 : !!appKey.trim() && !!appSecret.trim();
  return (
    <form className="grid max-w-xl gap-3" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await conectarErpAction({ provider, token, appKey, appSecret }); if (r.ok) { toast.success(`Conectado: ${r.data.conta}`); setToken(""); setAppSecret(""); router.refresh(); } else toast.error(r.error); }); }}>
      <label className="text-sm font-medium">ERP
        <select name="erp" className="mt-1 block h-10 w-full rounded-lg border border-border bg-surface px-2 text-sm" value={provider} onChange={(e) => setProvider(e.target.value as "TINY" | "OMIE")}>
          <option value="TINY">Tiny (Olist ERP)</option><option value="OMIE">Omie</option>
        </select>
      </label>
      {provider === "TINY" ? (
        <label className="text-sm font-medium">Token da API do Tiny<Input className="mt-1" name="token" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="No Tiny: Configurações, Outras configurações, Token da API" /></label>
      ) : (
        <>
          <label className="text-sm font-medium">App key do Omie<Input className="mt-1" name="appKey" autoComplete="off" value={appKey} onChange={(e) => setAppKey(e.target.value)} placeholder="No Omie: Configurações, Desenvolvedor, Aplicativos" /></label>
          <label className="text-sm font-medium">App secret do Omie<Input className="mt-1" name="appSecret" type="password" autoComplete="off" value={appSecret} onChange={(e) => setAppSecret(e.target.value)} /></label>
        </>
      )}
      <p className="text-xs text-muted-foreground">Conferimos a conta no próprio ERP antes de salvar. A chave fica guardada criptografada e nunca aparece de novo.</p>
      <Button type="submit" loading={pending} disabled={!pronto} className="justify-self-start">Conferir e conectar</Button>
    </form>
  );
}

export function DesconectarErp() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return <Button variant="secondary" loading={pending} onClick={() => start(async () => { const r = await desconectarErpAction(); if (r.ok) { toast.success("ERP desconectado"); router.refresh(); } else toast.error(r.error); })}>Desconectar</Button>;
}

export function TentarDeNovo({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return <Button size="sm" variant="ghost" loading={pending} onClick={() => start(async () => { const r = await tentarDeNovoErpAction(id); if (r.ok) { toast.success("Vai na próxima rodada (até 10 minutos)"); router.refresh(); } else toast.error(r.error); })}>Tentar de novo</Button>;
}
