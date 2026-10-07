import { beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { storeAssets, themeTemplates } from "@/db/schema";
import { decodeImage, listStoreMedia, MAX_SIDE, removeStoreAsset, saveStoreAsset } from "@/lib/domain/assets";
import { campaignInstant, isBlockLive, liveBlocks, scheduleIssues } from "@/lib/themes/banners";
import { syncThemeCatalog } from "@/lib/themes/catalog";
import { resolveTemplate, saveTemplateDraft } from "@/lib/themes/store";
import { addSection, setBlockSetting } from "@/lib/themes/template";
import { SectionList } from "@/components/storefront/sections";
import { freshDb } from "./setup";

let ctx: Awaited<ReturnType<typeof freshDb>>;
const png = async (w: number, h: number) => `data:image/png;base64,${(await sharp({ create: { width: w, height: h, channels: 3, background: "#446688" } }).png().toBuffer()).toString("base64")}`;
beforeAll(async () => { ctx = await freshDb(); await syncThemeCatalog(ctx.db); }, 120_000);

describe("agendamento de banners (horário de Brasília)", () => {
  const b = (id: string, s: Record<string, string>) => ({ id, settings: s });
  it("interpreta a data no fuso de Brasília (UTC−3)", () => {
    expect(campaignInstant("2026-11-20T09:00")!.toISOString()).toBe("2026-11-20T12:00:00.000Z");
    expect(campaignInstant("")).toBeNull(); expect(campaignInstant("20/11/2026")).toBeNull();
  });
  it("entra no início, sai no fim e volta para a reserva", () => {
    const blocks = [b("padrao", {}), b("black", { startsAt: "2026-11-27T00:00", endsAt: "2026-11-30T23:59" })];
    const at = (iso: string) => liveBlocks(blocks, { now: new Date(iso), page: "home" }).map((x) => x.id);
    expect(at("2026-11-26T23:00:00-03:00")).toEqual(["padrao"]);
    expect(at("2026-11-27T00:00:00-03:00")).toEqual(["padrao", "black"]);
    expect(at("2026-11-30T23:59:00-03:00")).toEqual(["padrao"]);
  });
  it("posição de imagem única: sem nada no ar, mostra a reserva; sem reserva, some", () => {
    const only = [b("x", { startsAt: "2026-01-01T00:00", endsAt: "2026-01-02T00:00" })];
    expect(liveBlocks(only, { now: new Date("2026-03-01T12:00:00Z"), page: "home" })).toEqual([]);
    expect(scheduleIssues([b("y", { startsAt: "2026-02-02T00:00", endsAt: "2026-02-01T00:00" })], new Date("2026-01-01T00:00:00Z"))[0]).toMatch(/termina antes/);
    expect(scheduleIssues([b("a", { startsAt: "2026-02-01T00:00", endsAt: "2026-02-10T00:00" }), b("c", { startsAt: "2026-02-05T00:00" })], new Date("2026-01-01T00:00:00Z"), true).join(" ")).toMatch(/ao mesmo tempo/);
  });
  it("condição por categoria: só na coleção daquela categoria", () => {
    const x = b("cat", { onlyCategory: "c1" });
    expect(isBlockLive(x, { now: new Date(), page: "collection", categoryId: "c1" })).toBe(true);
    expect(isBlockLive(x, { now: new Date(), page: "collection", categoryId: "c2" })).toBe(false);
    expect(isBlockLive(x, { now: new Date(), page: "home" })).toBe(false);
  });
  it("na loja: banner vencido não é desenhado; imagem com foco, versão de celular e descrição", () => {
    const a = addSection({ v: 1, sections: {}, order: [] }, "hero-banner", { region: "content", page: "home" });
    let t = a.template; const bid = t.sections[a.id]!.blockOrder[0]!;
    for (const [k, v] of Object.entries({ image: "/assets/ast_abc", imageMobile: "/assets/ast_mob", focusX: 20, focusMobileX: 80, alt: "Vitrine da coleção", title: "Coleção" })) t = setBlockSetting(t, a.id, bid, k, v);
    const html = (now: Date) => renderToStaticMarkup(SectionList({ template: t, ctx: { slug: "x", base: "/store/x", store: {} as never, categories: [], products: [], planned: {}, hero: undefined, globals: {} as never, page: "home", now } }));
    const h = html(new Date());
    expect(h).toContain('media="(max-width: 767px)"'); expect(h).toContain("/assets/ast_mob"); expect(h).toContain("--fx:20%"); expect(h).toContain("--mx:80%");
    expect(h).toContain('alt="Vitrine da coleção"'); expect(h).toContain('fetchPriority="high"'); expect(h).toContain("?w=1920 1920w");
    t = setBlockSetting(t, a.id, bid, "endsAt", "2020-01-01T00:00");
    expect(html(new Date())).not.toContain("data-banner-slide");
  });
});

describe("biblioteca de mídia", () => {
  const S = () => ctx.seed.stores.mantos.id;
  it("decodifica de verdade: vazio, corrompido e grande demais são recusados", async () => {
    await expect(decodeImage(Buffer.alloc(0))).rejects.toMatchObject({ code: "BAD_IMAGE" });
    const bad = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 7)]);
    await expect(decodeImage(bad)).rejects.toMatchObject({ code: "BAD_IMAGE" });
    const real = await sharp({ create: { width: 64, height: 32, channels: 3, background: "#000" } }).jpeg().toBuffer();
    const truncated = real.subarray(0, Math.floor(real.length / 2));
    await expect(decodeImage(truncated)).rejects.toMatchObject({ code: "BAD_IMAGE" });
    await expect(decodeImage(await sharp({ create: { width: MAX_SIDE + 1, height: 10, channels: 3, background: "#000" } }).png().toBuffer())).rejects.toMatchObject({ code: "IMAGE_TOO_LARGE" });
    expect(await decodeImage(real)).toMatchObject({ mime: "image/jpeg", width: 64, height: 32 });
  });
  it("guarda dimensões, lista usos e não remove imagem em uso; só histórico arquiva; sem uso apaga", async () => {
    const used = await saveStoreAsset(ctx.db, ctx.actors.mantos, S(), await png(40, 20), { name: "capa" });
    const unused = await saveStoreAsset(ctx.db, ctx.actors.mantos, S(), await png(10, 10));
    const row = (await ctx.db.select().from(storeAssets).where(eq(storeAssets.id, used.split("/").pop()!)))[0]!;
    expect(row).toMatchObject({ width: 40, height: 20, name: "capa" });
    const store = (await ctx.db.query.stores.findFirst({ where: (s, { eq: e }) => e(s.id, S()) }))!;
    const cur = (await resolveTemplate(ctx.db, store, "home", { draft: true })).template;
    const a = addSection(cur, "banner-strip", { region: "content", page: "home" });
    await saveTemplateDraft(ctx.db, ctx.actors.mantos, S(), "home", setBlockSetting(a.template, a.id, a.template.sections[a.id]!.blockOrder[0]!, "image", used));
    const media = await listStoreMedia(ctx.db, ctx.actors.mantos, S());
    expect(media.find((m) => m.url === used)!.uses.map((u) => u.where)).toContain("rascunho");
    await expect(removeStoreAsset(ctx.db, ctx.actors.mantos, S(), used.split("/").pop()!)).rejects.toMatchObject({ code: "ASSET_IN_USE" });
    expect(await removeStoreAsset(ctx.db, ctx.actors.mantos, S(), unused.split("/").pop()!)).toEqual({ result: "deleted" });
    // Tira do rascunho, mas uma versão restaurável ainda usa: arquiva (continua servida)
    const { saveSnapshot } = await import("@/lib/themes/store");
    await saveSnapshot(ctx.db, S(), "home", { v: 1, sections: { x: { type: "banner-strip", settings: {}, blocks: { b: { type: "banner", settings: { image: used } } }, blockOrder: ["b"] } }, order: ["x"] }, "teste", "u");
    await ctx.db.update(themeTemplates).set({ draft: null }).where(and(eq(themeTemplates.storeId, S()), eq(themeTemplates.page, "home")));
    expect(await removeStoreAsset(ctx.db, ctx.actors.mantos, S(), used.split("/").pop()!)).toEqual({ result: "archived" });
    expect((await listStoreMedia(ctx.db, ctx.actors.mantos, S())).some((m) => m.url === used)).toBe(false);
  });
  it("uma loja não usa nem remove imagem da biblioteca de outra", async () => {
    const mine = await saveStoreAsset(ctx.db, ctx.actors.mantos, S(), await png(8, 8));
    const arena = ctx.seed.stores.arena.id;
    const store = (await ctx.db.query.stores.findFirst({ where: (s, { eq: e }) => e(s.id, arena) }))!;
    const cur = (await resolveTemplate(ctx.db, store, "home", { draft: true })).template;
    const a = addSection(cur, "banner-strip", { region: "content", page: "home" });
    await expect(saveTemplateDraft(ctx.db, ctx.actors.arena, arena, "home", setBlockSetting(a.template, a.id, a.template.sections[a.id]!.blockOrder[0]!, "image", mine))).rejects.toMatchObject({ code: "THEME_INVALID", message: expect.stringMatching(/biblioteca da sua loja/) });
    await expect(removeStoreAsset(ctx.db, ctx.actors.arena, arena, mine.split("/").pop()!)).rejects.toThrow(/não encontrada/);
  });
});
