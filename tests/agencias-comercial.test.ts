import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { convidarMembro, criarAgencia } from "@/lib/agencias/agencias";
import { fichaDoCliente } from "@/lib/agencias/clientes";
import { atualizarOportunidade, criarOportunidade, listarOportunidades, marcarOnboarding, perderOportunidade, resumoDoFunil, situacaoDoOnboarding, virarCliente } from "@/lib/agencias/comercial";
import { AULAS_AGENCIA, perguntasDaAulaAgencia, progressoDaAgencia, responderAulaDaAgencia, TRILHAS_AGENCIA } from "@/lib/agencias/aprender";
import { buscarNaAgencia, criarPeca } from "@/lib/agencias/producao";

let ctx: Awaited<ReturnType<typeof freshDb>>;
const antes = process.env.AGENCIAS_V1;
beforeAll(() => { process.env.AGENCIAS_V1 = "true"; });
afterAll(() => { process.env.AGENCIAS_V1 = antes; });
const HOJE = "2026-11-17";
async function ator(id: string): Promise<Actor> { return actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, id) }))!); }
let n = 0;
async function agencia() {
  n += 1;
  const a = await criarAgencia(ctx.db, ctx.actors.master, { nome: `Agência C${n}`, responsavel: { nome: "Dona", email: `dona-c${n}@ag.com.br`, senha: "senha-provisoria" } });
  const admin = await ator(a.userId);
  const pessoa = async (funcao: Parameters<typeof convidarMembro>[2]["funcao"]) => ator((await convidarMembro(ctx.db, admin, { nome: `P ${funcao}`, email: `${funcao.toLowerCase()}-c${n}@ag.com.br`, senha: "senha-provisoria", funcao })).userId);
  return { admin, atend: await pessoa("ATENDIMENTO"), editor: await pessoa("EDICAO") };
}

describe("regras puras do comercial e do onboarding (D317)", () => {
  it("onboarding: itens automáticos pelos dados do cliente e manuais pela marcação", () => {
    const c = { whatsapp: "11999990000", email: null, documento: "11222333000181", valorMensalCents: 250_000, diaVencimento: 10, incluso: { videos: 8 }, responsavelId: "u1" };
    const s = situacaoDoOnboarding({ contrato: "2026-11-17T10:00:00Z", briefing: null }, c, false);
    expect(s.total).toBe(11);
    expect(s.itens.filter((i) => i.feito).map((i) => i.chave)).toEqual(["contrato", "cadastro", "plano", "equipe"]);
    expect(situacaoDoOnboarding(null, { ...c, documento: null, responsavelId: null }, true).itens.filter((i) => i.feito).map((i) => i.chave)).toEqual(["plano", "planejamento"]);
  });
  it("todas as aulas da agência têm perguntas e trilha que existe", () => {
    for (const a of AULAS_AGENCIA) {
      expect(TRILHAS_AGENCIA.some((t) => t.id === a.trilha), a.id).toBe(true);
      expect(perguntasDaAulaAgencia(a.id).length, a.id).toBeGreaterThan(0);
      for (const p of perguntasDaAulaAgencia(a.id)) expect(p.opcoes[p.certa]).toBeTruthy();
    }
  });
});

