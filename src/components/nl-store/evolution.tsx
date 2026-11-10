import Link from "next/link";
import { getDb } from "@/db/client";
import type { Session } from "@/lib/auth";
import { economiaDoAnual, STATUS_LABEL, subscriptionOf } from "@/lib/domain/commerce-plans";
import { nomePlanoEc, nomeProdutoEc } from "@/lib/marcas/nextlevel-ecommerce";
import { getCatalogItem } from "@/lib/domain/nl-catalog";
import { storeJourney } from "@/lib/domain/journey";
import { listOwnCorporateOrders } from "@/lib/domain/corporate-checkout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { CancelSubscription } from "./plan-actions";

/** Âncoras das três áreas do financeiro do cliente (D90). */
export function FinanceAreas() {
  return (
    <nav aria-label="Áreas do financeiro" className="ds-seg nl-scroll mb-6">
      <a href="#operacao">Minha operação</a><a href="#evolucao">Minha evolução com a NextLevel</a><a href="#oportunidades">Oportunidades</a>
    </nav>
  );
}

/** Minha evolução com a NextLevel: plano, teste, oferta, taxa de plataforma e pedidos à NextLevel (só da própria loja). */
export async function CommerceEvolution({ session }: { session: Session }) {
  const db = await getDb();
  const storeId = session.store!.id;
  const sub = await subscriptionOf(db, storeId);
  const orders = await listOwnCorporateOrders(db, session.actor);
  const product = sub ? await getCatalogItem(db, { key: sub.productKey }, { includeUnpublished: true }) : null;
  const now = new Date();
  const holiday = sub?.feeHolidayUntil && new Date(sub.feeHolidayUntil) > now && sub.platformFeeBps > 0;
  // Acesso estendido pelo Master durante o teste (cortesia, D278): mostra uma data só, sem "teste" nem "pago".
  const cortesia = !!sub && sub.status === "trial" && !!sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) > now && (!sub.trialEndsAt || sub.currentPeriodEnd >= sub.trialEndsAt);
  const anual = sub?.cycle === "MONTHLY" ? economiaDoAnual(product?.prices.MONTHLY?.amountCents, product?.prices.ANNUAL?.amountCents) : null;
  return (
    <div className="space-y-4">
      {sub ? (
        <Card><CardContent className="pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-semibold">{nomePlanoEc(product?.name ?? sub.productKey)} · {sub.cycle === "ANNUAL" ? "anual" : "mensal"}</h3><Badge tone={sub.status === "active" || cortesia ? "success" : sub.status === "trial" ? "info" : "warning"}>{cortesia ? "Cortesia" : STATUS_LABEL[sub.status]}</Badge></div>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <li><span className="text-muted-foreground">Valor do plano: </span><strong className="tabular-nums">{formatBRL(sub.amountCents)}{sub.cycle === "ANNUAL" ? " por ano" : " por mês"}</strong></li>
            <li><span className="text-muted-foreground">Taxa de plataforma: </span><strong>{holiday ? `zero até ${formatDate(sub.feeHolidayUntil)}` : `${(sub.platformFeeBps / 100).toString().replace(".", ",")}% sobre vendas pagas`}</strong>{holiday ? <span className="text-muted-foreground"> (depois, {(sub.platformFeeBps / 100).toString().replace(".", ",")}%)</span> : null}</li>
            {cortesia ? <li><span className="text-muted-foreground">Grátis (cortesia da NextLevel) até: </span><strong>{formatDate(sub.currentPeriodEnd)}</strong></li> : null}
            {sub.status === "trial" && sub.trialEndsAt && !cortesia ? <li><span className="text-muted-foreground">Teste grátis até: </span><strong>{formatDate(sub.trialEndsAt)}</strong></li> : null}
            {sub.firstPeriodCents !== null && sub.status !== "active" ? <li><span className="text-muted-foreground">Primeiro mês: </span><strong>{formatBRL(sub.firstPeriodCents)}</strong> (oferta de entrada)</li> : null}
            {sub.currentPeriodEnd && !cortesia ? <li><span className="text-muted-foreground">Pago até: </span><strong>{formatDate(sub.currentPeriodEnd)}</strong>{sub.cancelAtPeriodEnd ? " · cancelamento agendado" : ""}</li> : null}
          </ul>
          {anual ? <p className="mt-3 rounded-lg bg-success-soft px-3 py-2 text-sm">No plano anual você paga {formatBRL(anual.anualCents)} por ano (equivale a {formatBRL(anual.porMesCents)} por mês) e economiza <strong>{formatBRL(anual.economiaCents)}</strong> em relação a 12 mensalidades.</p> : null}
          <p className="mt-3 text-xs text-muted-foreground">O dinheiro das suas vendas é 100% seu e cai na sua conta Mercado Pago. A NextLevel cobra o plano e a taxa em fatura separada, abaixo.</p>
          <div className="mt-3 flex flex-wrap gap-2"><Link href="/merchant/services#fase-FUNDACAO" className="ds-btn ds-btn--secondary ds-btn--sm">Trocar de plano</Link>{!sub.cancelAtPeriodEnd && !["cancelled", "expired"].includes(sub.status) ? <CancelSubscription /> : null}</div>
        </CardContent></Card>
      ) : null}
      {orders.length ? (
        <Card><CardContent className="pt-5">
          <h3 className="font-semibold">Pedidos à NextLevel</h3>
          <ul className="mt-2 divide-y divide-border text-sm">{orders.slice(0, 8).map((o) => <li key={o.id} className="flex flex-wrap justify-between gap-2 py-2"><span>{o.snapshot.productName} · {o.code}</span><span className="tabular-nums">{formatBRL(o.totalCents)} · {o.status === "PAID" ? "pago" : o.status === "PENDING_PAYMENT" ? "aguardando pagamento" : o.status.toLowerCase()}</span></li>)}</ul>
          <Link href="/merchant/services#meus-pedidos" className="mt-2 inline-block text-sm font-semibold text-link underline">Acompanhar entregas</Link>
        </CardContent></Card>
      ) : null}
    </div>
  );
}

/** Oportunidades: próximos passos recomendados pela jornada (educativo e comercial, nunca área administrativa). */
export async function Opportunities({ session }: { session: Session }) {
  const db = await getDb();
  const j = await storeJourney(db, session.actor, session.store!.id);
  const picks = [...j.cards.filter((c) => c.state === "recommended"), ...j.cards.filter((c) => c.state === "available")].slice(0, 3);
  if (!picks.length) return <p className="text-sm text-muted-foreground">Nenhuma recomendação agora. Veja todas as soluções na <Link className="underline" href="/merchant/services">Loja NextLevel</Link>.</p>;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {picks.map((c) => <Link key={c.product.id} href={`/merchant/services/solucao/${c.product.slug}`} className="ds-card block p-4 hover:bg-surface-hover"><p className="text-xs text-muted-foreground">{c.state === "recommended" ? "Recomendado agora" : c.phase.name}</p><p className="font-semibold">{nomeProdutoEc(c.product.name)}</p><p className="mt-1 text-sm text-muted-foreground">{c.product.tagline}</p><span className="mt-2 inline-block text-sm font-semibold text-link">Ver solução →</span></Link>)}
    </div>
  );
}


