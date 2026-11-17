/**
 * NextLevel Commerce (D163, nome revisto no D288): fonte única da identidade da plataforma de lojas virtuais.
 * O código de sistema continua `NEXTLEVEL_COMMERCE` (gravado no banco em lojas, assinaturas e pedidos) e o tema interno
 * continua `commerce`: muda só o nome público e o visual. Adaptada de `docs/marcas/nextlevel-ecommerce/integration/
 * brand.config.json` e `tokens/brand-tokens.json` (pacote aprovado pelo dono). Arquivos oficiais em
 * `public/marcas/nextlevel-ecommerce/` (PNG originais preservados; WebP recortados da margem transparente para exibição).
 * Não vale para as vitrines dos lojistas: cada loja tem o tema e a marca dela.
 */
export const EC_BASE = "/marcas/nextlevel-ecommerce";

export const EC = {
  code: "NEXTLEVEL_COMMERCE",
  name: "NextLevel Commerce",
  descriptor: "PLATAFORMA DE LOJAS VIRTUAIS",
  /** Endosso recomendado pelo pacote (texto, nunca selo). */
  endosso: "uma plataforma do Grupo NextLevel",
  cores: { marinho: "#101A33", azul: "#3F65FF", ciano: "#27C7F2", gelo: "#F3F6FC" },
  /** Degradê de marca: detalhes e áreas decorativas; nunca atrás de texto branco pequeno (a ponta ciano não dá contraste). */
  gradiente: "linear-gradient(135deg, #3F65FF 0%, #27C7F2 100%)",
  claro: { surface: "#FFFFFF", surfaceMuted: "#F3F6FC", text: "#101A33", textMuted: "#4B5D79", border: "#D6E0F1", action: "#294CDC", actionHover: "#2340BE", link: "#294CDC", focus: "#294CDC" },
  escuro: { surface: "#101A33", surfaceMuted: "#172540", surfaceElevated: "#1E304F", text: "#F3F6FC", textMuted: "#B7C5DC", border: "#3B5070", action: "#3F65FF", actionHover: "#4265FF", link: "#8DBAFF", focus: "#27C7F2" },
} as const;

export type EcLogo = { src: string; src2x: string; png: string; w: number; h: number };
const logo = (rel: string, w: number, h: number, small = false): EcLogo => ({
  src: `${EC_BASE}/logos/${rel}-${small ? 256 : 640}.webp`, src2x: `${EC_BASE}/logos/${rel}-${small ? 512 : 1280}.webp`, png: `${EC_BASE}/logos/${rel}.png`, w, h,
});

/** `clara` = para fundo claro; `escura` = para fundo marinho. Flat no painel, cabeçalho e rodapé; Prisma em destaques. */
export const EC_LOGOS = {
  flatClara: logo("flat/logo-clara", 2018, 521),
  flatEscura: logo("flat/logo-escura", 2017, 530),
  prismaClara: logo("prisma/logo-clara", 2119, 561),
  prismaEscura: logo("prisma/logo-escura", 2151, 589),
  verticalClara: logo("vertical/logo-vertical-clara", 1249, 892),
  verticalEscura: logo("vertical/logo-vertical-escura", 1350, 899),
  positiva: logo("monocromaticas/logo-positiva", 1970, 500),
  negativa: logo("monocromaticas/logo-negativa", 2079, 520),
  monograma: logo("monogramas/monograma-flat", 1272, 704, true),
  monogramaPrisma: logo("monogramas/monograma-prisma", 1266, 700, true),
} as const satisfies Record<string, EcLogo>;

export const EC_ICONES = {
  ico: `${EC_BASE}/logos/favicons/favicon.ico`,
  png: [16, 32, 48].map((s) => ({ url: `${EC_BASE}/logos/favicons/favicon-${s}.png`, sizes: `${s}x${s}` })),
  apple: `${EC_BASE}/logos/app-icons/apple-touch-icon-180.png`,
  manifest: `${EC_BASE}/manifest.webmanifest`,
  /** Cartão de compartilhamento composto da logo Prisma escura sobre o marinho (o pacote não traz um). */
  og: `${EC_BASE}/og-1200x630.jpg`,
} as const;

/** Constantes da marca como variáveis CSS `--ec-*` (nomes exclusivos; só o site público da plataforma as lê). */
export function ecCssVars(): string {
  const c = EC.cores;
  return `--ec-marinho:${c.marinho};--ec-marinho-2:${EC.escuro.surfaceMuted};--ec-azul:${c.azul};--ec-acao:${EC.claro.action};--ec-acao-hover:${EC.claro.actionHover};--ec-ciano:${c.ciano};--ec-gelo:${c.gelo};--ec-link-escuro:${EC.escuro.link};--ec-texto-suave:${EC.escuro.textMuted};--ec-azul-suave:#E3EAFF;--ec-gradiente:${EC.gradiente};`;
}

/**
 * Nome público de um plano da plataforma de lojas. O catálogo guarda "Commerce Start" (nome interno da v1, D90) e a chave
 * `COMMERCE_START`; para o lojista e nas telas o plano é só "Plano Start" (a marca já está na página). Aceita nome ou chave.
 */
export function nomePlanoEc(nomeOuChave: string): string {
  const base = nomeOuChave.replace(/^COMMERCE_/, "").replace(/^Commerce\s+/i, "").trim();
  const nome = base === base.toUpperCase() ? base.charAt(0) + base.slice(1).toLowerCase() : base;
  return `Plano ${nome}`;
}

/** Nome de um item do catálogo na tela: plano da plataforma vira "Plano X"; qualquer outro produto fica como está. */
export const nomeProdutoEc = (nome: string) => (/^Commerce (Start|Pro|Scale|Enterprise)$/.test(nome) ? nomePlanoEc(nome) : nome);

/**
 * NextLevel Business (D304): nome da ÁREA do painel que gerencia o negócio, nunca uma marca, domínio ou cadastro à parte.
 * A plataforma continua "NextLevel Commerce" (getBrand()). Trocar o nome = mudar só esta linha (e os testes de texto).
 */
export const NOME_GERENCIADOR = { nome: "Meu negócio", subtitulo: "O dia a dia do seu negócio" } as const;
/**
 * D324: "NextLevel Business" fica reservado para o sistema avançado de gestão, contratado à parte (decisão do dono em
 * andamento). O painel de todo cliente se chama "Meu negócio". Soluções Digitais = serviços da agência; Loja virtual =
 * planos Start/Pro/Scale intactos; Sites = captação de clientes ligada aos anúncios.
 */
export const NOME_BUSINESS = "NextLevel Business" as const;

/** Os dois caminhos da entrada (D304). `para=site|loja` no cadastro e no formulário assistido. */
export const CAMINHOS = {
  site: { chave: "site", formato: "SITE", titulo: "Site para minha empresa", curto: "Site", descricao: "Site profissional, páginas para seus anúncios e todos os seus contatos num painel só." },
  loja: { chave: "loja", formato: "LOJA", titulo: "Loja virtual", curto: "Loja virtual", descricao: "Venda online com catálogo, carrinho, Pix e cartão, e gerencie tudo no mesmo painel." },
} as const;
export type CaminhoChave = keyof typeof CAMINHOS;
export const caminhoDe = (v: string | null | undefined): CaminhoChave | null => (v === "site" || v === "loja" ? v : null);
