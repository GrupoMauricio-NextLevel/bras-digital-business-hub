import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { acervoCompleto, acervoEmEspera } from "@/lib/imersiva/acervo";
import { EC_HOME_ACERVO } from "@/lib/marcas/ecommerce-home-imagens";
import { BD_HOME_FOTOS } from "@/lib/marcas/bras-home-imagens";
import { CG_HOME_FOTOS } from "@/lib/marcas/cargas-home-imagens";
import { SD_HOME_FOTOS } from "@/lib/marcas/superdrop-home-imagens";

const ler = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

/** Páginas imersivas das outras marcas (D167): o lugar das fotos fica reservado e a jornada só vai ao ar com o acervo completo. */
describe("jornada imersiva com fotos em produção", () => {
  it("acervo em espera: paisagem 3:2, retrato e porta 2:3, nunca completo", () => {
    const a = acervoEmEspera("/x", ["m-jornada-1", "m-jornada-1-retrato", "m-porta-zero"] as const);
    expect(a.fotos["m-jornada-1"]).toMatchObject({ w: 1400, h: 933, espera: true });
    expect(a.fotos["m-jornada-1-retrato"]).toMatchObject({ w: 960, h: 1440, espera: true });
    expect(a.fotos["m-porta-zero"]).toMatchObject({ w: 960, h: 1440 });
    expect(acervoCompleto(a)).toBe(false);
    expect(acervoCompleto(EC_HOME_ACERVO)).toBe(true);
  });

  it("a seção some fora da prévia enquanto faltar foto (a home atual da marca fica igual)", () => {
    const secao = ler("src/components/imersiva/secao-imersiva.tsx");
    expect(secao).toMatch(/if \(!completo && !previa\) return null;/);
    expect(ler("src/app/(portal)/page.tsx")).toMatch(/\.previa === "imersiva"/);
  });

  it.each([
    ["bd", BD_HOME_FOTOS, "src/components/portal/bras/imersiva.tsx"],
    ["cg", CG_HOME_FOTOS, "src/components/portal/cargas/imersiva.tsx"],
    ["sd", SD_HOME_FOTOS, "src/components/portal/superdrop/imersiva.tsx"],
  ] as const)("%s: os nomes do pedido de fotos, do acervo e da página batem", (prefixo, fotos, pagina) => {
    const pedido = ler("docs/prompts/fotos-imersivas-superdrop-bras-cargas-gpt.md");
    const doPedido = new Set([...pedido.matchAll(new RegExp(`\\b(${prefixo}-[a-z0-9-]+)\\.png`, "g"))].map((m) => m[1]!));
    const nomes = Object.keys(fotos);
    // Toda foto pedida (e a versão em pé de cada passo da jornada) existe no acervo, e vice-versa.
    const esperado = new Set([...doPedido, ...[...doPedido].filter((n) => n.includes("-jornada-")).map((n) => `${n}-retrato`)]);
    expect(new Set(nomes)).toEqual(esperado);
    // Toda foto citada na página está no acervo.
    const citadas = [...new Set([...ler(pagina).matchAll(new RegExp(`(?:foto|retrato): "(${prefixo}-[a-z0-9-]+)"`, "g"))].map((m) => m[1]!))];
    expect(citadas.length).toBeGreaterThanOrEqual(14);
    for (const n of citadas) expect(nomes).toContain(n);
  });
});
