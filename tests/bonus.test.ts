import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { bonusCampanhas, bonusPremios, commissionRules, partnerCommissions, partners, stores } from "@/db/schema";
import { CAMPANHAS_PADRAO, conferirTeto, faixaDe, periodoDe, periodosParaApurar, pontosDaVenda, resumoDoRetorno, sugestaoDaCampanha, validarFaixas } from "@/lib/finance/bonus-regras";
import { apurarBonus, bonusDoParceiro, garantirCampanhasPadrao, painelDeBonus, retornoDasCampanhas, salvarCampanha } from "@/lib/domain/bonus";
import { registerPartner } from "@/lib/domain/partners";
import { createMasterMember } from "@/lib/domain/equipe-master";

describe("bônus gamificado (puro, D271)", () => {
  it("pontos pelo valor pago: Start = 1, Pro ≈ 2,5, anual com 20% a mais; desconto reduz", () => {
    expect(pontosDaVenda(6_700, "MONTHLY", 6_700)).toBe(100);
    expect(pontosDaVenda(16_700, "MONTHLY", 6_700)).toBe(249);
    expect(pontosDaVenda(39_700, "MONTHLY", 6_700)).toBe(593);
    expect(pontosDaVenda(58_800, "ANNUAL", 6_700)).toBe(88);
    expect(pontosDaVenda(3_350, "MONTHLY", 6_700)).toBe(50);
    expect(pontosDaVenda(0, "MONTHLY", 6_700)).toBe(0);
  });

  it("faixa mais alta atingida, próxima e quanto falta; faixas precisam crescer", () => {
    const f = [{ pontos: 3, valorCents: 4_000 }, { pontos: 5, valorCents: 9_000 }, { pontos: 8, valorCents: 16_000 }];
    expect(faixaDe(f, 250)).toMatchObject({ atingida: null, proxima: { pontos: 3 }, faltaCent: 50 });
    expect(faixaDe(f, 520)).toMatchObject({ atingida: { pontos: 5 }, proxima: { pontos: 8 }, faltaCent: 280 });
    expect(faixaDe(f, 900)).toMatchObject({ atingida: { pontos: 8 }, proxima: null });
    expect(validarFaixas(f)).toBeNull();
    expect(validarFaixas([{ pontos: 3, valorCents: 4_000 }, { pontos: 2, valorCents: 9_000 }])).toMatch(/crescer/);
  });

  it("as campanhas padrão cabem no teto, inclusive na Black (Start a R$ 57): online 46% e rua 73% (teto 50% e 75%)", () => {
    const on = conferirTeto("ONLINE", CAMPANHAS_PADRAO.filter((c) => c.publico === "ONLINE"), 6_700);
    const rua = conferirTeto("RUA", CAMPANHAS_PADRAO.filter((c) => c.publico === "RUA"), 6_700);
    expect([on.cabe, on.percentual, rua.cabe, rua.percentual]).toEqual([true, 40, true, 62]);
    const onB = conferirTeto("ONLINE", CAMPANHAS_PADRAO.filter((c) => c.publico === "ONLINE"), 5_700);
    const ruaB = conferirTeto("RUA", CAMPANHAS_PADRAO.filter((c) => c.publico === "RUA"), 5_700);
    expect([onB.cabe, onB.percentual, ruaB.cabe, ruaB.percentual]).toEqual([true, 46, true, 73]);
    expect(conferirTeto("ONLINE", [...CAMPANHAS_PADRAO.filter((c) => c.publico === "ONLINE"), { faixas: [{ pontos: 1, valorCents: 1_000 }] }], 6_700).cabe).toBe(false);
  });

  it("retorno (BG4): custo por loja, custo por ponto, tempo de retorno sobre a margem e sugestão automática", () => {
    const per = (o: Partial<Parameters<typeof resumoDoRetorno>[0][number]> = {}) => ({ chave: "x", rotulo: "x", lojasNovas: 4, lojasDosPremiados: 4, receitaNovaMensalCents: 22_800, custoCents: 3_400, premiados: 1, semOrcamento: 0, pontosPremiados: 400, ...o });
    const r = resumoDoRetorno([per(), per()]);
    expect(r).toMatchObject({ periodos: 2, lojasNovas: 8, custoCents: 6_800, custoPorLojaCents: 850, custoPorPontoCents: 850, margemNovaMensalCents: 32_832, paybackMeses: 0.2 });
    expect(sugestaoDaCampanha(resumoDoRetorno([]), 50_000, 0).texto).toMatch(/Ainda sem período/);
    expect(sugestaoDaCampanha(resumoDoRetorno([per({ semOrcamento: 2 })]), 50_000, 1).texto).toMatch(/orçamento acabou/);
    expect(sugestaoDaCampanha(resumoDoRetorno([per({ receitaNovaMensalCents: 1_000, custoCents: 20_000 })]), 50_000, 1)).toMatchObject({ tom: "danger" });
    expect(sugestaoDaCampanha(resumoDoRetorno([1, 2, 3, 4].map(() => per({ premiados: 0, custoCents: 0, lojasDosPremiados: 0, receitaNovaMensalCents: 0, pontosPremiados: 0 }))), 50_000, 0).texto).toMatch(/1ª faixa/);
    expect(sugestaoDaCampanha(r, 50_000, 2).texto).toMatch(/subir/);
  });

  it("semana de segunda a domingo e mês no fuso de São Paulo; só apura depois da garantia", () => {
    const s = periodoDe("SEMANA", new Date("2026-12-09T15:00:00Z"));
    expect([s.chave, s.inicio.toISOString(), s.fim.toISOString()]).toEqual(["2026-12-07", "2026-12-07T03:00:00.000Z", "2026-12-14T03:00:00.000Z"]);
    expect(periodoDe("MES", new Date("2026-12-31T23:00:00Z")).chave).toBe("2026-12"); // 20h em São Paulo
    const desde = new Date("2026-01-01T00:00:00Z");
    expect(periodosParaApurar("SEMANA", new Date("2027-01-13T12:00:00Z"), 30, desde).map((p) => p.chave)).not.toContain("2026-12-14");
    expect(periodosParaApurar("SEMANA", new Date("2027-01-13T12:00:00Z"), 30, desde).at(-1)!.chave).toBe("2026-12-07");
  });
});

