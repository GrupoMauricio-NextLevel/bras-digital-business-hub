import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getBrandHub } from "@/lib/domain/commerce-hub";
import { getCommerceConsole } from "@/lib/domain/commerce-console";
import { formatBRL } from "@/lib/money";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard } from "@/components/app/metric-card";
import { EmptyState } from "@/components/app/empty-state";
import { StatusBadge } from "@/components/app/status-badge";

export const dynamic = "force-dynamic";

export default async function CommercePage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [hub, consoleData] = await Promise.all([getBrandHub(db, session.actor), getCommerceConsole(db, session.actor)]);
  const k = consoleData.kpis;
  const blockers = hub.checks.filter((c) => c.severity === "blocker" && !c.ok);

  return (
    <>
      <PageHeader eyebrow="NextLevel E-commerce · Administração" title="Lojas digitais, como um negócio" description="Só as operações da NextLevel E-commerce: lojas, assinaturas, vendas, catálogo e aquisição de novos lojistas." />

      <section className="ds-kpis mb-6" aria-label="Resumo da Commerce">
        <MetricCard label="Lojas" value={k.stores} hint={`${k.published} publicadas`} />
        <MetricCard label="Assinantes" value={k.paying} hint={`${k.trial} em teste`} />
        <MetricCard label="Vendas · mês" value={formatBRL(k.salesMonthCents)} hint={`${k.ordersMonth} pedidos pagos`} />
        <MetricCard label="Receita SaaS" value={formatBRL(k.planRevenueMonthCents)} hint="planos pagos no mês" />
        <MetricCard label="Leads" value={k.leadsNew} hint={`${k.leadsTotal} no funil`} />
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
