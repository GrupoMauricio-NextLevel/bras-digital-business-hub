/**
 * Família Moda: quatro níveis sobre o MESMO catálogo e as MESMAS imagens (loja de demonstração "Trama Urbana").
 * Cada nível acrescenta módulos e composição; nenhum troca as fotos por piores. Identidades:
 *  - Trama (N1): urbana e limpa, tipografia de destaque, cantos pequenos, cor ferrugem.
 *  - Lume (N2): delicada, círculos de categoria, rosa, compra rápida e abas.
 *  - Editorial (N3): revista, serifa, cantos retos, mosaico e lookbook.
 *  - Atelier (N4): marca de autor, menu grande com busca, carrossel com campanha agendada, movimento discreto.
 * Textos do sistema ficam fora das fotos; nenhuma promessa de frete, prazo ou desconto sem regra configurada.
 */
import type { PresetContext, ThemePreset } from "./presets";
import { announcement, blocksOf, globals, pages, type Item } from "./presets";
import { normalizeStyle } from "./template";
import type { SettingValue } from "./types";

/** Configurações de um banner: imagem (da demonstração, se houver), foco e textos. */
function banner(c: PresetContext, id: string, text: { title?: string; subtitle?: string; ctaLabel?: string; link?: string; align?: string; textColor?: string; overlay?: number }, extra: Record<string, SettingValue> = {}): Record<string, SettingValue> {
  const m = c.media?.[id];
  return { image: m?.image ?? "", imageMobile: m?.imageMobile ?? "", alt: m?.alt ?? "", title: text.title ?? "", subtitle: text.subtitle ?? "", ctaLabel: text.ctaLabel ?? "", link: text.link ?? "/catalog", ...(text.align ? { align: text.align } : {}), ...(text.textColor ? { textColor: text.textColor } : {}), overlay: text.overlay ?? 30, ...extra };
}
const essentials = (c: PresetContext) => ({ product: [["product", { type: "product-main", settings: { gallery: "thumbs" } }], ["related", { type: "product-related" }]] as Item[], cart: [["cart", { type: "cart-main" }]] as Item[], about: ["about", { type: "rich-text", settings: { heading: `Sobre a ${c.storeName}`, body: c.tagline ?? "Conte a história da sua marca em poucas linhas." } }] as Item });
const heroTitle = (c: PresetContext, fallback: string) => c.hero?.title ?? fallback;

// N1 — composição fixa: 1 destaque, 2 banners de apoio, 1 faixa (4 posições), categorias e vitrines.
export function modaTrama(c: PresetContext): ThemePreset {
  const style = normalizeStyle({ primary: "#1c1c1c", accent: "#9a3412", headingFont: "display", bodyFont: "moderna", radius: 6, buttons: "solid", quickView: false, animations: false });
  const e = essentials(c);
  return {
    style,
    globals: globals(style, [announcement(c, "", "primary"), ["header", { type: "header", settings: { tone: "light", sticky: true } }]], [["footer", { type: "footer", settings: { text: c.footerText, tone: "dark" } }]]),
    pages: pages(
      [
        ["hero", { type: "hero-banner", settings: { height: "md", fullWidth: true }, blocks: [{ type: "slide", settings: banner(c, "moda-hero-1", { title: heroTitle(c, "Coleção da estação"), subtitle: c.hero?.subtitle ?? "Básicos que combinam com tudo.", ctaLabel: c.hero?.ctaLabel ?? "Ver coleção" }, { focusX: 70, focusMobileX: 50, focusMobileY: 40 }) }] }],
        ["cats", { type: "category-chips", settings: { heading: "Compre por categoria" } }],
        ["novidades", { type: "product-showcase", settings: { title: "Novidades", subtitle: "", source: "latest", count: 8, columns: 4 } }],
        ["apoio", { type: "banner-duo", blocks: [{ type: "banner", settings: banner(c, "moda-apoio-1", { title: "Peças avulsas", ctaLabel: "Ver" }) }, { type: "banner", settings: banner(c, "moda-apoio-2", { title: "Acessórios", ctaLabel: "Ver" }) }] }],
        ["destaques", { type: "product-showcase", settings: { title: "Mais procurados", subtitle: "", source: "featured", count: 4 } }],
        ["faixa", { type: "banner-strip", blocks: [{ type: "banner", settings: banner(c, "moda-faixa-1", { title: "Monte o seu conjunto", subtitle: "Peças que combinam entre si.", ctaLabel: "Ver conjuntos" }, { focusX: 75 }) }] }],
        e.about,
        ["grid", { type: "product-grid" }],
      ],
      e.product, [["header", { type: "collection-header" }], ["grid", { type: "collection-grid" }]], e.cart,
    ),
  };
}

