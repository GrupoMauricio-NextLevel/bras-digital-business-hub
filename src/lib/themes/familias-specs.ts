/**
 * Identidade de cada família (estilo e textos por nível). A composição por nível é a mesma para todas: presets-familia.ts.
 * Links de categoria usam o mesmo `slugify` do cadastro de produtos, então funcionam com o catálogo da demonstração.
 * Textos: sem promessa de frete, prazo, desconto ou depoimento; o que é da loja real o lojista escreve no editor.
 */
import { slugify } from "@/lib/ids";
import type { FamilySpec, Slot } from "./presets-familia";
import { packageOf, selectionLink, type PackageCampaign } from "./pacotes";

const cat = (name: string) => `/catalog?category=${slugify(name)}`;
const cats = (...names: string[]) => names.map((name) => ({ name, slug: slugify(name) }));

/** Moda · Trama Urbana (Trama N1, Lume N2, Editorial N3, Atelier N4). */
export const MODA: FamilySpec = {
  id: "moda",
  styles: [
    { primary: "#1c1c1c", accent: "#9a3412", headingFont: "display", radius: 6 },
    { primary: "#1f2a44", accent: "#be185d", headingFont: "display", radius: 14 },
    { primary: "#1c1917", accent: "#a16207", headingFont: "elegante", radius: 0, buttons: "outline" },
    { primary: "#2b2118", accent: "#b45309", headingFont: "editorial", radius: 4 },
  ],
  heroFocus: { focusX: 70, focusMobileX: 50, focusMobileY: 40 }, stripFocus: { focusX: 75 },
  support: [{ title: "Peças avulsas", cta: "Ver", link: cat("Peças avulsas") }, { title: "Acessórios", cta: "Ver", link: cat("Acessórios") }],
  strip: { title: "Monte o seu conjunto", subtitle: "Peças que combinam entre si.", cta: "Ver conjuntos", link: cat("Conjuntos") },
  fallbackCategories: cats("Básicos", "Conjuntos", "Peças avulsas", "Acessórios"),
  n1: { hero: { title: "Coleção da estação", subtitle: "Básicos que combinam com tudo.", cta: "Ver coleção" }, cats: "Compre por categoria", latest: "Novidades", featured: "Mais procurados" },
  n2: { hero: { title: (n) => `Novidades na ${n}`, subtitle: "Peças escolhidas com carinho.", cta: "Ver novidades" }, hero2: { title: "Básicos para todo dia", cta: "Ver básicos", link: cat("Básicos"), align: "center" }, cats: "Compre por categoria", featured: "Escolhidos para você", featuredSub: "Os destaques da loja", latest: "Acabaram de chegar", about: { heading: (n) => `Sobre a ${n}`, body: "Conte em poucas linhas o que torna a sua loja especial." } },
  n3: {
    hero: { title: "A coleção da estação", subtitle: "Peças pensadas para durar.", cta: "Ver a coleção" }, hero2: { title: "Básicos essenciais", cta: "Ver básicos", link: cat("Básicos") }, hero3: { title: "Jaquetas e peças avulsas", cta: "Ver peças", link: cat("Peças avulsas") },
    mosaicHeading: "Escolha por estilo", mosaic: [{ title: "Conjuntos", link: cat("Conjuntos") }, { title: "Básicos", link: cat("Básicos") }, { title: "Calçados e acessórios", link: cat("Acessórios") }],
    featured: "Seleção da estação", latest: "Recém-chegados",
    gallery: { heading: "Lookbook", subtitle: "Combinações com peças da loja", items: ["Urbano", "Fim de semana", "Café", "Trabalho"] },
    about: { heading: "Feito para durar", body: (n) => `Na ${n}, cada peça é escolhida pelo caimento, pelo tecido e pelo acabamento.` },
  },
  n4: { hero: { title: (n) => `${n}: a coleção`, subtitle: "Peças de autor para o dia a dia.", cta: "Ver a coleção" }, campaign: { title: "Campanha da estação", subtitle: "Slide agendado: aparece só no período definido.", cta: "Ver acessórios", link: cat("Acessórios") }, cats: "Explore a loja", mosaic: ["Conjuntos", "Básicos", "Calçados", "Bijuterias", "Carteiras"], featured: "Seleção do ateliê", latest: "Recém-chegados" },
};

