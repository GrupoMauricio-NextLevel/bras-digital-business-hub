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
import { contrastRatio, luminance, onSignal } from "@/lib/brand-palette";

export const THEME_KEYS = ["nextlevel", "commerce", "superdrop", "bras", "creators", "china", "play"] as const;
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

/**
 * Paletas de entrada: sistema de cores v2 aprovado pelo dono (brand-system-v2/, decisão D79).
 * Neutros compartilhados por todas as marcas (navy #101B34 e off-white #F4F1E9); cada marca só traz a cor de assinatura
 * (botão, link, seleção, foco) e o amarelo do grupo entra como destaque secundário dos produtos.
 */
const N = { light: { canvas: "#F4F1E9", ink: "#101B34", surface: "#FFFFFF" }, dark: { canvas: "#0B1427", ink: "#F4F1E9", surface: "#101B34" } } as const;
const GRUPO = { light: { accent: "#F5BC00", accentText: "#7B4C00", accentSoft: "#FEEFCA" }, dark: { accent: "#F5BC00", accentText: "#F5BC00" } } as const;
// Identidade nos painéis (D81): no claro, a barra lateral leva um véu da cor da marca; no escuro, fundo e superfícies
// ganham um leve tom da marca sobre o navy compartilhado (mesma família, marca reconhecível).
const produto = (label: string, l: [string, string], d: [string, string]): ThemeInput => ({
  label,
  light: { ...N.light, ...GRUPO.light, primary: l[0], link: l[1], sideBg: mix(N.light.canvas, l[0], 0.09) },
  dark: { ...N.dark, ...GRUPO.dark, primary: d[0], link: d[1], canvas: mix(N.dark.canvas, d[0], 0.05), surface: mix(N.dark.surface, d[0], 0.06) },
});
export const THEME_INPUTS: Record<ThemeKey, ThemeInput> = {
  nextlevel: {
    label: "NextLevel Soluções Digitais (grupo e Master)",
    // O grupo assina com a barra lateral navy e o amarelo do raio.
    light: { ...N.light, primary: "#F5BC00", link: "#7B4C00", accent: "#101B34", accentText: "#101B34", accentSoft: "#E6E8EE", sideBg: "#101B34" },
    dark: { ...N.dark, primary: "#F5BC00", link: "#F5BC00", accent: "#B3B9CA", accentText: "#D6DAE5" },
  },
  commerce: produto("NextLevel Commerce", ["#196BD8", "#0E59B9"], ["#71AAFF", "#71AAFF"]),
  superdrop: produto("SuperDrop", ["#118728", "#03721D"], ["#62C268", "#62C268"]),
  creators: produto("Creators Hub", ["#BA327B", "#9E2567"], ["#F975B5", "#F975B5"]),
  play: produto("NextLevel Play (planejada)", ["#8B4AC3", "#753CA6"], ["#C588FF", "#C588FF"]),
  china: produto("China Hub (planejada)", ["#008085", "#006B70"], ["#3BBEC5", "#3BBEC5"]),
  bras: produto("Brás Digital (planejada)", ["#B34D00", "#974000"], ["#FB8342", "#FB8342"]),
};

/** Marca do sistema (código de `src/lib/brand.ts`) → tema. Marca desconhecida cai na holding. */
export const THEME_FOR_BRAND: Record<string, ThemeKey> = {
  NEXTLEVEL: "nextlevel", NEXTLEVEL_COMMERCE: "commerce", SUPERDROP: "superdrop",
  BRAS_DIGITAL: "bras", CREATORS_HUB: "creators", CHINA_HUB: "china",
};
export const themeKeyForBrand = (code: string | null | undefined): ThemeKey => THEME_FOR_BRAND[code ?? ""] ?? "nextlevel";


/** Cores de estado: iguais em todos os temas (status não é identidade de marca). */
const STATE = {
  light: { success: "#007E4D", successSoft: "#DBF9E6", warning: "#8F5C00", warningSoft: "#FFEDD8", danger: "#B53C35", dangerSoft: "#FFEBE8", info: "#0075A5", infoSoft: "#E1F3FF" },
  dark: { success: "#43D58F", successSoft: "#13323E", warning: "#F2A635", warningSoft: "#2D2D37", danger: "#FF968A", dangerSoft: "#35293B", info: "#58C4FF", infoSoft: "#142F4E" },
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
    ...side(dark, i, sideBg, canvas, text, line),
    band: bandBg, bandFg, bandMuted: readableMuted(bandFg, bandBg, [bandBg]), bandLine: mix(bandFg, bandBg, 0.82),
    glass: rgba(canvas, dark ? 0.82 : 0.86), ring: dark ? mix(i.link, "#FFFFFF", 0.25) : i.link,
    shadowRgb: dark ? "0 0 0" : toRgb(i.ink).join(" "),
    heroFrom: dark ? mix(canvas, i.primary, 0.32) : mix(surface, i.primary, 0.2),
    heroTo: dark ? mix(canvas, i.primary, 0.08) : mix(surface, i.reflection ?? i.primary, 0.12),
  };
}

/** Papéis da barra lateral: valem para barra clara ou escura (o Master usa navy mesmo no modo claro). */
function side(dark: boolean, i: ModeInput, sideBg: string, canvas: string, text: string, line: string) {
  const sideDark = dark || luminance(sideBg) < 0.18;
  if (!sideDark) {
    const sideActiveBg = mix(sideBg, i.primary, 0.16);
    return { sideBg, sideFg: text, sideMuted: readableMuted(i.ink, sideBg, [sideBg]), sideActiveBg, sideActiveFg: contrastRatio(i.link, sideActiveBg) >= 4.6 ? i.link : i.ink, sideLine: line, sideHover: rgba(i.ink, 0.05) };
  }
  const fg = dark ? mix(i.ink, canvas, 0.14) : mix("#F4F1E9", sideBg, 0.06);
  const sideActiveBg = mix(sideBg, i.primary, dark ? 0.3 : 0.2);
  return {
    sideBg, sideFg: fg, sideMuted: readableMuted(fg, sideBg, [sideBg]), sideActiveBg,
    sideActiveFg: !dark && contrastRatio(i.primary, sideActiveBg) >= 4.6 ? i.primary : "#FFFFFF",
    sideLine: mix(fg, sideBg, 0.86), sideHover: rgba("#FFFFFF", 0.06),
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
  // Barra lateral escura no modo claro (ex.: navy do Master): o logo dentro dela usa a versão para fundo escuro.
  const sideDarkInLight = luminance(themeColors(key, "light").sideBg) < 0.18;
  const sideLogo = sideDarkInLight ? `${sel} :is(.ds-side,.ds-drawer) .nl-logo-light{display:none}${sel} :is(.ds-side,.ds-drawer) .nl-logo-dark{display:inline-block}` : "";
  return seriesCss() + sideLogo + `${sel}{color-scheme:light;${light}}` +
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
