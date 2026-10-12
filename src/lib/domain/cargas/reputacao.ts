import { and, eq, gte, inArray, isNotNull } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { platformSettings, trCarrierUsers, trCarriers, trLoadRatings, trLoads, trParcels } from "@/db/schema";
import { requireMaster, requireMasterFn, type Actor } from "../access";
import { recordAudit } from "../audit";

/**
 * Reputação do parceiro de transporte (D134, fase P5F): Bronze, Prata e Ouro, calculada só com dados reais dos últimos
 * 180 dias (entregas concluídas, avaliação das importadoras, recusas e fardos que não embarcaram). Regras no Master.
 * O destaque é sempre rotulado e nunca esconde as outras transportadoras.
 */
export const REPUTATION_TIERS = ["BRONZE", "PRATA", "OURO"] as const;
export type ReputationTier = (typeof REPUTATION_TIERS)[number];
export const TIER_LABEL: Record<ReputationTier, string> = { BRONZE: "Bronze", PRATA: "Prata", OURO: "Ouro" };
const tierRule = z.object({ minDeliveries: z.number().int().min(0).max(10_000), minRating: z.number().min(0).max(5), maxRefusalPct: z.number().int().min(0).max(100) });
export const reputationRulesSchema = z.object({
  PRATA: tierRule, OURO: tierRule,
  /** Vantagem do Ouro (D139): pontos-base a menos na comissão da NextLevel sobre o frete. */
  ouroCommissionDiscountBps: z.number().int().min(0).max(1_000).default(100),
});
export type ReputationRules = z.output<typeof reputationRulesSchema>;
export const DEFAULT_REPUTATION: ReputationRules = { PRATA: { minDeliveries: 10, minRating: 4, maxRefusalPct: 20 }, OURO: { minDeliveries: 30, minRating: 4.5, maxRefusalPct: 10 }, ouroCommissionDiscountBps: 100 };
const KEY = "parceiros.reputacao";

