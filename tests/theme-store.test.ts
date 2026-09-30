import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { runMigrations } from "@/db/migrate";
import { stores, themeSettings } from "@/db/schema";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { discardDraft, listVersions, publishGlobals, publishTemplate, resolveGlobals, resolveTemplate, restoreVersion, saveGlobalsDraft, saveTemplateDraft } from "@/lib/themes/store";
import { addSection, moveSection, setSetting, templateFromLegacy } from "@/lib/themes/template";
import { freshDb } from "./setup";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => { ctx = await freshDb(); });
const store = async (id: string) => (await ctx.db.query.stores.findFirst({ where: eq(stores.id, id) }))!;

describe("motor de temas: leitura", () => {
  it("sem modelo salvo, a loja usa o tema atual convertido (nada muda)", async () => {
    const s = await store(ctx.seed.stores.mantos.id);
    const legacy = (await ctx.db.query.themeSettings.findFirst({ where: eq(themeSettings.storeId, s.id) }))!.settings;
    const r = await resolveTemplate(ctx.db, s, "home");
    expect(r.source).toBe("default"); expect(r.template).toEqual(templateFromLegacy(legacy));
    const g = await resolveGlobals(ctx.db, s);
    expect(g.source).toBe("default"); expect(g.globals.style.primary).toBe(s.primaryColor); expect(g.globals.header.order).toEqual(["announcement", "header"]);
  });
  it("a migração pode rodar de novo sem efeito", async () => { await runMigrations(ctx.db); await runMigrations(ctx.db); });
  it("páginas sem seções ficam vazias nesta fase", async () => { expect((await resolveTemplate(ctx.db, await store(ctx.seed.stores.mantos.id), "cart")).template.order).toEqual([]); });
});

describe("rascunho, publicação e histórico (Loja própria)", () => {
  const A = () => ctx.actors.mantos; const id = () => ctx.seed.stores.mantos.id;
  it("rascunho só aparece na prévia; publicar troca o que o público vê", async () => {
    const s = await store(id()); const base = (await resolveTemplate(ctx.db, s, "home")).template;
    const edited = setSetting(base, "hero", "title", "Coleção nova 25/26");
    await saveTemplateDraft(ctx.db, A(), id(), "home", edited);
    expect((await resolveTemplate(ctx.db, s, "home")).template.sections.hero!.settings.title).not.toBe("Coleção nova 25/26");
    const preview = await resolveTemplate(ctx.db, s, "home", { draft: true }); expect(preview.source).toBe("draft"); expect(preview.template.sections.hero!.settings.title).toBe("Coleção nova 25/26");
    expect((await publishTemplate(ctx.db, A(), id(), "home")).published).toBe(true);
    const live = await resolveTemplate(ctx.db, s, "home"); expect(live.source).toBe("published"); expect(live.template.sections.hero!.settings.title).toBe("Coleção nova 25/26"); expect(live.hasDraft).toBe(false);
    expect((await publishTemplate(ctx.db, A(), id(), "home")).published).toBe(false);
  });
  it("Loja própria pode mudar a estrutura (adicionar e reordenar seções)", async () => {
    const s = await store(id()); const cur = (await resolveTemplate(ctx.db, s, "home")).template;
    const { template } = addSection(cur, "rich-text", { region: "content", page: "home", index: 1 });
    const moved = moveSection(template, "grid", 0);
    const r = await saveTemplateDraft(ctx.db, A(), id(), "home", moved);
    expect(r.template.order[0]).toBe("grid"); expect(r.template.order).toContain("rich-text");
  });
  it("o histórico guarda as publicações e uma versão antiga volta para o rascunho", async () => {
    const s = await store(id());
    for (const t of ["Um", "Dois"]) { const cur = (await resolveTemplate(ctx.db, s, "home", { draft: true })).template; await saveTemplateDraft(ctx.db, A(), id(), "home", setSetting(cur, "hero", "title", t)); await publishTemplate(ctx.db, A(), id(), "home", `Título ${t}`); }
    const versions = await listVersions(ctx.db, A(), id(), "home"); expect(versions.length).toBeGreaterThanOrEqual(3);
    const old = versions.find((v) => v.label === "Título Um")!; await restoreVersion(ctx.db, A(), id(), old.id);
    const draft = await resolveTemplate(ctx.db, s, "home", { draft: true }); expect(draft.source).toBe("draft"); expect(draft.template.sections.hero!.settings.title).toBe("Um");
    expect((await resolveTemplate(ctx.db, s, "home")).template.sections.hero!.settings.title).toBe("Dois");
    await discardDraft(ctx.db, A(), id(), "home"); expect((await resolveTemplate(ctx.db, s, "home", { draft: true })).source).toBe("published");
  });
  it("guarda só as últimas 20 versões", async () => {
    const s = await store(id());
    for (let i = 0; i < 24; i++) { const cur = (await resolveTemplate(ctx.db, s, "home", { draft: true })).template; await saveTemplateDraft(ctx.db, A(), id(), "home", setSetting(cur, "hero", "subtitle", `v${i}`)); await publishTemplate(ctx.db, A(), id(), "home"); }
    expect((await listVersions(ctx.db, A(), id(), "home")).length).toBe(20);
  });
  it("estilo global: publicar atualiza as cores da loja", async () => {
    const s = await store(id()); const g = (await resolveGlobals(ctx.db, s)).globals;
    await saveGlobalsDraft(ctx.db, A(), id(), { ...g, style: { ...g.style, primary: "#7c2d12", accent: "#ca8a04", radius: 8 } });
    await publishGlobals(ctx.db, A(), id());
    const after = await store(id()); expect(after.primaryColor).toBe("#7c2d12"); expect(after.accentColor).toBe("#ca8a04");
    expect((await resolveGlobals(ctx.db, after)).globals.style.radius).toBe(8);
  });
});

