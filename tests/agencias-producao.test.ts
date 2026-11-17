import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { agenciaPecaEventos, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { convidarMembro, criarAgencia } from "@/lib/agencias/agencias";
import { atualizarCliente, criarCliente, definirEquipeDoCliente } from "@/lib/agencias/clientes";
import { atrasada, contagemDoCiclo, escolherResponsavel, mesAnterior, mesSeguinte, prazoDaEtapa, proximaEtapa } from "@/lib/agencias/fluxo";
import { atualizarPeca, avancarPeca, comentarPeca, criarPeca, fichaDaPeca, listarPecas, minhaFila, pedirAjuste, planejarMes, producaoDoMes, requisitoParaAvancar, transferirPeca } from "@/lib/agencias/producao";

let ctx: Awaited<ReturnType<typeof freshDb>>;
const antes = process.env.AGENCIAS_V1;
beforeAll(() => { process.env.AGENCIAS_V1 = "true"; });
afterAll(() => { process.env.AGENCIAS_V1 = antes; });
const HOJE = "2026-11-17";

describe("regras puras do fluxo (D314)", () => {
  it("etapa seguinte pula captação de arte e aprovação de quem não aprova", () => {
    const v = { tipo: "VIDEO" as const, exigeAprovacao: true };
    expect(proximaEtapa("ROTEIRO", v)).toBe("CAPTACAO");
    expect(proximaEtapa("REVISAO", v)).toBe("APROVACAO");
    expect(proximaEtapa("ROTEIRO", { tipo: "ARTE", exigeAprovacao: true })).toBe("EDICAO");
    expect(proximaEtapa("REVISAO", { tipo: "VIDEO", exigeAprovacao: false })).toBe("AGENDAMENTO");
    expect(proximaEtapa("PUBLICADO", v)).toBe("CONCLUIDO");
    expect(proximaEtapa("CONCLUIDO", v)).toBeNull();
  });

  it("contagem do ciclo: produzido e publicado separados, extra à parte, herdadas e percentual", () => {
    const p = (etapa: Parameters<typeof atrasada>[0]["etapa"], extra = false, prazo: string | null = null) => ({ tipo: "VIDEO" as const, etapa, prazo, extra });
    const c = contagemDoCiclo({ videos: 4, gravacoes: 2 }, [p("PUBLICADO"), p("CONCLUIDO"), p("EDICAO", false, "2026-11-10"), p("APROVACAO"), p("PUBLICADO", true)], [p("EDICAO"), p("PUBLICADO")], HOJE);
    expect(c).toMatchObject({ contratado: 4, planejadas: 4, faltaPlanejar: 0, publicadas: 3, publicadasVideos: 2, produzidas: 4, emEdicao: 1, aguardandoAprovacao: 1, extras: 1, herdadas: 1, atrasadas: 1, percentualPublicado: 50 });
    expect(contagemDoCiclo({}, [], [], HOJE).percentualPublicado).toBe(0);
  });

  it("prazos, atraso, meses e quem recebe a etapa", () => {
    expect(prazoDaEtapa("EDICAO", HOJE)).toBe("2026-11-20");
    expect(prazoDaEtapa("EDICAO", HOJE, { EDICAO: 1 })).toBe("2026-11-18");
    expect(prazoDaEtapa("CONCLUIDO", HOJE)).toBeNull();
    expect(atrasada({ etapa: "EDICAO", prazo: "2026-11-16" }, HOJE)).toBe(true);
    expect(atrasada({ etapa: "PUBLICADO", prazo: "2026-11-16" }, HOJE)).toBe(false);
    expect([mesAnterior("2026-01"), mesSeguinte("2026-12")]).toEqual(["2025-12", "2027-01"]);
    const eq = [{ userId: "ed", funcao: "EDICAO" as const }, { userId: "adm", funcao: "ADMIN" as const }];
    expect(escolherResponsavel("EDICAO", eq, "resp")).toBe("ed");
    expect(escolherResponsavel("REVISAO", eq, "resp")).toBe("adm");
    expect(escolherResponsavel("AGENDAMENTO", eq, "resp")).toBe("resp");
    expect(requisitoParaAvancar({ etapa: "CAPTACAO", linkBrutos: null, linkVersao: null, linkPublicacao: null })).toContain("brutos");
  });
});

async function ator(userId: string): Promise<Actor> { return actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, userId) }))!); }
let n = 0;
async function cenario() {
  n += 1;
  const a = await criarAgencia(ctx.db, ctx.actors.master, { nome: `Agência ${n}`, responsavel: { nome: "Dona", email: `dona-p${n}@ag.com.br`, senha: "senha-provisoria" } });
  const admin = await ator(a.userId);
  const p = async (nome: string, funcao: Parameters<typeof convidarMembro>[2]["funcao"]) => ator((await convidarMembro(ctx.db, admin, { nome, email: `${nome.toLowerCase().replace(/\s/g, "")}${n}@ag.com.br`, senha: "senha-provisoria", funcao })).userId);
  const roteiro = await p("Sil Roteiro", "ROTEIRO"); const film = await p("Fe Filme", "GRAVACAO"); const ed1 = await p("Gu Editor", "EDICAO"); const ed2 = await p("Gui Editor", "EDICAO");
  const social = await p("Bru Social", "SOCIAL_MEDIA"); const gestor = await p("Ge Gestor", "GESTOR");
  const c = await criarCliente(ctx.db, admin, { nome: "CCV Vidros", incluso: { videos: 3, fotos: 1 }, responsavelId: a.userId });
  await definirEquipeDoCliente(ctx.db, admin, c.id, [roteiro.userId, film.userId, ed1.userId, social.userId, gestor.userId]);
  return { admin, roteiro, film, ed1, ed2, social, gestor, clienteId: c.id };
}