describe("bônus gamificado no banco (BG1)", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  let ruleId: string;
  beforeEach(async () => {
    ctx = await freshDb();
    const { ensureCatalogSeed } = await import("@/lib/domain/nl-catalog");
    await ensureCatalogSeed(ctx.db);
    ruleId = (await ctx.db.select().from(commissionRules).where(and(eq(commissionRules.family, "COMMERCE_PLAN"), eq(commissionRules.cycle, "MONTHLY"))).limit(1))[0]!.id;
    await garantirCampanhasPadrao(ctx.db);
    await ctx.db.update(bonusCampanhas).set({ createdAt: "2026-01-01T00:00:00Z" });
  });
  const APURA = new Date("2027-02-05T12:00:00Z");
  let n = 0;
  async function parceiro(email: string, taxId: string, executivo = false) {
    const r = await registerPartner(ctx.db, { name: "Parceira Teste", email, password: "senha-forte-1", taxId, phone: "11999990000", acceptTerms: true }, new Date("2026-12-01T12:00:00Z"));
    const p = (await ctx.db.query.partners.findFirst({ where: eq(partners.userId, r.userId) }))!;
    await ctx.db.update(partners).set({ status: "ACTIVE", executivo }).where(eq(partners.id, p.id));
    return p.id;
  }
  const venda = (partnerId: string, base: number, quando: string, status: "AVAILABLE" | "PENDING" | "VOID" = "AVAILABLE", storeId: string | null = null) =>
    ctx.db.insert(partnerCommissions).values({ id: `pcm-${++n}`, partnerId, storeId, ruleId, kind: "SALE", baseCents: base, rateBps: 2000, amountCents: Math.round(base * 0.2), period: quando.slice(0, 7), status, dedupeKey: `t-${n}`, createdAt: quando });
  const bonus = async (partnerId: string) => (await ctx.db.select().from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, partnerId), eq(partnerCommissions.kind, "BONUS")))).map((c) => c.amountCents).sort((a, b) => a - b);

  it("online: 4 Start mantidos na semana pagam o sprint (R$ 34) e o mês (R$ 30); em garantia e estornada não contam; idempotente", async () => {
    const p = await parceiro("on@x.com", "11222333000181");
    for (let i = 0; i < 4; i++) await venda(p, 6_700, "2026-12-08T15:00:00Z");
    await venda(p, 6_700, "2026-12-09T15:00:00Z", "PENDING");
    await venda(p, 6_700, "2026-12-09T15:00:00Z", "VOID");
    expect(await apurarBonus(ctx.db, APURA)).toMatchObject({ pagos: 2 });
    expect(await bonus(p)).toEqual([3_000, 3_400]);
    expect((await ctx.db.select().from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, p), eq(partnerCommissions.kind, "BONUS"))))[0]!.status).toBe("AVAILABLE");
    await apurarBonus(ctx.db, APURA);
    expect(await bonus(p)).toEqual([3_000, 3_400]);
    // BG4: o retorno da semana mostra as lojas e o custo, e os prêmios batem com o extrato.
    const ret = await retornoDasCampanhas(ctx.db, ctx.actors.master, APURA);
    const sprint = ret.campanhas.find((c) => c.nome === "Sprint da semana")!;
    const semana = sprint.periodos.find((x) => x.custoCents > 0)!;
    expect(semana).toMatchObject({ lojasNovas: 5, lojasDosPremiados: 5, premiados: 1, custoCents: 3_400, receitaNovaMensalCents: 33_500 });
    expect(sprint.resumo.paybackMeses).toBe(0.1);
    expect(ret.conferencia).toEqual({ premiosPagosCents: 6_400, extratoCents: 6_400, batem: true });
    await expect(retornoDasCampanhas(ctx.db, { ...ctx.actors.master, role: "AFFILIATE" } as never, APURA)).rejects.toThrow();
  });

  it("antes da garantia acabar não paga; executivo cai nas campanhas da rua; venda para o próprio CNPJ não conta", async () => {
    const ex = await parceiro("rua@x.com", "11444777000161", true);
    for (let i = 0; i < 3; i++) await venda(ex, 16_700, "2026-12-08T15:00:00Z");
    await ctx.db.update(stores).set({ taxId: "11.444.777/0001-61" }).where(eq(stores.id, ctx.seed.stores.mantos.id));
    await venda(ex, 39_700, "2026-12-08T15:00:00Z", "AVAILABLE", ctx.seed.stores.mantos.id);
    expect((await apurarBonus(ctx.db, new Date("2026-12-20T12:00:00Z"))).pagos).toBe(0);
    await apurarBonus(ctx.db, APURA);
    // 3 Pro = 7,47 pontos: Ritmo da semana faixa 5 (R$ 80); Meta do mês ainda não chega a 10 pontos.
    expect(await bonus(ex)).toEqual([8_000]);
    const premio = (await ctx.db.select().from(bonusPremios).where(eq(bonusPremios.partnerId, ex)))[0]!;
    expect([premio.pontos, premio.faixaPontos, premio.status]).toEqual([747, 5, "PAGO"]);
  });

  it("orçamento: quem fez mais pontos recebe primeiro; o resto fica registrado sem orçamento", async () => {
    const campanha = (await ctx.db.query.bonusCampanhas.findFirst({ where: eq(bonusCampanhas.chave, "ONLINE_SEMANA") }))!;
    await ctx.db.update(bonusCampanhas).set({ orcamentoCents: 5_000 }).where(eq(bonusCampanhas.id, campanha.id));
    const a = await parceiro("a@x.com", "11222333000181");
    const b = await parceiro("b@x.com", "11444777000161");
    for (let i = 0; i < 5; i++) await venda(a, 6_700, "2026-12-08T15:00:00Z");
    for (let i = 0; i < 4; i++) await venda(b, 6_700, "2026-12-08T15:00:00Z");
    await apurarBonus(ctx.db, APURA);
    const premios = await ctx.db.select().from(bonusPremios).where(eq(bonusPremios.campanhaId, campanha.id));
    expect(premios.find((x) => x.partnerId === a)).toMatchObject({ status: "PAGO", valorCents: 3_400 });
    expect(premios.find((x) => x.partnerId === b)).toMatchObject({ status: "SEM_ORCAMENTO", valorCents: 0 });
  });

  it("Master: teto barra campanha cara; Comercial não edita; o parceiro vê o progresso da semana", async () => {
    const sprint = (await ctx.db.query.bonusCampanhas.findFirst({ where: eq(bonusCampanhas.chave, "ONLINE_SEMANA") }))!;
    await expect(salvarCampanha(ctx.db, ctx.actors.master, sprint.id, { nome: "Sprint", faixas: [{ pontos: 2, valorCents: 1_500 }, { pontos: 4, valorCents: 20_000 }], orcamentoCents: 50_000, ativa: true })).rejects.toThrow(/teto/);
    const { id } = await createMasterMember(ctx.db, ctx.actors.master, { name: "Pessoa Comercial", email: "com@nl.teste", password: "provisoria-123", masterFunction: "COMERCIAL" });
    await expect(salvarCampanha(ctx.db, { ...ctx.actors.master, userId: id, masterFunction: "COMERCIAL" }, sprint.id, { nome: "Sprint", faixas: sprint.faixas, orcamentoCents: 1, ativa: true })).rejects.toThrow();
    await salvarCampanha(ctx.db, ctx.actors.master, sprint.id, { nome: "Sprint da semana", faixas: [{ pontos: 2, valorCents: 1_500 }, { pontos: 4, valorCents: 3_600 }], orcamentoCents: 60_000, ativa: true });
    expect((await ctx.db.query.bonusCampanhas.findFirst({ where: eq(bonusCampanhas.id, sprint.id) }))!.versao).toBe(2);

    const p = await parceiro("on@x.com", "11222333000181");
    const agora = new Date("2026-12-09T15:00:00Z");
    await venda(p, 6_700, "2026-12-08T15:00:00Z", "PENDING");
    const meu = (await bonusDoParceiro(ctx.db, p, agora))!;
    expect(meu.publico).toBe("ONLINE");
    expect(meu.cards.find((c) => c.periodo === "SEMANA")).toMatchObject({ pontos: 100, emGarantia: 100, faltaCent: 100, proxima: { pontos: 2 } });
    const painel = await painelDeBonus(ctx.db, ctx.actors.master, agora);
    expect(painel.campanhas).toHaveLength(4);
    expect(painel.teto.ONLINE.cabe).toBe(true);
    expect(painel.campanhas.find((c) => c.chave === "ONLINE_SEMANA")!.participantes[0]).toMatchObject({ partnerId: p, pontos: 100 });
  });
});
