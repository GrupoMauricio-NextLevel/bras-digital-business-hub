/**
 * Quatro níveis de tema para QUALQUER família, sobre o mesmo motor: cada família entra só com a sua identidade (estilos
 * e textos) e os ids das imagens do manifesto (`<família>-hero-1`, `<família>-mosaico-3`…). A composição por nível é a
 * mesma em todas as famílias, então o que um nível acrescenta é previsível e comparável:
 *  - N1 (Grátis, D237): home completa: carrossel de 3, dupla, cartões, mosaico, faixa, sobre e perguntas; banner por categoria.
 *  - N2 (Profissional): 2 slides, categorias em círculo, compra rápida, abas, FAQ e imagem com texto.
 *  - N3 (Avançado): carrossel de 3, mosaico, galeria de inspiração, banner entre vitrines e na coleção, ordenação.
 *  - N4 (Exclusivo): menu grande com busca, carrossel automático com campanha agendada, mosaico 1+4, movimento.
 * Textos do sistema ficam fora das fotos; nenhuma promessa de frete, prazo, desconto ou depoimento inventado.
 */
import type { PresetContext, ThemePreset } from "./presets";
import { announcement, blocksOf, globals, pages, type Item } from "./presets";
import { normalizeStyle } from "./template";
import type { SettingValue, ThemeStyle } from "./types";
import { slugify } from "@/lib/ids";
import type { FamilyBanners, NavTxt } from "./familias-banners";

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
  n3: { hero: Slot; hero2: Slot; hero3: Slot; mosaicHeading: string; mosaic: [Slot, Slot, Slot]; featured: string; latest: string; gallery: { heading: string; subtitle: string; items: [string, string, string, string]; links?: string[] }; about: { heading: Txt; body: Txt } };
  n4: { hero: Slot; campaign: Slot; cats: string; mosaic: [string, string, string, string, string]; mosaicLinks?: string[]; featured: string; latest: string };
  /** Banners que organizam a navegação (D88): destaque em camadas, imersivo, cartões, banner de categoria, cupom. */
  banners?: FamilyBanners;
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
/** Blocos de imagem de categoria (só as categorias com imagem própria). */
const catBlocks = (c: PresetContext) => Object.entries(c.categoryImages ?? {}).map(([category, image]) => ({ type: "category-image", settings: { category, image } }));
const productPage = (gallery: string, related: Focus = {}): Item[] => [["product", { type: "product-main", settings: { gallery, stickyBuyBar: true } }], ["tabs", { type: "product-tabs", blocks: blocksOf("product-tabs") }], ["related", { type: "product-related", settings: related }]];

