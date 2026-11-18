import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { executivoRecebimentos, financeInvoices, partnerCommissions, partners, stores, users } from "@/db/schema";
import { actorFromUser } from "@/lib/domain/access";
import { signupMember } from "@/lib/domain/store-access";
import { abrirCaixa, caixaDoDia } from "@/lib/domain/caixa";
import { cadastrarExecutivo, concluirRetorno, definirMetaSemanal, estornarVendaDeRua, feedDaEquipe, painelDoExecutivo, registrarVisita, painelDosExecutivos, pendenciasDosExecutivos, receberDoExecutivo, registrarVendaDeRua } from "@/lib/domain/executivos";
import { argumentosDeBolso, metaDaSemana, montarAgenda, saudacao, atrasado, codigoDeRecibo, diaDoPrazo, linkDoRecibo, prazoDeEntrega, textoDoRecibo } from "@/lib/finance/executivo-regras";
import { subscriptionOf } from "@/lib/domain/commerce-plans";
import { engajamentoDoParceiro } from "@/lib/domain/engajamento";

describe("executivos (puro, D273)", () => {
  it("prazo de 2 dias úteis: sexta vence terça; quinta vence segunda", () => {
    expect(prazoDeEntrega(new Date("2026-12-11T15:00:00Z")).toISOString()).toBe("2026-12-16T03:00:00.000Z"); // sex → fim de ter
    expect(prazoDeEntrega(new Date("2026-12-10T15:00:00Z")).toISOString()).toBe("2026-12-15T03:00:00.000Z"); // qui → fim de seg
    expect(atrasado("2026-12-15T03:00:00.000Z", new Date("2026-12-15T04:00:00Z"))).toBe(true);
    expect(diaDoPrazo("2026-12-15T03:00:00.000Z")).toMatch(/14\/12/); // prazo vence à meia-noite: último dia é segunda 14/12
  });
  it("recibo: código, texto e link do WhatsApp com o número da loja", () => {
    expect(codigoDeRecibo(() => 0)).toBe("REC-AAAAAA");
    const t = textoDoRecibo({ codigo: "REC-ABC123", loja: "Moda Rua", plano: "Start mensal", valor: "R$ 57,00", meio: "DINHEIRO", executivo: "Ana", quando: new Date("2026-12-10T15:00:00Z"), pagoAte: new Date("2027-01-10T15:00:00Z") });
    expect(t).toContain("Recibo NextLevel REC-ABC123");
    expect(t).toContain("(dinheiro)");
    expect(t).toContain("liberada até 10/01/2027");
    expect(linkDoRecibo("oi", "(11) 98888-7777")).toBe("https://wa.me/5511988887777?text=oi");
    expect(linkDoRecibo("oi", null)).toBe("https://wa.me/?text=oi");
  });
});

describe("painel da rua (puro, D274)", () => {
  it("saudação pela hora de SP, meta da semana e agenda", () => {
    expect(saudacao(new Date("2026-12-10T12:00:00Z"))).toBe("Bom dia"); // 9h em SP
    expect(saudacao(new Date("2026-12-10T18:00:00Z"))).toBe("Boa tarde");
    expect(saudacao(new Date("2026-12-10T23:00:00Z"))).toBe("Boa noite");
    expect(metaDaSemana(null, 3, 2)).toMatchObject({ meta: 3, falta: 1, pct: 67, batida: false });
    expect(metaDaSemana(5, 3, 6)).toMatchObject({ meta: 5, falta: 0, pct: 100, batida: true });
    expect(metaDaSemana(null, null, 0).meta).toBe(3);
    const ag = montarAgenda("2026-12-10",
      [{ id: "v1", loja: "Box 12", contato: "Rita", whatsapp: "11999990000", retornoEm: "2026-12-12", resultado: "PENSAR" }, { id: "v2", loja: "Box 3", contato: null, whatsapp: null, retornoEm: "2026-12-08", resultado: "INTERESSADO" }],
      [{ loja: "Moda A", testeAte: "2026-12-14T15:00:00Z", pagoAte: null }, { loja: "Moda B", testeAte: "2026-12-30T15:00:00Z", pagoAte: null }, { loja: "Paga", testeAte: "2026-12-11T15:00:00Z", pagoAte: "2027-01-01T00:00:00Z" }]);
    expect(ag.map((a) => [a.tipo, a.quando, a.atrasado])).toEqual([["RETORNO", "2026-12-08", true], ["RETORNO", "2026-12-12", false], ["TESTE_ACABANDO", "2026-12-14", false]]);
    expect(argumentosDeBolso(5700, (c) => `R$ ${c / 100}`)[1]!.titulo).toContain("R$ 57");
  });
});

