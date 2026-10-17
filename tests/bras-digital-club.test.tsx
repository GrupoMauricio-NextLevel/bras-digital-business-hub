import * as React from "react";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BDC, BDC_HEROI, BDC_ICONES, BDC_LOGOS, bdcCssVars } from "@/lib/marcas/bras-digital-club";
import { BrandLogo, brandIcons } from "@/components/brand/brand-logo";
import { brandByCode } from "@/lib/brand";
import { contrastRatio, paletteOf } from "@/lib/brand-palette";
import { themeColors, themeCss } from "@/design-system/themes";
import { routeHost } from "@/lib/host-routing";

/** Identidade Brás Digital Club (D158): fonte única, logos certas por superfície, tema isolado, ícones e rota pública. */
const raiz = join(__dirname, "..");
const pub = (url: string) => join(raiz, "public", url);

describe("Brás Digital Club: identidade", () => {
  it("nome, slogan e cores exatos do pacote, sem domínio inventado", () => {
    expect(BDC.name).toBe("Brás Digital Club");
    expect(BDC.tagline).toBe("Conecte seu negócio ao pulso do Brás.");
    expect(BDC.cores).toEqual({ navy: "#0C1830", azul: "#315CFF", ciano: "#00D4FF", offWhite: "#F4F1E9" });
    expect(BDC.canonicalUrl).toBe("https://brasdigitalclub.com.br");
    const b = brandByCode("BRAS_DIGITAL");
    expect(b.name).toBe("Brás Digital Club");
    expect(b.tagline).toBe(BDC.tagline);
    // Até o DNS ser verificado, o endereço no ar continua o antigo; o domínio novo já é reconhecido como da Brás.
    expect(b.baseUrl).toBe("https://bras.nextlevelgroup.com.br");
    expect(b.domains).toEqual(expect.arrayContaining(["brasdigitalclub.com.br", "www.brasdigitalclub.com.br", "bras.nextlevelgroup.com.br"]));
  });

  it("todos os arquivos oficiais e derivados existem", () => {
    const urls = [...Object.values(BDC_LOGOS).flatMap((l) => [l.src, l.png]), `${BDC_HEROI.base}-800.webp`, `${BDC_HEROI.base}-1600.webp`, `${BDC_HEROI.base}.png`, BDC_HEROI.mobile,
      BDC_ICONES.ico, BDC_ICONES.apple, BDC_ICONES.pwa192, BDC_ICONES.pwa512, BDC_ICONES.manifest, BDC_ICONES.og, ...BDC_ICONES.png.map((p) => p.url)];
    for (const u of urls) expect(existsSync(pub(u)), u).toBe(true);
    const manifest = JSON.parse(readFileSync(pub(BDC_ICONES.manifest), "utf8"));
    expect(manifest.name).toBe(BDC.name);
    expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  });

  it("logo: clara no claro, escura no escuro, monograma no compacto; troca de arquivo, nunca filtro", () => {
    const brand = { code: "BRAS_DIGITAL", name: BDC.name };
    const auto = renderToStaticMarkup(<BrandLogo brand={brand} />);
    expect(auto).toContain(BDC_LOGOS.clara.src);
    expect(auto).toContain(BDC_LOGOS.escura.src);
    expect(auto).toMatch(/nl-logo-light/);
    expect(auto).not.toMatch(/filter|invert/);
    expect(renderToStaticMarkup(<BrandLogo brand={brand} tone="on-dark" />)).toContain(BDC_LOGOS.escura.src);
    expect(renderToStaticMarkup(<BrandLogo brand={brand} tone="on-light" />)).toContain(BDC_LOGOS.clara.src);
    const mono = renderToStaticMarkup(<BrandLogo brand={brand} variant="monograma" />);
    expect(mono).toContain(BDC_LOGOS.monogramaClaro.src);
    expect(mono).toContain(BDC_LOGOS.monogramaEscuro.src);
    expect(renderToStaticMarkup(<BrandLogo brand={brand} tone="on-dark" variant="assinatura-completa" />)).toContain(BDC_LOGOS.escuraSlogan.src);
    for (const f of ["src/components/brand/brand-logo.tsx", "src/components/portal/bras/bras.css"]) expect(readFileSync(join(raiz, f), "utf8"), f).not.toMatch(/invert\(|hue-rotate|filter:\s*(?!none)/);
  });

  it("tema isolado: a Brás muda, as outras marcas não", () => {
    const l = themeColors("bras", "light"), d = themeColors("bras", "dark");
    expect([l.primary, l.ink, l.sideBg]).toEqual([BDC.cores.azul, BDC.cores.navy, BDC.cores.navy]);
    expect([d.canvas, d.surface, d.ring]).toEqual([BDC.escuro.surface, BDC.escuro.surfaceMuted, BDC.cores.ciano]);
    // Selos e links sobre o fundo suave da marca também passam AA (outras marcas: pendência registrada fora desta mudança).
    for (const c of [l, d]) expect(contrastRatio(c.link, c.soft)).toBeGreaterThanOrEqual(4.5);
    expect(themeColors("commerce", "light").primary).toBe("#196BD8");
    expect(themeColors("superdrop", "light").primary).toBe("#118728");
    expect(themeColors("nextlevel", "light").primary).toBe("#F5BC00");
    expect(themeCss("commerce")).not.toContain(BDC.cores.azul.toLowerCase());
    expect(bdcCssVars()).toContain("--bdc-azul:#315CFF");
    expect(paletteOf("BRAS_DIGITAL").light.signal).toBe(BDC.cores.azul);
    expect(paletteOf("NEXTLEVEL_COMMERCE").light.signal).toBe("#2F81F4");
  });

  it("ícones: favicons, Apple e PWA da Brás; as outras marcas seguem com os delas", () => {
    const i = brandIcons("BRAS_DIGITAL");
    expect(JSON.stringify(i)).toContain(BDC_ICONES.ico);
    expect(i.apple).toBe(BDC_ICONES.apple);
    expect(JSON.stringify(brandIcons("SUPERDROP"))).toContain("/brand/v2/superdrop/");
  });

  it("domínio próprio: endereços secundários levam ao principal, só depois de trocar o endereço no ar", () => {
    const novo = { BRAND_URL_BRAS_DIGITAL: "https://brasdigitalclub.com.br" };
    expect(routeHost({ host: "www.brasdigitalclub.com.br", pathname: "/cadastro", search: "?video=1" }, novo)).toEqual({ kind: "redirect", url: "https://brasdigitalclub.com.br/cadastro?video=1" });
    expect(routeHost({ host: "bras.nextlevelgroup.com.br", pathname: "/" }, novo)).toEqual({ kind: "redirect", url: "https://brasdigitalclub.com.br/" });
    expect(routeHost({ host: "brasdigitalclub.com.br", pathname: "/" }, novo).kind).not.toBe("redirect");
    // Hoje (endereço no ar = bras.nextlevelgroup.com.br): o antigo não redireciona; o novo leva ao antigo até a troca.
    expect(routeHost({ host: "bras.nextlevelgroup.com.br", pathname: "/" }, {}).kind).not.toBe("redirect");
    expect(routeHost({ host: "brasdigitalclub.com.br", pathname: "/x" }, {})).toEqual({ kind: "redirect", url: "https://bras.nextlevelgroup.com.br/x" });
  });

  it("rota /bras-digital-club: página inicial no endereço da Brás, endereço da Brás nas outras marcas, página em endereço técnico", () => {
    const env = { BRAND_DOMAINS_BRAS_DIGITAL: "bd.test", BRAND_URL_BRAS_DIGITAL: "https://bd.test", BRAND_DOMAINS_SUPERDROP: "sd.test" };
    expect(routeHost({ host: "bd.test", pathname: "/bras-digital-club" }, env)).toEqual({ kind: "redirect", url: "/" });
    expect(routeHost({ host: "sd.test", pathname: "/bras-digital-club" }, env)).toEqual({ kind: "redirect", url: "https://bd.test/" });
    expect(routeHost({ host: "nextlevel-demo.onrender.com", pathname: "/bras-digital-club" }, env)).toEqual({ kind: "next" });
  });
});
