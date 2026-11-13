import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { stores } from "@/db/schema";
import { ALVO_A, ALVO_CNAME, ehRaiz, lojaPorDominio, normalizarDominio, registrosDns, removerDominio, salvarDominio, verificarDominio } from "@/lib/domain/dominio-proprio";
import { montarPerfil, TABELA_PADRAO } from "@/lib/domain/perfil-loja";
import { storeUrl } from "@/lib/store-url";
import { podeSerDominioDeLoja } from "@/proxy";

/** Domínio próprio para todo lojista Commerce (D234). */
describe("domínio próprio: regras puras", () => {
  it("normaliza, recusa o que não é domínio e os endereços da plataforma", () => {
    expect(normalizarDominio(" https://WWW.MinhaLoja.com.br/produtos ")).toBe("www.minhaloja.com.br");
    expect(() => normalizarDominio("minhaloja")).toThrow();
    expect(() => normalizarDominio("lojas.nextlevelgroup.com.br")).toThrow();
    expect(() => normalizarDominio("x.onrender.com")).toThrow();
  });
  it("raiz usa registro A + www; subdomínio usa CNAME", () => {
    expect(ehRaiz("minhaloja.com.br")).toBe(true);
    expect(ehRaiz("www.minhaloja.com.br")).toBe(false);
    expect(ehRaiz("minhaloja.com")).toBe(true);
    expect(registrosDns("minhaloja.com.br")).toEqual([{ tipo: "A", nome: "@", valor: ALVO_A() }, { tipo: "CNAME", nome: "www", valor: ALVO_CNAME() }]);
    expect(registrosDns("loja.minhamarca.com.br")).toEqual([{ tipo: "CNAME", nome: "loja", valor: ALVO_CNAME() }]);
  });
  it("conectado vale em qualquer plano; o proxy só procura hosts de fora da plataforma", () => {
    expect(storeUrl("mantos", "STORE_SUBDOMAIN", "www.mantos.com.br", "CONNECTED")).toBe("https://www.mantos.com.br");
    expect(storeUrl("mantos", "STORE_SUBDOMAIN", "www.mantos.com.br", "PENDING")).toBe("/store/mantos");
    expect(podeSerDominioDeLoja("www.mantos.com.br")).toBe(true);
    expect(podeSerDominioDeLoja("localhost:3000")).toBe(false);
    expect(podeSerDominioDeLoja("nextlevel-demo.onrender.com")).toBe(false);
    expect(podeSerDominioDeLoja("10.0.0.1")).toBe(false);
  });
  it("Commerce libera em todos os planos, mesmo se a tabela do Master tirar", () => {
    const tabela = { ...TABELA_PADRAO, COMMERCE_START: TABELA_PADRAO.COMMERCE_START.filter((f) => f !== "customDomain") };
    const p = montarPerfil({ store: { id: "s", offer: "STORE_SUBDOMAIN" }, marca: "NEXTLEVEL_COMMERCE", modalidade: "INDEPENDENT", plano: { productKey: "COMMERCE_START", status: "active" }, tabela, direitos: new Set() });
    expect(p.pode.customDomain).toBe(true);
    const sd = montarPerfil({ store: { id: "s", offer: "STORE_SUBDOMAIN" }, marca: "SUPERDROP", modalidade: "INDEPENDENT", plano: null, tabela, direitos: new Set() });
    expect(sd.pode.customDomain).toBe(false); // SuperDrop sem mudança
  });
});

describe("domínio próprio: cadastro, verificação e host", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  beforeEach(async () => { ctx = await freshDb(); });

  it("cadastra, resolve pelo host (com e sem www), verifica e conecta; um domínio é de uma loja só", async () => {
    const [a, b] = await ctx.db.select({ id: stores.id, slug: stores.slug }).from(stores).limit(2);
    const r = await salvarDominio(ctx.db, a!.id, "MinhaLoja.com.br");
    expect(r.dominio).toBe("minhaloja.com.br");
    expect(await lojaPorDominio(ctx.db, "www.minhaloja.com.br")).toBe(a!.slug);
    await expect(salvarDominio(ctx.db, b!.id, "minhaloja.com.br")).rejects.toThrow(/outra loja/);
    const semDns = await verificarDominio(ctx.db, a!.id, { cname: async () => [], a: async () => [], ping: async () => null });
    expect(semDns).toMatchObject({ dns: false, conectado: false });
    const ok = await verificarDominio(ctx.db, a!.id, { cname: async () => [], a: async () => [ALVO_A()], ping: async () => a!.slug });
    expect(ok.conectado).toBe(true);
    expect((await ctx.db.query.stores.findFirst({ where: eq(stores.id, a!.id) }))!.domainStatus).toBe("CONNECTED");
    await removerDominio(ctx.db, a!.id);
    expect(await lojaPorDominio(ctx.db, "minhaloja.com.br")).toBeNull();
  });
});
