/**
 * Paleta de cada marca (direção visual v4, `docs/design/DIRECAO-VISUAL-V4.md`): papel + tinta + uma cor de sinal.
 * Vale para portais e painéis; o tema das lojas dos lojistas é do lojista e não passa por aqui.
 * Cada combinação de leitura é conferida em `tests/brand-palette.test.ts` (WCAG AA).
 */
import { CAPA, NL } from "@/lib/marcas/nextlevel";
import { EC } from "@/lib/marcas/nextlevel-ecommerce";

export type PaletteCode = "NEXTLEVEL_COMMERCE" | "NEXTLEVEL";

export type PaletteMode = {
  /** Fundo geral. */
  paper: string;
  /** Texto principal e fundos escuros de destaque. */
  ink: string;
  /** Cor de sinal: botões, status e destaques (como preenchimento). */
  signal: string;
  /** Variante da cor de sinal legível como texto ou link sobre o papel. */
  signalText: string;
};
export type BrandPalette = { light: PaletteMode; dark: PaletteMode; support: string; /** Marca pensada primeiro para o modo escuro (Hub Creators). */ darkFirst: boolean };

/** Sistema de cores v2 (decisão D79; cores de assinatura do pacote de marcas, D152): neutros navy/off-white compartilhados; sinal = cor de assinatura da marca; apoio = amarelo do grupo. */
export const PALETTES: Record<PaletteCode, BrandPalette> = {
  // NextLevel Commerce v1 (D163): azul de ação como sinal; no escuro, o azul do pacote com o link claro como texto.
  NEXTLEVEL_COMMERCE: {
    light: { paper: EC.claro.surfaceMuted, ink: EC.cores.marinho, signal: EC.claro.action, signalText: EC.claro.link },
    dark: { paper: EC.escuro.surface, ink: EC.cores.gelo, signal: EC.escuro.action, signalText: EC.escuro.link },
    support: EC.cores.ciano, darkFirst: false,
  },
  // NextLevel marca-mãe e Master (D198): roxo de ação da capa como sinal; o turquesa do pacote v2 segue como apoio.
  NEXTLEVEL: {
    light: { paper: CAPA.claro.canvas, ink: CAPA.claro.ink, signal: CAPA.claro.acao, signalText: CAPA.claro.link },
    dark: { paper: CAPA.escuro.canvas, ink: "#F4F4F6", signal: CAPA.escuro.acao, signalText: CAPA.escuro.link },
    support: NL.cores.turquesa, darkFirst: false,
  },
};

const channel = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
export function luminance(hex: string): number {
  const c = hex.replace("#", "");
  return 0.2126 * channel(parseInt(c.slice(0, 2), 16)) + 0.7152 * channel(parseInt(c.slice(2, 4), 16)) + 0.0722 * channel(parseInt(c.slice(4, 6), 16));
}
/** Razão de contraste WCAG entre duas cores (1 a 21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}
const DARK_TEXT = "#111827";
/** Texto (branco ou quase preto) legível sobre a cor de sinal. */
export const onSignal = (signal: string): "#ffffff" | typeof DARK_TEXT => (contrastRatio("#ffffff", signal) >= contrastRatio(DARK_TEXT, signal) ? "#ffffff" : DARK_TEXT);

export const paletteOf = (code: string): BrandPalette => PALETTES[(code in PALETTES ? code : "NEXTLEVEL") as PaletteCode];

const decl = (m: PaletteMode) => `--brand-paper:${m.paper};--brand-ink:${m.ink};--brand-signal:${m.signal};--brand-on-signal:${onSignal(m.signal)};--brand-signal-text:${m.signalText};`;

/**
 * CSS com as variáveis `--brand-*` da marca (claro e escuro). Só constantes do código entram aqui,
 * então é seguro injetar no <head>. Não altera os tokens atuais dos painéis: quem desenha (Codex) passa a consumir `--brand-*`.
 */
/** As mesmas variáveis `--brand-*`, com seletor mais forte, para uma área com marca própria (ver `themeAreaCss`). */
export function brandAreaCssVars(code: string): string {
  const p = paletteOf(code);
  return `html:root{${decl(p.light)}--brand-support:${p.support};}` +
    `@media (prefers-color-scheme: dark){html:root:not([data-theme="light"]){${decl(p.dark)}}}` +
    `html:root[data-theme="dark"]{${decl(p.dark)}}`;
}

export function brandCssVars(code: string): string {
  const p = paletteOf(code);
  return `:root{${decl(p.light)}--brand-support:${p.support};}` +
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${decl(p.dark)}}}` +
    `:root[data-theme="dark"]{${decl(p.dark)}}`;
}