describe("executivos no banco (CX3)", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); const { ensureCatalogSeed } = await import("@/lib/domain/nl-catalog"); await ensureCatalogSeed(ctx.db); });
  const AGORA = new Date("2026-12-10T15:00:00Z"); // quinta, depois da Black
  async function executivo(email = "ana@nl.com", taxId = "11222333000181") {
    const { partnerId } = await cadastrarExecutivo(ctx.db, ctx.actors.master, { nome: "Ana Executiva", email, senha: "senha-forte-1", taxId, telefone: "11999990000" }, AGORA);
    const p = (await ctx.db.query.partners.findFirst({ where: eq(partners.id, partnerId) }))!;
    return { partnerId, actor: actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, p.userId) }))!) };
  }
  async function loja(partnerId: string | null, email = "joana@moda.com.br", taxId = "529.982.247-25") {
    const r = await signupMember(ctx.db, { storeName: "Moda Rua", ownerName: "Joana Lima", email, password: "senha-segura-1", taxId, offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
    await ctx.db.update(stores).set({ partnerId, whatsapp: "11988887777" }).where(eq(stores.id, r.storeId));
    return r.storeId;
  }

  it("só o dono cadastra; executivo é vendedor marcado e ativo", async () => {
    const { createMasterMember } = await import("@/lib/domain/equipe-master");
    const { id } = await createMasterMember(ctx.db, ctx.actors.master, { name: "Pessoa Fin", email: "fin@nl.teste", password: "provisoria-123", masterFunction: "FINANCEIRO" });
    await expect(cadastrarExecutivo(ctx.db, { ...ctx.actors.master, userId: id, masterFunction: "FINANCEIRO" }, { nome: "X Y Z", email: "x@x.com", senha: "senha-forte-1", taxId: "11222333000181", telefone: "11999990000" })).rejects.toThrow(/dono/);
    const { partnerId } = await executivo();
    const p = (await ctx.db.query.partners.findFirst({ where: eq(partners.id, partnerId) }))!;
    expect([p.kind, p.executivo, p.status]).toEqual(["REPRESENTATIVE", true, "ACTIVE"]);
  });

  it("venda em dinheiro na rua: libera a loja, comissão do executivo, recibo; prestação entra no caixa como dinheiro", async () => {
    const ex = await executivo();
    const storeId = await loja(ex.partnerId);
    const r = await registrarVendaDeRua(ctx.db, ex.actor, { storeId, productKey: "COMMERCE_START", cycle: "MONTHLY", meio: "DINHEIRO" }, AGORA);
    expect(r.codigo).toMatch(/^REC-/);
    expect(r.whatsapp).toContain("wa.me/5511988887777");
    expect(r.recibo).toContain("Moda Rua");
    expect((await subscriptionOf(ctx.db, storeId))!.status).toBe("active");
    expect((await ctx.db.select().from(partnerCommissions).where(eq(partnerCommissions.partnerId, ex.partnerId))).map((c) => c.kind)).toEqual(["SALE"]);
    const meu = await painelDoExecutivo(ctx.db, ex.actor, AGORA);
    expect(meu).toMatchObject({ totalComigoCents: r.valorCents, travado: false });
    // A comissão é gravada com a hora real do banco: fixa no AGORA do teste para não depender do dia em que roda.
    await ctx.db.update(partnerCommissions).set({ createdAt: AGORA.toISOString() }).where(eq(partnerCommissions.partnerId, ex.partnerId));
    expect((await painelDosExecutivos(ctx.db, ctx.actors.master, AGORA))[0]).toMatchObject({ dinheiroComEleCents: r.valorCents, vendasSemana: 1, atrasados: 0 });

    await expect(receberDoExecutivo(ctx.db, ctx.actors.master, r.id, AGORA)).rejects.toThrow(/não foi aberto/);
    await abrirCaixa(ctx.db, ctx.actors.master, { data: "2026-12-10", saldoInicialCents: 0 }, AGORA);
    await receberDoExecutivo(ctx.db, ctx.actors.master, r.id, AGORA);
    const dia = await caixaDoDia(ctx.db, ctx.actors.master, "2026-12-10");
    expect(dia.linhas[0]).toMatchObject({ origem: "PRESTACAO_EXECUTIVO", meio: "DINHEIRO", destino: "DINHEIRO_MAURICIO", valorCents: r.valorCents, partnerId: ex.partnerId });
    expect(dia.resumo.esperadoGavetaCents).toBe(r.valorCents);
    await expect(receberDoExecutivo(ctx.db, ctx.actors.master, r.id, AGORA)).rejects.toThrow(/já foi recebido/);
    expect((await painelDoExecutivo(ctx.db, ex.actor, AGORA)).totalComigoCents).toBe(0);
  });

  it("vendas da semana no painel do dono: segunda de madrugada entra, domingo à noite fecha a semana certa (fuso de São Paulo)", async () => {
    const ex = await executivo();
    await registrarVendaDeRua(ctx.db, ex.actor, { storeId: await loja(ex.partnerId), productKey: "COMMERCE_START", cycle: "MONTHLY", meio: "DINHEIRO" }, AGORA);
    const casos: [venda: string, agora: string, conta: number][] = [
      ["2026-12-14T03:30:00Z", "2026-12-14T12:00:00Z", 1], // venda segunda 00h30 em SP, conferida na própria segunda (era o erro: data igual ao início da semana)
      ["2026-12-14T03:00:00Z", "2026-12-14T03:00:00Z", 1], // segunda 00h00 em SP: o início da semana é inclusivo
      ["2026-12-14T02:30:00Z", "2026-12-14T12:00:00Z", 0], // domingo 23h30 em SP (já segunda em UTC): é da semana anterior
      ["2026-12-21T02:30:00Z", "2026-12-21T02:45:00Z", 1], // domingo 20/12 23h30 em SP, conferida no mesmo domingo à noite
      ["2026-12-14T03:30:00Z", "2026-12-21T03:00:00Z", 0], // virou a segunda seguinte em SP: a semana zera
    ];
    for (const [venda, agora, conta] of casos) {
      await ctx.db.update(partnerCommissions).set({ createdAt: venda }).where(eq(partnerCommissions.partnerId, ex.partnerId));
      expect((await painelDosExecutivos(ctx.db, ctx.actors.master, new Date(agora)))[0]!.vendasSemana, `${venda} conferida em ${agora}`).toBe(conta);
    }
  });

  it("prazo vencido trava nova venda em dinheiro (maquininha segue); maquininha entra no caixa como Mercado Pago", async () => {
    const ex = await executivo();
    const a = await loja(ex.partnerId);
    const b = await loja(ex.partnerId, "outra@moda.com.br", "111.444.777-35");
    await registrarVendaDeRua(ctx.db, ex.actor, { storeId: a, productKey: "COMMERCE_START", cycle: "MONTHLY", meio: "DINHEIRO" }, AGORA);
    const depois = new Date("2026-12-16T12:00:00Z");
    await expect(registrarVendaDeRua(ctx.db, ex.actor, { storeId: b, productKey: "COMMERCE_PRO", cycle: "MONTHLY", meio: "DINHEIRO" }, depois)).rejects.toThrow(/prazo vencido/);
    const m = await registrarVendaDeRua(ctx.db, ex.actor, { storeId: b, productKey: "COMMERCE_PRO", cycle: "MONTHLY", meio: "MAQUININHA_VENDEDOR" }, depois);
    expect((await painelDoExecutivo(ctx.db, ex.actor, depois)).travado).toBe(true);
    expect((await pendenciasDosExecutivos(ctx.db, ctx.actors.master, depois)).map((x) => [x.meio, x.atrasado])).toEqual([["DINHEIRO", true], ["MAQUININHA_VENDEDOR", false]]);
    await abrirCaixa(ctx.db, ctx.actors.master, { data: "2026-12-16" }, depois);
    await receberDoExecutivo(ctx.db, ctx.actors.master, m.id, depois);
    expect((await caixaDoDia(ctx.db, ctx.actors.master, "2026-12-16")).linhas[0]).toMatchObject({ origem: "ASSINATURA", meio: "MAQUININHA_VENDEDOR", destino: "MP_MEGATRON" });
  });

  it("loja de outro parceiro é recusada; parceiro comum não usa a venda de rua; estorno desfaz", async () => {
    const ex = await executivo();
    const outro = await executivo("bia@nl.com", "11444777000161");
    const deOutro = await loja(outro.partnerId);
    await expect(registrarVendaDeRua(ctx.db, ex.actor, { storeId: deOutro, productKey: "COMMERCE_START", cycle: "MONTHLY", meio: "DINHEIRO" }, AGORA)).rejects.toThrow(/outro parceiro/);
    await ctx.db.update(partners).set({ executivo: false }).where(eq(partners.id, outro.partnerId));
    await expect(painelDoExecutivo(ctx.db, outro.actor, AGORA)).rejects.toThrow(/executivos/);
    const livre = await loja(null, "livre@moda.com.br", "111.444.777-35");
    const r = await registrarVendaDeRua(ctx.db, ex.actor, { storeId: livre, productKey: "COMMERCE_START", cycle: "MONTHLY", meio: "DINHEIRO" }, AGORA);
    expect((await ctx.db.query.stores.findFirst({ where: eq(stores.id, livre) }))!.partnerId).toBe(ex.partnerId);
    await estornarVendaDeRua(ctx.db, ctx.actors.master, r.id, "Cliente desistiu na hora", AGORA);
    const rec = (await ctx.db.query.executivoRecebimentos.findFirst({ where: eq(executivoRecebimentos.id, r.id) }))!;
    expect(rec.status).toBe("ESTORNADO");
    expect((await ctx.db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, rec.invoiceId) }))!.status).toBe("CANCELED");
    expect((await ctx.db.select().from(partnerCommissions).where(eq(partnerCommissions.partnerId, ex.partnerId)))[0]!.status).toBe("VOID");
  });

  it("visita: retorno obrigatório para quem pediu para pensar, agenda, conclusão, missões, ranking e feed (CX4/BG3)", async () => {
    const ex = await executivo();
    const outro = await executivo("bia@nl.com", "11444777000161");
    const deOutro = await loja(outro.partnerId);
    await expect(registrarVisita(ctx.db, ex.actor, { loja: "Box 12", tipo: "VISITA", resultado: "PENSAR" }, AGORA)).rejects.toThrow(/dia para você voltar/);
    await expect(registrarVisita(ctx.db, ex.actor, { loja: "Box 12", tipo: "VISITA", resultado: "PENSAR", retornoEm: "2026-12-01" }, AGORA)).rejects.toThrow(/hoje ou depois/);
    await expect(registrarVisita(ctx.db, ex.actor, { loja: "Moda Rua", storeId: deOutro, tipo: "VISITA", resultado: "INTERESSADO" }, AGORA)).rejects.toThrow(/não é sua/);
    const { id } = await registrarVisita(ctx.db, ex.actor, { loja: "Box 12", contato: "Rita", whatsapp: "(11) 99999-0000", tipo: "DEMONSTRACAO", resultado: "PENSAR", retornoEm: "2026-12-12" }, AGORA);
    await registrarVisita(ctx.db, ex.actor, { loja: "Box 13", tipo: "VISITA", resultado: "NAO_QUIS" }, AGORA);
    let painel = await painelDoExecutivo(ctx.db, ex.actor, AGORA);
    expect(painel.agenda).toMatchObject([{ tipo: "RETORNO", quando: "2026-12-12", visitaId: id, whatsapp: "11999990000" }]);
    expect(painel.visitasSemana).toBe(2);
    expect(painel.esforco[0]).toMatchObject({ nome: "Você", visitas: 2, voce: true });
    expect(painel.meta).toMatchObject({ meta: 3, feitas: 0 });
    expect(painel.executivo.primeiroNome).toBe("Ana");
    await concluirRetorno(ctx.db, ex.actor, id, AGORA);
    await expect(concluirRetorno(ctx.db, outro.actor, id, AGORA)).rejects.toThrow(/não encontrada/);
    painel = await painelDoExecutivo(ctx.db, ex.actor, AGORA);
    expect(painel.agenda).toEqual([]);
    // As missões da rua contam visitas e demonstrações da semana real (o engajamento usa a hora do banco).
    await registrarVisita(ctx.db, ex.actor, { loja: "Box 20", tipo: "DEMONSTRACAO", resultado: "INTERESSADO" });
    const e = (await engajamentoDoParceiro(ctx.db, ex.partnerId))!;
    const m = Object.fromEntries(e.missoes.lista.map((x) => [x.id, x.atual]));
    expect(m.visitas).toBeGreaterThanOrEqual(1);
    expect(m.demonstracoes).toBeGreaterThanOrEqual(1);
    expect((await feedDaEquipe(ctx.db, ctx.actors.master)).map((f) => f.tipo)).toContain("Demonstração");
  });

  it("meta semanal: só o dono define; vazia volta ao padrão", async () => {
    const ex = await executivo();
    const { createMasterMember } = await import("@/lib/domain/equipe-master");
    const { id } = await createMasterMember(ctx.db, ctx.actors.master, { name: "Pessoa Fin", email: "fin@nl.teste", password: "provisoria-123", masterFunction: "FINANCEIRO" });
    await expect(definirMetaSemanal(ctx.db, { ...ctx.actors.master, userId: id, masterFunction: "FINANCEIRO" }, ex.partnerId, 5)).rejects.toThrow(/dono/);
    await definirMetaSemanal(ctx.db, ctx.actors.master, ex.partnerId, 5);
    expect((await painelDoExecutivo(ctx.db, ex.actor, AGORA)).meta.meta).toBe(5);
    await definirMetaSemanal(ctx.db, ctx.actors.master, ex.partnerId, null);
    expect((await painelDoExecutivo(ctx.db, ex.actor, AGORA)).meta.meta).toBe(3);
  });
});
