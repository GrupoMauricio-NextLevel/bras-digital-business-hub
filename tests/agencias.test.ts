import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { agenciaClienteEquipe, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { agenciasLigado, pode, podeVerCliente, escopoDaAgencia } from "@/lib/agencias/acesso";
import { convidarMembro, criarAgencia, desligarMembro, listarAgencias, listarEquipe, mudarFuncao, mudarSituacaoDaAgencia } from "@/lib/agencias/agencias";
import { inclusoTexto, telefoneTexto, atualizarCliente, cockpitDaAgencia, criarCliente, definirEquipeDoCliente, fichaDoCliente, importarClientes, lerPlanilhaDeClientes, listarClientes, mudarSituacaoDoCliente, proximoVencimento, reaisParaCentavos } from "@/lib/agencias/clientes";

let ctx: Awaited<ReturnType<typeof freshDb>>;
const antes = process.env.AGENCIAS_V1;
beforeAll(() => { process.env.AGENCIAS_V1 = "true"; });
afterAll(() => { process.env.AGENCIAS_V1 = antes; });

async function ator(userId: string): Promise<Actor> {
  const u = await ctx.db.query.users.findFirst({ where: eq(users.id, userId) });
  return actorFromUser(u!);
}
let n = 0;
async function agencia(nome: string) {
  n += 1;
  const r = await criarAgencia(ctx.db, ctx.actors.master, { nome, responsavel: { nome: "Dona da Agência", email: `dona${n}@agencia.com.br`, senha: "senha-provisoria" } });
  return { ...r, admin: await ator(r.userId) };
}
async function pessoa(admin: Actor, nome: string, funcao: Parameters<typeof convidarMembro>[2]["funcao"], todosClientes = false) {
  n += 1;
  const r = await convidarMembro(ctx.db, admin, { nome, email: `p${n}@agencia.com.br`, senha: "senha-provisoria", funcao, todosClientes });
  return ator(r.userId);
}

describe("regras puras do Painel da Agência (D313)", () => {
  it("chave AGENCIAS_V1", () => {
    expect(agenciasLigado({ AGENCIAS_V1: "true" })).toBe(true);
    expect(agenciasLigado({ AGENCIAS_V1: "1" })).toBe(true);
    expect(agenciasLigado({})).toBe(false);
  });

  it("próximo vencimento vira o mês quando o dia já passou", () => {
    expect(proximoVencimento(10, "2026-11-05")).toBe("2026-11-10");
    expect(proximoVencimento(10, "2026-11-10")).toBe("2026-11-10");
    expect(proximoVencimento(5, "2026-11-16")).toBe("2026-12-05");
    expect(proximoVencimento(5, "2026-12-20")).toBe("2027-01-05");
  });

  it("valor em reais de qualquer jeito vira centavos", () => {
    expect(reaisParaCentavos("R$ 2.500,00")).toBe(250_000);
    expect(reaisParaCentavos("2500")).toBe(250_000);
    expect(reaisParaCentavos("2.500")).toBe(250_000);
    expect(reaisParaCentavos("1999,9")).toBe(199_990);
    expect(reaisParaCentavos("1999.90")).toBe(199_990);
    expect(reaisParaCentavos("abc")).toBeNull();
  });

  it("lê a planilha colada (tabulação ou ponto e vírgula), com títulos em qualquer ordem e erros por linha", () => {
    const r = lerPlanilhaDeClientes("Cliente\tValor\tVencimento\tVídeos\tWhatsApp\nClínica Sorriso\tR$ 2.500,00\t10\t8\t(11) 98888-7777\nX\t100\t5\t\t\nPadaria Pão Bom\t1800\t35\t4\t");
    expect(r.clientes).toEqual([expect.objectContaining({ nome: "Clínica Sorriso", valorMensalCents: 250_000, diaVencimento: 10, incluso: { videos: 8 }, whatsapp: "11988887777" })]);
    expect(r.erros.map((e) => e.linha)).toEqual([3, 4]);
    const p = lerPlanilhaDeClientes("nome;cnpj;e-mail\nAcademia Forte;123;\nLoja Bela;;bela@loja.com");
    expect(p.clientes.map((c) => c.nome)).toEqual(["Loja Bela"]);
    expect(p.erros[0]!.motivo).toContain("CPF/CNPJ");
    expect(lerPlanilhaDeClientes("valor\n100").erros[0]!.motivo).toContain("nome");
  });

  it("textos da ficha: quantidades sempre na mesma ordem e telefone formatado", () => {
    expect(inclusoTexto({ gravacoes: 2, fotos: 12, videos: 8, posts: 0 })).toBe("8 vídeos · 12 fotos · 2 gravações");
    expect(inclusoTexto({ videos: 1, gravacoes: 1 })).toBe("1 vídeo · 1 gravação");
    expect(telefoneTexto("11988887777")).toBe("(11) 98888-7777");
    expect(telefoneTexto("5511988887777")).toBe("(11) 98888-7777");
    expect(telefoneTexto("1133334444")).toBe("(11) 3333-4444");
  });

  it("quem vê o quê", () => {
    const editor = { agenciaId: "a", userId: "u1", funcao: "EDICAO" as const, todosClientes: false };
    expect(pode.verValores(editor)).toBe(false);
    expect(podeVerCliente(editor, { responsavelId: "u2" }, [])).toBe(false);
    expect(podeVerCliente(editor, { responsavelId: "u2" }, ["u1"])).toBe(true);
    expect(podeVerCliente({ ...editor, todosClientes: true }, { responsavelId: null }, [])).toBe(true);
    expect(pode.verValores({ ...editor, funcao: "FINANCEIRO" })).toBe(true);
    expect(pode.editarContrato({ ...editor, funcao: "ATENDIMENTO" })).toBe(false);
  });
});

describe("agência, equipe e carteira (AG1 e AG2, D313)", () => {
  beforeEach(async () => { ctx = await freshDb(); });

  it("só o Master cria agência; com a chave desligada nada funciona; pausada não entra", async () => {
    const a = await agencia("Agência Aurora");
    await expect(criarAgencia(ctx.db, ctx.actors.mantos, { nome: "Outra", responsavel: { nome: "Zé", email: "ze@x.com", senha: "senha-provisoria" } })).rejects.toThrow();
    const lista = await listarAgencias(ctx.db, ctx.actors.master);
    expect(lista).toEqual([expect.objectContaining({ id: a.agenciaId, nome: "Agência Aurora", situacao: "PILOTO", equipe: 1, clientes: 0 })]);
    const u = await ctx.db.query.users.findFirst({ where: eq(users.id, a.userId) });
    expect(u).toMatchObject({ role: "AGENCY", mustChangePassword: true });
    process.env.AGENCIAS_V1 = "false";
    await expect(escopoDaAgencia(ctx.db, a.admin)).rejects.toThrow(/liberado/);
    process.env.AGENCIAS_V1 = "true";
    await mudarSituacaoDaAgencia(ctx.db, ctx.actors.master, a.agenciaId, "PAUSADA");
    await expect(listarClientes(ctx.db, a.admin)).rejects.toThrow(/pausado/);
    await expect(escopoDaAgencia(ctx.db, ctx.actors.mantos)).rejects.toThrow();
  });

  it("uma agência nunca vê cliente nem equipe de outra", async () => {
    const a = await agencia("Agência A"); const b = await agencia("Agência B");
    const { id } = await criarCliente(ctx.db, a.admin, { nome: "Clínica Sorriso", valorMensalCents: 250_000, diaVencimento: 10 });
    expect(await listarClientes(ctx.db, b.admin)).toEqual([]);
    await expect(fichaDoCliente(ctx.db, b.admin, id)).rejects.toThrow(/não encontrado/);
    await expect(atualizarCliente(ctx.db, b.admin, id, { nome: "Invadido" })).rejects.toThrow(/não encontrado/);
    expect((await listarEquipe(ctx.db, b.admin)).map((p) => p.userId)).toEqual([b.userId]);
    // Responsável de outra agência é recusado.
    await expect(criarCliente(ctx.db, b.admin, { nome: "Loja X", responsavelId: a.userId })).rejects.toThrow(/equipe/);
  });

  it("cada função vê só o que é dela: editor vê só os clientes dele e sem valores; atendimento não muda valor", async () => {
    const a = await agencia("Agência Aurora");
    const editor = await pessoa(a.admin, "Edu Editor", "EDICAO");
    const atend = await pessoa(a.admin, "Ana Atendimento", "ATENDIMENTO");
    const fin = await pessoa(a.admin, "Fábio Financeiro", "FINANCEIRO");
    const c1 = await criarCliente(ctx.db, a.admin, { nome: "Clínica Sorriso", valorMensalCents: 250_000, diaVencimento: 10, documento: "11.222.333/0001-81" });
    await criarCliente(ctx.db, a.admin, { nome: "Padaria Pão Bom", valorMensalCents: 180_000 });
    expect(await listarClientes(ctx.db, editor)).toEqual([]);
    await definirEquipeDoCliente(ctx.db, atend, c1.id, [editor.userId]);
    const doEditor = await listarClientes(ctx.db, editor);
    expect(doEditor.map((c) => c.nome)).toEqual(["Clínica Sorriso"]);
    expect(doEditor[0]).toMatchObject({ valorMensalCents: null, diaVencimento: null, documento: null, verValores: false });
    await expect(criarCliente(ctx.db, editor, { nome: "Novo" })).rejects.toThrow(/não cadastra/);
    await expect(atualizarCliente(ctx.db, atend, c1.id, { valorMensalCents: 1 })).rejects.toThrow(/valor e vencimento/);
    await atualizarCliente(ctx.db, atend, c1.id, { pacote: "Mensal 8 vídeos", incluso: { videos: 8, fotos: 0 } });
    await atualizarCliente(ctx.db, fin, c1.id, { valorMensalCents: 270_000 });
    expect(await fichaDoCliente(ctx.db, fin, c1.id)).toMatchObject({ pacote: "Mensal 8 vídeos", incluso: { videos: 8 }, valorMensalCents: 270_000, documento: "11222333000181" });
    // Atendimento cadastra, mas sem valor (fica para o financeiro).
    const c3 = await criarCliente(ctx.db, atend, { nome: "Academia Forte", valorMensalCents: 99_000, diaVencimento: 5 });
    expect(await fichaDoCliente(ctx.db, a.admin, c3.id)).toMatchObject({ valorMensalCents: null, diaVencimento: null });
    await expect(mudarSituacaoDoCliente(ctx.db, atend, c1.id, { situacao: "ENCERRADO" })).rejects.toThrow(/motivo/);
    await mudarSituacaoDoCliente(ctx.db, atend, c1.id, { situacao: "ENCERRADO", motivo: "Preço" });
    expect(await fichaDoCliente(ctx.db, a.admin, c1.id)).toMatchObject({ situacao: "ENCERRADO", motivoEncerramento: "Preço" });
  });

  it("importa a carteira: prévia sem gravar, confirma, não duplica ao colar de novo e acha o responsável pelo nome", async () => {
    const a = await agencia("Agência Aurora");
    const bruna = await pessoa(a.admin, "Bruna Social", "SOCIAL_MEDIA");
    const planilha = "Cliente;Pacote;Valor;Vencimento;Vídeos;Responsável\nClínica Sorriso;Mensal 8;2.500,00;10;8;Bruna\nPadaria Pão Bom;Mensal 4;1800;15;4;Ninguém\nClínica Sorriso;Mensal 8;2500;10;8;Bruna";
    const previa = await importarClientes(ctx.db, a.admin, planilha, { confirmar: false });
    expect(previa).toMatchObject({ novos: 2, importados: 0, repetidos: ["Clínica Sorriso"], semResponsavel: ["Padaria Pão Bom (Ninguém)"] });
    expect(await listarClientes(ctx.db, a.admin)).toHaveLength(0);
    expect((await importarClientes(ctx.db, a.admin, planilha, { confirmar: true })).importados).toBe(2);
    expect((await importarClientes(ctx.db, a.admin, planilha, { confirmar: true })).importados).toBe(0);
    const lista = await listarClientes(ctx.db, a.admin);
    expect(lista.find((c) => c.nome === "Clínica Sorriso")).toMatchObject({ responsavelId: bruna.userId, valorMensalCents: 250_000, diaVencimento: 10, incluso: { videos: 8 } });
    await expect(importarClientes(ctx.db, bruna, planilha, { confirmar: true })).rejects.toThrow(/administrador/);
  });

  it("cockpit: receita contratada, vencimentos da semana, pendências e carga de cada pessoa", async () => {
    const a = await agencia("Agência Aurora");
    const editor = await pessoa(a.admin, "Gui Editor", "EDICAO");
    const c1 = await criarCliente(ctx.db, a.admin, { nome: "Clínica Sorriso", valorMensalCents: 250_000, diaVencimento: 18, whatsapp: "11988887777", responsavelId: a.userId });
    await criarCliente(ctx.db, a.admin, { nome: "Padaria Pão Bom", valorMensalCents: 150_000, diaVencimento: 2 });
    await criarCliente(ctx.db, a.admin, { nome: "Loja Bela" });
    await definirEquipeDoCliente(ctx.db, a.admin, c1.id, [editor.userId]);
    const k = await cockpitDaAgencia(ctx.db, a.admin, "2026-11-16");
    expect(k).toMatchObject({ ativos: 3, receitaContratadaCents: 400_000, ticketMedioCents: 200_000, aReceber7DiasCents: 250_000 });
    expect(k.vencimentos).toEqual([{ id: c1.id, nome: "Clínica Sorriso", data: "2026-11-18", emDias: 2, valorCents: 250_000 }]);
    expect(k.pendencias.semResponsavel.map((c) => c.nome)).toEqual(["Loja Bela", "Padaria Pão Bom"]);
    expect(k.pendencias.semContrato.map((c) => c.nome)).toEqual(["Loja Bela"]);
    expect(k.carga.find((p) => p.id === editor.userId)).toMatchObject({ clientes: 1, responsavel: 0 });
    const doEditor = await cockpitDaAgencia(ctx.db, editor, "2026-11-16");
    expect(doEditor).toMatchObject({ verValores: false, receitaContratadaCents: null, vencimentos: [], ativos: 1 });
    expect(doEditor.meus.map((c) => c.nome)).toEqual(["Clínica Sorriso"]);
  });

  it("equipe: só o administrador muda; sempre sobra um administrador; desligado sai dos clientes e não entra mais", async () => {
    const a = await agencia("Agência Aurora");
    const editor = await pessoa(a.admin, "Gui Editor", "EDICAO");
    await expect(convidarMembro(ctx.db, editor, { nome: "X", email: "x@x.com", senha: "senha-provisoria", funcao: "ADMIN" })).rejects.toThrow(/administrador/);
    await expect(mudarFuncao(ctx.db, a.admin, a.userId, { funcao: "EDICAO", todosClientes: false })).rejects.toThrow(/pelo menos um administrador/);
    await expect(desligarMembro(ctx.db, a.admin, a.userId)).rejects.toThrow(/próprio/);
    const c = await criarCliente(ctx.db, a.admin, { nome: "Clínica Sorriso", responsavelId: editor.userId });
    await definirEquipeDoCliente(ctx.db, a.admin, c.id, [editor.userId]);
    await desligarMembro(ctx.db, a.admin, editor.userId);
    expect(await ctx.db.select().from(agenciaClienteEquipe)).toEqual([]);
    expect((await fichaDoCliente(ctx.db, a.admin, c.id)).responsavelId).toBeNull();
    expect((await ctx.db.query.users.findFirst({ where: eq(users.id, editor.userId) }))!.disabledAt).not.toBeNull();
    await expect(criarCliente(ctx.db, a.admin, { nome: "Outra", responsavelId: editor.userId })).rejects.toThrow(/ativo da equipe/);
  });
});
