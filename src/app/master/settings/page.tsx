import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/app/data-table";
import { listUsers } from "@/lib/queries/master";
import { Badge } from "@/components/ui/badge";

const ROLE: Record<string, string> = { NEXTLEVEL_MASTER: "NextLevel Master", SUPPLIER_ADMIN: "Fornecedor", STORE_OWNER: "Lojista" };

export default async function SettingsPage() {
  const users = await listUsers();
  return (
    <>
      <PageHeader title="Configurações" description="Parâmetros globais da plataforma." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><div><CardTitle>Modelos comerciais</CardTitle><CardDescription>Configuráveis por fornecedor (businessModel, platformFeePercent, setupFee).</CardDescription></div></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>SuperDrop</span><span className="text-muted-foreground">R$ 0 setup · 6% GMV</span></div>
            <div className="flex justify-between"><span>White Label</span><span className="text-muted-foreground">R$ 6.000 setup · 3% GMV</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div><CardTitle>Regras de inadimplência</CardTitle><CardDescription>Aplicadas às assinaturas das lojas (não automatizadas no MVP).</CardDescription></div></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>15 dias</span><Badge tone="warning">SUSPENDED</Badge></div>
            <div className="flex justify-between"><span>30 dias</span><Badge tone="danger">CLOSED</Badge></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div><CardTitle>Integrações</CardTitle><CardDescription>Adapters preparados, sem integração real no MVP.</CardDescription></div></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {["Mercado Pago", "Melhor Envio", "SuperFrete", "WhatsApp Business", "Meta / Instagram"].map((i) => <div key={i} className="flex justify-between"><span>{i}</span><Badge tone="outline">Não conectado</Badge></div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div><CardTitle>Privacidade (LGPD)</CardTitle><CardDescription>Customer, StoreCustomer e MarketingConsent são modelados separadamente.</CardDescription></div></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Acesso operacional (processar pedidos) é separado das permissões de marketing, que exigem consentimento com finalidade, origem e data.</CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <h2 className="mb-3 text-base font-semibold">Usuários</h2>
        <DataTable rows={users} rowKey={(u) => u.id} columns={[{ key: "name", header: "Nome", primary: true, cell: (u) => <span className="font-medium">{u.name}</span> }, { key: "email", header: "E-mail", cell: (u) => u.email }, { key: "role", header: "Papel", cell: (u) => <Badge tone="outline">{ROLE[u.role]}</Badge> }]} />
      </div>
    </>
  );
}
