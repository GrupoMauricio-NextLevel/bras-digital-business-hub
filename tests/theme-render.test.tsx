// @vitest-environment node
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({ usePathname: () => "/store/x", useRouter: () => ({ push() {}, replace() {} }) }));
vi.mock("@/components/storefront/cart-context", () => {
  const cart = { count: 0, ready: true, lines: [], linhasBase: [], regras: [], atacadoLigado: false, precificado: { linhas: [], subtotalCents: 0, varejoCents: 0, economiaCents: 0, pecas: 0, mix: [], atacadoGeral: false }, add() {}, update() {}, remove() {}, clear() {}, subtotal: 0 };
  return { useCart: () => cart, useCartOptional: () => cart, linhaDoMotor: (l: never) => l };
});
vi.mock("sonner", () => ({ toast: Object.assign(() => {}, { success() {}, error() {} }) }));

import { SectionList, type SectionCtx } from "@/components/storefront/sections";
import { parseMenuChildren } from "@/components/storefront/sections/premium";
import type { ThemeSettingsData } from "@/db/schema";
import { SECTION_SCHEMAS } from "@/lib/themes/sections";
import { addSection, defaultTemplate, setBlockSetting, legacyGlobals, normalizeTemplate, planProducts, setSectionHidden, setSetting, templateFromLegacy } from "@/lib/themes/template";
import type { PublicProduct } from "@/lib/queries/storefront";

const legacy: ThemeSettingsData = { heroTitle: "Vista o manto", heroSubtitle: "Camisas oficiais", heroCta: "Ver catálogo", announcement: "Frete grátis", banners: [{ title: "Lançamento", subtitle: "Coleção nova", tone: "accent" }], showCategories: true, footerText: "Mantos Shop" };
const store = { id: "s1", name: "Mantos Shop", slug: "mantos", tagline: "Os mantos que a torcida ama", whatsapp: "5511999990001", instagram: "mantosshop", logoText: "MS", offer: "STORE_SUBDOMAIN", primaryColor: "#0f172a", accentColor: "#16a34a" } as never;
const product = (i: number): PublicProduct => ({ id: `p${i}`, slug: `camisa-${i}`, name: `Camisa ${i}`, description: "", seoTitle: "", seoDescription: "", images: [], categoryId: "c1", categoryName: "Camisas", priceCents: 12000, packPriceCents: null, tiers: [], atacadoCents: null, featured: i < 4, sellsUnit: true, sellsPack: false, available: 5, variants: [], packs: [] });

function render(template = templateFromLegacy(legacy), products: PublicProduct[] = Array.from({ length: 9 }, (_, i) => product(i)), region: "content" | "header" | "footer" = "content") {
  const globals = legacyGlobals({ primaryColor: "#0f172a", accentColor: "#16a34a" }, legacy);
  const { lists, hero } = planProducts(template, products);
  const ctx: SectionCtx = { slug: "mantos", base: "/store/mantos", store, brandCode: "SUPERDROP", categories: [{ id: "c1", name: "Camisas", slug: "camisas" }], products, planned: lists, hero, globals, page: "home" };
  const t = region === "header" ? globals.header : region === "footer" ? globals.footer : template;
  return renderToStaticMarkup(<SectionList template={t} ctx={ctx} />);
}

