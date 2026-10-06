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

/** Sistema de cores v2 (decisão D79): neutros navy/off-white compartilhados; sinal = cor de assinatura da marca; apoio = amarelo do grupo. */
const NEU = { light: { paper: "#F4F1E9", ink: "#101B34" }, dark: { paper: "#0B1427", ink: "#F4F1E9" } } as const;
const pal = (l: [string, string], d: [string, string], support = "#F5BC00"): BrandPalette => ({
  light: { ...NEU.light, signal: l[0], signalText: l[1] }, dark: { ...NEU.dark, signal: d[0], signalText: d[1] }, support, darkFirst: false,
});
export const PALETTES: Record<PaletteCode, BrandPalette> = {
  NEXTLEVEL_COMMERCE: pal(["#196BD8", "#0E59B9"], ["#71AAFF", "#71AAFF"]),
  SUPERDROP: pal(["#118728", "#03721D"], ["#62C268", "#62C268"]),
  BRAS_DIGITAL: pal(["#B34D00", "#974000"], ["#FB8342", "#FB8342"]),
  CREATORS_HUB: pal(["#BA327B", "#9E2567"], ["#F975B5", "#F975B5"]),
  CHINA_HUB: pal(["#008085", "#006B70"], ["#3BBEC5", "#3BBEC5"]),
  NEXTLEVEL: pal(["#F5BC00", "#7B4C00"], ["#F5BC00", "#F5BC00"], "#101B34"),
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
