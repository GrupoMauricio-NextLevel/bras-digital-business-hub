import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { emailOutbox, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { codigoDaJanela } from "@/lib/domain/conta-cliente";
import { convidarMembro, criarAgencia } from "@/lib/agencias/agencias";
import { criarCliente, definirEquipeDoCliente } from "@/lib/agencias/clientes";
import { atualizarPeca, avancarPeca, criarPeca, fichaDaPeca } from "@/lib/agencias/producao";
import { ajustePeloCliente, aprovarPeloCliente, clientesDaSessao, entrarNoPortal, enviarSolicitacao, pedirCodigoDoPortal, portalDoCliente, responderSolicitacao, solicitacoesDaAgencia } from "@/lib/agencias/portal";

let ctx: Awaited<ReturnType<typeof freshDb>>;
const antes = process.env.AGENCIAS_V1;
beforeAll(() => { process.env.AGENCIAS_V1 = "true"; });
afterAll(() => { process.env.AGENCIAS_V1 = antes; });
async function ator(id: string): Promise<Actor> { return actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, id) }))!); }
const HOJE = new Date().toISOString().slice(0, 10);

async function cenario() {
  const a = await criarAgencia(ctx.db, ctx.actors.master, { nome: "UPClips", responsavel: { nome: "Léo", email: "leo@up.com.br", senha: "senha-provisoria" } });
  const admin = await ator(a.userId);
  const editor = await ator((await convidarMembro(ctx.db, admin, { nome: "Gu Editor", email: "gu@up.com.br", senha: "senha-provisoria", funcao: "EDICAO" })).userId);
  const social = await ator((await convidarMembro(ctx.db, admin, { nome: "Bru Social", email: "bru@up.com.br", senha: "senha-provisoria", funcao: "SOCIAL_MEDIA" })).userId);
  const c = await criarCliente(ctx.db, admin, { nome: "CCV Vidros", email: "Carla@CCV.com.br", incluso: { videos: 2 }, responsavelId: a.userId });
  const outro = await criarCliente(ctx.db, admin, { nome: "Padaria Sol", email: "sol@padaria.com.br" });
  await definirEquipeDoCliente(ctx.db, admin, c.id, [editor.userId, social.userId]);
  const slug = (await ctx.db.query.agencias.findFirst())!.slug;
  return { admin, editor, social, clienteId: c.id, outroId: outro.id, agenciaId: a.agenciaId, slug };
}
async function entrar(s: { agenciaId: string; slug: string }, email: string) {
  const agora = new Date();
  const codigo = codigoDaJanela(`ag:${s.agenciaId}`, email.toLowerCase(), Math.floor(agora.getTime() / 600_000));
  return entrarNoPortal(ctx.db, s.slug, email, codigo, agora);
}
/** Leva uma peça até a aprovação do cliente (arte: sem captação). */
async function pecaParaAprovar(s: Awaited<ReturnType<typeof cenario>>) {
  const { id } = await criarPeca(ctx.db, s.admin, { clienteId: s.clienteId, titulo: "Post da obra", tipo: "ARTE" }, HOJE);
  await avancarPeca(ctx.db, s.admin, id, HOJE); await avancarPeca(ctx.db, s.admin, id, HOJE);
  await atualizarPeca(ctx.db, s.editor, id, { linkVersao: "https://drive.google.com/v1" });
  await avancarPeca(ctx.db, s.editor, id, HOJE); await avancarPeca(ctx.db, s.admin, id, HOJE);
  return id;
}

