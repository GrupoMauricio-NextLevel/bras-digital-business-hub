import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { brandsFrom } from "@/lib/brand";
import { emailTopFor, renderHtml } from "@/lib/email";
import { formatosDisponiveis, FotoOpcional } from "@/components/portal/imagem-em-criacao";
import { parseManifest, publicImages } from "@/lib/qualidade/imagens";

const sharp = createRequire(import.meta.url)("sharp") as (p: string) => { metadata(): Promise<{ width?: number; height?: number; hasAlpha?: boolean }> };
const pub = (p: string) => join(process.cwd(), "public", p);
const meta = (p: string) => sharp(pub(p)).metadata();

/** Auditoria geral de imagens (2026-10-12): os manifestos são a fonte da verdade; tamanhos obrigatórios e "sem arquivo, nada quebra". */
describe("imagens da auditoria geral", () => {
  it("cada foto dos manifestos novos tem AVIF, WebP e o PNG original", () => {
    for (const marca of ["superdrop", "commerce", "nextlevel"] as const) {
      const rows = parseManifest(readFileSync(pub(`portal/${marca}/v3/MANIFESTO.md`), "utf8"));
      for (const r of rows.filter((x) => /passo|seja-fornecedor|parceiros-hero|planos-faixa|login-lateral|cadastro-lateral|solucoes-hero|familia|erro-caixa/.test(x.name))) {
        expect(formatosDisponiveis(marca, r.name), r.name).toEqual(["avif", "webp", "png"]);
      }
    }
    expect(publicImages().filter((i) => i.brand === "nextlevel").map((i) => i.name)).toContain("nl-solucoes-hero");
  });

  it("prévias de link em 1200×630 e faixas de e-mail em 1200×300, em JPG e PNG, nunca AVIF", async () => {
    const og = ["superdrop/v3/sd-og-portal", "commerce/v3/cm-og-portal", "nextlevel/v3/nl-og-solucoes"];
    const topo = ["superdrop/v3/sd-email-topo", "commerce/v3/cm-email-topo", "nextlevel/v3/nl-email-topo"];
    for (const [list, w, h] of [[og, 1200, 630], [topo, 1200, 300]] as const) {
      for (const f of list) {
        for (const ext of ["jpg", "png"]) expect(await meta(`portal/${f}.${ext}`)).toMatchObject({ width: w, height: h });
        expect(existsSync(pub(`portal/${f}.avif`))).toBe(false);
      }
    }
  });

  it("ilustrações do lote D: 1024×1024 com transparência, em PNG e WebP", async () => {
    const md = readFileSync(pub("ilustracoes/v1/MANIFESTO.md"), "utf8");
    const names = [...md.matchAll(/^\| (ui-[a-z-]+) \|/gm)].map((m) => m[1]!);
    expect(names).toHaveLength(12);
    for (const n of names) for (const ext of ["png", "webp"]) expect(await meta(`ilustracoes/v1/${n}.${ext}`), n).toMatchObject({ width: 1024, height: 1024, hasAlpha: true });
  });

  it("material de parceiro (lote E) fica fora do site", () => {
    for (const n of ["sd-parceiro-feed", "sd-parceiro-story", "cm-parceiro-feed", "cm-parceiro-story"]) {
      expect(existsSync(join(process.cwd(), "docs/marca", `${n}.png`))).toBe(true);
      expect(existsSync(pub(`portal/superdrop/v3/${n}.png`)) || existsSync(pub(`portal/commerce/v3/${n}.png`))).toBe(false);
    }
  });

  it("sem arquivo, a foto opcional não aparece (nada de imagem quebrada)", () => {
    expect(formatosDisponiveis("nextlevel", "nao-existe")).toEqual([]);
    expect(FotoOpcional({ marca: "nextlevel", nome: "nao-existe", alt: "" })).toBeNull();
    expect(FotoOpcional({ marca: "nextlevel", nome: "nl-solucoes-hero", alt: "x" })).not.toBeNull();
  });

  it("faixa do e-mail: endereço completo da própria marca; Brás e Cargas sem faixa", () => {
    const all = brandsFrom({});
    expect(emailTopFor(all.SUPERDROP)).toBe(`${all.SUPERDROP.baseUrl}/portal/superdrop/v3/sd-email-topo.jpg`);
    expect(emailTopFor(all.NEXTLEVEL_COMMERCE)).toMatch(/\/portal\/commerce\/v3\/cm-email-topo\.jpg$/);
    expect(emailTopFor(all.BRAS_DIGITAL)).toBeNull();
    expect(emailTopFor(all.NEXTLEVEL_CARGAS)).toBeNull();
    const html = renderHtml({ subject: "Oi", text: "t" }, all.SUPERDROP);
    expect(html).toContain('<img src="https://');
    expect(html).toContain('alt=""');
    expect(renderHtml({ subject: "Oi", text: "t" }, all.BRAS_DIGITAL)).not.toContain("<img");
  });
});
