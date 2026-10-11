import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { platformSettings } from "@/db/schema";
import { entryChecks, simulateEntry, type EntryModel, type LadderPlan, type Scenario, type SimCosts } from "@/lib/finance/entry-sim";
import { requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { getPriceBook } from "../finance";
import { listCatalog } from "../nl-catalog";

/**
 * Proposta de preço do grupo **em rascunho** (D125, fase P4 do prompt de público e preço). Guarda a escada sugerida
 * (seção A8), as peças da porta de entrada e os três cenários; compara com o modelo de hoje lido das fontes reais
 * (catálogo do Master e tabela do SuperDrop). **Não muda preço nenhum**: virar regra é a fase P5, com a aprovação do dono.
 */
const plan = z.object({ key: z.string().trim().min(1).max(40), name: z.string().trim().min(1).max(60), monthlyCents: z.number().int().min(0).max(10_000_000), feeBps: z.number().int().min(0).max(5_000), perOrderCents: z.number().int().min(0).max(100_000) });
const pctN = z.number().min(0).max(100);
const scenario = z.object({
  key: z.enum(["PESSIMISTA", "BASE", "OTIMISTA"]),
  signupsPerMonth: z.number().int().min(0).max(100_000),
  activationPct: pctN, gmvPerActiveCents: z.number().int().min(0).max(1_000_000_000), avgOrderCents: z.number().int().min(1).max(10_000_000),
  paidConversionPct: pctN, currentConversionPct: pctN, annualSharePct: pctN,
  monthlyChurnBps: z.number().int().min(0).max(10_000), paidMix: z.array(pctN).min(1).max(6),
});
const brandDraft = z.object({ ladder: z.array(plan).min(2).max(6), scenarios: z.array(scenario).length(3) });
export const proposalSchema = z.object({
  status: z.enum(["RASCUNHO", "APROVADA"]),
  reverseTrialDays: z.number().int().min(0).max(60),
  milestoneDays: z.object({ publish: z.number().int().min(0).max(30), firstSale: z.number().int().min(0).max(30), cap: z.number().int().min(0).max(60) }),
  annual: z.object({ paidMonths: z.number().int().min(1).max(12), getMonths: z.number().int().min(1).max(24) }).refine((a) => a.paidMonths <= a.getMonths, { message: "No anual, os meses pagos não passam dos meses levados." }),
  cashbackBps: z.number().int().min(0).max(3_000),
  brands: z.object({ NEXTLEVEL_COMMERCE: brandDraft, SUPERDROP: brandDraft }),
});
export type Proposal = z.output<typeof proposalSchema>;
export type ProposalBrand = keyof Proposal["brands"];
export const PROPOSAL_BRANDS: { brand: ProposalBrand; label: string }[] = [{ brand: "NEXTLEVEL_COMMERCE", label: "NextLevel Commerce" }, { brand: "SUPERDROP", label: "SuperDrop (lojista)" }];

const sc = (key: Scenario["key"], v: Omit<Scenario, "key">): Scenario => ({ key, ...v });
/** Rascunho inicial: escada da seção A8 e cenários como hipótese (a P1 e a P2 trocam pelos números reais). */
export const DEFAULT_PROPOSAL: Proposal = {
  status: "RASCUNHO",
  reverseTrialDays: 14,
  milestoneDays: { publish: 7, firstSale: 7, cap: 30 },
  annual: { paidMonths: 8, getMonths: 12 },
  cashbackBps: 500,
  brands: {
    NEXTLEVEL_COMMERCE: {
      ladder: [
        { key: "COMECO", name: "Começo", monthlyCents: 0, feeBps: 250, perOrderCents: 0 },
        { key: "START", name: "Start", monthlyCents: 8_900, feeBps: 100, perOrderCents: 0 },
        { key: "PRO", name: "Pro", monthlyCents: 19_900, feeBps: 70, perOrderCents: 0 },
        { key: "SCALE", name: "Scale", monthlyCents: 44_900, feeBps: 40, perOrderCents: 0 },
      ],
      scenarios: [
        sc("PESSIMISTA", { signupsPerMonth: 20, activationPct: 25, gmvPerActiveCents: 150_000, avgOrderCents: 12_000, paidConversionPct: 4, currentConversionPct: 2, annualSharePct: 10, monthlyChurnBps: 600, paidMix: [50, 35, 15] }),
        sc("BASE", { signupsPerMonth: 40, activationPct: 35, gmvPerActiveCents: 300_000, avgOrderCents: 15_000, paidConversionPct: 8, currentConversionPct: 4, annualSharePct: 20, monthlyChurnBps: 400, paidMix: [45, 40, 15] }),
        sc("OTIMISTA", { signupsPerMonth: 80, activationPct: 45, gmvPerActiveCents: 600_000, avgOrderCents: 18_000, paidConversionPct: 12, currentConversionPct: 6, annualSharePct: 30, monthlyChurnBps: 300, paidMix: [40, 40, 20] }),
      ],
    },
    SUPERDROP: {
      ladder: [
        { key: "COMECO", name: "Começo", monthlyCents: 0, feeBps: 700, perOrderCents: 0 },
        { key: "LOJA", name: "Loja", monthlyCents: 7_900, feeBps: 400, perOrderCents: 0 },
        { key: "PROPRIA", name: "Própria", monthlyCents: 17_900, feeBps: 250, perOrderCents: 0 },
      ],
      scenarios: [
        sc("PESSIMISTA", { signupsPerMonth: 30, activationPct: 20, gmvPerActiveCents: 60_000, avgOrderCents: 8_000, paidConversionPct: 3, currentConversionPct: 2, annualSharePct: 5, monthlyChurnBps: 800, paidMix: [70, 30] }),
        sc("BASE", { signupsPerMonth: 60, activationPct: 30, gmvPerActiveCents: 120_000, avgOrderCents: 9_000, paidConversionPct: 6, currentConversionPct: 3, annualSharePct: 10, monthlyChurnBps: 600, paidMix: [65, 35] }),
        sc("OTIMISTA", { signupsPerMonth: 120, activationPct: 40, gmvPerActiveCents: 250_000, avgOrderCents: 10_000, paidConversionPct: 10, currentConversionPct: 5, annualSharePct: 20, monthlyChurnBps: 400, paidMix: [60, 40] }),
      ],
    },
  },
};
const KEY = "precos.proposta";

export async function getProposal(db: Database): Promise<Proposal> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) });
  const parsed = proposalSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : DEFAULT_PROPOSAL;
}
/** Grava o rascunho. Só o Master; aprovar (status APROVADA) não liga nada sozinho: só registra a decisão. */
export async function saveProposal(db: Database, actor: Actor, raw: z.input<typeof proposalSchema>) {
  requireMaster(actor);
  const before = await getProposal(db);
  const v = proposalSchema.parse(raw);
  await db.insert(platformSettings).values({ key: KEY, value: v, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value: v, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  await recordAudit(db, actor, { action: "PRICE_PROPOSAL_SAVE", entityType: "platform_settings", entityId: KEY, before, after: v }, { force: true });
  return v;
}

/** O modelo de hoje, lido das fontes reais (para a comparação ser honesta). */
async function currentModels(db: Database): Promise<Record<ProposalBrand, EntryModel>> {
  const [book, catalog] = await Promise.all([getPriceBook(db), listCatalog(db, { includeUnpublished: true, families: ["COMMERCE_PLAN"] })]);
  const commercePlans = catalog.filter((p) => p.prices.MONTHLY?.amountCents).sort((a, b) => (a.prices.MONTHLY!.amountCents ?? 0) - (b.prices.MONTHLY!.amountCents ?? 0));
  const ladder: LadderPlan[] = commercePlans.map((p) => ({ key: p.key, name: p.name, monthlyCents: p.prices.MONTHLY!.amountCents ?? 0, feeBps: (p.meta as { platformFeeBps?: number } | null)?.platformFeeBps ?? 0, perOrderCents: 0 }));
  const first = commercePlans[0];
  const annualMonths = first?.prices.ANNUAL?.amountCents && first.prices.MONTHLY?.amountCents ? Math.round(first.prices.ANNUAL.amountCents / first.prices.MONTHLY.amountCents) : 12;
  return {
    NEXTLEVEL_COMMERCE: { label: "Hoje", freeTier: false, ladder, annual: { paidMonths: Math.min(12, annualMonths), getMonths: 12 }, cashbackBps: 0 },
    SUPERDROP: {
      label: "Hoje", freeTier: false, annual: { paidMonths: 12, getMonths: 12 }, cashbackBps: 0,
      ladder: (["DROP_MANUAL", "STORE_SUBDOMAIN", "STORE_OWN"] as const).map((k) => ({ key: k, name: book.offers[k].name, monthlyCents: book.offers[k].monthlyCents, feeBps: book.orderFees[k] ?? 0, perOrderCents: 0 })),
    },
  };
}

export type ProposalReport = {
  proposal: Proposal;
  costs: SimCosts;
  brands: {
    brand: ProposalBrand; label: string; current: EntryModel; proposed: EntryModel;
    checks: ReturnType<typeof entryChecks>;
    /** `proposedSameConversion`: a proposta com a conversão de hoje (mostra quanto do ganho depende de mais gente assinar). */
    scenarios: { key: Scenario["key"]; current: ReturnType<typeof simulateEntry>; proposed: ReturnType<typeof simulateEntry>; proposedSameConversion: ReturnType<typeof simulateEntry> }[];
  }[];
};

/** Rascunho + comparação com o modelo de hoje em 3 cenários de 12 meses, com os guarda-corpos da fase P4. */
export async function proposalReport(db: Database, actor: Actor): Promise<ProposalReport> {
  requireMaster(actor);
  const [proposal, current, book] = await Promise.all([getProposal(db), currentModels(db), getPriceBook(db)]);
  const costs: SimCosts = { infraPerStoreCents: book.costs.infraPerStoreCents, collectionFeeBps: book.costs.collectionFeeBps, serviceMarginBps: book.services.targetMarginBps };
  return {
    proposal, costs,
    brands: PROPOSAL_BRANDS.map(({ brand, label }) => {
      const d = proposal.brands[brand];
      const proposed: EntryModel = { label: "Proposta", freeTier: true, ladder: d.ladder, annual: proposal.annual, cashbackBps: proposal.cashbackBps };
      const base = d.scenarios.find((s) => s.key === "BASE")!;
      // O modelo de hoje não tem plano grátis: a escolha de plano segue a mesma proporção, ajustada ao número de planos.
      const mixFor = (s: Scenario, n: number): Scenario => ({ ...s, paidMix: Array.from({ length: n }, (_, i) => s.paidMix[i] ?? s.paidMix.at(-1) ?? 1) });
      return {
        brand, label, current: current[brand], proposed, checks: entryChecks(proposed, base, costs),
        scenarios: d.scenarios.map((s) => ({ key: s.key, current: simulateEntry(current[brand], mixFor(s, current[brand].ladder.length), costs, { useCurrentConversion: true }), proposed: simulateEntry(proposed, s, costs), proposedSameConversion: simulateEntry(proposed, s, costs, { useCurrentConversion: true }) })),
      };
    }),
  };
}
