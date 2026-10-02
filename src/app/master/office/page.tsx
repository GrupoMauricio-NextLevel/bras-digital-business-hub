import { masterBrandFilter } from "@/lib/brand-server";
import Link from "next/link";
import { Coins, Repeat, Rocket, Sparkles } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { LinkTabs } from "@/components/app/link-tabs";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { EmptyState } from "@/components/app/empty-state";
import { StatusBadge } from "@/components/app/status-badge";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { nextlevelOffice } from "@/lib/domain/nextlevel-office";
import { nlSalesSummary } from "@/lib/domain/nl-sales";
import { formatBRL } from "@/lib/money";
import { PRODUCT_BRANDS, brandByCode } from "@/lib/brand";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const num = "text-right tabular-nums";
const TABS = [{ key: "assinaturas", label: "Assinaturas" }, { key: "ativacoes", label: "Ativações" }, { key: "servicos", label: "Serviços" }, { key: "vendas", label: "Vendas digitais" }];
const SVC_LABEL: Record<string, string> = { REQUESTED: "Novo", IN_ANALYSIS: "Em análise", QUOTED: "Orçado", IN_PROGRESS: "Em execução", DELIVERED: "Entregue", CANCELED: "Cancelado" };

export default async function MasterOfficePage({ searchParams }: { searchParams: Promise<{ tab?: string; marca?: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const { tab: raw, marca: rawMarca } = await searchParams;
  const marca = await masterBrandFilter(rawMarca);
  const tab = TABS.some((t) => t.key === raw) ? raw! : "assinaturas";
  const db = await getDb();
  const [o, sales] = await Promise.all([nextlevelOffice(db, session.actor, new Date(), marca), nlSalesSummary(db, session.actor)]);
  const mrr = o.subscriptions.storeMrrCents + o.subscriptions.supplierMrrCents;
  return (
    <>
      <PageHeader title="Escritório virtual" description="A receita própria da NextLevel separada por origem: assinaturas, ativações, serviços e vendas digitais." />
      <MetricGrid className="mb-8">
        <MetricCard label="Recorrência mensal" value={formatBRL(mrr)} icon={Repeat} tone="success" hint={`${formatBRL(o.subscriptions.storeMrrCents)} lojas + ${formatBRL(o.subscriptions.supplierMrrCents)} fornecedores`} />
        <MetricCard label="Ativações do mês" value={formatBRL(o.activations.paidMonthCents)} icon={Rocket} tone="info" hint={`${formatBRL(o.activations.paidCents)} no total`} />
        <MetricCard label="Serviços" value={formatBRL(o.services.deliveredCents)} icon={Sparkles} hint={`${o.services.open} aberto(s), ${formatBRL(o.services.pipelineCents)} em orçamento/execução`} />
        <MetricCard label="Vendas digitais (mês)" value={formatBRL(sales.revenueMonthCents)} icon={Coins} tone="success" hint={`${sales.toContact} para contatar`} />
      </MetricGrid>
      <LinkTabs label="Origem da receita" active={tab} items={TABS.map((t) => ({ ...t, href: `/master/office?tab=${t.key}&marca=${marca ?? "todas"}` }))} />
      <div className="mb-4 flex flex-wrap gap-2 text-xs" role="group" aria-label="Filtrar por marca">{[["todas", "Todas as marcas"], ...PRODUCT_BRANDS.map((c) => [c, brandByCode(c).name])].map(([k, l]) => <Link key={k} href={`/master/office?tab=${tab}&marca=${k}`} aria-current={(marca ?? "todas") === k ? "true" : undefined} className={`rounded-full border px-3 py-1 font-medium ${(marca ?? "todas") === k ? "border-accent bg-accent-soft" : "border-border text-muted-foreground"}`}>{l}</Link>)}</div>

      {tab === "assinaturas" ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground">Lojas: {o.subscriptions.counts.paid} pagantes · {o.subscriptions.counts.trial} em teste · {o.subscriptions.counts.blocked} bloqueadas · {o.subscriptions.counts.free} sem plano.</p>
          <SectionTitle title="Lojas dos membros" />
          <Card><Table>
            <THead><TR><TH>Loja</TH><TH>Fornecedor</TH><TH>Plano</TH><TH>Acesso</TH><TH>Até</TH><TH className={num}>Mensalidade</TH></TR></THead>
            <TBody>{o.subscriptions.stores.map((s) => <TR key={s.storeId}><TD className="font-medium">{s.name}</TD><TD>{s.supplierName}</TD><TD><StatusBadge value={s.offer} /></TD><TD><StatusBadge value={s.state} /></TD><TD>{s.endsAt ? formatDate(s.endsAt) : "—"}{s.daysLeft ? <span className="text-xs text-muted-foreground"> · {s.daysLeft} dia(s)</span> : null}</TD><TD className={num}>{formatBRL(s.monthlyCents)}</TD></TR>)}</TBody>
          </Table></Card>
          <div className="mt-8"><SectionTitle title="Fornecedores" /></div>
          <Card><Table>
            <THead><TR><TH>Fornecedor</TH><TH>Modelo</TH><TH>Situação</TH><TH className={num}>Mensalidade</TH></TR></THead>
            <TBody>{o.subscriptions.suppliers.map((s) => <TR key={s.supplierId}><TD className="font-medium">{s.name}</TD><TD><StatusBadge value={s.model} /></TD><TD><StatusBadge value={s.status} /></TD><TD className={num}>{formatBRL(s.monthlyCents)}</TD></TR>)}</TBody>
          </Table></Card>
        </>
      ) : null}

      {tab === "ativacoes" ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground">{o.activations.paidCount} ativação(ões) paga(s) · {formatBRL(o.activations.openCents)} ainda em aberto.</p>
          {o.activations.rows.length === 0 ? <EmptyState compact icon={Rocket} title="Nenhuma ativação ainda" description="Setups de lojas e fornecedores aparecem aqui." /> : (
            <Card><Table>
              <THead><TR><TH>Cliente</TH><TH>Tipo</TH><TH>Descrição</TH><TH>Situação</TH><TH>Pago em</TH><TH className={num}>Valor</TH></TR></THead>
              <TBody>{o.activations.rows.map((r) => <TR key={r.id}><TD className="font-medium">{r.payer}</TD><TD>{r.payerType === "STORE" ? "Loja" : "Fornecedor"}</TD><TD className="max-w-xs truncate">{r.description}</TD><TD><StatusBadge value={r.status} /></TD><TD>{r.paidAt ? formatDate(r.paidAt) : "—"}</TD><TD className={num}>{formatBRL(r.amountCents)}</TD></TR>)}</TBody>
            </Table></Card>
          )}
        </>
      ) : null}

      {tab === "servicos" ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground">Serviços contratados por lojistas e fornecedores dentro do painel. A conversa e o orçamento ficam na <Link className="font-medium text-accent-foreground hover:underline" href="/master/services">fila de serviços</Link>.</p>
          {o.services.rows.length === 0 ? <EmptyState compact icon={Sparkles} title="Nenhum serviço contratado" /> : (
            <Card><Table>
              <THead><TR><TH>Serviço</TH><TH>Situação</TH><TH>Pedido em</TH><TH className={num}>Orçamento</TH></TR></THead>
              <TBody>{o.services.rows.map((r) => <TR key={r.id}><TD className="font-medium"><Link className="hover:underline" href={`/master/services/${r.id}`}>{r.name}</Link></TD><TD>{SVC_LABEL[r.status]}</TD><TD>{formatDate(r.createdAt)}</TD><TD className={num}>{r.quotedCents ? formatBRL(r.quotedCents) : "—"}</TD></TR>)}</TBody>
            </Table></Card>
          )}
        </>
      ) : null}

      {tab === "vendas" ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground">Pedidos da <Link className="font-medium text-accent-foreground hover:underline" href="/loja-nextlevel" target="_blank">Loja NextLevel pública</Link>, do pagamento à entrega, no CRM.</p>
          <MetricGrid>
            <MetricCard label="Para contatar" value={sales.toContact} tone={sales.toContact ? "warning" : "neutral"} />
            <MetricCard label="Em andamento" value={sales.active} tone="info" />
            <MetricCard label="Receita total" value={formatBRL(sales.revenueCents)} tone="success" />
            <MetricCard label="Aguardando pagamento" value={sales.awaiting} />
          </MetricGrid>
          <Link href="/master/crm" className={`${buttonVariants()} mt-6`}>Abrir o CRM</Link>
        </>
      ) : null}
    </>
  );
}
