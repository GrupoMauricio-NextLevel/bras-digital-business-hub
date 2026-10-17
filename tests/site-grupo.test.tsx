import * as React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("next/navigation", () => ({ usePathname: () => "/club", useRouter: () => ({ push() {}, replace() {} }) }));
import { AberturaMarca, VitrineMarca } from "@/components/portal/marca-institucional";
import { THEME_CATALOG } from "@/lib/themes/catalog";

/** Site do grupo v1 (D157): sem bloco vazio no lugar de foto, topo ligado ao cabeçalho, sem nota interna em público. */
const ler = (rel: string) => readFileSync(join(__dirname, "..", rel), "utf8");

describe("site do grupo", () => {
  it("marca sem kit de imagens: capacidades em texto, sem bloco listrado com 01/02", () => {
    const html = renderToStaticMarkup(<VitrineMarca slug="nextlevel-club" />);
    expect(html).toContain("Club+ e Club Total");
    expect(html).not.toContain("repeating-linear-gradient");
    expect(html).not.toMatch(/>0[12]</);
  });

  it("abertura: topo escuro ligado ao cabeçalho, com a foto pedida e sem logo inexistente da holding", () => {
    const html = renderToStaticMarkup(<AberturaMarca slug="nextlevel" titulo="T" ctas={[{ href: "#d", label: "Ir", primary: true }]} foto={{ nome: "hero-key-visual", alt: "Equipe" }} />);
    expect(html).toContain('data-heroi-escuro="nextlevel"');
    expect(html).toContain("/marcas/nextlevel/imagens/hero-key-visual-1600.webp");
    expect(html).not.toContain("/marcas/nextlevel/logos/");
  });

  it("Soluções não mostra nota interna e a Loja NextLevel não usa o verde do SuperDrop", () => {
    expect(ler("src/app/(portal)/solucoes/page.tsx")).not.toMatch(/fica vazia/);
    expect(ler("src/app/(portal)/loja-nextlevel/page.tsx")).not.toMatch(/34,197,94|success-soft/);
  });

  it("nicho dos temas sem dois-pontos repetido", () => {
    for (const t of THEME_CATALOG) expect(t.niche.split(":").length, t.key).toBeLessThanOrEqual(2);
  });
});
