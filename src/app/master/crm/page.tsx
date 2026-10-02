import Link from "next/link";
import { ExternalLink, Inbox, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { CRM_STAGES, listDigitalProducts, listNlOrders, nlSalesSummary } from "@/lib/domain/nl-sales";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { DigitalProductRow } from "./crm-client";
import { LeadActions } from "./leads-client";
import { LinkTabs } from "@/components/app/link-tabs";
import { listBrandLeads } from "@/lib/domain/brand-leads";
import { brandByCode } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function MasterCrmPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const tab = (await searchParams).tab === "interessados" ? "interessados" : "pedidos";
  const db = await getDb();
  const [orders, summary, products] = await Promise.all([listNlOrders(db, session.actor), nlSalesSummary(db, session.actor), listDigitalProducts(db, { all: true })]);
  const canceled = orders.filter((o) => o.status === "CANCELED");
  const leads = tab === "interessados" ? await listBrandLeads(db, session.actor) : [];
  const tabs = <LinkTabs label="CRM" active={tab} items={[{ key: "pedidos", label: "Pedidos da Loja NextLevel", href: "/master/crm" }, { key: "interessados", label: "Interessados por marca", href: "/master/crm?tab=interessados" }]} />;
  if (tab === "interessados") return (
    <>
      <PageHeader title="CRM · Interessados" description="Pessoas que pediram para abrir uma loja em cada marca (lista de espera e implantação assistida)." />
      {tabs}
      {leads.length === 0 ? <EmptyState compact icon={Inbox} title="Nenhum interessado ainda" description="Quem preencher o formulário de “Quero minha loja” aparece aqui." /> : (
        <ul className="space-y-3">{leads.map((l) => (
          <li key={l.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{l.name}{l.storeName ? <span className="text-muted-foreground"> · {l.storeName}</span> : null}</p><p className="text-xs text-muted-foreground">{brandByCode(l.brand).name} · {l.email} · {l.phone} · {formatDateTime(l.createdAt)}{l.segment ? ` · ${l.segment}` : ""}{l.affiliateRef ? ` · indicação ${l.affiliateRef}` : ""}</p></div><a href={`https://wa.me/${l.phone.startsWith("55") ? l.phone : `55${l.phone}`}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent-foreground hover:underline">Chamar no WhatsApp</a></div>
            {l.message ? <p className="mt-2 rounded bg-surface-muted p-2 text-sm">{l.message}</p> : null}
            <div className="mt-3"><LeadActions id={l.id} status={l.status} notes={l.notes} /></div>
          </li>
        ))}</ul>
      )}
    </>
  );
  return (
    <>
      <PageHeader title="CRM · Loja NextLevel" description="Pedidos que chegam da Loja NextLevel pública: da cobrança à entrega, com anotações de cada contato." actions={<Link href="/loja-nextlevel" target="_blank" className="inline-flex items-center gap-1 text-sm font-medium text-accent-foreground hover:underline">Ver a loja pública <ExternalLink className="size-3.5" aria-hidden /></Link>} />
      {tabs}
      <OperationalPulse className="mb-6" items={[
        { label: "Para contatar", value: summary.toContact, icon: Inbox, tone: summary.toContact ? "warning" : "success", hint: "pagos sem contato" },
        { label: "Em andamento", value: summary.active, icon: Users, tone: "info", hint: "contato ou execução" },
        { label: "Receita do mês", value: formatBRL(summary.revenueMonthCents), icon: TrendingUp, tone: "success", hint: formatBRL(summary.revenueCents) + " no total" },
        { label: "Aguardando pagamento", value: summary.awaiting, icon: ShoppingCart, tone: summary.awaiting ? "warning" : "neutral", hint: "checkout iniciado" },
      ]} />

      <SectionTitle title="Funil de pedidos" description="Cada coluna é uma etapa. Abra o cartão para falar com o cliente e avançar." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" data-testid="crm-board">
        {CRM_STAGES.map((stage) => {
          const col = orders.filter((o) => o.status === stage.status);
          return (
            <section key={stage.status} aria-label={stage.label} className="rounded-xl border border-border bg-surface-muted/50 p-3">
              <header className="mb-3"><h3 className="text-sm font-semibold">{stage.label} <span className="ml-1 rounded-full bg-surface px-2 py-0.5 text-xs tabular-nums text-muted-foreground">{col.length}</span></h3><p className="text-xs text-muted-foreground">{stage.hint}</p></header>
              {col.length === 0 ? <p className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">Vazio</p> : (
                <ul className="space-y-2">{col.map((o) => (
                  <li key={o.id}>
                    <Link href={`/master/crm/${o.id}`} className="block rounded-lg border border-border bg-surface p-3 text-sm shadow-xs transition hover:border-accent hover:shadow-sm focus-visible:outline-2 focus-visible:outline-accent">
                      <span className="block font-medium">{o.productName}</span>
                      <span className="block text-xs text-muted-foreground">#{o.number} · {o.buyerName}</span>
                      <span className="mt-1 flex justify-between text-xs"><span className="tabular-nums font-semibold">{formatBRL(o.chargedCents)}</span><span className="text-muted-foreground">{formatDateTime(o.createdAt)}</span></span>
                    </Link>
                  </li>
                ))}</ul>
              )}
            </section>
          );
        })}
      </div>
      {canceled.length ? <p className="mt-3 text-xs text-muted-foreground">{canceled.length} pedido(s) cancelado(s) fora do quadro.</p> : null}
      {orders.length === 0 ? <div className="mt-6"><EmptyState compact icon={Inbox} title="Nenhum pedido ainda" description="Quando alguém comprar na Loja NextLevel, o pedido aparece aqui." /></div> : null}

      <div className="mt-10">
        <SectionTitle title="Vitrine pública" description="Preço cheio (o do cartão em até 6x), destaque e visibilidade. O Pix mostra o desconto configurado na tabela de preços." />
        <Card><CardContent className="space-y-2 pt-4">{products.map((p) => <DigitalProductRow key={p.id} id={p.id} name={p.name} priceCents={p.priceCents} active={p.active} featured={p.featured} />)}</CardContent></Card>
      </div>
    </>
  );
}
