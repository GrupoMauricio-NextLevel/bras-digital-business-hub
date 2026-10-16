import * as React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("next/navigation", () => ({ usePathname: () => "/store/x", useRouter: () => ({ push() {}, replace() {} }) }));
vi.mock("@/components/storefront/cart-context", () => ({ useCart: () => ({ count: 0, ready: true, lines: [], add() {}, update() {}, remove() {}, clear() {}, subtotal: 0 }) }));
import { Footer } from "@/components/storefront/sections/sections";
import type { SectionCtx } from "@/components/storefront/sections/types";
import { NextLevelSignature } from "@/components/brand/nextlevel-signature";

/**
 * Marca certa em todas as telas (análise Commerce v3, M1 a M8): telas que todas as marcas usam não podem fixar a logo do
 * SuperDrop, e o selo "Tecnologia SuperDrop" do rodapé das lojas só aparece em loja do SuperDrop.
 */
const raiz = join(__dirname, "..");
const ler = (rel: string) => readFileSync(join(raiz, rel), "utf8");

describe("marca certa", () => {
  it("telas comuns a todas as marcas usam a logo do endereço, não a do SuperDrop fixa", () => {
    for (const rel of ["src/app/esqueci-senha/page.tsx", "src/app/redefinir-senha/[token]/page.tsx", "src/app/not-found.tsx", "src/components/app/blocked-screen.tsx"]) {
      const src = ler(rel);
      expect(src, rel).not.toMatch(/from "@\/components\/brand\/logo"/);
      expect(src, rel).toMatch(/LogoDoEndereco/);
      expect(src, rel).not.toMatch(/aria-label="SuperDrop/);
    }
  });

  it("a assinatura da NextLevel diz o nome da marca recebida", () => {
    const html = renderToStaticMarkup(<NextLevelSignature product="NextLevel Commerce" />);
    expect(html).toContain("NextLevel Commerce é um sistema de tecnologia");
    expect(html).not.toContain("SuperDrop");
  });

  const ctx = (brandCode: string): SectionCtx => ({
    slug: "x", base: "/store/x", brandCode, categories: [], products: [], planned: {}, hero: undefined, page: "home",
    store: { name: "Loja X", offer: "STORE_SUBDOMAIN" } as SectionCtx["store"],
    globals: {} as SectionCtx["globals"],
  });

  it("rodapé da loja: selo do SuperDrop só em loja do SuperDrop", () => {
    const commerce = renderToStaticMarkup(<Footer id="f" settings={{}} blocks={[]} ctx={ctx("NEXTLEVEL_COMMERCE")} />);
    const superdrop = renderToStaticMarkup(<Footer id="f" settings={{}} blocks={[]} ctx={ctx("SUPERDROP")} />);
    expect(commerce).not.toContain("Tecnologia");
    expect(superdrop).toContain("Tecnologia");
  });
});
