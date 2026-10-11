import { beforeEach, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { users } from "@/db/schema";
import { brandFunnels, buildFunnel, FUNNEL_BRANDS, median, weekStart, type FunnelEntity } from "@/lib/domain/precos/funil";
import { signupBrasMember } from "@/lib/domain/bras/membros";

/** D124 (fase P1 do prompt de público e preço): funil por marca, só com números agregados. */
const NOW = new Date("2026-10-11T12:00:00.000Z");
const ago = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();
const ent = (p: Partial<FunnelEntity> & { createdAt: string }): FunnelEntity => ({ stages: {}, activity: [], revenueCents: 0, sales30Cents: 0, origin: "Direto (site)", paying: false, features: {}, ...p });
const META = FUNNEL_BRANDS[0]!;
const DEFS = [{ key: "signup", label: "Cadastro" }, { key: "sale", label: "1ª venda paga" }, { key: "paying", label: "Pagou" }];

describe("conta do funil (pura)", () => {
  it("etapas, mediana de dias entre etapas, coortes, faixas, origem e uso", () => {
    const e = [
      ent({ createdAt: ago(100), stages: { sale: ago(96), paying: ago(90) }, activity: [ago(96), ago(5)], revenueCents: 14_900, sales30Cents: 300_000, origin: "Parceiro", paying: true, features: { "Domínio próprio": true } }),
      ent({ createdAt: ago(95), stages: { sale: ago(93) }, activity: [ago(93)], sales30Cents: 0 }),
      ent({ createdAt: ago(10), sales30Cents: 50_000, features: { "Domínio próprio": false } }),
    ];
    const f = buildFunnel(META, DEFS, e, NOW, ["Domínio próprio"]);
    expect(f.total).toBe(3);
    expect(f.stages.map((s) => [s.label, s.count, s.pctOfFirst])).toEqual([["Cadastro", 3, 100], ["1ª venda paga", 2, 67], ["Pagou", 1, 33]]);
    expect(f.stages[1]!.medianDaysFromPrev).toBe(3); // 4 e 2 dias
    expect(f.stages[2]!.medianDaysFromPrev).toBe(6);
    expect(f.weekly).toHaveLength(8);
    expect(f.weekly.reduce((s, w) => s + w.count, 0)).toBe(1); // só o cadastro de 10 dias atrás está nas 8 semanas
    // Coorte de 3 meses atrás: 2 entraram; só a primeira ainda tem atividade depois do dia 30/60/90.
    const julho = f.cohorts.find((c) => c.entered === 2)!;
    expect([julho.d30, julho.d60, julho.d90]).toEqual([50, 50, 50]);
    expect(julho.revenuePerClientCents).toBe(7_450);
    // Coorte recente: ainda não deu tempo de medir.
    expect(f.cohorts.find((c) => c.entered === 1)!.d30).toBeNull();
    expect(f.bands!.map((b) => b.count)).toEqual([1, 1, 1, 0, 0]);
    expect(f.origins[0]).toEqual({ label: "Direto (site)", count: 2 });
    expect(f.usage).toEqual([{ feature: "Domínio próprio", payingPct: 100, freePct: 0 }]);
  });

  it("mediana e semana", () => {
    expect(median([])).toBeNull();
    expect(median([1, 2, 3, 10])).toBe(2.5);
    expect(weekStart("2026-10-11T12:00:00.000Z")).toBe("2026-10-05"); // domingo → segunda anterior
  });
});

describe("funil no banco", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });

  it("todas as marcas, nenhum dado pessoal, e só o Master vê", async () => {
    await signupBrasMember(ctx.db, { name: "Ana", companyName: "Ana LTDA", cnpj: "11222333000181", whatsapp: "11988887777", email: "ana@u.teste", password: "senha-forte-1", acceptTerms: true });
    const f = await brandFunnels(ctx.db, ctx.actors.master);
    expect(f.map((x) => x.brand)).toEqual(["NEXTLEVEL_COMMERCE", "SUPERDROP", "BRAS_DIGITAL", "NEXTLEVEL_CARGAS"]);
    const bras = f.find((x) => x.brand === "BRAS_DIGITAL")!;
    expect(bras.total).toBe(1);
    expect(bras.stages[0]).toMatchObject({ label: "Cadastro", count: 1 });
    const lojas = f.filter((x) => x.unit === "lojas").reduce((s, x) => s + x.total, 0);
    expect(lojas).toBeGreaterThan(0);
    // Nenhum nome, e-mail, documento ou telefone sai do funil.
    const json = JSON.stringify(f);
    const people = await ctx.db.select({ name: users.name, email: users.email }).from(users);
    for (const p of people) { expect(json).not.toContain(p.email); expect(json).not.toContain(p.name); }
    for (const s of ["11222333000181", "11988887777", "Ana LTDA"]) expect(json).not.toContain(s);
    await expect(brandFunnels(ctx.db, ctx.actors.arena)).rejects.toThrow();
  });
});
