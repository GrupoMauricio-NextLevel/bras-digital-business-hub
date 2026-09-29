"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Truck, Globe, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/app/form-field";
import { Input, Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/app/status-badge";
import { configureIntegrationAction, updateStoreAction } from "@/app/actions/merchant";

type StoreData = { name: string; tagline: string; whatsapp: string; instagram: string; slug: string; paymentStatus: string; paymentProvider: string | null; shippingStatus: string; shippingProvider: string | null; domainStatus: string; customDomain: string | null };

export function SettingsForms({ store }: { store: StoreData }) {
  const router = useRouter();
  const [f, setF] = React.useState(store);
  const [pending, start] = React.useTransition();
  const [pay, setPay] = React.useState("Mercado Pago");
  const [ship, setShip] = React.useState("Melhor Envio");
  const [domain, setDomain] = React.useState(store.customDomain ?? "");
  const integrate = (kind: "payments" | "shipping" | "domain", provider: string) => start(async () => { const r = await configureIntegrationAction({ kind, provider }); if (r.ok) { toast.success("Configuração salva (demonstração)"); router.refresh(); } else toast.error(r.error); });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader><div><CardTitle>Dados da loja</CardTitle><CardDescription>Endereço público: /store/{store.slug}</CardDescription></div></CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await updateStoreAction({ name: f.name, tagline: f.tagline, whatsapp: f.whatsapp, instagram: f.instagram }); if (r.ok) { toast.success("Dados salvos"); router.refresh(); } else toast.error(r.error); }); }}>
            <FormField label="Nome da loja" htmlFor="name"><Input id="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></FormField>
            <FormField label="Slogan" htmlFor="tagline"><Input id="tagline" value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} /></FormField>
            <FormField label="WhatsApp" htmlFor="wa" hint="Usado no botão de contato da loja"><Input id="wa" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} placeholder="5511999990000" /></FormField>
            <FormField label="Instagram" htmlFor="ig"><Input id="ig" value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} placeholder="@sualoja" /></FormField>
            <div className="sm:col-span-2 flex justify-end"><Button type="submit" loading={pending}><Save /> Salvar</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card id="payments">
        <CardHeader><div className="flex items-center gap-2"><CreditCard className="size-4 text-muted-foreground" /><div><CardTitle>Pagamentos</CardTitle><CardDescription>Cliente paga direto para você.</CardDescription></div></div><StatusBadge value={store.paymentStatus} /></CardHeader>
        <CardContent className="space-y-3">
          <FormField label="Provedor" htmlFor="pay"><Select id="pay" value={pay} onChange={(e) => setPay(e.target.value)}><option>Mercado Pago</option><option>Pagar.me</option><option>Stripe</option></Select></FormField>
          <Button variant="secondary" className="w-full" loading={pending} onClick={() => integrate("payments", pay)}>{store.paymentStatus === "NOT_CONFIGURED" ? "Conectar (demonstração)" : `Reconfigurar (${store.paymentProvider})`}</Button>
        </CardContent>
      </Card>
      <Card id="shipping">
        <CardHeader><div className="flex items-center gap-2"><Truck className="size-4 text-muted-foreground" /><div><CardTitle>Frete e etiquetas</CardTitle><CardDescription>Você gera a etiqueta e informa à Central.</CardDescription></div></div><StatusBadge value={store.shippingStatus} /></CardHeader>
        <CardContent className="space-y-3">
          <FormField label="Plataforma" htmlFor="ship"><Select id="ship" value={ship} onChange={(e) => setShip(e.target.value)}><option>Melhor Envio</option><option>SuperFrete</option></Select></FormField>
          <Button variant="secondary" className="w-full" loading={pending} onClick={() => integrate("shipping", ship)}>{store.shippingStatus === "NOT_CONFIGURED" ? "Conectar (demonstração)" : `Reconfigurar (${store.shippingProvider})`}</Button>
        </CardContent>
      </Card>
      <Card id="domain" className="lg:col-span-2">
        <CardHeader><div className="flex items-center gap-2"><Globe className="size-4 text-muted-foreground" /><div><CardTitle>Domínio próprio</CardTitle><CardDescription>Aponte um CNAME para a plataforma. Verificação automática em breve.</CardDescription></div></div><StatusBadge value={store.domainStatus} /></CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <FormField label="Domínio" htmlFor="domain" className="flex-1"><Input id="domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="www.sualoja.com.br" /></FormField>
          <Button variant="secondary" loading={pending} disabled={!domain} onClick={() => integrate("domain", domain)}>Solicitar conexão</Button>
        </CardContent>
      </Card>
    </div>
  );
}
