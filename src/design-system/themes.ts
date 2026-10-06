/**
 * Contrato de tema por cores do sistema de design compartilhado.
 *
 * REGRA DO SISTEMA: a única diferença visual entre NextLevel, Commerce, SuperDrop e projetos futuros é este arquivo (as cores).
 * Tipografia, espaçamento, raios, sombras (forma), camadas, movimento e componentes vivem em `tokens.css` e nos componentes do núcleo
 * e NÃO conhecem a empresa: não existe "se empresa X" em nenhum componente. Eles só leem as variáveis `--ds-*` geradas aqui.
 *
 * Como adicionar um projeto: acrescente uma entrada em `THEME_INPUTS` (paleta clara e escura) e o código da marca em `THEME_FOR_BRAND`.
 * Os demais papéis (superfícies, linhas, texto secundário, estados de menu) são derivados e conferidos por `tests/design-system.test.ts` (WCAG AA).
 * Puro (sem React/Next): serve servidor, e-mail e testes.
 */
import { contrastRatio, onSignal } from "@/lib/brand-palette";

export const THEME_KEYS = ["nextlevel", "commerce", "superdrop", "bras", "creators", "china"] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];
export type ThemeMode = "light" | "dark";

/** Papéis semânticos de cor. Todos os componentes consomem somente estes papéis (via `--ds-*`). */
export type ThemeColors = {
  canvas: string; surface: string; surface2: string;
  ink: string; text: string; muted: string; line: string; line2: string;
  primary: string; primaryContrast: string; primaryHover: string; /** primária legível como texto/link sobre `surface` */ link: string; soft: string;
  /** destaque secundário e decorativo (cobre, etc.): nunca estado nem ação financeira */ accent: string; accentSoft: string; accentText: string;
  /** luz decorativa (arestas e reflexos de vidro); nunca texto */ reflection: string;
  success: string; successSoft: string; warning: string; warningSoft: string; danger: string; dangerSoft: string; info: string; infoSoft: string;
  sideBg: string; sideFg: string; sideMuted: string; sideActiveBg: string; sideActiveFg: string; sideLine: string; sideHover: string;
  /** faixa escura de destaque (rodapé, chamadas): igual nos dois modos, sempre escura */ band: string; bandFg: string; bandMuted: string; bandLine: string;
  glass: string; ring: string;
  /** tripla "r g b" usada para sombras */ shadowRgb: string;
  heroFrom: string; heroTo: string;
};

type ModeInput = { canvas: string; ink: string; primary: string; link: string; accent: string; accentText: string; accentSoft?: string; reflection?: string; surface?: string; sideBg?: string };
type ThemeInput = { label: string; light: ModeInput; dark: ModeInput };

/** Paletas de entrada. Derivadas das identidades existentes (`src/lib/brand-palette.ts`); o que precisar de decisão do dono está em docs/design-system/DECISOES-PENDENTES.md. */
export const THEME_INPUTS: Record<ThemeKey, ThemeInput> = {
  nextlevel: {
    label: "NextLevel (holding e Master)",
    light: { canvas: "#EFEBE3", ink: "#101418", primary: "#FF5A1F", link: "#B93C0A", accent: "#14213D", accentText: "#14213D", reflection: "#FFB38A" },
    dark: { canvas: "#0C0F12", ink: "#EFEBE3", primary: "#FF6B35", link: "#FF8A5C", accent: "#7C93D6", accentText: "#AFC0F2", reflection: "#FFB38A" },
  },
  commerce: {
    label: "NextLevel Commerce",
    light: { canvas: "#F3F6FB", ink: "#162842", primary: "#2557DA", link: "#214ECA", accent: "#EDAA86", accentText: "#914721", accentSoft: "#FFF0E6", reflection: "#82DFEE", surface: "#FFFFFF" },
    dark: { canvas: "#09172E", ink: "#EFF5FF", primary: "#3565DF", link: "#91B3FF", accent: "#F1AC85", accentText: "#F4B693", accentSoft: "#352927", reflection: "#82E3F6", surface: "#152641" },
  },
  superdrop: {
    label: "SuperDrop",
    light: { canvas: "#F2EBDD", ink: "#0F1A14", primary: "#127A44", link: "#0E6537", accent: "#B7793B", accentText: "#7A4A14", reflection: "#9BE0B8" },
    dark: { canvas: "#0B130F", ink: "#F2EBDD", primary: "#2FBF72", link: "#4ADB8C", accent: "#D9A066", accentText: "#E8B982", reflection: "#7EF0B0" },
  },
  bras: {
    label: "Brás Digital",
    light: { canvas: "#F6F1EA", ink: "#2A0F18", primary: "#8C1D40", link: "#8C1D40", accent: "#C79A2B", accentText: "#7A5A0B", reflection: "#F2B3C6" },
    dark: { canvas: "#1A0A10", ink: "#F6F1EA", primary: "#E0557F", link: "#F07A9F", accent: "#E3B84A", accentText: "#EBC96F", reflection: "#F5A3BB" },
  },
  creators: {
    label: "Hub Creators",
    light: { canvas: "#F4F4F0", ink: "#0B0B10", primary: "#4D6B00", link: "#4D6B00", accent: "#FF4D8D", accentText: "#B3004E", reflection: "#C6F432" },
    dark: { canvas: "#0B0B10", ink: "#F4F4F0", primary: "#C6F432", link: "#C6F432", accent: "#FF7AAB", accentText: "#FF9DC0", reflection: "#C6F432" },
  },
  china: {
    label: "China Hub",
    light: { canvas: "#F5F0E6", ink: "#1A1210", primary: "#B3141F", link: "#B3141F", accent: "#0F6B5C", accentText: "#0B5246", reflection: "#F2A0A5" },
    dark: { canvas: "#150E0C", ink: "#F5F0E6", primary: "#E5484D", link: "#F26A6F", accent: "#35B3A0", accentText: "#6FD3C3", reflection: "#F59A9E" },
  },
};

