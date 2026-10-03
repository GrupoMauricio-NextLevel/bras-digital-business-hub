import { sectionSchema } from "./sections";
import { buildTemplate, normalizeStyle, type SectionSpec } from "./template";
import type { PageKind, SettingValue, Template, ThemeGlobals, ThemeStyle } from "./types";

/** Dados da loja que os temas usam para nascer já com o nome, as cores e os textos dela. */
export type PresetContext = { storeName: string; tagline: string | null; primary: string; accent: string; announcement: string; footerText: string; hero?: { title: string; subtitle: string; ctaLabel: string }; /** Fotos opcionais (lojas de demonstração); clientes colocam as próprias pelo editor. */ images?: { hero?: string; about?: string }; now: Date };
export type ThemePreset = { style: ThemeStyle; globals: ThemeGlobals; pages: Record<PageKind, Template> };

type Item = [string, SectionSpec];
type BlockSpec = { type: string; settings?: Record<string, SettingValue> };
/** Blocos do preset padrão de uma seção, com ajustes opcionais por posição. */
const blocksOf = (type: string, over: Record<string, SettingValue>[] = []): BlockSpec[] => (sectionSchema(type)!.presets[0]!.blocks ?? []).map((b, i) => ({ type: b.type, settings: { ...(b.settings ?? {}), ...(over[i] ?? {}) } }));
const untilDays = (now: Date, days: number) => { const d = new Date(now); d.setUTCDate(d.getUTCDate() + days); return `${d.toISOString().slice(0, 10)}T23:59`; };
const globals = (style: ThemeStyle, header: Item[], footer: Item[]): ThemeGlobals => ({ v: 1, style, header: buildTemplate("header", undefined, header), footer: buildTemplate("footer", undefined, footer.some(([, sp]) => sp.type === "whatsapp-float") ? footer : [...footer, ["wa", { type: "whatsapp-float" }]]) });
const seals = (): Item => ["seals", { type: "security-seals", blocks: blocksOf("security-seals") }];
/** Todos os temas nascem com selos de segurança: na página inicial (no fim), no produto (logo abaixo da compra) e no carrinho. */
const withSeals = (items: Item[], at: number | "end"): Item[] => (items.some(([, sp]) => sp.type === "security-seals") ? items : at === "end" ? [...items, seals()] : [...items.slice(0, at), seals(), ...items.slice(at)]);
const pages = (home: Item[], product: Item[], collection: Item[], cart: Item[]): Record<PageKind, Template> => ({ home: buildTemplate("content", "home", withSeals(home, "end")), product: buildTemplate("content", "product", withSeals(product, 1)), collection: buildTemplate("content", "collection", collection), cart: buildTemplate("content", "cart", withSeals(cart, "end")) });
const announcement = (c: PresetContext, fallback: string, tone: string): Item => ["announcement", { type: "announcement-bar", settings: { text: c.announcement.trim() || fallback, tone }, hidden: !c.announcement.trim() && !fallback }];

// ---------------------------------------------------------------------------
function starter(c: PresetContext): ThemePreset {
  const style = normalizeStyle({ primary: c.primary, accent: c.accent, headingFont: "display", bodyFont: "moderna", radius: 20 });
  return {
    style,
    globals: globals(style, [announcement(c, "", "primary"), ["header", { type: "header" }]], [["footer", { type: "footer", settings: { text: c.footerText } }]]),
    pages: pages(
      [
        ["hero", { type: "hero", settings: { title: c.hero?.title ?? `Bem-vindo à ${c.storeName}`, subtitle: c.hero?.subtitle ?? "Produtos selecionados com envio para todo o Brasil.", ctaLabel: c.hero?.ctaLabel ?? "Ver catálogo", layout: "wide", background: "soft" } }],
        ["trust", { type: "trust-bar", blocks: blocksOf("trust-bar") }],
        ["categories", { type: "category-chips" }],
        ["showcase", { type: "product-showcase" }],
        ["banners", { type: "promo-banners", blocks: [{ type: "banner", settings: { title: "Confira as novidades", subtitle: "Modelos novos toda semana", tone: "accent", link: "/catalog" } }] }],
        ["about", { type: "rich-text", settings: { heading: `Sobre a ${c.storeName}`, body: c.tagline ? c.tagline : "Conte a história da sua loja em poucas linhas." } }],
        ["grid", { type: "product-grid" }],
      ],
      [["product", { type: "product-main", settings: { gallery: "thumbs" } }], ["trust", { type: "trust-bar", blocks: blocksOf("trust-bar") }], ["related", { type: "product-related" }]],
      [["header", { type: "collection-header" }], ["grid", { type: "collection-grid" }]],
      [["cart", { type: "cart-main" }]],
    ),
  };
}

