import { describe, expect, it } from "vitest";
import { READABLE_PAIRS, THEME_KEYS, THEME_FOR_BRAND, themeColors, themeCss, themeKeyForBrand } from "@/design-system/themes";
import { contrastRatio } from "@/lib/brand-palette";
import { BRAND_CODES } from "@/lib/brand";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

describe("sistema de design: contrato de tema por cores", () => {
  for (const key of THEME_KEYS) for (const mode of ["light", "dark"] as const) {
    it(`${key} ${mode}: pares de leitura passam de AA`, () => {
      const c = themeColors(key, mode);
      const fails = READABLE_PAIRS.flatMap(([fg, bg, min]) => { const r = contrastRatio(c[fg], c[bg]); return r >= min ? [] : [`${String(fg)} sobre ${String(bg)}: ${r.toFixed(2)} < ${min}`]; });
      expect(fails).toEqual([]);
    });
  }

  it("toda marca do sistema tem tema, e o CSS gerado cobre claro, escuro e sistema sem condicional por empresa", () => {
    for (const code of BRAND_CODES) expect(THEME_KEYS).toContain(themeKeyForBrand(code));
    expect(Object.keys(THEME_FOR_BRAND).sort()).toEqual([...BRAND_CODES].sort());
    const css = themeCss("commerce");
    expect(css).toContain(':root[data-ds-theme="commerce"]{');
    expect(css).toContain('[data-theme="dark"]');
    expect(css).toContain("prefers-color-scheme: dark");
    expect(css).toContain("--ds-primary:#2557DA");
  });

  it("todos os temas definem exatamente os mesmos papéis (só os valores mudam)", () => {
    const shape = (k: (typeof THEME_KEYS)[number]) => Object.keys(themeColors(k, "light")).sort().join();
    for (const k of THEME_KEYS) expect(shape(k)).toBe(shape("nextlevel"));
  });
});

/** Regras do sistema: cor de empresa só em themes.ts; componentes do núcleo não conhecem a empresa. */
function files(dir: string): string[] { return readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : [p]; }); }

describe("sistema de design: núcleo sem cor nem nome de empresa", () => {
  const core = files("src/design-system").filter((f) => !f.endsWith("themes.ts") && /\.(css|tsx?)$/.test(f));
  it("só themes.ts contém cores fixas (exceto branco e preto puros, usados para misturar)", () => {
    const bad: string[] = [];
    for (const f of core) {
      const txt = readFileSync(f, "utf8");
      for (const m of txt.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) if (!["#fff", "#ffffff", "#000", "#000000"].includes(m[0].toLowerCase())) bad.push(`${f}: ${m[0]}`);
    }
    expect(bad).toEqual([]);
  });
  it("nenhum componente do núcleo tem condicional por empresa", () => {
    const bad: string[] = [];
    for (const f of core.filter((x) => x.endsWith(".tsx"))) {
      const txt = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      if (/(NEXTLEVEL|SUPERDROP|COMMERCE|["'`]superdrop["'`]|["'`]commerce["'`]|["'`]nextlevel["'`])/i.test(txt.replace(/import[^\n]*\n/g, ""))) bad.push(f);
    }
    expect(bad).toEqual([]);
  });
});