// ------------------------------------------------------------------ banners de navegação (D88)
type Lv = 2 | 3 | 4;
const m = (c: PresetContext, id: string) => c.media?.[id];
/** Cartões de navegação: N2 usa os dois com texto próprio do N2; N3 e N4, os quatro. */
const navItem = (c: PresetContext, f: FamilySpec, lv: Lv): Item | null => {
  const b = f.banners; if (!b) return null;
  const cards = b.nav.map((n, i) => ({ n, i, t: (lv === 2 ? n.n2 : lv === 3 ? n.n3 : n.n4) as NavTxt | undefined })).filter((x) => x.t);
  return ["navegue", { type: "nav-cards", settings: { heading: "" }, blocks: cards.slice(0, lv === 2 ? 2 : 4).map(({ n, i, t }) => {
    const img = m(c, `${f.id}-nav-${i + 1}`);
    return { type: "card", settings: { image: img?.image ?? "", alt: img?.alt ?? "", eyebrow: t!.eyebrow ?? "", title: t!.title, subtitle: t!.subtitle ?? "", ctaLabel: t!.cta, link: n.link } };
  }) }];
};
/** Cupom de boas-vindas: nasce com o código do cupom da demonstração (lojas reais escolhem o delas no editor). */
const welcomeItem = (c: PresetContext, f: FamilySpec, lv: Lv): Item | null => {
  const b = f.banners; if (!b) return null;
  const w = lv === 2 ? { eyebrow: "BOAS-VINDAS", ...b.welcome.n2 } : lv === 3 ? b.welcome.n3 : { eyebrow: "", ...b.welcome.n4 };
  const img = m(c, `${f.id}-cupom`);
  return ["boas-vindas", { type: "welcome-coupon", settings: { code: c.welcomeCode ?? "", image: img?.image ?? "", alt: img?.alt ?? "", eyebrow: w.eyebrow, title: w.title, subtitle: w.subtitle, note: "Sem spam. Cancele quando quiser.", delay: 10 } }];
};
/** Fundo do destaque em camadas/imersivo: a imagem própria quando existe; senão a do destaque principal (nunca vazio à toa). */
const layerBg = (c: PresetContext, f: FamilySpec, key: "camadas" | "imersivo") => {
  const own = m(c, `${f.id}-${key}-fundo`); const h = m(c, `${f.id}-hero-1`);
  return own?.image ? { background: own.image, backgroundMobile: own.imageMobile ?? "" } : { background: h?.image ?? "", backgroundMobile: h?.imageMobile ?? "" };
};
const layersItem = (c: PresetContext, f: FamilySpec): Item | null => {
  const b = f.banners?.layers; if (!b) return null;
  const cut = m(c, `${f.id}-camadas-recorte`);
  return ["hero", { type: "hero-layers", settings: { ...layerBg(c, f, "camadas"), ...f.heroFocus, cutout: cut?.image ?? "", alt: cut?.alt ?? "", eyebrow: b.eyebrow, title: c.hero?.title ?? b.title, subtitle: c.hero?.subtitle ?? b.subtitle, ctaLabel: c.hero?.ctaLabel ?? b.cta, link: "/catalog", secondaryLabel: b.secondary, secondaryLink: b.secondaryLink ?? "/catalog", note: "", overlay: 25, motion: true } }];
};
const immersiveItem = (c: PresetContext, f: FamilySpec): Item | null => {
  const b = f.banners?.immersive; if (!b) return null;
  const cut = m(c, `${f.id}-imersivo-recorte`); const fg = m(c, `${f.id}-imersivo-frente`);
  const frames = [1, 2, 3].map((k) => m(c, `${f.id}-seq-${k}`)?.image ?? "");
  return ["hero", { type: "hero-immersive", settings: { ...layerBg(c, f, "imersivo"), ...f.heroFocus, cutout: cut?.image ?? "", alt: cut?.alt ?? "", foreground: fg?.image ?? "", frame1: frames[0]!, frame2: frames[1]!, frame3: frames[2]!, ctaLabel: b.cta, link: "/catalog", secondaryLabel: b.secondary, secondaryLink: b.secondaryLink ?? "/catalog", note: "", mobileTitle: b.mobileTitle, overlay: 25 },
    blocks: b.steps.map((st) => ({ type: "step", settings: { eyebrow: st.eyebrow ?? "", title: st.title, subtitle: st.subtitle ?? "" } })) }];
};
/** Banner do topo de cada categoria (N3/N4): um geral (todos os produtos) e um por categoria, com a imagem da categoria. */
const categoryBannerItem = (c: PresetContext, f: FamilySpec, lv: 3 | 4): Item | null => {
  const b = f.banners; if (!b) return null;
  const cats = c.categories?.length ? c.categories : f.fallbackCategories;
  const strip = m(c, `${f.id}-faixa-1`);
  const general = { type: "banner", settings: { category: "", image: strip?.image ?? "", imageMobile: strip?.imageMobile ?? "", alt: "", title: "Toda a coleção", subtitle: "", ...f.stripFocus } };
  return ["banner-categoria", { type: "category-banner", blocks: [general, ...cats.slice(0, 11).map((k) => {
    const own = m(c, `${f.id}-cat-${slugify(k.name)}`); const img = own?.image || c.categoryImages?.[k.name] || "";
    const sub = b.categories[k.name];
    return { type: "banner", settings: { category: k.slug, image: img, imageMobile: own?.imageMobile ?? "", alt: "", title: lv === 4 && sub ? sub.n4 : k.name, subtitle: lv === 3 ? sub?.n3 ?? "" : "" } };
  })] }];
};
const present = (...items: (Item | null)[]): Item[] => items.filter((x): x is Item => !!x);

