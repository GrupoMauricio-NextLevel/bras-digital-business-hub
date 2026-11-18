import { slugify } from "@/lib/ids";
import { sectionSchema } from "./sections";
import { buildTemplate, normalizeStyle, type SectionSpec } from "./template";
import { ATACADO, BEAUTY, CASA, CONECTA, MODA, SPORT, withPackage } from "./familias-specs";
import { familyBuilders } from "./presets-familia";
import type { PageKind, SettingValue, Template, ThemeGlobals, ThemeStyle } from "./types";

/** Dados da loja que os temas usam para nascer já com o nome, as cores e os textos dela. */
export type PresetContext = { storeName: string; tagline: string | null; primary: string; accent: string; announcement: string; footerText: string; hero?: { title: string; subtitle: string; ctaLabel: string }; /** Fotos opcionais (lojas de demonstração); clientes colocam as próprias pelo editor. */ images?: { hero?: string; about?: string };
  /** Imagens de banner por id do manifesto da família (lojas de demonstração). Sem elas, os banners nascem com o fundo nas cores do tema. */
  media?: Record<string, { image: string; imageMobile?: string; alt: string }>;
  /** Categorias reais da loja (menu grande do N4). */
  categories?: { name: string; slug: string }[];
  /** Imagem própria de cada categoria (nome → imagem), quando a loja tem (lojas de demonstração: pacote visual). */
  categoryImages?: Record<string, string>;
  /** Slides do destaque que a loja já tinha (imagem, celular e textos): temas que preservam os banners do cliente ao instalar. */
  heroSlides?: Record<string, SettingValue>[];
  /** Código do cupom de boas-vindas (lojas de demonstração); clientes escolhem um cupom ativo no editor. */
  welcomeCode?: string;
  now: Date };
export type ThemePreset = { style: ThemeStyle; globals: ThemeGlobals; pages: Record<PageKind, Template> };

export type Item = [string, SectionSpec];
type BlockSpec = { type: string; settings?: Record<string, SettingValue> };
/** Blocos do preset padrão de uma seção, com ajustes opcionais por posição. */
export const blocksOf = (type: string, over: Record<string, SettingValue>[] = []): BlockSpec[] => (sectionSchema(type)!.presets[0]!.blocks ?? []).map((b, i) => ({ type: b.type, settings: { ...(b.settings ?? {}), ...(over[i] ?? {}) } }));
export const untilDays = (now: Date, days: number) => { const d = new Date(now); d.setUTCDate(d.getUTCDate() + days); return `${d.toISOString().slice(0, 10)}T23:59`; };
export const globals = (style: ThemeStyle, header: Item[], footer: Item[]): ThemeGlobals => ({ v: 1, style, header: buildTemplate("header", undefined, header), footer: buildTemplate("footer", undefined, footer.some(([, sp]) => sp.type === "whatsapp-float") ? footer : [...footer, ["wa", { type: "whatsapp-float" }]]) });
const seals = (): Item => ["seals", { type: "security-seals", blocks: blocksOf("security-seals") }];
/** Todos os temas nascem com selos de segurança: na página inicial (no fim), no produto (logo abaixo da compra) e no carrinho. */
const withSeals = (items: Item[], at: number | "end"): Item[] => (items.some(([, sp]) => sp.type === "security-seals") ? items : at === "end" ? [...items, seals()] : [...items.slice(0, at), seals(), ...items.slice(at)]);
export const pages = (home: Item[], product: Item[], collection: Item[], cart: Item[]): Record<PageKind, Template> => ({ home: buildTemplate("content", "home", withSeals(home, "end")), product: buildTemplate("content", "product", withSeals(product, 1)), collection: buildTemplate("content", "collection", collection), cart: buildTemplate("content", "cart", withSeals(cart, "end")) });
export const announcement = (c: PresetContext, fallback: string, tone: string): Item => ["announcement", { type: "announcement-bar", settings: { text: c.announcement.trim() || fallback, tone }, hidden: !c.announcement.trim() && !fallback }];

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

