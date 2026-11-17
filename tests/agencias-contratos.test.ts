import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { agenciaClientes, emailOutbox, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { codigoDaJanela } from "@/lib/domain/conta-cliente";
import { convidarMembro, criarAgencia } from "@/lib/agencias/agencias";
import { criarCliente } from "@/lib/agencias/clientes";
import { entrarNoPortal } from "@/lib/agencias/portal";
import { aceitarContratoNoPortal, cancelarContratoDaAgencia, contratosDoPortal, enviarContrato, pdfDoContratoDaAgencia, previaDoContrato, salvarDadosJuridicos } from "@/lib/agencias/contratos";
import { pendenciasDoContrato, secoesDoContrato, type DadosContratoAgencia } from "@/lib/agencias/contrato-modelo";

let ctx: Awaited<ReturnType<typeof freshDb>>;
const antes = process.env.AGENCIAS_V1;
beforeAll(() => { process.env.AGENCIAS_V1 = "true"; });
afterAll(() => { process.env.AGENCIAS_V1 = antes; });
async function ator(id: string): Promise<Actor> { return actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, id) }))!); }
const OPC = { inicio: "2026-12-01", vigenciaMeses: 12, avisoPrevioDias: 30 };

async function cenario() {
  const a = await criarAgencia(ctx.db, ctx.actors.master, { nome: "UPClips", responsavel: { nome: "Léo", email: "leo@up.com.br", senha: "senha-provisoria" } });
  const admin = await ator(a.userId);
  const editor = await ator((await convidarMembro(ctx.db, admin, { nome: "Gu Editor", email: "gu@up.com.br", senha: "senha-provisoria", funcao: "EDICAO" })).userId);
  const c = await criarCliente(ctx.db, admin, { nome: "CCV Vidros", email: "carla@ccv.com.br", documento: "12.345.678/0001-90", incluso: { videos: 8, gravacoes: 2 }, valorMensalCents: 250_000, diaVencimento: 10, pacote: "Mensal 8 vídeos" });
  const slug = (await ctx.db.query.agencias.findFirst())!.slug;
  return { admin, editor, clienteId: c.id, agenciaId: a.agenciaId, slug };
}
async function entrar(s: { agenciaId: string; slug: string }, email: string) {
  const agora = new Date();
  return entrarNoPortal(ctx.db, s.slug, email, codigoDaJanela(`ag:${s.agenciaId}`, email, Math.floor(agora.getTime() / 600_000)), agora);
}

describe("modelo de contrato da agência (puro)", () => {
  const base: DadosContratoAgencia = { contratada: { nome: "UPClips", razao: "UP Clips Ltda", documento: "11.111.111/0001-11", cidadeForo: "São Paulo/SP", representante: "Léo", email: "leo@up.com.br" }, cliente: { nome: "CCV", documento: "1", email: "c@c.com", contato: null }, pacote: "Mensal", inclusoTexto: "8 vídeos", valorMensalCents: 250_000, diaVencimento: 10, inicio: "2026-12-01", vigenciaMeses: 12, avisoPrevioDias: 30, rodadasAjuste: 2, prazoAprovacaoDias: 3, extras: null };
  it("texto traz valor, vencimento, aviso prévio, sem promessa de resultado, e combinados só quando há", () => {
    const t = JSON.stringify(secoesDoContrato(base));
    expect(t).toMatch(/R\$\s2\.500,00 por mês/); expect(t).toMatch(/todo dia 10/); expect(t).toMatch(/aviso por escrito de 30 dias/); expect(t).toMatch(/não são garantidos/);
    expect(t).not.toMatch(/Combinados adicionais/);
    expect(secoesDoContrato({ ...base, extras: "Uma gravação extra em dezembro" }).map((s) => s.titulo).slice(-2)).toEqual(["11. Combinados adicionais", "12. Foro"]);
  });
  it("aponta o que falta", () => {
    expect(pendenciasDoContrato({ ...base, contratada: { ...base.contratada, razao: "", documento: "" }, valorMensalCents: 0 })).toHaveLength(3);
  });
});

