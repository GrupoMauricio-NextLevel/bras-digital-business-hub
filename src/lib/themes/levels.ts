/**
 * Níveis de tema e capacidades (puro, sem banco). Fonte única de "o que cada nível permite" para editor, servidor,
 * galeria e páginas públicas. Os níveis são cumulativos: N1 ⊆ N2 ⊆ N3 ⊆ N4.
 *
 * Cinco conceitos separados (docs/temas-modulares/ESPECIFICACAO.md):
 *   plano operacional (oferta da loja) · nível do tema · identidade (família) · segmento · licença.
 * O plano só decide se a loja TEM loja virtual e quais módulos operacionais existem; não decide o que o tema edita.
 */
export const LEVELS = [1, 2, 3, 4] as const;
export type ThemeLevel = (typeof LEVELS)[number];

export const LEVEL_INFO: Record<ThemeLevel, { name: string; short: string; goal: string }> = {
  1: { name: "Grátis", short: "N1", goal: "Loja funcional" },
  2: { name: "Profissional", short: "N2", goal: "Apresentação profissional" },
  3: { name: "Avançado", short: "N3", goal: "Composição comercial" },
  4: { name: "Exclusivo", short: "N4", goal: "Experiência exclusiva" },
};

/** Famílias (identidade + segmento). `base` são os temas genéricos (Starter e Signature). */
export const FAMILIES = ["base", "moda", "sport", "casa", "beauty", "conecta", "atacado"] as const;
export type ThemeFamily = (typeof FAMILIES)[number];
export const FAMILY_INFO: Record<ThemeFamily, { name: string; segment: string; demoStore: string | null }> = {
  base: { name: "Base", segment: "Qualquer loja", demoStore: null },
  moda: { name: "Moda", segment: "Confecção, básicos e conjuntos", demoStore: "Trama Urbana" },
  sport: { name: "Esporte", segment: "Camisas genéricas e esportivo", demoStore: "Linha de Jogo" },
  casa: { name: "Casa", segment: "Utilidades e organização", demoStore: "Casa em Ordem" },
  beauty: { name: "Beleza", segment: "Acessórios de beleza", demoStore: "Bela Essência" },
  conecta: { name: "Celular e acessórios", segment: "Acessórios de celular e pequenos eletrônicos", demoStore: "Ponto Conecta" },
  atacado: { name: "Atacado", segment: "Importadores e atacadistas: venda por caixa fechada", demoStore: "Giro Distribuidora" },
};

/**
 * Capacidades semânticas e o nível mínimo de tema que as concede. Recursos de segurança, acessibilidade, histórico,
 * adequação ao celular, catálogo e checkout NÃO são capacidades: valem para todos.
 */
export const CAPABILITY_LEVEL = {
  // Edição (todos os níveis editam o conteúdo dos espaços que existem)
  "editor.content": 1, "editor.hide": 1, "media.library": 1, "media.crop": 1, "media.mobile": 1,
  "editor.variants": 2, "editor.addApproved": 2,
  "editor.reorder": 3, "editor.addSections": 3, "editor.duplicate": 3, "editor.sectionTemplates": 3,
  "editor.pageTemplates": 4, "editor.conditions": 4,
  // Destaque e banners
  "hero.image": 1, "banner.fixedSlots": 1,
  "hero.slides": 2, "banner.extraSlots": 2,
  "hero.carousel": 3, "banner.mosaic": 3, "banner.betweenShowcases": 3, "campaign.sets": 3,
  "hero.video": 4, "banner.schedule": 4, "banner.conditions": 4,
  // Banners que organizam a navegação (D88)
  "navigation.cards": 2, "marketing.welcomeCoupon": 2,
  "hero.layers": 3, "navigation.categoryBanner": 3,
  "hero.immersive": 4,
  // Conteúdo
  "content.basic": 1,
  "content.imageText": 2, "content.faq": 2, "content.cta": 2,
  "content.lookbook": 3, "content.testimonials": 3, "content.countdown": 3,
  // Produto e navegação
  "product.basic": 1,
  "product.quickView": 2, "product.tabs": 2, "product.stickyBar": 2,
  "navigation.basic": 1, "navigation.visualCategories": 2, "navigation.sort": 3,
  "navigation.megaMenu": 4, "navigation.searchSuggest": 4,
  // Estilo
  "style.basic": 1, "style.extended": 2, "style.motion": 4, "style.tokens": 4,
} as const;
export type Capability = keyof typeof CAPABILITY_LEVEL;
export const CAPABILITIES = Object.keys(CAPABILITY_LEVEL) as Capability[];

