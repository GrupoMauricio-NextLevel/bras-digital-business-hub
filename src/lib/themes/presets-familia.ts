/**
 * Quatro níveis de tema para QUALQUER família, sobre o mesmo motor: cada família entra só com a sua identidade (estilos
 * e textos) e os ids das imagens do manifesto (`<família>-hero-1`, `<família>-mosaico-3`…). A composição por nível é a
 * mesma em todas as famílias, então o que um nível acrescenta é previsível e comparável:
 *  - N1 (Grátis): composição fixa com 4 posições de imagem (1 destaque, 2 apoios, 1 faixa), categorias e vitrines.
 *  - N2 (NextLevel Commerce): 2 slides, categorias em círculo, compra rápida, abas, FAQ e imagem com texto.
 *  - N3 (Commerce PRO): carrossel de 3, mosaico, galeria de inspiração, banner entre vitrines e na coleção, ordenação.
 *  - N4 (Commerce ULTIMATE): menu grande com busca, carrossel automático com campanha agendada, mosaico 1+4, movimento.
 * Textos do sistema ficam fora das fotos; nenhuma promessa de frete, prazo, desconto ou depoimento inventado.
 */
import type { PresetContext, ThemePreset } from "./presets";
import { announcement, blocksOf, globals, pages, type Item } from "./presets";
import { normalizeStyle } from "./template";
import type { SettingValue, ThemeStyle } from "./types";

type Txt = string | ((store: string) => string);
export type Slot = { title: Txt; subtitle?: Txt; cta?: string; link?: string; align?: "left" | "center" | "right" };
type Focus = Record<string, SettingValue>;
export type FamilySpec = {
  /** Prefixo dos ids de imagem no manifesto (igual à família). */
  id: string;
  styles: [Partial<ThemeStyle>, Partial<ThemeStyle>, Partial<ThemeStyle>, Partial<ThemeStyle>];
  /** Foco das imagens principais (o manifesto descreve a área livre para o texto). */
  heroFocus?: Focus; stripFocus?: Focus;
  support: [Slot, Slot]; strip: Slot;
  fallbackCategories: { name: string; slug: string }[];
  n1: { hero: Slot; cats: string; latest: string; featured: string };
  n2: { hero: Slot; hero2: Slot; cats: string; featured: string; featuredSub: string; latest: string; about: { heading: Txt; body: Txt } };
  n3: { hero: Slot; hero2: Slot; hero3: Slot; mosaicHeading: string; mosaic: [Slot, Slot, Slot]; featured: string; latest: string; gallery: { heading: string; subtitle: string; items: [string, string, string, string] }; about: { heading: Txt; body: Txt } };
  n4: { hero: Slot; campaign: Slot; cats: string; mosaic: [string, string, string, string, string]; featured: string; latest: string };
};

