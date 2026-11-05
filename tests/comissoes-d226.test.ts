import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { partners } from "@/db/schema";
import { registerPartner } from "@/lib/domain/partners";
import { findRule, recordSaleCommission } from "@/lib/domain/corporate-commissions";
import { COMISSOES_D226, TETO_PRIMEIRA_BPS, TETO_RECORRENTE_BPS, bpsPrimeiraNaBlack } from "@/lib/finance/revisao-d226";

/** Comissões da D226 (PV0): valores, teto, anual equivalente e 100% da 1ª na Black. */
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

  it("cada tipo de parceiro acha a sua regra (criador, representante, agência, Elite)", async () => {
    const r = async (kind: string, cycle: "MONTHLY" | "ANNUAL" = "MONTHLY") => (await findRule(ctx.db, { family: "COMMERCE_PLAN", productKey: "COMMERCE_PRO", cycle, partnerKind: kind, at: FORA }))!;
    expect([(await r("AFFILIATE")).firstBps, (await r("AFFILIATE")).recurringBps]).toEqual([5000, 2000]);
    expect((await r("REPRESENTATIVE")).recurringBps).toBe(2000);
    expect((await r("AGENCY")).recurringBps).toBe(2500);
    expect((await r("AGENCY_ELITE")).recurringBps).toBe(3200);
    expect((await r("AGENCY")).recurringMonths).toBe(600);
  });

  it("na Black a 1ª paga 100%; fora dela, 50%; a recorrência não muda", async () => {
    const r = await registerPartner(ctx.db, { name: "Parceira Teste", email: "pv0@exemplo.com", password: "senha-forte-1", taxId: "52998224725", phone: "11999990000", acceptTerms: true }, FORA);
    const p = (await ctx.db.query.partners.findFirst({ where: eq(partners.userId, r.userId) }))!;
    await ctx.db.update(partners).set({ kind: "AFFILIATE", status: "ACTIVE" }).where(eq(partners.id, p.id));
    const lanca = (idx: number, now: Date, k: string) => recordSaleCommission(ctx.db, { partnerId: p.id, family: "COMMERCE_PLAN", productKey: "COMMERCE_PRO", cycle: "MONTHLY", paymentIndex: idx, paidCents: 14_700, feeCents: null, dedupeKey: k, now });
    expect((await lanca(1, NA_BLACK, "a"))!.bps).toBe(10000);
    expect((await lanca(1, FORA, "b"))!.bps).toBe(5000);
    expect((await lanca(2, NA_BLACK, "c"))!.bps).toBe(2000);
  });
});
