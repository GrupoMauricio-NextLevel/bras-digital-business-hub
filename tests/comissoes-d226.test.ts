import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { partners } from "@/db/schema";
import { registerPartner } from "@/lib/domain/partners";
import { findRule, recordSaleCommission } from "@/lib/domain/corporate-commissions";
import { COMISSOES_D226, TETO_PRIMEIRA_BPS, TETO_RECORRENTE_BPS, bpsPrimeiraNaBlack } from "@/lib/finance/revisao-d226";

/** Comissões: a D226 (histórico) e a regra única da D260, que é a vigente. */
describe("comissões de parceiros D226", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });
  const FORA = new Date("2026-12-10T12:00:00Z"); // depois da Black
  const NA_BLACK = new Date("2026-11-20T12:00:00Z");

  it("teto: 1ª ≤ 50% e recorrente ≤ 32%; anual = 50% de um mês + recorrência dos outros 11", () => {
    for (const r of COMISSOES_D226) {
      if (r.cycle === "MONTHLY") expect(r.firstBps).toBeLessThanOrEqual(TETO_PRIMEIRA_BPS);
      expect(r.recurringBps).toBeLessThanOrEqual(TETO_RECORRENTE_BPS);
    }
    expect(COMISSOES_D226.find((r) => r.key === "COMMERCE_ANUAL")!.firstBps).toBe(2250);
    expect(bpsPrimeiraNaBlack("MONTHLY", 2000)).toBe(10000);
    expect(bpsPrimeiraNaBlack("ANNUAL", 2000)).toBe(2667);
  });

  it("D260: a regra vigente é a mesma para todos os tipos e ciclos (20% na 1ª e na recorrência)", async () => {
    const r = async (kind: string, cycle: "MONTHLY" | "ANNUAL" = "MONTHLY") => (await findRule(ctx.db, { family: "COMMERCE_PLAN", productKey: "COMMERCE_PRO", cycle, partnerKind: kind, at: FORA }))!;
    for (const k of ["AFFILIATE", "REPRESENTATIVE", "AGENCY", "AGENCY_ELITE"]) for (const c of ["MONTHLY", "ANNUAL"] as const) {
      const x = await r(k, c);
      expect([x.firstBps, x.recurringBps, x.recurringMonths, x.holdDays]).toEqual([2000, 2000, 600, 30]);
      expect(x.reason).toContain("D260");
    }
  });

  it("D260: sem Black para o parceiro; 1ª e recorrência pagam o mesmo percentual do nível", async () => {
    const r = await registerPartner(ctx.db, { name: "Parceira Teste", email: "pv0@exemplo.com", password: "senha-forte-1", taxId: "11222333000181", phone: "11999990000", acceptTerms: true }, FORA);
    const p = (await ctx.db.query.partners.findFirst({ where: eq(partners.userId, r.userId) }))!;
    await ctx.db.update(partners).set({ kind: "AGENCY", status: "ACTIVE" }).where(eq(partners.id, p.id));
    const lanca = (idx: number, now: Date, k: string, cycle: "MONTHLY" | "ANNUAL" = "MONTHLY", paid = 14_700) => recordSaleCommission(ctx.db, { partnerId: p.id, family: "COMMERCE_PLAN", productKey: "COMMERCE_PRO", cycle, paymentIndex: idx, paidCents: paid, feeCents: null, dedupeKey: k, now });
    expect((await lanca(1, NA_BLACK, "a"))!.bps).toBe(2000);
    expect((await lanca(1, FORA, "b"))!.bps).toBe(2000);
    expect((await lanca(2, NA_BLACK, "c"))!.bps).toBe(2000);
    const anual = (await lanca(1, FORA, "d", "ANNUAL", 142_800))!;
    expect([anual.bps, anual.amountCents]).toEqual([2000, 28_560]);
    // D263: o mesmo pagamento para quem se cadastrou com CPF (Programa de Indicações) paga 15%.
    const cpf = await registerPartner(ctx.db, { name: "Indicadora CPF", email: "cpf@exemplo.com", password: "senha-forte-1", taxId: "52998224725", phone: "11999990001", acceptTerms: true }, FORA);
    const pc = (await ctx.db.query.partners.findFirst({ where: eq(partners.userId, cpf.userId) }))!;
    const c1 = await recordSaleCommission(ctx.db, { partnerId: pc.id, family: "COMMERCE_PLAN", productKey: "COMMERCE_PRO", cycle: "MONTHLY", paymentIndex: 1, paidCents: 14_700, feeCents: null, dedupeKey: "cpf1", now: FORA });
    expect([c1!.bps, c1!.amountCents]).toEqual([1500, 2205]);
  });

  it("revisões aplicadas uma vez só: reiniciar não cria versões novas", async () => {
    const { ensureCatalogSeed } = await import("@/lib/domain/nl-catalog");
    const { commissionRules } = await import("@/db/schema");
    await ensureCatalogSeed(ctx.db);
    const antes = (await ctx.db.select().from(commissionRules)).length;
    expect(antes).toBeGreaterThan(0);
    await ensureCatalogSeed(ctx.db);
    await ensureCatalogSeed(ctx.db);
    expect((await ctx.db.select().from(commissionRules)).length).toBe(antes);
  });
});