// N2 — apresentação profissional: 2 slides, categorias em círculo, compra rápida, abas, FAQ e imagem com texto.
export function modaLume(c: PresetContext): ThemePreset {
  const style = normalizeStyle({ primary: "#1f2a44", accent: "#be185d", headingFont: "display", bodyFont: "moderna", radius: 14, buttons: "solid", quickView: true, animations: false });
  return {
    style,
    globals: globals(style, [announcement(c, "", "primary"), ["header", { type: "header", settings: { tone: "light", sticky: true } }]], [["footer", { type: "footer", settings: { text: c.footerText, tone: "light" } }]]),
    pages: pages(
      [
        ["hero", { type: "hero-banner", settings: { height: "lg", fullWidth: true }, blocks: [
          { type: "slide", settings: banner(c, "moda-hero-1", { title: heroTitle(c, `Novidades na ${c.storeName}`), subtitle: c.hero?.subtitle ?? "Peças escolhidas com carinho.", ctaLabel: c.hero?.ctaLabel ?? "Ver novidades" }, { focusX: 70, focusMobileX: 50, focusMobileY: 40 }) },
          { type: "slide", settings: banner(c, "moda-hero-2", { title: "Básicos para todo dia", ctaLabel: "Ver básicos", align: "center" }) },
        ] }],
        ["cats", { type: "category-grid", settings: { heading: "Compre por categoria", style: "circles" } }],
        ["destaques", { type: "product-showcase", settings: { title: "Escolhidos para você", subtitle: "Os destaques da loja", source: "featured", count: 4 } }],
        ["apoio", { type: "banner-duo", settings: { ratio: "portrait" }, blocks: [{ type: "banner", settings: banner(c, "moda-apoio-1", { title: "Peças avulsas", ctaLabel: "Ver" }) }, { type: "banner", settings: banner(c, "moda-apoio-2", { title: "Acessórios", ctaLabel: "Ver" }) }] }],
        ["novidades", { type: "product-showcase", settings: { title: "Acabaram de chegar", subtitle: "", source: "latest", count: 4 } }],
        ["sobre", { type: "image-with-text", settings: { image: c.media?.["moda-sobre"]?.image ?? c.images?.about ?? "", heading: `Sobre a ${c.storeName}`, body: c.tagline ?? "Conte em poucas linhas o que torna a sua loja especial.", ctaLabel: "Conhecer o catálogo", ratio: "square" } }],
        ["faixa", { type: "banner-strip", blocks: [{ type: "banner", settings: banner(c, "moda-faixa-1", { title: "Monte o seu conjunto", ctaLabel: "Ver conjuntos" }, { focusX: 75 }) }] }],
        ["faq", { type: "faq", blocks: blocksOf("faq") }],
        ["grid", { type: "product-grid" }],
      ],
      [["product", { type: "product-main", settings: { gallery: "thumbs", stickyBuyBar: true } }], ["tabs", { type: "product-tabs", blocks: blocksOf("product-tabs") }], ["related", { type: "product-related" }]],
      [["header", { type: "collection-header", settings: { showSort: false } }], ["grid", { type: "collection-grid" }]],
      [["cart", { type: "cart-main" }], ["more", { type: "product-showcase", settings: { title: "Aproveite e leve também", subtitle: "", source: "latest", count: 4 } }]],
    ),
  };
}

