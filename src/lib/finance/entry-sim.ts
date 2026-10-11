/**
 * Simulador da porta de entrada (D125, fase P4 do prompt de público e preço). Funções puras, valores em centavos e
 * pontos-base. Compara o modelo de hoje (teste curto e bloqueio) com a proposta "grátis para começar, paga quando cresce"
 * (plano grátis com taxa sobre a venda, teste reverso, anual "pague 8, leve 12" e cashback em pontos do Club).
 */
import { pct } from "./engine";

export type LadderPlan = { key: string; name: string; monthlyCents: number; feeBps: number; perOrderCents: number };
export type EntryModel = {
  label: string;
  /** Primeiro degrau grátis (mensalidade 0) que fica para sempre; sem ele, quem não assina sai. */
  freeTier: boolean;
  ladder: LadderPlan[];
  annual: { paidMonths: number; getMonths: number };
  /** Parte da mensalidade que volta em pontos do Club. */
  cashbackBps: number;
};
export type Scenario = {
  key: "PESSIMISTA" | "BASE" | "OTIMISTA";
  signupsPerMonth: number;
  /** % dos cadastros que chegam a vender. */
  activationPct: number;
  /** Venda mensal de quem vende (centavos) e ticket médio (para a taxa por pedido). */
  gmvPerActiveCents: number;
  avgOrderCents: number;
  /** % dos cadastros que assinam: com a proposta e no modelo de hoje. */
  paidConversionPct: number;
  currentConversionPct: number;
  annualSharePct: number;
  monthlyChurnBps: number;
  /** % de quem assina em cada plano pago (na ordem da escada, sem o grátis). */
  paidMix: number[];
};
export type SimCosts = { infraPerStoreCents: number; collectionFeeBps: number; serviceMarginBps: number };
export type EntryMonth = { month: number; freeStores: number; paidStores: number; revenueCents: number; costCents: number; netCents: number };
export type EntryResult = { months: EntryMonth[]; revenueCents: number; netCents: number; lastMonthRevenueCents: number; lastMonthNetCents: number; stores: number };

const paidPlans = (m: EntryModel) => m.ladder.filter((p, i) => !(m.freeTier && i === 0));
/** Mensalidade efetiva de um plano, com a parte de quem paga anual ("pague 8, leve 12" = 8/12 do preço). */
export const effectiveMonthly = (p: LadderPlan, m: EntryModel, annualSharePct: number) =>
  Math.round(p.monthlyCents * (1 - annualSharePct / 100) + ((p.monthlyCents * m.annual.paidMonths) / m.annual.getMonths) * (annualSharePct / 100));
/** O que um cliente que vende `gmv` paga ao grupo por mês num plano (mensalidade + taxa + taxa por pedido). */
export const planCharge = (p: LadderPlan, m: EntryModel, gmvCents: number, avgOrderCents: number, annualSharePct: number) =>
  effectiveMonthly(p, m, annualSharePct) + pct(gmvCents, p.feeBps) + (avgOrderCents > 0 ? Math.round((gmvCents / avgOrderCents) * p.perOrderCents) : 0);

/** Custo de servir um cliente por mês: infraestrutura, cobrança e o custo real do cashback (ponto vale serviço com margem). */
export const serveCost = (revenueCents: number, monthlyCents: number, m: EntryModel, c: SimCosts) =>
  c.infraPerStoreCents + pct(revenueCents, c.collectionFeeBps) + Math.round(pct(monthlyCents, m.cashbackBps) * (1 - c.serviceMarginBps / 10_000));

/** Venda mensal a partir da qual um plano pago sai mais barato que o grátis (o "quando o plano se paga" do painel). */
export function breakEvenGmvCents(free: LadderPlan, plan: LadderPlan, avgOrderCents: number): number | null {
  // Custo por real vendido em cada degrau (taxa + taxa por pedido diluída no ticket).
  const rate = (p: LadderPlan) => p.feeBps / 10_000 + (avgOrderCents > 0 ? p.perOrderCents / avgOrderCents : 0);
  const diff = rate(free) - rate(plan);
  if (diff <= 0) return null;
  return Math.ceil((plan.monthlyCents - free.monthlyCents) / diff);
}