describe("portal do cliente da agência (D320)", () => {
  beforeEach(async () => { ctx = await freshDb(); });

  it("entrada por código: só e-mail de cliente recebe; código errado não entra; a sessão vale só nesta agência", async () => {
    const s = await cenario();
    await pedirCodigoDoPortal(ctx.db, s.slug, "carla@ccv.com.br");
    await pedirCodigoDoPortal(ctx.db, s.slug, "intruso@x.com");
    const enviados = await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "AGENCIA_PORTAL_CODIGO"));
    expect(enviados.map((e) => e.toEmail)).toEqual(["carla@ccv.com.br"]);
    await expect(entrarNoPortal(ctx.db, s.slug, "carla@ccv.com.br", "000000")).rejects.toThrow(/Código inválido/);
    const token = await entrar(s, "carla@ccv.com.br");
    expect((await clientesDaSessao(ctx.db, s.agenciaId, token)).clientes.map((c) => c.nome)).toEqual(["CCV Vidros"]);
    expect((await clientesDaSessao(ctx.db, "agc_outra", token)).email).toBeNull();
    await expect(portalDoCliente(ctx.db, s.agenciaId, token, s.outroId)).rejects.toThrow(/não encontrado/);
  });

  it("conteúdo chega para aprovar com e-mail; cliente aprova e vai para o social media; nada interno aparece", async () => {
    const s = await cenario();
    const id = await pecaParaAprovar(s);
    expect((await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "AGENCIA_PARA_APROVAR"))).map((e) => e.toEmail)).toEqual(["carla@ccv.com.br"]);
    const token = await entrar(s, "carla@ccv.com.br");
    const p = await portalDoCliente(ctx.db, s.agenciaId, token, s.clienteId);
    expect(p.paraAprovar).toEqual([{ id, titulo: "Post da obra", tipo: "Arte", versao: 1, link: "https://drive.google.com/v1" }]);
    expect(p.producao[0]).toEqual({ id, titulo: "Post da obra", tipo: "Arte", situacao: "Aguardando aprovação", anterior: false });
    expect(JSON.stringify(p)).not.toMatch(/Gu Editor|responsavel|prazo/);
    await aprovarPeloCliente(ctx.db, s.agenciaId, token, s.clienteId, id);
    expect((await fichaDaPeca(ctx.db, s.admin, id)).peca).toMatchObject({ etapa: "AGENDAMENTO", responsavelId: s.social.userId });
    await expect(aprovarPeloCliente(ctx.db, s.agenciaId, token, s.clienteId, id)).rejects.toThrow(/não está esperando/);
  });

  it("cliente pede ajuste com comentário: volta ao editor; solicitação chega à agência e é respondida", async () => {
    const s = await cenario();
    const id = await pecaParaAprovar(s);
    const token = await entrar(s, "carla@ccv.com.br");
    await expect(ajustePeloCliente(ctx.db, s.agenciaId, token, s.clienteId, id, "")).rejects.toThrow(/precisa mudar/);
    await ajustePeloCliente(ctx.db, s.agenciaId, token, s.clienteId, id, "Trocar a cor do fundo");
    const f = await fichaDaPeca(ctx.db, s.admin, id);
    expect(f.peca).toMatchObject({ etapa: "EDICAO", situacao: "AJUSTES", responsavelId: s.editor.userId });
    expect(f.comentarios.at(-1)).toMatchObject({ interno: false, texto: "Pedido do cliente: Trocar a cor do fundo" });
    await enviarSolicitacao(ctx.db, s.agenciaId, token, s.clienteId, { tipo: "IDEIA", texto: "Vídeo do aniversário da loja" });
    const lista = await solicitacoesDaAgencia(ctx.db, s.admin, { abertas: true });
    expect(lista.map((x) => x.texto)).toEqual(["Vídeo do aniversário da loja"]);
    await expect(responderSolicitacao(ctx.db, s.admin, lista[0]!.id, { situacao: "RESPONDIDA" })).rejects.toThrow(/resposta/);
    await responderSolicitacao(ctx.db, s.admin, lista[0]!.id, { situacao: "RESPONDIDA", resposta: "Ótima ideia, entra no mês que vem" });
    expect((await portalDoCliente(ctx.db, s.agenciaId, token, s.clienteId)).solicitacoes[0]).toMatchObject({ situacao: "RESPONDIDA", resposta: "Ótima ideia, entra no mês que vem" });
    expect(await solicitacoesDaAgencia(ctx.db, s.editor)).toEqual([]);
  });
});