export const CAPABILITY_LABEL: Record<Capability, string> = {
  "editor.content": "Editar textos, imagens e links", "editor.hide": "Ocultar espaços opcionais", "media.library": "Biblioteca de imagens", "media.crop": "Recorte e ponto de foco", "media.mobile": "Imagem própria para o celular",
  "editor.variants": "Variantes de layout aprovadas", "editor.addApproved": "Espaços extras aprovados",
  "editor.reorder": "Reorganizar seções", "editor.addSections": "Adicionar qualquer seção do nível", "editor.duplicate": "Duplicar seções", "editor.sectionTemplates": "Salvar modelos de seção",
  "editor.pageTemplates": "Modelos de página e campanha", "editor.conditions": "Banners por página ou categoria",
  "hero.image": "Destaque com imagem própria", "banner.fixedSlots": "4 banners na página inicial",
  "hero.slides": "Destaque com até 2 slides", "banner.extraSlots": "Banners extras na home e na coleção",
  "hero.carousel": "Carrossel com até 6 slides", "banner.mosaic": "Mosaico de banners", "banner.betweenShowcases": "Banners entre vitrines", "campaign.sets": "Conjuntos de campanha",
  "hero.video": "Destaque com vídeo", "banner.schedule": "Agendamento de banners", "banner.conditions": "Banners por contexto",
  "navigation.cards": "Cartões de navegação (novidades, ofertas)", "marketing.welcomeCoupon": "Cupom de boas-vindas",
  "hero.layers": "Destaque em camadas com movimento", "navigation.categoryBanner": "Banner no topo de cada categoria",
  "hero.immersive": "Destaque imersivo com animação na rolagem",
  "content.basic": "Textos, vitrines e selos", "content.imageText": "Imagem com texto", "content.faq": "Perguntas frequentes", "content.cta": "Chamada para ação",
  "content.lookbook": "Lookbook", "content.testimonials": "Depoimentos", "content.countdown": "Contagem regressiva",
  "product.basic": "Galeria, variações e compra", "product.quickView": "Compra rápida", "product.tabs": "Abas no produto", "product.stickyBar": "Barra fixa de compra no celular",
  "navigation.basic": "Menu e categorias", "navigation.visualCategories": "Categorias com imagem", "navigation.sort": "Ordenação no catálogo",
  "navigation.megaMenu": "Menu grande com submenus", "navigation.searchSuggest": "Busca com sugestões",
  "style.basic": "Logo, cores e fontes selecionadas", "style.extended": "Mais fontes, cantos e botões", "style.motion": "Movimento discreto ao rolar", "style.tokens": "Estilos reutilizáveis",
};

/** Capacidades concedidas por um nível (cumulativo). */
export function capabilitiesOf(level: ThemeLevel): Set<Capability> {
  return new Set(CAPABILITIES.filter((c) => CAPABILITY_LEVEL[c] <= level));
}
export const levelFor = (c: Capability): ThemeLevel => CAPABILITY_LEVEL[c] as ThemeLevel;
export const isLevel = (n: unknown): n is ThemeLevel => n === 1 || n === 2 || n === 3 || n === 4;

/** Módulos operacionais da plataforma que um bloco de tema pode exigir (contratados à parte, nunca pelo tema). */
export const PLATFORM_MODULES = { wholesale: { name: "Atacado (preço por quantidade e pedido mínimo)", available: false } } as const;
export type PlatformModule = keyof typeof PLATFORM_MODULES;

/** Quantos espaços extras de conteúdo o N2 pode acrescentar por página (além da composição do tema). */
export const N2_EXTRA_SECTIONS = 3;
