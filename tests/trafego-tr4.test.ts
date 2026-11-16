import { beforeEach, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { configNavegador, getTagsAnuncio, salvarTagsAnuncio } from "@/lib/domain/trafego/tags";

/** TR4 (D295): números do Pixel da Meta e do Google no site da NextLevel, validados; só a equipe certa muda. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

describe("tags de anúncio", () => {
  it("começa desligado; grava números válidos; monta o send_to do Google", async () => {
    expect(configNavegador(await getTagsAnuncio(ctx.db))).toBeNull();
    await salvarTagsAnuncio(ctx.db, ctx.actors.master, { metaPixelId: " 123456789012345 ", googleAdsId: "AW-1234567890", googleAdsLeadLabel: "AbC-dEfGhIj", ga4Id: "" });
    const t = await getTagsAnuncio(ctx.db);
    expect(t).toEqual({ metaPixelId: "123456789012345", googleAdsId: "AW-1234567890", googleAdsLeadLabel: "AbC-dEfGhIj", ga4Id: null });
    expect(configNavegador(t)).toEqual({ meta: "123456789012345", googleAds: "AW-1234567890", leadSendTo: "AW-1234567890/AbC-dEfGhIj", ga4: null });
    expect(configNavegador({ ...t, googleAdsLeadLabel: null })!.leadSendTo).toBeNull();
  });
  it("recusa formato errado (inclusive tentativa de colar código) com explicação", async () => {
    await expect(salvarTagsAnuncio(ctx.db, ctx.actors.master, { metaPixelId: "abc" })).rejects.toThrow(/só algarismos/);
    await expect(salvarTagsAnuncio(ctx.db, ctx.actors.master, { googleAdsId: "1234567890" })).rejects.toThrow(/AW-/);
    await expect(salvarTagsAnuncio(ctx.db, ctx.actors.master, { googleAdsLeadLabel: "x'><script>" })).rejects.toThrow(/rótulo/);
    await expect(salvarTagsAnuncio(ctx.db, ctx.actors.master, { ga4Id: "UA-123" })).rejects.toThrow(/G-/);
    expect(configNavegador(await getTagsAnuncio(ctx.db))).toBeNull();
  });
  it("só o dono e o Comercial mudam", async () => {
    await expect(salvarTagsAnuncio(ctx.db, ctx.actors.mantos, { metaPixelId: "123456789012345" })).rejects.toThrow(/NextLevel/);
    await expect(salvarTagsAnuncio(ctx.db, { ...ctx.actors.master, masterFunction: "CONTEUDO" }, { metaPixelId: "123456789012345" })).rejects.toThrow(/função/);
    await expect(salvarTagsAnuncio(ctx.db, { ...ctx.actors.master, masterFunction: "COMERCIAL" }, { metaPixelId: "123456789012345" })).resolves.toMatchObject({ metaPixelId: "123456789012345" });
  });
});
