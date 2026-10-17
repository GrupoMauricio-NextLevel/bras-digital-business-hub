import type { Database } from "@/db/client";
import { requireMaster, type Actor } from "../access";
import { getPriceBook } from "../finance";
import { listCatalog } from "../nl-catalog";
import { getClubRules, type ClubRules } from "./regras";

/**
 * Club como assinatura do ecossistema (D131, fase P5C) — **rascunho**: comparação dos níveis para o Master decidir.
 * Nada aqui cobra nem libera acesso; ligar depende da aprovação do dono e da conta do grupo (D130).
 */
export type ClubTier = "FREE" | "PLUS" | "TOTAL";

/** Pontos de um crédito já com o multiplicador do nível. */
export const tierPoints = (points: number, tier: ClubTier, rules: Pick<ClubRules, "tiers">) =>
  tier === "FREE" ? points : Math.floor((points * rules.tiers[tier].pointsMultiplierPct) / 100);

/** Plano com o desconto do nível (Club+ dá desconto; Club Total libera o plano de entrada, que sai de graça). */
export function tierPlanPrice(monthlyCents: number, tier: ClubTier, rules: Pick<ClubRules, "tiers">, entryPlan = false) {
  if (tier === "TOTAL" && entryPlan && rules.tiers.TOTAL.unlocksEntryPlans) return 0;
  if (tier === "FREE") return monthlyCents;
  return Math.round(monthlyCents * (1 - rules.tiers[tier].planDiscountBps / 10_000));
}

export async function clubTierComparison(db: Database, actor: Actor) {
  requireMaster(actor);
  const [rules, book, catalog] = await Promise.all([getClubRules(db), getPriceBook(db), listCatalog(db, { includeUnpublished: true })]);
  const price = (key: string) => catalog.find((p) => p.key === key)?.prices.MONTHLY?.amountCents ?? null;
  // Plano de entrada pago de cada marca (o que o Club Total libera).
  const entry = [
    { brand: "SuperDrop", plan: book.offers.STORE_SUBDOMAIN.name, cents: book.offers.STORE_SUBDOMAIN.monthlyCents },
    { brand: "NextLevel E-commerce", plan: "Commerce Start", cents: price("COMMERCE_START") },
    { brand: "Brás Digital", plan: "Brás Prata", cents: price("BRAS_PRATA") },
    { brand: "NextLevel Cargas", plan: "Cargas Pro", cents: price("CARGAS_PRO") },
  ].filter((e): e is { brand: string; plan: string; cents: number } => e.cents !== null);
  const separate = entry.reduce((s, e) => s + e.cents, 0);
  const tiers = (["CLUB_PLUS", "CLUB_TOTAL"] as const).map((key) => {
    const p = catalog.find((x) => x.key === key);
    return { key, name: p?.name ?? key, status: p?.status ?? "DRAFT", monthlyCents: p?.prices.MONTHLY?.amountCents ?? null, annualCents: p?.prices.ANNUAL?.amountCents ?? null };
  });
  const total = tiers.find((t) => t.key === "CLUB_TOTAL")?.monthlyCents ?? null;
  return { rules: rules.tiers, entry, separateCents: separate, tiers, savingsWithTotalCents: total === null ? null : separate - total };
}