/** Marca do sistema (código de `src/lib/brand.ts`) → tema. Marca desconhecida cai na holding. */
export const THEME_FOR_BRAND: Record<string, ThemeKey> = {
  NEXTLEVEL: "nextlevel", NEXTLEVEL_COMMERCE: "commerce", SUPERDROP: "superdrop",
  BRAS_DIGITAL: "bras", CREATORS_HUB: "creators", CHINA_HUB: "china",
};
export const themeKeyForBrand = (code: string | null | undefined): ThemeKey => THEME_FOR_BRAND[code ?? ""] ?? "nextlevel";

// ---- utilidades de cor (hex) ----
const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const toRgb = (hex: string): [number, number, number] => { const c = hex.replace("#", ""); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; };
const toHex = (r: number, g: number, b: number) => "#" + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("").toUpperCase();
/** Mistura `a` com `b`: t = 0 devolve `a`, t = 1 devolve `b`. */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = toRgb(a), [br, bg, bb] = toRgb(b);
  return toHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}
const rgba = (hex: string, alpha: number) => { const [r, g, b] = toRgb(hex); return `rgba(${r},${g},${b},${alpha})`; };

/** Cores de estado: iguais em todos os temas (status não é identidade de marca). */
const STATE = {
  light: { success: "#11703A", successSoft: "#DCF5E6", warning: "#8A4B00", warningSoft: "#FDF0CF", danger: "#B42318", dangerSoft: "#FDE4E1", info: "#1D4ED8", infoSoft: "#DFE9FD" },
  dark: { success: "#5DDB8F", successSoft: "#12301E", warning: "#F2B45A", warningSoft: "#33240B", danger: "#FF8A7D", dangerSoft: "#3A1512", info: "#8FB0FF", infoSoft: "#14233F" },
} as const;

/** Texto secundário: clareia a mistura até passar de 4,6:1 sobre as duas superfícies de leitura. */
function readableMuted(ink: string, canvas: string, surfaces: string[]): string {
  for (let t = 0.46; t >= 0.2; t -= 0.02) {
    const c = mix(ink, canvas, t);
    if (surfaces.every((s) => contrastRatio(c, s) >= 4.6)) return c;
  }
  return mix(ink, canvas, 0.2);
}

/** Deriva todos os papéis de um modo a partir da entrada mínima. */
export function deriveColors(mode: ThemeMode, i: ModeInput): ThemeColors {
  const dark = mode === "dark";
  const canvas = i.canvas;
  const surface = i.surface ?? (dark ? mix(canvas, "#FFFFFF", 0.07) : mix(canvas, "#FFFFFF", 0.82));
  const surface2 = dark ? mix(canvas, "#FFFFFF", 0.12) : mix(canvas, i.ink, 0.04);
  const text = mix(i.ink, canvas, dark ? 0.1 : 0.14);
  const soft = dark ? mix(surface, i.primary, 0.22) : mix(surface, i.primary, 0.12);
  const accentSoft = i.accentSoft ?? mix(surface, i.accent, dark ? 0.2 : 0.22);
  const muted = readableMuted(i.ink, canvas, [surface, surface2, canvas, soft, accentSoft]);
  const line = mix(i.ink, canvas, dark ? 0.82 : 0.86);
  const line2 = mix(i.ink, canvas, dark ? 0.9 : 0.93);
  const primaryContrast = onSignal(i.primary);
  const primaryHover = dark ? mix(i.primary, "#FFFFFF", 0.14) : mix(i.primary, "#000000", 0.14);
  const bandBg = dark ? mix(mix(canvas, "#000000", 0.2), i.primary, 0.14) : mix(i.ink, i.primary, 0.14);
  const bandFg = dark ? i.ink : mix(canvas, "#FFFFFF", 0.6);
  const sideBg = i.sideBg ?? (dark ? mix(canvas, "#000000", 0.28) : mix(canvas, "#FFFFFF", 0.62));
  return {
    canvas, surface, surface2, ink: i.ink, text, muted, line, line2,
    primary: i.primary, primaryContrast, primaryHover, link: i.link, soft,
    accent: i.accent, accentSoft, accentText: i.accentText,
    reflection: i.reflection ?? mix(i.primary, "#FFFFFF", 0.5),
    ...STATE[mode],
    sideBg, sideFg: dark ? mix(i.ink, canvas, 0.14) : text, sideMuted: readableMuted(i.ink, sideBg, [sideBg]),
    sideActiveBg: dark ? mix(sideBg, i.primary, 0.3) : mix(sideBg, i.primary, 0.14), sideActiveFg: dark ? "#FFFFFF" : i.link,
    sideLine: dark ? mix(i.ink, sideBg, 0.86) : line, sideHover: rgba(dark ? "#FFFFFF" : i.ink, dark ? 0.06 : 0.05),
    band: bandBg, bandFg, bandMuted: readableMuted(bandFg, bandBg, [bandBg]), bandLine: mix(bandFg, bandBg, 0.82),
    glass: rgba(canvas, dark ? 0.82 : 0.86), ring: dark ? mix(i.link, "#FFFFFF", 0.25) : i.link,
    shadowRgb: dark ? "0 0 0" : toRgb(i.ink).join(" "),
    heroFrom: dark ? mix(canvas, i.primary, 0.32) : mix(surface, i.primary, 0.2),
    heroTo: dark ? mix(canvas, i.primary, 0.08) : mix(surface, i.reflection ?? i.primary, 0.12),
  };
}

