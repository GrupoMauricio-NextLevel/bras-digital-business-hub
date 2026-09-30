import type { SectionSchema, SettingDef } from "./types";

const TONES = [{ value: "primary", label: "Cor principal" }, { value: "accent", label: "Cor de destaque" }, { value: "neutral", label: "Neutro escuro" }];
const ICONS = [{ value: "truck", label: "Caminhão" }, { value: "shield", label: "Escudo" }, { value: "refresh", label: "Troca" }, { value: "star", label: "Estrela" }, { value: "heart", label: "Coração" }, { value: "clock", label: "Relógio" }];
const COLUMNS = (def = 4): SettingDef => ({ id: "columns", type: "range", label: "Colunas no computador", min: 2, max: 4, step: 1, default: def });

/**
 * Catálogo de seções do tema (esquemas puros: o editor e a validação usam os mesmos).
 * Os componentes que desenham cada seção ficam em `components/storefront/sections`.
 */
export const SECTION_SCHEMAS: SectionSchema[] = [
  {
    type: "announcement-bar", name: "Barra de anúncio", description: "Faixa fina no topo para avisos e promoções.", category: "Cabeçalho", region: "header", pages: ["home", "product", "collection", "cart"], singleton: true,
    settings: [{ id: "text", type: "text", label: "Texto", default: "", placeholder: "Frete grátis acima de R$ 299" }, { id: "link", type: "url", label: "Link (opcional)", default: "" }, { id: "tone", type: "select", label: "Cor", options: TONES, default: "primary" }],
    presets: [{ name: "Barra de anúncio", settings: { text: "Frete grátis acima de R$ 299" } }],
  },
  {
    type: "header", name: "Cabeçalho", description: "Logo, menu, WhatsApp e carrinho.", category: "Cabeçalho", region: "header", pages: ["home", "product", "collection", "cart"], singleton: true,
    settings: [{ id: "sticky", type: "checkbox", label: "Fixar no topo ao rolar", default: true }, { id: "showWhatsapp", type: "checkbox", label: "Mostrar botão do WhatsApp", default: true }],
    presets: [{ name: "Cabeçalho padrão" }],
  },
  {
    type: "hero", name: "Destaque principal", description: "Título grande, texto e botão, com um produto ao lado.", category: "Destaque", region: "content", pages: ["home"],
    settings: [
      { id: "title", type: "text", label: "Título", default: "Bem-vindo à nossa loja", maxLength: 120 },
      { id: "subtitle", type: "textarea", label: "Subtítulo", default: "Produtos selecionados com envio para todo o Brasil.", maxLength: 300 },
      { id: "ctaLabel", type: "text", label: "Texto do botão", default: "Ver catálogo", maxLength: 40 },
      { id: "ctaLink", type: "url", label: "Link do botão", default: "/catalog" },
      { id: "layout", type: "select", label: "Formato", options: [{ value: "split", label: "Texto e produto" }, { value: "wide", label: "Grande" }, { value: "centered", label: "Centralizado" }], default: "split" },
      { id: "showProduct", type: "checkbox", label: "Mostrar produto ao lado", default: true },
      { id: "showTagline", type: "checkbox", label: "Mostrar a frase da loja", default: true },
      { id: "showWhatsapp", type: "checkbox", label: "Mostrar botão do WhatsApp", default: true },
      { id: "background", type: "select", label: "Fundo", options: [{ value: "soft", label: "Destaque suave" }, { value: "primary", label: "Cor principal" }, { value: "neutral", label: "Claro neutro" }], default: "soft" },
    ],
    presets: [{ name: "Destaque principal" }],
  },
  {
    type: "trust-bar", name: "Faixa de confiança", description: "Três ou mais garantias lado a lado.", category: "Confiança", region: "content", pages: ["home", "product", "cart"],
    settings: [], maxBlocks: 6,
    blocks: [{ type: "item", name: "Garantia", limit: 6, settings: [{ id: "icon", type: "select", label: "Ícone", options: ICONS, default: "truck" }, { id: "title", type: "text", label: "Título", default: "Envio para todo o Brasil", maxLength: 50 }, { id: "text", type: "text", label: "Texto", default: "Etiqueta gerada em até 1 dia útil", maxLength: 90 }] }],
    presets: [{ name: "Faixa de confiança", blocks: [{ type: "item", settings: { icon: "truck", title: "Envio para todo o Brasil", text: "Etiqueta gerada em até 1 dia útil" } }, { type: "item", settings: { icon: "shield", title: "Compra segura", text: "Pagamento protegido" } }, { type: "item", settings: { icon: "refresh", title: "Troca fácil", text: "7 dias para trocar o tamanho" } }] }],
  },
  {
    type: "category-chips", name: "Categorias", description: "Atalhos para as categorias do catálogo.", category: "Produtos", region: "content", pages: ["home", "collection"],
    settings: [{ id: "heading", type: "text", label: "Título (opcional)", default: "", maxLength: 60 }], presets: [{ name: "Categorias" }],
  },
  {
    type: "product-showcase", name: "Vitrine de produtos", description: "Produtos em destaque, os mais novos ou de uma categoria.", category: "Produtos", region: "content", pages: ["home", "collection", "cart"],
    settings: [
      { id: "title", type: "text", label: "Título", default: "Destaques", maxLength: 80 },
      { id: "subtitle", type: "text", label: "Subtítulo", default: "Os mais procurados da temporada", maxLength: 120 },
      { id: "source", type: "select", label: "Produtos", options: [{ value: "featured", label: "Em destaque" }, { value: "latest", label: "Todos, na ordem do catálogo" }, { value: "collection", label: "De uma categoria" }], default: "featured" },
      { id: "collection", type: "collection", label: "Categoria", default: "" },
      { id: "count", type: "range", label: "Quantidade", min: 2, max: 12, step: 1, default: 4 },
      COLUMNS(),
      { id: "linkLabel", type: "text", label: "Texto do link", default: "Ver tudo", maxLength: 30 },
      { id: "linkHref", type: "url", label: "Link", default: "/catalog" },
    ],
    presets: [{ name: "Vitrine de produtos" }],
  },
  {
    type: "promo-banners", name: "Banners", description: "Um ou mais blocos de campanha com título, texto e link.", category: "Destaque", region: "content", pages: ["home", "collection"],
    settings: [], maxBlocks: 6,
    blocks: [{ type: "banner", name: "Banner", limit: 6, settings: [{ id: "title", type: "text", label: "Título", default: "Novo banner", maxLength: 80 }, { id: "subtitle", type: "text", label: "Subtítulo", default: "", maxLength: 120 }, { id: "tone", type: "select", label: "Cor", options: TONES, default: "primary" }, { id: "link", type: "url", label: "Link", default: "/catalog" }] }],
    presets: [{ name: "Banners", blocks: [{ type: "banner" }] }],
  },
  {
    type: "product-grid", name: "Todos os produtos", description: "Grade com o restante do catálogo.", category: "Produtos", region: "content", pages: ["home", "collection"],
    settings: [{ id: "title", type: "text", label: "Título", default: "Todos os produtos", maxLength: 80 }, COLUMNS(), { id: "skipShown", type: "checkbox", label: "Não repetir produtos já mostrados acima", default: true }],
    presets: [{ name: "Todos os produtos" }],
  },
  {
    type: "rich-text", name: "Texto", description: "Título e texto com formatação leve.", category: "Conteúdo", region: "content", pages: ["home", "product", "collection", "cart"],
    settings: [{ id: "heading", type: "text", label: "Título", default: "Sobre a loja", maxLength: 80 }, { id: "body", type: "richtext", label: "Texto", default: "Conte a história da sua loja em poucas linhas." }, { id: "align", type: "select", label: "Alinhamento", options: [{ value: "left", label: "Esquerda" }, { value: "center", label: "Centro" }], default: "left" }],
    presets: [{ name: "Texto" }],
  },
  {
    type: "footer", name: "Rodapé", description: "Texto, redes e selos.", category: "Rodapé", region: "footer", pages: ["home", "product", "collection", "cart"], singleton: true,
    settings: [{ id: "text", type: "text", label: "Texto do rodapé", default: "", maxLength: 160 }, { id: "showInstagram", type: "checkbox", label: "Mostrar Instagram", default: true }, { id: "showBadges", type: "checkbox", label: "Mostrar “Pagamento seguro” e “Envio para todo o Brasil”", default: true }],
    presets: [{ name: "Rodapé padrão" }],
  },
];

export const SECTION_BY_TYPE: Record<string, SectionSchema> = Object.fromEntries(SECTION_SCHEMAS.map((s) => [s.type, s]));
export const sectionSchema = (type: string): SectionSchema | undefined => SECTION_BY_TYPE[type];
