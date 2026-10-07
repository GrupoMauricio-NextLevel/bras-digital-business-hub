import { describe, expect, it } from "vitest";
import { THEME_CATALOG } from "@/lib/themes/catalog";
import { FAMILY_DEMOS } from "@/lib/themes/families";
import { buildPreset, type PresetContext } from "@/lib/themes/presets";
import { packageOf, slotImage } from "@/lib/themes/pacotes";
import { existsSync } from "node:fs";
import { join } from "node:path";

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
    it(`${family}: catálogo da demonstração = catálogo do pacote visual (SKUs, nomes, preços), sem promessa`, () => {
      const ps = demo!.products; const pkg = packageOf(family as never)!;
      expect(ps.map((p) => [p.sku, p.name, p.price, p.category])).toEqual(pkg.products.map((p) => [p.sku, p.name, p.priceCents, p.category]));
      expect(ps.length).toBeGreaterThanOrEqual(12);
      expect(new Set(ps.map((p) => p.category)).size).toBe(4);
      // Esgotado só quando o pacote diz (estoque 0); nada é inventado.
      expect(ps.filter((p) => p.soldOut).map((p) => p.sku)).toEqual(pkg.products.filter((p) => p.inventoryDemo <= 0).map((p) => p.sku));
      expect(new Set(ps.map((p) => p.sku)).size).toBe(ps.length);
      for (const p of ps) for (const v of p.variants) expect(v.length, `${p.sku} ${v}`).toBeLessThanOrEqual(6);
      const text = JSON.stringify(ps).toLowerCase();
      for (const banned of ["frete grátis", "entrega em 24", "garantia vitalícia", "mais vendido do brasil", "flamengo", "corinthians", "palmeiras", "nike", "adidas"]) expect(text).not.toContain(banned);
    });
    it(`${family}: só fotos prontas (GENERATED) e que existem em public/, na ordem do pacote`, () => {
      const pkg = packageOf(family as never)!;
      for (const p of demo!.products) {
        const src = pkg.products.find((x) => x.sku === p.sku)!;
        expect(p.photos, p.sku).toEqual(src.images.map((id) => pkg.assets[id]!.src));
        for (const ph of p.photos) { expect(ph).toMatch(new RegExp(`^/demos/${pkg.slug}/v1/`)); expect(existsSync(join(process.cwd(), "public", ph)), ph).toBe(true); }
      }
      for (const a of Object.values(pkg.assets)) { expect(existsSync(join(process.cwd(), "public", a.src)), a.src).toBe(true); if (a.avif) expect(existsSync(join(process.cwd(), "public", a.avif)), a.avif).toBe(true); }
      // Cada posição de imagem do tema: ou uma imagem real do pacote, ou pendente (nunca um caminho inventado).
      for (const a of demo!.assets) { const r = slotImage(family as never, a.id); if (r) { expect(Object.values(pkg.assets).some((x) => x.src === r.image), a.id).toBe(true); } }
    });
  }
});