// N3 — composição comercial: carrossel de 3, mosaico, lookbook, banner entre vitrines, ordenação.
export function modaEditorial(c: PresetContext): ThemePreset {
  const style = normalizeStyle({ primary: "#1c1917", accent: "#a16207", headingFont: "elegante", bodyFont: "moderna", radius: 0, buttons: "outline", quickView: true, animations: false });
  const look = (i: number, title: string) => ({ type: "look", settings: { image: c.media?.[`moda-look-${i}`]?.image ?? "", title, link: "/catalog" } });
  return {
    style,
    globals: globals(style, [announcement(c, "", "neutral"), ["header", { type: "header", settings: { tone: "light" } }]], [["footer", { type: "footer", settings: { text: c.footerText, tone: "light" } }]]),
    pages: pages(
      [
        ["hero", { type: "hero-banner", settings: { height: "lg", fullWidth: true, autoplay: false }, blocks: [
          { type: "slide", settings: banner(c, "moda-hero-1", { title: heroTitle(c, "A coleção da estação"), subtitle: c.hero?.subtitle ?? "Peças pensadas para durar.", ctaLabel: c.hero?.ctaLabel ?? "Ver a coleção" }, { focusX: 70, focusMobileX: 50, focusMobileY: 40 }) },
          { type: "slide", settings: banner(c, "moda-hero-2", { title: "Básicos essenciais", ctaLabel: "Ver básicos" }) },
          { type: "slide", settings: banner(c, "moda-hero-3", { title: "Jaquetas e peças avulsas", ctaLabel: "Ver peças" }) },
        ] }],
        ["mosaico", { type: "banner-mosaic", settings: { layout: "1-2", heading: "Escolha por estilo" }, blocks: [{ type: "banner", settings: banner(c, "moda-mosaico-1", { title: "Conjuntos" }) }, { type: "banner", settings: banner(c, "moda-mosaico-2", { title: "Básicos" }) }, { type: "banner", settings: banner(c, "moda-mosaico-3", { title: "Calçados e acessórios" }) }] }],
        ["destaques", { type: "product-showcase", settings: { title: "Seleção da estação", subtitle: "", source: "featured", count: 4 } }],
        ["faixa", { type: "banner-strip", settings: { height: "md" }, blocks: [{ type: "banner", settings: banner(c, "moda-faixa-1", { title: "Monte o seu conjunto", subtitle: "Peças que conversam entre si.", ctaLabel: "Ver conjuntos" }, { focusX: 75 }) }] }],
        ["novidades", { type: "product-showcase", settings: { title: "Recém-chegados", subtitle: "", source: "latest", count: 4 } }],
        ["look", { type: "lookbook", settings: { heading: "Lookbook", subtitle: "Combinações com peças da loja" }, blocks: [look(1, "Urbano"), look(2, "Fim de semana"), look(3, "Café"), look(4, "Trabalho")] }],
        ["sobre", { type: "image-with-text", settings: { image: c.media?.["moda-sobre"]?.image ?? "", heading: "Feito para durar", body: `Na ${c.storeName}, cada peça é escolhida pelo caimento, pelo tecido e pelo acabamento.`, ctaLabel: "Conhecer o catálogo", ratio: "portrait" } }],
        ["proof", { type: "testimonials", blocks: blocksOf("testimonials"), hidden: true }],
        ["faq", { type: "faq", blocks: blocksOf("faq") }],
        ["grid", { type: "product-grid" }],
      ],
      [["product", { type: "product-main", settings: { gallery: "thumbs", stickyBuyBar: true } }], ["tabs", { type: "product-tabs", blocks: blocksOf("product-tabs") }], ["related", { type: "product-related" }]],
      [["header", { type: "collection-header", settings: { showSort: true } }], ["faixa", { type: "banner-strip", blocks: [{ type: "banner", settings: banner(c, "moda-faixa-1", { title: "Monte o seu conjunto", ctaLabel: "Ver conjuntos" }, { focusX: 75 }) }] }], ["grid", { type: "collection-grid", settings: { columns: 3 } }]],
      [["cart", { type: "cart-main" }], ["more", { type: "product-showcase", settings: { title: "Combine com", subtitle: "", source: "featured", count: 4 } }]],
    ),
  };
}

/** Data da campanha de exemplo (agendada para começar daqui a 3 dias, por 7 dias) no formato do editor (horário de Brasília). */
const brt = (now: Date, days: number) => { const d = new Date(now.getTime() - 3 * 3600_000); d.setUTCDate(d.getUTCDate() + days); return `${d.toISOString().slice(0, 10)}T09:00`; };