/** Degrau de entrada dos temas pagos: o mesmo padrão de página em segmentos e cores diferentes (Lume, Ninho…). */
type EntryLook = { primary: string; accent: string; headingFont: string; radius: number; catStyle: "circles" | "cards"; heroFallback: { title: (name: string) => string; text: string; cta: string }; featured: { title: string; subtitle: string }; aboutCta: string };
function entryTheme(c: PresetContext, look: EntryLook): ThemePreset {
  const style = normalizeStyle({ primary: look.primary, accent: look.accent, headingFont: look.headingFont, bodyFont: "moderna", radius: look.radius, buttons: "solid", quickView: true, animations: false });
  const help = (): Item => ["cta", { type: "cta-banner", settings: { heading: "Ficou com dúvida? Chame a gente", text: "Atendimento pelo WhatsApp para escolher e acompanhar o pedido.", buttonLabel: "Chamar no WhatsApp", tone: "neutral" } }];
  return {
    style,
    globals: globals(style, [announcement(c, "Frete grátis acima de R$ 299", "primary"), ["header", { type: "header", settings: { tone: "light", sticky: true } }]], [["footer", { type: "footer", settings: { text: c.footerText, tone: "light" } }]]),
    pages: pages(
      [
        ["hero", { type: "image-hero", settings: { image: c.images?.hero ?? "", heading: c.hero?.title ?? look.heroFallback.title(c.storeName), text: c.hero?.subtitle ?? look.heroFallback.text, ctaLabel: c.hero?.ctaLabel ?? look.heroFallback.cta, height: "lg", overlay: 35, align: "left", fullWidth: true } }],
        ["trust", { type: "trust-bar", blocks: blocksOf("trust-bar") }],
        ["cats", { type: "category-grid", settings: { heading: "Compre por categoria", style: look.catStyle } }],
        ["featured", { type: "product-showcase", settings: { title: look.featured.title, subtitle: look.featured.subtitle, source: "featured", count: 4 } }],
        ["about", { type: "image-with-text", settings: { image: c.images?.about ?? "", heading: `Sobre a ${c.storeName}`, body: c.tagline ?? "Conte em poucas linhas o que torna a sua loja especial.", ctaLabel: look.aboutCta, ratio: "square" } }],
        ["latest", { type: "product-showcase", settings: { title: "Acabaram de chegar", subtitle: "", source: "latest", count: 4 } }],
        ["faq", { type: "faq", blocks: blocksOf("faq") }],
        help(),
        ["grid", { type: "product-grid" }],
      ],
      [["product", { type: "product-main", settings: { gallery: "thumbs", stickyBuyBar: true, shippingNote: "Envio para todo o Brasil · etiqueta em até 1 dia útil após a confirmação" } }], ["tabs", { type: "product-tabs", blocks: blocksOf("product-tabs") }], ["trust", { type: "trust-bar", blocks: blocksOf("trust-bar") }], ["related", { type: "product-related" }]],
      [["header", { type: "collection-header", settings: { showSort: true } }], ["grid", { type: "collection-grid" }], help()],
      [["cart", { type: "cart-main" }], ["trust", { type: "trust-bar", blocks: blocksOf("trust-bar") }], ["more", { type: "product-showcase", settings: { title: "Aproveite e leve também", subtitle: "", source: "latest", count: 4 } }]],
    ),
  };
}
const lume = (c: PresetContext) => entryTheme(c, { primary: "#1f2a44", accent: "#be185d", headingFont: "display", radius: 14, catStyle: "circles", heroFallback: { title: (n) => `Novidades na ${n}`, text: "Peças escolhidas com carinho, com envio para todo o Brasil.", cta: "Ver novidades" }, featured: { title: "Escolhidos para você", subtitle: "Os destaques da loja" }, aboutCta: "Conhecer o catálogo" });
const ninho = (c: PresetContext) => entryTheme(c, { primary: "#2f4a3a", accent: "#b4532a", headingFont: "editorial", radius: 10, catStyle: "cards", heroFallback: { title: (n) => `Deixe a casa com a sua cara na ${n}`, text: "Móveis e peças de decoração escolhidos para o seu lar, com envio para todo o Brasil.", cta: "Ver a coleção" }, featured: { title: "Para o seu lar", subtitle: "Os destaques da casa" }, aboutCta: "Ver todos os móveis" });

