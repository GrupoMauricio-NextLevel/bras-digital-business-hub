import Link from "next/link";
import { CheckCircle2, Clock, Lock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FAMILY_LABEL, KIND_LABEL, PHASE_LABEL, priceLines } from "@/lib/finance/catalog-labels";
import { priceDisplay } from "@/lib/finance/catalog-pricing";
import { STATE_LABEL, type ProductState } from "@/lib/domain/journey";
import type { CatalogItem } from "@/lib/domain/nl-catalog";
import { toPriceRule } from "@/lib/domain/nl-catalog";
import { CheckoutDialog, type CheckoutPrice } from "./checkout-dialog";
import { ChoosePlan, RequestQuote } from "./plan-actions";

export function checkoutPriceOf(p: CatalogItem): CheckoutPrice | null {
  const v = p.prices.ONE_TIME;
  if (!v || v.amountCents === null) return null;
  const d = priceDisplay(toPriceRule(v));
  return { baseCents: v.amountCents, pixCents: d?.pix?.totalCents ?? null, pixDiscountPct: v.pixDiscountBps / 100, cardTotalCents: d?.card?.totalCents ?? null, cardMaxInstallments: v.cardMaxInstallments, cardMarkupPct: v.cardMarkupBps / 100 };
}

const TONE: Record<ProductState, "success" | "info" | "warning" | "neutral" | "danger" | "brand"> = { available: "neutral", recommended: "info", in_progress: "warning", completed: "success", locked: "neutral", not_eligible: "neutral", quote_required: "brand" };
const ICON: Partial<Record<ProductState, typeof Lock>> = { locked: Lock, completed: CheckCircle2, in_progress: Clock, recommended: Sparkles };

/** Card completo da Loja NextLevel: fase, problema/resultado, escopo, prazo, preço explicado, estado e ação contextual. */
export function ProductCard({ product: p, state, reason, base, demo, currentPlan }: { product: CatalogItem; state: ProductState; reason: string; base: string; demo: boolean; currentPlan?: { productKey: string; cycle: string } | null }) {
  const lines = priceLines(p);
  const Icon = ICON[state];
  const landing = `${base}/services/solucao/${p.slug}`;
  const price = checkoutPriceOf(p);
  const canBuy = state === "available" || state === "recommended";
  return (
    <article className={`ds-card flex flex-col p-5 ${state === "recommended" ? "ring-2 ring-accent" : ""}`} aria-labelledby={`pc-${p.key}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone="outline">{FAMILY_LABEL[p.family]}</Badge>
        <span className="text-xs text-muted-foreground">Fase: {PHASE_LABEL[p.phase]}</span>
        <Badge tone={TONE[state]} icon={Icon ? <Icon className="size-3" aria-hidden /> : undefined}>{STATE_LABEL[state]}</Badge>
      </div>
      <h3 id={`pc-${p.key}`} className="text-base font-semibold">{p.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{p.content.problem}</p>
      <p className="mt-2 text-sm"><span className="font-semibold">Resultado esperado: </span>{p.content.outcome}</p>
      <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">{p.content.scope.slice(0, 3).map((s) => <li key={s}>• {s}</li>)}{p.content.scope.length > 3 ? <li>• e mais {p.content.scope.length - 3} itens</li> : null}</ul>
      {p.deliveryDays ? <p className="mt-2 text-xs text-muted-foreground">Prazo estimado: até {p.deliveryDays} dias úteis</p> : null}
      <div className="mt-3 rounded-md bg-surface-muted p-3">
        <p className="text-lg font-bold tabular-nums">{lines.main} <span className="text-xs font-normal text-muted-foreground">{KIND_LABEL[p.kind].toLowerCase()}</span></p>
        <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">{lines.details.map((d) => <li key={d}>{d}</li>)}</ul>
      </div>
      <p className="mt-3 text-xs" role="note">{reason}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {state === "locked" || state === "not_eligible" ? <Link href={landing} className="ds-btn ds-btn--secondary">Entender esta solução</Link> : null}
        {state === "completed" ? <Link href={landing} className="ds-btn ds-btn--secondary">Ver solução</Link> : null}
        {state === "in_progress" ? <Link href={`${base}/finance#evolucao`} className="ds-btn ds-btn--secondary">Continuar jornada</Link> : null}
        {state === "quote_required" ? <RequestQuote productKey={p.key} productName={p.name} /> : null}
        {canBuy && p.family === "COMMERCE_PLAN" && p.kind === "subscription" ? <ChoosePlan productKey={p.key as never} current={currentPlan} /> : null}
        {canBuy && p.kind === "one_time" && price ? <CheckoutDialog productKey={p.key} productName={p.name} price={price} policy={p.content.policy} returnPath={`${base}/services`} demo={demo} triggerLabel={state === "recommended" ? "Contratar agora" : "Contratar"} /> : null}
        {state !== "locked" && state !== "not_eligible" && state !== "completed" ? <Link href={landing} className="text-sm font-semibold text-link underline">Ver solução</Link> : null}
      </div>
    </article>
  );
}
