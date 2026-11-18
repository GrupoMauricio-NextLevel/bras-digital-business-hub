import { beforeEach, describe, expect, it } from "vitest";
import { comDesconto } from "@/lib/business/precos-frentes";
import { businessLigado, chaveDoModulo, modulosDe, modulosDoNegocio, requireModulo, temLoja } from "@/lib/business/modulos";
import { caminhoDe, CAMINHOS, NOME_GERENCIADOR } from "@/lib/marcas/nextlevel-ecommerce";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { stores } from "@/db/schema";
import { signupMember } from "@/lib/domain/store-access";
import { grantEntitlement } from "@/lib/domain/entitlements";
import { caminhoDoInteressado, comCaminho, createBrandLead } from "@/lib/domain/brand-leads";
import { brandLeads } from "@/db/schema";
import { DEFAULT_PRICE_BOOK, priceBookSchema } from "@/lib/finance/price-book";
import { contratarModulo, ligarLojaVirtual, pacoteDe, PACOTE_ROTULO } from "@/lib/business/planos";
import { markInvoicePaid } from "@/lib/domain/finance";

const base = { marca: "NEXTLEVEL_COMMERCE", direitos: new Set<string>(), ligado: true };

describe("módulos do negócio (NB1, D306)", () => {
  it("chave desligada: tudo como antes, até para quem foi criado como site", () => {
    const m = modulosDe({ ...base, formato: "SITE", ligado: false });
    expect(m.business).toBe(false);
    expect([...m.ativos]).toEqual(["loja"]);
    expect(temLoja(m)).toBe(true);
  });
  it("outra marca não ganha o NextLevel Business", () => {
    const m = modulosDe({ ...base, marca: "SUPERDROP", formato: "LOJA" });
    expect(m.business).toBe(false);
  });
  it("loja: painel, contatos e loja; sem site", () => {
    const m = modulosDe({ ...base, formato: "LOJA" });
    expect(m.business).toBe(true);
    expect([...m.ativos].sort()).toEqual(["contatos", "loja", "painel"]);
  });
  it("site: painel, contatos e site; sem vitrine de loja", () => {
    const m = modulosDe({ ...base, formato: "SITE" });
    expect([...m.ativos].sort()).toEqual(["contatos", "painel", "site"]);
    expect(temLoja(m)).toBe(false);
  });
  it("módulos extras só com direito (portal nasce desligado)", () => {
    expect(modulosDe({ ...base, formato: "SITE" }).ativos.has("portal")).toBe(false);
    const m = modulosDe({ ...base, formato: "SITE", direitos: new Set([chaveDoModulo("loja"), chaveDoModulo("caixa"), chaveDoModulo("portal")]) });
    expect(m.ativos.has("loja") && m.ativos.has("caixa") && m.ativos.has("portal") && m.ativos.has("site")).toBe(true);
  });
  it("chave BUSINESS_V1 aceita true/1 e nada mais", () => {
    expect(businessLigado({ BUSINESS_V1: "true" })).toBe(true);
    expect(businessLigado({ BUSINESS_V1: "1" })).toBe(true);
    expect(businessLigado({ BUSINESS_V1: "sim" })).toBe(false);
    expect(businessLigado({})).toBe(false);
  });
  it("nomes vêm das constantes da marca", () => {
    expect(NOME_GERENCIADOR.nome).toBe("Meu negócio");
    expect(CAMINHOS.site.formato).toBe("SITE");
    expect(caminhoDe("site")).toBe("site");
    expect(caminhoDe("empresa")).toBeNull();
  });
});


describe("cadastro com o caminho escolhido (NB1)", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });
  const dados = (email: string) => ({ storeName: "Vidraçaria Modelo", ownerName: "Rita Lima", email, password: "senha-segura-1", taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN" as const, brand: "NEXTLEVEL_COMMERCE" as const, independent: true });

  it("conta nova sem escolha continua loja; com 'site' nasce SITE e com fuso de São Paulo", async () => {
    const loja = await signupMember(ctx.db, dados("rita@loja.com.br"));
    const site = await signupMember(ctx.db, { ...dados("rita@site.com.br"), taxId: "111.444.777-35", formato: "SITE" });
    const [a, b] = await Promise.all([loja, site].map((r) => ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) })));
    expect(a?.formato).toBe("LOJA");
    expect(b?.formato).toBe("SITE");
    expect(b?.fuso).toBe("America/Sao_Paulo");
  });

  it("módulos lidos do banco respeitam a chave e os direitos; requireModulo barra no servidor", async () => {
    const r = await signupMember(ctx.db, { ...dados("rita@site2.com.br"), formato: "SITE" });
    const ligado = { BUSINESS_V1: "true" };
    expect([...(await modulosDoNegocio(ctx.db, r.storeId, new Date(), {})).ativos]).toEqual(["loja"]);
    const m = await modulosDoNegocio(ctx.db, r.storeId, new Date(), ligado);
    expect(m.ativos.has("site") && !m.ativos.has("loja")).toBe(true);
    await grantEntitlement(ctx.db, { type: "STORE", storeId: r.storeId }, { key: chaveDoModulo("loja"), source: "COURTESY" });
    expect((await modulosDoNegocio(ctx.db, r.storeId, new Date(), ligado)).ativos.has("loja")).toBe(true);
    const ator = { userId: r.userId, role: "STORE_OWNER" as const, organizationId: "x", supplierId: null, storeId: r.storeId };
    await expect(requireModulo(ctx.db, ator, "caixa")).rejects.toThrow(/Caixa não está ligado/);
    await expect(requireModulo(ctx.db, { ...ator, storeId: null }, "painel")).rejects.toThrow(/painel do negócio/);
  });
});