export function themeColors(key: ThemeKey, mode: ThemeMode): ThemeColors {
  const t = THEME_INPUTS[key];
  return deriveColors(mode, mode === "dark" ? t.dark : t.light);
}

const camel = (s: string) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()).replace(/(\D)(\d)$/, "$1-$2");
const decls = (c: ThemeColors) => Object.entries(c).map(([k, v]) => `--ds-${camel(k)}:${v};`).join("");

/**
 * CSS do tema (claro, escuro e "sistema"). O dono do tema é o `<html>`: `data-ds-theme` (empresa) + `data-theme` (claro | escuro | sistema).
 * Portais (diálogos, menus) ficam fora dos painéis e herdam daqui. Só constantes do código entram: seguro para o <head>.
 */
/** Paleta categórica de gráficos (validada): igual em todos os temas, pois distingue séries, não marca. */
export const DATAVIZ_SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"] as const;
const seriesCss = () => `:root{${DATAVIZ_SERIES.map((c, i) => `--series-${i + 1}:${c};`).join("")}}`;

export function themeCss(key: ThemeKey): string {
  const light = decls(themeColors(key, "light")), dark = decls(themeColors(key, "dark"));
  const sel = `:root[data-ds-theme="${key}"]`;
  return seriesCss() + `${sel}{color-scheme:light;${light}}` +
    `${sel}[data-theme="dark"]{color-scheme:dark;${dark}}` +
    `@media (prefers-color-scheme: dark){${sel}:not([data-theme="light"]){color-scheme:dark;${dark}}}`;
}

/** Preferência de tema: UM dono (`nl-theme` no navegador), aplicada antes da primeira pintura. Sem escolha salva abre no claro. */
export const THEME_STORAGE_KEY = "nl-theme";
export const THEME_PREPAINT_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="dark"||t==="light"||t==="system")document.documentElement.setAttribute("data-theme",t);else document.documentElement.setAttribute("data-theme","light")}catch(e){document.documentElement.setAttribute("data-theme","light")}`;

/** Pares de leitura que o contrato garante (usados pelos testes e pela galeria). */
export const READABLE_PAIRS: [keyof ThemeColors, keyof ThemeColors, number][] = [
  ["ink", "canvas", 7], ["text", "surface", 7], ["muted", "surface", 4.5], ["muted", "surface2", 4.5], ["muted", "canvas", 4.5], ["muted", "soft", 4.5], ["muted", "accentSoft", 4.5],
  ["link", "surface", 4.5], ["link", "canvas", 4.5], ["primaryContrast", "primary", 4.5], ["accentText", "accentSoft", 4.5],
  ["success", "successSoft", 4.5], ["warning", "warningSoft", 4.5], ["danger", "dangerSoft", 4.5], ["info", "infoSoft", 4.5],
  ["bandFg", "band", 7], ["bandMuted", "band", 4.5], ["sideFg", "sideBg", 4.5], ["sideMuted", "sideBg", 4.5], ["sideActiveFg", "sideActiveBg", 4.5],
];

/**
 * Pré-visualização de TODOS os temas ao mesmo tempo (só para a galeria): as mesmas variáveis, mas escopadas em
 * `[data-ds-preview="<tema>-<modo>"]` em vez do <html>. Os componentes não mudam: só leem --ds-*.
 */
export function themePreviewCss(): string {
  return THEME_KEYS.flatMap((k) => (["light", "dark"] as const).map((m) => `[data-ds-preview="${k}-${m}"]{color-scheme:${m};${decls(themeColors(k, m))}}`)).join("");
}
