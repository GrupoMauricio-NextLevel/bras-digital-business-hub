import { describe, expect, it } from "vitest";
import { buildPreset } from "@/lib/themes/presets";
import { pontosDeBanner } from "@/lib/themes/pontos-banner";
import { addBlock } from "@/lib/themes/template";

/** Área de banners (D238): lê os pontos do mesmo modelo do editor, com limite e agenda pelo nível do tema. */
describe("pontos de banner", () => {
  const p = buildPreset("trama", { storeName: "Loja", tagline: null, primary: "#111111", accent: "#222222", announcement: "", footerText: "", now: new Date("2026-11-04T12:00:00Z") })!;
  it("tema grátis: destaque com 3 de 3, dupla, cartões, mosaico, faixa e banner de categoria; agenda bloqueada", () => {
    const pts = pontosDeBanner({ home: p.pages.home, collection: p.pages.collection }, 1);
    expect(pts.map((x) => x.tipo)).toEqual(["hero-banner", "banner-duo", "nav-cards", "banner-mosaic", "banner-strip", "category-banner"]);
    const hero = pts[0]!;
    expect([hero.itens.length, hero.maximo, hero.agenda, hero.agendaNivel]).toEqual([3, 3, false, 3]);
    expect(hero.campos).toEqual(expect.arrayContaining(["title", "subtitle", "ctaLabel", "link"]));
  });
  it("no nível 3 a agenda libera e o destaque aceita até 6", () => {
    const pts = pontosDeBanner({ home: p.pages.home }, 3);
    expect(pts[0]).toMatchObject({ maximo: 6, agenda: true });
    const id = pts[0]!.sectionId;
    expect(pontosDeBanner({ home: addBlock(p.pages.home, id, "slide").template }, 3)[0]!.itens).toHaveLength(4);
  });
});
