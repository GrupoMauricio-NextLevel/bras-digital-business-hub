import { describe, expect, it } from "vitest";
import { PALETTES, brandCssVars, contrastRatio, onSignal, paletteOf, type PaletteCode } from "@/lib/brand-palette";
import { BRAND_CODES, brandsFrom } from "@/lib/brand";

const codes = Object.keys(PALETTES) as PaletteCode[];

describe("paleta das marcas (direção visual v4)", () => {
  it("toda marca do portfólio tem paleta e as cores do portal vêm dela", () => {
    expect(codes.sort()).toEqual([...BRAND_CODES].sort());
    const all = brandsFrom({});
    for (const c of BRAND_CODES) {
      expect(all[c].primaryColor).toBe(PALETTES[c].light.ink);
      expect(all[c].accentColor).toBe(PALETTES[c].light.signal);
    }
  });
  it.each(codes)("%s: leitura AA nos dois modos (texto, link e botão de sinal)", (code) => {
    for (const mode of ["light", "dark"] as const) {
      const m = PALETTES[code][mode];
      expect(contrastRatio(m.ink, m.paper), `${code} ${mode} tinta/papel`).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(m.signalText, m.paper), `${code} ${mode} sinal como texto`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(onSignal(m.signal), m.signal), `${code} ${mode} texto sobre o botão de sinal`).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("gera as variáveis CSS da marca para claro e escuro e cai na holding se o código for desconhecido", () => {
    const css = brandCssVars("SUPERDROP");
    expect(css).toContain("--brand-paper:#F2EBDD");
    expect(css).toContain('[data-theme="dark"]');
    expect(css).toContain("--brand-on-signal:");
    expect(paletteOf("qualquer")).toBe(PALETTES.NEXTLEVEL);
  });
  it("o contraste calculado bate com valores conhecidos", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#777777", "#777777")).toBeCloseTo(1, 5);
  });
});
