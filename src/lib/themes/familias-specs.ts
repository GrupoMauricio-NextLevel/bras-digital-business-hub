/**
 * Identidade de cada família (estilo e textos por nível). A composição por nível é a mesma para todas: presets-familia.ts.
 * Links de categoria usam o mesmo `slugify` do cadastro de produtos, então funcionam com o catálogo da demonstração.
 * Textos: sem promessa de frete, prazo, desconto ou depoimento; o que é da loja real o lojista escreve no editor.
 */
import { slugify } from "@/lib/ids";
import type { FamilySpec } from "./presets-familia";

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
