import { beforeEach, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { clubTierComparison, tierPlanPrice, tierPoints } from "@/lib/domain/club/assinatura";
import { DEFAULT_CLUB_RULES } from "@/lib/domain/club/regras";
import { listCatalog } from "@/lib/domain/nl-catalog";

/** D131 (fase P5C): Club+ e Club Total em rascunho; regras dos níveis. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

describe("Club como assinatura", () => {
  it("multiplicador e desconto; Club Total libera só o plano de entrada", () => {
    expect(tierPoints(100, "FREE", DEFAULT_CLUB_RULES)).toBe(100);
    expect(tierPoints(100, "PLUS", DEFAULT_CLUB_RULES)).toBe(200);
    expect(tierPlanPrice(10_000, "PLUS", DEFAULT_CLUB_RULES)).toBe(8_000);
    expect(tierPlanPrice(10_000, "TOTAL", DEFAULT_CLUB_RULES, true)).toBe(0);
    expect(tierPlanPrice(10_000, "TOTAL", DEFAULT_CLUB_RULES, false)).toBe(10_000);
  });
  it("nascem em rascunho, fora da vitrine; comparação só para o Master", async () => {
    expect((await listCatalog(ctx.db)).some((p) => p.family === "CLUB_PLAN")).toBe(false);
    const c = await clubTierComparison(ctx.db, ctx.actors.master);
    expect(c.tiers.map((t) => [t.key, t.status, t.monthlyCents])).toEqual([["CLUB_PLUS", "DRAFT", 2_990], ["CLUB_TOTAL", "DRAFT", 24_700]]);
    expect(c.separateCents).toBe(c.entry.reduce((s, e) => s + e.cents, 0));
    await expect(clubTierComparison(ctx.db, ctx.actors.arena)).rejects.toThrow();
  });
});
