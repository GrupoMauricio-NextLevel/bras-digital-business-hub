/**
 * NextLevel v2 (D161): fonte única da identidade da marca-mãe (código de sistema `NEXTLEVEL`, a holding, o Master e o site
 * do grupo). Adaptada de `docs/marcas/nextlevel/integration/brand.config.json` e `tokens/brand-tokens.json` (pacote
 * aprovado pelo dono: NL Orbital + Orbital em Avanço + Prisma Digital integral). Tema `nextlevel` (`themes.ts`), paleta
 * (`brand-palette.ts`), logo (`BrandLogo`), ícones, manifesto, prévia de link e o herói do site do grupo leem daqui:
 * nenhum hexadecimal da marca fica solto em componente. Arquivos oficiais em `public/marcas/nextlevel/v2/` (PNG originais
 * preservados; WebP/AVIF são cópias de exibição recortadas da margem transparente). As marcas-filhas não leem este arquivo.
 */
export const NL_BASE = "/marcas/nextlevel/v2";

export const NL = {
  id: "nextlevel",
  code: "NEXTLEVEL",
  name: "NextLevel",
  /** Linha da assinatura (não é slogan). */
  supportLine: "SOLUÇÕES DIGITAIS",
  /** Slogan do briefing, preservado como texto institucional; nenhum slogan novo foi aprovado. */
  tagline: "Estrutura digital para o seu negócio ir além.",
  /** Endossos recomendados pelo pacote (texto, nunca selo). */
  endosso: { produto: "um sistema NextLevel", corporativo: "parte do Grupo NextLevel" },
  cores: { marinho: "#070F22", royal: "#365BFF", azulLuminoso: "#12B8F4", turquesa: "#2AD7C0", gelo: "#F3F6FC" },
  /** Degradê de assinatura (áreas decorativas) e de filetes. Nunca atrás de texto branco: o contraste varia na ponta turquesa. */
  gradiente: "linear-gradient(135deg, #365BFF 0%, #12B8F4 55%, #2AD7C0 100%)",
  gradienteFilete: "linear-gradient(90deg, #365BFF 0%, #12B8F4 60%, #2AD7C0 100%)",
  /** Papéis funcionais do pacote (`brand-tokens.json`), conferidos em `docs/marcas/nextlevel/docs/CONTRASTE.md`. */
  claro: { surface: "#FFFFFF", surfaceMuted: "#F3F6FC", surfaceBrandSoft: "#EAF0FF", text: "#070F22", textMuted: "#4A5D78", border: "#D6E0F1", borderStrong: "#71839E", action: "#274BE5", actionHover: "#1F3DCA", link: "#274BE5", focus: "#274BE5" },
  escuro: { surface: "#070F22", surfaceMuted: "#101E38", surfaceElevated: "#162845", surfaceBrandSoft: "#162C4F", text: "#F3F6FC", textMuted: "#B2C1D8", border: "#334966", borderStrong: "#6C88AD", action: "#365BFF", actionHover: "#4265FF", link: "#80B8FF", focus: "#12B8F4" },
} as const;

export type NlLogo = { src: string; src2x: string; png: string; w: number; h: number };
/** `w`/`h`: dimensões da cópia de exibição (recortada da margem transparente, com folga de 3%), para a proporção. */
const logo = (rel: string, w: number, h: number, small = false): NlLogo => ({
  src: `${NL_BASE}/logos/${rel}-${small ? 256 : 640}.webp`, src2x: `${NL_BASE}/logos/${rel}-${small ? 512 : 1280}.webp`, png: `${NL_BASE}/logos/${rel}.png`, w, h,
});

/**
 * Logos oficiais por superfície e tratamento. `clara` = para fundo claro (lettering marinho); `escura` = para fundo escuro.
 * `prisma` (acabamento da marca) em áreas amplas: herói, login, rodapé. `interface` (flat, derivação óptica oficial) em
 * cabeçalhos e barra lateral. `nome` = sem a linha de apoio (abaixo de ~240 px de largura a linha some). `monograma` = NL
 * para a barra recolhida e espaços compactos. Troca sempre de arquivo: nunca filtro, recoloração, sombra ou recorte.
 */
