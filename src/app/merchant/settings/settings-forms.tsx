"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Truck, Globe, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/app/form-field";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/app/status-badge";
import { ShippingRules } from "./shipping-rules";
import { ShippingCard } from "@/app/supplier/settings/shipping-card";
import type { ShippingConfig } from "@/lib/shipping/quote";
import { updateStoreAction, connectMercadoPagoAction, disconnectMercadoPagoAction } from "@/app/actions/merchant";

type StoreData = { name: string; tagline: string; whatsapp: string; instagram: string; legalName: string; cnpj: string; contactEmail: string; address: string; slug: string; paymentStatus: string; paymentProvider: string | null; mpConnected: boolean; mpTest: boolean; webhookUrl: string; shippingStatus: string; shippingProvider: string | null; domainStatus: string; customDomain: string | null };

export function SettingsForms({ store, shippingConfig, connect }: { store: StoreData; shippingConfig: ShippingConfig; connect: { provider: string | null; status: "NOT_CONFIGURED" | "DEMO" | "CONNECTED"; account: string | null; originZip: string; demo: boolean; novas?: boolean } | null }) {
  const router = useRouter();
  const [f, setF] = React.useState(store);
  const [pending, start] = React.useTransition();
  const [mpToken, setMpToken] = React.useState("");
  const [mpKey, setMpKey] = React.useState("");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader><div><CardTitle>Dados da loja</CardTitle><CardDescription>Endereço público: /store/{store.slug}</CardDescription></div></CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await updateStoreAction({ name: f.name, tagline: f.tagline, whatsapp: f.whatsapp, instagram: f.instagram, legalName: f.legalName, cnpj: f.cnpj, contactEmail: f.contactEmail, address: f.address }); if (r.ok) { toast.success("Dados salvos"); router.refresh(); } else toast.error(r.error); }); }}>
            <FormField label="Nome da loja" htmlFor="name"><Input id="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></FormField>
            <FormField label="Slogan" htmlFor="tagline"><Input id="tagline" value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} /></FormField>
            <FormField label="WhatsApp" htmlFor="wa" hint="Usado no botão de contato da loja"><Input id="wa" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} placeholder="5511999990000" /></FormField>
            <FormField label="Instagram" htmlFor="ig"><Input id="ig" value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} placeholder="@sualoja" /></FormField>
            <fieldset className="sm:col-span-2 grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2"><legend className="px-1 text-xs font-medium text-muted-foreground">Dados que dão credibilidade (aparecem no rodapé e em “Sobre”)</legend>
              <FormField label="Razão social" htmlFor="legal"><Input id="legal" value={f.legalName} onChange={(e) => setF({ ...f, legalName: e.target.value })} /></FormField>
              <FormField label="CNPJ ou CPF" htmlFor="cnpj"><Input id="cnpj" inputMode="numeric" value={f.cnpj} onChange={(e) => setF({ ...f, cnpj: e.target.value })} placeholder="00.000.000/0001-00" /></FormField>
              <FormField label="E-mail de contato" htmlFor="cemail"><Input id="cemail" type="email" value={f.contactEmail} onChange={(e) => setF({ ...f, contactEmail: e.target.value })} /></FormField>
              <FormField label="Endereço ou cidade" htmlFor="addr"><Input id="addr" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="São Paulo, SP" /></FormField>
            </fieldset>
            <div className="sm:col-span-2 flex justify-end"><Button type="submit" loading={pending}><Save /> Salvar</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card id="payments">
        <CardHeader><div className="flex items-center gap-2"><CreditCard className="size-4 text-muted-foreground" /><div><CardTitle>Pagamentos · Mercado Pago</CardTitle><CardDescription>O cliente paga direto na sua conta (Pix, cartão e boleto).</CardDescription></div></div><StatusBadge value={store.mpConnected ? "CONNECTED" : "NOT_CONFIGURED"} /></CardHeader>
        <CardContent className="space-y-3">
          {store.mpConnected ? (
            <>
              <p className="text-sm text-muted-foreground">Conta conectada. Os pedidos da loja abrem o Checkout Pro do Mercado Pago e são confirmados automaticamente.</p>
              <p className="rounded-md bg-surface-muted px-3 py-2 text-xs text-muted-foreground">Notificações chegam em <span className="select-all font-mono">{store.webhookUrl}</span> (configurada automaticamente em cada cobrança).</p>
              <Button variant="secondary" className="w-full" loading={pending} onClick={() => start(async () => { const r = await disconnectMercadoPagoAction(); if (r.ok) { toast.success("Mercado Pago desconectado"); router.refresh(); } else toast.error(r.error); })}>Desconectar</Button>
            </>
          ) : (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await connectMercadoPagoAction({ accessToken: mpToken, publicKey: mpKey }); if (r.ok) { toast.success(`Conectado: ${r.data.nickname}${r.data.isTest ? " (modo teste)" : ""}`); setMpToken(""); router.refresh(); } else toast.error(r.error); }); }}>
              <FormField label="Access Token" htmlFor="mptoken" hint="Mercado Pago → Seu negócio → Configurações → Credenciais. Use TEST-… para testar e APP_USR-… em produção."><Input id="mptoken" type="password" autoComplete="off" value={mpToken} onChange={(e) => setMpToken(e.target.value)} placeholder="APP_USR-…" required /></FormField>
              <FormField label="Public Key (opcional)" htmlFor="mpkey"><Input id="mpkey" value={mpKey} onChange={(e) => setMpKey(e.target.value)} placeholder="APP_USR-…" /></FormField>
              <Button type="submit" className="w-full" loading={pending}>Validar e conectar</Button>
              <p className="text-xs text-muted-foreground">O token é validado na hora e guardado criptografado. Nunca é exibido de volta.</p>
            </form>
          )}
        </CardContent>
      </Card>
      <Card id="shipping" className="lg:col-span-2">
        <CardHeader><div className="flex items-center gap-2"><Truck className="size-4 text-muted-foreground" /><div><CardTitle>Frete e entrega</CardTitle><CardDescription>{connect ? "Conecte sua plataforma de envio para cotar por CEP no checkout e defina as regras da loja." : "O frete é cotado por CEP no checkout. Defina aqui as regras da loja."}</CardDescription></div></div>{connect ? <StatusBadge value={connect.status} /> : null}</CardHeader>
        <CardContent className="space-y-6">
          {connect ? <ShippingCard provider={connect.provider} status={connect.status} account={connect.account} demo={connect.demo} originZip={connect.originZip} novas={connect.novas} /> : null}
          <ShippingRules config={shippingConfig} />
        </CardContent>
      </Card>
      <Card id="domain" className="lg:col-span-2">
        <CardHeader><div className="flex items-center gap-2"><Globe className="size-4 text-muted-foreground" /><div><CardTitle>Domínio próprio</CardTitle><CardDescription>{store.customDomain ?? "Use o domínio da sua marca na loja."}</CardDescription></div></div><StatusBadge value={store.domainStatus} /></CardHeader>
        <CardContent><Link href="/merchant/storefront#dominio" className="font-semibold text-link underline underline-offset-4">{store.customDomain ? "Ver o DNS e verificar a conexão" : "Conectar meu domínio"}</Link></CardContent>
      </Card>
    </div>
  );
}