const txt = (t: Txt | undefined, c: PresetContext) => (typeof t === "function" ? t(c.storeName) : t ?? "");
/** Configurações de um banner: imagem do manifesto (se houver), foco e textos. */
function banner(c: PresetContext, assetId: string, s: Slot, extra: Focus = {}): Record<string, SettingValue> {
  const m = c.media?.[assetId];
  return { image: m?.image ?? "", imageMobile: m?.imageMobile ?? "", alt: m?.alt ?? "", title: txt(s.title, c), subtitle: txt(s.subtitle, c), ctaLabel: s.cta ?? "", link: s.link ?? "/catalog", ...(s.align ? { align: s.align } : {}), overlay: 30, ...extra };
}
/** O destaque principal respeita o que o lojista já tinha escrito (troca de tema não apaga o texto dele). */
const hero = (c: PresetContext, s: Slot): Slot => ({ ...s, title: c.hero?.title ?? txt(s.title, c), subtitle: c.hero?.subtitle ?? txt(s.subtitle, c), cta: c.hero?.ctaLabel ?? s.cta });
const style = (base: Partial<ThemeStyle>) => normalizeStyle({ bodyFont: "moderna", buttons: "solid", quickView: false, animations: false, ...base });
const footer = (c: PresetContext, tone: "light" | "dark"): Item[] => [["footer", { type: "footer", settings: { text: c.footerText, tone } }]];
const stripItem = (c: PresetContext, f: FamilySpec, height?: string): Item => ["faixa", { type: "banner-strip", ...(height ? { settings: { height } } : {}), blocks: [{ type: "banner", settings: banner(c, `${f.id}-faixa-1`, f.strip, f.stripFocus) }] }];
const supportItem = (c: PresetContext, f: FamilySpec, ratio?: string): Item => ["apoio", { type: "banner-duo", ...(ratio ? { settings: { ratio } } : {}), blocks: f.support.map((s, i) => ({ type: "banner", settings: banner(c, `${f.id}-apoio-${i + 1}`, s) })) }];
const productPage = (gallery: string, related: Focus = {}): Item[] => [["product", { type: "product-main", settings: { gallery, stickyBuyBar: true } }], ["tabs", { type: "product-tabs", blocks: blocksOf("product-tabs") }], ["related", { type: "product-related", settings: related }]];

/** N1 — Grátis. */
export const levelOne = (f: FamilySpec) => (c: PresetContext): ThemePreset => {
  const st = style(f.styles[0]);
  return {
    style: st,
    globals: globals(st, [announcement(c, "", "primary"), ["header", { type: "header", settings: { tone: "light", sticky: true } }]], footer(c, "dark")),
    pages: pages(
      [
        ["hero", { type: "hero-banner", settings: { height: "md", fullWidth: true }, blocks: [{ type: "slide", settings: banner(c, `${f.id}-hero-1`, hero(c, f.n1.hero), f.heroFocus) }] }],
        ["cats", { type: "category-chips", settings: { heading: f.n1.cats } }],
        ["novidades", { type: "product-showcase", settings: { title: f.n1.latest, subtitle: "", source: "latest", count: 8, columns: 4 } }],
        supportItem(c, f),
        ["destaques", { type: "product-showcase", settings: { title: f.n1.featured, subtitle: "", source: "featured", count: 4 } }],
        stripItem(c, f),
        ["about", { type: "rich-text", settings: { heading: `Sobre a ${c.storeName}`, body: c.tagline ?? "Conte a história da sua marca em poucas linhas." } }],
        ["grid", { type: "product-grid" }],
      ],
      [["product", { type: "product-main", settings: { gallery: "thumbs" } }], ["related", { type: "product-related" }]],
      [["header", { type: "collection-header" }], ["grid", { type: "collection-grid" }]],
      [["cart", { type: "cart-main" }]],
    ),
  };
};

/** N2 — NextLevel Commerce. */
export const levelTwo = (f: FamilySpec) => (c: PresetContext): ThemePreset => {
  const st = style({ quickView: true, ...f.styles[1] });
  return {
    style: st,
    globals: globals(st, [announcement(c, "", "primary"), ["header", { type: "header", settings: { tone: "light", sticky: true } }]], footer(c, "light")),
    pages: pages(
      [
        ["hero", { type: "hero-banner", settings: { height: "lg", fullWidth: true }, blocks: [
          { type: "slide", settings: banner(c, `${f.id}-hero-1`, hero(c, f.n2.hero), f.heroFocus) },
          { type: "slide", settings: banner(c, `${f.id}-hero-2`, f.n2.hero2) },
        ] }],
        ["cats", { type: "category-grid", settings: { heading: f.n2.cats, style: "circles" } }],
        ["destaques", { type: "product-showcase", settings: { title: f.n2.featured, subtitle: f.n2.featuredSub, source: "featured", count: 4 } }],
        supportItem(c, f, "portrait"),
        ["novidades", { type: "product-showcase", settings: { title: f.n2.latest, subtitle: "", source: "latest", count: 4 } }],
        ["sobre", { type: "image-with-text", settings: { image: c.media?.[`${f.id}-sobre`]?.image ?? c.images?.about ?? "", heading: txt(f.n2.about.heading, c), body: c.tagline ?? txt(f.n2.about.body, c), ctaLabel: "Conhecer o catálogo", ratio: "square" } }],
        stripItem(c, f),
        ["faq", { type: "faq", blocks: blocksOf("faq") }],
        ["grid", { type: "product-grid" }],
      ],
      productPage("thumbs"),
      [["header", { type: "collection-header", settings: { showSort: false } }], ["grid", { type: "collection-grid" }]],
      [["cart", { type: "cart-main" }], ["more", { type: "product-showcase", settings: { title: "Aproveite e leve também", subtitle: "", source: "latest", count: 4 } }]],
    ),
  };
};

