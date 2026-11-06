import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * D264 (pedido do dono): toda atualização alimenta a base de conhecimento da equipe. A partir da D257 (quando a base
 * nasceu), cada decisão registrada em DECISIONS.md precisa estar citada no inventário da base.
 */
describe("base de conhecimento ao vivo", () => {
  it("toda decisão desde a D257 está na base de conhecimento", () => {
    const decisoes = readFileSync("docs/design/DECISIONS.md", "utf8");
    const base = readFileSync("docs/conhecimento/BC0-INVENTARIO.md", "utf8");
    const numeros = [...decisoes.matchAll(/^## D(\d+)\b/gm)].map((m) => Number(m[1])).filter((n) => n >= 257);
    expect(numeros.length).toBeGreaterThan(0);
    const faltam = numeros.filter((n) => !new RegExp(`\\bD${n}\\b`).test(base));
    expect(faltam, `Decisões sem registro na base de conhecimento: ${faltam.map((n) => `D${n}`).join(", ")}`).toEqual([]);
  });
});
