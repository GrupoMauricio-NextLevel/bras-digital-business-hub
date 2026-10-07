import { beforeAll, describe, expect, it } from "vitest";
import { entitlements } from "@/db/schema";
import { newId } from "@/lib/ids";
import { syncThemeCatalog } from "@/lib/themes/catalog";
import { installTheme } from "@/lib/themes/install";
import { deleteSavedTemplate, listSavedTemplates, savePageTemplate, saveSectionTemplate } from "@/lib/themes/saved-templates";
import { resolveTemplate, saveTemplateDraft } from "@/lib/themes/store";
import { freshDb } from "./setup";

let ctx: Awaited<ReturnType<typeof freshDb>>;
const A = () => ctx.actors.arena; const id = () => ctx.actors.arena.storeId!;
const home = async () => (await resolveTemplate(ctx.db, (await ctx.db.query.stores.findFirst({ where: (s, { eq }) => eq(s.id, id()) }))!, "home", { draft: true })).template;
const license = async (key: string) => { await ctx.db.insert(entitlements).values({ id: newId("ent"), tenantType: "STORE", storeId: id(), key: `THEME_${key.toUpperCase()}`, source: "COURTESY" }); await installTheme(ctx.db, A(), key); };
beforeAll(async () => { ctx = await freshDb(); await syncThemeCatalog(ctx.db); }, 120_000);

describe("modelos salvos por nível", () => {
  it("N2 não salva modelo de seção; N3 salva e reaproveita; N3 não salva página", async () => {
    await license("lume");
    const s = (await home()).sections; const any = Object.values(s).find((x) => x.type === "product-showcase")!;
    await expect(saveSectionTemplate(ctx.db, A(), id(), { name: "Vitrine", section: any })).rejects.toMatchObject({ code: "THEME_LOCKED" });
    await license("arena");
    const t = await home(); const sec = Object.values(t.sections).find((x) => x.type === "product-showcase")!;
    const r = await saveSectionTemplate(ctx.db, A(), id(), { name: "Vitrine da semana", section: sec });
    expect(r.id).toMatch(/^tst_/);
    const saved = (await listSavedTemplates(ctx.db, A(), id())).find((x) => x.id === r.id)!;
    // Inserir o modelo é uma edição como outra qualquer (passa pela política ao salvar)
    const next = { ...t, sections: { ...t.sections, "vitrine-2": structuredClone(saved.data) as never }, order: [...t.order, "vitrine-2"] };
    await saveTemplateDraft(ctx.db, A(), id(), "home", next);
    await expect(savePageTemplate(ctx.db, A(), id(), { name: "Black Friday", page: "home", template: next })).rejects.toMatchObject({ code: "THEME_LOCKED" });
  });
  it("N4 salva modelo de página; outra loja não vê nem apaga", async () => {
    await license("signature");
    const r = await savePageTemplate(ctx.db, A(), id(), { name: "Black Friday", page: "home", template: await home() });
    expect((await listSavedTemplates(ctx.db, A(), id())).some((x) => x.id === r.id && x.kind === "page")).toBe(true);
    expect(await listSavedTemplates(ctx.db, ctx.actors.mantos, ctx.actors.mantos.storeId!)).toEqual([]);
    await expect(deleteSavedTemplate(ctx.db, ctx.actors.mantos, ctx.actors.mantos.storeId!, r.id)).rejects.toThrow(/não encontrado/);
    await expect(listSavedTemplates(ctx.db, ctx.actors.mantos, id())).rejects.toThrow();
  });
});
