import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("next/navigation", () => ({ usePathname: () => "/store/x", useRouter: () => ({ push() {}, replace() {} }) }));
vi.mock("@/components/storefront/cart-context", () => ({ useCart: () => ({ count: 0, ready: true, lines: [], add() {}, update() {}, remove() {}, clear() {}, subtotal: 0 }) }));
import { ProductArt } from "@/components/app/product-art";
import { isPhoto } from "@/components/storefront/product-gallery";
import { SectionList, type SectionCtx } from "@/components/storefront/sections";
import { idsBySkus } from "@/lib/queries/storefront";
import { avifOf } from "@/lib/themes/avif";
import { THEME_CATALOG } from "@/lib/themes/catalog";
import { PACKAGES, categoryImages, selectionLink } from "@/lib/themes/pacotes";
import { buildPreset, type PresetContext } from "@/lib/themes/presets";
import { addSection, addBlock, setBlockSetting } from "@/lib/themes/template";

describe("pacotes visuais nas lojas de demonstração", () => {
  it("link de campanha mostra exatamente os SKUs pedidos, na ordem, e ignora SKU que a loja não tem", () => {
    const catalog = [{ product: { id: "a", sku: "TU-001" } }, { product: { id: "b", sku: "TU-004" } }, { product: { id: "c", sku: "TU-006" } }];
    expect(idsBySkus(catalog, "TU-006,tu-001,XX-999")).toEqual(["c", "a"]);
    expect(idsBySkus(catalog, "")).toBeNull(); expect(idsBySkus(catalog, undefined)).toBeNull();
    expect(selectionLink(["TU-001", "TU-004"])).toBe("/catalog?produtos=TU-001,TU-004");
  });

  it("os slides e banners dos temas usam a chamada e a seleção de SKUs das campanhas do pacote (texto da página, não na foto)", () => {
    const pkg = PACKAGES.moda!; const [c1] = pkg.campaigns;
    const media = Object.fromEntries(["moda-hero-1"].map((id) => [id, { image: "/demos/x.webp", imageMobile: "", alt: "" }]));
    for (const key of ["trama", "lume", "editorial", "atelier"]) {
      const ctx: PresetContext = { storeName: pkg.store, tagline: null, primary: "#000", accent: "#fff", announcement: "", footerText: "", now: new Date("2026-10-01T12:00:00Z"), media };
      const home = JSON.stringify(buildPreset(key, ctx)!.pages.home);
      expect(home, key).toContain(c1!.headline); expect(home, key).toContain(selectionLink(c1!.skus));
    }
    // Cores da identidade da loja (tinta e destaque) nos temas da família, quando o pacote tem identidade
    const casa = PACKAGES.casa!;
    const style = buildPreset("lar", { storeName: casa.store, tagline: null, primary: "#000", accent: "#fff", announcement: "", footerText: "", now: new Date() })!.style;
    expect(style.primary.toLowerCase()).toBe(casa.palette!.ink.toLowerCase()); expect(style.accent.toLowerCase()).toBe(casa.palette!.accent.toLowerCase());
  });

  it("galeria aceita fotos do próprio site e enviadas; ilustração 'art:' não vira miniatura", () => {
    expect(isPhoto("/demos/trama-urbana/v1/produtos/calca-sarja-01.webp")).toBe(true);
    expect(isPhoto("/assets/ast_abc")).toBe(true); expect(isPhoto("https://x.com/a.jpg")).toBe(true);
    expect(isPhoto("art:#000,#fff,#999")).toBe(false); expect(isPhoto("//evil.com/a.png")).toBe(false);
  });

  it("AVIF com reserva em WebP: a foto do pacote ganha <source type=image/avif>; foto sem AVIF não", () => {
    const first = Object.values(PACKAGES.moda!.assets).find((a) => a.avif)!; const webp = first.src; const avif = first.avif!;
    expect(avifOf(webp)).toBe(avif);
    const html = renderToStaticMarkup(<ProductArt images={[webp]} />);
    expect(html).toContain(`type="image/avif" srcSet="${avif}"`); expect(html).toContain(`src="${webp}"`);
    expect(renderToStaticMarkup(<ProductArt images={["/demos/casa-em-ordem/v1/produtos/vaso-ceramica-01.webp"]} />)).not.toContain("image/avif");
  });

  it("grade de categorias usa a imagem própria da categoria quando há bloco; sem bloco, a foto do primeiro produto", () => {
    const imgs = categoryImages("moda");
    expect(Object.keys(imgs).sort()).toEqual(["Básicos", "Calças", "Camisas", "Conjuntos"]);
    expect(Object.keys(categoryImages("casa")).sort()).toEqual(["Cozinha", "Decoração", "Organização"]); // Têxteis: imagem pendente no pacote
    const t = addSection({ v: 1, sections: {}, order: [] }, "category-grid", { region: "content", page: "home" });
    const r = addBlock(t.template, t.id, "category-image"); let tpl = setBlockSetting(r.template, t.id, r.blockId, "category", "Camisas");
    tpl = setBlockSetting(tpl, t.id, r.blockId, "image", "/demos/trama-urbana/v1/categorias/categoria-camisas.webp");
    const ctx = { slug: "x", base: "/store/x", store: {} as never, categories: [{ id: "c1", name: "Camisas", slug: "camisas" }, { id: "c2", name: "Calças", slug: "calcas" }], products: [{ id: "p", categoryId: "c2", images: ["/demos/p.webp"] }] as never, planned: {}, hero: undefined, globals: {} as never, page: "home" } as SectionCtx;
    const html = renderToStaticMarkup(SectionList({ template: tpl, ctx }));
    expect(html).toContain("categoria-camisas.webp"); expect(html).toContain("/demos/p.webp");
  });

  it("todo tema das famílias com pacote continua válido (sem aviso) com as imagens e categorias do pacote", () => {
    expect(THEME_CATALOG.filter((x) => x.family !== "base").every((x) => PACKAGES[x.family])).toBe(true);
  });
});
