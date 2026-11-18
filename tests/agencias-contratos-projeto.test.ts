import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { agenciaClientes, agenciaContratos, agenciaFaturas, agencias, contratos, emailOutbox, stores, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { codigoDaJanela } from "@/lib/domain/conta-cliente";
import { signupMember } from "@/lib/domain/store-access";
import { aceitarContrato, confirmarRecebimento, enviarContratoLojaPronta, lembretesDeParcelas, parcelasDoContrato, pixParaConferir } from "@/lib/domain/contratos";
import { abrirCaixa } from "@/lib/domain/caixa";
import { convidarMembro, criarAgencia, marcarAgenciaInterna } from "@/lib/agencias/agencias";
import { atualizarCliente, criarCliente } from "@/lib/agencias/clientes";
import { entrarNoPortal } from "@/lib/agencias/portal";
import { marcarPagaManual, financeiroDaAgencia } from "@/lib/agencias/cobranca";
import { aceitarContratoNoPortal, cancelarContratoDaAgencia, contratosDaAgencia, contratosDoPortal, detalheDoContrato, encerrarContratoDaAgencia, enviarContrato, pdfDoContratoDaAgencia, previaDoContrato, reenviarContratoPorEmail, salvarDadosJuridicos } from "@/lib/agencias/contratos";
import { contratosDoMasterParaTrazer, trazerContratoDoMaster } from "@/lib/agencias/migrar-contrato-master";
import { conferirProjeto, pendenciasDoProjeto, secoesDoProjeto, situacaoDoPagamento, type DadosContratoProjeto } from "@/lib/contratos/projeto";
import { impressaoDigital } from "@/lib/contratos/loja-pronta-express";

/** Contratos de projeto da agência, tela Contratos e migração do Master (D342). */
let ctx: Awaited<ReturnType<typeof freshDb>>;
const antes = process.env.AGENCIAS_V1;
beforeAll(() => { process.env.AGENCIAS_V1 = "true"; });
afterAll(() => { process.env.AGENCIAS_V1 = antes; });
async function ator(id: string): Promise<Actor> { return actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, id) }))!); }

const MIGRACAO = {
  modelo: "MIGRACAO_PLATAFORMA" as const, origem: "Nuvemshop", valorCents: 50_000, produtos: 40, banners: 8, prazoDias: 7,
  parcelas: [
    { descricao: "Sinal", valorCents: 25_000, vencimento: "2026-11-13", pagoEm: "2026-11-13", meio: "PIX" as const },
    { descricao: "Restante", valorCents: 25_000, vencimento: "2026-11-18" },
  ],
  cortesias: [{ titulo: "Tema avançado Aura, com licença permanente", valorReferenciaCents: 29_900 }],
};
const EXPRESS_A_VISTA = { modelo: "LOJA_PRONTA_EXPRESS" as const, valorCents: 160_000, produtos: 40, banners: 8, prazoDias: 10, parcelas: [{ descricao: "À vista", valorCents: 160_000, vencimento: "2026-11-15", pagoEm: "2026-11-15", meio: "PIX" as const }], cortesias: [{ titulo: "Tema avançado Aura", valorReferenciaCents: 29_900 }] };

