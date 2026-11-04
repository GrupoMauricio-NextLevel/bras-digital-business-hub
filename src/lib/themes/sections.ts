import type { SectionSchema, SettingDef } from "./types";

const TONES = [{ value: "primary", label: "Cor principal" }, { value: "accent", label: "Cor de destaque" }, { value: "neutral", label: "Neutro escuro" }];
const ICONS = [{ value: "truck", label: "Caminhão" }, { value: "shield", label: "Escudo" }, { value: "refresh", label: "Troca" }, { value: "star", label: "Estrela" }, { value: "heart", label: "Coração" }, { value: "clock", label: "Relógio" }];
const HEIGHT: SettingDef = { id: "height", type: "select", label: "Altura", options: [{ value: "sm", label: "Baixa" }, { value: "md", label: "Média" }, { value: "lg", label: "Alta" }, { value: "full", label: "Tela cheia" }], default: "md" };
const ALIGN: SettingDef = { id: "align", type: "select", label: "Alinhamento do texto", options: [{ value: "left", label: "Esquerda" }, { value: "center", label: "Centro" }, { value: "right", label: "Direita" }], default: "left" };
const TEXT_TONE: SettingDef = { id: "textColor", type: "select", label: "Cor do texto", options: [{ value: "light", label: "Claro" }, { value: "dark", label: "Escuro" }], default: "light" };
const FULL_WIDTH: SettingDef = { id: "fullWidth", type: "checkbox", label: "Largura total da tela", default: false };
const COLUMNS = (def = 4): SettingDef => ({ id: "columns", type: "range", label: "Colunas no computador", min: 2, max: 4, step: 1, default: def });

// ------------------------------------------------------------------ contrato de banner (todas as posições)
/** Imagem do banner: original preservado, versão de celular opcional (cai na do computador), foco independente e descrição. */
const pct = (id: string, label: string): SettingDef => ({ id, type: "range", label, min: 0, max: 100, step: 5, unit: "%", default: 50, group: "Imagem" });
export const BANNER_MEDIA: SettingDef[] = [
  { id: "image", type: "image", label: "Imagem do computador", default: "", group: "Imagem" },
  { id: "imageMobile", type: "image", label: "Imagem do celular (opcional)", default: "", group: "Imagem", info: "Sem ela, o celular usa a imagem do computador com o foco do celular abaixo." },
  pct("focusX", "Foco horizontal no computador"), pct("focusY", "Foco vertical no computador"),
  pct("focusMobileX", "Foco horizontal no celular"), pct("focusMobileY", "Foco vertical no celular"),
  { id: "alt", type: "text", label: "Descrição da imagem", default: "", maxLength: 140, group: "Imagem", info: "Lida por leitores de tela. Descreva o que aparece, sem repetir o título." },
  { id: "decorative", type: "checkbox", label: "Imagem só decorativa (sem descrição)", default: false, group: "Imagem" },
];
export const BANNER_TEXT: SettingDef[] = [
  { id: "title", type: "text", label: "Título", default: "", maxLength: 80, group: "Texto" },
  { id: "subtitle", type: "text", label: "Texto", default: "", maxLength: 160, group: "Texto" },
  { id: "ctaLabel", type: "text", label: "Texto do botão", default: "", maxLength: 40, group: "Texto" },
  { id: "link", type: "url", label: "Link", default: "/catalog", group: "Texto", info: "Endereço da própria loja (ex.: /catalog) ou https." },
  { id: "textColor", type: "select", label: "Cor do texto", options: [{ value: "light", label: "Claro" }, { value: "dark", label: "Escuro" }], default: "light", group: "Texto" },
  { id: "overlay", type: "range", label: "Escurecer a imagem (legibilidade)", min: 0, max: 80, step: 5, unit: "%", default: 30, group: "Texto" },
  { id: "align", type: "select", label: "Posição do texto", options: [{ value: "left", label: "Esquerda" }, { value: "center", label: "Centro" }, { value: "right", label: "Direita" }], default: "left", group: "Texto", minLevel: 2 },
];
/** Campanha (N4): janela em horário de Brasília e condição por categoria. Fora da janela o banner some e o próximo aparece. */
export const BANNER_CAMPAIGN: SettingDef[] = [
  { id: "startsAt", type: "datetime", label: "Começa em (horário de Brasília)", default: "", group: "Campanha", minLevel: 3 },
  { id: "endsAt", type: "datetime", label: "Termina em (horário de Brasília)", default: "", group: "Campanha", minLevel: 3, info: "Depois do fim, o banner some sozinho e a loja mostra o próximo." },
  { id: "onlyCategory", type: "collection", label: "Mostrar só nesta categoria", default: "", group: "Campanha", minLevel: 4, info: "Vale nas páginas de coleção. Vazio = todas." },
];
const BANNER = (extra: SettingDef[] = []): SettingDef[] => [...BANNER_MEDIA, ...BANNER_TEXT, ...extra, ...BANNER_CAMPAIGN];