function arena(c: PresetContext): ThemePreset {
  const style = normalizeStyle({ primary: "#0f1c16", accent: "#22c55e", headingFont: "condensada", bodyFont: "moderna", radius: 8, buttons: "solid", quickView: true, animations: true });
  const wa = (): Item => ["cta", { type: "cta-banner", settings: { heading: "Ficou com dúvida? Chame a gente", text: "Atendimento rápido pelo WhatsApp para escolher o tamanho e acompanhar o seu pedido.", buttonLabel: "Chamar no WhatsApp", tone: "neutral" } }];
  return {
    style,
    globals: globals(style, [announcement(c, "", "primary"), ["header", { type: "header", settings: { tone: "dark", sticky: true } }]], [["footer", { type: "footer", settings: { text: c.footerText, tone: "dark" } }]]),
    pages: pages(
      [
        ["arena", { type: "arena-hero", settings: { eyebrow: "NOVA TEMPORADA", heading: c.hero?.title ?? "Vista a paixão. Jogue do seu jeito.", text: c.hero?.subtitle ?? `Os mantos mais desejados estão na ${c.storeName}. Escolha o seu e entre em campo.`, ctaLabel: c.hero?.ctaLabel ?? "Ver lançamentos", ctaLink: "/catalog", secondaryLabel: "Explorar catálogo", secondaryLink: "/catalog", productBadge: "DESTAQUE DA SEMANA", showProduct: true } }],
        ["trust", { type: "trust-bar", blocks: blocksOf("trust-bar") }],
        ["cats", { type: "category-grid", settings: { heading: "Compre por categoria", style: "cards" } }],
        ["best", { type: "product-showcase", settings: { title: "Mais vendidos", subtitle: "Os favoritos da torcida", count: 8, source: "featured" } }],
        ["countdown", { type: "countdown", settings: { heading: "Oferta relâmpago termina em", text: "Defina a data da sua oferta real antes de mostrar.", until: untilDays(c.now, 7), tone: "neutral" }, hidden: true }],
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

function signature(c: PresetContext): ThemePreset {
  const style = normalizeStyle({ primary: "#0f172a", accent: "#c2410c", headingFont: "display", bodyFont: "moderna", radius: 12, buttons: "solid", quickView: true, animations: true });
  return {
    style,
    globals: globals(style, [announcement(c, "", "accent"), ["header", { type: "header-plus", settings: { tone: "light", sticky: true, showSearch: true }, blocks: blocksOf("header-plus") }]], [["footer", { type: "footer", settings: { text: c.footerText, tone: "dark" } }]]),
    pages: pages(
      [
        ["slides", { type: "slideshow", settings: { height: "lg", fullWidth: true }, blocks: blocksOf("slideshow", [{ image: c.images?.hero ?? "", heading: c.hero?.title ?? `Coleção nova na ${c.storeName}`, text: c.hero?.subtitle ?? "Os lançamentos que você esperava, com envio rápido.", ctaLabel: c.hero?.ctaLabel ?? "Ver lançamentos" }]) }],
        ["trust", { type: "trust-bar", blocks: blocksOf("trust-bar") }],
        ["cats", { type: "category-grid", settings: { heading: "Compre por categoria", style: "circles" } }],
        ["latest", { type: "product-showcase", settings: { title: "Novidades", subtitle: "Recém-chegados à loja", source: "latest", count: 8 } }],
        ["promo", { type: "image-hero", settings: { image: c.images?.about ?? "", heading: "Ofertas da temporada", text: "Selecionamos os modelos com os melhores preços.", ctaLabel: "Aproveitar", height: "md", overlay: 45, align: "center" } }],
        ["video", { type: "video-hero", settings: { heading: "Veja em movimento", text: "Cole o link do seu vídeo e mostre a coleção.", fullWidth: false }, hidden: true }],
        ["countdown", { type: "countdown", settings: { heading: "A oferta termina em", text: "Defina a data da sua oferta real antes de mostrar.", until: untilDays(c.now, 7), tone: "accent" }, hidden: true }],
        ["look", { type: "lookbook", blocks: blocksOf("lookbook") }],
        ["proof", { type: "testimonials", blocks: blocksOf("testimonials"), hidden: true }],
        ["faq", { type: "faq", blocks: blocksOf("faq") }],
        ["cta", { type: "cta-banner", settings: { heading: "Atendimento que resolve", text: "Fale com a gente e receba ajuda para escolher o tamanho ideal.", buttonLabel: "Chamar no WhatsApp", tone: "accent" } }],
        ["grid", { type: "product-grid" }],
      ],
      [["product", { type: "product-main", settings: { gallery: "thumbs", stickyBuyBar: true } }], ["tabs", { type: "product-tabs", blocks: blocksOf("product-tabs") }], ["trust", { type: "trust-bar", blocks: blocksOf("trust-bar") }], ["proof", { type: "testimonials", blocks: blocksOf("testimonials"), hidden: true }], ["related", { type: "product-related" }]],
      [["header", { type: "collection-header", settings: { showSort: true } }], ["grid", { type: "collection-grid" }], ["cta", { type: "cta-banner", settings: { tone: "accent", heading: "Precisa de ajuda para escolher?" } }]],
      [["cart", { type: "cart-main" }], ["trust", { type: "trust-bar", blocks: blocksOf("trust-bar") }], ["more", { type: "product-showcase", settings: { title: "Aproveite e leve também", subtitle: "", source: "latest", count: 4 } }]],
    ),
  };
}

/** Manto Premium (D348): camisas de time em preto e dourado; imagens em /public/temas/manto-premium (sem logo de terceiros). */
const MANTO = "/temas/manto-premium";
const MANTO_CATEGORIAS: [string, string, string][] = [
  ["torcedor", "Torcedor", "Camisas versão torcedor"], ["jogador", "Jogador", "Camisas versão jogador"], ["retro", "Retrô", "Camisas retrô, clássicos do futebol"],
  ["selecoes", "Seleções", "Camisas de seleções"], ["nacional", "Linha Nacional", "Times do Brasil"], ["feminino", "Feminino", "Camisas femininas"],
  ["infantil", "Infantil", "Conjuntos infantis"], ["adulto", "Conjuntos Adulto", "Conjuntos adulto, kits completos"], ["nba", "NBA", "Regatas de basquete"], ["grade12", "Grade com 12 peças", "Grade com 12 peças, para revenda"],
];
function manto(c: PresetContext): ThemePreset {
  const style = normalizeStyle({ primary: "#0b0b0b", accent: "#d4af4a", headingFont: "condensada", bodyFont: "moderna", radius: 14, buttons: "solid", quickView: true, animations: true });
  const slides = c.heroSlides?.length ? c.heroSlides.slice(0, 6).map((settings) => ({ type: "slide", settings })) : [{ type: "slide", settings: { title: c.hero?.title ?? "Vista o manto. Viva o jogo.", subtitle: c.hero?.subtitle ?? `Camisas de time, retrô e seleções na ${c.storeName}.`, ctaLabel: c.hero?.ctaLabel ?? "Ver camisas", link: "/catalog" } }];
  const wa = (): Item => ["cta", { type: "cta-banner", settings: { heading: "Dúvida no tamanho? Chame a gente", text: "Atendimento pelo WhatsApp para escolher o tamanho certo e acompanhar o pedido.", buttonLabel: "Chamar no WhatsApp", tone: "neutral" } }];
  return {
    style,
    globals: globals(style, [announcement(c, "Enviamos para todo o Brasil", "primary"), ["header", { type: "header", settings: { tone: "dark", sticky: true } }]], [["footer", { type: "footer", settings: { text: c.footerText, tone: "dark" } }]]),
    pages: pages(
      [
        ["hero", { type: "hero-banner", settings: { height: "lg", fullWidth: true, autoplay: true, interval: 6 }, blocks: slides }],
        ["trust", { type: "trust-bar", blocks: blocksOf("trust-bar") }],
        ["cats", { type: "image-tiles", settings: { heading: "Escolha o seu *manto*", subtitle: "Navegue pelo tipo de camisa", ratio: "portrait", columns: "5", mobileCarousel: true }, blocks: MANTO_CATEGORIAS.map(([arq, nome, alt]) => ({ type: "tile", settings: { image: `${MANTO}/categoria-${arq}.webp`, alt, link: `/catalog?category=${slugify(nome)}` } })) }],
        ["best", { type: "product-showcase", settings: { title: "Mais vendidos", subtitle: "Os favoritos da torcida", count: 8, source: "featured" } }],
        ["precos", { type: "image-tiles", settings: { heading: "Compre por faixa de preço", ratio: "square", columns: "3", mobileCarousel: true }, blocks: [
          { type: "tile", settings: { image: `${MANTO}/preco-ate-60.webp`, alt: "Camisas até 60 reais", link: "/catalog?ate=60&sort=price-asc" } },
          { type: "tile", settings: { image: `${MANTO}/preco-ate-80.webp`, alt: "Camisas até 80 reais", link: "/catalog?ate=80&sort=price-asc" } },
          { type: "tile", settings: { image: `${MANTO}/preco-acima-100.webp`, alt: "Camisas acima de 100 reais", link: "/catalog?acima=100&sort=price-asc" } },
        ] }],
        ["latest", { type: "product-showcase", settings: { title: "Lançamentos", subtitle: "Recém-chegados", source: "latest", count: 8 } }],
        ["faq", { type: "faq", blocks: blocksOf("faq") }],
        wa(),
        ["grid", { type: "product-grid" }],
      ],
      [["product", { type: "product-main", settings: { gallery: "thumbs", stickyBuyBar: true } }], ["tabs", { type: "product-tabs", blocks: blocksOf("product-tabs") }], ["trust", { type: "trust-bar", blocks: blocksOf("trust-bar") }], ["related", { type: "product-related" }]],
      [["header", { type: "collection-header", settings: { showSort: true } }], ["grid", { type: "collection-grid" }], wa()],
      [["cart", { type: "cart-main" }], ["trust", { type: "trust-bar", blocks: blocksOf("trust-bar") }], ["more", { type: "product-showcase", settings: { title: "Aproveite e leve também", subtitle: "", source: "latest", count: 4 } }]],
    ),
  };
}

// Famílias (composição por nível em presets-familia.ts; identidade em familias-specs.ts). Arena (N3 Sport) mantém a
// composição com que já é vendido; os demais temas das famílias usam o construtor do nível.
const [trama, lume, editorial, atelier] = familyBuilders(withPackage(MODA, "moda"));
const [lar, ninho, varanda, morada] = familyBuilders(withPackage(CASA, "casa"));
const [lance, torcida, , podio] = familyBuilders(withPackage(SPORT, "sport"));
const [petala, brilho, aura, musa] = familyBuilders(withPackage(BEAUTY, "beauty"));
const [sinal, pulso, circuito, orbita] = familyBuilders(withPackage(CONECTA, "conecta"));
const [fardo, lote, galpao, porto] = familyBuilders(withPackage(ATACADO, "atacado"));
const BUILDERS: Record<string, (c: PresetContext) => ThemePreset> = { starter, signature, trama, lume, editorial, atelier, lar, ninho, varanda, morada, lance, torcida, arena, podio, manto, petala, brilho, aura, musa, sinal, pulso, circuito, orbita, fardo, lote, galpao, porto };
export const presetKeys = Object.keys(BUILDERS);
export function buildPreset(key: string, ctx: PresetContext): ThemePreset | null { return BUILDERS[key]?.(ctx) ?? null; }