export async function getReputationRules(db: Database): Promise<ReputationRules> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) });
  const p = reputationRulesSchema.safeParse(row?.value);
  return p.success ? p.data : DEFAULT_REPUTATION;
}
export async function saveReputationRules(db: Database, actor: Actor, raw: z.input<typeof reputationRulesSchema>) {
  requireMasterFn(actor, ["FINANCEIRO"]);
  const before = await getReputationRules(db);
  const v = reputationRulesSchema.parse(raw);
  await db.insert(platformSettings).values({ key: KEY, value: v, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value: v, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  await recordAudit(db, actor, { action: "REPUTATION_RULES", entityType: "platform_settings", entityId: KEY, before, after: v }, { force: true });
  return v;
}

export type ReputationSignals = { deliveries: number; rating: number | null; ratings: number; refusalPct: number; notBoarded: number };

/** Conta pura: em que nível os sinais caem e o que falta para o próximo. */
export function tierOf(s: ReputationSignals, rules: ReputationRules): { tier: ReputationTier; next: { tier: ReputationTier; missing: string[] } | null } {
  const meets = (r: ReputationRules["PRATA"]) => s.deliveries >= r.minDeliveries && (s.rating ?? 0) >= r.minRating && s.refusalPct <= r.maxRefusalPct;
  const missing = (r: ReputationRules["PRATA"]) => [
    s.deliveries < r.minDeliveries ? `${r.minDeliveries - s.deliveries} entrega(s) a mais` : null,
    (s.rating ?? 0) < r.minRating ? `avaliação média ${r.minRating.toLocaleString("pt-BR")} ou mais (hoje ${s.rating === null ? "sem avaliação" : s.rating.toLocaleString("pt-BR")})` : null,
    s.refusalPct > r.maxRefusalPct ? `recusar no máximo ${r.maxRefusalPct}% das chamadas (hoje ${s.refusalPct}%)` : null,
  ].filter((x): x is string => !!x);
  if (meets(rules.OURO)) return { tier: "OURO", next: null };
  if (meets(rules.PRATA)) return { tier: "PRATA", next: { tier: "OURO", missing: missing(rules.OURO) } };
  return { tier: "BRONZE", next: { tier: "PRATA", missing: missing(rules.PRATA) } };
}

const DAY = 86_400_000;
export async function reputationSignals(db: Database, carrierId: string, now = new Date()): Promise<ReputationSignals> {
  const since = new Date(now.getTime() - 180 * DAY).toISOString();
  const [loads, parcels, ratings] = await Promise.all([
    db.select({ status: trLoads.status }).from(trLoads).where(and(eq(trLoads.carrierId, carrierId), gte(trLoads.createdAt, since), inArray(trLoads.status, ["ACEITA", "RECUSADA", "COLETADA", "ENTREGUE"]))),
    db.select({ status: trParcels.status, deliveredAt: trParcels.deliveredAt }).from(trParcels).where(and(eq(trParcels.carrierId, carrierId), gte(trParcels.createdAt, since))),
    db.select({ p: trLoadRatings.punctuality, c: trLoadRatings.care }).from(trLoadRatings).where(and(eq(trLoadRatings.carrierId, carrierId), gte(trLoadRatings.createdAt, since))),
  ]);
  const responded = loads.length;
  const refused = loads.filter((l) => l.status === "RECUSADA").length;
  const deliveries = loads.filter((l) => l.status === "ENTREGUE").length + parcels.filter((p) => p.deliveredAt).length;
  const rating = ratings.length ? Math.round((ratings.reduce((a, r) => a + (r.p + r.c) / 2, 0) / ratings.length) * 10) / 10 : null;
  return { deliveries, rating, ratings: ratings.length, refusalPct: responded ? Math.round((refused / responded) * 100) : 0, notBoarded: parcels.filter((p) => p.status === "NAO_EMBARCOU").length };
}

/** Reputação da transportadora de quem está logado (painel da transportadora). */
export async function myReputation(db: Database, actor: Actor, now = new Date()) {
  const [link] = await db.select({ carrierId: trCarrierUsers.carrierId }).from(trCarrierUsers).where(eq(trCarrierUsers.userId, actor.userId)).limit(1);
  if (!link) return null;
  const [signals, rules] = await Promise.all([reputationSignals(db, link.carrierId, now), getReputationRules(db)]);
  return { signals, ...tierOf(signals, rules) };
}

/** Quadro do Master: nível de cada transportadora ativa (só números, sem cliente). */
export async function reputationBoard(db: Database, actor: Actor, now = new Date()) {
  requireMaster(actor);
  const rules = await getReputationRules(db);
  const carriers = await db.select({ id: trCarriers.id, name: trCarriers.name, operation: trCarriers.operation }).from(trCarriers).where(and(eq(trCarriers.status, "ATIVA"), isNotNull(trCarriers.id)));
  const rows = await Promise.all(carriers.map(async (c) => { const s = await reputationSignals(db, c.id, now); return { ...c, signals: s, tier: tierOf(s, rules).tier }; }));
  return { rules, rows: rows.sort((a, b) => REPUTATION_TIERS.indexOf(b.tier) - REPUTATION_TIERS.indexOf(a.tier) || b.signals.deliveries - a.signals.deliveries) };
}

/** Nível de várias transportadoras de uma vez (catálogo e aceite de carga). */
export async function tiersOf(db: Database, carrierIds: string[], now = new Date()): Promise<Map<string, ReputationTier>> {
  const rules = await getReputationRules(db);
  const out = new Map<string, ReputationTier>();
  for (const id of carrierIds) out.set(id, tierOf(await reputationSignals(db, id, now), rules).tier);
  return out;
}

/** Comissão com a vantagem do nível (D139): Ouro paga menos; nunca abaixo de zero. */
export const commissionWithTier = (bps: number, tier: ReputationTier, rules: Pick<ReputationRules, "ouroCommissionDiscountBps">) => (tier === "OURO" ? Math.max(0, bps - rules.ouroCommissionDiscountBps) : bps);
