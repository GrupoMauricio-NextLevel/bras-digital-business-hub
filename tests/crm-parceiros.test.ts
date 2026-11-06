import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { partnerCommissions, partners } from "@/db/schema";
import { newId } from "@/lib/ids";
import { registerPartner } from "@/lib/domain/partners";
import {
  avisarSegmento, avisosDoParceiro, cartoesDeParceiros, concluirTarefa, criarDesafio, csvDoSegmento, desafiosDoParceiro, etapaDe, fichaDoParceiro,
  filaDoCrm, filtrar, moverEtapa, ranking, registrarAtividade, saudeDe, salvarPerfilParceiro, salvarSegmento, segmentos,
} from "@/lib/domain/crm-parceiros";

/** CRM de parceiros do Master (D251, PV3). */
describe("CRM de parceiros", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  let a: string; let b: string;
  const NOW = new Date("2026-11-20T12:00:00Z");
  const novo = async (n: number, cpf: string) => {
    const r = await registerPartner(ctx.db, { name: `Parceiro CRM ${n}`, email: `crm${n}@exemplo.com`, password: "senha-forte-1", taxId: cpf, phone: "11999990000", acceptTerms: true });
    const id = (await ctx.db.query.partners.findFirst({ where: eq(partners.userId, r.userId) }))!.id;
    await ctx.db.update(partners).set({ createdAt: "2026-10-01T00:00:00Z" }).where(eq(partners.id, id));
    return id;
  };
  const venda = (partnerId: string, em: string, k: string, period = em.slice(0, 7)) => ctx.db.insert(partnerCommissions).values({ id: newId("pcm"), partnerId, kind: "SALE", baseCents: 14_700, rateBps: 5000, amountCents: 7_350, period, status: "PENDING", dedupeKey: k, createdAt: em });
  beforeEach(async () => { ctx = await freshDb(); a = await novo(1, "52998224725"); b = await novo(2, "11144477735"); });

  it("etapa: suspenso/inativo mandam; manual inicial some com a 1ª venda; senão ativando, produtivo ou em risco", () => {
    expect(etapaDe({ status: "SUSPENDED", manualStage: "PRODUTIVO", ultimoClienteEm: null }, NOW)).toBe("DESLIGADO");
    expect(etapaDe({ status: "INACTIVE", manualStage: null, ultimoClienteEm: null }, NOW)).toBe("INATIVO");
    expect(etapaDe({ status: "ACTIVE", manualStage: "EM_ANALISE", ultimoClienteEm: null }, NOW)).toBe("EM_ANALISE");
    expect(etapaDe({ status: "ACTIVE", manualStage: "EM_ANALISE", ultimoClienteEm: "2026-11-10T00:00:00Z" }, NOW)).toBe("PRODUTIVO");
    expect(etapaDe({ status: "ACTIVE", manualStage: null, ultimoClienteEm: null }, NOW)).toBe("ATIVANDO");
    expect(etapaDe({ status: "ACTIVE", manualStage: null, ultimoClienteEm: "2026-10-01T00:00:00Z" }, NOW)).toBe("EM_RISCO");
    expect(saudeDe({ ultimoClienteEm: "2026-11-15T00:00:00Z", indicados: 4, ativos: 4, cancelados: 0, revisao: 0 }, NOW)).toBe(100);
    expect(saudeDe({ ultimoClienteEm: null, indicados: 0, ativos: 0, cancelados: 0, revisao: 1 }, NOW)).toBe(0);
  });

  it("quadro, fila, ranking, segmento e CSV", async () => {
    await venda(a, "2026-11-10T00:00:00Z", "v1");
    await venda(a, "2026-11-12T00:00:00Z", "v2");
    await salvarPerfilParceiro(ctx.db, ctx.actors.master, b, { region: "São Paulo - Brás", nextAction: "Ligar e ensinar o link", nextActionAt: "2026-11-19T12:00:00.000Z" });
    const cs = await cartoesDeParceiros(ctx.db, ctx.actors.master, NOW);
    const ca = cs.find((c) => c.id === a)!, cb = cs.find((c) => c.id === b)!;
    expect([ca.etapa, ca.ativacoesMes, ca.receitaMesCents, ca.aPagarCents]).toEqual(["PRODUTIVO", 2, 29_400, 14_700]);
    expect(cb.etapa).toBe("ATIVANDO");
    const fila = filaDoCrm(cs, NOW).filter((f) => f.partnerId === b).map((f) => f.id.split("-")[0]);
    expect(fila).toEqual(["acao", "ativ"]);
    expect(ranking(cs).AFFILIATE![0]!.id).toBe(a);
    expect(filtrar(cs, { region: "brás" }).map((c) => c.id)).toEqual([b]);
    await salvarSegmento(ctx.db, ctx.actors.master, "Brás sem venda", { region: "brás", etapa: "ATIVANDO" });
    expect((await segmentos(ctx.db)).map((s) => s.nome)).toEqual(["Brás sem venda"]);
    expect(csvDoSegmento([ca]).split("\n")[1]).toContain("Produtivo");
  });

  it("mover no funil, notas, tarefas e ficha 360", async () => {
    await moverEtapa(ctx.db, ctx.actors.master, b, "EM_ANALISE");
    await expect(moverEtapa(ctx.db, ctx.actors.master, b, "DESLIGADO")).rejects.toThrow(/situação/);
    await expect(registrarAtividade(ctx.db, ctx.actors.master, b, { kind: "TAREFA", text: "Mandar kit" })).rejects.toThrow(/data/);
    const t = await registrarAtividade(ctx.db, ctx.actors.master, b, { kind: "TAREFA", text: "Mandar kit", dueAt: "2026-11-25T12:00:00.000Z" });
    await registrarAtividade(ctx.db, ctx.actors.master, b, { kind: "LIGACAO", text: "Falou que começa segunda" });
    await concluirTarefa(ctx.db, ctx.actors.master, t, NOW);
    await expect(concluirTarefa(ctx.db, ctx.actors.master, t, NOW)).rejects.toThrow();
    const f = await fichaDoParceiro(ctx.db, ctx.actors.master, b, NOW);
    expect(f.perfil.manualStage).toBe("EM_ANALISE");
    expect(f.tarefas[0]).toMatchObject({ texto: "Mandar kit", feita: true });
    expect(f.linha.some((e) => e.tipo === "Ligação")).toBe(true);
    expect((await cartoesDeParceiros(ctx.db, ctx.actors.master, NOW)).find((c) => c.id === b)!.etapa).toBe("EM_ANALISE");
    await expect(fichaDoParceiro(ctx.db, ctx.actors.mantos, b)).rejects.toThrow(/NextLevel/);
    await expect(moverEtapa(ctx.db, ctx.actors.mantos, b, "APROVADO")).rejects.toThrow();
  });

  it("aviso em massa chega só ao segmento; desafio do mês marca quem bateu (reconhecimento, sem dinheiro: D260)", async () => {
    await salvarPerfilParceiro(ctx.db, ctx.actors.master, a, { region: "Brás" });
    const r = await avisarSegmento(ctx.db, ctx.actors.master, { region: "brás" }, "Semana da Black", "Use o cupom de 7 dias com seus clientes.", NOW);
    expect(r.enviados).toBe(1);
    expect((await avisosDoParceiro(ctx.db, a, NOW)).map((x) => x.title)).toEqual(["Semana da Black"]);
    expect(await avisosDoParceiro(ctx.db, b, NOW)).toEqual([]);
    await criarDesafio(ctx.db, ctx.actors.master, { title: "3 lojas em novembro", period: "2026-11", target: 3, kinds: [] });
    await expect(criarDesafio(ctx.db, ctx.actors.master, { title: "Desafio com prêmio", period: "2026-11", target: 3, bonusCents: 10_000, kinds: [] })).rejects.toThrow();
    await venda(a, "2026-11-02T00:00:00Z", "d1"); await venda(a, "2026-11-03T00:00:00Z", "d2");
    expect((await desafiosDoParceiro(ctx.db, a, NOW))[0]).toMatchObject({ feitos: 2, batido: false });
    await venda(a, "2026-11-04T00:00:00Z", "d3");
    expect((await desafiosDoParceiro(ctx.db, a, NOW))[0]).toMatchObject({ feitos: 3, batido: true, bonusCents: 0 });
  });
});