describe("renderização das seções", () => {
  it("a página inicial da loja atual traz todas as seções na ordem, com os textos do lojista", () => {
    const html = render();
    const ids = [...html.matchAll(/data-section-id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toEqual(["hero", "trust", "categories", "showcase", "banners", "grid", "seals"]);
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
    expect(html).not.toContain("Central Sports"); expect(html).not.toContain("1 dia útil");
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

describe("seções dos temas pagos", () => {
  const products = Array.from({ length: 6 }, (_, i) => product(i));
  const globals = legacyGlobals({ primaryColor: "#0f172a", accentColor: "#16a34a" }, legacy);
  const build = (type: string, region: "content" | "header" = "content", mut?: (t: ReturnType<typeof normalizeTemplate>["template"], id: string) => ReturnType<typeof normalizeTemplate>["template"], page: "home" | "product" = "home") => {
    const empty = normalizeTemplate({ v: 1, order: [], sections: {} }, region).template;
    const added = addSection(empty, type, { region, page }); const t = mut ? mut(added.template, added.id) : added.template;
    return renderToStaticMarkup(<SectionList template={t} region={region} ctx={{ slug: "mantos", base: "/store/mantos", store, categories: [{ id: "c1", name: "Camisas", slug: "camisas" }], products, planned: {}, hero: products[0], globals, page, product: { ...products[0]!, description: "Descrição <b>do</b> produto" } }} />);
  };
  it("destaque com imagem: primeiro vira título principal e o fundo usa a imagem escapada", () => {
    const html = build("image-hero", "content", (t, id) => setSetting(t, id, "image", "https://cdn.exemplo.com/a.webp")); expect(html).toContain("<h1"); expect(html).toContain('url(&quot;https://cdn.exemplo.com/a.webp&quot;)'); expect(html).toContain("/store/mantos/catalog");
    const two = renderToStaticMarkup(<SectionList template={setSectionHidden(addSection(addSection(normalizeTemplate({ v: 1, order: [], sections: {} }, "content").template, "image-hero", { region: "content", page: "home" }).template, "cta-banner", { region: "content", page: "home" }).template, "cta-banner", false)} ctx={{ slug: "mantos", base: "/store/mantos", store, categories: [], products, planned: {}, hero: products[0], globals, page: "home" }} />);
    expect(two.match(/<h1/g)?.length).toBe(1);
  });
  it("apresentação de slides com setas, pontos e só um título principal", () => {
    const html = build("slideshow"); expect(html).toContain('aria-roledescription="carrossel"'); expect(html).toContain("Slide anterior"); expect(html.match(/<h1/g)?.length).toBe(1); expect((html.match(/aria-roledescription="slide"/g) ?? []).length).toBe(3);
  });
  it("vídeo: arquivo, YouTube sem cookies e link inválido não gera vídeo", () => {
    expect(build("video-hero", "content", (t, id) => setSetting(t, id, "video", "https://cdn.exemplo.com/promo.mp4"))).toContain("<video");
    const yt = build("video-hero", "content", (t, id) => setSetting(t, id, "video", "https://youtu.be/dQw4w9WgXcQ")); expect(yt).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ"); expect(yt).not.toContain("<video");
    const bad = build("video-hero", "content", (t, id) => setSetting(t, id, "video", "javascript:alert(1)")); expect(bad).not.toContain("<video"); expect(bad).not.toContain("<iframe");
  });
  it("categorias, imagem com texto, depoimentos, lookbook e chamada", () => {
    expect(build("category-grid")).toContain("/store/mantos/catalog?category=camisas");
    expect(build("image-with-text", "content", (t, id) => setSetting(t, id, "body", "**Forte** <script>x</script>"))).not.toContain("<script>");
    const dep = build("testimonials"); expect(dep).toContain("Troque por um depoimento real"); expect(dep).toContain("5 de 5 estrelas");
    // Lookbook sem foto: na loja publicada some (D86); com foto, aparece com o título.
    expect(build("lookbook")).not.toContain("Dia de jogo");
    expect(build("lookbook", "content", (t, id) => { let x = t; for (const b of t.sections[id]!.blockOrder) x = setBlockSetting(x, id, b, "image", "/demos/x.webp"); return x; })).toContain("Dia de jogo"); expect(build("cta-banner")).toContain("https://wa.me/5511999990001");
  });
  it("perguntas frequentes trazem dados estruturados sem fechar o script", () => {
    const html = build("faq", "content", (t, id) => setSetting(t, id, "heading", "</script><b>x")); expect(html).toContain("FAQPage"); expect(html).toContain("<details"); expect(html.split("</script>").length).toBe(2);
  });
  it("contagem regressiva renderiza sem data e com data futura", () => {
    expect(build("countdown")).toContain("A oferta termina em"); expect(build("countdown", "content", (t, id) => setSetting(t, id, "until", "2099-12-31T23:59"))).toContain('role="timer"');
  });
  it("abas do produto usam a descrição do produto com HTML escapado", () => {
    const html = build("product-tabs", "content", undefined, "product"); expect(html).toContain("Descrição"); expect(html).toContain("Descrição &lt;b>do&lt;/b> produto"); expect(html).not.toContain("<b>do</b>");
  });
  it("cabeçalho com menu grande: itens, submenu, busca e tom escuro", () => {
    const html = build("header-plus", "header", (t, id) => setSetting(t, id, "tone", "dark"));
    expect(html).toContain("Camisas"); expect(html).toContain('role="combobox"'); expect(html).toContain("bg-neutral-950/95");
    expect(parseMenuChildren("Todas | /catalog\nsem link\n | /x\nOfertas | /ofertas")).toEqual([{ label: "Todas", href: "/catalog" }, { label: "Ofertas", href: "/ofertas" }]);
  });
  it("compra rápida aparece nos cartões só quando ligada no estilo", () => {
    const g = { ...globals, style: { ...globals.style, quickView: true } };
    const t = templateFromLegacy(legacy);
    const html = renderToStaticMarkup(<SectionList template={t} ctx={{ slug: "mantos", base: "/store/mantos", store, categories: [], products, planned: planProducts(t, products).lists, hero: products[0], globals: g, page: "home" }} />);
    expect(html).toContain("Compra rápida"); expect(render()).not.toContain("Compra rápida");
  });
});
