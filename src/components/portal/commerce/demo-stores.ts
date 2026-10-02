/**
 * Lojas de demonstração da home da NextLevel Commerce. Tudo aqui é fictício: nomes, produtos e preços
 * (em centavos). As fotos são de uso livre (Unsplash License), sem marca de terceiros visível; ver `docs/design/HOME-COMMERCE-V1.md`.
 * Os preços aqui NÃO alimentam cobrança nem permissões: servem só para ilustrar.
 */
export type DemoProduct = { name: string; priceCents: number; img: string; tag?: string };
export type DemoStore = {
  key: "moda" | "casa" | "acessorios";
  /** Chave do tema existente no catálogo (`src/lib/themes/catalog.ts`) que a loja de demonstração representa. */
  theme: "starter" | "editorial" | "signature";
  segment: string; name: string; tagline: string; banner: { img: string; title: string; text: string; cta: string };
  nav: string[]; products: DemoProduct[]; alt: string;
};

const p = (dir: string, n: string) => `/portal/commerce/${dir}-${n}.webp`;

export const DEMO_STORES: DemoStore[] = [
  {
    key: "moda", theme: "starter", segment: "Moda", name: "Fio & Linha", tagline: "Roupas para o dia a dia", alt: "Loja de moda de demonstração",
    banner: { img: p("moda", "hero"), title: "Coleção de outono", text: "Conjuntos e peças básicas em tecidos macios.", cta: "Ver coleção" },
    nav: ["Novidades", "Feminino", "Masculino", "Ofertas"],
    products: [
      { name: "Poncho de tricô cru", priceCents: 17990, img: p("moda", "1"), tag: "Novo" },
      { name: "Camiseta verde-musgo", priceCents: 7990, img: p("moda", "2") },
      { name: "Jaqueta de couro sintético", priceCents: 28990, img: p("moda", "3") },
      { name: "Sandália salto bloco", priceCents: 21990, img: p("moda", "4"), tag: "Últimas unidades" },
    ],
  },
  {
    key: "casa", theme: "editorial", segment: "Casa e decoração", name: "Ateliê Sala", tagline: "Móveis com assinatura", alt: "Loja de decoração de demonstração",
    banner: { img: p("casa", "hero"), title: "A poltrona que muda a sala", text: "Peças pensadas para morar bem, uma por vez.", cta: "Conhecer a coleção" },
    nav: ["Sofás", "Cadeiras", "Mesas", "Lookbook"],
    products: [
      { name: "Sofá de veludo verde", priceCents: 349000, img: p("casa", "1") },
      { name: "Sofá de couro caramelo", priceCents: 429000, img: p("casa", "2"), tag: "Sob encomenda" },
      { name: "Sofá retrô laranja", priceCents: 289000, img: p("casa", "3") },
      { name: "Cadeira estofada cinza", priceCents: 69000, img: p("casa", "4") },
    ],
  },
  {
    key: "acessorios", theme: "signature", segment: "Acessórios", name: "Rota 7", tagline: "Bolsas, joias e áudio", alt: "Loja de acessórios de demonstração",
    banner: { img: p("ace", "hero"), title: "Som que acompanha você", text: "Fones, bolsas e joias com envio para todo o Brasil.", cta: "Ver ofertas" },
    nav: ["Bolsas", "Joias", "Áudio", "Mochilas", "Ofertas"],
    products: [
      { name: "Bolsa estruturada vermelha", priceCents: 38990, img: p("ace", "1"), tag: "-15%" },
      { name: "Bolsa de palha com alça", priceCents: 31990, img: p("ace", "2") },
      { name: "Brincos dourados", priceCents: 12990, img: p("ace", "3") },
      { name: "Carteira de couro", priceCents: 14990, img: p("ace", "4"), tag: "Novo" },
    ],
  },
];

/** Fotos para a simulação de personalização. */
export const CUSTOMIZER_PRODUCTS: DemoProduct[] = [
  { name: "Mochila azul-marinho", priceCents: 24990, img: p("ace", "5") },
  { name: "Fone de ouvido", priceCents: 18990, img: p("ace", "6") },
  { name: "Camiseta verde-musgo", priceCents: 7990, img: p("moda", "2") },
];
