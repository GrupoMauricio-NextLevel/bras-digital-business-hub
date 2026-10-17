import { CheckCircle2, CreditCard, Globe, Truck } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ActionQueue, type ActionQueueItem } from "@/components/app/action-queue";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/app/status-badge";
import { requireRole } from "@/lib/require-session";
import { formatBRL } from "@/lib/money";
import { SupplierWalletCard } from "./wallet-card";
import { ShippingCard } from "./shipping-card";
import { isDemoMode } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

export default async function SupplierSettingsPage() {
  const session = await requireRole("SUPPLIER_ADMIN");
  const s = session.supplier!;
  const walletConnected = Boolean(s.walletMpTokenEnc);
  const shippingConnected = s.shippingStatus === "CONNECTED";
  const queue = ([
    !walletConnected ? { id: "wallet", title: "Conecte a carteira de recargas", description: "Sem a conta Mercado Pago, os lojistas não conseguem recarregar saldo.", tone: "danger", icon: CreditCard, href: "#wallet", actionLabel: "Configurar" } : null,
    !shippingConnected ? { id: "shipping", title: "Revise a plataforma de envio", description: "A integração de frete ainda não está conectada para a operação própria.", tone: "warning", icon: Truck, href: "#shipping", actionLabel: "Configurar" } : null,
  ] as (ActionQueueItem | null)[]).filter((item): item is ActionQueueItem => Boolean(item));
  return (
    <>
      <PageHeader title="Configurações" description="Dados do fornecedor e modelo comercial com a NextLevel." />
      <OperationalPulse className="mb-5" items={[
        { label: "Status da Central", value: s.status, icon: CheckCircle2, tone: s.status === "ACTIVE" ? "success" : "warning", hint: "cadastro e acesso" },
        { label: "Recargas", value: walletConnected ? "Conectado" : "Pendente", icon: CreditCard, tone: walletConnected ? "success" : "danger", hint: "Mercado Pago" },
        { label: "Envio", value: shippingConnected ? "Conectado" : s.shippingStatus, icon: Truck, tone: shippingConnected ? "success" : "warning", hint: s.shippingProvider ?? "sem provedor" },
        { label: "Catálogo", value: "Rede privada", icon: Globe, tone: "neutral", hint: "visibilidade atual" },
      ]} />
      <ActionQueue className="mb-6" items={queue} title="Configurações que exigem atenção" description="Integrações que podem bloquear operação ou experiência dos lojistas." emptyMessage="As integrações essenciais estão configuradas." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><div><CardTitle>Fornecedor</CardTitle><CardDescription>Identificação da Central.</CardDescription></div></CardHeader><CardContent className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Nome</span><span className="font-medium">{s.name}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Slug</span><span>{s.slug}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Localização</span><span>{s.city}/{s.state}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge value={s.status} dot /></div></CardContent></Card>
        <Card><CardHeader><div><CardTitle>Modelo comercial</CardTitle><CardDescription>Definido pela NextLevel.</CardDescription></div><StatusBadge value={s.businessModel} /></CardHeader><CardContent className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Setup</span><span className="font-medium">{formatBRL(s.setupFeeCents)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Taxa sobre faturamento</span><span className="font-medium">{s.platformFeePercent}%</span></div><div className="flex justify-between"><span className="text-muted-foreground">Cobrança automática</span><Badge tone="outline">Prevista</Badge></div></CardContent></Card>
        <Card id="wallet"><CardHeader><div><CardTitle>Carteira Pix dos lojistas</CardTitle><CardDescription>Conta Mercado Pago que recebe as recargas.</CardDescription></div></CardHeader><CardContent><SupplierWalletCard connected={walletConnected} /></CardContent></Card>
        <Card id="shipping"><CardHeader><div><CardTitle>Plataforma de envio</CardTitle><CardDescription>SuperFrete, Melhor Envio ou Onlog, para etiquetas dos pedidos da sua loja própria.</CardDescription></div></CardHeader><CardContent><ShippingCard provider={s.shippingProvider} status={s.shippingStatus} account={s.shippingAccount} demo={isDemoMode()} originZip={s.shippingOriginZip} /></CardContent></Card>
        <Card><CardHeader><div><CardTitle>Catálogo compartilhado</CardTitle><CardDescription>Visibilidade padrão dos produtos.</CardDescription></div></CardHeader><CardContent className="text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Visibilidade</span><Badge tone="outline">PRIVATE_NETWORK</Badge></div></CardContent></Card>
        <Card><CardHeader><div><CardTitle>Integrações</CardTitle><CardDescription>Adapters preparados; sem integração real no MVP.</CardDescription></div></CardHeader><CardContent className="space-y-2 text-sm">{["Mercado Pago (recebimento dos lojistas)", "Melhor Envio / SuperFrete / Onlog (etiquetas)", "ERP / NF-e"].map((i) => <div key={i} className="flex justify-between gap-4"><span>{i}</span><Badge tone="outline">Não conectado</Badge></div>)}</CardContent></Card>
      </div>
    </>
  );
}