/** Casa · Casa em Ordem (Lar N1, Ninho N2, Varanda N3, Morada N4): utilidades e organização. */
export const CASA: FamilySpec = {
  id: "casa",
  styles: [
    { primary: "#28423a", accent: "#b4532a", headingFont: "display", radius: 10 },
    { primary: "#2f4a3a", accent: "#b4532a", headingFont: "editorial", radius: 10 },
    { primary: "#3b3a36", accent: "#8a6d3b", headingFont: "elegante", radius: 2 },
    { primary: "#1f3b36", accent: "#c2410c", headingFont: "editorial", radius: 16 },
  ],
  heroFocus: { focusX: 65, focusMobileX: 50, focusMobileY: 45 }, stripFocus: { focusX: 72 },
  support: [{ title: "Cozinha em ordem", cta: "Ver", link: cat("Cozinha") }, { title: "Banheiro e lavanderia", cta: "Ver", link: cat("Banheiro") }],
  strip: { title: "Cada coisa no seu lugar", subtitle: "Organizadores que cabem na rotina.", cta: "Ver organização", link: cat("Organização") },
  fallbackCategories: cats("Organização", "Cozinha", "Banheiro", "Lavanderia"),
  n1: { hero: { title: "Casa organizada, dia mais leve", subtitle: "Utilidades simples para cada cômodo.", cta: "Ver produtos" }, cats: "Compre por cômodo", latest: "Novidades", featured: "Mais procurados" },
  n2: { hero: { title: (n) => `Tudo no lugar com a ${n}`, subtitle: "Organizadores e utilidades para o dia a dia.", cta: "Ver novidades" }, hero2: { title: "Cozinha prática", cta: "Ver cozinha", link: cat("Cozinha"), align: "center" }, cats: "Compre por cômodo", featured: "Escolhidos para a sua casa", featuredSub: "Os destaques da loja", latest: "Acabaram de chegar", about: { heading: (n) => `Sobre a ${n}`, body: "Conte em poucas linhas como a sua loja ajuda a organizar a casa." } },
  n3: {
    hero: { title: "Casa em ordem, cômodo por cômodo", subtitle: "Soluções simples, que duram.", cta: "Ver a seleção" }, hero2: { title: "Cozinha prática", cta: "Ver cozinha", link: cat("Cozinha") }, hero3: { title: "Lavanderia sem bagunça", cta: "Ver lavanderia", link: cat("Lavanderia") },
    mosaicHeading: "Escolha por cômodo", mosaic: [{ title: "Organização", link: cat("Organização") }, { title: "Cozinha", link: cat("Cozinha") }, { title: "Banheiro", link: cat("Banheiro") }],
    featured: "Seleção da casa", latest: "Recém-chegados",
    gallery: { heading: "Ambientes", subtitle: "Ideias de organização com produtos da loja", items: ["Despensa", "Bancada", "Armário", "Área de serviço"] },
    about: { heading: "Feito para o dia a dia", body: (n) => `Na ${n}, cada produto é escolhido por ser prático, resistente e fácil de limpar.` },
  },
  n4: { hero: { title: (n) => `${n}: a casa do seu jeito`, subtitle: "Organização com acabamento de loja de decoração.", cta: "Ver a coleção" }, campaign: { title: "Semana da organização", subtitle: "Slide agendado: aparece só no período definido.", cta: "Ver organizadores", link: cat("Organização") }, cats: "Explore por cômodo", mosaic: ["Organização", "Cozinha", "Banheiro", "Lavanderia", "Despensa"], featured: "Seleção da casa", latest: "Recém-chegados" },
};

