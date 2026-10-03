import type { SectionSchema, SettingDef } from "./types";

const TONES = [{ value: "primary", label: "Cor principal" }, { value: "accent", label: "Cor de destaque" }, { value: "neutral", label: "Neutro escuro" }];
const ICONS = [{ value: "truck", label: "Caminhão" }, { value: "shield", label: "Escudo" }, { value: "refresh", label: "Troca" }, { value: "star", label: "Estrela" }, { value: "heart", label: "Coração" }, { value: "clock", label: "Relógio" }];
const ARENA_UP = ["lume", "ninho", "arena", "editorial", "signature"];
const HEIGHT: SettingDef = { id: "height", type: "select", label: "Altura", options: [{ value: "sm", label: "Baixa" }, { value: "md", label: "Média" }, { value: "lg", label: "Alta" }, { value: "full", label: "Tela cheia" }], default: "md" };
const ALIGN: SettingDef = { id: "align", type: "select", label: "Alinhamento do texto", options: [{ value: "left", label: "Esquerda" }, { value: "center", label: "Centro" }, { value: "right", label: "Direita" }], default: "left" };
const TEXT_TONE: SettingDef = { id: "textColor", type: "select", label: "Cor do texto", options: [{ value: "light", label: "Claro" }, { value: "dark", label: "Escuro" }], default: "light" };
const FULL_WIDTH: SettingDef = { id: "fullWidth", type: "checkbox", label: "Largura total da tela", default: false };
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
    type: "header", name: "Cabeçalho", description: "Logo, menu, WhatsApp e carrinho.", category: "Cabeçalho", region: "header", pages: ["home", "product", "collection", "cart"], singleton: true, slot: "site-header",
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
    type: "product-main", name: "Produto", description: "Galeria, título, preço, tamanhos e botão de compra.", category: "Produtos", region: "content", pages: ["product"], singleton: true,
    settings: [
      { id: "gallery", type: "select", label: "Galeria", options: [{ value: "stacked", label: "Imagem grande" }, { value: "thumbs", label: "Imagem e miniaturas" }, { value: "grid", label: "Grade de imagens" }], default: "stacked" },
      { id: "showBreadcrumb", type: "checkbox", label: "Mostrar caminho (Início > Catálogo)", default: true },
      { id: "shippingNote", type: "text", label: "Aviso de envio", default: "Enviado pela Central Sports · etiqueta em até 1 dia útil após confirmação", maxLength: 140 },
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
    type: "collection-header", name: "Cabeçalho do catálogo", description: "Título, contagem, busca e categorias.", category: "Produtos", region: "content", pages: ["collection"], singleton: true,
    settings: [{ id: "showCount", type: "checkbox", label: "Mostrar quantidade de produtos", default: true }, { id: "showSearch", type: "checkbox", label: "Mostrar busca", default: true }, { id: "showCategories", type: "checkbox", label: "Mostrar categorias", default: true }, { id: "showSort", type: "checkbox", label: "Mostrar ordenação (preço e nome)", default: false }],
    presets: [{ name: "Cabeçalho do catálogo" }],
  },
  {
    type: "collection-grid", name: "Grade do catálogo", description: "Os produtos da busca ou categoria escolhida.", category: "Produtos", region: "content", pages: ["collection"], singleton: true,
    settings: [COLUMNS(), { id: "emptyText", type: "text", label: "Texto quando não há produtos", default: "Nenhum produto encontrado.", maxLength: 100 }],
    presets: [{ name: "Grade do catálogo" }],
  },
  {
    type: "cart-main", name: "Carrinho", description: "Itens, frete e resumo do pedido.", category: "Produtos", region: "content", pages: ["cart"], singleton: true,
    settings: [], presets: [{ name: "Carrinho" }],
  },
  // ------------------------------------------------------------------ seções dos temas pagos
  {
    type: "arena-hero", name: "Destaque Arena", description: "Destaque esportivo de alto impacto que usa automaticamente um produto real da loja.", category: "Destaque", region: "content", pages: ["home"], themes: ["arena", "signature"],
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
    type: "image-hero", name: "Destaque com imagem", description: "Imagem grande com texto e botões por cima.", category: "Destaque", region: "content", pages: ["home", "collection"], themes: ARENA_UP,
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
    type: "slideshow", name: "Apresentação de slides", description: "Vários destaques que se alternam, com setas e pontos.", category: "Destaque", region: "content", pages: ["home"], themes: ["arena", "signature"], maxBlocks: 6,
    settings: [{ id: "autoplay", type: "checkbox", label: "Passar automaticamente", default: true }, { id: "interval", type: "range", label: "Segundos por slide", min: 3, max: 10, step: 1, unit: "s", default: 6 }, HEIGHT, { id: "showDots", type: "checkbox", label: "Mostrar pontos", default: true }, { id: "showArrows", type: "checkbox", label: "Mostrar setas", default: true }, FULL_WIDTH],
    blocks: [{ type: "slide", name: "Slide", limit: 6, settings: [{ id: "image", type: "image", label: "Imagem", default: "" }, { id: "heading", type: "text", label: "Título", default: "Novo slide", maxLength: 100 }, { id: "text", type: "text", label: "Texto", default: "", maxLength: 160 }, { id: "ctaLabel", type: "text", label: "Texto do botão", default: "Ver mais", maxLength: 40 }, { id: "ctaLink", type: "url", label: "Link", default: "/catalog" }, ALIGN, TEXT_TONE] }],
    presets: [{ name: "Apresentação de slides", blocks: [{ type: "slide", settings: { heading: "Coleção 25/26", text: "Os lançamentos chegaram.", ctaLabel: "Ver lançamentos" } }, { type: "slide", settings: { heading: "Ofertas da semana", text: "Aproveite antes que acabe.", ctaLabel: "Ver ofertas", align: "center" } }, { type: "slide", settings: { heading: "Clássicos para vestir", text: "Peças que nunca saem de moda.", ctaLabel: "Ver clássicos", align: "right" } }] }],
  },
  {
    type: "video-hero", name: "Destaque com vídeo", description: "Vídeo em tela larga (YouTube ou arquivo) com texto por cima.", category: "Destaque", region: "content", pages: ["home"], themes: ["editorial", "signature"],
    settings: [
      { id: "video", type: "video", label: "Vídeo", default: "" }, { id: "poster", type: "image", label: "Imagem de capa", default: "" },
      { id: "heading", type: "text", label: "Título", default: "Veja em movimento", maxLength: 120 }, { id: "text", type: "textarea", label: "Texto", default: "", maxLength: 300 },
      { id: "ctaLabel", type: "text", label: "Texto do botão", default: "Ver coleção", maxLength: 40 }, { id: "ctaLink", type: "url", label: "Link do botão", default: "/catalog" },
      HEIGHT, ALIGN, { id: "overlay", type: "range", label: "Escurecer o vídeo", min: 0, max: 80, step: 5, unit: "%", default: 40 }, FULL_WIDTH,
    ],
    presets: [{ name: "Destaque com vídeo" }],
  },
  {
    type: "category-grid", name: "Grade de categorias", description: "Cartões das categorias do catálogo.", category: "Produtos", region: "content", pages: ["home", "collection"], themes: ARENA_UP,
    settings: [{ id: "heading", type: "text", label: "Título", default: "Compre por categoria", maxLength: 80 }, COLUMNS(4), { id: "style", type: "select", label: "Formato", options: [{ value: "cards", label: "Cartões" }, { value: "circles", label: "Círculos" }], default: "cards" }, { id: "showCount", type: "checkbox", label: "Mostrar quantidade de produtos", default: true }],
    presets: [{ name: "Grade de categorias" }],
  },
  {
    type: "image-with-text", name: "Imagem com texto", description: "Imagem de um lado e texto com botão do outro.", category: "Conteúdo", region: "content", pages: ["home", "product", "collection"], themes: ["lume", "ninho", "editorial", "signature"],
    settings: [{ id: "image", type: "image", label: "Imagem", default: "" }, { id: "heading", type: "text", label: "Título", default: "Feito com cuidado", maxLength: 100 }, { id: "body", type: "richtext", label: "Texto", default: "Conte o que torna as suas peças especiais." }, { id: "ctaLabel", type: "text", label: "Texto do botão", default: "", maxLength: 40 }, { id: "ctaLink", type: "url", label: "Link do botão", default: "/catalog" }, { id: "reverse", type: "checkbox", label: "Imagem à direita", default: false }, { id: "ratio", type: "select", label: "Formato da imagem", options: [{ value: "portrait", label: "Retrato" }, { value: "square", label: "Quadrado" }, { value: "landscape", label: "Paisagem" }], default: "portrait" }],
    presets: [{ name: "Imagem com texto" }],
  },
  {
    type: "testimonials", name: "Depoimentos", description: "O que os clientes dizem, com estrelas.", category: "Confiança", region: "content", pages: ["home", "product"], themes: ["editorial", "signature"], maxBlocks: 6,
    settings: [{ id: "heading", type: "text", label: "Título", default: "O que dizem nossos clientes", maxLength: 80 }, { id: "stars", type: "range", label: "Estrelas", min: 0, max: 5, step: 1, default: 5 }],
    blocks: [{ type: "quote", name: "Depoimento", limit: 6, settings: [{ id: "text", type: "textarea", label: "Depoimento", default: "Chegou rápido e a qualidade surpreendeu.", maxLength: 300 }, { id: "name", type: "text", label: "Nome", default: "Cliente", maxLength: 60 }, { id: "role", type: "text", label: "Cidade ou detalhe", default: "", maxLength: 60 }] }],
    presets: [{ name: "Depoimentos", blocks: [{ type: "quote", settings: { text: "Chegou rápido e a qualidade surpreendeu.", name: "Depoimento de exemplo" } }, { type: "quote", settings: { text: "Atendimento excelente do começo ao fim.", name: "Depoimento de exemplo" } }, { type: "quote", settings: { text: "Já é a terceira compra. Recomendo.", name: "Depoimento de exemplo" } }] }],
  },
  {
    type: "faq", name: "Perguntas frequentes", description: "Lista de perguntas que abrem e fecham.", category: "Confiança", region: "content", pages: ["home", "product", "cart"], themes: ARENA_UP, maxBlocks: 12,
    settings: [{ id: "heading", type: "text", label: "Título", default: "Perguntas frequentes", maxLength: 80 }],
    blocks: [{ type: "question", name: "Pergunta", limit: 12, settings: [{ id: "question", type: "text", label: "Pergunta", default: "Nova pergunta", maxLength: 160 }, { id: "answer", type: "textarea", label: "Resposta", default: "", maxLength: 600 }] }],
    presets: [{ name: "Perguntas frequentes", blocks: [{ type: "question", settings: { question: "Quanto tempo leva a entrega?", answer: "O pedido é separado em até 1 dia útil e o prazo depende da transportadora e do seu CEP." } }, { type: "question", settings: { question: "Como faço a troca?", answer: "Você tem 7 dias após o recebimento para pedir a troca de tamanho. Fale com a loja pelo WhatsApp." } }, { type: "question", settings: { question: "Quais as formas de pagamento?", answer: "Pix, com confirmação automática." } }] }],
  },
  {
    type: "lookbook", name: "Lookbook", description: "Grade de imagens de inspiração com título e link.", category: "Destaque", region: "content", pages: ["home", "collection"], themes: ["editorial", "signature"], maxBlocks: 6,
    settings: [{ id: "heading", type: "text", label: "Título", default: "Lookbook", maxLength: 80 }, { id: "subtitle", type: "text", label: "Subtítulo", default: "", maxLength: 120 }],
    blocks: [{ type: "look", name: "Imagem", limit: 6, settings: [{ id: "image", type: "image", label: "Imagem", default: "" }, { id: "title", type: "text", label: "Título", default: "Novo look", maxLength: 80 }, { id: "link", type: "url", label: "Link", default: "/catalog" }] }],
    presets: [{ name: "Lookbook", blocks: [{ type: "look", settings: { title: "Dia de jogo" } }, { type: "look", settings: { title: "Estilo de rua" } }, { type: "look", settings: { title: "Treino" } }, { type: "look", settings: { title: "Clássicos" } }] }],
  },
  {
    type: "countdown", name: "Contagem regressiva", description: "Contador até o fim de uma oferta.", category: "Destaque", region: "content", pages: ["home", "collection", "product"], themes: ["arena", "signature"],
    settings: [{ id: "heading", type: "text", label: "Título", default: "A oferta termina em", maxLength: 80 }, { id: "text", type: "text", label: "Texto", default: "", maxLength: 140 }, { id: "until", type: "datetime", label: "Termina em", default: "" }, { id: "ctaLabel", type: "text", label: "Texto do botão", default: "Aproveitar", maxLength: 40 }, { id: "ctaLink", type: "url", label: "Link do botão", default: "/catalog" }, { id: "expiredText", type: "text", label: "Texto depois de acabar", default: "Oferta encerrada", maxLength: 80 }, { id: "tone", type: "select", label: "Cor", options: TONES, default: "neutral" }],
    presets: [{ name: "Contagem regressiva" }],
  },
  {
    type: "cta-banner", name: "Chamada para ação", description: "Faixa com título, texto e um botão.", category: "Destaque", region: "content", pages: ["home", "product", "collection", "cart"], themes: ARENA_UP,
    settings: [{ id: "heading", type: "text", label: "Título", default: "Fale com a gente", maxLength: 100 }, { id: "text", type: "text", label: "Texto", default: "Tire dúvidas e receba atendimento pelo WhatsApp.", maxLength: 180 }, { id: "buttonLabel", type: "text", label: "Texto do botão", default: "Chamar no WhatsApp", maxLength: 40 }, { id: "buttonLink", type: "url", label: "Link do botão", default: "" }, { id: "tone", type: "select", label: "Cor", options: [...TONES, { value: "light", label: "Claro" }], default: "primary" }, { id: "align", type: "select", label: "Alinhamento", options: [{ value: "left", label: "Esquerda" }, { value: "center", label: "Centro" }], default: "center" }],
    presets: [{ name: "Chamada para ação" }],
  },
  {
    type: "product-tabs", name: "Abas do produto", description: "Descrição, envio e trocas em blocos que abrem e fecham.", category: "Produtos", region: "content", pages: ["product"], themes: ["lume", "ninho", "editorial", "signature"], maxBlocks: 5,
    settings: [], blocks: [{ type: "tab", name: "Aba", limit: 5, settings: [{ id: "title", type: "text", label: "Título", default: "Detalhes", maxLength: 40 }, { id: "body", type: "richtext", label: "Texto", default: "" }, { id: "useProductDescription", type: "checkbox", label: "Usar a descrição do produto", default: false }] }],
    presets: [{ name: "Abas do produto", blocks: [{ type: "tab", settings: { title: "Descrição", useProductDescription: true } }, { type: "tab", settings: { title: "Envio e prazos", body: "O pedido é separado em até 1 dia útil. O prazo de entrega aparece no fechamento da compra." } }, { type: "tab", settings: { title: "Trocas", body: "Você tem 7 dias após o recebimento para pedir a troca de tamanho." } }] }],
  },
  {
    type: "header-plus", name: "Cabeçalho com menu grande", description: "Menu com submenus em painel largo e busca com sugestões.", category: "Cabeçalho", region: "header", pages: ["home", "product", "collection", "cart"], singleton: true, slot: "site-header", themes: ["signature"], maxBlocks: 8,
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
    type: "footer", name: "Rodapé", description: "Texto, redes e selos.", category: "Rodapé", region: "footer", pages: ["home", "product", "collection", "cart"], singleton: true,
    settings: [{ id: "text", type: "text", label: "Texto do rodapé", default: "", maxLength: 160 }, { id: "showLegal", type: "checkbox", label: "Mostrar CNPJ, e-mail e endereço", default: true }, { id: "showInstagram", type: "checkbox", label: "Mostrar Instagram", default: true }, { id: "showBadges", type: "checkbox", label: "Mostrar “Pagamento seguro” e “Envio para todo o Brasil”", default: true }, { id: "tone", type: "select", label: "Cor do rodapé", options: [{ value: "light", label: "Claro" }, { value: "dark", label: "Escuro" }], default: "light" }],
    presets: [{ name: "Rodapé padrão" }],
  },
];

export const SECTION_BY_TYPE: Record<string, SectionSchema> = Object.fromEntries(SECTION_SCHEMAS.map((s) => [s.type, s]));
export const sectionSchema = (type: string): SectionSchema | undefined => SECTION_BY_TYPE[type];