describe("regras por oferta e por dono", () => {
  const A = () => ctx.actors.arena; const id = () => ctx.seed.stores.arena.id;
  it("Loja SuperDrop edita textos e cores, mas não a estrutura nem a tipografia", async () => {
    const s = await store(id()); const cur = (await resolveTemplate(ctx.db, s, "home")).template;
    await saveTemplateDraft(ctx.db, A(), id(), "home", setSetting(cur, "hero", "title", "Arena 10 oficial"));
    await expect(saveTemplateDraft(ctx.db, A(), id(), "home", addSection(cur, "rich-text", { region: "content", page: "home" }).template)).rejects.toMatchObject({ code: "FEATURE_LOCKED" });
    await expect(saveTemplateDraft(ctx.db, A(), id(), "home", moveSection(cur, "grid", 0))).rejects.toBeInstanceOf(DomainError);
    const g = (await resolveGlobals(ctx.db, s)).globals;
    await saveGlobalsDraft(ctx.db, A(), id(), { ...g, style: { ...g.style, primary: "#1d4ed8" } });
    await expect(saveGlobalsDraft(ctx.db, A(), id(), { ...g, style: { ...g.style, headingFont: "elegante" } })).rejects.toMatchObject({ code: "FEATURE_LOCKED" });
  });
  it("outra loja não edita o tema alheio; o Master pode", async () => {
    const mantos = ctx.seed.stores.mantos.id; const cur = (await resolveTemplate(ctx.db, await store(mantos), "home")).template;
    await expect(saveTemplateDraft(ctx.db, ctx.actors.arena, mantos, "home", cur)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(publishTemplate(ctx.db, ctx.actors.arena, mantos, "home")).rejects.toBeInstanceOf(ForbiddenError);
    await saveTemplateDraft(ctx.db, ctx.actors.master, mantos, "home", cur);
  });
  it("o fornecedor não edita tema de loja", async () => {
    const cur = (await resolveTemplate(ctx.db, await store(id()), "home")).template;
    await expect(saveTemplateDraft(ctx.db, ctx.actors.supplier, id(), "home", cur)).rejects.toBeInstanceOf(ForbiddenError);
  });
  it("conteúdo malicioso é corrigido, nunca gravado", async () => {
    const cur = (await resolveTemplate(ctx.db, await store(id()), "home", { draft: true })).template;
    const evil = structuredClone(cur); evil.sections.hero!.settings.ctaLink = "javascript:alert(1)"; evil.sections.hero!.settings.title = "x".repeat(5000);
    const r = await saveTemplateDraft(ctx.db, A(), id(), "home", evil);
    expect(r.template.sections.hero!.settings.ctaLink).toBe("/catalog"); expect(String(r.template.sections.hero!.settings.title).length).toBeLessThanOrEqual(120);
  });
});
