import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/app/status-badge";
import { requireRole } from "@/lib/require-session";
import { formatBRL } from "@/lib/money";
import { SupplierWalletCard } from "./wallet-card";
import { Badge } from "@/components/ui/badge";

export default async function SupplierSettingsPage() {
  const session = await requireRole("SUPPLIER_ADMIN");
  const s = session.supplier!;
  return (
    <>
      <PageHeader title="Configurações" description="Dados do fornecedor e modelo comercial com a NextLevel." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><div><CardTitle>Fornecedor</CardTitle><CardDescription>Identificação da Central.</CardDescription></div></CardHeader><CardContent className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Nome</span><span className="font-medium">{s.name}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Slug</span><span>{s.slug}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Localização</span><span>{s.city}/{s.state}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge value={s.status} dot /></div></CardContent></Card>
        <Card><CardHeader><div><CardTitle>Modelo comercial</CardTitle><CardDescription>Definido pela NextLevel.</CardDescription></div><StatusBadge value={s.businessModel} /></CardHeader><CardContent className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Setup</span><span className="font-medium">{formatBRL(s.setupFeeCents)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Taxa sobre faturamento</span><span className="font-medium">{s.platformFeePercent}%</span></div><div className="flex justify-between"><span className="text-muted-foreground">Cobrança automática</span><Badge tone="outline">Prevista</Badge></div></CardContent></Card>
        <Card><CardHeader><div><CardTitle>Carteira Pix dos lojistas</CardTitle><CardDescription>Conta Mercado Pago que recebe as recargas.</CardDescription></div></CardHeader><CardContent><SupplierWalletCard connected={Boolean(s.walletMpTokenEnc)} /></CardContent></Card>
        <Card><CardHeader><div><CardTitle>Catálogo compartilhado</CardTitle><CardDescription>Visibilidade padrão dos produtos.</CardDescription></div></CardHeader><CardContent className="text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Visibilidade</span><Badge tone="outline">PRIVATE_NETWORK</Badge></div><p className="mt-3 text-xs text-muted-foreground">SHARED_NETWORK e PUBLIC_NETWORK já estão previstos no schema para o futuro Brás Digital.</p></CardContent></Card>
        <Card><CardHeader><div><CardTitle>Integrações</CardTitle><CardDescription>Estado real das integrações operacionais.</CardDescription></div></CardHeader><CardContent className="space-y-2 text-sm">
          <div className="flex justify-between gap-4"><span>Mercado Pago · recargas dos lojistas</span><Badge tone={s.walletMpTokenEnc ? "success" : "outline"}>{s.walletMpTokenEnc ? "Conectado" : "Não conectado"}</Badge></div>
          <div className="flex justify-between gap-4"><span>Melhor Envio / SuperFrete · etiquetas</span><Badge tone="outline">Fluxo manual</Badge></div>
          <div className="flex justify-between gap-4"><span>ERP / NF-e</span><Badge tone="outline">Não implementado</Badge></div>
        </CardContent></Card>
      </div>
    </>
  );
}
