// @vitest-environment node
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({ usePathname: () => "/store/x", useRouter: () => ({ push() {}, replace() {} }) }));
vi.mock("@/components/storefront/cart-context", () => ({ useCart: () => ({ count: 0, ready: true }) }));

import { SectionList, type SectionCtx } from "@/components/storefront/sections";
import type { ThemeSettingsData } from "@/db/schema";
import { SECTION_SCHEMAS } from "@/lib/themes/sections";
import { addSection, legacyGlobals, normalizeTemplate, planProducts, setSectionHidden, setSetting, templateFromLegacy } from "@/lib/themes/template";
import type { PublicProduct } from "@/lib/queries/storefront";

const legacy: ThemeSettingsData = { heroTitle: "Vista o manto", heroSubtitle: "Camisas oficiais", heroCta: "Ver catálogo", announcement: "Frete grátis", banners: [{ title: "Lançamento", subtitle: "Coleção nova", tone: "accent" }], showCategories: true, footerText: "Mantos Shop" };
const store = { id: "s1", name: "Mantos Shop", slug: "mantos", tagline: "Os mantos que a torcida ama", whatsapp: "5511999990001", instagram: "mantosshop", logoText: "MS", offer: "STORE_SUBDOMAIN", primaryColor: "#0f172a", accentColor: "#16a34a" } as never;
const product = (i: number): PublicProduct => ({ id: `p${i}`, slug: `camisa-${i}`, name: `Camisa ${i}`, description: "", images: [], categoryId: "c1", categoryName: "Camisas", priceCents: 12000, packPriceCents: null, featured: i < 4, sellsUnit: true, sellsPack: false, available: 5, variants: [], packs: [] });

function render(template = templateFromLegacy(legacy), products: PublicProduct[] = Array.from({ length: 9 }, (_, i) => product(i)), region: "content" | "header" | "footer" = "content") {
  const globals = legacyGlobals({ primaryColor: "#0f172a", accentColor: "#16a34a" }, legacy);
  const { lists, hero } = planProducts(template, products);
  const ctx: SectionCtx = { slug: "mantos", base: "/store/mantos", store, categories: [{ id: "c1", name: "Camisas", slug: "camisas" }], products, planned: lists, hero, globals };
  const t = region === "header" ? globals.header : region === "footer" ? globals.footer : template;
  return renderToStaticMarkup(<SectionList template={t} ctx={ctx} />);
}

describe("renderização das seções", () => {
  it("a página inicial da loja atual traz todas as seções na ordem, com os textos do lojista", () => {
    const html = render();
    const ids = [...html.matchAll(/data-section-id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toEqual(["hero", "trust", "categories", "showcase", "banners", "grid"]);
    for (const text of ["Vista o manto", "Camisas oficiais", "Ver catálogo", "Envio para todo o Brasil", "Destaques", "Lançamento", "Todos os produtos", "Falar no WhatsApp"]) expect(html).toContain(text);
    expect(html).not.toContain("undefined"); expect(html).not.toContain("[object");
  });
  it("links do tema apontam para a loja", () => {
    const html = render(); expect(html).toContain('href="/store/mantos/catalog"'); expect(html).toContain('href="/store/mantos/product/camisa-0"');
  });
  it("seção oculta não aparece", () => { const html = render(setSectionHidden(templateFromLegacy(legacy), "banners", true)); expect(html).not.toContain("Lançamento"); expect(html).not.toContain('data-section-id="banners"'); });
  it("sem produtos e sem categorias nada quebra", () => {
    const html = render(templateFromLegacy(legacy), []); expect(html).toContain("Vista o manto"); expect(html).not.toContain("Destaques"); expect(html).not.toContain("Todos os produtos");
  });
  it("cada seção do catálogo renderiza com os padrões, sem erro", () => {
    for (const schema of SECTION_SCHEMAS.filter((s) => s.region === "content")) {
      const { template } = addSection(normalizeTemplate({ v: 1, order: [], sections: {} }, "content").template, schema.type, { region: "content", page: schema.pages[0] });
      expect(() => render(template), schema.type).not.toThrow();
    }
  });
  it("formatos do destaque principal", () => {
    for (const layout of ["split", "wide", "centered"]) { const html = render(setSetting(templateFromLegacy(legacy), "hero", "layout", layout)); expect(html).toContain("Vista o manto"); }
    expect(render(setSetting(templateFromLegacy(legacy), "hero", "layout", "wide"))).toContain("min-h-[520px]");
    const heroOf = (layout: string) => { const html = render(setSetting(templateFromLegacy(legacy), "hero", "layout", layout)); const start = html.indexOf('data-section-id="hero"'); return html.slice(start, html.indexOf('data-section-id="trust"')); };
    expect(heroOf("centered")).not.toContain("/product/"); expect(heroOf("split")).toContain("/product/camisa-0");
  });
  it("texto formatado nunca injeta HTML", () => {
    const { template, id } = addSection(templateFromLegacy(legacy), "rich-text", { region: "content", page: "home" });
    const evil = setSetting(template, id, "body", '<img src=x onerror=alert(1)> **ok** [x](javascript:alert(1))');
    const html = render(evil); expect(html).not.toContain("<img"); expect(html).toContain("<strong>ok</strong>"); expect(html).not.toContain('href="javascript:');
  });
  it("cabeçalho e rodapé: anúncio, selo da plataforma e redes", () => {
    const head = render(undefined, [], "header"); expect(head).toContain("Frete grátis"); expect(head).toContain("Mantos Shop");
    const foot = render(undefined, [], "footer"); expect(foot).toContain("Pagamento seguro"); expect(foot).toContain("@mantosshop"); expect(foot).toContain("Tecnologia");
  });
});