/** N1 — Grátis. D237 (L1): home completa, com banners em várias frentes (carrossel de 3, dupla, cartões, mosaico, faixa). */
export const levelOne = (f: FamilySpec) => (c: PresetContext): ThemePreset => {
  const st = style(f.styles[0]);
  return {
    style: st,
    globals: globals(st, [announcement(c, "", "primary"), ["header", { type: "header", settings: { tone: "light", sticky: true } }]], footer(c, "dark")),
    pages: pages(
      [
        ["hero", { type: "hero-banner", settings: { height: "md", fullWidth: true }, blocks: [
          { type: "slide", settings: banner(c, `${f.id}-hero-1`, hero(c, f.n1.hero), f.heroFocus) },
          { type: "slide", settings: banner(c, `${f.id}-hero-2`, f.n2.hero2) },
          { type: "slide", settings: banner(c, `${f.id}-hero-3`, f.n3.hero3) },
        ] }],
        ["cats", { type: "category-chips", settings: { heading: f.n1.cats } }],
        ["novidades", { type: "product-showcase", settings: { title: f.n1.latest, subtitle: "", source: "latest", count: 8, columns: 4 } }],
        supportItem(c, f),
        ...present(navItem(c, f, 2)),
        ["destaques", { type: "product-showcase", settings: { title: f.n1.featured, subtitle: "", source: "featured", count: 4 } }],
        ["mosaico", { type: "banner-mosaic", settings: { layout: "1-2", heading: f.n3.mosaicHeading }, blocks: f.n3.mosaic.map((sl, i) => ({ type: "banner", settings: banner(c, `${f.id}-mosaico-${i + 1}`, sl) })) }],
        stripItem(c, f),
        ["sobre", { type: "image-with-text", settings: { image: c.media?.[`${f.id}-sobre`]?.image ?? "", heading: `Sobre a ${c.storeName}`, body: c.tagline ?? "Conte a história da sua marca em poucas linhas.", ctaLabel: "Conhecer o catálogo", ratio: "square" } }],
        ["faq", { type: "faq", blocks: blocksOf("faq") }],
        ["grid", { type: "product-grid" }],
      ],
      [["product", { type: "product-main", settings: { gallery: "thumbs" } }], ["related", { type: "product-related" }]],
      f.banners ? [categoryBannerItem(c, f, 3)!, ["header", { type: "collection-header" }], ["grid", { type: "collection-grid" }]] : [["header", { type: "collection-header" }], ["grid", { type: "collection-grid" }]],
      [["cart", { type: "cart-main" }]],
    ),
  };
};

/** N2 — NextLevel E-commerce. */
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
        ["cats", { type: "category-grid", settings: { heading: f.n2.cats, style: "circles" }, blocks: catBlocks(c) }],
        ["destaques", { type: "product-showcase", settings: { title: f.n2.featured, subtitle: f.n2.featuredSub, source: "featured", count: 4 } }],
        ...present(navItem(c, f, 2)),
        supportItem(c, f, "portrait"),
        ["novidades", { type: "product-showcase", settings: { title: f.n2.latest, subtitle: "", source: "latest", count: 4 } }],
        ["sobre", { type: "image-with-text", settings: { image: c.media?.[`${f.id}-sobre`]?.image ?? c.images?.about ?? "", heading: txt(f.n2.about.heading, c), body: c.tagline ?? txt(f.n2.about.body, c), ctaLabel: "Conhecer o catálogo", ratio: "square" } }],
        stripItem(c, f),
        ["faq", { type: "faq", blocks: blocksOf("faq") }],
        ...present(welcomeItem(c, f, 2)),
        ["grid", { type: "product-grid" }],
      ],
      productPage("thumbs"),
      [["header", { type: "collection-header", settings: { showSort: false } }], ["grid", { type: "collection-grid" }]],
      [["cart", { type: "cart-main" }], ["more", { type: "product-showcase", settings: { title: "Aproveite e leve também", subtitle: "", source: "latest", count: 4 } }]],
    ),
  };
};