/** Sport · Linha de Jogo (Lance N1, Torcida N2, Arena N3 (já vendido, composição própria), Pódio N4): camisas genéricas. */
export const SPORT: FamilySpec = {
  id: "sport",
  styles: [
    { primary: "#0f172a", accent: "#16a34a", headingFont: "condensada", radius: 8 },
    { primary: "#111827", accent: "#2563eb", headingFont: "condensada", radius: 12 },
    { primary: "#0f1c16", accent: "#22c55e", headingFont: "condensada", radius: 8 },
    { primary: "#0b1220", accent: "#f59e0b", headingFont: "condensada", radius: 6 },
  ],
  heroFocus: { focusX: 68, focusMobileX: 50, focusMobileY: 40 }, stripFocus: { focusX: 72 },
  support: [{ title: "Treino", cta: "Ver", link: cat("Treino") }, { title: "Acessórios", cta: "Ver", link: cat("Acessórios") }],
  strip: { title: "Vista o seu time de amigos", subtitle: "Camisas lisas e listradas para personalizar.", cta: "Ver camisas", link: cat("Camisas") },
  fallbackCategories: cats("Camisas", "Treino", "Infantil", "Acessórios"),
  n1: { hero: { title: "Pronto para o jogo", subtitle: "Camisas e peças de treino.", cta: "Ver camisas" }, cats: "Compre por categoria", latest: "Novidades", featured: "Mais procurados" },
  n2: { hero: { title: (n) => `Entre em campo com a ${n}`, subtitle: "Camisas e peças de treino.", cta: "Ver novidades" }, hero2: { title: "Linha de treino", cta: "Ver treino", link: cat("Treino"), align: "center" }, cats: "Compre por categoria", featured: "Escolhidos para você", featuredSub: "Os destaques da loja", latest: "Acabaram de chegar", about: { heading: (n) => `Sobre a ${n}`, body: "Conte em poucas linhas para quem a sua loja veste." } },
  n3: {
    hero: { title: "Temporada nova", subtitle: "Camisas, treino e acessórios.", cta: "Ver a temporada" }, hero2: { title: "Linha de treino", cta: "Ver treino", link: cat("Treino") }, hero3: { title: "Para os pequenos", cta: "Ver infantil", link: cat("Infantil") },
    mosaicHeading: "Escolha por modalidade", mosaic: [{ title: "Camisas", link: cat("Camisas") }, { title: "Treino", link: cat("Treino") }, { title: "Acessórios", link: cat("Acessórios") }],
    featured: "Seleção da temporada", latest: "Recém-chegados",
    gallery: { heading: "Em campo", subtitle: "Combinações com peças da loja", items: ["Pelada", "Corrida", "Academia", "Torcida"] },
    about: { heading: "Feito para suar", body: (n) => `Na ${n}, cada peça é escolhida pelo tecido leve e pelo caimento no movimento.` },
  },
  n4: { hero: { title: (n) => `${n}: a temporada`, subtitle: "Camisas e treino com cara de loja oficial.", cta: "Ver a coleção" }, campaign: { title: "Campanha de fim de temporada", subtitle: "Slide agendado: aparece só no período definido.", cta: "Ver camisas", link: cat("Camisas") }, cats: "Explore a loja", mosaic: ["Camisas", "Treino", "Acessórios", "Infantil", "Meias"], featured: "Seleção da temporada", latest: "Recém-chegados" },
};

