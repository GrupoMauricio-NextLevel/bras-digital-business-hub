import * as React from "react";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EC, EC_ICONES, EC_LOGOS } from "@/lib/marcas/nextlevel-ecommerce";
import { BrandLogo, brandIcons } from "@/components/brand/brand-logo";
import { brandByCode } from "@/lib/brand";
import { contrastRatio, paletteOf } from "@/lib/brand-palette";
import { READABLE_PAIRS, themeColors, themeCss } from "@/design-system/themes";
import { ogImageFor } from "@/lib/og-marca";

/** NextLevel Commerce v1 (D163): nome público novo sobre o código NEXTLEVEL_COMMERCE, logos por superfície, tema isolado. */
const pub = (u: string) => join(__dirname, "..", "public", u);
const brand = { code: "NEXTLEVEL_COMMERCE", name: EC.name };

describe("NextLevel Commerce", () => {
  it("nome público novo, código técnico igual, cores exatas do pacote", () => {
    const b = brandByCode("NEXTLEVEL_COMMERCE");
    expect([b.code, b.name, b.emailFromName]).toEqual(["NEXTLEVEL_COMMERCE", "NextLevel Commerce", "NextLevel Commerce"]);
    expect(b.legalLine).toContain("NextLevel Commerce");
    expect(EC.descriptor).toBe("PLATAFORMA DE LOJAS VIRTUAIS");
    expect(EC.cores).toEqual({ marinho: "#101A33", azul: "#3F65FF", ciano: "#27C7F2", gelo: "#F3F6FC" });
  });

  it("arquivos oficiais, derivados, manifesto e prévia de link existem", () => {
    for (const u of [...Object.values(EC_LOGOS).flatMap((l) => [l.src, l.src2x, l.png]), EC_ICONES.ico, EC_ICONES.apple, EC_ICONES.manifest, EC_ICONES.og, ...EC_ICONES.png.map((p) => p.url)]) expect(existsSync(pub(u)), u).toBe(true);
    const m = JSON.parse(readFileSync(pub(EC_ICONES.manifest), "utf8"));
    for (const i of m.icons as { src: string }[]) expect(existsSync(pub(i.src)), i.src).toBe(true);
    expect(ogImageFor(brandByCode("NEXTLEVEL_COMMERCE")).url).toBe(EC_ICONES.og);
  });

  it("logo: flat no cabeçalho e no painel, Prisma em destaque, monograma NE; troca de arquivo, nunca filtro", () => {
    const auto = renderToStaticMarkup(<BrandLogo brand={brand} />);
    expect(auto).toContain(EC_LOGOS.flatClara.src);
    expect(auto).toContain(EC_LOGOS.flatEscura.src);
    expect(auto).not.toMatch(/filter|invert|brand\/v2\/commerce|>Commerce</);
    expect(renderToStaticMarkup(<BrandLogo brand={brand} tone="on-dark" variant="prisma" />)).toContain(EC_LOGOS.prismaEscura.src);
    expect(renderToStaticMarkup(<BrandLogo brand={brand} variant="monograma" />)).toContain(EC_LOGOS.monograma.src);
    expect(JSON.stringify(brandIcons("NEXTLEVEL_COMMERCE"))).toContain(EC_ICONES.ico);
  });

  it("tema isolado: só a plataforma muda; AA nos dois modos", () => {
    const l = themeColors("commerce", "light"), d = themeColors("commerce", "dark");
    expect([l.primary, l.ink, l.canvas, d.canvas, d.primary, d.ring]).toEqual([EC.claro.action, EC.cores.marinho, EC.claro.surfaceMuted, EC.escuro.surface, EC.escuro.action, EC.escuro.focus]);
    for (const c of [l, d]) for (const [a, b, min] of READABLE_PAIRS) expect(contrastRatio(c[a], c[b]), `${a}/${b}`).toBeGreaterThanOrEqual(min);
    expect(themeColors("nextlevel", "light").primary).toBe("#673DE6"); // roxo da capa (D198)
    for (const k of ["nextlevel"] as const) expect(themeCss(k).split("}").filter((r) => r.includes(`data-ds-theme="${k}"`)).join("}")).not.toContain(EC.claro.action);
    expect(paletteOf("NEXTLEVEL_COMMERCE").light.signal).toBe(EC.claro.action);
  });
});
