import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { executivoRecebimentos, financeInvoices, partnerCommissions, partners, stores, users } from "@/db/schema";
import { actorFromUser } from "@/lib/domain/access";
import { signupMember } from "@/lib/domain/store-access";
import { abrirCaixa, caixaDoDia } from "@/lib/domain/caixa";
import { cadastrarExecutivo, estornarVendaDeRua, painelDoExecutivo, painelDosExecutivos, pendenciasDosExecutivos, receberDoExecutivo, registrarVendaDeRua } from "@/lib/domain/executivos";
import { atrasado, codigoDeRecibo, linkDoRecibo, prazoDeEntrega, textoDoRecibo } from "@/lib/finance/executivo-regras";
import { subscriptionOf } from "@/lib/domain/commerce-plans";

describe("executivos (puro, D273)", () => {
  it("prazo de 2 dias úteis: sexta vence terça; quinta vence segunda", () => {
    expect(prazoDeEntrega(new Date("2026-12-11T15:00:00Z")).toISOString()).toBe("2026-12-16T03:00:00.000Z"); // sex → fim de ter
    expect(prazoDeEntrega(new Date("2026-12-10T15:00:00Z")).toISOString()).toBe("2026-12-15T03:00:00.000Z"); // qui → fim de seg
    expect(atrasado("2026-12-15T03:00:00.000Z", new Date("2026-12-15T04:00:00Z"))).toBe(true);
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
    // A comissão é gravada com a hora real do banco: o painel é conferido no "agora" de verdade.
    expect((await painelDosExecutivos(ctx.db, ctx.actors.master))[0]).toMatchObject({ dinheiroComEleCents: r.valorCents, vendasSemana: 1, atrasados: 0 });

    await expect(receberDoExecutivo(ctx.db, ctx.actors.master, r.id, AGORA)).rejects.toThrow(/não foi aberto/);
    await abrirCaixa(ctx.db, ctx.actors.master, { data: "2026-12-10", saldoInicialCents: 0 }, AGORA);
    await receberDoExecutivo(ctx.db, ctx.actors.master, r.id, AGORA);
    const dia = await caixaDoDia(ctx.db, ctx.actors.master, "2026-12-10");
    expect(dia.linhas[0]).toMatchObject({ origem: "PRESTACAO_EXECUTIVO", meio: "DINHEIRO", destino: "DINHEIRO_MAURICIO", valorCents: r.valorCents, partnerId: ex.partnerId });
    expect(dia.resumo.esperadoGavetaCents).toBe(r.valorCents);
    await expect(receberDoExecutivo(ctx.db, ctx.actors.master, r.id, AGORA)).rejects.toThrow(/já foi recebido/);
    expect((await painelDoExecutivo(ctx.db, ex.actor, AGORA)).totalComigoCents).toBe(0);
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
});