describe("modelo de contrato de projeto (puro)", () => {
  const base: DadosContratoProjeto = {
    produto: "MIGRACAO_PLATAFORMA", contratada: { nome: "NextLevel", razao: "NextLevel Marketing Ltda - ME", documento: "51.392.006/0001-92", cidadeForo: "São Paulo/SP", representante: "Mauricio", email: "financeiro@nl.teste", pix: { chave: "51.392.006/0001-92", banco: "Itaú", favorecido: "NextLevel Marketing Ltda" } },
    cliente: { nome: "Joias Teste", documento: "52998224725", email: "joias@teste.com", contato: null }, loja: null, origem: "Nuvemshop", valorCheioCents: null, valorCents: 50_000,
    parcelas: [{ ordem: 1, descricao: "Sinal", valorCents: 25_000, vencimento: "2026-11-13", pagoEm: "2026-11-13", meio: "PIX" }, { ordem: 2, descricao: "Restante", valorCents: 25_000, vencimento: "2026-11-18", pagoEm: null, meio: null }],
    produtos: 40, banners: 8, prazoDias: 7, cortesias: [{ titulo: "Tema avançado Aura", valorReferenciaCents: 29_900 }], extras: null,
  };
  it("migração: origem, produtos, banners, cortesia, o que já foi pago e o que falta, sinal retido", () => {
    const t = JSON.stringify(secoesDoProjeto(base));
    expect(t).toContain("da plataforma Nuvemshop para a plataforma NextLevel Commerce");
    expect(t).toContain("até 40 produtos e cria até 8 banners");
    expect(t).toContain("Tema avançado Aura (valor de referência R$ 299,00), sem custo");
    expect(t).toContain("R$ 250,00 de sinal, pago em 13/11/2026 (Pix)");
    expect(t).toContain("R$ 250,00 de restante, com vencimento em 18/11/2026");
    expect(t).toContain("R$ 250,00 já pagos e R$ 250,00 a pagar");
    expect(t).toContain("7 (sete) dias corridos");
    expect(t).toMatch(/sinal \(R\$\s250,00\) fica com a CONTRATADA/);
    expect(t).toContain("não são garantidos");
  });
  it("Express à vista pago: sem multa de sinal, e a conta precisa fechar", () => {
    const d: DadosContratoProjeto = { ...base, produto: "LOJA_PRONTA_EXPRESS", origem: null, valorCents: 160_000, parcelas: [{ ordem: 1, descricao: "À vista", valorCents: 160_000, vencimento: "2026-11-15", pagoEm: "2026-11-15", meio: "PIX" }] };
    const t = JSON.stringify(secoesDoProjeto(d));
    expect(t).toContain("Cadastro inicial de 40 produtos");
    expect(t).toContain("R$ 1.600,00, já pagos integralmente");
    expect(t).not.toContain("fica com a CONTRATADA como multa");
    expect(situacaoDoPagamento(d.parcelas)).toMatchObject({ quitado: true, faltaCents: 0 });
    expect(conferirProjeto({ ...d, valorCents: 150_000 }).join()).toMatch(/somar/);
    expect(pendenciasDoProjeto({ ...d, cliente: { ...d.cliente, email: "", documento: "" } }).join()).toMatch(/CPF ou CNPJ.*E-mail/);
  });
});