/** N3 — Avançado. */
export const levelThree = (f: FamilySpec) => (c: PresetContext): ThemePreset => {
  const st = style({ quickView: true, ...f.styles[2] });
  const g = f.n3.gallery;
  return {
    style: st,
    globals: globals(st, [announcement(c, "", "neutral"), ["header", { type: "header", settings: { tone: "light" } }]], footer(c, "light")),
    pages: pages(
      [
        // Com banners de navegação: destaque em camadas na abertura e as campanhas num carrossel mais abaixo.
        ...(f.banners ? present(layersItem(c, f), ["cats", { type: "category-grid", settings: { heading: f.n2.cats, style: "circles", showCount: false }, blocks: catBlocks(c) }], navItem(c, f, 3)) : [["hero", { type: "hero-banner", settings: { height: "lg", fullWidth: true, autoplay: false }, blocks: [
          { type: "slide", settings: banner(c, `${f.id}-hero-1`, hero(c, f.n3.hero), f.heroFocus) },
          { type: "slide", settings: banner(c, `${f.id}-hero-2`, f.n3.hero2) },
          { type: "slide", settings: banner(c, `${f.id}-hero-3`, f.n3.hero3) },
        ] }] as Item]),
        ["mosaico", { type: "banner-mosaic", settings: { layout: "1-2", heading: f.n3.mosaicHeading }, blocks: f.n3.mosaic.map((s, i) => ({ type: "banner", settings: banner(c, `${f.id}-mosaico-${i + 1}`, s) })) }],
        ["destaques", { type: "product-showcase", settings: { title: f.n3.featured, subtitle: "", source: "featured", count: 4 } }],
        ...(f.banners ? [["campanhas", { type: "hero-banner", settings: { height: "md", fullWidth: false, autoplay: false }, blocks: [
          { type: "slide", settings: banner(c, `${f.id}-hero-2`, f.n3.hero2) },
          { type: "slide", settings: banner(c, `${f.id}-hero-3`, f.n3.hero3) },
        ] }] as Item] : []),
        stripItem(c, f, "md"),
        ["novidades", { type: "product-showcase", settings: { title: f.n3.latest, subtitle: "", source: "latest", count: 4 } }],
        ["look", { type: "lookbook", settings: { heading: g.heading, subtitle: g.subtitle }, blocks: g.items.map((title, i) => ({ type: "look", settings: { image: c.media?.[`${f.id}-look-${i + 1}`]?.image ?? "", title, link: g.links?.[i] ?? "/catalog" } })) }],
        ["sobre", { type: "image-with-text", settings: { image: c.media?.[`${f.id}-sobre`]?.image ?? "", heading: txt(f.n3.about.heading, c), body: txt(f.n3.about.body, c), ctaLabel: "Conhecer o catálogo", ratio: "portrait" } }],
        ["proof", { type: "testimonials", blocks: blocksOf("testimonials"), hidden: true }],
        ["faq", { type: "faq", blocks: blocksOf("faq") }],
        ...present(welcomeItem(c, f, 3)),
        ["grid", { type: "product-grid" }],
      ],
      productPage("thumbs"),
      f.banners ? [categoryBannerItem(c, f, 3)!, ["header", { type: "collection-header", settings: { showSort: true } }], ["grid", { type: "collection-grid", settings: { columns: 3 } }]] : [["header", { type: "collection-header", settings: { showSort: true } }], ["faixa", { type: "banner-strip", blocks: [{ type: "banner", settings: banner(c, `${f.id}-faixa-1`, { title: f.strip.title, cta: f.strip.cta, link: f.strip.link }, f.stripFocus) }] }], ["grid", { type: "collection-grid", settings: { columns: 3 } }]],
      [["cart", { type: "cart-main" }], ["more", { type: "product-showcase", settings: { title: "Combine com", subtitle: "", source: "featured", count: 4 } }]],
    ),
  };
};

/** Data da campanha de exemplo (começa daqui a `days` dias às 9h) no formato do editor (horário de Brasília). */
const brt = (now: Date, days: number) => { const d = new Date(now.getTime() - 3 * 3600_000); d.setUTCDate(d.getUTCDate() + days); return `${d.toISOString().slice(0, 10)}T09:00`; };

