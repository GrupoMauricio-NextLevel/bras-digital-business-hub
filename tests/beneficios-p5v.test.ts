import { beforeEach, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { benefitsPanel, saveBenefitsSettings, simulatePlans } from "@/lib/domain/beneficios/painel";

/** D128 (fase P5V): um agregador só para os benefícios dos painéis; desligado por padrão. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

describe("benefícios nos painéis", () => {
  it("simulador: o melhor plano e quanto economiza", () => {
    const r = simulatePlans(1_000_000, [{ name: "Grátis", monthlyCents: 0, feeBps: 700, current: true }, { name: "Loja", monthlyCents: 7_900, feeBps: 400, current: false }]);
    expect(r.options.map((o) => o.totalCents)).toEqual([70_000, 47_900]);
    expect(r.best.name).toBe("Loja");
    expect(r.savingsCents).toBe(22_100);
  });

  it("desligado por padrão; ligado mostra carteira, trilha e simulador; comemora cada passo uma vez", async () => {
    expect(await benefitsPanel(ctx.db, ctx.actors.mantos)).toBeNull();
    await saveBenefitsSettings(ctx.db, ctx.actors.master, { brands: ["SUPERDROP", "NEXTLEVEL_COMMERCE"] });
    const p = (await benefitsPanel(ctx.db, ctx.actors.mantos))!;
    expect(p.wallet).toBeNull(); // pontos são do Brás Digital Club: não aparecem no SuperDrop nem na E-commerce (R3)
    expect(p.trail.steps.length).toBeGreaterThan(3);
    expect(p.simulator?.options.length).toBeGreaterThan(1);
    const done = p.trail.steps.filter((s) => s.done).length;
    expect(p.celebrate).toHaveLength(done);
    expect((await benefitsPanel(ctx.db, ctx.actors.mantos))!.celebrate).toHaveLength(0);
    expect(await benefitsPanel(ctx.db, ctx.actors.master)).toBeNull();
    await expect(saveBenefitsSettings(ctx.db, ctx.actors.arena, { brands: [] })).rejects.toThrow();
  });
});
