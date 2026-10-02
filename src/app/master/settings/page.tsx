import { AlertTriangle, CheckCircle2, CreditCard, Mail, Users } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ActionQueue, type ActionQueueItem } from "@/components/app/action-queue";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/app/data-table";
import { listUsers } from "@/lib/queries/master";
import { Badge } from "@/components/ui/badge";
import { getDb } from "@/db/client";
import { getNextLevelMp } from "@/lib/domain/nextlevel-billing";
import { NextLevelMpCard } from "./nextlevel-mp-card";
import { EmailTest } from "./email-card";
import { requireRole } from "@/lib/require-session";
import { desc } from "drizzle-orm";
import { emailOutbox } from "@/db/schema";
import { formatDateTime } from "@/lib/utils";

const ROLE: Record<string, string> = { NEXTLEVEL_MASTER: "NextLevel Master", SUPPLIER_ADMIN: "Fornecedor", SUPPLIER_DISPATCH: "Expedição", STORE_OWNER: "Lojista" };

export default async function SettingsPage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const users = await listUsers();
  const db = await getDb();
  const mp = await getNextLevelMp(db);
  const emailConfigured = !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
  const recent = await db.select({ id: emailOutbox.id, kind: emailOutbox.kind, to: emailOutbox.toEmail, subject: emailOutbox.subject, status: emailOutbox.status, error: emailOutbox.error, at: emailOutbox.createdAt }).from(emailOutbox).orderBy(desc(emailOutbox.createdAt)).limit(20);
  const failedEmails = recent.filter((e) => e.status === "FAILED").length;
  const queue: ActionQueueItem[] = [
    !mp.connected ? { id: "mp", title: "Conecte o recebimento da NextLevel", description: "Setups, mensalidades, taxas e serviços dependem desta conta.", tone: "danger", icon: CreditCard, href: "#recebimento", actionLabel: "Configurar" } : null,
    !emailConfigured ? { id: "email", title: "Ative o provedor de e-mail", description: "Os e-mails continuam registrados, mas não são enviados sem configuração.", tone: "warning", icon: Mail, href: "#email", actionLabel: "Revisar" } : null,
    failedEmails > 0 ? { id: "failed", title: "Existem e-mails com falha", description: "Revise as últimas tentativas registradas.", count: failedEmails, tone: "warning", icon: AlertTriangle, href: "#email", actionLabel: "Ver falhas" } : null,
  ].filter((item): item is ActionQueueItem => Boolean(item));
  return (
    <>
      <PageHeader title="Configurações" description="Parâmetros globais da plataforma." />
      <OperationalPulse className="mb-5" items={[
        { label: "Recebimento", value: mp.connected ? "Conectado" : "Pendente", icon: CreditCard, tone: mp.connected ? "success" : "danger", hint: mp.nickname ?? "Mercado Pago" },
        { label: "E-mails", value: emailConfigured ? "Ativo" : "Pendente", icon: Mail, tone: emailConfigured ? "success" : "warning", hint: failedEmails ? failedEmails + " falha(s) recentes" : "sem falhas recentes" },
        { label: "Usuários", value: users.length, icon: Users, tone: "neutral", hint: "acessos cadastrados" },
        { label: "Plataforma", value: queue.length ? "Atenção" : "Pronta", icon: CheckCircle2, tone: queue.length ? "warning" : "success", hint: queue.length ? queue.length + " pendência(s)" : "essenciais configurados" },
      ]} />
      <ActionQueue className="mb-6" items={queue} title="Prontidão da plataforma" description="Configurações globais que podem impactar cobrança ou comunicação." emptyMessage="As configurações essenciais estão prontas." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card id="recebimento" className="md:col-span-2">
          <CardHeader><div><CardTitle>Recebimento da NextLevel (Mercado Pago)</CardTitle><CardDescription>Conta que recebe setups, mensalidades, taxas, serviços e add-ons por Pix.</CardDescription></div></CardHeader>
          <CardContent><NextLevelMpCard connected={mp.connected} nickname={mp.nickname} isTest={mp.isTest} /></CardContent>
        </Card>
        <Card id="email" className="md:col-span-2">
          <CardHeader><div><CardTitle>E-mails do sistema</CardTitle><CardDescription>{emailConfigured ? "Envio ativo pela Resend." : "Envio desativado: defina RESEND_API_KEY e EMAIL_FROM no servidor. Enquanto isso os e-mails só ficam registrados abaixo."}</CardDescription></div><Badge tone={emailConfigured ? "success" : "warning"}>{emailConfigured ? "Ativo" : "Sem provedor"}</Badge></CardHeader>
          <CardContent className="space-y-4">
            <EmailTest configured={emailConfigured} defaultTo={session.user.email} />
            {recent.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum e-mail registrado ainda.</p> : (
              <ul className="divide-y divide-border text-sm" aria-label="Últimos e-mails">{recent.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span className="min-w-0"><span className="block truncate font-medium">{e.subject}</span><span className="block truncate text-xs text-muted-foreground">{e.to} · {e.kind} · {formatDateTime(e.at)}{e.error ? ` · ${e.error}` : ""}</span></span><Badge tone={e.status === "SENT" ? "success" : e.status === "FAILED" ? "danger" : "outline"}>{e.status === "SENT" ? "Enviado" : e.status === "FAILED" ? "Falhou" : "Registrado"}</Badge></li>
              ))}</ul>
            )}
          </CardContent>
        </Card>
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
