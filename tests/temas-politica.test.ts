import { beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { entitlements, financeInvoices, orders, storeProducts, stores, themes, themeTemplates, themeTemplateVersions } from "@/db/schema";
import { newId } from "@/lib/ids";
import { markInvoicePaid } from "@/lib/domain/finance";
import { fulfillPaidInvoice } from "@/lib/domain/nextlevel-billing";
import { syncThemeCatalog, THEME_BY_KEY } from "@/lib/themes/catalog";
import { buyTheme, installTheme } from "@/lib/themes/install";
import { capabilitiesOf, CAPABILITIES, LEVELS } from "@/lib/themes/levels";
import { editingContextFor } from "@/lib/themes/license";
import { checkTemplateChange, makeEditingContext } from "@/lib/themes/policy";
import { draftRevisions, listVersions, publishAllDrafts, resolveTemplate, restoreVersion, saveTemplateDraft } from "@/lib/themes/store";
import { addBlock, addSection, duplicateSection, moveSection, setBlockSetting, setSetting } from "@/lib/themes/template";
import { sectionSchema } from "@/lib/themes/sections";
import { freshDb } from "./setup";

let ctx: Awaited<ReturnType<typeof freshDb>>;
const grant = (storeId: string, key: string) => ctx.db.insert(entitlements).values({ id: newId("ent"), tenantType: "STORE", storeId, key: `THEME_${key.toUpperCase()}`, source: "COURTESY" });
const storeOf = async (id: string) => (await ctx.db.query.stores.findFirst({ where: eq(stores.id, id) }))!;
const home = async (id: string) => (await resolveTemplate(ctx.db, await storeOf(id), "home", { draft: true })).template;
beforeAll(async () => { ctx = await freshDb(); await syncThemeCatalog(ctx.db); }, 120_000);

describe("níveis e capacidades", () => {
  it("são cumulativos: N1 ⊆ N2 ⊆ N3 ⊆ N4, e todo recurso tem um nível", () => {
    for (const l of LEVELS.slice(1)) for (const c of capabilitiesOf((l - 1) as 1 | 2 | 3)) expect(capabilitiesOf(l).has(c), `${c} em N${l}`).toBe(true);
    expect(capabilitiesOf(4).size).toBe(CAPABILITIES.length);
    expect(capabilitiesOf(1).has("editor.reorder")).toBe(false); expect(capabilitiesOf(3).has("editor.reorder")).toBe(true);
  });
  it("o catálogo separa família, nível e liberação, preservando chaves e preços", () => {
    expect(THEME_BY_KEY.lume).toMatchObject({ family: "moda", level: 2, release: "released", priceCents: 14900 });
    expect(THEME_BY_KEY.ninho).toMatchObject({ family: "casa", level: 2, release: "review", priceCents: 14900 });
    expect(THEME_BY_KEY.arena).toMatchObject({ family: "sport", level: 3, priceCents: 29900 });
    expect(THEME_BY_KEY.signature).toMatchObject({ level: 4, priceCents: 149900 });
  });
});

describe("a licença do tema libera a edição do que foi comprado (sem upgrade de plano escondido)", () => {
  it("loja SuperDrop de subdomínio com Lume (N2) acrescenta FAQ e banners aprovados", async () => {
    const id = ctx.actors.arena.storeId!;
    await grant(id, "lume"); await installTheme(ctx.db, ctx.actors.arena, "lume");
    const ec = await editingContextFor(ctx.db, await storeOf(id));
    expect(ec).toMatchObject({ themeKey: "lume", level: 2 }); expect(ec.legacy.size).toBe(0);
    const t1 = addSection(await home(id), "faq", { region: "content", page: "home" }).template;
    await saveTemplateDraft(ctx.db, ctx.actors.arena, id, "home", t1);
    const t2 = addSection(await home(id), "banner-duo", { region: "content", page: "home" }).template;
    await saveTemplateDraft(ctx.db, ctx.actors.arena, id, "home", t2);
  });
  it("N2: limite de espaços extras não é contornado por duplicação", async () => {
    const id = ctx.actors.arena.storeId!;
    let t = await home(id);
    t = addSection(t, "cta-banner", { region: "content", page: "home" }).template; // 3º extra (FAQ, dois banners, chamada)
    await saveTemplateDraft(ctx.db, ctx.actors.arena, id, "home", t);
    const extra = Object.keys(t.sections).find((k) => t.sections[k]!.type === "cta-banner" && !["cta"].includes(k))!;
    await expect(saveTemplateDraft(ctx.db, ctx.actors.arena, id, "home", duplicateSection(t, extra).template)).rejects.toMatchObject({ code: "THEME_LIMIT" });
  });
  it("N2 não reorganiza a composição do tema e não usa recurso N3 (mosaico)", async () => {
    const id = ctx.actors.arena.storeId!; const t = await home(id);
    await expect(saveTemplateDraft(ctx.db, ctx.actors.arena, id, "home", moveSection(t, t.order[0]!, 3))).rejects.toMatchObject({ code: "THEME_LOCKED" });
    await expect(saveTemplateDraft(ctx.db, ctx.actors.arena, id, "home", addSection(t, "banner-mosaic", { region: "content", page: "home" }).template)).rejects.toMatchObject({ code: "THEME_LOCKED" });
  });
});

describe("tentativas de contornar os cadeados enviando JSON direto", () => {
  it("loja Loja própria SEM licença não grava seção de tema pago; o que já tinha continua editável", async () => {
    const id = ctx.actors.mantos.storeId!; const t = await home(id);
    await expect(saveTemplateDraft(ctx.db, ctx.actors.mantos, id, "home", addSection(t, "slideshow", { region: "content", page: "home" }).template)).rejects.toMatchObject({ code: "THEME_LOCKED" });
    // Compatibilidade do plano: a Loja própria continua reorganizando seções da base.
    await saveTemplateDraft(ctx.db, ctx.actors.mantos, id, "home", moveSection(t, t.order[0]!, 2));
    // Direito já existente: um slideshow que já estava publicado (antes da política) segue editável.
    const legacy = addSection(await home(id), "slideshow", { region: "content", page: "home" });
    await ctx.db.update(themeTemplates).set({ published: legacy.template, draft: null }).where(and(eq(themeTemplates.storeId, id), eq(themeTemplates.page, "home")));
    const cur = await home(id); const bid = cur.sections[legacy.id]!.blockOrder[0]!;
    await saveTemplateDraft(ctx.db, ctx.actors.mantos, id, "home", setBlockSetting(cur, legacy.id, bid, "heading", "Texto novo"));
  });
  it("seção desconhecida ou fora da página é recusada (dado inválido), não some em silêncio", async () => {
    const id = ctx.actors.mantos.storeId!; const t = structuredClone(await home(id));
    (t.sections as Record<string, unknown>)["zz"] = { type: "cart-main", settings: {}, blocks: {}, blockOrder: [] }; t.order.push("zz");
    await expect(saveTemplateDraft(ctx.db, ctx.actors.mantos, id, "home", t)).rejects.toMatchObject({ code: "THEME_INVALID" });
  });
  it("rascunho com seção sem direito (gravado direto no banco) não é publicado", async () => {
    const id = ctx.actors.mantos.storeId!; const t = addSection(await home(id), "lookbook", { region: "content", page: "home" }).template;
    await ctx.db.update(themeTemplates).set({ draft: t }).where(and(eq(themeTemplates.storeId, id), eq(themeTemplates.page, "home")));
    await expect(publishAllDrafts(ctx.db, ctx.actors.mantos, id)).rejects.toMatchObject({ code: "THEME_LOCKED" });
  });
  it("N1: mais slides do que o nível permite são recusados; ajuste de N2 também", () => {
    const n1 = makeEditingContext({ themeKey: "starter", themeName: "Starter", family: "base", level: 1, offer: "STORE_SUBDOMAIN" });
    const a = addSection({ v: 1, sections: {}, order: [] }, "hero-banner", { region: "content", page: "home" });
    const two = addBlock(a.template, a.id, "slide").template;
    expect(checkTemplateChange(n1, a.template, two, { region: "content", page: "home" })[0]?.reason).toBe("LIMIT");
    expect(checkTemplateChange(n1, a.template, setSetting(a.template, a.id, "height", "lg"), { region: "content", page: "home" })[0]?.reason).toBe("CAPABILITY_LOCKED");
    // Desligar/voltar ao padrão é sempre permitido
    const on = setSetting(a.template, a.id, "fullWidth", true);
    expect(checkTemplateChange(n1, on, setSetting(on, a.id, "fullWidth", false), { region: "content", page: "home" })).toEqual([]);
  });
});

describe("compra, licença e instalação", () => {
  it("evento de pagamento repetido não duplica licença", async () => {
    const id = ctx.actors.arena.storeId!;
    const r = await buyTheme(ctx.db, ctx.actors.arena, "editorial", "PIX");
    const inv = await markInvoicePaid(ctx.db, r.invoiceId);
    await fulfillPaidInvoice(ctx.db, inv); await fulfillPaidInvoice(ctx.db, inv);
    expect(await ctx.db.select().from(entitlements).where(and(eq(entitlements.storeId, id), eq(entitlements.key, "THEME_EDITORIAL")))).toHaveLength(1);
    await expect(buyTheme(ctx.db, ctx.actors.arena, "editorial", "PIX")).rejects.toMatchObject({ code: "ALREADY_OWNED" });
  });
  it("instalar guarda o rascunho no histórico, não mexe em produtos e pedidos, e restaurar volta ao tema anterior", async () => {
    const id = ctx.actors.arena.storeId!;
    const t = await home(id); const sid = t.order.find((k) => typeof t.sections[k]!.settings.heading === "string" || typeof t.sections[k]!.settings.title === "string")!;
    const key = typeof t.sections[sid]!.settings.heading === "string" ? "heading" : "title";
    await saveTemplateDraft(ctx.db, ctx.actors.arena, id, "home", setSetting(t, sid, key, "MARCADOR-RASCUNHO"));
    const before = { products: (await ctx.db.select().from(storeProducts).where(eq(storeProducts.storeId, id))).length, orders: (await ctx.db.select().from(orders).where(eq(orders.storeId, id))).length };
    const r = await installTheme(ctx.db, ctx.actors.arena, "editorial");
    expect(r.draftsSaved).toBeGreaterThan(0);
    const vers = await listVersions(ctx.db, ctx.actors.arena, id, "home");
    const saved = vers.find((v) => v.kind === "draft" && JSON.stringify(v.snapshot).includes("MARCADOR-RASCUNHO"))!;
    expect(saved.themeKey).toBe("lume");
    expect((await ctx.db.select().from(storeProducts).where(eq(storeProducts.storeId, id))).length).toBe(before.products);
    expect((await ctx.db.select().from(orders).where(eq(orders.storeId, id))).length).toBe(before.orders);
    // Restaurar o rascunho guardado volta ao Lume (a loja tem licença) e põe o conteúdo no rascunho
    const res = await restoreVersion(ctx.db, ctx.actors.arena, id, saved.id);
    expect(res.switchedTo).toBe("lume");
    expect(JSON.stringify(await home(id))).toContain("MARCADOR-RASCUNHO");
    expect((await editingContextFor(ctx.db, await storeOf(id))).themeKey).toBe("lume");
    await publishAllDrafts(ctx.db, ctx.actors.arena, id);
  });
  it("Editorial mantém o vídeo que vendia antes da classificação (concessão explícita)", () => {
    const ed = makeEditingContext({ themeKey: "editorial", themeName: "Editorial", family: "moda", level: 3, grants: THEME_BY_KEY.editorial!.grants, offer: "STORE_SUBDOMAIN" });
    expect(ed.caps.has("hero.video")).toBe(true);
    const arena = makeEditingContext({ themeKey: "arena", themeName: "Arena", family: "sport", level: 3, offer: "STORE_SUBDOMAIN" });
    expect(arena.caps.has("hero.video")).toBe(false);
  });
  it("tema comprado que volta para revisão continua instalável por quem já tem a licença", async () => {
    THEME_BY_KEY.lume!.release = "review";
    try { await installTheme(ctx.db, ctx.actors.arena, "lume"); } finally { THEME_BY_KEY.lume!.release = "released"; }
  });
  it("versão de outra loja não é restaurada", async () => {
    const other = (await ctx.db.select().from(themeTemplateVersions).where(eq(themeTemplateVersions.storeId, ctx.actors.arena.storeId!)))[0]!;
    await expect(restoreVersion(ctx.db, ctx.actors.mantos, ctx.actors.mantos.storeId!, other.id)).rejects.toThrow(/não encontrada/);
  });
});

describe("duas abas e publicação consistente", () => {
  it("segunda aba com revisão antiga recebe conflito; publicar com revisão antiga também", async () => {
    const id = ctx.actors.arena.storeId!;
    const rev = (await draftRevisions(ctx.db, id)).home;
    const t = await home(id); const sid = t.order.find((x) => sectionSchema(t.sections[x]!.type)!.settings.some((d) => d.type === "text"))!;
    const k = sectionSchema(t.sections[sid]!.type)!.settings.find((d) => d.type === "text")!.id;
    await saveTemplateDraft(ctx.db, ctx.actors.arena, id, "home", setSetting(t, sid, k, "ABA A"), { baseRevision: rev });
    await expect(saveTemplateDraft(ctx.db, ctx.actors.arena, id, "home", setSetting(t, sid, k, "ABA B"), { baseRevision: rev })).rejects.toMatchObject({ code: "DRAFT_CONFLICT" });
    expect(JSON.stringify(await home(id))).toContain("ABA A");
    await expect(publishAllDrafts(ctx.db, ctx.actors.arena, id, "Publicação", { expected: { home: rev } })).rejects.toMatchObject({ code: "DRAFT_CONFLICT" });
    const fresh = await draftRevisions(ctx.db, id);
    expect((await publishAllDrafts(ctx.db, ctx.actors.arena, id, "Publicação", { expected: fresh })).pages).toBeGreaterThan(0);
  });
});

describe("migração do catálogo", () => {
  it("rodar de novo não duplica temas nem mexe em licenças, e espelha família, nível e liberação", async () => {
    const ents = (await ctx.db.select().from(entitlements)).length; const invs = (await ctx.db.select().from(financeInvoices)).length;
    expect(await syncThemeCatalog(ctx.db)).toEqual([]);
    expect((await ctx.db.select().from(entitlements)).length).toBe(ents); expect((await ctx.db.select().from(financeInvoices)).length).toBe(invs);
    const rows = await ctx.db.select().from(themes);
    expect(new Set(rows.map((r) => r.key)).size).toBe(rows.length);
    expect(rows.find((r) => r.key === "arena")).toMatchObject({ family: "sport", level: 3, release: "released", available: true });
    expect(rows.find((r) => r.key === "ninho")).toMatchObject({ release: "review", available: false });
  });
});
