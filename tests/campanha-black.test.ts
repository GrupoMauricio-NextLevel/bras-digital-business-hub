import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { nlSubscriptions } from "@/db/schema";
import { BLACK_PADRAO, anualBlackCents, campanhaBlack, estadoBlack, salvarCampanhaBlack } from "@/lib/domain/campanha-black";
import { getCatalogItem } from "@/lib/domain/nl-catalog";
import { signupMember } from "@/lib/domain/store-access";

/** Black NextLevel (D229): uma configuração, contagem verdadeira e preço D228 entrando sozinho no fim. */
const DURANTE = new Date("2026-11-20T15:00:00Z");
const ULTIMA_HORA = new Date("2026-12-01T02:30:00Z"); // 30/11 às 23h30 em Brasília
const DEPOIS = new Date("2026-12-01T03:00:01Z"); // 01/12 à 0h00 em Brasília

describe("Black NextLevel: estado da campanha (puro)", () => {
  it("ativa só entre o início e 30/11 às 23h59 de Brasília; última hora e prorrogação", () => {
    expect(estadoBlack(BLACK_PADRAO, new Date("2026-11-01T12:00:00Z")).ativa).toBe(false);
    const d = estadoBlack(BLACK_PADRAO, DURANTE);
    expect(d).toMatchObject({ ativa: true, ultimaHora: false, prorrogada: false });
    expect(d.restanteMs).toBe(Date.parse("2026-12-01T02:59:59Z") - DURANTE.getTime());
    expect(estadoBlack(BLACK_PADRAO, ULTIMA_HORA).ultimaHora).toBe(true);
    expect(estadoBlack(BLACK_PADRAO, DEPOIS)).toMatchObject({ ativa: false, restanteMs: 0 });
    expect(estadoBlack({ ...BLACK_PADRAO, ativa: false }, DURANTE).ativa).toBe(false);
    expect(estadoBlack({ ...BLACK_PADRAO, fim: "2026-12-08T02:59:59.000Z" }, DURANTE).prorrogada).toBe(true);
  });
  it("anual na Black: paga 10 meses e leva 12", () => {
    expect(anualBlackCents(44_400)).toBe(37_000); // Start: R$ 30,83/mês
    expect(anualBlackCents(142_800)).toBe(119_000); // Pro: R$ 99,17/mês
    expect(anualBlackCents(356_400)).toBe(297_000); // Scale: R$ 247,50/mês
  });
});

describe("Black NextLevel: preço e assinatura", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });

  it("até 30/11 vale R$ 57/147/347; a partir de 01/12 entra sozinho R$ 67/167/397 (D228)", async () => {
    const preco = async (key: string, now: Date) => (await getCatalogItem(ctx.db, { key }, {}, now))!.prices;
    expect((await preco("COMMERCE_START", DURANTE)).MONTHLY!.amountCents).toBe(5_700);
    expect((await preco("COMMERCE_START", DEPOIS)).MONTHLY!.amountCents).toBe(6_700);
    expect((await preco("COMMERCE_PRO", DEPOIS)).ANNUAL!.amountCents).toBe(166_800);
    expect((await preco("COMMERCE_SCALE", DEPOIS)).MONTHLY!.amountCents).toBe(39_700);
  });

  it("anual assinado na Black fica com 2 meses grátis congelados; mensal não muda", async () => {
    const sign = (email: string, taxId: string, cycle: "MONTHLY" | "ANNUAL", now: Date) =>
      signupMember(ctx.db, { storeName: `Loja ${email}`, ownerName: "Dona Teste", email, password: "senha-segura-1", taxId, brand: "NEXTLEVEL_COMMERCE", independent: true, plan: "COMMERCE_START", cycle }, now);
    const anual = await sign("anual@loja.com", "529.982.247-25", "ANNUAL", DURANTE);
    expect((await ctx.db.query.nlSubscriptions.findFirst({ where: eq(nlSubscriptions.storeId, anual.storeId) }))!.amountCents).toBe(37_000);
    const mensal = await sign("mensal@loja.com", "111.444.777-35", "MONTHLY", DURANTE);
    expect((await ctx.db.query.nlSubscriptions.findFirst({ where: eq(nlSubscriptions.storeId, mensal.storeId) }))!.amountCents).toBe(5_700);
    const depois = await sign("depois@loja.com", "390.533.447-05", "ANNUAL", DEPOIS);
    expect((await ctx.db.query.nlSubscriptions.findFirst({ where: eq(nlSubscriptions.storeId, depois.storeId) }))!.amountCents).toBe(58_800);
  });

  it("Master prorroga: a contagem e a virada de preço andam juntas; nunca encurta a promessa", async () => {
    const novoFim = "2026-12-08T02:59:59.000Z";
    await salvarCampanhaBlack(ctx.db, ctx.actors.master, { ativa: true, fim: novoFim, chamada: "Prorrogada: anual com 2 meses grátis" });
    expect((await campanhaBlack(ctx.db)).fim).toBe(novoFim);
    expect((await getCatalogItem(ctx.db, { key: "COMMERCE_START" }, {}, DEPOIS))!.prices.MONTHLY!.amountCents).toBe(5_700);
    expect((await getCatalogItem(ctx.db, { key: "COMMERCE_START" }, {}, new Date("2026-12-08T03:00:01Z")))!.prices.MONTHLY!.amountCents).toBe(6_700);
    await salvarCampanhaBlack(ctx.db, ctx.actors.master, { ativa: true, fim: "2026-11-25T02:59:59.000Z", chamada: "Tentativa de encurtar" });
    expect(Date.parse((await campanhaBlack(ctx.db)).fim)).toBeGreaterThanOrEqual(Date.parse(BLACK_PADRAO.fim));
    await expect(salvarCampanhaBlack(ctx.db, ctx.actors.arena, { ativa: false, fim: novoFim, chamada: "x" })).rejects.toThrow();
  });
});

describe("Black: vendedor e duelo do 1º ano", () => {
  it("o vendedor fala da Black com o mesmo fim da contagem", async () => {
    const { blackTxt } = await import("@/lib/ia/vendedor-publico");
    expect(blackTxt({ black: { fim: BLACK_PADRAO.fim, chamada: BLACK_PADRAO.chamada } })).toContain("até 30/11 às 23:59");
    expect(blackTxt({ black: null })).toBe("");
  });
  it("no 1º ano, a Black NextLevel vence o melhor anual de cada concorrente", async () => {
    const { dueloPrimeiroAno } = await import("@/lib/marcas/comparativo-ecommerce");
    const d = dueloPrimeiroAno(anualBlackCents(44_400), 1_000_000);
    expect(d.nextlevel.totalCents).toBe(37_000);
    expect(d.outras.every((o) => o.totalCents > d.nextlevel.totalCents)).toBe(true);
    expect(d.vantagemCents).toBeGreaterThan(100_000); // mais de R$ 1.000 de vantagem no 1º ano
  });
});