describe("comercial, onboarding, Aprender e busca da agência (D317)", () => {
  beforeEach(async () => { ctx = await freshDb(); });

  it("funil: cria, avança, registra contato, perde com motivo e vira cliente com onboarding (sem duplicar)", async () => {
    const s = await agencia();
    const { id } = await criarOportunidade(ctx.db, s.atend, { empresa: "CCV Vidros", whatsapp: "(11) 98888-7777", segmento: "Vidraçaria", origem: "INDICACAO", servicos: "Mensal 12 vídeos", valorPropostoCents: 300_000, proximaAtividade: "Ligar", proximaAtividadeEm: "2026-11-16" });
    await atualizarOportunidade(ctx.db, s.atend, id, { etapa: "PROPOSTA", registrarContato: true });
    const lista = await listarOportunidades(ctx.db, s.atend, HOJE);
    expect(lista[0]).toMatchObject({ etapa: "PROPOSTA", atrasada: true, responsavelId: s.atend.userId });
    expect(lista[0]!.ultimoContatoEm).not.toBeNull();
    expect(resumoDoFunil(lista, HOJE)).toMatchObject({ abertas: 1, valorEmNegociacaoCents: 300_000, atrasadas: 1 });
    await expect(atualizarOportunidade(ctx.db, s.atend, id, { etapa: "FECHADO" })).rejects.toThrow(/Virar cliente/);
    const r = await virarCliente(ctx.db, s.atend, id);
    expect(r.novo).toBe(true);
    expect(await virarCliente(ctx.db, s.atend, id)).toEqual({ clienteId: r.clienteId, novo: false });
    const c = await fichaDoCliente(ctx.db, s.admin, r.clienteId);
    expect(c).toMatchObject({ nome: "CCV Vidros", whatsapp: "11988887777", pacote: "Mensal 12 vídeos", valorMensalCents: null, onboarding: { contrato: null } });
    await marcarOnboarding(ctx.db, s.atend, r.clienteId, "briefing", true);
    expect((await fichaDoCliente(ctx.db, s.admin, r.clienteId)).onboarding!.briefing).not.toBeNull();
    // Administrador vira cliente com o valor (pode mexer em contrato).
    const o2 = await criarOportunidade(ctx.db, s.admin, { empresa: "Padaria Sol", valorPropostoCents: 150_000 });
    expect((await fichaDoCliente(ctx.db, s.admin, (await virarCliente(ctx.db, s.admin, o2.id)).clienteId)).valorMensalCents).toBe(150_000);
    const o3 = await criarOportunidade(ctx.db, s.atend, { empresa: "Loja Lua" });
    await perderOportunidade(ctx.db, s.atend, o3.id, "Preço");
    await expect(virarCliente(ctx.db, s.atend, o3.id)).rejects.toThrow(/Reabra/);
    expect(resumoDoFunil(await listarOportunidades(ctx.db, s.admin, HOJE), HOJE)).toMatchObject({ abertas: 0, fechadasNoMes: 2 });
  });

  it("só quem cuida da carteira usa o comercial; uma agência não vê a outra", async () => {
    const s = await agencia(); const outra = await agencia();
    await expect(criarOportunidade(ctx.db, s.editor, { empresa: "X" })).rejects.toThrow(/comercial/);
    const { id } = await criarOportunidade(ctx.db, s.admin, { empresa: "Clínica Bem" });
    expect(await listarOportunidades(ctx.db, outra.admin, HOJE)).toEqual([]);
    await expect(virarCliente(ctx.db, outra.admin, id)).rejects.toThrow(/não encontrada/);
  });

  it("Aprender: corrige no servidor, guarda o progresso e o editor não faz aula de gestão", async () => {
    const s = await agencia();
    const certas = perguntasDaAulaAgencia("ag-peca").map((p) => p.certa);
    expect((await responderAulaDaAgencia(ctx.db, s.editor, { aulaId: "ag-peca", respostas: certas.map((c) => (c + 1) % 4) })).concluida).toBe(false);
    expect((await responderAulaDaAgencia(ctx.db, s.editor, { aulaId: "ag-peca", respostas: certas })).concluida).toBe(true);
    await expect(responderAulaDaAgencia(ctx.db, s.editor, { aulaId: "ag-crm", respostas: [0, 0] })).rejects.toThrow(/não encontrada/);
    const prog = await progressoDaAgencia(ctx.db, s.admin);
    expect(prog.find((p) => p.id === s.editor.userId)).toMatchObject({ feitas: 1, total: 6 });
    expect(await progressoDaAgencia(ctx.db, s.editor)).toHaveLength(1);
  });

  it("busca rápida acha cliente e peça visíveis; o editor não acha cliente fora da equipe dele", async () => {
    const s = await agencia();
    const { clienteId } = await virarCliente(ctx.db, s.admin, (await criarOportunidade(ctx.db, s.admin, { empresa: "Academia Forte" })).id);
    await criarPeca(ctx.db, s.admin, { clienteId, titulo: "Treino de pernas" }, HOJE);
    expect((await buscarNaAgencia(ctx.db, s.admin, "forte")).map((h) => h.kind)).toEqual(["customer", "oportunidade"]);
    expect((await buscarNaAgencia(ctx.db, s.admin, "pernas")).map((h) => h.title)).toEqual(["Treino de pernas"]);
    expect(await buscarNaAgencia(ctx.db, s.editor, "forte")).toEqual([]);
  });
});
