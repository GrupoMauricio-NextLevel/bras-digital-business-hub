import * as React from "react";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NL, NL_HEROI, NL_ICONES, NL_LOGOS, NL_PECAS_3D, nlCssVars } from "@/lib/marcas/nextlevel";
import { BrandLogo, brandIcons } from "@/components/brand/brand-logo";
import { brandByCode } from "@/lib/brand";
import { contrastRatio, paletteOf } from "@/lib/brand-palette";
import { READABLE_PAIRS, themeColors, themeCss } from "@/design-system/themes";
import { FechoMarca } from "@/components/portal/marca-institucional";

/** Marca-mãe NextLevel v2 (D161): fonte única, logo por superfície e tamanho, tema isolado das marcas-filhas, ícones e prévia. */
const raiz = join(__dirname, "..");
const pub = (url: string) => join(raiz, "public", url);
const brand = { code: "NEXTLEVEL", name: "NextLevel" };

describe("NextLevel v2: identidade", () => {
  it("nome, linha de apoio, slogan preservado e cores exatas do pacote aprovado", () => {
    expect(NL.name).toBe("NextLevel");
    expect(NL.supportLine).toBe("SOLUÇÕES DIGITAIS");
    expect(NL.tagline).toBe("Estrutura digital para o seu negócio ir além.");
    expect(NL.cores).toEqual({ marinho: "#070F22", royal: "#365BFF", azulLuminoso: "#12B8F4", turquesa: "#2AD7C0", gelo: "#F3F6FC" });
    expect(brandByCode("NEXTLEVEL").name).toBe(NL.name);
  });

  it("todos os arquivos oficiais e derivados existem; manifesto e prévia de link corretos", async () => {
    const urls = [...Object.values(NL_LOGOS).flatMap((l) => [l.src, l.src2x, l.png]), `${NL_HEROI.base}.png`, `${NL_HEROI.base}-800.webp`, `${NL_HEROI.base}-1600.avif`, NL_HEROI.mobile,
      ...NL_PECAS_3D.flatMap((p) => [`${p}-800.webp`, `${p}-1600.webp`, `${p}-800.avif`]), NL_ICONES.ico, NL_ICONES.apple, NL_ICONES.manifest, NL_ICONES.og, ...NL_ICONES.png.map((p) => p.url)];
    for (const u of urls) expect(existsSync(pub(u)), u).toBe(true);
    const manifest = JSON.parse(readFileSync(pub(NL_ICONES.manifest), "utf8"));
    expect(manifest.short_name).toBe("NextLevel");
    expect(manifest.icons.find((i: { purpose: string }) => i.purpose === "maskable")).toBeTruthy();
    for (const i of manifest.icons as { src: string }[]) expect(existsSync(pub(i.src)), i.src).toBe(true);
    expect(await sharp(pub(NL_ICONES.og)).metadata()).toMatchObject({ width: 1200, height: 630, format: "jpeg" });
  });

  it("logo pela superfície e pelo tamanho: nome no compacto, interface com a linha de apoio, prisma em área ampla, monograma", () => {
    const auto = renderToStaticMarkup(<BrandLogo brand={brand} />);
    expect(auto).toContain(NL_LOGOS.nomeClara.src);
    expect(auto).toContain(NL_LOGOS.nomeEscura.src);
    expect(auto).toMatch(/nl-logo-light/);
    expect(renderToStaticMarkup(<BrandLogo brand={brand} tone="on-dark" variant="prisma" />)).toContain(NL_LOGOS.prismaEscura.src);
    expect(renderToStaticMarkup(<BrandLogo brand={brand} tone="on-light" variant="prisma" />)).toContain(NL_LOGOS.prismaClara.src);
    expect(renderToStaticMarkup(<BrandLogo brand={brand} tone="on-dark" variant="assinatura-completa" />)).toContain(NL_LOGOS.interfaceEscura.src);
    expect(renderToStaticMarkup(<BrandLogo brand={brand} variant="monograma" />)).toContain(NL_LOGOS.monograma.src);
    // Densidade alta: a cópia 2x vem no srcset; nunca filtro, recoloração ou SVG antigo do raio amarelo.
    expect(auto).toContain(`${NL_LOGOS.nomeClara.src2x} 2x`);
    expect(auto).not.toMatch(/filter|invert|brand\/v2\/nextlevel/);
    // Outras marcas sem "prisma" caem na assinatura completa delas.
    expect(renderToStaticMarkup(<BrandLogo brand={{ code: "SUPERDROP", name: "SuperDrop" }} variant="prisma" tone="on-light" />)).toContain("/brand/v2/superdrop/claro/assinatura-completa.svg");
  });

  it("tema isolado: o Master e o grupo mudam, as marcas-filhas não", () => {
    const l = themeColors("nextlevel", "light"), d = themeColors("nextlevel", "dark");
    expect([l.primary, l.ink, l.sideBg, l.ring, l.canvas]).toEqual([NL.claro.action, NL.cores.marinho, NL.cores.marinho, NL.claro.focus, NL.claro.surfaceMuted]);
    expect([d.primary, d.canvas, d.surface, d.link, d.ring]).toEqual([NL.escuro.action, NL.escuro.surface, NL.escuro.surfaceMuted, NL.escuro.link, NL.escuro.focus]);
    for (const c of [l, d]) for (const [a, b, min] of READABLE_PAIRS) expect(contrastRatio(c[a], c[b]), `${a}/${b}`).toBeGreaterThanOrEqual(min);
    expect(contrastRatio("#FFFFFF", l.primary)).toBeGreaterThanOrEqual(4.5);
    // Produtos seguem com a cor de assinatura e o amarelo do grupo como destaque (não foram recoloridos).
    expect([themeColors("commerce", "light").primary, themeColors("superdrop", "light").primary, themeColors("cargas", "light").primary]).toEqual(["#196BD8", "#118728", "#4B4FD8"]);
    expect(themeColors("commerce", "light").accent).toBe("#F5BC00");
    expect(themeColors("bras", "light").primary).toBe("#315CFF");
    for (const k of ["commerce", "superdrop", "bras", "cargas"] as const) expect(themeCss(k).split("}").filter((r) => r.includes(`data-ds-theme="${k}"`)).join("}")).not.toContain(NL.claro.action);
    expect(nlCssVars()).toContain("--nlg-marinho:#070F22");
    expect(paletteOf("NEXTLEVEL").light.signal).toBe(NL.claro.action);
    expect(paletteOf("SUPERDROP").light.signal).toBe("#2D9E3B");
  });

  it("ícones: NextLevel e marcas sem favicon próprio usam os da marca-mãe v2; SuperDrop, Commerce e Brás seguem com os delas", () => {
    for (const c of ["NEXTLEVEL", "CHINA_HUB", "NEXTLEVEL_CARGAS"]) {
      const i = brandIcons(c);
      expect(JSON.stringify(i)).toContain(NL_ICONES.ico);
      expect(i.apple).toBe(NL_ICONES.apple);
    }
    expect(JSON.stringify(brandIcons("SUPERDROP"))).toContain("/brand/v2/superdrop/");
    expect(JSON.stringify(brandIcons("NEXTLEVEL_COMMERCE"))).toContain("/brand/v2/commerce/");
    expect(JSON.stringify(brandIcons("BRAS_DIGITAL"))).toContain("/marcas/bras-digital-club/");
  });

  it("peças institucionais: o site do grupo usa o marinho v2; Cargas (marca-filha) segue no navy dela", () => {
    const grupo = renderToStaticMarkup(<FechoMarca slug="nextlevel" cta={{ href: "#d", label: "Diagnóstico" }} />);
    expect(grupo).toContain("--mk-navy:var(--nlg-marinho)");
    expect(grupo).toContain("--mk-btn:var(--nlg-royal)");
    expect(grupo).not.toContain("cta-moment");
    const cargas = renderToStaticMarkup(<FechoMarca slug="nextlevel-cargas" cta={{ href: "#c", label: "Cadastrar" }} />);
    expect(cargas).toContain("--mk-navy:#101B34");
    expect(cargas).not.toContain("--nlg-");
  });
});
