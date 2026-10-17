/**
 * Brás Digital Club (D158): fonte única da identidade da marca (código de sistema `BRAS_DIGITAL`, que fica igual por estar
 * gravado no banco). Adaptada de `docs/marcas/bras-digital-club/integration/brand.config.json` e `tokens/brand-tokens.json`
 * (pacote aprovado pelo dono). Tema dos painéis (`themes.ts`), paleta (`brand-palette.ts`), registro da marca (`brand.ts`),
 * logo (`BrandLogo`), ícones, manifesto e página pública leem daqui: nenhum hexadecimal da marca fica solto em componente.
 * Os arquivos oficiais ficam em `public/marcas/bras-digital-club/` (PNG originais preservados; WebP são cópias de exibição).
 */
export const BDC_BASE = "/marcas/bras-digital-club";

export const BDC = {
  id: "bras-digital-club",
  code: "BRAS_DIGITAL",
  name: "Brás Digital Club",
  shortName: "BDC",
  tagline: "Conecte seu negócio ao pulso do Brás.",
  publicRoute: "/bras-digital-club",
  /** Pendente: o nome-base é `brasdigitalclub`, mas a extensão do domínio ainda não foi confirmada. Sem canonical definitivo. */
  canonicalUrl: null as string | null,
  cores: { navy: "#0C1830", azul: "#315CFF", ciano: "#00D4FF", offWhite: "#F4F1E9" },
  gradiente: "linear-gradient(135deg, #315CFF 0%, #00D4FF 100%)",
  /** Papéis do pacote (`brand-tokens.json`). */
  claro: { surface: "#FFFFFF", surfaceMuted: "#F7F9FC", surfaceBrandSoft: "#EDF2FF", border: "#DBE3F0", text: "#0C1830", textMuted: "#52627A", action: "#315CFF", actionHover: "#2449D8", focus: "#00D4FF" },
  escuro: { surface: "#0C1830", surfaceMuted: "#132445", surfaceBrandSoft: "#172B52", border: "#294266", text: "#F4F1E9", textMuted: "#B9C5D8", action: "#5274FF", actionHover: "#6C8AFF", focus: "#00D4FF" },
} as const;

type Logo = { src: string; png: string; w: number; h: number };
const logo = (pasta: string, nome: string, w: number, h: number): Logo => ({ src: `${BDC_BASE}/logos/${pasta}/${nome}-480.webp`, png: `${BDC_BASE}/logos/${pasta}/${nome}.png`, w, h });

/** Logos oficiais (dimensões dos PNG originais, para a proporção). `clara` = para fundo claro; `escura` = lettering off-white, para fundo navy. */
export const BDC_LOGOS = {
  clara: logo("flat", "logo-clara", 1962, 802),
  escura: logo("flat", "logo-escura", 1928, 815),
  claraSlogan: logo("flat", "logo-clara-com-slogan", 1983, 793),
  escuraSlogan: logo("flat", "logo-escura-com-slogan", 2076, 757),
  verticalClara: logo("vertical", "logo-vertical-clara", 1181, 1332),
  verticalEscura: logo("vertical", "logo-vertical-escura", 1181, 1332),
  monogramaClaro: { src: `${BDC_BASE}/logos/monogramas/monograma-claro-256.webp`, png: `${BDC_BASE}/logos/monogramas/monograma-claro.png`, w: 1254, h: 1254 },
  monogramaEscuro: { src: `${BDC_BASE}/logos/monogramas/monograma-escuro-256.webp`, png: `${BDC_BASE}/logos/monogramas/monograma-escuro.png`, w: 1254, h: 1254 },
} as const satisfies Record<string, Logo>;

/** Peça 3D do herói (material editorial: nunca substitui a logo). `mobile` é um recorte quadrado com o símbolo inteiro. */
export const BDC_HEROI = {
  base: `${BDC_BASE}/3d/02-metal-anodizado-sem-texto`,
  w: 1672, h: 941,
  mobile: `${BDC_BASE}/3d/02-metal-anodizado-sem-texto-mobile-800.webp`,
} as const;

export const BDC_ICONES = {
  ico: `${BDC_BASE}/logos/favicons/favicon.ico`,
  png: [16, 32, 48].map((s) => ({ url: `${BDC_BASE}/logos/favicons/favicon-${s}.png`, sizes: `${s}x${s}` })),
  apple: `${BDC_BASE}/logos/app-icons/apple-touch-icon-180.png`,
  pwa192: `${BDC_BASE}/logos/app-icons/icon-192.png`,
  pwa512: `${BDC_BASE}/logos/app-icons/icon-512.png`,
  manifest: `${BDC_BASE}/manifest.webmanifest`,
  og: `${BDC_BASE}/og-1200x630.jpg`,
} as const;

/**
 * Constantes da marca como variáveis CSS `--bdc-*` (só as componentes da Brás as leem; outras marcas não usam esses nomes,
 * então declará-las na raiz não muda nada nelas). Os papéis de interface (superfície, texto, ação) vêm do tema `bras`.
 */
export function bdcCssVars(): string {
  const c = BDC.cores;
  return `--bdc-navy:${c.navy};--bdc-navy-2:${BDC.escuro.surfaceMuted};--bdc-navy-3:${BDC.escuro.surfaceBrandSoft};--bdc-azul:${c.azul};--bdc-azul-hover:${BDC.claro.actionHover};--bdc-azul-claro:${BDC.escuro.action};--bdc-ciano:${c.ciano};--bdc-off-white:${c.offWhite};--bdc-texto-suave:${BDC.escuro.textMuted};--bdc-cinza:${BDC.claro.textMuted};--bdc-painel-claro:${BDC.claro.surfaceMuted};--bdc-linha-clara:${BDC.claro.border};--bdc-linha-escura:${BDC.escuro.border};--bdc-gradiente:${BDC.gradiente};`;
}