export const NL_LOGOS = {
  prismaClara: logo("prisma/logo-clara", 1914, 443),
  prismaEscura: logo("prisma/logo-escura", 2081, 478),
  interfaceClara: logo("flat/logo-clara", 1965, 442),
  interfaceEscura: logo("flat/logo-escura", 1844, 421),
  nomeClara: logo("sem-apoio/logo-clara", 2191, 442),
  nomeEscura: logo("sem-apoio/logo-escura", 2200, 437),
  sloganClara: logo("com-slogan/logo-clara-com-slogan", 1915, 514),
  sloganEscura: logo("com-slogan/logo-escura-com-slogan", 1887, 551),
  verticalClara: logo("vertical/logo-vertical-clara", 1163, 757),
  verticalEscura: logo("vertical/logo-vertical-escura", 1163, 758),
  positiva: logo("monocromaticas/logo-positiva", 2142, 492),
  negativa: logo("monocromaticas/logo-negativa", 2195, 484),
  monograma: logo("monogramas/monograma-flat", 1138, 647, true),
  monogramaClaro: logo("monogramas/monograma-claro", 1260, 705, true),
  monogramaEscuro: logo("monogramas/monograma-escuro", 1159, 663, true),
} as const satisfies Record<string, NlLogo>;

/** Peça 3D do herói institucional (material editorial: nunca substitui a logo). `mobile`: recorte quadrado com o símbolo inteiro. */
export const NL_HEROI = {
  base: `${NL_BASE}/3d/02-metal-anodizado-sem-texto`,
  w: 1672, h: 941,
  mobile: `${NL_BASE}/3d/02-metal-anodizado-sem-texto-mobile-800.webp`,
} as const;

/** Outras peças 3D do pacote (renders estáticos), para reservas e momentos institucionais. */
export const NL_PECAS_3D = ["01-vidro-optico", "03-camadas-translucidas", "04-arquitetura-de-luz-cinetica"].map((n) => `${NL_BASE}/3d/${n}`);

export const NL_ICONES = {
  ico: `${NL_BASE}/logos/favicons/favicon.ico`,
  png: [16, 32, 48].map((s) => ({ url: `${NL_BASE}/logos/favicons/favicon-${s}.png`, sizes: `${s}x${s}` })),
  apple: `${NL_BASE}/logos/app-icons/apple-touch-icon-180.png`,
  manifest: `${NL_BASE}/manifest.webmanifest`,
  og: `${NL_BASE}/social/og-nextlevel-1200x630.jpg`,
} as const;

/**
 * Constantes da marca como variáveis CSS `--nlg-*` (nomes exclusivos da marca-mãe; nenhuma outra marca os lê, então
 * declará-los na raiz não muda nada nelas). Os papéis de interface (superfície, texto, ação, foco) vêm do tema `nextlevel`.
 */
export function nlCssVars(): string {
  const c = NL.cores;
  return `--nlg-marinho:${c.marinho};--nlg-marinho-2:${NL.escuro.surfaceMuted};--nlg-marinho-3:${NL.escuro.surfaceElevated};--nlg-royal:${c.royal};--nlg-acao:${NL.claro.action};--nlg-acao-hover:${NL.claro.actionHover};--nlg-luminoso:${c.azulLuminoso};--nlg-turquesa:${c.turquesa};--nlg-gelo:${c.gelo};--nlg-link-escuro:${NL.escuro.link};--nlg-texto-suave:${NL.escuro.textMuted};--nlg-linha-escura:${NL.escuro.border};--nlg-gradiente:${NL.gradiente};--nlg-filete:${NL.gradienteFilete};`;
}
