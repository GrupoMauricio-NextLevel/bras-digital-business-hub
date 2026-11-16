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

  it("Commerce: o simulador usa a taxa da versão de preço em vigor, não a do cadastro antigo do plano (auditoria 13/11/2026)", async () => {
    const { signupMember } = await import("@/lib/domain/store-access");
    const { commercePlansView } = await import("@/lib/domain/commerce-plans");
    const r = await signupMember(ctx.db, { storeName: "Loja Taxa", ownerName: "Bia Souza", email: "bia@taxa.com", password: "senha-segura-1", taxId: "529.982.247-25", brand: "NEXTLEVEL_COMMERCE", independent: true, plan: "COMMERCE_START", cycle: "MONTHLY" });
    const user = (await ctx.db.query.users.findFirst({ where: (t, { eq }) => eq(t.id, r.userId) }))!;
    await saveBenefitsSettings(ctx.db, ctx.actors.master, { brands: ["NEXTLEVEL_COMMERCE"] });
    const p = (await benefitsPanel(ctx.db, { userId: r.userId, role: "STORE_OWNER", organizationId: user.organizationId, supplierId: null, storeId: r.storeId }))!;
    const vigente = new Map((await commercePlansView(ctx.db)).plans.filter((x) => !x.quote).map((x) => [x.monthlyCents, x.feeBps ?? 0]));
    const pagos = p.simulator!.options.filter((o) => o.monthlyCents > 0);
    expect(pagos.length).toBeGreaterThan(1);
    for (const o of pagos) expect(o.feeBps).toBe(vigente.get(o.monthlyCents));
  });

  it("desligado por padrão; ligado mostra carteira, trilha e simulador; comemora cada passo uma vez", async () => {
    expect(await benefitsPanel(ctx.db, ctx.actors.mantos)).toBeNull();
    await saveBenefitsSettings(ctx.db, ctx.actors.master, { brands: ["SUPERDROP", "NEXTLEVEL_COMMERCE"] });
    const p = (await benefitsPanel(ctx.db, ctx.actors.mantos))!;
    expect(p.wallet).toBeNull(); // pontos são do Brás Digital Club: não aparecem no SuperDrop nem na Commerce (R3)
    expect(p.trail.steps.length).toBeGreaterThan(3);
    expect(p.simulator?.options.length).toBeGreaterThan(1);
    const done = p.trail.steps.filter((s) => s.done).length;
    expect(p.celebrate).toHaveLength(done);
    expect((await benefitsPanel(ctx.db, ctx.actors.mantos))!.celebrate).toHaveLength(0);
    expect(await benefitsPanel(ctx.db, ctx.actors.master)).toBeNull();
    await expect(saveBenefitsSettings(ctx.db, ctx.actors.arena, { brands: [] })).rejects.toThrow();
  });
});
