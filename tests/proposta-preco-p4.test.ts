import { beforeEach, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { breakEvenGmvCents, effectiveMonthly, entryChecks, simulateEntry, type EntryModel, type Scenario } from "@/lib/finance/entry-sim";
import { DEFAULT_PROPOSAL, getProposal, proposalReport, saveProposal } from "@/lib/domain/precos/proposta";

/** D125 (fase P4): proposta de preço em rascunho, simulação de 12 meses e guarda-corpos. */
const COSTS = { infraPerStoreCents: 800, collectionFeeBps: 200, serviceMarginBps: 5000 };
const model: EntryModel = { label: "x", freeTier: true, annual: { paidMonths: 8, getMonths: 12 }, cashbackBps: 500, ladder: [
  { key: "F", name: "Começo", monthlyCents: 0, feeBps: 250, perOrderCents: 0 },
  { key: "S", name: "Start", monthlyCents: 9_000, feeBps: 100, perOrderCents: 0 },
] };
const base: Scenario = { key: "BASE", signupsPerMonth: 100, activationPct: 40, gmvPerActiveCents: 300_000, avgOrderCents: 15_000, paidConversionPct: 10, currentConversionPct: 5, annualSharePct: 0, monthlyChurnBps: 0, paidMix: [100] };

describe("conta da porta de entrada (pura)", () => {
  it("anual 'pague 8, leve 12' e ponto de equilíbrio do plano", () => {
    expect(effectiveMonthly(model.ladder[1]!, model, 100)).toBe(6_000);
    expect(effectiveMonthly(model.ladder[1]!, model, 0)).toBe(9_000);
    // R$ 90 ÷ (2,5% − 1%) = R$ 6.000 de venda por mês
    expect(breakEvenGmvCents(model.ladder[0]!, model.ladder[1]!, 15_000)).toBe(600_000);
    expect(breakEvenGmvCents(model.ladder[1]!, model.ladder[0]!, 15_000)).toBeNull();
  });

  it("12 meses: quem não assina fica no grátis pagando taxa; sem grátis, sai", () => {
    const r = simulateEntry(model, base, COSTS);
    expect(r.months).toHaveLength(12);
    expect(r.months[0]).toMatchObject({ paidStores: 10, freeStores: 90 });
    expect(r.months[11]).toMatchObject({ paidStores: 120, freeStores: 1080 });
    const semGratis = simulateEntry({ ...model, freeTier: false, ladder: [model.ladder[1]!] }, base, COSTS, { useCurrentConversion: true });
    expect(semGratis.months[11]).toMatchObject({ paidStores: 60, freeStores: 0 });
    expect(r.revenueCents).toBeGreaterThan(semGratis.revenueCents);
  });

  it("guarda-corpos: o grátis cobre o custo e nenhum plano dá prejuízo; plano sem margem é apontado", () => {
    const ok = entryChecks(model, base, COSTS);
    expect(ok.ok).toBe(true);
    expect(ok.free!.revenueCents).toBe(3_000); // 40% × R$ 3.000 × 2,5%
    const ruim = entryChecks({ ...model, ladder: [{ ...model.ladder[0]!, feeBps: 10 }, model.ladder[1]!] }, base, COSTS);
    expect(ruim.free!.ok).toBe(false);
    expect(ruim.ok).toBe(false);
  });
});

describe("proposta no Master", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });

  it("rascunho da A8, comparado com o modelo de hoje lido das fontes; o cenário base passa nos guarda-corpos", async () => {
    const r = await proposalReport(ctx.db, ctx.actors.master);
    expect(r.proposal.status).toBe("RASCUNHO");
    const commerce = r.brands.find((b) => b.brand === "NEXTLEVEL_COMMERCE")!;
    expect(commerce.current.ladder.map((p) => p.monthlyCents)).toEqual([5_700, 14_700, 34_700]); // revisão D220
    expect(commerce.current.annual.paidMonths).toBe(8); // anual de R$ 444 ≈ 8 mensalidades de R$ 57 (D220)
    const sd = r.brands.find((b) => b.brand === "SUPERDROP")!;
    expect(sd.current.ladder.map((p) => [p.monthlyCents, p.feeBps])).toEqual([[4_900, 500], [9_700, 500], [19_700, 300]]);
    for (const b of r.brands) {
      expect(b.checks.ok).toBe(true);
      expect(b.scenarios.map((s) => s.key)).toEqual(["PESSIMISTA", "BASE", "OTIMISTA"]);
      expect(b.scenarios.every((s) => s.proposed.months.length === 12 && s.current.months.length === 12)).toBe(true);
    }
  });

  it("só o Master grava; anual inválido é recusado; aprovar só registra", async () => {
    await expect(saveProposal(ctx.db, ctx.actors.arena, DEFAULT_PROPOSAL)).rejects.toThrow();
    await expect(proposalReport(ctx.db, ctx.actors.arena)).rejects.toThrow();
    await expect(saveProposal(ctx.db, ctx.actors.master, { ...DEFAULT_PROPOSAL, annual: { paidMonths: 13, getMonths: 12 } })).rejects.toThrow();
    const novo = structuredClone(DEFAULT_PROPOSAL);
    novo.brands.SUPERDROP.ladder[1]!.monthlyCents = 6_900;
    await saveProposal(ctx.db, ctx.actors.master, novo);
    expect((await getProposal(ctx.db)).brands.SUPERDROP.ladder[1]!.monthlyCents).toBe(6_900);
  });
});
