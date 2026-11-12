import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { CASES_TEMAS, casesPublicos, TEMAS_SEMIJOIAS, TEMAS_VITRINE } from "@/lib/portal/cases-temas";
import { THEME_CATALOG, isReleased } from "@/lib/themes/catalog";

describe("página NextLevel Temas para Nuvemshop (D282)", () => {
  it("lojas na ordem do dono, com botão para o endereço real e o resumo de como ajudamos", () => {
    expect(CASES_TEMAS.map((c) => c.chave)).toEqual(["irest", "capistrano", "luis", "futcollection", "ccv"]);
    for (const c of CASES_TEMAS) {
      expect(c.url).toMatch(/^https:\/\//);
      expect(c.ajuda.length).toBeGreaterThan(60);
      expect(c.pontos.length).toBeGreaterThanOrEqual(3);
    }
  });
  it("nenhum case cita a plataforma em que a loja roda, nem traz número de venda", () => {
    const texto = CASES_TEMAS.flatMap((c) => [c.nome, c.segmento, c.ajuda, c.desafio, ...c.pontos.flatMap((p) => [p.titulo, p.texto, p.imagem?.alt ?? ""])]).join(" ").toLowerCase();
    for (const p of ["nuvemshop", "wbuy", "shopify", "boosterstore", "tray", "loja integrada", "vtex"]) expect(texto).not.toContain(p);
    expect(texto).not.toMatch(/(vendas?|faturamento) (cresceu|aumentou|subiu)/);
  });
  it("loja sem autorização não aparece; toda imagem existe", () => {
    expect(casesPublicos().every((c) => c.autorizado)).toBe(true);
    const imgs = CASES_TEMAS.flatMap((c) => [c.computador, c.celular, ...c.pontos.map((p) => p.imagem)]).filter((x) => !!x);
    for (const i of imgs) expect(existsSync(`public${i!.src}`)).toBe(true);
    for (const k of [...TEMAS_SEMIJOIAS, ...TEMAS_VITRINE]) expect(existsSync(`public/portal/temas-nuvemshop/tema-${k}.webp`)).toBe(true);
  });
  it("os temas citados existem e estão liberados", () => {
    for (const k of [...TEMAS_SEMIJOIAS, ...TEMAS_VITRINE]) expect(THEME_CATALOG.some((t) => t.key === k && isReleased(t))).toBe(true);
  });
});