describe("contratos da agência (D321)", () => {
  beforeEach(async () => { ctx = await freshDb(); });

  it("só sai com os dados completos; só administrador e financeiro; o cliente aceita no portal com o texto que viu", async () => {
    const s = await cenario();
    await expect(previaDoContrato(ctx.db, s.editor, s.clienteId, OPC)).rejects.toThrow(/administrador e do financeiro/);
    expect((await previaDoContrato(ctx.db, s.admin, s.clienteId, OPC)).pendencias.join(" ")).toMatch(/Razão social/);
    await expect(enviarContrato(ctx.db, s.admin, s.clienteId, OPC)).rejects.toThrow(/Falta preencher/);
    await salvarDadosJuridicos(ctx.db, s.admin, { razaoSocial: "UP Clips Produções Ltda", documento: "22.222.222/0001-22", cidadeForo: "São Paulo/SP" });
    const { id, numero } = await enviarContrato(ctx.db, s.admin, s.clienteId, OPC);
    expect(numero).toMatch(/^AG-\d{8}-/);
    await expect(enviarContrato(ctx.db, s.admin, s.clienteId, OPC)).rejects.toThrow(/esperando o aceite/);
    expect((await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "AGENCIA_CONTRATO_ENVIADO"))).map((e) => e.toEmail)).toEqual(["carla@ccv.com.br"]);

    const token = await entrar(s, "carla@ccv.com.br");
    const [c] = await contratosDoPortal(ctx.db, s.agenciaId, token, s.clienteId);
    expect(c).toMatchObject({ id, status: "ENVIADO" });
    expect(c!.secoes.length).toBeGreaterThan(5);
    await expect(aceitarContratoNoPortal(ctx.db, s.agenciaId, token, s.clienteId, id, { concordo: true, hashVisto: "0".repeat(64), nome: "Carla Souza" }, { ip: null, aparelho: null })).rejects.toThrow(/mudou/);
    await aceitarContratoNoPortal(ctx.db, s.agenciaId, token, s.clienteId, id, { concordo: true, hashVisto: c!.hash, nome: "Carla Souza" }, { ip: "1.2.3.4", aparelho: "Teste" });
    await expect(aceitarContratoNoPortal(ctx.db, s.agenciaId, token, s.clienteId, id, { concordo: true, hashVisto: c!.hash, nome: "Carla Souza" }, { ip: null, aparelho: null })).rejects.toThrow(/já foi aceito/);
    expect((await ctx.db.query.agenciaClientes.findFirst({ where: eq(agenciaClientes.id, s.clienteId) }))!.onboarding?.contrato).toBeTruthy();
    const aceitos = await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "AGENCIA_CONTRATO_ACEITO"));
    expect(aceitos.map((e) => e.toEmail)).toEqual(["leo@up.com.br"]);
    expect((await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "AGENCIA_CONTRATO_ACEITO_CLIENTE"))).map((e) => e.toEmail)).toEqual(["carla@ccv.com.br"]);
    const row = (await ctx.db.query.agenciaContratos.findFirst())!;
    expect(row).toMatchObject({ status: "ACEITO", aceitoNome: "Carla Souza", aceitoIp: "1.2.3.4", aceitoEmail: "carla@ccv.com.br" });
    const pdf = Buffer.from(await pdfDoContratoDaAgencia(row));
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    await expect(cancelarContratoDaAgencia(ctx.db, s.admin, id)).rejects.toThrow(/ainda não foi aceito/);
  });

  it("contrato cancelado some do portal e libera mandar outro", async () => {
    const s = await cenario();
    await salvarDadosJuridicos(ctx.db, s.admin, { razaoSocial: "UP Clips Produções Ltda", documento: "22.222.222/0001-22", cidadeForo: "São Paulo/SP" });
    const { id } = await enviarContrato(ctx.db, s.admin, s.clienteId, OPC);
    await cancelarContratoDaAgencia(ctx.db, s.admin, id);
    const token = await entrar(s, "carla@ccv.com.br");
    expect(await contratosDoPortal(ctx.db, s.agenciaId, token, s.clienteId)).toEqual([]);
    await enviarContrato(ctx.db, s.admin, s.clienteId, { ...OPC, extras: "Gravação extra em dezembro" });
  });
});