function arena(c: PresetContext): ThemePreset {
  const style = normalizeStyle({ primary: "#0f1c16", accent: "#22c55e", headingFont: "condensada", bodyFont: "moderna", radius: 8, buttons: "solid", quickView: true, animations: true });
  const wa = (): Item => ["cta", { type: "cta-banner", settings: { heading: "Ficou com dúvida? Chame a gente", text: "Atendimento rápido pelo WhatsApp para escolher o tamanho e acompanhar o seu pedido.", buttonLabel: "Chamar no WhatsApp", tone: "neutral" } }];
  return {
    style,
    globals: globals(style, [announcement(c, "Frete grátis acima de R$ 299", "primary"), ["header", { type: "header", settings: { tone: "dark", sticky: true } }]], [["footer", { type: "footer", settings: { text: c.footerText, tone: "dark" } }]]),
    pages: pages(
      [
        ["arena", { type: "arena-hero", settings: { eyebrow: "NOVA TEMPORADA", heading: c.hero?.title ?? "Vista a paixão. Jogue do seu jeito.", text: c.hero?.subtitle ?? `Os mantos mais desejados estão na ${c.storeName}. Escolha o seu e entre em campo.`, ctaLabel: c.hero?.ctaLabel ?? "Ver lançamentos", ctaLink: "/catalog", secondaryLabel: "Explorar catálogo", secondaryLink: "/catalog", productBadge: "DESTAQUE DA SEMANA", showProduct: true } }],
        ["trust", { type: "trust-bar", blocks: blocksOf("trust-bar") }],
        ["cats", { type: "category-grid", settings: { heading: "Compre por categoria", style: "cards" } }],
        ["best", { type: "product-showcase", settings: { title: "Mais vendidos", subtitle: "Os favoritos da torcida", count: 8, source: "featured" } }],
        ["countdown", { type: "countdown", settings: { heading: "Oferta relâmpago termina em", text: "Aproveite os preços da semana.", until: untilDays(c.now, 7), tone: "neutral" } }],
        ["banners", { type: "promo-banners", blocks: [{ type: "banner", settings: { title: "Coleção nova", subtitle: "Acabou de chegar", tone: "primary", link: "/catalog" } }, { type: "banner", settings: { title: "Clássicos", subtitle: "Peças que viraram história", tone: "accent", link: "/catalog" } }] }],
        ["latest", { type: "product-showcase", settings: { title: "Lançamentos", subtitle: "Recém-chegados", source: "latest", count: 4 } }],
        ["faq", { type: "faq", blocks: blocksOf("faq") }],
        wa(),
        ["grid", { type: "product-grid" }],
      ],
      [["product", { type: "product-main", settings: { gallery: "thumbs", stickyBuyBar: true } }], ["trust", { type: "trust-bar", blocks: blocksOf("trust-bar") }], ["faq", { type: "faq", blocks: blocksOf("faq") }], ["related", { type: "product-related" }]],
      [["header", { type: "collection-header", settings: { showSort: true } }], ["grid", { type: "collection-grid" }], wa()],
      [["cart", { type: "cart-main" }], ["trust", { type: "trust-bar", blocks: blocksOf("trust-bar") }], ["more", { type: "product-showcase", settings: { title: "Aproveite e leve também", subtitle: "", source: "latest", count: 4 } }]],
    ),
  };
}

function editorial(c: PresetContext): ThemePreset {
  const style = normalizeStyle({ primary: "#1c1917", accent: "#a16207", headingFont: "elegante", bodyFont: "moderna", radius: 0, buttons: "outline", quickView: false, animations: true });
  return {
    style,
    globals: globals(style, [announcement(c, "", "neutral"), ["header", { type: "header", settings: { tone: "light" } }]], [["footer", { type: "footer", settings: { text: c.footerText, tone: "light" } }]]),
    pages: pages(
      [
        ["hero", { type: "image-hero", settings: { image: c.images?.hero ?? "", heading: c.hero?.title ?? "A coleção da estação", text: c.hero?.subtitle ?? "Peças pensadas para durar, com acabamento que faz diferença.", ctaLabel: c.hero?.ctaLabel ?? "Ver a coleção", height: "lg", fullWidth: true, overlay: 35, align: "left" } }],
        ["about", { type: "image-with-text", settings: { image: c.images?.about ?? "", heading: "Feito para durar", body: `Na ${c.storeName}, cada peça é escolhida pelo caimento, pelo tecido e pelo acabamento.`, ctaLabel: "Conhecer o catálogo", ratio: "portrait" } }],
        ["cats", { type: "category-grid", settings: { heading: "Compre por categoria", columns: 3, style: "cards" } }],
        ["showcase", { type: "product-showcase", settings: { title: "Seleção da estação", subtitle: "", source: "featured", count: 4 } }],
        ["look", { type: "lookbook", blocks: blocksOf("lookbook") }],
        ["proof", { type: "testimonials", blocks: blocksOf("testimonials") }],
        ["story", { type: "image-with-text", settings: { heading: "Nossa história", body: c.tagline ?? "Conte de onde vem a sua marca e o que a torna única.", reverse: true, ratio: "square" } }],
        ["faq", { type: "faq", blocks: blocksOf("faq") }],
        ["cta", { type: "cta-banner", settings: { heading: "Receba novidades primeiro", text: "Fale com a gente no WhatsApp e entre na lista de lançamentos.", buttonLabel: "Entrar na lista", tone: "light" } }],
        ["grid", { type: "product-grid" }],
      ],
      [["product", { type: "product-main", settings: { gallery: "thumbs" } }], ["tabs", { type: "product-tabs", blocks: blocksOf("product-tabs") }], ["proof", { type: "testimonials", blocks: blocksOf("testimonials") }], ["related", { type: "product-related" }]],
      [["header", { type: "collection-header" }], ["grid", { type: "collection-grid", settings: { columns: 3 } }], ["cta", { type: "cta-banner", settings: { tone: "light", heading: "Não achou o que procurava?" } }]],
      [["cart", { type: "cart-main" }], ["trust", { type: "trust-bar", blocks: blocksOf("trust-bar") }]],
    ),
  };
}

