import * as React from "react";
import { statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("next/navigation", () => ({ usePathname: () => "/store/x", useRouter: () => ({ push() {}, replace() {} }) }));
vi.mock("@/components/storefront/cart-context", () => ({ useCart: () => ({ count: 0, ready: true, lines: [], add() {}, update() {}, remove() {}, clear() {}, subtotal: 0 }) }));
import { ProductArt } from "@/components/app/product-art";
import { isPhoto } from "@/components/storefront/product-gallery";
import { SectionList, type SectionCtx } from "@/components/storefront/sections";
import { idsBySkus } from "@/lib/queries/storefront";
import { avifOf } from "@/lib/themes/avif";
import { bannerPath, demoBanners } from "@/lib/themes/banners-demo";
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

describe("posições de imagem vazias", () => {
  const base = { slug: "x", base: "/store/x", store: {} as never, categories: [], products: [], planned: {}, hero: undefined, globals: {} as never, page: "home" as const };
  const mosaic = () => {
    const a = addSection({ v: 1, sections: {}, order: [] }, "banner-mosaic", { region: "content", page: "home" });
    let t = a.template; const ids = t.sections[a.id]!.blockOrder;
    t = setBlockSetting(t, a.id, ids[0]!, "image", "/demos/x.webp"); t = setBlockSetting(t, a.id, ids[0]!, "title", "Com foto");
    return t;
  };
  it("na loja publicada, peça sem imagem não aparece; na prévia do editor aparece (para indicar onde falta a foto)", () => {
    const live = renderToStaticMarkup(SectionList({ template: mosaic(), ctx: base as SectionCtx }));
    const editing = renderToStaticMarkup(SectionList({ template: mosaic(), ctx: { ...base, editing: true } as SectionCtx }));
    expect((live.match(/data-banner-empty/g) ?? []).length).toBe(0); expect(live).toContain("Com foto");
    expect((editing.match(/data-banner-empty/g) ?? []).length).toBeGreaterThan(0);
  });
  it("destaque sem nenhuma imagem fica baixo, só com título e chamada", () => {
    const a = addSection({ v: 1, sections: {}, order: [] }, "hero-banner", { region: "content", page: "home" });
    const t = setBlockSetting(a.template, a.id, a.template.sections[a.id]!.blockOrder[0]!, "title", "Campanha");
    const html = renderToStaticMarkup(SectionList({ template: t, ctx: base as SectionCtx }));
    expect(html).toContain("Campanha"); expect(html).toContain("min-h-[260px]"); expect(html).not.toContain("aspect-[4/5]");
  });
});

describe("imagem com texto sem foto", () => {
  it("na loja publicada mostra só o texto; na prévia do editor mostra o espaço da foto", () => {
    const base = { slug: "x", base: "/store/x", store: {} as never, categories: [], products: [], planned: {}, hero: undefined, globals: {} as never, page: "home" as const };
    const a = addSection({ v: 1, sections: {}, order: [] }, "image-with-text", { region: "content", page: "home" });
    const live = renderToStaticMarkup(SectionList({ template: a.template, ctx: base as SectionCtx }));
    const editing = renderToStaticMarkup(SectionList({ template: a.template, ctx: { ...base, editing: true } as SectionCtx }));
    expect(live).toContain("text-center"); expect(live).toContain('class="hidden"');
    expect(editing).not.toContain('class="hidden"');
  });
});

describe("banners das lojas de demonstração (6 imagens por loja: destaque de computador e de celular, 4 atalhos)", () => {
  const onDisk = (p: string) => { try { return statSync(join(process.cwd(), "public", p)).size > 0; } catch { return false; } };

  it("cada loja tem o destaque da 1ª campanha (computador e celular) e um atalho por categoria, todos com AVIF", () => {
    for (const p of Object.values(PACKAGES)) {
      const b = demoBanners(p!, onDisk); const fam = p!.family; const c1 = p!.campaigns[0]!;
      expect(b.forced[`${fam}-hero-1`], p!.slug).toEqual({ image: bannerPath(p!.slug, `hero-${c1.id}__desktop`), imageMobile: bannerPath(p!.slug, `hero-${c1.id}__mobile`), alt: c1.headline });
      for (const f of b.used) { expect(onDisk(f), f).toBe(true); expect(avifOf(f), f).toBeTruthy(); }
      // Linha de Jogo: o pacote traz "chuteiras", que não é categoria do catálogo (Vestuário fica com a imagem do pacote).
      const missing = [...new Set(p!.products.map((x) => x.category))].filter((c) => !b.categoryImages[c]);
      expect(missing, p!.slug).toEqual(p!.slug === "linha-de-jogo" ? ["Vestuário"] : []);
      expect(b.used.length, p!.slug).toBe(p!.slug === "linha-de-jogo" ? 5 : 6);
    }
  });

  it("atalho vira imagem da categoria (grade e banner do topo); campanhas 2 e 3 usam o atalho da categoria dos seus produtos", () => {
    const casa = PACKAGES.casa!; const b = demoBanners(casa, () => true); const at = (c: string) => bannerPath(casa.slug, `atalho-${c}`);
    expect(b.categoryImages).toEqual({ "Decoração": at("decoracao"), "Cozinha": at("cozinha"), "Organização": at("organizacao"), "Têxteis": at("texteis") });
    expect(b.forced["casa-cat-texteis"]!.image).toBe(at("texteis"));
    expect(b.fill["casa-hero-2"]!.image).toBe(at("organizacao")); // campanha "organizar": só produtos de Organização
    expect(b.fill["casa-hero-3"]!.image).toBe(at("texteis")); // "cotidiano": Têxteis é a mais frequente
    // Faixa e blocos de apoio: recortes do destaque (nunca a versão de celular esticada numa área larga)
    expect(b.fill["casa-faixa-1"]!.image).toBe(bannerPath(casa.slug, "hero-acolher__desktop"));
    expect(b.fill["casa-sobre"]!.image).toBe(bannerPath(casa.slug, "hero-acolher__mobile"));
    // Recorte de produto, galeria, camadas e sequência: sem arquivo próprio, ficam como estavam
    for (const id of ["look-1", "camadas-recorte", "camadas-fundo", "seq-1", "imersivo-frente"]) expect(b.fill[`casa-${id}`] ?? b.forced[`casa-${id}`]).toBeUndefined();
    // Sem repetição dentro de uma seção: 4 cartões, 5 peças do mosaico do N4; os 2 cartões do N2 diferem dos 2 apoios
    const nav = [1, 2, 3, 4].map((k) => b.fill[`casa-nav-${k}`]!.image); expect(new Set(nav).size).toBe(4);
    const mosaic = [1, 2, 3, 4, 5].map((k) => b.fill[`casa-mosaico-${k}`]!.image); expect(new Set(mosaic).size).toBe(5);
    expect(new Set([nav[0], nav[1], b.fill["casa-apoio-1"]!.image, b.fill["casa-apoio-2"]!.image]).size).toBe(4);
    // O mosaico do N3 (peças 1 a 3) não repete os atalhos das campanhas 2 e 3 do carrossel logo abaixo
    expect(mosaic.slice(0, 3)).not.toContain(b.fill["casa-hero-2"]!.image); expect(mosaic.slice(0, 3)).not.toContain(b.fill["casa-hero-3"]!.image);
  });

  it("sem arquivo no disco, nenhuma posição recebe caminho (nunca imagem quebrada)", () => {
    expect(demoBanners(PACKAGES.beauty!, () => false)).toEqual({ forced: {}, fill: {}, categoryImages: {}, used: [] });
    // Só o destaque de computador: o celular usa o recorte dele, e nada de atalho inventado
    const only = demoBanners(PACKAGES.beauty!, (f) => f.endsWith("__desktop.webp"));
    expect(only.forced["beauty-hero-1"]!.imageMobile).toBe(""); expect(only.categoryImages).toEqual({}); expect(only.fill["beauty-hero-2"]).toBeUndefined();
  });

  it("no tema, o destaque leva a versão de celular em <source> só para telas estreitas e os atalhos vão para a grade", () => {
    const pkg = PACKAGES.beauty!; const b = demoBanners(pkg, onDisk); const now = new Date("2026-10-01T12:00:00Z");
    const ctx: PresetContext = { storeName: pkg.store, tagline: null, primary: "#000", accent: "#fff", announcement: "", footerText: "", now, media: { ...b.forced, ...b.fill }, categoryImages: b.categoryImages };
    const key = THEME_CATALOG.find((x) => x.family === "beauty" && x.level === 2)!.key;
    const tpl = buildPreset(key, ctx)!.pages.home;
    const html = renderToStaticMarkup(SectionList({ template: tpl, ctx: { slug: "x", base: "/store/x", store: {} as never, categories: [{ id: "c1", name: "Pincéis", slug: "pinceis" }], products: [], planned: {}, hero: undefined, globals: {} as never, page: "home", now } as SectionCtx }));
    expect(html).toContain('media="(max-width: 767px)" type="image/avif" srcSet="/demos/bela-essencia/v1/banners/hero-ritual__mobile.avif"');
    expect(html).toContain('src="/demos/bela-essencia/v1/banners/hero-ritual__desktop.webp"');
    expect(html).toContain("/demos/bela-essencia/v1/banners/atalho-pinceis.webp");
  });
});