/** Beauty · Bela Essência (Pétala N1, Brilho N2, Aura N3, Musa N4): acessórios de beleza (sem promessa de resultado). */
export const BEAUTY: FamilySpec = {
  id: "beauty",
  styles: [
    { primary: "#3f2a33", accent: "#be185d", headingFont: "display", radius: 12 },
    { primary: "#4a2c3a", accent: "#c2417a", headingFont: "elegante", radius: 18 },
    { primary: "#2e2328", accent: "#a8556f", headingFont: "editorial", radius: 4 },
    { primary: "#26181f", accent: "#b45309", headingFont: "elegante", radius: 10 },
  ],
  heroFocus: { focusX: 66, focusMobileX: 50, focusMobileY: 42 }, stripFocus: { focusX: 72 },
  support: [{ title: "Cabelo", cta: "Ver", link: cat("Cabelo") }, { title: "Maquiagem", cta: "Ver", link: cat("Maquiagem") }],
  strip: { title: "Tudo no lugar na penteadeira", subtitle: "Organizadores e nécessaires.", cta: "Ver organização", link: cat("Organização") },
  fallbackCategories: cats("Cabelo", "Maquiagem", "Organização", "Cuidados"),
  n1: { hero: { title: "Seu ritual, do seu jeito", subtitle: "Acessórios de beleza para o dia a dia.", cta: "Ver produtos" }, cats: "Compre por categoria", latest: "Novidades", featured: "Mais procurados" },
  n2: { hero: { title: (n) => `Novidades na ${n}`, subtitle: "Acessórios de beleza escolhidos com cuidado.", cta: "Ver novidades" }, hero2: { title: "Pincéis e esponjas", cta: "Ver maquiagem", link: cat("Maquiagem"), align: "center" }, cats: "Compre por categoria", featured: "Escolhidos para você", featuredSub: "Os destaques da loja", latest: "Acabaram de chegar", about: { heading: (n) => `Sobre a ${n}`, body: "Conte em poucas linhas o que torna a sua loja especial." } },
  n3: {
    hero: { title: "Beleza com calma", subtitle: "Acessórios para o seu ritual.", cta: "Ver a seleção" }, hero2: { title: "Pincéis e esponjas", cta: "Ver maquiagem", link: cat("Maquiagem") }, hero3: { title: "Cabelo em dia", cta: "Ver cabelo", link: cat("Cabelo") },
    mosaicHeading: "Escolha por momento", mosaic: [{ title: "Maquiagem", link: cat("Maquiagem") }, { title: "Cabelo", link: cat("Cabelo") }, { title: "Organização", link: cat("Organização") }],
    featured: "Seleção da estação", latest: "Recém-chegados",
    gallery: { heading: "Rituais", subtitle: "Ideias com produtos da loja", items: ["Manhã", "Noite", "Viagem", "Fim de semana"] },
    about: { heading: "Feito para durar", body: (n) => `Na ${n}, cada acessório é escolhido pelo acabamento, pela praticidade e pelo cuidado com o uso diário.` },
  },
  n4: { hero: { title: (n) => `${n}: o seu ritual`, subtitle: "Acessórios de beleza com acabamento de marca.", cta: "Ver a coleção" }, campaign: { title: "Campanha de presentes", subtitle: "Slide agendado: aparece só no período definido.", cta: "Ver kits", link: cat("Organização") }, cats: "Explore a loja", mosaic: ["Maquiagem", "Cabelo", "Organização", "Cuidados", "Kits"], featured: "Seleção da casa", latest: "Recém-chegados" },
};