function signature(c: PresetContext): ThemePreset {
  const style = normalizeStyle({ primary: "#0f172a", accent: "#c2410c", headingFont: "display", bodyFont: "moderna", radius: 12, buttons: "solid", quickView: true, animations: true });
  return {
    style,
    globals: globals(style, [announcement(c, "Frete grátis acima de R$ 299 · Envio em até 1 dia útil", "accent"), ["header", { type: "header-plus", settings: { tone: "light", sticky: true, showSearch: true }, blocks: blocksOf("header-plus") }]], [["footer", { type: "footer", settings: { text: c.footerText, tone: "dark" } }]]),
    pages: pages(
      [
        ["slides", { type: "slideshow", settings: { height: "lg", fullWidth: true }, blocks: blocksOf("slideshow", [{ image: c.images?.hero ?? "", heading: c.hero?.title ?? `Coleção nova na ${c.storeName}`, text: c.hero?.subtitle ?? "Os lançamentos que você esperava, com envio rápido.", ctaLabel: c.hero?.ctaLabel ?? "Ver lançamentos" }]) }],
        ["trust", { type: "trust-bar", blocks: blocksOf("trust-bar") }],
        ["cats", { type: "category-grid", settings: { heading: "Compre por categoria", style: "circles" } }],
        ["latest", { type: "product-showcase", settings: { title: "Novidades", subtitle: "Recém-chegados à loja", source: "latest", count: 8 } }],
        ["promo", { type: "image-hero", settings: { image: c.images?.about ?? "", heading: "Ofertas da temporada", text: "Selecionamos os modelos com os melhores preços.", ctaLabel: "Aproveitar", height: "md", overlay: 45, align: "center" } }],
        ["video", { type: "video-hero", settings: { heading: "Veja em movimento", text: "Cole o link do seu vídeo e mostre a coleção.", fullWidth: false }, hidden: true }],
        ["countdown", { type: "countdown", settings: { heading: "A oferta termina em", until: untilDays(c.now, 7), tone: "accent" } }],
        ["look", { type: "lookbook", blocks: blocksOf("lookbook") }],
        ["proof", { type: "testimonials", blocks: blocksOf("testimonials") }],
        ["faq", { type: "faq", blocks: blocksOf("faq") }],
        ["cta", { type: "cta-banner", settings: { heading: "Atendimento que resolve", text: "Fale com a gente e receba ajuda para escolher o tamanho ideal.", buttonLabel: "Chamar no WhatsApp", tone: "accent" } }],
        ["grid", { type: "product-grid" }],
      ],
      [["product", { type: "product-main", settings: { gallery: "thumbs", stickyBuyBar: true } }], ["tabs", { type: "product-tabs", blocks: blocksOf("product-tabs") }], ["trust", { type: "trust-bar", blocks: blocksOf("trust-bar") }], ["proof", { type: "testimonials", blocks: blocksOf("testimonials") }], ["related", { type: "product-related" }]],
      [["header", { type: "collection-header", settings: { showSort: true } }], ["grid", { type: "collection-grid" }], ["cta", { type: "cta-banner", settings: { tone: "accent", heading: "Precisa de ajuda para escolher?" } }]],
      [["cart", { type: "cart-main" }], ["trust", { type: "trust-bar", blocks: blocksOf("trust-bar") }], ["more", { type: "product-showcase", settings: { title: "Aproveite e leve também", subtitle: "", source: "latest", count: 4 } }]],
    ),
  };
}

const BUILDERS: Record<string, (c: PresetContext) => ThemePreset> = { starter, lume, ninho, arena, editorial, signature };
export const presetKeys = Object.keys(BUILDERS);
export function buildPreset(key: string, ctx: PresetContext): ThemePreset | null { return BUILDERS[key]?.(ctx) ?? null; }
