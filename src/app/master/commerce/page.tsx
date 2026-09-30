import Link from "next/link";
import { CheckCircle2, CircleAlert, ExternalLink, Globe, Inbox, ShoppingCart, Store, TrendingUp, Wallet } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getDb } from "@/db/client";
import { getBrandHub } from "@/lib/domain/commerce-hub";
import { requireRole } from "@/lib/require-session";
import { formatBRL, formatCompactBRL } from "@/lib/money";
import { formatDate, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ACCESS: Record<string, { label: string; tone: "success" | "info" | "warning" | "neutral" }> = { PAID: { label: "Plano pago", tone: "success" }, TRIAL: { label: "Em teste", tone: "info" }, BLOCKED: { label: "Aguardando pagamento", tone: "warning" }, FREE: { label: "Sem regra", tone: "neutral" } };
const LEAD: Record<string, string> = { NEW: "Novo", CONTACTED: "Em contato", WON: "Virou loja", LOST: "Perdido" };

export default async function CommerceHubPage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const hub = await getBrandHub(await getDb(), session.actor);
  const k = hub.kpis;
  const blockers = hub.checks.filter((c) => c.severity === "blocker" && !c.ok);
  return (
    <>
      <PageHeader
        title="NextLevel Commerce"
        description="A plataforma de lojas virtuais: lojistas, interessados, receita dos planos e o que falta para lançar."
        actions={<><Link href="/lojas" target="_blank" className={buttonVariants({ variant: "secondary" })}><ExternalLink /> Ver o portal da marca</Link><Link href="/master/stores?marca=NEXTLEVEL_COMMERCE" className={buttonVariants()}><Store /> Todas as lojas da marca</Link></>}
      />

      <Card className={cn("mb-6", hub.ready ? "border-success/40" : "border-warning/40")} data-launch-card>
        <CardContent className="space-y-3 pt-5">
          <div className="flex flex-wrap items-center gap-2">
            {hub.ready ? <CheckCircle2 className="size-5 text-success" aria-hidden /> : <CircleAlert className="size-5 text-warning" aria-hidden />}
            <h2 className="text-base font-semibold">{hub.ready ? "Pronta para receber lojistas" : `Faltam ${blockers.length} item(ns) para lançar`}</h2>
            <Badge tone={hub.brand.signupOpen ? "success" : "neutral"}>{hub.brand.signupOpen ? "Cadastro aberto" : "Cadastro fechado (lista de espera)"}</Badge>
          </div>
          <ul className="grid gap-2 md:grid-cols-2">
            {hub.checks.map((c) => (
              <li key={c.key} className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm">
                {c.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-label="Ok" /> : <CircleAlert className={cn("mt-0.5 size-4 shrink-0", c.severity === "blocker" ? "text-danger" : "text-warning")} aria-label={c.severity === "blocker" ? "Bloqueia o lançamento" : "Recomendado"} />}
                <div className="min-w-0"><div className="font-medium">{c.label}{!c.ok ? <span className="ml-2 text-xs font-normal text-muted-foreground">{c.severity === "blocker" ? "obrigatório" : "recomendado"}</span> : null}</div><p className="text-xs text-muted-foreground">{c.hint}{c.href && !c.ok ? <> <Link href={c.href} className="font-semibold underline">Abrir</Link></> : null}</p></div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <MetricGrid className="lg:grid-cols-5">
        <MetricCard label="Lojas da marca" value={k.stores} icon={Store} hint={`${k.independent} conta(s) simples · ${k.published} publicada(s)`} href="/master/stores?marca=NEXTLEVEL_COMMERCE" />
        <MetricCard label="Planos pagos" value={k.paying} icon={Wallet} tone="success" hint={`${k.trial} em teste · ${k.awaitingPayment} aguardando Pix`} />
        <MetricCard label="Receita de planos (mês)" value={formatBRL(k.planRevenueMonthCents)} icon={TrendingUp} tone="info" hint="Pagamentos confirmados no mês" />
        <MetricCard label="Vendas das lojas (30 dias)" value={formatCompactBRL(k.gmv30dCents)} icon={ShoppingCart} hint={`${k.orders30d} pedido(s) pagos`} />
        <MetricCard label="Interessados" value={`${k.leadsNew} novo(s)`} icon={Inbox} tone={k.leadsNew ? "warning" : "neutral"} hint={`${k.leadsTotal} no total`} href="/master/crm?tab=interessados" />
      </MetricGrid>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2" aria-labelledby="lojas-commerce">
          <SectionTitle title="Lojas da NextLevel Commerce" description="As 12 mais recentes. Contas simples são lojas abertas sem fornecedor." action={<Link href="/master/stores?marca=NEXTLEVEL_COMMERCE" className={buttonVariants({ variant: "ghost", size: "sm" })}>Ver todas</Link>} />
          {hub.stores.length === 0 ? (
            <EmptyState compact icon={Globe} title="Nenhuma loja ainda" description={hub.brand.signupOpen ? "O cadastro está aberto. As lojas aparecem aqui assim que alguém criar a conta." : "O cadastro está fechado. Abra com BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true no Render, ou crie a primeira loja pelo Master."} />
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border" id="lojas-commerce">
              {hub.stores.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                  <div className="min-w-0 flex-1"><div className="truncate font-medium">{s.name}</div><div className="text-xs text-muted-foreground">/loja/{s.slug} · criada em {formatDate(s.createdAt)} · {s.activeProducts} produto(s) à venda</div></div>
                  {s.independent ? <Badge tone="outline">Conta simples</Badge> : null}
                  <Badge tone={ACCESS[s.access]?.tone ?? "neutral"}>{ACCESS[s.access]?.label ?? s.access}</Badge>
                  <StatusBadge value={s.status} dot />
                  <a href={`/store/${s.slug}`} target="_blank" rel="noreferrer" className="text-xs font-semibold underline">Ver loja</a>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="interessados">
          <SectionTitle title="Interessados recentes" action={<Link href="/master/crm?tab=interessados" className={buttonVariants({ variant: "ghost", size: "sm" })}>Abrir CRM</Link>} />
          {hub.leads.length === 0 ? (
            <EmptyState compact icon={Inbox} title="Sem interessados" description="Quem preencher o 'Quero minha loja' no portal aparece aqui." />
          ) : (
            <ul className="space-y-2" id="interessados">
              {hub.leads.map((l) => (
                <li key={l.id} className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm"><div className="min-w-0 flex-1"><div className="truncate font-medium">{l.name}</div><div className="truncate text-xs text-muted-foreground">{l.storeName ?? "sem nome de loja"} · {formatDate(l.createdAt)}</div></div><Badge tone={l.status === "NEW" ? "warning" : "neutral"}>{LEAD[l.status] ?? l.status}</Badge></li>
              ))}
            </ul>
          )}
          <Card className="mt-4"><CardContent className="space-y-1 pt-5 text-sm"><div className="font-semibold">Atalhos</div><Link className="block underline" href="/master/office?marca=NEXTLEVEL_COMMERCE">Escritório virtual (filtro da marca)</Link><Link className="block underline" href="/master/finance">Financeiro e faturas</Link><Link className="block underline" href="/master/plans">Planos</Link><Link className="block underline" href="/master/settings">Configurações (Mercado Pago, e-mail)</Link></CardContent></Card>
        </section>
      </div>
    </>
  );
}
