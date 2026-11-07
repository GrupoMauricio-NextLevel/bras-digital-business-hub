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
    await expect(lancar(ctx.db, fin, { data: D, meio: "DINHEIRO", origem: "ASSINATURA", valorCents: 5_700 }, hoje)).rejects.toThrow(/Receber assinatura/);
    await expect(lancar(ctx.db, fin, { data: D, meio: "DINHEIRO", tipo: "ENTRADA", origem: "OUTRO", valorCents: 5_700 }, hoje)).rejects.toThrow(/escreva o que foi pago/);
    await expect(lancar(ctx.db, fin, { data: D, meio: "DINHEIRO", origem: "SERVICO", valorCents: 5_700 }, hoje)).rejects.toThrow(/serviço adicional/);
    await expect(lancar(ctx.db, fin, { data: D, meio: "PIX", destino: "DINHEIRO_MAURICIO", tipo: "ENTRADA", origem: "OUTRO", valorCents: 5_700, descricao: "Fotos" }, hoje)).rejects.toThrow(/não vai para/);
    await lancar(ctx.db, fin, { data: D, meio: "DINHEIRO", tipo: "ENTRADA", origem: "OUTRO", valorCents: 5_700, storeId: ctx.seed.stores.mantos.id, descricao: "Fotos de produto" }, hoje);
    await lancar(ctx.db, fin, { data: D, meio: "PIX", destino: "PIX_NUBANK_MAURICIO", tipo: "ENTRADA", origem: "OUTRO", valorCents: 30_000, descricao: "Consultoria avulsa" }, hoje);
    await lancar(ctx.db, fin, { data: D, meio: "DINHEIRO", origem: "SANGRIA", valorCents: 3_000 }, hoje);
    await expect(lancar(ctx.db, fin, { data: D, meio: "PIX", origem: "SANGRIA", valorCents: 100 }, hoje)).rejects.toThrow(/sempre em dinheiro/);
    await expect(lancar(ctx.db, fin, { data: D, meio: "MERCADO_PAGO", origem: "ASSINATURA", valorCents: 100 }, hoje)).rejects.toThrow(/entra sozinho/);
    await expect(lancar(ctx.db, fin, { data: D, meio: "DINHEIRO", origem: "PRESTACAO_EXECUTIVO", valorCents: 100 }, hoje)).rejects.toThrow(/executivo/);
    await expect(lancar(ctx.db, fin, { data: D, meio: "DINHEIRO", origem: "AJUSTE", valorCents: 100 }, hoje)).rejects.toThrow(/entrada ou saída/);

    const dia = await caixaDoDia(ctx.db, fin, D);
    expect(dia.resumo).toMatchObject({ entradasCents: 35_700, saidasCents: 3_000, esperadoGavetaCents: 12_700 });
    expect(dia.linhas.find((l) => l.meio === "DINHEIRO" && l.origem === "OUTRO")!.loja).toBe(ctx.seed.stores.mantos.name);
    expect(dia.porDestino).toEqual([{ destino: "DINHEIRO_MAURICIO", entradasCents: 5_700, saidasCents: 3_000 }, { destino: "PIX_NUBANK_MAURICIO", entradasCents: 30_000, saidasCents: 0 }]);

    await expect(fecharCaixa(ctx.db, fin, { data: D, contadoCents: 12_500 }, hoje)).rejects.toThrow(/Faltou R\$ 2,00/);
    expect(await fecharCaixa(ctx.db, fin, { data: D, contadoCents: 12_500, motivo: "Troco dado errado" }, hoje)).toMatchObject({ esperadoCents: 12_700, diferencaCents: -200 });
    await expect(lancar(ctx.db, fin, { data: D, meio: "PIX", tipo: "ENTRADA", origem: "OUTRO", valorCents: 100, descricao: "Teste" }, hoje)).rejects.toThrow(/Só o dono/);
    await expect(reabrirCaixa(ctx.db, fin, D, "conferir")).rejects.toThrow(/Só o dono/);

    const amanha = new Date("2026-11-08T15:00:00Z");
    expect((await abrirCaixa(ctx.db, fin, {}, amanha)).saldoInicialCents).toBe(12_500);
    await reabrirCaixa(ctx.db, ctx.actors.master, D, "Conferir o Pix");
    expect((await caixaDoDia(ctx.db, fin, D)).dia!.status).toBe("ABERTO");
  });

  it("editar e estornar guardam o antes, o depois e o motivo; o dono mexe em dia fechado (reabrindo)", async () => {
    const fin = await pessoa("FINANCEIRO", "fin@nl.teste");
    await abrirCaixa(ctx.db, fin, { data: D }, hoje);
    const { id } = await lancar(ctx.db, fin, { data: D, meio: "DINHEIRO", tipo: "ENTRADA", origem: "OUTRO", valorCents: 5_700, descricao: "Plano pago antes do sistema" }, hoje);
    await expect(editarLancamento(ctx.db, fin, id, { meio: "PIX" } as never)).rejects.toThrow();
    await editarLancamento(ctx.db, fin, id, { meio: "PIX", valorCents: 14_700, motivo: "Era Pix do plano Pro" });
    let dia = await caixaDoDia(ctx.db, fin, D);
    expect(dia.linhas[0]).toMatchObject({ meio: "PIX", valorCents: 14_700, editado: true, descricao: "Plano pago antes do sistema", destino: "PIX_ITAU_NEXTLEVEL" });
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
      await lancar(ctx.db, fin, { data: d, meio: "DINHEIRO", tipo: "ENTRADA", origem: "OUTRO", valorCents: v, descricao: "Venda" }, hoje);
      await lancar(ctx.db, fin, { data: d, meio: "PIX", tipo: "ENTRADA", origem: "OUTRO", valorCents: v, descricao: "Venda" }, hoje);
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

// ---------------------------------------------------------------------------------------------------------------------
// CX2 (D270): receber manualmente, painel de assinaturas e ações pelo Master
// ---------------------------------------------------------------------------------------------------------------------
import { partnerCommissions, partners, stores } from "@/db/schema";
import { signupMember } from "@/lib/domain/store-access";
import { registerPartner } from "@/lib/domain/partners";
import { cancelarPeloMaster, estenderVencimento, estornarRecebimento, historicoDaLoja, painelDeAssinaturas, receberAssinatura, trocarPlanoPeloMaster } from "@/lib/domain/assinaturas-master";
import { subscriptionOf } from "@/lib/domain/commerce-plans";

describe("CX2: recebimentos manuais de assinatura", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); const { ensureCatalogSeed } = await import("@/lib/domain/nl-catalog"); await ensureCatalogSeed(ctx.db); });
  const AGORA = new Date("2026-12-10T15:00:00Z"); // depois da Black
  const D = "2026-12-10";
  async function loja() {
    const r = await signupMember(ctx.db, { storeName: "Moda Rua", ownerName: "Joana Lima", email: "joana@moda.com.br", password: "senha-segura-1", taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
    return r.storeId;
  }
  async function executivo() {
    const r = await registerPartner(ctx.db, { name: "Ana Executiva", email: "ana@nl.com", password: "senha-forte-1", taxId: "11222333000181", phone: "11999990000", acceptTerms: true }, AGORA);
    const p = (await ctx.db.query.partners.findFirst({ where: eq(partners.userId, r.userId) }))!;
    await ctx.db.update(partners).set({ kind: "REPRESENTATIVE", status: "ACTIVE", executivo: true }).where(eq(partners.id, p.id));
    return p.id;
  }

  it("dinheiro no balcão: renova 1 mês, libera a loja, comissão do executivo e lançamento no caixa", async () => {
    const storeId = await loja();
    const ex = await executivo();
    await expect(receberAssinatura(ctx.db, ctx.actors.master, { storeId, productKey: "COMMERCE_START", cycle: "MONTHLY", meio: "DINHEIRO" }, AGORA)).rejects.toThrow(/Abra o caixa/);
    await abrirCaixa(ctx.db, ctx.actors.master, { data: D, saldoInicialCents: 0 }, AGORA);
    await expect(receberAssinatura(ctx.db, ctx.actors.master, { storeId, productKey: "COMMERCE_START", cycle: "MONTHLY", meio: "MERCADO_PAGO" as never }, AGORA)).rejects.toThrow();
    const r = await receberAssinatura(ctx.db, ctx.actors.master, { storeId, productKey: "COMMERCE_START", cycle: "MONTHLY", meio: "DINHEIRO", partnerId: ex }, AGORA);
    expect(r.descontoCents).toBe(0);
    expect(new Date(r.pagoAte!).getTime()).toBeGreaterThan(AGORA.getTime() + 27 * 86_400_000);
    expect((await subscriptionOf(ctx.db, storeId))!.status).toBe("active");
    const s = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, storeId) }))!;
    expect([s.partnerId, s.attributedVia]).toEqual([ex, "EXECUTIVO"]);
    const com = await ctx.db.select().from(partnerCommissions).where(eq(partnerCommissions.partnerId, ex));
    expect(com).toHaveLength(1);
    expect(com[0]!.amountCents).toBe(Math.round(r.valorCents * 0.2));
    const dia = await caixaDoDia(ctx.db, ctx.actors.master, D);
    expect(dia.linhas).toHaveLength(1);
    expect(dia.linhas[0]).toMatchObject({ meio: "DINHEIRO", origem: "ASSINATURA", valorCents: r.valorCents, storeId, partnerId: ex });
    expect(dia.resumo.esperadoGavetaCents).toBe(r.valorCents);
    const h = await historicoDaLoja(ctx.db, ctx.actors.master, storeId);
    expect(h.pagamentos.find((p) => p.status === "PAID")).toMatchObject({ meio: "Dinheiro", parceiro: "Ana Executiva" });
  });

  it("desconto exige motivo; valor acima da tabela é recusado; Pix na chave e troca para o anual", async () => {
    const storeId = await loja();
    await abrirCaixa(ctx.db, ctx.actors.master, { data: D }, AGORA);
    await expect(receberAssinatura(ctx.db, ctx.actors.master, { storeId, productKey: "COMMERCE_PRO", cycle: "MONTHLY", meio: "PIX", valorCents: 10_000 }, AGORA)).rejects.toThrow(/diga o motivo/);
    await expect(receberAssinatura(ctx.db, ctx.actors.master, { storeId, productKey: "COMMERCE_PRO", cycle: "MONTHLY", meio: "PIX", valorCents: 99_999 }, AGORA)).rejects.toThrow(/passa da tabela/);
    const r = await receberAssinatura(ctx.db, ctx.actors.master, { storeId, productKey: "COMMERCE_PRO", cycle: "MONTHLY", meio: "PIX", valorCents: 10_000, motivoDesconto: "Cliente antigo do Brás" }, AGORA);
    expect(r.valorCents).toBe(10_000);
    expect(r.descontoCents).toBeGreaterThan(0);
    const antes = new Date(r.pagoAte!).getTime();
    const anual = await receberAssinatura(ctx.db, ctx.actors.master, { storeId, productKey: "COMMERCE_PRO", cycle: "ANNUAL", meio: "MAQUININHA" }, AGORA);
    expect((await subscriptionOf(ctx.db, storeId))!.cycle).toBe("ANNUAL");
    expect(new Date(anual.pagoAte!).getTime() - antes).toBeGreaterThan(360 * 86_400_000);
    expect((await caixaDoDia(ctx.db, ctx.actors.master, D)).resumo.porMeio.map((m) => m.meio)).toEqual(["PIX", "MAQUININHA"]);
  });

  it("estorno desfaz: caixa, fatura, comissão e período; painel e ações do Master", async () => {
    const storeId = await loja();
    const ex = await executivo();
    await abrirCaixa(ctx.db, ctx.actors.master, { data: D }, AGORA);
    const r = await receberAssinatura(ctx.db, ctx.actors.master, { storeId, productKey: "COMMERCE_START", cycle: "MONTHLY", meio: "MAQUININHA_VENDEDOR", partnerId: ex }, AGORA);
    let painel = await painelDeAssinaturas(ctx.db, ctx.actors.master, AGORA);
    expect(painel.linhas.find((l) => l.storeId === storeId)!.grupos).toContain("manual");
    await estornarRecebimento(ctx.db, ctx.actors.master, r.lancamentoId, "Cobrado na loja errada", AGORA);
    expect((await caixaDoDia(ctx.db, ctx.actors.master, D)).resumo.entradasCents).toBe(0);
    expect((await ctx.db.select().from(partnerCommissions).where(eq(partnerCommissions.partnerId, ex)))[0]!.status).toBe("VOID");
    const s = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, storeId) }))!;
    const inicio = Math.max(AGORA.getTime(), s.trialEndsAt ? new Date(s.trialEndsAt).getTime() : 0);
    expect(new Date(s.paidUntil!).getTime()).toBeLessThanOrEqual(inicio + 86_400_000); // voltou ao que era antes do recebimento
    painel = await painelDeAssinaturas(ctx.db, ctx.actors.master, AGORA);
    expect(painel.linhas.find((l) => l.storeId === storeId)!.grupos).not.toContain("manual");

    await expect(estenderVencimento(ctx.db, ctx.actors.master, storeId, 7, "x", AGORA)).rejects.toThrow(/motivo/);
    const e = await estenderVencimento(ctx.db, ctx.actors.master, storeId, 7, "Aguardando o Pix do cliente", AGORA);
    expect(new Date(e.pagoAte).getTime()).toBe(Math.max(inicio, new Date(s.paidUntil!).getTime()) + 7 * 86_400_000);
    painel = await painelDeAssinaturas(ctx.db, ctx.actors.master, AGORA);
    expect(painel.linhas.find((l) => l.storeId === storeId)!.grupos).toContain("vencendo");
    await trocarPlanoPeloMaster(ctx.db, ctx.actors.master, storeId, { productKey: "COMMERCE_SCALE", cycle: "MONTHLY" }, "Pediu mais produtos", AGORA);
    expect((await subscriptionOf(ctx.db, storeId))!.productKey).toBe("COMMERCE_SCALE");
    await cancelarPeloMaster(ctx.db, ctx.actors.master, storeId, "Fechou a loja física", AGORA);
    expect((await subscriptionOf(ctx.db, storeId))!.cancelAtPeriodEnd).toBe(true);
    await expect(painelDeAssinaturas(ctx.db, ctx.actors.mantos, AGORA)).rejects.toThrow();
  });
});