// N4 — experiência exclusiva: menu grande com busca, carrossel automático com campanha agendada, mosaico 1+4, movimento.
export function modaAtelier(c: PresetContext): ThemePreset {
  const style = normalizeStyle({ primary: "#2b2118", accent: "#b45309", headingFont: "editorial", bodyFont: "moderna", radius: 4, buttons: "solid", quickView: true, animations: true });
  const cats = c.categories?.length ? c.categories : [{ name: "Básicos", slug: "basicos" }, { name: "Conjuntos", slug: "conjuntos" }, { name: "Peças avulsas", slug: "pecas-avulsas" }, { name: "Acessórios", slug: "acessorios" }];
  const menu = cats.slice(0, 6).map((k) => ({ type: "menu-item", settings: { label: k.name, link: `/catalog?category=${k.slug}`, children: "" } }));
  return {
    style,
    globals: globals(style, [announcement(c, "", "accent"), ["header", { type: "header-plus", settings: { tone: "light", sticky: true, showSearch: true }, blocks: [...menu, { type: "menu-item", settings: { label: "Tudo", link: "/catalog", children: "" } }] }]], [["footer", { type: "footer", settings: { text: c.footerText, tone: "dark" } }]]),
    pages: pages(
      [
        ["hero", { type: "hero-banner", settings: { height: "lg", fullWidth: true, autoplay: true, interval: 7 }, blocks: [
          { type: "slide", settings: banner(c, "moda-hero-1", { title: heroTitle(c, `${c.storeName}: a coleção`), subtitle: c.hero?.subtitle ?? "Peças de autor para o dia a dia.", ctaLabel: c.hero?.ctaLabel ?? "Ver a coleção" }, { focusX: 70, focusMobileX: 50, focusMobileY: 40 }) },
          { type: "slide", settings: banner(c, "moda-hero-4", { title: "Campanha da estação", subtitle: "Slide agendado: aparece só no período definido.", ctaLabel: "Ver acessórios" }, { startsAt: brt(c.now, 3), endsAt: brt(c.now, 10) }) },
          { type: "slide", settings: banner(c, "moda-hero-2", { title: "Básicos essenciais", ctaLabel: "Ver básicos", align: "center" }) },
          { type: "slide", settings: banner(c, "moda-hero-3", { title: "Jaquetas e peças avulsas", ctaLabel: "Ver peças", align: "right" }) },
        ] }],
        ["cats", { type: "category-grid", settings: { heading: "Explore a loja", style: "circles", showCount: false } }],
        ["mosaico", { type: "banner-mosaic", settings: { layout: "1-4" }, blocks: [1, 2, 3, 4, 5].map((i) => ({ type: "banner", settings: banner(c, `moda-mosaico-${i}`, { title: ["Conjuntos", "Básicos", "Calçados", "Bijuterias", "Carteiras"][i - 1]! }) })) }],
        ["destaques", { type: "product-showcase", settings: { title: "Seleção do ateliê", subtitle: "", source: "featured", count: 8 } }],
        ["apoio", { type: "banner-duo", settings: { ratio: "portrait" }, blocks: [{ type: "banner", settings: banner(c, "moda-apoio-1", { title: "Peças avulsas", ctaLabel: "Ver" }) }, { type: "banner", settings: banner(c, "moda-apoio-2", { title: "Acessórios", ctaLabel: "Ver" }) }] }],
        ["look", { type: "lookbook", settings: { heading: "Lookbook", subtitle: "Combinações com peças da loja" }, blocks: [1, 2, 3, 4].map((i) => ({ type: "look", settings: { image: c.media?.[`moda-look-${i}`]?.image ?? "", title: ["Urbano", "Fim de semana", "Café", "Trabalho"][i - 1]!, link: "/catalog" } })) }],
        ["novidades", { type: "product-showcase", settings: { title: "Recém-chegados", subtitle: "", source: "latest", count: 4 } }],
        ["countdown", { type: "countdown", settings: { heading: "A campanha termina em", text: "Defina a data da sua campanha real antes de mostrar.", until: brt(c.now, 10), tone: "accent" }, hidden: true }],
        ["faq", { type: "faq", blocks: blocksOf("faq") }],
        ["grid", { type: "product-grid" }],
      ],
      [["product", { type: "product-main", settings: { gallery: "grid", stickyBuyBar: true } }], ["tabs", { type: "product-tabs", blocks: blocksOf("product-tabs") }], ["related", { type: "product-related", settings: { count: 8 } }]],
      [["hero", { type: "hero-banner", settings: { height: "sm", fullWidth: false }, blocks: [{ type: "slide", settings: banner(c, "moda-faixa-1", { title: "Toda a coleção", ctaLabel: "" }, { focusX: 75 }) }] }], ["header", { type: "collection-header", settings: { showSort: true } }], ["grid", { type: "collection-grid", settings: { columns: 3 } }]],
      [["cart", { type: "cart-main" }], ["more", { type: "product-showcase", settings: { title: "Combine com", subtitle: "", source: "featured", count: 4 } }]],
    ),
  };
}