describe("caminho escolhido no formulário de entrada (NB1)", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });
  it("um caminho só nas necessidades, e a leitura de volta", () => {
    expect(comCaminho(["x"], undefined)).toEqual(["x"]);
    expect(comCaminho(["x", "caminho:loja"], "site")).toEqual(["x", "caminho:site"]);
    expect(caminhoDoInteressado(["caminho:indeciso"])).toBe("indeciso");
    expect(caminhoDoInteressado(["caminho:outro"])).toBeNull();
  });
  it("o interessado guarda o caminho e a segunda escolha substitui a primeira", async () => {
    const lead = { brand: "NEXTLEVEL_COMMERCE" as const, name: "Rita Lima", email: "rita@vidracaria.com.br", phone: "11 99999-8888" };
    const r = await createBrandLead(ctx.db, { ...lead, caminho: "site" });
    let row = await ctx.db.query.brandLeads.findFirst({ where: eq(brandLeads.id, r.id) });
    expect(caminhoDoInteressado(row!.needs)).toBe("site");
    await createBrandLead(ctx.db, { ...lead, caminho: "loja" });
    row = await ctx.db.query.brandLeads.findFirst({ where: eq(brandLeads.id, r.id) });
    expect(row!.needs.filter((n) => n.startsWith("caminho:"))).toEqual(["caminho:loja"]);
  });
});

describe("tabela de preços com os módulos (NB8, D310)", () => {
  it("tabela salva antes dos módulos continua valendo; os módulos entram com o valor padrão", () => {
    const antiga = structuredClone(DEFAULT_PRICE_BOOK) as unknown as { addons: Record<string, unknown> };
    delete antiga.addons.MODULO_SITE; antiga.addons.MODULO_LOJA = { name: "Chave antiga", description: "x", audience: "STORE", monthlyCents: 1, annualCents: 1 };
    (antiga.addons.PREMIUM_SUPPORT as { monthlyCents: number }).monthlyCents = 12_345;
    const r = priceBookSchema.safeParse(antiga);
    expect(r.success).toBe(true);
    expect(r.data!.addons.PREMIUM_SUPPORT.monthlyCents).toBe(12_345);
    expect(r.data!.addons.MODULO_SITE.name).toBe("Site para a empresa");
    expect("MODULO_LOJA" in r.data!.addons).toBe(false);
  });
});

describe("pacotes do negócio (NB8, D308/D310)", () => {
  it("nome do pacote pelos módulos ligados", () => {
    expect(PACOTE_ROTULO[pacoteDe(modulosDe({ ...base, formato: "LOJA" }))]).toBe("Loja virtual");
    expect(PACOTE_ROTULO[pacoteDe(modulosDe({ ...base, formato: "SITE", direitos: new Set([chaveDoModulo("loja")]) }))]).toBe("Site + Loja virtual");
  });
  it("planos de loja intactos: o site é o único adicional; a loja liga sem cobrança para quem entrou pelo site", async () => {
    const ctx = await freshDb();
    const r = await signupMember(ctx.db, { storeName: "Vidraçaria Plano", ownerName: "Rita Lima", email: "rita@plano.com.br", password: "senha-segura-1", taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true, formato: "SITE" });
    const ator = { userId: r.userId, role: "STORE_OWNER" as const, organizationId: "x", supplierId: null, storeId: r.storeId };
    await expect(contratarModulo(ctx.db, ator, "MODULO_LOJA", "MONTHLY")).rejects.toThrow(/não encontrado/);
    await expect(ligarLojaVirtual(ctx.db, ator)).rejects.toThrow(/Ainda não está aberto/);
    process.env.BUSINESS_V1 = "true";
    try {
      await expect(contratarModulo(ctx.db, ator, "MODULO_SITE", "MONTHLY")).rejects.toThrow(/já vem no seu plano/);
      await expect(ligarLojaVirtual(ctx.db, { ...ator, storeRole: "STAFF" as const })).rejects.toThrow(/Só o dono/);
      expect((await ligarLojaVirtual(ctx.db, ator)).nova).toBe(true);
      const m = await modulosDoNegocio(ctx.db, r.storeId);
      expect(m.ativos.has("loja") && m.ativos.has("site")).toBe(true);
      expect((await ligarLojaVirtual(ctx.db, ator)).nova).toBe(false);
      // Lojista contrata o site (D336): Sites do mesmo nível com o desconto do segundo produto; paga, o site liga.
      const l = await signupMember(ctx.db, { storeName: "Moda Plano", ownerName: "Ana Lima", email: "ana@plano.com.br", password: "senha-segura-1", taxId: "111.444.777-35", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true });
      const lojista = { userId: l.userId, role: "STORE_OWNER" as const, organizationId: "x", supplierId: null, storeId: l.storeId };
      const f = await contratarModulo(ctx.db, lojista, "MODULO_SITE", "MONTHLY");
      expect(f.amountCents).toBe(comDesconto(DEFAULT_PRICE_BOOK.frentes.sitesStartCents, DEFAULT_PRICE_BOOK.frentes.segundoProdutoBps));
      await markInvoicePaid(ctx.db, f.invoiceId);
      expect((await modulosDoNegocio(ctx.db, l.storeId)).ativos.has("site")).toBe(true);
    } finally { delete process.env.BUSINESS_V1; }
  });
});
