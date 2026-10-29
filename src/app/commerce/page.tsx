import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getBrandHub } from "@/lib/domain/commerce-hub";
import { getCommerceConsole } from "@/lib/domain/commerce-console";
import { DEGRAUS, funilEcommerce } from "@/lib/domain/funil-ecommerce";
import { formatBRL } from "@/lib/money";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard } from "@/components/app/metric-card";
import { EmptyState } from "@/components/app/empty-state";
import { StatusBadge } from "@/components/app/status-badge";

export const dynamic = "force-dynamic";

export default async function CommercePage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [hub, consoleData, funil] = await Promise.all([getBrandHub(db, session.actor), getCommerceConsole(db, session.actor), funilEcommerce(db, session.actor)]);
  const k = consoleData.kpis;
  const blockers = hub.checks.filter((c) => c.severity === "blocker" && !c.ok);

  return (
    <>
      <PageHeader eyebrow="NextLevel E-commerce · Administração" title="Lojas digitais, como um negócio" description="Só as operações da NextLevel E-commerce: lojas, assinaturas, vendas, catálogo e aquisição de novos lojistas." />

      <section className="ds-kpis mb-6" aria-label="Resumo da E-commerce">
        <MetricCard label="Lojas" value={k.stores} hint={`${k.published} publicadas · desde o início`} />
        <MetricCard label="Pagantes" value={k.paying} hint={`${k.trial} em teste${k.cortesia ? ` · ${k.cortesia} cortesia` : ""}`} />
        <MetricCard label="Vendas · mês" value={formatBRL(k.salesMonthCents)} hint={`${k.ordersMonth} pedidos pagos`} />
        <MetricCard label="Receita mensal" value={formatBRL(k.mrrCents)} hint={`${formatBRL(k.planRevenueMonthCents)} recebido no mês`} />
        <MetricCard label="Leads" value={k.leadsNew} hint={`${k.leadsTotal} no funil`} />
      </section>

      <section aria-labelledby="h-funil" className="ds-card mb-6">
        <SectionTitle title="Funil de ativação: do cadastro ao lojista pagante" description={`Meta: 10 lojistas pagantes. Hoje: ${funil.pagantes}. Cada degrau conta quem já passou por ele e por todos os anteriores.`} />
        <h2 id="h-funil" className="sr-only">Funil de ativação</h2>
        {funil.total ? (
          <ol className="grid gap-2">
            {funil.degraus.map((d, i) => (
              <li key={d.key} className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm">
                <span className="truncate"><span className="font-mono text-xs text-muted-foreground">{i + 1}.</span> {d.rotulo}</span>
                <span className="h-3 overflow-hidden rounded-full border border-border bg-surface-muted" aria-hidden><span className="block h-full bg-[var(--brand-primary)]" style={{ width: `${d.pct}%` }} /></span>
                <span className="text-right tabular-nums"><b>{d.n}</b> <span className="text-xs text-muted-foreground">({d.pct}%)</span></span>
              </li>
            ))}
          </ol>
        ) : <EmptyState compact title="Nenhuma loja ainda" description="O funil aparece quando a primeira loja for criada." />}
        {funil.paradas.length ? (
          <>
            <h3 className="mt-5 text-sm font-bold">Onde cada loja parou</h3>
            <ul className="mt-2 divide-y divide-border">
              {funil.paradas.slice(0, 8).map((l) => (
                <li key={l.storeId} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span className="min-w-0"><b>{l.nome}</b> <span className="text-xs text-muted-foreground">· parou em “{DEGRAUS.find((d) => d.key === l.parouEm)?.rotulo}” · {l.diasParada} dia(s) desde o cadastro</span></span>
                  <span className="text-xs">Próximo passo: {l.passo}</span>
                </li>
              ))}
            </ul>
            <Link href="/commerce/stores" className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[var(--ds-link)]">Abrir as lojas e ajudar (ver como lojista) <ArrowRight className="size-4" aria-hidden /></Link>
          </>
        ) : null}
      </section>

      <div className="ds-grid ds-grid--main">
        <section className="ds-card">
          <SectionTitle title="Lojas em operação" action={<Link href="/commerce/stores" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-[var(--ds-link)]">Ver todas <ArrowRight className="size-4" aria-hidden /></Link>} />
          {consoleData.stores.length ? (
            <ul className="divide-y divide-border">
              {consoleData.stores.slice(0, 6).map(({ store, access }) => (
                <li key={store.id}><Link href="/commerce/stores" className="group flex min-h-16 items-center gap-4 py-3">
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{store.name}</span><span className="block truncate text-xs text-muted-foreground">/{store.slug}</span></span>
                  <span className="ds-hide-compact text-xs text-muted-foreground">{store.publishedAt ? "Publicada" : "Rascunho"}</span>
                  <StatusBadge value={access.state} dot={false} />
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden />
                </Link></li>
              ))}
            </ul>
          ) : <EmptyState compact title="Nenhuma loja Commerce ainda" description="As lojas aparecem aqui assim que forem criadas." />}
        </section>

        <section className="ds-card">
          <SectionTitle title="Prontidão da plataforma" description={`${blockers.length} bloqueio(s) para lançamento`} />
          <ul className="divide-y divide-border">
            {hub.checks.slice(0, 5).map((c) => (
              <li key={c.key} className="flex gap-3 py-3">
                {c.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />}
                <div className="min-w-0"><div className="text-sm font-bold">{c.label}</div><div className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{c.hint}</div></div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
