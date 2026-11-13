"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { StatusBadge } from "@/components/app/status-badge";
import { connectShippingAction, disconnectShippingAction, setOriginZipAction } from "@/app/actions/supplier";
import { NOVAS_PLATAFORMAS_DE_ENVIO, SHIPPING_PROVIDERS, type ShippingProviderKey } from "@/lib/shipping/providers";

/**
 * Plataforma de envio do fornecedor (SuperFrete, Melhor Envio ou Onlog), usada nas etiquetas dos pedidos da loja própria.
 * Na loja da Commerce (`novas`) aparecem também Frenet, Kangu e Correios com contrato (Rodada B, D190).
 */
export function ShippingCard({ provider, status, account, demo, originZip, novas = false }: { provider: string | null; status: "NOT_CONFIGURED" | "DEMO" | "CONNECTED"; account: string | null; demo: boolean; originZip?: string | null; novas?: boolean }) {
  const opcoes = (Object.keys(SHIPPING_PROVIDERS) as ShippingProviderKey[]).filter((k) => novas || !NOVAS_PLATAFORMAS_DE_ENVIO.includes(k));
  const [contrato, setContrato] = React.useState({ usuario: "", codigo: "", cartao: "" });
  const [zip, setZip] = React.useState(originZip ?? "");
  const router = useRouter();
  const [key, setKey] = React.useState<ShippingProviderKey>((provider as ShippingProviderKey) ?? "SUPERFRETE");
  const [token, setToken] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => { setBusy(true); const r = await fn(); setBusy(false); if (r.ok) { toast.success(ok); setToken(""); setContrato({ usuario: "", codigo: "", cartao: "" }); router.refresh(); } else toast.error(r.error ?? "Falha"); };
  const correios = key === "CORREIOS";
  const credencial = correios ? (contrato.usuario.trim() && contrato.codigo.trim() && contrato.cartao.trim() ? JSON.stringify(contrato) : "") : token.trim();
  const connected = status !== "NOT_CONFIGURED";
  return (
    <div className="space-y-3 text-sm">
      <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); void run(() => setOriginZipAction(zip), "CEP de origem salvo"); }}>
        <FormField label="CEP de onde saem os pedidos" htmlFor="originzip" hint="Base das cotações de frete no checkout." className="flex-1"><Input id="originzip" inputMode="numeric" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="01000-000" /></FormField>
        <Button type="submit" variant="secondary" loading={busy}>Salvar</Button>
      </form>
      <div className="flex items-center justify-between"><span>{connected ? `${SHIPPING_PROVIDERS[(provider as ShippingProviderKey) ?? "SUPERFRETE"]?.name ?? provider}${account ? ` · ${account}` : ""}` : "Nenhuma plataforma conectada"}</span><StatusBadge value={status} /></div>
      {connected ? <Button variant="secondary" loading={busy} onClick={() => run(() => disconnectShippingAction(), "Plataforma desconectada")}>Desconectar</Button> : (
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void run(() => connectShippingAction({ provider: key, token: credencial || undefined }), "Plataforma conectada"); }}>
          <FormField label="Plataforma" htmlFor="shipprov"><Select id="shipprov" value={key} onChange={(e) => setKey(e.target.value as ShippingProviderKey)}>{opcoes.map((k) => <option key={k} value={k}>{SHIPPING_PROVIDERS[k].name}</option>)}</Select></FormField>
          {correios ? (
            <fieldset className="space-y-3">
              <legend className="text-sm text-muted-foreground">{SHIPPING_PROVIDERS.CORREIOS.help}</legend>
              <FormField label="Usuário do Meu Correios" htmlFor="co-usuario"><Input id="co-usuario" autoComplete="off" value={contrato.usuario} onChange={(e) => setContrato({ ...contrato, usuario: e.target.value })} placeholder={demo ? "Deixe vazio para conectar em modo de demonstração" : "CPF ou CNPJ"} /></FormField>
              <FormField label="Código de acesso às APIs" htmlFor="co-codigo"><Input id="co-codigo" type="password" autoComplete="off" value={contrato.codigo} onChange={(e) => setContrato({ ...contrato, codigo: e.target.value })} /></FormField>
              <FormField label="Número do cartão de postagem" htmlFor="co-cartao"><Input id="co-cartao" inputMode="numeric" autoComplete="off" value={contrato.cartao} onChange={(e) => setContrato({ ...contrato, cartao: e.target.value })} /></FormField>
            </fieldset>
          ) : <FormField label={SHIPPING_PROVIDERS[key].tokenLabel} htmlFor="shiptoken" hint={SHIPPING_PROVIDERS[key].help}><Input id="shiptoken" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder={demo ? "Deixe vazio para conectar em modo de demonstração" : "Cole o token"} /></FormField>}
          <Button type="submit" loading={busy} disabled={!demo && credencial.length < 20}>Validar e conectar</Button>
        </form>
      )}
    </div>
  );
}
