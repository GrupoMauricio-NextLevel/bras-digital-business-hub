import { describe, expect, it } from "vitest";
import { themeAreaCss, themeCss } from "@/design-system/themes";

/** Especificidade simples (ids, classes/atributos/pseudo-classes, elementos) de um seletor sem vírgulas. */
function spec(sel: string): [number, number, number] {
  const ids = (sel.match(/#[\w-]+/g) ?? []).length;
  const cls = (sel.match(/\.[\w-]+|\[[^\]]+\]|:(?!not\()[\w-]+/g) ?? []).length + (sel.match(/:not\(([^)]*)\)/g) ?? []).reduce((n, m) => n + spec(m.slice(5, -1))[1], 0);
  const els = (sel.replace(/\[[^\]]+\]|\([^)]*\)/g, "").match(/(^|[\s>+~])[a-z]+/g) ?? []).length;
  return [ids, cls, els];
}
const maior = (a: [number, number, number], b: [number, number, number]) => a[0] !== b[0] ? a[0] > b[0] : a[1] !== b[1] ? a[1] > b[1] : a[2] > b[2];
const seletores = (css: string) => [...css.matchAll(/([^{}]+)\{color-scheme/g)].map((m) => m[1]!.replace(/^@media[^{]*\{/, "").trim());

describe("cor de uma área com marca própria (Estúdio da Brás, Meu Brás)", () => {
  it("vence o tema do endereço nos modos claro, escuro e sistema", () => {
    const area = seletores(themeAreaCss("bras"));
    const endereco = seletores(themeCss("superdrop"));
    expect(area).toHaveLength(3);
    expect(endereco).toHaveLength(3);
    for (let i = 0; i < 3; i++) expect(maior(spec(area[i]!), spec(endereco[i]!))).toBe(true);
  });
  it("traz a cor da Brás, não a do endereço", () => {
    expect(themeAreaCss("bras")).toContain("--ds-primary:#B34D00");
    expect(themeAreaCss("bras")).not.toContain("#118728");
  });
});
