import { describe, expect, it } from "vitest";
import { THEME_CATALOG } from "@/lib/themes/catalog";
import { FAMILY_DEMOS } from "@/lib/themes/families";
import { buildPreset, type PresetContext } from "@/lib/themes/presets";

const ctx = (media: PresetContext["media"]): PresetContext => ({ storeName: "Loja", tagline: null, primary: "#000000", accent: "#ffffff", announcement: "", footerText: "", now: new Date("2026-10-01T12:00:00Z"), media });

describe("famílias de temas: manifesto de imagens × temas", () => {
  for (const [family, demo] of Object.entries(FAMILY_DEMOS)) {
    it(`${family}: toda imagem pedida por um tema está no manifesto, com o nível certo`, () => {
      const ids = new Set(demo!.assets.map((a) => a.id));
      for (const t of THEME_CATALOG.filter((x) => x.family === family && x.key !== "arena")) {
        const asked = new Set<string>();
        const media = new Proxy({}, { get: (_o, k) => { if (typeof k === "string") asked.add(k); return undefined; } }) as PresetContext["media"];
        expect(buildPreset(t.key, ctx(media)), t.key).not.toBeNull();
        for (const id of asked) {
          expect(ids.has(id), `${t.key} pede ${id}`).toBe(true);
          expect(demo!.assets.find((a) => a.id === id)!.levels, `${id} no nível ${t.level}`).toContain(t.level);
        }
      }
    });
    it(`${family}: catálogo de demonstração com 12+ produtos, 4 categorias, variações e um esgotado, sem promessa`, () => {
      const ps = demo!.products;
      expect(ps.length).toBeGreaterThanOrEqual(12);
      expect(new Set(ps.map((p) => p.category)).size).toBe(4);
      expect(ps.filter((p) => p.soldOut)).toHaveLength(1);
      expect(ps.some((p) => p.variants.length > 1)).toBe(true);
      expect(new Set(ps.map((p) => p.sku)).size).toBe(ps.length);
      for (const p of ps) for (const v of p.variants) expect(v.length, `${p.sku} ${v}`).toBeLessThanOrEqual(6);
      const text = JSON.stringify(ps).toLowerCase();
      for (const banned of ["frete grátis", "entrega em 24", "garantia vitalícia", "mais vendido do brasil", "flamengo", "corinthians", "palmeiras", "nike", "adidas"]) expect(text).not.toContain(banned);
    });
  }
});