/** N4 — Exclusivo. */
export const levelFour = (f: FamilySpec) => (c: PresetContext): ThemePreset => {
  const st = style({ quickView: true, animations: true, ...f.styles[3] });
  const cats = c.categories?.length ? c.categories : f.fallbackCategories;
  const menu = cats.slice(0, 6).map((k) => ({ type: "menu-item", settings: { label: k.name, link: `/catalog?category=${k.slug}`, children: "" } }));
  return {
    style: st,
    globals: globals(st, [announcement(c, "", "accent"), ["header", { type: "header-plus", settings: { tone: "light", sticky: true, showSearch: true }, blocks: [...menu, { type: "menu-item", settings: { label: "Tudo", link: "/catalog", children: "" } }] }]], footer(c, "dark")),
    pages: pages(
      [
        ...present(immersiveItem(c, f)),
        [f.banners ? "campanhas" : "hero", { type: "hero-banner", settings: { height: f.banners ? "md" : "lg", fullWidth: !f.banners, autoplay: true, interval: 7 }, blocks: [
          // Com o destaque imersivo na abertura, a foto principal não se repete no carrossel de campanhas.
          ...(f.banners ? [] : [{ type: "slide", settings: banner(c, `${f.id}-hero-1`, hero(c, f.n4.hero), f.heroFocus) }]),
          { type: "slide", settings: banner(c, `${f.id}-hero-4`, f.n4.campaign, { startsAt: brt(c.now, 3), endsAt: brt(c.now, 10) }) },
          { type: "slide", settings: banner(c, `${f.id}-hero-2`, { ...f.n3.hero2, align: "center" }) },
          { type: "slide", settings: banner(c, `${f.id}-hero-3`, { ...f.n3.hero3, align: "right" }) },
        ] }],
        ["cats", { type: "category-grid", settings: { heading: f.n4.cats, style: "circles", showCount: false }, blocks: catBlocks(c) }],
        ...present(navItem(c, f, 4)),
        ["mosaico", { type: "banner-mosaic", settings: { layout: "1-4" }, blocks: f.n4.mosaic.map((title, i) => ({ type: "banner", settings: banner(c, `${f.id}-mosaico-${i + 1}`, { title, link: f.n4.mosaicLinks?.[i] ?? f.n3.mosaic[i]?.link }) })) }],
        ["destaques", { type: "product-showcase", settings: { title: f.n4.featured, subtitle: "", source: "featured", count: 8 } }],
        supportItem(c, f, "portrait"),
        ["look", { type: "lookbook", settings: { heading: f.n3.gallery.heading, subtitle: f.n3.gallery.subtitle }, blocks: f.n3.gallery.items.map((title, i) => ({ type: "look", settings: { image: c.media?.[`${f.id}-look-${i + 1}`]?.image ?? "", title, link: f.n3.gallery.links?.[i] ?? "/catalog" } })) }],
        ["novidades", { type: "product-showcase", settings: { title: f.n4.latest, subtitle: "", source: "latest", count: 4 } }],
        ["countdown", { type: "countdown", settings: { heading: "A campanha termina em", text: "Defina a data da sua campanha real antes de mostrar.", until: brt(c.now, 10), tone: "accent" }, hidden: true }],
        ["faq", { type: "faq", blocks: blocksOf("faq") }],
        ...present(welcomeItem(c, f, 4)),
        ["grid", { type: "product-grid" }],
      ],
      productPage("grid", { count: 8 }),
      f.banners ? [categoryBannerItem(c, f, 4)!, ["header", { type: "collection-header", settings: { showSort: true } }], ["grid", { type: "collection-grid", settings: { columns: 3 } }]] : [["hero", { type: "hero-banner", settings: { height: "sm", fullWidth: false }, blocks: [{ type: "slide", settings: banner(c, `${f.id}-faixa-1`, { title: "Toda a coleção" }, f.stripFocus) }] }], ["header", { type: "collection-header", settings: { showSort: true } }], ["grid", { type: "collection-grid", settings: { columns: 3 } }]],
      [["cart", { type: "cart-main" }], ["more", { type: "product-showcase", settings: { title: "Combine com", subtitle: "", source: "featured", count: 4 } }]],
    ),
  };
};

/** Os quatro construtores de uma família, na ordem N1 a N4. */
export const familyBuilders = (f: FamilySpec) => [levelOne(f), levelTwo(f), levelThree(f), levelFour(f)] as const;
