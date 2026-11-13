import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { financeInvoices, stores, users } from "@/db/schema";
import { signupMember } from "@/lib/domain/store-access";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { markInvoicePaid } from "@/lib/domain/finance";
import { entradaDe, extrairCodigo, iconeDaLoja, manifestoDaLoja, salvarIntegracoes, temAlgumaMedicao, validarIntegracoes } from "@/lib/domain/integracoes";
import { aplicativosDaLoja } from "@/lib/domain/aplicativos";

/** Rodada A das integrações (D189, I-01 a I-11): só códigos validados, nunca script colado; só na loja da Commerce. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

async function lojaEcommerce() {
  const r = await signupMember(ctx.db, { storeName: "Adega Rodada", ownerName: "Ana Teste", email: "ana@adega.com.br", password: "senha-segura-1", taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
  const owner: Actor = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!);
  await markInvoicePaid(ctx.db, (await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId)))[0]!.id);
  return { storeId: r.storeId, owner };
}

describe("tirar o código do que o lojista colou", () => {
  it("aceita a meta tag do Google, o endereço do Tawk e do Jivo e corrige maiúsculas", () => {
    expect(extrairCodigo("googleVerificacao", '<meta name="google-site-verification" content="AbCdEf_123-456ghIJKlmnOP" />')).toBe("AbCdEf_123-456ghIJKlmnOP");
    expect(extrairCodigo("tawk", "https://embed.tawk.to/64f0c0ffee0123456789abcd/1h2j3k4l5")).toBe("64f0c0ffee0123456789abcd/1h2j3k4l5");
    expect(extrairCodigo("jivo", "//code.jivosite.com/widget/AbCd1234Ef")).toBe("AbCd1234Ef");
    expect(extrairCodigo("ga4", " g-abc123xyz ")).toBe("G-ABC123XYZ");
  });
});

describe("validação", () => {
  it("guarda só os códigos válidos e desliga o que ficou vazio", () => {
    const r = validarIntegracoes({ ga4: "g-abc123xyz", gtm: "", googleAdsId: "AW-123456789", googleAdsRotulo: "AbC-D_efG123", tiktokPixel: "C1ABCDEFGHIJ2KLMNOPQ", pinterestTag: "2612345678901", chatProvedor: "TAWK", chatId: "https://embed.tawk.to/64f0c0ffee0123456789abcd/1h2j3k4l5", pwa: true, maioridade: false });
    expect(r).toEqual({ ok: true, valor: { ga4: "G-ABC123XYZ", googleAds: { id: "AW-123456789", rotulo: "AbC-D_efG123" }, tiktokPixel: "C1ABCDEFGHIJ2KLMNOPQ", pinterestTag: "2612345678901", chat: { provedor: "TAWK", id: "64f0c0ffee0123456789abcd/1h2j3k4l5" }, pwa: true } });
  });

  it("recusa script colado, formatos errados e rótulo do Ads sem o ID", () => {
    const r = validarIntegracoes({ ga4: "<script>alert(1)</script>", gtm: "GTM-<x>", googleVerificacao: '<meta content="x">', googleAdsRotulo: "AbC-D_efG123", tiktokPixel: "abc", pinterestTag: "12a", chatProvedor: "JIVO", chatId: "javascript:alert(1)" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.erros).sort()).toEqual(["chatId", "ga4", "googleAdsId", "googleVerificacao", "gtm", "pinterestTag", "tiktokPixel"]);
    expect(r.erros.ga4).toMatch(/formato inválido/);
  });

  it("chat escolhido sem código é erro; o formulário volta com o que está salvo", () => {
    const r = validarIntegracoes({ chatProvedor: "TAWK", chatId: "" });
    expect(r.ok).toBe(false);
    expect(entradaDe({ googleAds: { id: "AW-123456789" }, chat: { provedor: "JIVO", id: "AbCd1234Ef" }, pwa: true })).toMatchObject({ googleAdsId: "AW-123456789", googleAdsRotulo: "", chatProvedor: "JIVO", chatId: "AbCd1234Ef", pwa: true, maioridade: false });
  });
});

describe("gravar na loja", () => {
  it("o dono da loja da Commerce salva; a central de aplicativos acende os cartões", async () => {
    const l = await lojaEcommerce();
    await salvarIntegracoes(ctx.db, l.owner, { ga4: "G-ABC123XYZ", maioridade: true, pwa: true });
    const loja = (await ctx.db.select().from(stores).where(eq(stores.id, l.storeId)))[0]!;
    expect(loja.integrations).toEqual({ ga4: "G-ABC123XYZ", maioridade: true, pwa: true });
    const apps = Object.fromEntries(aplicativosDaLoja(loja, { redirecionamentos: 0 }).map((a) => [a.key, a.estado]));
    expect(apps).toMatchObject({ ga4: "ligado", gtm: "desligado", pwa: "ligado", maioridade: "ligado", chat: "desligado" });
    expect(temAlgumaMedicao(loja.integrations, null)).toBe(true);
    expect(temAlgumaMedicao({ pwa: true, maioridade: true }, null)).toBe(false);
    // Salvar de novo com tudo vazio desliga tudo.
    await salvarIntegracoes(ctx.db, l.owner, {});
    expect((await ctx.db.select().from(stores).where(eq(stores.id, l.storeId)))[0]!.integrations).toEqual({});
  });

  it("formato inválido não grava; loja do SuperDrop e cliente não usam", async () => {
    const l = await lojaEcommerce();
    await expect(salvarIntegracoes(ctx.db, l.owner, { ga4: "<script>" })).rejects.toThrow(/formato inválido/);
    expect((await ctx.db.select().from(stores).where(eq(stores.id, l.storeId)))[0]!.integrations).toEqual({});
    await expect(salvarIntegracoes(ctx.db, ctx.actors.arena, { ga4: "G-ABC123XYZ" })).rejects.toThrow(/Commerce/);
    expect((await ctx.db.select().from(stores).where(eq(stores.id, ctx.seed.stores.arena.id)))[0]!.integrations).toEqual({});
  });
});

describe("loja instalável no celular", () => {
  it("manifesto com nome, cor e ícones; cor e texto do ícone escapados", () => {
    const m = manifestoDaLoja({ name: "Adega Rodada de Teste", logoText: "AR", logoUrl: "/uploads/logo.png", primaryColor: "#7a1f3d" }, "/store/adega");
    expect(m).toMatchObject({ name: "Adega Rodada de Teste", short_name: "Adega Rodada", start_url: "/store/adega?origem=app", display: "standalone", theme_color: "#7a1f3d" });
    expect(m.icons.map((i) => i.src)).toEqual(["/uploads/logo.png", "/store/adega/icone.svg"]);
    expect(manifestoDaLoja({ name: "X", logoText: null, logoUrl: "javascript:x", primaryColor: "red" }, "/store/x")).toMatchObject({ theme_color: "#0f172a", icons: [{ src: "/store/x/icone.svg" }] });
    const svg = iconeDaLoja({ logoText: "<b>", primaryColor: "#7a1f3d\" onload=\"x" }, "#ffffff");
    expect(svg).toContain("&lt;b&gt;");
    expect(svg).toContain('fill="#0f172a"');
    expect(svg).not.toContain("onload");
  });
});
