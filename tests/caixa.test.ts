import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { caixaHistorico, financeInvoices, nextlevelPayments } from "@/db/schema";
import { dataSP, diferencaDoFechamento, limitesDoDia, resumoDoDia, semanaDe, somarDias } from "@/lib/finance/caixa-regras";
import { abrirCaixa, caixaDaSemana, caixaDoDia, editarLancamento, estornarLancamento, fecharCaixa, lancar, listaDeLancamentos, reabrirCaixa } from "@/lib/domain/caixa";
import { createMasterMember } from "@/lib/domain/equipe-master";

describe("caixa (puro, CX0)", () => {
  it("data de São Paulo, semana de segunda a domingo e limites do dia", () => {
    expect(dataSP(new Date("2026-11-08T02:30:00Z"))).toBe("2026-11-07"); // 23h30 em São Paulo
    expect(dataSP(new Date("2026-11-08T03:00:00Z"))).toBe("2026-11-08");
    expect(semanaDe("2026-11-07")).toEqual(["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"]);
    expect(semanaDe("2026-11-08")[0]).toBe("2026-11-02"); // domingo fecha a semana
    expect(semanaDe("2026-11-09")[0]).toBe("2026-11-09");
    expect(somarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(limitesDoDia("2026-11-07").inicio.toISOString()).toBe("2026-11-07T03:00:00.000Z");
  });

  it("resumo por meio; estornado não conta; gaveta só mexe com dinheiro", () => {
    const r = resumoDoDia([
      { tipo: "ENTRADA", meio: "DINHEIRO", valorCents: 5_700 },
      { tipo: "ENTRADA", meio: "PIX", valorCents: 14_700 },
      { tipo: "SAIDA", meio: "DINHEIRO", valorCents: 2_000 },
      { tipo: "ENTRADA", meio: "MERCADO_PAGO", valorCents: 34_700 },
      { tipo: "ENTRADA", meio: "DINHEIRO", valorCents: 99_999, estornado: true },
    ], 10_000);
    expect(r).toMatchObject({ entradasCents: 55_100, saidasCents: 2_000, saldoCents: 53_100, esperadoGavetaCents: 13_700, quantidade: 4 });
    expect(r.porMeio.map((m) => m.meio)).toEqual(["DINHEIRO", "PIX", "MERCADO_PAGO"]);
    expect(diferencaDoFechamento(13_700, 13_500)).toBe(-200);
  });
});

describe("caixa no banco (CX1)", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });
  const hoje = new Date("2026-11-07T15:00:00Z");
  const D = "2026-11-07";
  async function pessoa(fn: "FINANCEIRO" | "COMERCIAL", email: string) {
    const { id } = await createMasterMember(ctx.db, ctx.actors.master, { name: `Pessoa ${fn}`, email, password: "provisoria-123", masterFunction: fn });
    return { ...ctx.actors.master, userId: id, masterFunction: fn };
  }

  it("dono e Financeiro operam; Comercial e lojista não", async () => {
    const com = await pessoa("COMERCIAL", "com@nl.teste");
    await expect(abrirCaixa(ctx.db, com, { data: D }, hoje)).rejects.toThrow();
    await expect(caixaDoDia(ctx.db, ctx.actors.mantos, D)).rejects.toThrow();
    const fin = await pessoa("FINANCEIRO", "fin@nl.teste");
    expect((await abrirCaixa(ctx.db, fin, { data: D, saldoInicialCents: 10_000 }, hoje)).saldoInicialCents).toBe(10_000);
    await expect(abrirCaixa(ctx.db, fin, { data: D }, hoje)).rejects.toThrow(/já está aberto/);
    await expect(abrirCaixa(ctx.db, fin, { data: "2026-11-08" }, hoje)).rejects.toThrow(/ainda não chegou/);
  });

  it("abre, lança, fecha com diferença e motivo; dia fechado trava; só o dono reabre; amanhã sugere o contado", async () => {
    const fin = await pessoa("FINANCEIRO", "fin@nl.teste");
    await expect(lancar(ctx.db, fin, { data: D, meio: "DINHEIRO", origem: "ASSINATURA", valorCents: 5_700 }, hoje)).rejects.toThrow(/não foi aberto/);
    await abrirCaixa(ctx.db, ctx.actors.master, { data: D, saldoInicialCents: 10_000 }, hoje);
    await lancar(ctx.db, fin, { data: D, meio: "DINHEIRO", origem: "ASSINATURA", valorCents: 5_700, storeId: ctx.seed.stores.mantos.id, descricao: "Plano Start" }, hoje);
    await lancar(ctx.db, fin, { data: D, meio: "PIX", origem: "SERVICO", valorCents: 30_000 }, hoje);
    await lancar(ctx.db, fin, { data: D, meio: "DINHEIRO", origem: "SANGRIA", valorCents: 3_000 }, hoje);
    await expect(lancar(ctx.db, fin, { data: D, meio: "PIX", origem: "SANGRIA", valorCents: 100 }, hoje)).rejects.toThrow(/sempre em dinheiro/);
    await expect(lancar(ctx.db, fin, { data: D, meio: "MERCADO_PAGO", origem: "ASSINATURA", valorCents: 100 }, hoje)).rejects.toThrow(/entra sozinho/);
    await expect(lancar(ctx.db, fin, { data: D, meio: "DINHEIRO", origem: "PRESTACAO_EXECUTIVO", valorCents: 100 }, hoje)).rejects.toThrow(/executivo/);
    await expect(lancar(ctx.db, fin, { data: D, meio: "DINHEIRO", origem: "AJUSTE", valorCents: 100 }, hoje)).rejects.toThrow(/entrada ou saída/);

    const dia = await caixaDoDia(ctx.db, fin, D);
    expect(dia.resumo).toMatchObject({ entradasCents: 35_700, saidasCents: 3_000, esperadoGavetaCents: 12_700 });
    expect(dia.linhas.find((l) => l.meio === "DINHEIRO" && l.origem === "ASSINATURA")!.loja).toBe(ctx.seed.stores.mantos.name);

    await expect(fecharCaixa(ctx.db, fin, { data: D, contadoCents: 12_500 }, hoje)).rejects.toThrow(/Faltou R\$ 2,00/);
    expect(await fecharCaixa(ctx.db, fin, { data: D, contadoCents: 12_500, motivo: "Troco dado errado" }, hoje)).toMatchObject({ esperadoCents: 12_700, diferencaCents: -200 });
    await expect(lancar(ctx.db, fin, { data: D, meio: "PIX", origem: "SERVICO", valorCents: 100 }, hoje)).rejects.toThrow(/Só o dono/);
    await expect(reabrirCaixa(ctx.db, fin, D, "conferir")).rejects.toThrow(/Só o dono/);

    const amanha = new Date("2026-11-08T15:00:00Z");
    expect((await abrirCaixa(ctx.db, fin, {}, amanha)).saldoInicialCents).toBe(12_500);
    await reabrirCaixa(ctx.db, ctx.actors.master, D, "Conferir o Pix");
    expect((await caixaDoDia(ctx.db, fin, D)).dia!.status).toBe("ABERTO");
  });

  it("editar e estornar guardam o antes, o depois e o motivo; o dono mexe em dia fechado (reabrindo)", async () => {
    const fin = await pessoa("FINANCEIRO", "fin@nl.teste");
    await abrirCaixa(ctx.db, fin, { data: D }, hoje);
    const { id } = await lancar(ctx.db, fin, { data: D, meio: "DINHEIRO", origem: "ASSINATURA", valorCents: 5_700 }, hoje);
    await expect(editarLancamento(ctx.db, fin, id, { meio: "PIX" } as never)).rejects.toThrow();
    await editarLancamento(ctx.db, fin, id, { meio: "PIX", valorCents: 14_700, motivo: "Era Pix do plano Pro" });
    let dia = await caixaDoDia(ctx.db, fin, D);
    expect(dia.linhas[0]).toMatchObject({ meio: "PIX", valorCents: 14_700, editado: true });
    expect(dia.resumo.esperadoGavetaCents).toBe(0);
    await fecharCaixa(ctx.db, fin, { data: D, contadoCents: 0 }, hoje);
    await expect(estornarLancamento(ctx.db, fin, id, "lançado em dobro")).rejects.toThrow(/Só o dono/);
    await estornarLancamento(ctx.db, ctx.actors.master, id, "lançado em dobro");
    dia = await caixaDoDia(ctx.db, fin, D);
    expect(dia.dia!.status).toBe("ABERTO");
    expect(dia.resumo.entradasCents).toBe(0);
    expect(dia.linhas[0]).toMatchObject({ estornado: true, estornoMotivo: "lançado em dobro" });
    const h = await ctx.db.select().from(caixaHistorico).where(eq(caixaHistorico.lancamentoId, id));
    expect(h.map((x) => x.acao)).toEqual(["LANCAR", "EDITAR", "ESTORNAR"]);
    expect(h[1]).toMatchObject({ antes: { meio: "DINHEIRO", valorCents: 5_700 }, depois: { meio: "PIX", valorCents: 14_700 }, motivo: "Era Pix do plano Pro" });
    expect((await caixaDoDia(ctx.db, fin, D)).historico.map((x) => x.acao)).toEqual(["ABRIR", "FECHAR", "REABRIR"]);
  });

  it("semana soma os dias; lista filtra por meio", async () => {
    const fin = await pessoa("FINANCEIRO", "fin@nl.teste");
    for (const [d, v] of [["2026-11-03", 1_000], ["2026-11-05", 2_000]] as const) {
      await abrirCaixa(ctx.db, fin, { data: d }, hoje);
      await lancar(ctx.db, fin, { data: d, meio: "DINHEIRO", origem: "SERVICO", valorCents: v }, hoje);
      await lancar(ctx.db, fin, { data: d, meio: "PIX", origem: "SERVICO", valorCents: v }, hoje);
    }
    const s = await caixaDaSemana(ctx.db, fin, D);
    expect(s.datas[0]).toBe("2026-11-02");
    expect(s.total.entradasCents).toBe(6_000);
    expect(s.porDia.find((x) => x.data === "2026-11-05")!.resumo.entradasCents).toBe(4_000);
    const l = await listaDeLancamentos(ctx.db, fin, { de: "2026-11-02", ate: D, meio: "PIX" });
    expect(l.linhas.map((x) => x.valorCents)).toEqual([2_000, 1_000]);
  });

  it("pagamento do Mercado Pago entra sozinho no dia, sem mexer na gaveta e sem poder ser lançado à mão", async () => {
    await ctx.db.insert(financeInvoices).values({ id: "inv-mp", dedupeKey: "inv-mp", payerType: "STORE", storeId: ctx.seed.stores.mantos.id, kind: "STORE_PLAN", description: "Plano Pro", amountCents: 14_700, status: "PAID", dueDate: "2026-11-07T12:00:00Z", paidAt: "2026-11-07T14:00:00Z" });
    await ctx.db.insert(nextlevelPayments).values({ id: "nlp-1", invoiceId: "inv-mp", status: "PAID", method: "PIX", amountCents: 14_700, paidAt: "2026-11-07T14:00:00Z" });
    await abrirCaixa(ctx.db, ctx.actors.master, { data: D, saldoInicialCents: 0 }, hoje);
    const dia = await caixaDoDia(ctx.db, ctx.actors.master, D);
    expect(dia.linhas).toHaveLength(1);
    expect(dia.linhas[0]).toMatchObject({ meio: "MERCADO_PAGO", origem: "ASSINATURA", valorCents: 14_700, automatico: true, loja: ctx.seed.stores.mantos.name });
    expect(dia.resumo).toMatchObject({ entradasCents: 14_700, esperadoGavetaCents: 0 });
    expect((await caixaDoDia(ctx.db, ctx.actors.master, "2026-11-06")).linhas).toHaveLength(0);
  });
});
