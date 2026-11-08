import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { commissionRules, partnerClicks, partnerCommissions, partnerLinks, partners, stores } from "@/db/schema";
import { MISSOES, melhorSequencia, missoesDaSemana, posicaoNoRanking, sequenciaDeSemanas } from "@/lib/finance/engajamento-regras";
import { engajamentoDoParceiro } from "@/lib/domain/engajamento";
import { registerPartner } from "@/lib/domain/partners";

describe("engajamento sem dinheiro (puro, D272)", () => {
  it("missões por público e semana completa", () => {
    const vazio = { cliques: 0, cadastros: 0, vendas: 0, vendasPlanoMaior: 0, vendasAnuais: 0, visitas: 0, demonstracoes: 0 };
    expect(missoesDaSemana("ONLINE", vazio)).toMatchObject({ feitas: 0, total: 4, completa: false });
    expect(missoesDaSemana("ONLINE", { ...vazio, cliques: 12, cadastros: 1, vendas: 1, vendasPlanoMaior: 1 }).completa).toBe(true);
    expect(missoesDaSemana("RUA", { ...vazio, visitas: 10, demonstracoes: 4, vendas: 3, vendasPlanoMaior: 1, vendasAnuais: 1 })).toMatchObject({ feitas: 4, total: 5, completa: false });
    expect(MISSOES.RUA.map((m) => m.id)).not.toContain("cliques");
  });

  it("sequência: semana atual vazia não quebra; recorde conta a maior", () => {
    const s = new Set(["2026-11-16", "2026-11-23", "2026-11-30"]);
    expect(sequenciaDeSemanas(s, "2026-11-30")).toEqual({ atual: 3, emRisco: false });
    expect(sequenciaDeSemanas(s, "2026-12-07")).toEqual({ atual: 3, emRisco: true });
    expect(sequenciaDeSemanas(s, "2026-12-14")).toEqual({ atual: 0, emRisco: false });
    expect(melhorSequencia(new Set(["2026-10-05", "2026-10-12", "2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23"]))).toBe(4);
  });

  it("ranking: posição e quanto falta para passar quem está acima", () => {
    const l = [{ partnerId: "a", nome: "Ana Souza", pontos: 500 }, { partnerId: "b", nome: "Bruno Lima", pontos: 300 }, { partnerId: "c", nome: "Caio", pontos: 100 }];
    expect(posicaoNoRanking(l, "b")).toEqual({ posicao: 2, total: 3, acima: { nome: "Ana", faltaCent: 201 } });
    expect(posicaoNoRanking(l, "a")).toMatchObject({ posicao: 1, acima: null });
  });
});

describe("engajamento no banco (BG2)", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  let mensal: string, anual: string;
  beforeEach(async () => {
    ctx = await freshDb();
    const { ensureCatalogSeed } = await import("@/lib/domain/nl-catalog");
    await ensureCatalogSeed(ctx.db);
    const r = (c: "MONTHLY" | "ANNUAL") => ctx.db.select().from(commissionRules).where(and(eq(commissionRules.family, "COMMERCE_PLAN"), eq(commissionRules.cycle, c))).limit(1);
    mensal = (await r("MONTHLY"))[0]!.id; anual = (await r("ANNUAL"))[0]!.id;
  });
  let n = 0;
  async function parceiro(email: string, taxId: string, executivo = false) {
    const r = await registerPartner(ctx.db, { name: `Parceiro ${email}`, email, password: "senha-forte-1", taxId, phone: "11999990000", acceptTerms: true }, new Date("2026-11-01T12:00:00Z"));
    const p = (await ctx.db.query.partners.findFirst({ where: eq(partners.userId, r.userId) }))!;
    await ctx.db.update(partners).set({ status: "ACTIVE", executivo }).where(eq(partners.id, p.id));
    return p.id;
  }
  const venda = (partnerId: string, base: number, quando: string, ruleId = mensal, storeId: string | null = null) =>
    ctx.db.insert(partnerCommissions).values({ id: `e-${++n}`, partnerId, storeId, ruleId, kind: "SALE", baseCents: base, rateBps: 2000, amountCents: 1, period: quando.slice(0, 7), status: "PENDING", dedupeKey: `e-${n}`, createdAt: quando });

  it("online: missões da semana com cliques, cadastro e venda; sequência, selos e ranking", async () => {
    const p = await parceiro("on@x.com", "11222333000181");
    const outro = await parceiro("out@x.com", "11444777000161");
    await ctx.db.insert(partnerLinks).values({ id: "lk1", partnerId: p, slug: "meu-link", label: "Principal" });
    for (let i = 0; i < 10; i++) await ctx.db.insert(partnerClicks).values({ id: `ck${i}`, linkId: "lk1", at: "2026-12-08T14:00:00Z", ipHash: `h${i}`, uaHash: "u" });
    await ctx.db.update(stores).set({ partnerId: p, attributedAt: "2026-12-08T15:00:00Z" }).where(eq(stores.id, ctx.seed.stores.arena.id));
    for (const w of ["2026-11-17", "2026-11-24", "2026-12-01"]) await venda(p, 5_700, `${w}T15:00:00Z`);
    await venda(p, 14_700, "2026-12-09T15:00:00Z");
    for (let i = 0; i < 5; i++) await venda(outro, 5_700, "2026-12-09T16:00:00Z");
    const e = (await engajamentoDoParceiro(ctx.db, p, new Date("2026-12-10T15:00:00Z")))!;
    expect(e.publico).toBe("ONLINE");
    expect(e.missoes).toMatchObject({ feitas: 4, completa: true });
    expect(e.sequencia).toMatchObject({ atual: 4, emRisco: false, melhor: 4 });
    const ganhou = e.selos.filter((s) => s.ganhou).map((s) => s.id);
    expect(ganhou).toEqual(expect.arrayContaining(["primeira-venda", "sequencia-4", "semana-completa"]));
    expect(ganhou).not.toContain("primeiro-scale");
    expect(e.ranking.semana).toMatchObject({ posicao: 2, total: 2, acima: { nome: "Parceiro" } });
    expect(e.ranking.semana.top[1]).toMatchObject({ nome: "Você", voce: true });
  });

  it("rua: missões próprias; anual e Scale entram nos selos; online não aparece no ranking da rua", async () => {
    const ex = await parceiro("rua@x.com", "11444777000161", true);
    await parceiro("on@x.com", "11222333000181");
    await venda(ex, 406_800, "2026-12-09T15:00:00Z", anual);
    await venda(ex, 34_700, "2026-12-09T16:00:00Z");
    const e = (await engajamentoDoParceiro(ctx.db, ex, new Date("2026-12-10T15:00:00Z")))!;
    expect(e.publico).toBe("RUA");
    expect(e.missoes.lista.find((m) => m.id === "anual")).toMatchObject({ feita: true });
    expect(e.missoes.lista.find((m) => m.id === "plano-maior")).toMatchObject({ feita: true });
    expect(e.selos.filter((s) => s.ganhou).map((s) => s.id)).toEqual(expect.arrayContaining(["anual", "primeiro-scale"]));
    expect(e.ranking.semana).toMatchObject({ posicao: 1, total: 1 });
  });
});