describe("produção da agência (Fase 1A, D314)", () => {
  beforeEach(async () => { ctx = await freshDb(); });

  it("planejar o mês cria o que falta pelo contrato e não duplica; contrato novo não reescreve o ciclo aberto", async () => {
    const s = await cenario();
    expect((await planejarMes(ctx.db, s.roteiro, s.clienteId, "2026-11", HOJE)).criadas).toBe(4);
    expect((await planejarMes(ctx.db, s.roteiro, s.clienteId, "2026-11", HOJE)).criadas).toBe(0);
    await atualizarCliente(ctx.db, s.admin, s.clienteId, { incluso: { videos: 10 } });
    expect((await planejarMes(ctx.db, s.roteiro, s.clienteId, "2026-11", HOJE)).criadas).toBe(0);
    expect((await planejarMes(ctx.db, s.roteiro, s.clienteId, "2026-12", HOJE)).criadas).toBe(10);
    const lista = await listarPecas(ctx.db, s.admin, { mes: "2026-11" }, HOJE);
    expect(lista.map((p) => p.titulo).sort()).toEqual(["Foto 1 · novembro de 2026", "Vídeo 1 · novembro de 2026", "Vídeo 2 · novembro de 2026", "Vídeo 3 · novembro de 2026"]);
    expect(lista.every((p) => p.responsavelId === s.roteiro.userId && p.etapa === "PLANEJAMENTO")).toBe(true);
    await expect(planejarMes(ctx.db, s.ed1, s.clienteId, "2026-11", HOJE)).rejects.toThrow(/não planeja/);
  });

  it("fluxo completo: cada etapa vai sozinha para a pessoa certa, com requisitos e histórico", async () => {
    const s = await cenario();
    const { id } = await criarPeca(ctx.db, s.roteiro, { clienteId: s.clienteId, titulo: "Bastidores da obra", mes: "2026-11" }, HOJE);
    const etapa = async () => (await fichaDaPeca(ctx.db, s.admin, id)).peca;
    await avancarPeca(ctx.db, s.roteiro, id, HOJE); // planejamento → roteiro
    await atualizarPeca(ctx.db, s.roteiro, id, { roteiro: "Abertura com a fachada", situacao: "APROVADO" });
    await avancarPeca(ctx.db, s.roteiro, id, HOJE); // roteiro → captação
    expect(await etapa()).toMatchObject({ etapa: "CAPTACAO", responsavelId: s.film.userId, prazo: "2026-11-24" });
    await expect(avancarPeca(ctx.db, s.film, id, HOJE)).rejects.toThrow(/brutos/);
    await expect(avancarPeca(ctx.db, s.ed1, id, HOJE)).rejects.toThrow(/responsável/);
    await atualizarPeca(ctx.db, s.film, id, { linkBrutos: "https://drive.google.com/brutos" });
    await avancarPeca(ctx.db, s.film, id, HOJE);
    expect(await etapa()).toMatchObject({ etapa: "EDICAO", situacao: "AGUARDANDO", responsavelId: s.ed1.userId });
    await atualizarPeca(ctx.db, s.ed1, id, { linkVersao: "https://drive.google.com/v1", situacao: "EDITANDO" });
    await avancarPeca(ctx.db, s.ed1, id, HOJE);
    expect(await etapa()).toMatchObject({ etapa: "REVISAO", responsavelId: s.gestor.userId, versao: 1 });
    await pedirAjuste(ctx.db, s.gestor, id, "Cortar os 3 primeiros segundos", HOJE);
    expect(await etapa()).toMatchObject({ etapa: "EDICAO", situacao: "AJUSTES", responsavelId: s.ed1.userId });
    await atualizarPeca(ctx.db, s.ed1, id, { linkVersao: "https://drive.google.com/v2" });
    await avancarPeca(ctx.db, s.ed1, id, HOJE);
    await avancarPeca(ctx.db, s.gestor, id, HOJE); // revisão → aprovação do cliente
    expect(await etapa()).toMatchObject({ etapa: "APROVACAO", responsavelId: s.admin.userId, versao: 2 });
    await avancarPeca(ctx.db, s.admin, id, HOJE); // aprovado → social media
    expect(await etapa()).toMatchObject({ etapa: "AGENDAMENTO", responsavelId: s.social.userId });
    await expect(avancarPeca(ctx.db, s.social, id, HOJE)).rejects.toThrow(/publicação/);
    await atualizarPeca(ctx.db, s.social, id, { legenda: "Obra entregue!", linkPublicacao: "https://instagram.com/p/abc" });
    await avancarPeca(ctx.db, s.social, id, HOJE);
    const fim = await etapa();
    expect(fim.etapa).toBe("PUBLICADO"); expect(fim.publicadoEm).not.toBeNull();
    const ev = await ctx.db.select().from(agenciaPecaEventos).where(eq(agenciaPecaEventos.pecaId, id));
    expect(ev.map((e) => e.tipo)).toEqual(expect.arrayContaining(["CRIADA", "ETAPA", "BRUTOS", "VERSAO", "AJUSTE", "SITUACAO"]));
    const k = await producaoDoMes(ctx.db, s.admin, "2026-11", HOJE);
    expect(k.clientes[0]!.contagem).toMatchObject({ contratado: 4, publicadas: 1, produzidas: 1, percentualPublicado: 25 });
  });

  it("quem vê e quem mexe: editor fora do cliente não vê; transferir só o gestor; o transferido passa a ver", async () => {
    const s = await cenario();
    const { id } = await criarPeca(ctx.db, s.admin, { clienteId: s.clienteId, titulo: "Depoimento", tipo: "VIDEO", mes: "2026-11" }, HOJE);
    expect(await listarPecas(ctx.db, s.ed2, { mes: "2026-11" }, HOJE)).toEqual([]);
    await expect(fichaDaPeca(ctx.db, s.ed2, id)).rejects.toThrow(/não encontrada/);
    await expect(transferirPeca(ctx.db, s.ed1, id, s.ed2.userId)).rejects.toThrow(/gestor/);
    await transferirPeca(ctx.db, s.gestor, id, s.ed2.userId);
    expect((await minhaFila(ctx.db, s.ed2, HOJE)).map((p) => p.id)).toEqual([id]);
    expect((await fichaDaPeca(ctx.db, s.ed2, id)).podeMexer).toBe(true);
    await expect(atualizarPeca(ctx.db, s.ed2, id, { prazo: "2026-12-01" })).rejects.toThrow(/gestor/);
    await comentarPeca(ctx.db, s.ed2, id, { texto: "Preciso da trilha", mencoes: [s.gestor.userId] });
    await expect(comentarPeca(ctx.db, s.ed2, id, { texto: "x", mencoes: [ctx.actors.mantos.userId] })).rejects.toThrow(/equipe/);
    expect((await fichaDaPeca(ctx.db, s.gestor, id)).comentarios[0]).toMatchObject({ texto: "Preciso da trilha", interno: true, mencoes: [s.gestor.userId] });
  });

  it("outra agência nunca vê a produção; arte pula a captação; atrasada e herdada no mês seguinte", async () => {
    const s = await cenario(); const outra = await cenario();
    const { id } = await criarPeca(ctx.db, s.admin, { clienteId: s.clienteId, titulo: "Arte do mês", tipo: "ARTE", mes: "2026-10" }, "2026-10-01");
    expect(await listarPecas(ctx.db, outra.admin, { mes: "2026-10" }, HOJE)).toEqual([]);
    await expect(fichaDaPeca(ctx.db, outra.admin, id)).rejects.toThrow(/não encontrada/);
    await avancarPeca(ctx.db, s.admin, id, "2026-10-01"); await avancarPeca(ctx.db, s.admin, id, "2026-10-01");
    expect((await fichaDaPeca(ctx.db, s.admin, id)).peca.etapa).toBe("EDICAO");
    const nov = await listarPecas(ctx.db, s.admin, { mes: "2026-11" }, HOJE);
    expect(nov.find((p) => p.id === id)).toMatchObject({ herdada: true, atrasada: true, mes: "2026-10" });
    expect((await listarPecas(ctx.db, s.admin, { mes: "2026-11", somenteAtrasadas: true }, HOJE)).map((p) => p.id)).toEqual([id]);
  });
});