/** N3 — Commerce PRO. */
export const levelThree = (f: FamilySpec) => (c: PresetContext): ThemePreset => {
  const st = style({ quickView: true, ...f.styles[2] });
  const g = f.n3.gallery;
  return {
    style: st,
    globals: globals(st, [announcement(c, "", "neutral"), ["header", { type: "header", settings: { tone: "light" } }]], footer(c, "light")),
    pages: pages(
      [
        ["hero", { type: "hero-banner", settings: { height: "lg", fullWidth: true, autoplay: false }, blocks: [
          { type: "slide", settings: banner(c, `${f.id}-hero-1`, hero(c, f.n3.hero), f.heroFocus) },
          { type: "slide", settings: banner(c, `${f.id}-hero-2`, f.n3.hero2) },
          { type: "slide", settings: banner(c, `${f.id}-hero-3`, f.n3.hero3) },
        ] }],
        ["mosaico", { type: "banner-mosaic", settings: { layout: "1-2", heading: f.n3.mosaicHeading }, blocks: f.n3.mosaic.map((s, i) => ({ type: "banner", settings: banner(c, `${f.id}-mosaico-${i + 1}`, s) })) }],
        ["destaques", { type: "product-showcase", settings: { title: f.n3.featured, subtitle: "", source: "featured", count: 4 } }],
        stripItem(c, f, "md"),
        ["novidades", { type: "product-showcase", settings: { title: f.n3.latest, subtitle: "", source: "latest", count: 4 } }],
        ["look", { type: "lookbook", settings: { heading: g.heading, subtitle: g.subtitle }, blocks: g.items.map((title, i) => ({ type: "look", settings: { image: c.media?.[`${f.id}-look-${i + 1}`]?.image ?? "", title, link: "/catalog" } })) }],
        ["sobre", { type: "image-with-text", settings: { image: c.media?.[`${f.id}-sobre`]?.image ?? "", heading: txt(f.n3.about.heading, c), body: txt(f.n3.about.body, c), ctaLabel: "Conhecer o catálogo", ratio: "portrait" } }],
        ["proof", { type: "testimonials", blocks: blocksOf("testimonials"), hidden: true }],
        ["faq", { type: "faq", blocks: blocksOf("faq") }],
        ["grid", { type: "product-grid" }],
      ],
      productPage("thumbs"),
      [["header", { type: "collection-header", settings: { showSort: true } }], ["faixa", { type: "banner-strip", blocks: [{ type: "banner", settings: banner(c, `${f.id}-faixa-1`, { title: f.strip.title, cta: f.strip.cta, link: f.strip.link }, f.stripFocus) }] }], ["grid", { type: "collection-grid", settings: { columns: 3 } }]],
      [["cart", { type: "cart-main" }], ["more", { type: "product-showcase", settings: { title: "Combine com", subtitle: "", source: "featured", count: 4 } }]],
    ),
  };
};

/** Data da campanha de exemplo (começa daqui a `days` dias às 9h) no formato do editor (horário de Brasília). */
const brt = (now: Date, days: number) => { const d = new Date(now.getTime() - 3 * 3600_000); d.setUTCDate(d.getUTCDate() + days); return `${d.toISOString().slice(0, 10)}T09:00`; };

