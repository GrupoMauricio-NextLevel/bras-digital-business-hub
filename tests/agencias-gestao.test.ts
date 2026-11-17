import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { agenciaClientes, emailOutbox, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { codigoDaJanela } from "@/lib/domain/conta-cliente";
import { convidarMembro, criarAgencia } from "@/lib/agencias/agencias";
import { criarCliente, definirEquipeDoCliente } from "@/lib/agencias/clientes";
import { criarOportunidade, virarCliente } from "@/lib/agencias/comercial";
import { salvarDadosJuridicos } from "@/lib/agencias/contratos";
import { entrarNoPortal, enviarSolicitacao, passeVerComoCliente, portalDaPrevia, portalDoCliente, responderPeloCliente } from "@/lib/agencias/portal";
import { ativarIndiqueEGanhe, solucoesDaAgencia } from "@/lib/agencias/solucoes";
import {
  atendimentoDaAgencia, caixaDeEntrada, conversaNaAgencia, criarCampanha, crescimentoDaAgencia, custoPorResultado, definirComissao, executivosDoMes, lancarNumeros, mesaDeAnuncios,
  mudarSituacaoCampanha, perguntarAoAgente, placarDoMes, responderNaConversa, salvarMetas, serieDeCrescimento,
} from "@/lib/agencias/gestao";

let ctx: Awaited<ReturnType<typeof freshDb>>;
const antes = process.env.AGENCIAS_V1;
beforeAll(() => { process.env.AGENCIAS_V1 = "true"; });
afterAll(() => { process.env.AGENCIAS_V1 = antes; });
async function ator(id: string): Promise<Actor> { return actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, id) }))!); }
const MES = new Date().toISOString().slice(0, 7);

async function cenario() {
  const a = await criarAgencia(ctx.db, ctx.actors.master, { nome: "UPClips", responsavel: { nome: "Léo", email: "leo@up.com.br", senha: "senha-provisoria" } });
  const admin = await ator(a.userId);
  const trafego = await ator((await convidarMembro(ctx.db, admin, { nome: "Alan", email: "alan@up.com.br", senha: "senha-provisoria", funcao: "TRAFEGO" })).userId);
  const editor = await ator((await convidarMembro(ctx.db, admin, { nome: "Gu", email: "gu@up.com.br", senha: "senha-provisoria", funcao: "EDICAO" })).userId);
  const c = await criarCliente(ctx.db, admin, { nome: "CCV Vidros", email: "carla@ccv.com.br", valorMensalCents: 250_000, diaVencimento: 10, incluso: { videos: 4 } });
  await definirEquipeDoCliente(ctx.db, admin, c.id, [trafego.userId]);
  const slug = (await ctx.db.query.agencias.findFirst())!.slug;
  return { admin, trafego, editor, clienteId: c.id, agenciaId: a.agenciaId, slug };
}

describe("regras puras da gestão (D325)", () => {
  it("crescimento mês a mês e custo por resultado", () => {
    const s = serieDeCrescimento([
      { inicioEm: "2026-09-05", encerradoEm: null, createdAt: "2026-09-05T00:00:00Z", valorMensalCents: 100_000, situacao: "ATIVO" },
      { inicioEm: "2026-10-01", encerradoEm: "2026-11-03T00:00:00Z", createdAt: "2026-10-01T00:00:00Z", valorMensalCents: 50_000, situacao: "ENCERRADO" },
    ], ["2026-09", "2026-10", "2026-11"]);
    expect(s.map((x) => [x.ativos, x.novos, x.encerrados, x.recorrenteCents])).toEqual([[1, 1, 0, 100_000], [2, 1, 0, 150_000], [1, 0, 1, 100_000]]);
    expect(s[2]!.cancelamentoPct).toBe(50);
    expect(custoPorResultado(10_000, 4)).toBe(2500); expect(custoPorResultado(10_000, 0)).toBeNull();
  });
});

