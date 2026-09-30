// @vitest-environment node
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({ usePathname: () => "/store/x", useRouter: () => ({ push() {}, replace() {} }) }));
vi.mock("@/components/storefront/cart-context", () => ({ useCart: () => ({ count: 0, ready: true, lines: [], add() {}, update() {}, remove() {}, clear() {}, subtotal: 0 }) }));
vi.mock("sonner", () => ({ toast: Object.assign(() => {}, { success() {}, error() {} }) }));

import { SectionList, type SectionCtx } from "@/components/storefront/sections";
import type { ThemeSettingsData } from "@/db/schema";
import { SECTION_SCHEMAS } from "@/lib/themes/sections";
import { addSection, defaultTemplate, legacyGlobals, normalizeTemplate, planProducts, setSectionHidden, setSetting, templateFromLegacy } from "@/lib/themes/template";
import type { PublicProduct } from "@/lib/queries/storefront";

const legacy: ThemeSettingsData = { heroTitle: "Vista o manto", heroSubtitle: "Camisas oficiais", heroCta: "Ver catálogo", announcement: "Frete grátis", banners: [{ title: "Lançamento", subtitle: "Coleção nova", tone: "accent" }], showCategories: true, footerText: "Mantos Shop" };
const store = { id: "s1", name: "Mantos Shop", slug: "mantos", tagline: "Os mantos que a torcida ama", whatsapp: "5511999990001", instagram: "mantosshop", logoText: "MS", offer: "STORE_SUBDOMAIN", primaryColor: "#0f172a", accentColor: "#16a34a" } as never;
const product = (i: number): PublicProduct => ({ id: `p${i}`, slug: `camisa-${i}`, name: `Camisa ${i}`, description: "", images: [], categoryId: "c1", categoryName: "Camisas", priceCents: 12000, packPriceCents: null, featured: i < 4, sellsUnit: true, sellsPack: false, available: 5, variants: [], packs: [] });

function render(template = templateFromLegacy(legacy), products: PublicProduct[] = Array.from({ length: 9 }, (_, i) => product(i)), region: "content" | "header" | "footer" = "content") {
  const globals = legacyGlobals({ primaryColor: "#0f172a", accentColor: "#16a34a" }, legacy);
  const { lists, hero } = planProducts(template, products);
  const ctx: SectionCtx = { slug: "mantos", base: "/store/mantos", store, categories: [{ id: "c1", name: "Camisas", slug: "camisas" }], products, planned: lists, hero, globals, page: "home" };
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

describe("páginas de produto, catálogo e carrinho", () => {
  const products = Array.from({ length: 6 }, (_, i) => product(i));
  const globals = legacyGlobals({ primaryColor: "#0f172a", accentColor: "#16a34a" }, legacy);
  const page = (kind: "product" | "collection" | "cart", extra: Partial<SectionCtx> = {}, mut?: (t: ReturnType<typeof defaultTemplate>) => ReturnType<typeof defaultTemplate>) => {
    let t = defaultTemplate(kind, legacy); if (mut) t = mut(t);
    const { lists, hero } = planProducts(t, products);
    return renderToStaticMarkup(<SectionList template={t} ctx={{ slug: "mantos", base: "/store/mantos", store, categories: [{ id: "c1", name: "Camisas", slug: "camisas" }], products, planned: lists, hero, globals, page: kind, ...extra }} />);
  };
  it("produto: caminho, título, tamanhos, botão de compra e relacionados", () => {
    const html = page("product", { product: { ...products[0]!, variants: [{ id: "v1", size: "M", available: 3 }] }, related: products.slice(1, 4) });
    for (const t of ["Camisa 0", "Adicionar ao carrinho", "Tamanho", "Você também pode gostar", "Catálogo"]) expect(html).toContain(t);
    expect(html).toContain("etiqueta em até 1 dia útil");
  });
  it("produto: opções de galeria e sem relacionados", () => {
    const base = { product: { ...products[0]!, images: ["https://cdn.exemplo.com/a.webp", "https://cdn.exemplo.com/b.webp"] } };
    expect(page("product", { ...base, related: [] }, (t) => setSetting(t, "product", "gallery", "grid"))).toContain("col-span-2");
    expect(page("product", { ...base, related: [] }, (t) => setSetting(t, "product", "gallery", "thumbs"))).toContain("Ver imagem 2");
    expect(page("product", { ...base, related: [] })).not.toContain("Você também pode gostar");
    expect(page("product", { ...base, related: [] }, (t) => setSetting(t, "product", "showBreadcrumb", false))).not.toContain("Início");
  });
  it("catálogo: cabeçalho, busca, categorias e grade; vazio mostra o texto", () => {
    const html = page("collection", { query: { category: "camisas" } }); expect(html).toContain("Camisas"); expect(html).toContain("6 produtos"); expect(html).toContain('name="q"'); expect(html).toContain("Todos");
    expect(page("collection", { products: [] })).toContain("Nenhum produto encontrado.");
    expect(page("collection", {}, (t) => setSetting(setSetting(t, "header", "showSearch", false), "header", "showCount", false))).not.toContain('name="q"');
  });
  it("carrinho renderiza sem quebrar (vazio)", () => { expect(page("cart")).toContain("Seu carrinho está vazio"); });
});