/** N4 — Commerce ULTIMATE. */
export const levelFour = (f: FamilySpec) => (c: PresetContext): ThemePreset => {
  const st = style({ quickView: true, animations: true, ...f.styles[3] });
  const cats = c.categories?.length ? c.categories : f.fallbackCategories;
  const menu = cats.slice(0, 6).map((k) => ({ type: "menu-item", settings: { label: k.name, link: `/catalog?category=${k.slug}`, children: "" } }));
  return {
    style: st,
    globals: globals(st, [announcement(c, "", "accent"), ["header", { type: "header-plus", settings: { tone: "light", sticky: true, showSearch: true }, blocks: [...menu, { type: "menu-item", settings: { label: "Tudo", link: "/catalog", children: "" } }] }]], footer(c, "dark")),
    pages: pages(
      [
        ["hero", { type: "hero-banner", settings: { height: "lg", fullWidth: true, autoplay: true, interval: 7 }, blocks: [
          { type: "slide", settings: banner(c, `${f.id}-hero-1`, hero(c, f.n4.hero), f.heroFocus) },
          { type: "slide", settings: banner(c, `${f.id}-hero-4`, f.n4.campaign, { startsAt: brt(c.now, 3), endsAt: brt(c.now, 10) }) },
          { type: "slide", settings: banner(c, `${f.id}-hero-2`, { ...f.n3.hero2, align: "center" }) },
          { type: "slide", settings: banner(c, `${f.id}-hero-3`, { ...f.n3.hero3, align: "right" }) },
        ] }],
        ["cats", { type: "category-grid", settings: { heading: f.n4.cats, style: "circles", showCount: false } }],
        ["mosaico", { type: "banner-mosaic", settings: { layout: "1-4" }, blocks: f.n4.mosaic.map((title, i) => ({ type: "banner", settings: banner(c, `${f.id}-mosaico-${i + 1}`, { title, link: f.n3.mosaic[i]?.link }) })) }],
        ["destaques", { type: "product-showcase", settings: { title: f.n4.featured, subtitle: "", source: "featured", count: 8 } }],
        supportItem(c, f, "portrait"),
        ["look", { type: "lookbook", settings: { heading: f.n3.gallery.heading, subtitle: f.n3.gallery.subtitle }, blocks: f.n3.gallery.items.map((title, i) => ({ type: "look", settings: { image: c.media?.[`${f.id}-look-${i + 1}`]?.image ?? "", title, link: "/catalog" } })) }],
        ["novidades", { type: "product-showcase", settings: { title: f.n4.latest, subtitle: "", source: "latest", count: 4 } }],
        ["countdown", { type: "countdown", settings: { heading: "A campanha termina em", text: "Defina a data da sua campanha real antes de mostrar.", until: brt(c.now, 10), tone: "accent" }, hidden: true }],
        ["faq", { type: "faq", blocks: blocksOf("faq") }],
        ["grid", { type: "product-grid" }],
      ],
      productPage("grid", { count: 8 }),
      [["hero", { type: "hero-banner", settings: { height: "sm", fullWidth: false }, blocks: [{ type: "slide", settings: banner(c, `${f.id}-faixa-1`, { title: "Toda a coleção" }, f.stripFocus) }] }], ["header", { type: "collection-header", settings: { showSort: true } }], ["grid", { type: "collection-grid", settings: { columns: 3 } }]],
      [["cart", { type: "cart-main" }], ["more", { type: "product-showcase", settings: { title: "Combine com", subtitle: "", source: "featured", count: 4 } }]],
    ),
  };
};

/** Os quatro construtores de uma família, na ordem N1 a N4. */
export const familyBuilders = (f: FamilySpec) => [levelOne(f), levelTwo(f), levelThree(f), levelFour(f)] as const;