describe("gestão da agência (D325)", () => {
  beforeEach(async () => { ctx = await freshDb(); });

  it("metas e placar; crescimento e comissões só para quem vê valores", async () => {
    const s = await cenario();
    await expect(salvarMetas(ctx.db, s.editor, MES, { entregas: 10 })).rejects.toThrow(/administrador e do gestor/);
    await salvarMetas(ctx.db, s.admin, MES, { entregas: 10, novosClientes: 2, receitaCents: 500_000 });
    const p = await placarDoMes(ctx.db, s.admin, MES);
    expect(p.itens.map((i) => [i.chave, i.meta])).toEqual([["entregas", 10], ["novosClientes", 2], ["receitaCents", 500_000]]);
    expect((await placarDoMes(ctx.db, s.editor, MES)).itens.map((i) => i.chave)).toEqual(["entregas", "novosClientes"]);
    await expect(crescimentoDaAgencia(ctx.db, s.editor)).rejects.toThrow(/administrador e do financeiro/);
    expect((await crescimentoDaAgencia(ctx.db, s.admin)).at(-1)).toMatchObject({ ativos: 1, recorrenteCents: 250_000 });
    const { id } = await criarOportunidade(ctx.db, s.admin, { empresa: "Padaria Sol", responsavelId: s.trafego.userId });
    const { clienteId } = await virarCliente(ctx.db, s.admin, id);
    expect((await ctx.db.query.agenciaClientes.findFirst({ where: eq(agenciaClientes.id, clienteId) }))!.vendedorId).toBe(s.trafego.userId);
    await definirComissao(ctx.db, s.admin, s.trafego.userId, 10);
    expect((await executivosDoMes(ctx.db, s.admin, MES)).linhas).toEqual([expect.objectContaining({ nome: "Alan", comissaoPct: 10, carteira: 1, fechadosNoMes: 1 })]);
    await expect(definirComissao(ctx.db, s.trafego, s.trafego.userId, 50)).rejects.toThrow(/administrador/);
  });

  it("tráfego: campanha por cliente, números e mesa; editor fora", async () => {
    const s = await cenario();
    await expect(criarCampanha(ctx.db, s.editor, { clienteId: s.clienteId, nome: "Reels" })).rejects.toThrow(/tráfego/);
    const { id } = await criarCampanha(ctx.db, s.trafego, { clienteId: s.clienteId, nome: "Reels novembro", verbaMensalCents: 100_000 });
    await mudarSituacaoCampanha(ctx.db, s.trafego, id, "NO_AR");
    await lancarNumeros(ctx.db, s.trafego, id, { investidoCents: 30_000, resultados: 12 });
    const m = await mesaDeAnuncios(ctx.db, s.admin);
    expect(m.campanhas[0]).toMatchObject({ situacao: "NO_AR", custoPorResultadoCents: 2500, desatualizada: false });
    expect(m.porCliente[0]).toMatchObject({ cliente: "CCV Vidros", noAr: 1, investidoCents: 30_000 });
  });

  it("atendimento: conversa dos dois lados, e-mail ao cliente e caixa de entrada; ver como cliente só leitura", async () => {
    const s = await cenario();
    const agora = new Date();
    const token = await entrarNoPortal(ctx.db, s.slug, "carla@ccv.com.br", codigoDaJanela(`ag:${s.agenciaId}`, "carla@ccv.com.br", Math.floor(agora.getTime() / 600_000)), agora);
    const { id } = await enviarSolicitacao(ctx.db, s.agenciaId, token, s.clienteId, { tipo: "PEDIDO", texto: "Vídeo do aniversário" });
    expect((await atendimentoDaAgencia(ctx.db, s.admin))[0]).toMatchObject({ id, situacao: "ABERTA", mensagens: 1 });
    await responderNaConversa(ctx.db, s.admin, id, "Combinado, gravamos dia 20");
    await responderPeloCliente(ctx.db, s.agenciaId, token, s.clienteId, id, "Pode ser de manhã?");
    const c = await conversaNaAgencia(ctx.db, s.admin, id);
    expect(c.mensagens.map((m) => m.autor)).toEqual(["AGENCIA", "CLIENTE"]);
    expect(c.solicitacao.situacao).toBe("ABERTA");
    expect((await portalDoCliente(ctx.db, s.agenciaId, token, s.clienteId)).solicitacoes[0]!.mensagens).toHaveLength(2);
    expect((await caixaDeEntrada(ctx.db, s.admin)).map((e) => e.kind)).toContain("AGENCIA_ATENDIMENTO_RESPOSTA");
    await expect(conversaNaAgencia(ctx.db, s.editor, id)).rejects.toThrow(/não encontrada/);
    const passe = await passeVerComoCliente(ctx.db, s.admin, s.clienteId);
    const previa = await portalDaPrevia(ctx.db, s.agenciaId, passe.token);
    expect(previa?.cliente.nome).toBe("CCV Vidros");
    expect(await portalDaPrevia(ctx.db, "agc_outra", passe.token)).toBeNull();
    await expect(passeVerComoCliente(ctx.db, s.editor, s.clienteId)).rejects.toThrow(/não encontrado/);
  });

  it("agente responde com os números da agência; indique e ganhe pelo cadastro de parceiro", async () => {
    const s = await cenario();
    expect((await perguntarAoAgente(ctx.db, s.admin, "Quanto falta receber?")).texto).toMatch(/Em atraso/);
    expect((await perguntarAoAgente(ctx.db, s.editor, "Quanto falta receber?")).texto).toMatch(/administrador e do financeiro/);
    expect((await perguntarAoAgente(ctx.db, s.admin, "Qual a cor favorita?")).texto).toMatch(/Experimente/);
    await expect(ativarIndiqueEGanhe(ctx.db, s.admin, { email: "leo+parceiro@up.com.br", telefone: "11999998888", aceite: true })).rejects.toThrow(/CNPJ ou CPF/);
    await salvarDadosJuridicos(ctx.db, s.admin, { razaoSocial: "UP Clips Ltda", documento: "11.222.333/0001-81", cidadeForo: "São Paulo/SP" });
    const r = await ativarIndiqueEGanhe(ctx.db, s.admin, { email: "leo+parceiro@up.com.br", telefone: "11999998888", aceite: true });
    expect((await solucoesDaAgencia(ctx.db, s.admin)).indique).toEqual({ ativo: true, codigo: r.codigo, euLigado: true });
    expect((await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.toEmail, "leo+parceiro@up.com.br"))).length).toBeGreaterThanOrEqual(0);
  });
});