// ------------------------------------------------------------------ destaques em camadas (D88)
const EMPH_INFO = "Uma palavra entre asteriscos ganha destaque: Feito para a *cidade*.";
const TEXT_COLOR: SettingDef = { id: "textColor", type: "select", label: "Cor do texto", options: [{ value: "light", label: "Claro" }, { value: "dark", label: "Escuro" }], default: "light", group: "Texto" };
const OVERLAY: SettingDef = { id: "overlay", type: "range", label: "Escurecer o fundo (legibilidade)", min: 0, max: 80, step: 5, unit: "%", default: 25, group: "Texto" };
const LAYER_IMAGES: SettingDef[] = [
  { id: "background", type: "image", label: "Fundo do computador (cenário sem produto)", default: "", group: "Imagem" },
  { id: "backgroundMobile", type: "image", label: "Fundo do celular (opcional)", default: "", group: "Imagem" },
  pct("focusX", "Foco horizontal no computador"), pct("focusY", "Foco vertical no computador"),
  { id: "cutout", type: "image", label: "Produto recortado (PNG sem fundo)", default: "", group: "Imagem", info: "Sem recorte, o destaque mostra só o fundo." },
  { id: "alt", type: "text", label: "Descrição do produto", default: "", maxLength: 140, group: "Imagem" },
];
const HERO_COPY: SettingDef[] = [
  { id: "eyebrow", type: "text", label: "Linha de chamada (opcional)", default: "", maxLength: 40, group: "Texto" },
  { id: "title", type: "text", label: "Título", default: "", maxLength: 90, group: "Texto", info: EMPH_INFO },
  { id: "subtitle", type: "text", label: "Texto", default: "", maxLength: 180, group: "Texto" },
  { id: "ctaLabel", type: "text", label: "Texto do botão", default: "Comprar agora", maxLength: 40, group: "Texto" },
  { id: "link", type: "url", label: "Link do botão", default: "/catalog", group: "Texto" },
  { id: "secondaryLabel", type: "text", label: "Segundo link (opcional)", default: "", maxLength: 40, group: "Texto" },
  { id: "secondaryLink", type: "url", label: "Endereço do segundo link", default: "/catalog", group: "Texto" },
  { id: "note", type: "text", label: "Microtexto de confiança (opcional)", default: "", maxLength: 80, group: "Texto", info: "Ex.: Troca fácil em 30 dias. Só escreva o que a loja cumpre." },
  TEXT_COLOR, OVERLAY,
];

/**
 * Catálogo de seções do tema (esquemas puros: o editor e a validação usam os mesmos).
 * Os componentes que desenham cada seção ficam em `components/storefront/sections`.
 */