/** Conecta · Ponto Conecta (Sinal N1, Pulso N2, Circuito N3, Órbita N4): acessórios de celular, sem marcas de fabricantes. */
export const CONECTA: FamilySpec = {
  id: "conecta",
  styles: [
    { primary: "#0f172a", accent: "#2563eb", headingFont: "display", radius: 10 },
    { primary: "#111827", accent: "#7c3aed", headingFont: "display", radius: 16 },
    { primary: "#0b1120", accent: "#0891b2", headingFont: "condensada", radius: 6 },
    { primary: "#030712", accent: "#16a34a", headingFont: "display", radius: 12 },
  ],
  heroFocus: { focusX: 68, focusMobileX: 50, focusMobileY: 40 }, stripFocus: { focusX: 72 },
  support: [{ title: "Capinhas", cta: "Ver", link: cat("Capinhas") }, { title: "Fones de ouvido", cta: "Ver", link: cat("Fones") }],
  strip: { title: "Carregue sem complicação", subtitle: "Cabos, carregadores e baterias portáteis.", cta: "Ver carregadores", link: cat("Cabos e carregadores") },
  fallbackCategories: cats("Capinhas", "Cabos e carregadores", "Fones", "Suportes"),
  n1: { hero: { title: "Tudo para o seu celular", subtitle: "Capinhas, cabos, fones e suportes.", cta: "Ver produtos" }, cats: "Compre por categoria", latest: "Novidades", featured: "Mais procurados" },
  n2: { hero: { title: (n) => `Novidades na ${n}`, subtitle: "Acessórios para o celular do dia a dia.", cta: "Ver novidades" }, hero2: { title: "Som sem fio", cta: "Ver fones", link: cat("Fones"), align: "center" }, cats: "Compre por categoria", featured: "Escolhidos para você", featuredSub: "Os destaques da loja", latest: "Acabaram de chegar", about: { heading: (n) => `Sobre a ${n}`, body: "Conte em poucas linhas o que torna a sua loja especial." } },
  n3: {
    hero: { title: "Conectado o dia inteiro", subtitle: "Acessórios para casa, trabalho e viagem.", cta: "Ver a seleção" }, hero2: { title: "Som sem fio", cta: "Ver fones", link: cat("Fones") }, hero3: { title: "No carro e na mesa", cta: "Ver suportes", link: cat("Suportes") },
    mosaicHeading: "Escolha por uso", mosaic: [{ title: "Capinhas", link: cat("Capinhas") }, { title: "Carregadores", link: cat("Cabos e carregadores") }, { title: "Fones", link: cat("Fones") }],
    featured: "Seleção da semana", latest: "Recém-chegados",
    gallery: { heading: "No dia a dia", subtitle: "Combinações com produtos da loja", items: ["Trabalho", "Viagem", "Treino", "Carro"] },
    about: { heading: "Feito para o uso de verdade", body: (n) => `Na ${n}, cada acessório traz a especificação clara na página: potência, comprimento e compatibilidade.` },
  },
  n4: { hero: { title: (n) => `${n}: sempre conectado`, subtitle: "Acessórios com cara de loja de tecnologia.", cta: "Ver a coleção" }, campaign: { title: "Campanha de volta às aulas", subtitle: "Slide agendado: aparece só no período definido.", cta: "Ver carregadores", link: cat("Cabos e carregadores") }, cats: "Explore a loja", mosaic: ["Capinhas", "Carregadores", "Fones", "Suportes", "Películas"], featured: "Seleção da semana", latest: "Recém-chegados" },
};

/**
 * Atacado · Giro Distribuidora (Fardo N1, Lote N2, Galpão N3, Porto N4): loja de importador/atacadista (Brás, Canindé)
 * que vende caixa fechada para lojistas e distribuidores. É identidade de tema, não o módulo de atacado (lista de preços).
 * Textos sem promessa de frete, prazo ou preço: condições comerciais o lojista escreve no editor.
 */
export const ATACADO: FamilySpec = {
  id: "atacado",
  styles: [
    { primary: "#111827", accent: "#ea580c", headingFont: "condensada", radius: 6 },
    { primary: "#1e293b", accent: "#f59e0b", headingFont: "condensada", radius: 10 },
    { primary: "#0c1a2b", accent: "#dc2626", headingFont: "condensada", radius: 4 },
    { primary: "#0a0a0a", accent: "#b45309", headingFont: "condensada", radius: 8 },
  ],
  heroFocus: { focusX: 68, focusMobileX: 50, focusMobileY: 45 }, stripFocus: { focusX: 72 },
  support: [{ title: "Utilidades", cta: "Ver", link: cat("Utilidades") }, { title: "Brinquedos", cta: "Ver", link: cat("Brinquedos") }],
  strip: { title: "Venda por caixa fechada", subtitle: "Para lojistas, revendedores e distribuidores.", cta: "Ver catálogo", link: "/catalog" },
  fallbackCategories: cats("Utilidades", "Brinquedos", "Papelaria", "Acessórios"),
  n1: { hero: { title: "Atacado por caixa fechada", subtitle: "Para lojistas, revendedores e distribuidores.", cta: "Ver catálogo" }, cats: "Compre por categoria", latest: "Chegou no estoque", featured: "Mais pedidos" },
  n2: { hero: { title: (n) => `${n}: atacado para revenda`, subtitle: "Caixa fechada para lojistas e distribuidores.", cta: "Ver catálogo" }, hero2: { title: "Utilidades para revenda", cta: "Ver utilidades", link: cat("Utilidades"), align: "center" }, cats: "Compre por categoria", featured: "Mais pedidos", featuredSub: "Os itens que mais saem", latest: "Chegou no estoque", about: { heading: (n) => `Sobre a ${n}`, body: "Conte de onde vem a sua mercadoria, para quem você vende e como funciona o pedido." } },
  n3: {
    hero: { title: "Importação direta para o seu estoque", subtitle: "Caixa fechada para revenda.", cta: "Ver catálogo" }, hero2: { title: "Utilidades para revenda", cta: "Ver utilidades", link: cat("Utilidades") }, hero3: { title: "Brinquedos por caixa", cta: "Ver brinquedos", link: cat("Brinquedos") },
    mosaicHeading: "Escolha por linha", mosaic: [{ title: "Utilidades", link: cat("Utilidades") }, { title: "Brinquedos", link: cat("Brinquedos") }, { title: "Papelaria", link: cat("Papelaria") }],
    featured: "Mais pedidos", latest: "Chegou no estoque",
    gallery: { heading: "Do galpão para a sua loja", subtitle: "Como os produtos chegam", items: ["Estoque", "Separação", "Caixa fechada", "Expedição"] },
    about: { heading: "Quem somos", body: (n) => `A ${n} vende para lojistas, revendedores e distribuidores. Condições de pedido mínimo e frete ficam descritas pela loja.` },
  },
  n4: { hero: { title: (n) => `${n}: importação e atacado`, subtitle: "Caixa fechada para revenda.", cta: "Ver catálogo" }, campaign: { title: "Chegada de contêiner", subtitle: "Slide agendado: aparece só no período definido.", cta: "Ver novidades", link: "/catalog" }, cats: "Linhas de produto", mosaic: ["Utilidades", "Brinquedos", "Papelaria", "Acessórios", "Lançamentos"], featured: "Mais pedidos", latest: "Chegou no estoque" },
};