/** 12 meses (ou `months`) de um modelo num cenário. `useCurrentConversion` usa a conversão de hoje. */
export function simulateEntry(m: EntryModel, s: Scenario, c: SimCosts, opts: { months?: number; useCurrentConversion?: boolean } = {}): EntryResult {
  const months = opts.months ?? 12;
  const plans = paidPlans(m);
  const mixTotal = s.paidMix.slice(0, plans.length).reduce((a, b) => a + b, 0) || 1;
  const conv = (opts.useCurrentConversion ? s.currentConversionPct : s.paidConversionPct) / 100;
  const keep = 1 - s.monthlyChurnBps / 10_000;
  // Receita e custo por cliente pago (média ponderada pela escolha de plano) e por cliente grátis.
  const paidUnit = plans.reduce((acc, p, i) => {
    const w = (s.paidMix[i] ?? 0) / mixTotal;
    const rev = planCharge(p, m, s.gmvPerActiveCents, s.avgOrderCents, s.annualSharePct);
    return { rev: acc.rev + w * rev, cost: acc.cost + w * serveCost(rev, effectiveMonthly(p, m, s.annualSharePct), m, c) };
  }, { rev: 0, cost: 0 });
  const free = m.freeTier ? m.ladder[0]! : null;
  const freeRev = free ? (s.activationPct / 100) * planCharge(free, m, s.gmvPerActiveCents, s.avgOrderCents, 0) : 0;
  const freeCost = free ? serveCost(freeRev, 0, m, c) : 0;

  let paid = 0, freeStores = 0;
  const out: EntryMonth[] = [];
  for (let month = 1; month <= months; month++) {
    const newPaid = s.signupsPerMonth * conv;
    paid = paid * keep + newPaid;
    freeStores = m.freeTier ? freeStores * keep + (s.signupsPerMonth - newPaid) : 0;
    const revenueCents = Math.round(paid * paidUnit.rev + freeStores * freeRev);
    const costCents = Math.round(paid * paidUnit.cost + freeStores * freeCost);
    out.push({ month, freeStores: Math.round(freeStores), paidStores: Math.round(paid), revenueCents, costCents, netCents: revenueCents - costCents });
  }
  const last = out[out.length - 1]!;
  return { months: out, revenueCents: out.reduce((a, x) => a + x.revenueCents, 0), netCents: out.reduce((a, x) => a + x.netCents, 0), lastMonthRevenueCents: last.revenueCents, lastMonthNetCents: last.netCents, stores: last.freeStores + last.paidStores };
}

export type PlanCheck = { key: string; name: string; chargeCents: number; costCents: number; marginCents: number; ok: boolean; breakEvenGmvCents: number | null };
/**
 * Guarda-corpos da fase P4 no cenário base: o grátis cobre o custo de servir (considerando que só uma parte vende) e
 * nenhum plano pago custa ao grupo mais do que rende.
 */
export function entryChecks(m: EntryModel, base: Scenario, c: SimCosts) {
  const free = m.freeTier ? m.ladder[0]! : null;
  const freeRev = free ? Math.round((base.activationPct / 100) * planCharge(free, m, base.gmvPerActiveCents, base.avgOrderCents, 0)) : 0;
  const freeCost = free ? serveCost(freeRev, 0, m, c) : 0;
  const plans: PlanCheck[] = paidPlans(m).map((p) => {
    const charge = planCharge(p, m, base.gmvPerActiveCents, base.avgOrderCents, base.annualSharePct);
    const cost = serveCost(charge, effectiveMonthly(p, m, base.annualSharePct), m, c);
    return { key: p.key, name: p.name, chargeCents: charge, costCents: cost, marginCents: charge - cost, ok: charge >= cost, breakEvenGmvCents: free ? breakEvenGmvCents(free, p, base.avgOrderCents) : null };
  });
  return { free: free ? { revenueCents: freeRev, costCents: freeCost, ok: freeRev >= freeCost } : null, plans, ok: (!free || freeRev >= freeCost) && plans.every((p) => p.ok) };
}
