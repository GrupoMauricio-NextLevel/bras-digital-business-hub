import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { CASES_TEMAS, TEMAS_MELHORES } from "@/lib/portal/cases-temas";
import { THEME_CATALOG, isReleased } from "@/lib/themes/catalog";

describe("página Nossos clientes (D283)", () => {
  // Só o que vira texto da página: sem as linhas de import e sem os comentários do código.
  const fonte = readFileSync("src/components/portal/commerce/clientes-ec.tsx", "utf8").replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter((l) => !l.startsWith("import ")).join("\n").toLowerCase();
  it("100% NextLevel: nenhuma outra plataforma no texto", () => {
    const textos = [fonte, ...CASES_TEMAS.flatMap((c) => [c.negocio, c.cidade ?? ""])].join(" ").toLowerCase();
    for (const p of ["nuvemshop", "wbuy", "shopify", "boosterstore", "tray", "loja integrada", "vtex", "wix"]) expect(textos).not.toContain(p);
  });
  it("não diz que as lojas rodam na plataforma enquanto nenhuma roda", () => {
    expect(CASES_TEMAS.every((c) => !c.naPlataforma)).toBe(true);
    for (const f of ["feita na nextlevel e-commerce", "feitas na nextlevel e-commerce", "rodam na nextlevel", "roda na nextlevel", "na nossa plataforma"]) expect(fonte).not.toContain(f);
    expect(fonte).toContain("c.naplataforma ?"); // o selo só aparece com o campo verdadeiro
  });
  it("cada marca tem o negócio, o botão com o endereço real e os melhores templates existem", () => {
    for (const c of CASES_TEMAS) { expect(c.negocio.length).toBeGreaterThan(30); expect(c.url).toMatch(/^https:\/\//); }
    for (const k of TEMAS_MELHORES) {
      expect(THEME_CATALOG.some((t) => t.key === k && isReleased(t))).toBe(true);
      expect(existsSync(`public/portal/temas-nuvemshop/tema-${k}.webp`)).toBe(true);
    }
  });
});
