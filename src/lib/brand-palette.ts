/**
 * Paleta de cada marca (direção visual v4, `docs/design/DIRECAO-VISUAL-V4.md`): papel + tinta + uma cor de sinal.
 * Vale para portais e painéis; o tema das lojas dos lojistas é do lojista e não passa por aqui.
 * Cada combinação de leitura é conferida em `tests/brand-palette.test.ts` (WCAG AA).
 */
export type PaletteCode = "NEXTLEVEL_COMMERCE" | "SUPERDROP" | "BRAS_DIGITAL" | "CREATORS_HUB" | "CHINA_HUB" | "NEXTLEVEL";

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

export const PALETTES: Record<PaletteCode, BrandPalette> = {
  NEXTLEVEL_COMMERCE: {
    light: { paper: "#F5F1E8", ink: "#14213D", signal: "#F2B600", signalText: "#1F47C9" },
    dark: { paper: "#0E1626", ink: "#F5F1E8", signal: "#F2B600", signalText: "#F2B600" },
    support: "#2F5BEA", darkFirst: false,
  },
  SUPERDROP: {
    light: { paper: "#F2EBDD", ink: "#0F1A14", signal: "#127A44", signalText: "#127A44" },
    dark: { paper: "#0B130F", ink: "#F2EBDD", signal: "#2FBF72", signalText: "#2FBF72" },
    support: "#B7793B", darkFirst: false,
  },
  BRAS_DIGITAL: {
    light: { paper: "#F6F1EA", ink: "#2A0F18", signal: "#8C1D40", signalText: "#8C1D40" },
    dark: { paper: "#1A0A10", ink: "#F6F1EA", signal: "#E0557F", signalText: "#F07A9F" },
    support: "#C79A2B", darkFirst: false,
  },
  CREATORS_HUB: {
    light: { paper: "#F4F4F0", ink: "#0B0B10", signal: "#C6F432", signalText: "#4D6B00" },
    dark: { paper: "#0B0B10", ink: "#F4F4F0", signal: "#C6F432", signalText: "#C6F432" },
    support: "#FF4D8D", darkFirst: true,
  },
  CHINA_HUB: {
    light: { paper: "#F5F0E6", ink: "#1A1210", signal: "#B3141F", signalText: "#B3141F" },
    dark: { paper: "#150E0C", ink: "#F5F0E6", signal: "#E5484D", signalText: "#F26A6F" },
    support: "#0F6B5C", darkFirst: false,
  },
  NEXTLEVEL: {
    light: { paper: "#EFEBE3", ink: "#101418", signal: "#FF5A1F", signalText: "#B93C0A" },
    dark: { paper: "#0C0F12", ink: "#EFEBE3", signal: "#FF6B35", signalText: "#FF7A4D" },
    support: "#14213D", darkFirst: false,
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
export function brandCssVars(code: string): string {
  const p = paletteOf(code);
  return `:root{${decl(p.light)}--brand-support:${p.support};}` +
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${decl(p.dark)}}}` +
    `:root[data-theme="dark"]{${decl(p.dark)}}`;
}
