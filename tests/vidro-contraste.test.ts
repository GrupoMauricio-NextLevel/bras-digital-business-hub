import { describe, expect, it } from "vitest";
import { THEME_KEYS, themeColors, type ThemeMode } from "@/design-system/themes";
import { contrastRatio } from "@/lib/brand-palette";

/**
 * Vidro legível no pior fundo (D155): o texto da navegação (tinta e texto secundário) sobre o vidro translúcido tem de passar
 * AA (4,5:1) mesmo com o fundo mais desfavorável atrás (preto ou branco puro), e o preenchimento sólido (sem desfoque) também.
 */
const parse = (rgba: string) => {
  const m = rgba.match(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/);
  if (!m) throw new Error(`cor inesperada: ${rgba}`);
  return { r: +m[1]!, g: +m[2]!, b: +m[3]!, a: +m[4]! };
};
const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
/** Mistura o vidro sobre um fundo opaco (#000000 ou #FFFFFF) e devolve a cor resultante em hex. */
const sobre = (rgba: string, fundo: 0 | 255) => {
  const c = parse(rgba);
  const mix = (v: number) => v * c.a + fundo * (1 - c.a);
  return `#${hex(mix(c.r))}${hex(mix(c.g))}${hex(mix(c.b))}`;
};

describe("vidro: contraste no pior fundo", () => {
  for (const key of THEME_KEYS) {
    for (const mode of ["light", "dark"] as ThemeMode[]) {
      it(`${key} ${mode}`, () => {
        const t = themeColors(key, mode);
        for (const camada of [t.glass, t.glassSolid]) {
          for (const fundo of [0, 255] as const) {
            const bg = sobre(camada, fundo);
            expect(contrastRatio(t.ink, bg), `tinta sobre ${camada} com fundo ${fundo}`).toBeGreaterThanOrEqual(4.5);
            expect(contrastRatio(t.text, bg), `texto sobre ${camada} com fundo ${fundo}`).toBeGreaterThanOrEqual(4.5);
          }
        }
        // O vidro sem desfoque é praticamente opaco; o translúcido deixa passar no máximo 30% do que está atrás.
        expect(parse(t.glassSolid).a).toBeGreaterThanOrEqual(0.95);
        expect(parse(t.glass).a).toBeGreaterThanOrEqual(0.7);
      });
    }
  }
});