export const SECTION_SCHEMAS: SectionSchema[] = [
  {
    type: "announcement-bar", name: "Barra de anúncio", description: "Faixa fina no topo para avisos e promoções.", category: "Cabeçalho", region: "header", pages: ["home", "product", "collection", "cart"], singleton: true,
    settings: [{ id: "text", type: "text", label: "Texto", default: "", placeholder: "Ex.: Troca do tamanho em até 7 dias" }, { id: "link", type: "url", label: "Link (opcional)", default: "" }, { id: "tone", type: "select", label: "Cor", options: TONES, default: "primary" }],
    presets: [{ name: "Barra de anúncio", settings: { text: "Novidades toda semana" } }],
  },
  {
    type: "header", name: "Cabeçalho", description: "Logo, menu, WhatsApp e carrinho.", category: "Cabeçalho", region: "header", pages: ["home", "product", "collection", "cart"], singleton: true, slot: "site-header", required: true, requires: "navigation.basic",
    settings: [{ id: "sticky", type: "checkbox", label: "Fixar no topo ao rolar", default: true }, { id: "logoHeight", type: "range", label: "Altura da logo (se enviou uma)", min: 24, max: 56, step: 4, unit: "px", default: 36 }, { id: "showWhatsapp", type: "checkbox", label: "Mostrar botão do WhatsApp", default: true }, { id: "tone", type: "select", label: "Cor do cabeçalho", options: [{ value: "light", label: "Claro" }, { value: "dark", label: "Escuro" }], default: "light" }],
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
    blocks: [{ type: "item", name: "Garantia", limit: 6, settings: [{ id: "icon", type: "select", label: "Ícone", options: ICONS, default: "truck" }, { id: "title", type: "text", label: "Título", default: "Envio para todo o Brasil", maxLength: 50 }, { id: "text", type: "text", label: "Texto", default: "Prazo calculado pelo CEP no fechamento", maxLength: 90 }] }],
    presets: [{ name: "Faixa de confiança", blocks: [{ type: "item", settings: { icon: "truck", title: "Envio para todo o Brasil", text: "Prazo calculado pelo CEP no fechamento" } }, { type: "item", settings: { icon: "shield", title: "Compra segura", text: "Pagamento protegido" } }, { type: "item", settings: { icon: "refresh", title: "Trocas", text: "Veja a política de trocas da loja" } }] }],
  },
  {
    type: "category-chips", name: "Categorias", description: "Atalhos para as categorias do catálogo.", category: "Produtos", region: "content", pages: ["home", "collection"], requires: "navigation.basic",
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
    type: "promo-banners", name: "Faixas de texto", description: "Blocos coloridos com título, texto e link (sem imagem). Para banners com foto, use as posições de banner.", category: "Destaque", region: "content", pages: ["home", "collection"],
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
    type: "product-main", name: "Produto", description: "Galeria, título, preço, tamanhos e botão de compra.", category: "Produtos", region: "content", pages: ["product"], singleton: true, required: true, requires: "product.basic",
    settings: [
      { id: "gallery", type: "select", label: "Galeria", options: [{ value: "stacked", label: "Imagem grande" }, { value: "thumbs", label: "Imagem e miniaturas" }, { value: "grid", label: "Grade de imagens" }], default: "stacked" },
      { id: "showBreadcrumb", type: "checkbox", label: "Mostrar caminho (Início > Catálogo)", default: true },
      { id: "shippingNote", type: "text", label: "Aviso de envio (opcional)", default: "", maxLength: 140, info: "Só escreva prazos que a sua operação cumpre." },
      { id: "stickyBuyBar", type: "checkbox", label: "Barra fixa de compra no celular", default: false },
    ],
    presets: [{ name: "Produto" }],
  },
  {
    type: "product-related", name: "Produtos relacionados", description: "Outros produtos da mesma categoria.", category: "Produtos", region: "content", pages: ["product"],
    settings: [{ id: "title", type: "text", label: "Título", default: "Você também pode gostar", maxLength: 80 }, { id: "count", type: "range", label: "Quantidade", min: 2, max: 8, step: 1, default: 4 }, COLUMNS()],
    presets: [{ name: "Produtos relacionados" }],
  },
  {
    type: "collection-header", name: "Cabeçalho do catálogo", description: "Título, contagem, busca e categorias.", category: "Produtos", region: "content", pages: ["collection"], singleton: true, required: true, requires: "navigation.basic",
    settings: [{ id: "showCount", type: "checkbox", label: "Mostrar quantidade de produtos", default: true }, { id: "showSearch", type: "checkbox", label: "Mostrar busca", default: true }, { id: "showCategories", type: "checkbox", label: "Mostrar categorias", default: true }, { id: "showSort", type: "checkbox", label: "Mostrar ordenação (preço e nome)", default: false }],
    presets: [{ name: "Cabeçalho do catálogo" }],
  },
  {
    type: "collection-grid", name: "Grade do catálogo", description: "Os produtos da busca ou categoria escolhida.", category: "Produtos", region: "content", pages: ["collection"], singleton: true, required: true,
    settings: [COLUMNS(), { id: "emptyText", type: "text", label: "Texto quando não há produtos", default: "Nenhum produto encontrado.", maxLength: 100 }],
    presets: [{ name: "Grade do catálogo" }],
  },
  {
    type: "cart-main", name: "Carrinho", description: "Itens, frete e resumo do pedido.", category: "Produtos", region: "content", pages: ["cart"], singleton: true, required: true,
    settings: [], presets: [{ name: "Carrinho" }],
  },
  // ------------------------------------------------------------------ posições de banner com imagem (Central de Banners)
  {
    type: "hero-banner", name: "Destaque com banners", description: "Destaque principal com imagem do computador e do celular. N1: até 3 slides · N2: até 4 · N3: carrossel até 6 · N4: vídeo e agendamento.", category: "Destaque", region: "content", pages: ["home", "collection"], requires: "hero.image", maxBlocks: 6,
    settings: [
      { id: "height", type: "select", label: "Altura", options: [{ value: "sm", label: "Baixa" }, { value: "md", label: "Média" }, { value: "lg", label: "Alta" }], default: "md", minLevel: 1 },
      { id: "fullWidth", type: "checkbox", label: "Largura total da tela", default: true, minLevel: 2 },
      { id: "autoplay", type: "checkbox", label: "Passar os slides sozinho", default: false, minLevel: 3, info: "Pausa ao passar o mouse, no foco do teclado e para quem pediu menos movimento." },
      { id: "interval", type: "range", label: "Segundos por slide", min: 4, max: 10, step: 1, unit: "s", default: 6, minLevel: 3 },
    ],
    blocks: [{ type: "slide", name: "Slide", limit: 6, maxByLevel: [3, 4, 6, 6], settings: BANNER([{ id: "video", type: "video", label: "Vídeo (opcional, usa a imagem como capa)", default: "", group: "Imagem", minLevel: 4 }]) }],
    presets: [{ name: "Destaque com banners", blocks: [{ type: "slide", settings: { title: "Coleção nova", subtitle: "Peças escolhidas para a estação.", ctaLabel: "Ver coleção" } }] }],
  },
  {
    type: "banner-duo", name: "Dois banners de apoio", description: "Duas imagens lado a lado (uma embaixo da outra no celular), cada uma com texto e link.", category: "Destaque", region: "content", pages: ["home", "collection"], requires: "banner.fixedSlots", maxBlocks: 2,
    settings: [{ id: "ratio", type: "select", label: "Formato", options: [{ value: "landscape", label: "Paisagem 4:3" }, { value: "portrait", label: "Retrato 4:5" }, { value: "square", label: "Quadrado" }], default: "landscape", minLevel: 2 }],
    blocks: [{ type: "banner", name: "Banner", limit: 2, maxByLevel: [2, 2, 2, 2], settings: BANNER() }],
    presets: [{ name: "Dois banners de apoio", blocks: [{ type: "banner", settings: { title: "Mais vendidos", ctaLabel: "Ver" } }, { type: "banner", settings: { title: "Novidades", ctaLabel: "Ver" } }] }],
  },
  {
    type: "banner-strip", name: "Faixa de campanha", description: "Uma imagem larga com texto e botão, para campanha ou aviso visual.", category: "Destaque", region: "content", pages: ["home", "collection", "product", "cart"], requires: "banner.fixedSlots", maxBlocks: 1,
    settings: [{ id: "height", type: "select", label: "Altura", options: [{ value: "sm", label: "Baixa" }, { value: "md", label: "Média" }], default: "sm", minLevel: 2 }],
    blocks: [{ type: "banner", name: "Banner", limit: 1, maxByLevel: [1, 1, 1, 1], settings: BANNER() }],
    presets: [{ name: "Faixa de campanha", blocks: [{ type: "banner", settings: { title: "Campanha da estação", ctaLabel: "Aproveitar" } }] }],
  },
  {
    type: "banner-mosaic", name: "Mosaico de banners", description: "De 3 a 5 imagens em grade assimétrica, para campanhas e categorias.", category: "Destaque", region: "content", pages: ["home", "collection"], requires: "banner.mosaic", maxBlocks: 5,
    settings: [{ id: "layout", type: "select", label: "Composição", options: [{ value: "1-2", label: "Uma grande e duas menores" }, { value: "2-2", label: "Quatro iguais" }, { value: "1-4", label: "Uma grande e quatro menores" }], default: "1-2" }, { id: "heading", type: "text", label: "Título (opcional)", default: "", maxLength: 80 }],
    blocks: [{ type: "banner", name: "Banner", limit: 5, maxByLevel: [3, 4, 5, 5], settings: BANNER() }],
    presets: [{ name: "Mosaico de banners", blocks: [{ type: "banner", settings: { title: "Coleção", ctaLabel: "Ver" } }, { type: "banner", settings: { title: "Básicos" } }, { type: "banner", settings: { title: "Acessórios" } }] }],
  },
  // ------------------------------------------------------------------ banners que organizam a navegação (D88)
  {
    type: "hero-layers", name: "Destaque em camadas", description: "Fundo e produto recortado em camadas: o produto se move com o mouse e a rolagem. Imagem própria para o celular.", category: "Destaque", region: "content", pages: ["home"], requires: "hero.layers",
    settings: [...LAYER_IMAGES, ...HERO_COPY, { id: "motion", type: "checkbox", label: "Movimento ao passar o mouse e ao rolar", default: true, group: "Movimento", info: "Desligado para quem pediu menos movimento no aparelho." }],
    presets: [{ name: "Destaque em camadas", settings: { title: "O *básico* que virou assinatura", subtitle: "Peças escolhidas para acompanhar o seu dia.", ctaLabel: "Comprar agora", link: "/catalog" } }],
  },
  {
    type: "hero-immersive", name: "Destaque imersivo", description: "Três camadas que se movem em velocidades diferentes e uma sequência de até três quadros que muda conforme o cliente rola a página, com um texto por quadro.", category: "Destaque", region: "content", pages: ["home"], requires: "hero.immersive", maxBlocks: 3,
    settings: [
      ...LAYER_IMAGES,
      { id: "foreground", type: "image", label: "Primeiro plano (PNG sem fundo, opcional)", default: "", group: "Imagem", info: "Elemento desfocado na frente (tecido, folhas, partículas). Move mais rápido que o resto." },
      { id: "frame1", type: "image", label: "Sequência · quadro 1 (opcional)", default: "", group: "Sequência" },
      { id: "frame2", type: "image", label: "Sequência · quadro 2", default: "", group: "Sequência" },
      { id: "frame3", type: "image", label: "Sequência · quadro 3", default: "", group: "Sequência", info: "Mesma cena e enquadramento nos três quadros. Sem sequência, o fundo fica parado e só os textos mudam." },
      { id: "ctaLabel", type: "text", label: "Texto do botão", default: "Comprar agora", maxLength: 40, group: "Texto" },
      { id: "link", type: "url", label: "Link do botão", default: "/catalog", group: "Texto" },
      { id: "secondaryLabel", type: "text", label: "Segundo link (opcional)", default: "", maxLength: 40, group: "Texto" },
      { id: "secondaryLink", type: "url", label: "Endereço do segundo link", default: "/catalog", group: "Texto" },
      { id: "note", type: "text", label: "Microtexto de confiança junto do botão", default: "", maxLength: 80, group: "Texto", info: "Ex.: Troca fácil em 30 dias. Só escreva o que a loja cumpre." },
      { id: "mobileTitle", type: "text", label: "Título curto para o celular (opcional)", default: "", maxLength: 60, group: "Texto" },
      TEXT_COLOR, OVERLAY,
    ],
    blocks: [{ type: "step", name: "Texto da sequência", limit: 3, settings: [{ id: "eyebrow", type: "text", label: "Linha de chamada (opcional)", default: "", maxLength: 40 }, { id: "title", type: "text", label: "Título", default: "", maxLength: 90, info: EMPH_INFO }, { id: "subtitle", type: "text", label: "Texto (opcional)", default: "", maxLength: 160 }] }],
    presets: [{ name: "Destaque imersivo", settings: { ctaLabel: "Comprar agora", link: "/catalog" }, blocks: [{ type: "step", settings: { title: "Toda história tem um *começo*." } }, { type: "step", settings: { title: "E um motivo." } }, { type: "step", settings: { title: "Escreva a *sua*", eyebrow: "COLEÇÃO" } }] }],
  },
  {
    type: "nav-cards", name: "Cartões de navegação", description: "Dois a quatro cartões verticais que levam a Novidades, Ofertas, Mais vendidos ou Kits e ensinam o cliente a navegar na loja.", category: "Destaque", region: "content", pages: ["home", "collection"], requires: "navigation.cards", maxBlocks: 4,
    settings: [{ id: "heading", type: "text", label: "Título (opcional)", default: "", maxLength: 60 }],
    blocks: [{ type: "card", name: "Cartão", limit: 4, maxByLevel: [2, 4, 4, 4], settings: [
      { id: "image", type: "image", label: "Imagem (retrato 4:5)", default: "", group: "Imagem" },
      { id: "alt", type: "text", label: "Descrição da imagem", default: "", maxLength: 140, group: "Imagem" },
      { id: "eyebrow", type: "text", label: "Linha de chamada (opcional)", default: "", maxLength: 30, group: "Texto" },
      { id: "title", type: "text", label: "Título", default: "", maxLength: 60, group: "Texto", info: EMPH_INFO },
      { id: "subtitle", type: "text", label: "Texto (opcional)", default: "", maxLength: 90, group: "Texto" },
      { id: "ctaLabel", type: "text", label: "Texto do botão", default: "Ver", maxLength: 30, group: "Texto" },
      { id: "link", type: "url", label: "Link", default: "/catalog", group: "Texto" },
    ] }],
    presets: [{ name: "Cartões de navegação", blocks: [{ type: "card", settings: { title: "Novidades", ctaLabel: "Ver o que chegou", link: "/catalog?sort=newest" } }, { type: "card", settings: { title: "Ofertas", ctaLabel: "Ver ofertas", link: "/catalog" } }] }],
  },
  {
    type: "category-banner", name: "Banner da categoria", description: "Faixa com imagem e texto no topo da página de cada categoria. Cada banner vale para uma categoria; um sem categoria aparece em “Todos os produtos”.", category: "Destaque", region: "content", pages: ["collection"], requires: "navigation.categoryBanner", maxBlocks: 12, singleton: true,
    settings: [],
    blocks: [{ type: "banner", name: "Banner de categoria", limit: 12, maxByLevel: [4, 8, 12, 12], settings: [
      { id: "category", type: "collection", label: "Categoria", default: "", info: "Vazio = página com todos os produtos." },
      ...BANNER_MEDIA,
      { id: "image", type: "image", label: "Imagem do computador (faixa larga)", default: "", group: "Imagem" },
      { id: "imageMobile", type: "image", label: "Imagem do celular (opcional)", default: "", group: "Imagem" },
      { id: "alt", type: "text", label: "Descrição da imagem", default: "", maxLength: 140, group: "Imagem" },
      { id: "title", type: "text", label: "Título (vazio = nome da categoria)", default: "", maxLength: 80, group: "Texto", info: EMPH_INFO },
      { id: "subtitle", type: "text", label: "Texto", default: "", maxLength: 140, group: "Texto" },
      TEXT_COLOR, OVERLAY,
    ] }],
    presets: [{ name: "Banner da categoria", blocks: [{ type: "banner", settings: { title: "", subtitle: "" } }] }],
  },
  {
    type: "welcome-coupon", name: "Cupom de boas-vindas", description: "Janela que aparece uma vez para quem visita a loja pela primeira vez: o cliente deixa o e-mail e recebe um cupom ativo da loja.", category: "Destaque", region: "content", pages: ["home"], requires: "marketing.welcomeCoupon", singleton: true,
    settings: [
      { id: "code", type: "text", label: "Código do cupom", default: "", maxLength: 24, info: "Use um cupom ativo de Marketing › Cupons. Se ele vencer ou acabar, a janela deixa de aparecer sozinha." },
      { id: "image", type: "image", label: "Imagem (quadrada)", default: "", group: "Imagem" },
      { id: "alt", type: "text", label: "Descrição da imagem", default: "", maxLength: 140, group: "Imagem" },
      { id: "eyebrow", type: "text", label: "Linha de chamada (opcional)", default: "BOAS-VINDAS", maxLength: 30, group: "Texto" },
      { id: "title", type: "text", label: "Título", default: "Sua primeira compra com desconto", maxLength: 80, group: "Texto", info: EMPH_INFO },
      { id: "subtitle", type: "text", label: "Texto", default: "Deixe seu e-mail e receba o cupom na hora.", maxLength: 140, group: "Texto" },
      { id: "ctaLabel", type: "text", label: "Texto do botão", default: "Receber cupom", maxLength: 30, group: "Texto" },
      { id: "note", type: "text", label: "Microtexto", default: "Sem spam. Cancele quando quiser.", maxLength: 80, group: "Texto" },
      { id: "delay", type: "range", label: "Aparecer depois de", min: 3, max: 30, step: 1, unit: "s", default: 8 },
    ],
    presets: [{ name: "Cupom de boas-vindas" }],
  },
  // ------------------------------------------------------------------ seções por nível (requires) e por identidade (families)
  {
    type: "arena-hero", name: "Destaque Arena", description: "Destaque esportivo de alto impacto que usa automaticamente um produto real da loja.", category: "Destaque", region: "content", pages: ["home"], requires: "hero.image", families: ["sport"],
    settings: [
      { id: "eyebrow", type: "text", label: "Chamada superior", default: "NOVA TEMPORADA", maxLength: 40 },
      { id: "heading", type: "text", label: "Título", default: "Vista a paixão. Jogue do seu jeito.", maxLength: 100 },
      { id: "text", type: "textarea", label: "Texto", default: "Camisas selecionadas para quem vive futebol dentro e fora do estádio.", maxLength: 240 },
      { id: "ctaLabel", type: "text", label: "Botão principal", default: "Ver lançamentos", maxLength: 40 },
      { id: "ctaLink", type: "url", label: "Link principal", default: "/catalog" },
      { id: "secondaryLabel", type: "text", label: "Segundo botão", default: "Explorar catálogo", maxLength: 40 },
      { id: "secondaryLink", type: "url", label: "Link do segundo botão", default: "/catalog" },
      { id: "productBadge", type: "text", label: "Selo do produto", default: "DESTAQUE DA SEMANA", maxLength: 40 },
      { id: "showProduct", type: "checkbox", label: "Mostrar produto em destaque", default: true },
    ],
    presets: [{ name: "Destaque Arena" }],
  },
  {
    type: "image-hero", name: "Destaque simples (legado)", description: "Imagem grande com texto e botões por cima. Para foco, imagem de celular e slides, use “Destaque com banners”.", category: "Destaque", region: "content", pages: ["home", "collection"], requires: "hero.image",
    settings: [
      { id: "image", type: "image", label: "Imagem de fundo", default: "" },
      { id: "heading", type: "text", label: "Título", default: "Nova coleção", maxLength: 120 },
      { id: "text", type: "textarea", label: "Texto", default: "Peças escolhidas para você.", maxLength: 300 },
      { id: "ctaLabel", type: "text", label: "Texto do botão", default: "Ver coleção", maxLength: 40 }, { id: "ctaLink", type: "url", label: "Link do botão", default: "/catalog" },
      { id: "secondaryLabel", type: "text", label: "Texto do segundo botão", default: "", maxLength: 40 }, { id: "secondaryLink", type: "url", label: "Link do segundo botão", default: "" },
      HEIGHT, ALIGN, { id: "overlay", type: "range", label: "Escurecer a imagem", min: 0, max: 80, step: 5, unit: "%", default: 40 }, TEXT_TONE, FULL_WIDTH,
    ],
    presets: [{ name: "Destaque com imagem" }],
  },
  {
    type: "slideshow", name: "Apresentação de slides", description: "Vários destaques que se alternam, com setas e pontos.", category: "Destaque", region: "content", pages: ["home"], requires: "hero.slides", maxBlocks: 6,
    settings: [{ id: "autoplay", type: "checkbox", label: "Passar automaticamente", default: true }, { id: "interval", type: "range", label: "Segundos por slide", min: 3, max: 10, step: 1, unit: "s", default: 6 }, HEIGHT, { id: "showDots", type: "checkbox", label: "Mostrar pontos", default: true }, { id: "showArrows", type: "checkbox", label: "Mostrar setas", default: true }, FULL_WIDTH],
    blocks: [{ type: "slide", name: "Slide", limit: 6, maxByLevel: [3, 4, 6, 6], settings: [{ id: "image", type: "image", label: "Imagem", default: "" }, { id: "heading", type: "text", label: "Título", default: "Novo slide", maxLength: 100 }, { id: "text", type: "text", label: "Texto", default: "", maxLength: 160 }, { id: "ctaLabel", type: "text", label: "Texto do botão", default: "Ver mais", maxLength: 40 }, { id: "ctaLink", type: "url", label: "Link", default: "/catalog" }, ALIGN, TEXT_TONE] }],
    presets: [{ name: "Apresentação de slides", blocks: [{ type: "slide", settings: { heading: "Coleção 25/26", text: "Os lançamentos chegaram.", ctaLabel: "Ver lançamentos" } }, { type: "slide", settings: { heading: "Ofertas da semana", text: "Aproveite antes que acabe.", ctaLabel: "Ver ofertas", align: "center" } }, { type: "slide", settings: { heading: "Clássicos para vestir", text: "Peças que nunca saem de moda.", ctaLabel: "Ver clássicos", align: "right" } }] }],
  },
  {
    type: "video-hero", name: "Destaque com vídeo", description: "Vídeo em tela larga (YouTube ou arquivo) com texto por cima.", category: "Destaque", region: "content", pages: ["home"], requires: "hero.video",
    settings: [
      { id: "video", type: "video", label: "Vídeo", default: "" }, { id: "poster", type: "image", label: "Imagem de capa", default: "" },
      { id: "heading", type: "text", label: "Título", default: "Veja em movimento", maxLength: 120 }, { id: "text", type: "textarea", label: "Texto", default: "", maxLength: 300 },
      { id: "ctaLabel", type: "text", label: "Texto do botão", default: "Ver coleção", maxLength: 40 }, { id: "ctaLink", type: "url", label: "Link do botão", default: "/catalog" },
      HEIGHT, ALIGN, { id: "overlay", type: "range", label: "Escurecer o vídeo", min: 0, max: 80, step: 5, unit: "%", default: 40 }, FULL_WIDTH,
    ],
    presets: [{ name: "Destaque com vídeo" }],
  },
  {
    type: "category-grid", name: "Grade de categorias", description: "Cartões das categorias do catálogo.", category: "Produtos", region: "content", pages: ["home", "collection"], requires: "navigation.visualCategories",
    settings: [{ id: "heading", type: "text", label: "Título", default: "Compre por categoria", maxLength: 80 }, COLUMNS(4), { id: "style", type: "select", label: "Formato", options: [{ value: "cards", label: "Cartões" }, { value: "circles", label: "Círculos" }], default: "cards" }, { id: "showCount", type: "checkbox", label: "Mostrar quantidade de produtos", default: true }], maxBlocks: 12,
    // Imagem própria por categoria (opcional): sem bloco, a categoria usa a foto do primeiro produto.
    blocks: [{ type: "category-image", name: "Imagem de categoria", limit: 12, settings: [{ id: "category", type: "text", label: "Categoria (nome como no catálogo)", default: "", maxLength: 60 }, { id: "image", type: "image", label: "Imagem", default: "" }] }],
    presets: [{ name: "Grade de categorias" }],
  },
  {
    type: "image-with-text", name: "Imagem com texto", description: "Imagem de um lado e texto com botão do outro.", category: "Conteúdo", region: "content", pages: ["home", "product", "collection"], requires: "content.imageText",
    settings: [{ id: "image", type: "image", label: "Imagem", default: "" }, { id: "heading", type: "text", label: "Título", default: "Feito com cuidado", maxLength: 100 }, { id: "body", type: "richtext", label: "Texto", default: "Conte o que torna as suas peças especiais." }, { id: "ctaLabel", type: "text", label: "Texto do botão", default: "", maxLength: 40 }, { id: "ctaLink", type: "url", label: "Link do botão", default: "/catalog" }, { id: "reverse", type: "checkbox", label: "Imagem à direita", default: false }, { id: "ratio", type: "select", label: "Formato da imagem", options: [{ value: "portrait", label: "Retrato" }, { value: "square", label: "Quadrado" }, { value: "landscape", label: "Paisagem" }], default: "portrait" }],
    presets: [{ name: "Imagem com texto" }],
  },
  {
    type: "testimonials", name: "Depoimentos", description: "O que os clientes dizem, com estrelas.", category: "Confiança", region: "content", pages: ["home", "product"], requires: "content.testimonials", maxBlocks: 6,
    settings: [{ id: "heading", type: "text", label: "Título", default: "O que dizem nossos clientes", maxLength: 80 }, { id: "stars", type: "range", label: "Estrelas", min: 0, max: 5, step: 1, default: 5 }],
    blocks: [{ type: "quote", name: "Depoimento", limit: 6, settings: [{ id: "text", type: "textarea", label: "Depoimento", default: "Chegou rápido e a qualidade surpreendeu.", maxLength: 300 }, { id: "name", type: "text", label: "Nome", default: "Cliente", maxLength: 60 }, { id: "role", type: "text", label: "Cidade ou detalhe", default: "", maxLength: 60 }] }],
    presets: [{ name: "Depoimentos", blocks: [{ type: "quote", settings: { text: "Troque por um depoimento real de cliente, com autorização.", name: "Nome do cliente" } }] }],
  },
  {
    type: "faq", name: "Perguntas frequentes", description: "Lista de perguntas que abrem e fecham.", category: "Confiança", region: "content", pages: ["home", "product", "cart"], requires: "content.faq", maxBlocks: 12,
    settings: [{ id: "heading", type: "text", label: "Título", default: "Perguntas frequentes", maxLength: 80 }],
    blocks: [{ type: "question", name: "Pergunta", limit: 12, settings: [{ id: "question", type: "text", label: "Pergunta", default: "Nova pergunta", maxLength: 160 }, { id: "answer", type: "textarea", label: "Resposta", default: "", maxLength: 600 }] }],
    presets: [{ name: "Perguntas frequentes", blocks: [{ type: "question", settings: { question: "Quanto tempo leva a entrega?", answer: "O prazo e o valor do frete aparecem no fechamento da compra, calculados pelo seu CEP." } }, { type: "question", settings: { question: "Como faço uma troca?", answer: "Fale com a loja pelos contatos do rodapé. As condições de troca seguem a política da loja e o Código de Defesa do Consumidor." } }, { type: "question", settings: { question: "Quais as formas de pagamento?", answer: "As formas disponíveis aparecem no fechamento da compra." } }] }],
  },
  {
    type: "lookbook", name: "Lookbook", description: "Grade de imagens de inspiração com título e link.", category: "Destaque", region: "content", pages: ["home", "collection"], requires: "content.lookbook", maxBlocks: 6,
    settings: [{ id: "heading", type: "text", label: "Título", default: "Lookbook", maxLength: 80 }, { id: "subtitle", type: "text", label: "Subtítulo", default: "", maxLength: 120 }],
    blocks: [{ type: "look", name: "Imagem", limit: 6, settings: [{ id: "image", type: "image", label: "Imagem", default: "" }, { id: "title", type: "text", label: "Título", default: "Novo look", maxLength: 80 }, { id: "link", type: "url", label: "Link", default: "/catalog" }] }],
    presets: [{ name: "Lookbook", blocks: [{ type: "look", settings: { title: "Dia de jogo" } }, { type: "look", settings: { title: "Estilo de rua" } }, { type: "look", settings: { title: "Treino" } }, { type: "look", settings: { title: "Clássicos" } }] }],
  },
  {
    type: "countdown", name: "Contagem regressiva", description: "Contador até o fim de uma oferta.", category: "Destaque", region: "content", pages: ["home", "collection", "product"], requires: "content.countdown",
    settings: [{ id: "heading", type: "text", label: "Título", default: "A oferta termina em", maxLength: 80 }, { id: "text", type: "text", label: "Texto", default: "", maxLength: 140 }, { id: "until", type: "datetime", label: "Termina em", default: "" }, { id: "ctaLabel", type: "text", label: "Texto do botão", default: "Aproveitar", maxLength: 40 }, { id: "ctaLink", type: "url", label: "Link do botão", default: "/catalog" }, { id: "expiredText", type: "text", label: "Texto depois de acabar", default: "Oferta encerrada", maxLength: 80 }, { id: "tone", type: "select", label: "Cor", options: TONES, default: "neutral" }],
    presets: [{ name: "Contagem regressiva" }],
  },
  {
    type: "cta-banner", name: "Chamada para ação", description: "Faixa com título, texto e um botão.", category: "Destaque", region: "content", pages: ["home", "product", "collection", "cart"], requires: "content.cta",
    settings: [{ id: "heading", type: "text", label: "Título", default: "Fale com a gente", maxLength: 100 }, { id: "text", type: "text", label: "Texto", default: "Tire dúvidas e receba atendimento pelo WhatsApp.", maxLength: 180 }, { id: "buttonLabel", type: "text", label: "Texto do botão", default: "Chamar no WhatsApp", maxLength: 40 }, { id: "buttonLink", type: "url", label: "Link do botão", default: "" }, { id: "tone", type: "select", label: "Cor", options: [...TONES, { value: "light", label: "Claro" }], default: "primary" }, { id: "align", type: "select", label: "Alinhamento", options: [{ value: "left", label: "Esquerda" }, { value: "center", label: "Centro" }], default: "center" }],
    presets: [{ name: "Chamada para ação" }],
  },
  {
    type: "product-tabs", name: "Abas do produto", description: "Descrição, envio e trocas em blocos que abrem e fecham.", category: "Produtos", region: "content", pages: ["product"], requires: "product.tabs", maxBlocks: 5,
    settings: [], blocks: [{ type: "tab", name: "Aba", limit: 5, settings: [{ id: "title", type: "text", label: "Título", default: "Detalhes", maxLength: 40 }, { id: "body", type: "richtext", label: "Texto", default: "" }, { id: "useProductDescription", type: "checkbox", label: "Usar a descrição do produto", default: false }] }],
    presets: [{ name: "Abas do produto", blocks: [{ type: "tab", settings: { title: "Descrição", useProductDescription: true } }, { type: "tab", settings: { title: "Envio e prazos", body: "O prazo de entrega e o valor do frete aparecem no fechamento da compra, calculados pelo CEP." } }, { type: "tab", settings: { title: "Trocas", body: "Escreva aqui a política de trocas da sua loja." } }] }],
  },
  {
    type: "header-plus", name: "Cabeçalho com menu grande", description: "Menu com submenus em painel largo e busca com sugestões.", category: "Cabeçalho", region: "header", pages: ["home", "product", "collection", "cart"], singleton: true, slot: "site-header", required: true, requires: "navigation.megaMenu", maxBlocks: 8,
    settings: [{ id: "sticky", type: "checkbox", label: "Fixar no topo ao rolar", default: true }, { id: "logoHeight", type: "range", label: "Altura da logo (se enviou uma)", min: 24, max: 56, step: 4, unit: "px", default: 36 }, { id: "showWhatsapp", type: "checkbox", label: "Mostrar botão do WhatsApp", default: true }, { id: "showSearch", type: "checkbox", label: "Mostrar busca com sugestões", default: true }, { id: "tone", type: "select", label: "Cor do cabeçalho", options: [{ value: "light", label: "Claro" }, { value: "dark", label: "Escuro" }], default: "light" }],
    blocks: [{ type: "menu-item", name: "Item do menu", limit: 8, settings: [{ id: "label", type: "text", label: "Nome", default: "Novo item", maxLength: 40 }, { id: "link", type: "url", label: "Link", default: "/catalog" }, { id: "children", type: "textarea", label: "Submenu (uma linha por link: Nome | /endereço)", default: "", maxLength: 400 }] }],
    presets: [{ name: "Cabeçalho com menu grande", blocks: [{ type: "menu-item", settings: { label: "Camisas", link: "/catalog", children: "Todas as camisas | /catalog\nNovidades | /catalog?sort=newest" } }, { type: "menu-item", settings: { label: "Ofertas", link: "/catalog" } }, { type: "menu-item", settings: { label: "Contato", link: "#contato" } }] }],
  },
  {
    type: "security-seals", name: "Selos de segurança", description: "Compra segura, Pix, envio rastreado e troca: o que dá confiança a quem compra.", category: "Confiança", region: "content", pages: ["home", "product", "cart"], maxBlocks: 6,
    settings: [{ id: "heading", type: "text", label: "Título (opcional)", default: "Compre com segurança", maxLength: 60 }, { id: "style", type: "select", label: "Formato", options: [{ value: "row", label: "Linha" }, { value: "cards", label: "Cartões" }], default: "row" }],
    blocks: [{ type: "seal", name: "Selo", limit: 6, settings: [{ id: "kind", type: "select", label: "Selo", options: [{ value: "ssl", label: "Site seguro (conexão criptografada)" }, { value: "pix", label: "Pagamento por Pix" }, { value: "gateway", label: "Pagamento processado pelo Mercado Pago" }, { value: "tracking", label: "Envio rastreado" }, { value: "exchange", label: "Troca e devolução" }, { value: "support", label: "Atendimento humano" }, { value: "original", label: "Produto conferido" }], default: "ssl" }, { id: "title", type: "text", label: "Título (opcional, troca o padrão)", default: "", maxLength: 40 }, { id: "text", type: "text", label: "Texto (opcional, troca o padrão)", default: "", maxLength: 90 }] }],
    presets: [{ name: "Selos de segurança", blocks: [{ type: "seal", settings: { kind: "ssl" } }, { type: "seal", settings: { kind: "pix" } }, { type: "seal", settings: { kind: "tracking" } }, { type: "seal", settings: { kind: "exchange" } }] }],
  },
  {
    type: "store-about", name: "Sobre a loja e contato", description: "Quem está por trás da loja: texto, razão social, CNPJ, e-mail, endereço e redes.", category: "Confiança", region: "content", pages: ["home"],
    settings: [{ id: "heading", type: "text", label: "Título", default: "Quem somos", maxLength: 80 }, { id: "body", type: "richtext", label: "Texto", default: "Conte a história da sua loja e o que você promete a quem compra." }, { id: "showContact", type: "checkbox", label: "Mostrar contato e dados da empresa", default: true }],
    presets: [{ name: "Sobre a loja e contato" }],
  },
  {
    type: "whatsapp-float", name: "Botão flutuante do WhatsApp", description: "Botão fixo no canto da tela para o cliente chamar no WhatsApp.", category: "Confiança", region: "footer", pages: ["home", "product", "collection", "cart"], singleton: true,
    settings: [{ id: "message", type: "text", label: "Mensagem inicial", default: "Olá! Vim pela loja e gostaria de ajuda.", maxLength: 140 }, { id: "position", type: "select", label: "Posição", options: [{ value: "right", label: "Direita" }, { value: "left", label: "Esquerda" }], default: "right" }],
    presets: [{ name: "Botão flutuante do WhatsApp" }],
  },
  {
    type: "footer", name: "Rodapé", description: "Texto, redes e selos.", category: "Rodapé", region: "footer", pages: ["home", "product", "collection", "cart"], singleton: true, required: true,
    settings: [{ id: "text", type: "text", label: "Texto do rodapé", default: "", maxLength: 160 }, { id: "showLegal", type: "checkbox", label: "Mostrar CNPJ, e-mail e endereço", default: true }, { id: "showInstagram", type: "checkbox", label: "Mostrar Instagram", default: true }, { id: "showBadges", type: "checkbox", label: "Mostrar “Pagamento seguro” e “Envio para todo o Brasil”", default: true }, { id: "tone", type: "select", label: "Cor do rodapé", options: [{ value: "light", label: "Claro" }, { value: "dark", label: "Escuro" }], default: "light" }],
    presets: [{ name: "Rodapé padrão" }],
  },
];

export const SECTION_BY_TYPE: Record<string, SectionSchema> = Object.fromEntries(SECTION_SCHEMAS.map((s) => [s.type, s]));
export const sectionSchema = (type: string): SectionSchema | undefined => SECTION_BY_TYPE[type];