/**
 * Ajusta a identidade da família ao pacote visual da loja de demonstração (D86): as 3 campanhas do pacote viram os
 * slides e banners (título e chamada em texto da página; link mostra exatamente os SKUs da campanha), as categorias
 * passam a ser as do catálogo do pacote e as cores seguem a identidade da loja (tinta e destaque), mantendo por nível
 * as fontes, cantos e botões. Sem pacote, a família fica como está.
 */
export function withPackage(spec: FamilySpec, family: Parameters<typeof packageOf>[0]): FamilySpec {
  const p = packageOf(family); if (!p || p.campaigns.length < 3) return spec;
  const [c1, c2, c3] = p.campaigns as [PackageCampaign, PackageCampaign, PackageCampaign];
  const slot = (c: PackageCampaign, extra: Partial<Slot> = {}): Slot => ({ title: c.headline, cta: c.cta, link: selectionLink(c.skus), ...extra });
  const categories = [...new Set(p.products.map((x) => x.category))];
  const styles = (p.palette ? spec.styles.map((st) => ({ ...st, primary: p.palette!.ink, accent: p.palette!.accent })) : spec.styles) as FamilySpec["styles"];
  return {
    ...spec, styles,
    // As fotos de apoio e do mosaico são das campanhas: levam à seleção da própria campanha.
    support: [slot(c1), { title: "", cta: "", link: selectionLink(c1.skus) }],
    strip: slot(c3, { subtitle: "" }),
    fallbackCategories: cats(...categories),
    n1: { ...spec.n1, hero: slot(c1) },
    n2: { ...spec.n2, hero: slot(c1), hero2: slot(c2, { align: "center" }) },
    n3: { ...spec.n3, hero: slot(c1), hero2: slot(c2), hero3: slot(c3), gallery: { ...spec.n3.gallery, items: [spec.n3.gallery.heading, c1.headline, c3.headline, c2.headline], links: ["/catalog", ...[c1, c3, c2].map((c) => selectionLink(c.skus))] }, mosaicHeading: c2.headline, mosaic: [slot(c2, { title: c2.cta, cta: "" }), slot(c2, { title: "", cta: "" }), slot(c2, { title: "", cta: "" })] },
    n4: { ...spec.n4, hero: slot(c1), campaign: { ...spec.n4.campaign, link: selectionLink(c3.skus) }, mosaic: [c2.cta, "", "", c3.cta, ""], mosaicLinks: [c2, c2, c2, c3, c3].map((c) => selectionLink(c.skus)) },
  };
}
