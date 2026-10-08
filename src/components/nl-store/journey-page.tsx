import { CheckCircle2, Circle } from "lucide-react";
import { getDb } from "@/db/client";
import type { Session } from "@/lib/auth";
import { isDemoMode } from "@/lib/auth";
import { storeJourney, supplierOffers } from "@/lib/domain/journey";
import { listOwnCorporateOrders, listOwnDeliveries } from "@/lib/domain/corporate-checkout";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { ServicesHub } from "@/components/services/services-hub";
import { getServicesHub } from "@/lib/queries/services-hub";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "./product-card";
import { AcceptDelivery } from "./plan-actions";

const ORDER_LABEL: Record<string, string> = { PENDING_PAYMENT: "Aguardando pagamento", PAID: "Pago", FAILED: "Falhou", EXPIRED: "Expirado", CANCELED: "Cancelado", REFUNDED: "Reembolsado", CHARGEBACK: "Contestado" };
const DELIVERY_LABEL: Record<string, string> = { WAITING_BRIEFING: "Aguardando seu material", IN_PROGRESS: "Em execução", REVIEW: "Em revisão", DELIVERED: "Entregue: falta seu aceite", ACCEPTED: "Concluída", CANCELED: "Cancelada" };

/** Meus pedidos à NextLevel e entregas (só do próprio cliente). */
async function MyNextLevel({ session, base }: { session: Session; base: string }) {
  const db = await getDb();
  const [orders, deliveries] = await Promise.all([listOwnCorporateOrders(db, session.actor), listOwnDeliveries(db, session.actor)]);
  if (!orders.length && !deliveries.length) return null;
  return (
    <section aria-labelledby="meus-nl" className="mb-8" id="meus-pedidos">
      <SectionTitle title="Meus pedidos à NextLevel" description="Compras e entregas da sua conta. A liberação acontece quando o pagamento é confirmado." />
      <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
        {orders.map((o) => <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"><span><strong>{o.snapshot.productName}</strong> · pedido {o.code} · {formatDate(o.createdAt)}</span><span className="flex items-center gap-2"><span className="tabular-nums">{formatBRL(o.totalCents)}</span><Badge tone={o.status === "PAID" ? "success" : o.status === "PENDING_PAYMENT" ? "warning" : "neutral"}>{ORDER_LABEL[o.status]}</Badge></span></li>)}
        {deliveries.map((d) => <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"><span>Entrega de <strong>{d.productKey}</strong>{d.dueAt ? ` · prazo ${formatDate(d.dueAt)}` : ""} · {d.checklist.filter((c) => c.done).length}/{d.checklist.length} etapas</span><span className="flex items-center gap-2"><Badge tone={d.status === "ACCEPTED" ? "success" : "info"}>{DELIVERY_LABEL[d.status]}</Badge>{d.status === "DELIVERED" ? <AcceptDelivery id={d.id} /> : null}</span></li>)}
      </ul>
      <p className="sr-only" id="meus-nl">Meus pedidos</p>
      <p className="mt-2 text-xs text-muted-foreground"><a className="underline" href={`${base}/finance#evolucao`}>Faturas e assinatura</a></p>
    </section>
  );
}

/** Loja NextLevel do lojista: jornada por fases, próximo passo, catálogo completo (bloqueados visíveis), pedidos. */
export async function StoreJourneyPage({ session, base, pedir }: { session: Session; base: string; pedir?: string }) {
  const db = await getDb();
  const j = await storeJourney(db, session.actor, session.store!.id);
  const demo = isDemoMode();
  const next = j.cards.filter((c) => c.state === "recommended").slice(0, 3);
  const hub = await getServicesHub(session);
  const current = j.subscription ? { productKey: j.subscription.productKey, cycle: j.subscription.cycle } : null;
  return (
    <>
      <PageHeader eyebrow="Minha evolução com a NextLevel" title="Loja NextLevel" description="Sua jornada de crescimento: o que já está pronto, o próximo passo recomendado e o que cada solução destrava. Preços e condições são os publicados pela NextLevel." />
      <nav aria-label="Fases da jornada" className="mb-6 rounded-xl border border-border p-4" style={{ background: "var(--ds-glass)", backdropFilter: "blur(14px)" }}>
        <ol className="grid gap-3 md:grid-cols-5">
          {j.phases.map((p, i) => {
            const isCurrent = p.key === j.currentKey; const done = p.done === p.total && p.total > 0;
            return (
              <li key={p.key} aria-current={isCurrent ? "step" : undefined} className={`rounded-lg border p-3 ${isCurrent ? "border-accent bg-accent-soft/40" : "border-border bg-surface"}`}>
                <p className="text-xs text-muted-foreground">Fase {i + 1}{done ? " · concluída" : isCurrent ? " · você está aqui" : ""}</p>
                <p className="font-semibold">{p.name}</p>
                <div className="mt-2 h-1.5 rounded-full bg-surface-muted" role="progressbar" aria-label={`Progresso da fase ${p.name}`} aria-valuemin={0} aria-valuemax={p.total} aria-valuenow={p.done}><div className="h-1.5 rounded-full bg-accent" style={{ width: `${p.total ? Math.round((p.done / p.total) * 100) : 0}%` }} /></div>
                <p className="mt-1 text-xs text-muted-foreground">{p.done} de {p.total} marcos</p>
              </li>
            );
          })}
        </ol>
        {j.phases.filter((p) => p.key === j.currentKey).map((p) => (
          <div key={p.key} className="mt-4 grid gap-3 md:grid-cols-2">
            <div><p className="text-sm font-semibold">{p.goal}</p><p className="mt-1 text-sm text-muted-foreground">{p.explanation}</p></div>
            <ul className="space-y-1 text-sm">{p.items.map((m) => <li key={m.key} className="flex items-center gap-2">{m.done ? <CheckCircle2 className="size-4 text-success" aria-hidden /> : <Circle className="size-4 text-muted-foreground" aria-hidden />}<span>{m.label}</span><span className="sr-only">{m.done ? "(feito)" : "(pendente)"}</span></li>)}</ul>
          </div>
        ))}
      </nav>
      <MyNextLevel session={session} base={base} />
      {next.length ? (
        <section className="mb-8" aria-labelledby="proximo">
          <h2 id="proximo" className="mb-3 text-lg font-semibold">Próximo melhor passo</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{next.map((c) => <ProductCard key={c.product.id} product={c.product} state={c.state} reason={c.reason} base={base} demo={demo} currentPlan={current} />)}</div>
        </section>
      ) : null}
      {j.phases.map((p) => {
        const cards = j.cards.filter((c) => c.phase.key === p.key && !next.includes(c));
        if (!cards.length) return null;
        return (
          <section key={p.key} className="mb-8" aria-labelledby={`fase-${p.key}`}>
            <h2 id={`fase-${p.key}`} className="mb-3 text-lg font-semibold">{p.name}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards.map((c) => <ProductCard key={c.product.id} product={c.product} state={c.state} reason={c.reason} base={base} demo={demo} currentPlan={current} />)}</div>
          </section>
        );
      })}
      {hub.catalog.length ? (
        <section className="mt-10" aria-labelledby="sob-orcamento">
          <h2 id="sob-orcamento" className="mb-1 text-lg font-semibold">Outros serviços sob orçamento</h2>
          <p className="mb-3 text-sm text-muted-foreground">Pedidos sob medida: você descreve, a equipe responde com orçamento. O valor de referência não é preço fechado.</p>
          <ServicesHub catalog={hub.catalog} recommended={hub.recommended} orders={hub.orders} base={base} autoOpenKey={pedir} />
        </section>
      ) : null}
    </>
  );
}

/** Loja NextLevel do fornecedor: produtos da NextLevel para fornecedores e serviços sob orçamento. */
export async function SupplierOffersPage({ session, base, pedir }: { session: Session; base: string; pedir?: string }) {
  const db = await getDb();
  const offers = await supplierOffers(db, session.actor);
  const hub = await getServicesHub(session);
  return (
    <>
      <PageHeader eyebrow="Minha evolução com a NextLevel" title="Loja NextLevel" description="Soluções da NextLevel para fornecedores. O financeiro da sua operação (recargas e saldo) continua em Recargas e Financeiro." />
      <MyNextLevel session={session} base={base} />
      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{offers.map((o) => <ProductCard key={o.product.id} product={o.product} state={o.state} reason={o.state === "quote_required" ? "Peça a proposta: a equipe responde com escopo e valores." : "Disponível para fornecedores."} base={base} demo={isDemoMode()} />)}</div>
      <h2 className="mb-3 text-lg font-semibold">Serviços sob orçamento</h2>
      <ServicesHub catalog={hub.catalog} recommended={hub.recommended} orders={hub.orders} base={base} autoOpenKey={pedir} />
    </>
  );
}