describe("contratos de projeto e migração do Master (D342)", () => {
  beforeEach(async () => { ctx = await freshDb(); });

  async function agencia(nome = "NextLevel Soluções", email = "adm@nl.teste") {
    const a = await criarAgencia(ctx.db, ctx.actors.master, { nome, responsavel: { nome: "Admin", email, senha: "senha-provisoria" } });
    const admin = await ator(a.userId);
    const slug = (await ctx.db.query.agencias.findFirst({ where: eq(agencias.id, a.agenciaId) }))!.slug;
    return { admin, agenciaId: a.agenciaId, slug };
  }
  async function entrar(s: { agenciaId: string; slug: string }, email: string) {
    const agora = new Date();
    return entrarNoPortal(ctx.db, s.slug, email, codigoDaJanela(`ag:${s.agenciaId}`, email, Math.floor(agora.getTime() / 600_000)), agora);
  }

  it("agência interna: contrato de migração com sinal pago, aceite no portal, PDF por e-mail e parcelas como cobranças", async () => {
    const s = await agencia();
    await marcarAgenciaInterna(ctx.db, ctx.actors.master, s.agenciaId, true);
    const c = await criarCliente(ctx.db, s.admin, { nome: "Império Joias" });
    // prévia sai sem contato; o envio exige CPF/CNPJ e e-mail
    const p = await previaDoContrato(ctx.db, s.admin, c.id, MIGRACAO);
    expect(p.pendencias.join()).toMatch(/CPF ou CNPJ/);
    expect(JSON.stringify(p.secoes)).toContain("chave 51.392.006/0001-92 (Itaú"); // interna: Pix da NextLevel
    await expect(enviarContrato(ctx.db, s.admin, c.id, MIGRACAO)).rejects.toThrow(/Falta preencher/);
    await atualizarCliente(ctx.db, s.admin, c.id, { email: "joias@teste.com", documento: "529.982.247-25", contatoNome: "Maia" });
    const env = await enviarContrato(ctx.db, s.admin, c.id, MIGRACAO);
    const fs = await ctx.db.select().from(agenciaFaturas).where(eq(agenciaFaturas.contratoId, env.id));
    expect(fs.map((f) => [f.parcela, f.situacao, f.valorCents, f.avulsa])).toEqual(expect.arrayContaining([[1, "PAGA", 25_000, true], [2, "ABERTA", 25_000, true]]));
    let lista = await contratosDaAgencia(ctx.db, s.admin, "aguardando");
    expect(lista.lista).toHaveLength(1);
    expect(lista.lista[0]).toMatchObject({ pagoCents: 25_000, totalCents: 50_000, situacao: { rotulo: "Aguardando aceite" } });
    expect(lista.numeros.aReceberCents).toBe(25_000);

    // editar a ficha refaz o contrato ainda não aceito
    const h1 = (await ctx.db.query.agenciaContratos.findFirst({ where: eq(agenciaContratos.id, env.id) }))!.hash;
    await atualizarCliente(ctx.db, s.admin, c.id, { nome: "Império Maia Joias e Semijoias" });
    const k2 = (await ctx.db.query.agenciaContratos.findFirst({ where: eq(agenciaContratos.id, env.id) }))!;
    expect(k2.hash).not.toBe(h1);
    expect(k2.titulo).toContain("Império Maia Joias e Semijoias");
    expect(impressaoDigital(k2.dados, k2.conteudo.secoes)).toBe(k2.hash);

    const token = await entrar(s, "joias@teste.com");
    const [noPortal] = await contratosDoPortal(ctx.db, s.agenciaId, token, c.id);
    await aceitarContratoNoPortal(ctx.db, s.agenciaId, token, c.id, env.id, { concordo: true, hashVisto: noPortal!.hash, nome: "Maia Souza" }, { ip: "1.2.3.4", aparelho: "Teste" });
    const aceito = (await ctx.db.query.agenciaContratos.findFirst({ where: eq(agenciaContratos.id, env.id) }))!;
    expect(aceito).toMatchObject({ status: "ACEITO", aceitoHash: aceito.hash });
    expect(aceito.emailAceiteEnviadoEm).toBeTruthy();
    expect((await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "AGENCIA_CONTRATO_ACEITO_CLIENTE"))).map((e) => e.toEmail)).toEqual(["joias@teste.com"]);
    expect((await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "AGENCIA_CONTRATO_ACEITO"))).map((e) => e.toEmail).sort()).toEqual(["adm@nl.teste", "financeiro@nextlevelcommerce.com.br"]);
    expect(Buffer.from(await pdfDoContratoDaAgencia(aceito)).subarray(0, 5).toString()).toBe("%PDF-");

    // depois de aceito, a ficha muda e o contrato não
    await atualizarCliente(ctx.db, s.admin, c.id, { nome: "Outro nome" });
    expect((await ctx.db.query.agenciaContratos.findFirst({ where: eq(agenciaContratos.id, env.id) }))!.hash).toBe(aceito.hash);

    // o saldo cai: "Recebi por fora" com data e meio
    const resto = fs.find((f) => f.parcela === 2)!;
    await expect(marcarPagaManual(ctx.db, s.admin, resto.id, "Pix", { pagoEm: "2999-01-01", meio: "PIX" })).rejects.toThrow(/depois de hoje/);
    await marcarPagaManual(ctx.db, s.admin, resto.id, "Pix do saldo", { pagoEm: "2026-11-18", meio: "PIX" });
    const det = await detalheDoContrato(ctx.db, s.admin, env.id);
    expect(det.pagamento).toMatchObject({ quitado: true, pagoCents: 50_000 });
    expect(det.integro).toBe(true);
    expect((await reenviarContratoPorEmail(ctx.db, s.admin, env.id)).para).toBe("joias@teste.com");

    // aditivo só sobre contrato aceito do mesmo cliente; encerrar cancela o que estiver aberto
    await expect(enviarContrato(ctx.db, s.admin, c.id, { ...EXPRESS_A_VISTA, aditivoDeId: "agct_naoexiste" })).rejects.toThrow(/aditivo/);
    const adt = await enviarContrato(ctx.db, s.admin, c.id, { ...EXPRESS_A_VISTA, aditivoDeId: env.id });
    expect((await detalheDoContrato(ctx.db, s.admin, env.id)).aditivos.map((a) => a.id)).toEqual([adt.id]);
    await cancelarContratoDaAgencia(ctx.db, s.admin, adt.id);
    expect((await ctx.db.select().from(agenciaFaturas).where(eq(agenciaFaturas.contratoId, adt.id)))[0]!.situacao).toBe("PAGA"); // pago fica
    await encerrarContratoDaAgencia(ctx.db, s.admin, env.id, "Migração entregue");
    lista = await contratosDaAgencia(ctx.db, s.admin, "encerrados");
    expect(lista.lista.map((x) => x.status).sort()).toEqual(["CANCELADO", "ENCERRADO"]);
  });

  it("agência externa: sem Pix da NextLevel no texto, sem trazer do Master, e uma agência não vê a outra", async () => {
    const a = await agencia("UPClips", "leo@up.teste");
    const b = await agencia("Outra", "outra@teste.com");
    await salvarDadosJuridicos(ctx.db, a.admin, { razaoSocial: "UP Clips Ltda", documento: "22.222.222/0001-22", cidadeForo: "Campinas/SP" });
    const c = await criarCliente(ctx.db, a.admin, { nome: "Cliente UP", email: "c@up.com", documento: "52998224725" });
    const env = await enviarContrato(ctx.db, a.admin, c.id, EXPRESS_A_VISTA);
    const t = JSON.stringify((await ctx.db.query.agenciaContratos.findFirst({ where: eq(agenciaContratos.id, env.id) }))!.conteudo);
    expect(t).not.toContain("51.392.006");
    expect(t).toContain("comarca de Campinas/SP");
    await expect(contratosDoMasterParaTrazer(ctx.db, a.admin)).rejects.toThrow(/agência interna/);
    await expect(detalheDoContrato(ctx.db, b.admin, env.id)).rejects.toThrow(/não encontrado/);
    expect((await contratosDaAgencia(ctx.db, b.admin)).lista).toHaveLength(0);
    const editor = await ator((await convidarMembro(ctx.db, a.admin, { nome: "Edu", email: "edu@up.teste", senha: "senha-provisoria", funcao: "EDICAO" })).userId);
    await expect(contratosDaAgencia(ctx.db, editor)).rejects.toThrow(/administrador e do financeiro/);
  });

  it("traz o contrato aceito do Master sem mudar texto nem prova; pago fica fora da receita; lembretes saem do Master", async () => {
    const { ensureCatalogSeed } = await import("@/lib/domain/nl-catalog");
    await ensureCatalogSeed(ctx.db);
    const r = await signupMember(ctx.db, { storeName: "Vestiário Teste", ownerName: "Dono", email: "dono@vest.teste", password: "senha-segura-1", taxId: "52998224725", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
    const st = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    const u = (await ctx.db.query.users.findFirst({ where: eq(users.email, "dono@vest.teste") }))!;
    const dono: Actor = { userId: u.id, role: "STORE_OWNER", organizationId: st.organizationId, supplierId: null, storeId: r.storeId, storeRole: "OWNER" };
    const AGORA = new Date();
    const hoje = AGORA.toISOString().slice(0, 10);
    const ct = await enviarContratoLojaPronta(ctx.db, ctx.actors.master, { storeId: r.storeId, cliente: { nome: "Dono Vestiário", documento: "529.982.247-25", email: "dono@vest.teste" }, valorCheioCents: 300_000, valorCents: 150_000, sinalCents: 50_000, dataSinal: hoje, restanteCents: 100_000, dataRestante: hoje, produtos: 40, prazoDias: 5, cortesiaMeses: 0 }, AGORA);
    const s = await agencia();
    await marcarAgenciaInterna(ctx.db, ctx.actors.master, s.agenciaId, true);
    expect(await contratosDoMasterParaTrazer(ctx.db, s.admin)).toHaveLength(0); // só aceitos
    await aceitarContrato(ctx.db, dono, ct.id, { concordo: true, hashVisto: ct.hash, nome: "Dono Vestiário" }, { ip: "200.1.2.3", aparelho: "Celular" }, AGORA);
    await abrirCaixa(ctx.db, ctx.actors.master, {}, AGORA);
    for (const p of await parcelasDoContrato(ctx.db, ctx.actors.master, ct.id)) await confirmarRecebimento(ctx.db, ctx.actors.master, p.id, AGORA);
    const lista = await contratosDoMasterParaTrazer(ctx.db, s.admin);
    expect(lista.map((x) => x.numero)).toEqual([ct.numero]);

    const t = await trazerContratoDoMaster(ctx.db, s.admin, ct.id, AGORA);
    expect(t.novo).toBe(true);
    expect((await trazerContratoDoMaster(ctx.db, s.admin, ct.id, AGORA))).toMatchObject({ id: t.id, novo: false }); // idempotente
    const orig = (await ctx.db.query.contratos.findFirst({ where: eq(contratos.id, ct.id) }))!;
    const novo = (await ctx.db.query.agenciaContratos.findFirst({ where: eq(agenciaContratos.id, t.id) }))!;
    expect(novo).toMatchObject({ numero: orig.numero, hash: orig.hash, status: "ACEITO", origem: "MASTER", origemContratoId: orig.id, aceitoNome: "Dono Vestiário", aceitoIp: "200.1.2.3", aceitoEmail: "dono@vest.teste" });
    expect(novo.conteudo).toEqual(orig.conteudo);
    expect(impressaoDigital(novo.dados, novo.conteudo.secoes)).toBe(orig.hash);
    expect(orig.transferidoPara).toBe(t.id);
    const cli = await ctx.db.query.agenciaClientes.findFirst({ where: eq(agenciaClientes.id, t.clienteId) });
    expect(cli).toMatchObject({ nome: "Vestiário Teste", storeId: r.storeId, contatoNome: "Dono Vestiário", email: "dono@vest.teste" });
    const fs = await ctx.db.select().from(agenciaFaturas).where(eq(agenciaFaturas.contratoId, t.id));
    expect(fs.every((f) => f.situacao === "PAGA" && f.registradoNoMaster)).toBe(true);
    expect(fs.reduce((x, f) => x + f.valorCents, 0)).toBe(150_000);
    const fin = await financeiroDaAgencia(ctx.db, s.admin, hoje.slice(0, 7));
    expect(fin.numeros.recebidoCents).toBe(0); // já está no caixa do Master
    expect((await detalheDoContrato(ctx.db, s.admin, t.id)).pagamento.quitado).toBe(true);
    expect(Buffer.from(await pdfDoContratoDaAgencia(novo)).subarray(0, 5).toString()).toBe("%PDF-");
    expect((await ctx.db.select().from(emailOutbox).where(and(eq(emailOutbox.kind, "AGENCIA_CONTRATO_TRANSFERIDO"), eq(emailOutbox.toEmail, "dono@vest.teste")))).length).toBe(1);
    expect(await contratosDoMasterParaTrazer(ctx.db, s.admin)).toHaveLength(0);
    expect(await pixParaConferir(ctx.db, ctx.actors.master)).toHaveLength(0);
    await lembretesDeParcelas(ctx.db, AGORA); // não quebra e ignora o transferido
  });
});
