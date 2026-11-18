import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { convidarMembro, criarAgencia } from "@/lib/agencias/agencias";
import { criarCliente, definirEquipeDoCliente } from "@/lib/agencias/clientes";
import { etapaInicial, etapaParaCliente, proximaEtapa } from "@/lib/agencias/fluxo";
import { avancarPeca, criarPeca, fichaDaPeca, pedirAjuste } from "@/lib/agencias/producao";
import { compactar, lerPersonalizacao, MODELOS, SEGMENTOS, vocabulario } from "@/lib/agencias/personalizacao";
import { salvarPersonalizacao } from "@/lib/agencias/personalizar";

const antes = process.env.AGENCIAS_V1;
beforeAll(() => { process.env.AGENCIAS_V1 = "true"; });
afterAll(() => { process.env.AGENCIAS_V1 = antes; });
const HOJE = "2026-11-18";

describe("personalização do painel (D340), regras puras", () => {
  it("vazio = agência como sempre foi", () => {
    const v = vocabulario({});
    expect(v.segmento).toBe("AGENCIA");
    expect(v.nomes).toMatchObject({ painel: "Painel da Agência", entrega: "Peça", producao: "Produção" });
    expect(v.etapa.EDICAO).toBe("Edição");
    expect(v.funcao.GRAVACAO).toBe("Gravação");
    expect(v.etapasAtivas.size).toBe(9);
    expect(v.exigirLinks).toBe(true);
    expect(v.ocultos).toEqual([]);
    // O cliente vê exatamente o que via antes.
    const paraCliente = Object.fromEntries(Object.entries(v.etapas).map(([k, x]) => [k, x.cliente]));
    for (const k of Object.keys(paraCliente) as (keyof typeof v.etapas)[]) expect(paraCliente[k]).toBe(etapaParaCliente(k));
  });
  it("todo modelo tem nomes completos; Administrador, Gestor e Publicado nunca desligam", () => {
    for (const s of SEGMENTOS) {
      const v = vocabulario({ segmento: s, funcoes: { ADMIN: { ativa: false }, GESTOR: { ativa: false } }, etapas: { PUBLICADO: { ativa: false } } });
      expect(Object.values(v.nomes).every((x) => x.length >= 2), s).toBe(true);
      expect(v.funcoes.ADMIN.ativa && v.funcoes.GESTOR.ativa && v.etapas.PUBLICADO.ativa, s).toBe(true);
    }
  });
  it("a empresa edita por cima do modelo: nomes, departamentos, etapas, tipos e gavetas", () => {
    const v = vocabulario({ segmento: "CONTABILIDADE", nomes: { painel: "Painel Contábil Silva" }, funcoes: { EDICAO: { nome: "DP", ativa: false } }, etapas: { REVISAO: { ativa: false }, CAPTACAO: { nome: "Cálculo" } }, tipos: { STORIES: { ativo: false } }, modulos: { placar: false } });
    expect(v.nomes.painel).toBe("Painel Contábil Silva");
    expect(v.nomes.entrega).toBe("Obrigação");
    expect(v.funcao.EDICAO).toBe("DP");
    expect(v.etapas.EDICAO.funcao).toBe("GESTOR"); // departamento desligado: a etapa vai para o Gestor
    expect(v.etapasAtivas.has("REVISAO")).toBe(false);
    expect(v.etapa.CAPTACAO).toBe("Cálculo");
    expect(v.tiposAtivos).not.toContain("STORIES");
    expect(v.ocultos).toEqual(expect.arrayContaining(["/agencia/placar", "/agencia/trafego"]));
    expect(v.renomear["/agencia/producao"]).toBe("Rotinas do mês");
  });
  it("etapas desligadas são puladas; ajuste volta para a última etapa ligada antes da revisão", () => {
    const v = vocabulario({ segmento: "SERVICOS", etapas: { PLANEJAMENTO: { ativa: false }, EDICAO: { ativa: false } } });
    expect(etapaInicial(v.etapasAtivas)).toBe("ROTEIRO");
    const ctx = { tipo: "VIDEO" as const, exigeAprovacao: true, ativas: v.etapasAtivas, pulaExecucao: false };
    expect(proximaEtapa("CAPTACAO", ctx)).toBe("REVISAO");
    expect(proximaEtapa("PUBLICADO", ctx)).toBeNull(); // Encerrado vem desligado no modelo de serviços
    expect(v.etapaDeAjuste).toBe("CAPTACAO");
  });
  it("grava só o que mudou; nome igual ao do modelo some; lixo vira vazio", () => {
    const c = compactar({ segmento: "JURIDICO", nomes: { entrega: MODELOS.JURIDICO.nomes.entrega, painel: "Escritório Lima" }, etapas: { ROTEIRO: { nome: MODELOS.JURIDICO.etapas.ROTEIRO.nome, ativa: false } } });
    expect(c.nomes).toEqual({ painel: "Escritório Lima" });
    expect(c.etapas).toEqual({ ROTEIRO: { ativa: false } });
    expect(lerPersonalizacao({ segmento: "NAO_EXISTE" }).segmento).toBe("AGENCIA");
    expect(() => compactar({ nomes: { painel: "x" } })).toThrow(/curto/);
  });
});