describe("D270: template e serviço pagos no caixa", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); const { ensureCatalogSeed } = await import("@/lib/domain/nl-catalog"); await ensureCatalogSeed(ctx.db); });
  it("template libera o tema na loja; serviço fica ligado ao produto do catálogo; destino sugerido pela forma", async () => {
    const { opcoesDoCaixa } = await import("@/lib/domain/caixa");
    const { entitlements } = await import("@/db/schema");
    const hoje = new Date("2026-12-10T15:00:00Z");
    await abrirCaixa(ctx.db, ctx.actors.master, { data: "2026-12-10" }, hoje);
    const op = await opcoesDoCaixa(ctx.db, ctx.actors.master);
    expect(op.templates.length).toBeGreaterThan(0);
    expect(op.servicos.length).toBeGreaterThan(0);
    const tema = op.templates[0]!;
    await expect(lancar(ctx.db, ctx.actors.master, { data: "2026-12-10", meio: "PIX", origem: "TEMPLATE", produtoKey: tema.key, valorCents: 9_700 }, hoje)).rejects.toThrow(/loja que comprou/);
    await expect(lancar(ctx.db, ctx.actors.master, { data: "2026-12-10", meio: "PIX", origem: "TEMPLATE", produtoKey: op.servicos[0]!.key, storeId: ctx.seed.stores.arena.id, valorCents: 9_700 }, hoje)).rejects.toThrow(/Template não encontrado/);
    const { id } = await lancar(ctx.db, ctx.actors.master, { data: "2026-12-10", meio: "PIX", origem: "TEMPLATE", produtoKey: tema.key, storeId: ctx.seed.stores.arena.id, valorCents: 9_700 }, hoje);
    const ents = await ctx.db.select().from(entitlements).where(eq(entitlements.storeId, ctx.seed.stores.arena.id));
    expect(ents.some((e) => e.key.startsWith("THEME_") && (e.note ?? "").includes(id))).toBe(true);
    await lancar(ctx.db, ctx.actors.master, { data: "2026-12-10", meio: "MAQUININHA", origem: "SERVICO", produtoKey: op.servicos[0]!.key, valorCents: 50_000 }, hoje);
    const dia = await caixaDoDia(ctx.db, ctx.actors.master, "2026-12-10");
    expect(dia.linhas.map((l) => [l.origem, l.destino])).toEqual([["TEMPLATE", "PIX_ITAU_NEXTLEVEL"], ["SERVICO", "MP_MEGATRON"]]);
  });
});
