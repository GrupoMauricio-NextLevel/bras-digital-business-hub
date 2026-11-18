import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { buildPreset, type PresetContext } from "@/lib/themes/presets";
import { normalizeTemplate } from "@/lib/themes/template";
import { THEME_BY_KEY } from "@/lib/themes/catalog";
import { filtrarPorPreco } from "@/lib/filtro-preco";

const ctx = (extra: Partial<PresetContext> = {}): PresetContext => ({ storeName: "Vestiário das Lendas", tagline: null, primary: "#000000", accent: "#ffffff", announcement: "", footerText: "", now: new Date("2026-11-18T12:00:00Z"), ...extra });

describe("Manto Premium (D348)", () => {
  it("exclusivo da equipe: fora da galeria e da venda, nível 4, família esportiva", () => {
    expect(THEME_BY_KEY.manto).toMatchObject({ release: "draft", level: 4, family: "sport" });
  });
  it("página inicial: preto e dourado, 10 cartões de categoria e 3 faixas de preço, imagens que existem em public/", () => {
    const p = buildPreset("manto", ctx())!;
    expect(p.style).toMatchObject({ primary: "#0b0b0b", accent: "#d4af4a" });
    const home = p.pages.home; const tiles = home.order.map((id) => home.sections[id]!).filter((s) => s.type === "image-tiles");
    expect(tiles.map((s) => s.blockOrder.length)).toEqual([10, 3]);
    for (const s of tiles) for (const b of s.blockOrder) {
      const st = s.blocks[b]!.settings; expect(String(st.alt).length).toBeGreaterThan(3);
      expect(existsSync(join(process.cwd(), "public", String(st.image))), String(st.image)).toBe(true);
    }
    expect(String(tiles[0]!.blocks[tiles[0]!.blockOrder[2]!]!.settings.link)).toBe("/catalog?category=retro");
    expect(String(tiles[1]!.blocks[tiles[1]!.blockOrder[0]!]!.settings.link)).toContain("ate=60");
    // O modelo é válido para o motor de temas (nada é descartado ao instalar).
    for (const page of ["home", "product", "collection", "cart"] as const) expect(normalizeTemplate(p.pages[page], "content", page).template.order.length).toBe(p.pages[page].order.length);
  });
  it("mantém os banners que a loja já tinha no destaque (imagem do computador e do celular)", () => {
    const p = buildPreset("manto", ctx({ heroSlides: [{ image: "/assets/ast_a", imageMobile: "/assets/ast_b", title: "Camisas do Brasil" }] }))!;
    const hero = Object.values(p.pages.home.sections).find((s) => s.type === "hero-banner")!;
    expect(hero.blockOrder).toHaveLength(1);
    expect(hero.blocks[hero.blockOrder[0]!]!.settings).toMatchObject({ image: "/assets/ast_a", imageMobile: "/assets/ast_b", title: "Camisas do Brasil" });
  });
});

describe("faixa de preço no catálogo (D348)", () => {
  const ps = [{ priceCents: 5990 }, { priceCents: 7990 }, { priceCents: 12990 }];
  it("até e acima, em reais no endereço; valor inválido é ignorado", () => {
    expect(filtrarPorPreco(ps, { ate: "60" })).toEqual([{ priceCents: 5990 }]);
    expect(filtrarPorPreco(ps, { ate: "80" })).toHaveLength(2);
    expect(filtrarPorPreco(ps, { acima: "100" })).toEqual([{ priceCents: 12990 }]);
    expect(filtrarPorPreco(ps, { ate: "abc" })).toHaveLength(3);
    expect(filtrarPorPreco(ps, undefined)).toHaveLength(3);
  });
});