describe("esteira do mês com os nomes da empresa (D341)", () => {
  it("agência mantém os trechos de sempre; outro segmento usa os nomes e esconde trecho desligado e vazio", async () => {
    const { esteiraDoMes } = await import("@/lib/agencias/painel-vivo");
    expect(esteiraDoMes({ EDICAO: 2 }, vocabulario({})).trechos.map((t) => t.rotulo)).toEqual(["Planejar", "Roteiro", "Gravação", "Edição", "Aprovação", "Publicado"]);
    const v = vocabulario({ segmento: "CONTABILIDADE", etapas: { PLANEJAMENTO: { ativa: false } } });
    const e = esteiraDoMes({ CAPTACAO: 3, PUBLICADO: 1 }, v);
    expect(e.trechos.map((t) => t.rotulo)).toEqual(["Conferência", "Apuração", "Lançamentos", "Conferência do cliente", "Entregue ao fisco"]);
    expect(e.total).toBe(4);
  });
});

describe("personalização no fluxo de verdade (D340)", () => {
  it("empresa de serviços: nasce na primeira etapa ligada, sem exigir links, pula etapas desligadas; só o admin personaliza", async () => {
    const ctx = await freshDb();
    const ator = async (id: string): Promise<Actor> => actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, id) }))!);
    const a = await criarAgencia(ctx.db, ctx.actors.master, { nome: "Contábil Silva", responsavel: { nome: "Dona", email: "dona@contabil.com.br", senha: "senha-provisoria" } });
    const admin = await ator(a.userId);
    const fiscal = await ator((await convidarMembro(ctx.db, admin, { nome: "Ana Fiscal", email: "ana@contabil.com.br", senha: "senha-provisoria", funcao: "ROTEIRO" })).userId);
    const contabil = await ator((await convidarMembro(ctx.db, admin, { nome: "Beto Contábil", email: "beto@contabil.com.br", senha: "senha-provisoria", funcao: "GRAVACAO" })).userId);
    await expect(salvarPersonalizacao(ctx.db, fiscal, { segmento: "CONTABILIDADE" })).rejects.toThrow(/administrador/);
    await salvarPersonalizacao(ctx.db, admin, { segmento: "CONTABILIDADE", etapas: { PLANEJAMENTO: { ativa: false }, EDICAO: { ativa: false }, REVISAO: { ativa: false } } });
    const c = await criarCliente(ctx.db, admin, { nome: "Padaria Pão Bom", incluso: {}, responsavelId: a.userId });
    await definirEquipeDoCliente(ctx.db, admin, c.id, [fiscal.userId, contabil.userId]);
    const { id } = await criarPeca(ctx.db, fiscal, { clienteId: c.id, titulo: "DAS de novembro", mes: "2026-11" }, HOJE);
    const etapa = async () => (await fichaDaPeca(ctx.db, admin, id)).peca;
    expect(await etapa()).toMatchObject({ etapa: "ROTEIRO", responsavelId: fiscal.userId });
    await avancarPeca(ctx.db, fiscal, id, HOJE);
    expect(await etapa()).toMatchObject({ etapa: "CAPTACAO", responsavelId: contabil.userId });
    await avancarPeca(ctx.db, contabil, id, HOJE); // sem pedir link; Acabamento e Revisão desligados
    expect((await etapa()).etapa).toBe("APROVACAO");
    await pedirAjuste(ctx.db, admin, id, "Faltou a nota de outubro", HOJE);
    expect((await etapa()).etapa).toBe("CAPTACAO");
  });
});
