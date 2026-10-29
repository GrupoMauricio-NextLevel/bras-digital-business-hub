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
import { BDC, bdcCssVars } from "@/lib/marcas/bras-digital-club";
import { CAPA, NL, nlCssVars } from "@/lib/marcas/nextlevel";
export { CAPA };
import { EC, ecCssVars } from "@/lib/marcas/nextlevel-ecommerce";

export const THEME_KEYS = ["nextlevel", "commerce", "superdrop", "bras", "creators", "china", "play", "cargas"] as const;
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
  /** Material de vidro (D155): preenchimento sólido para quando não há desfoque, borda fina, reflexo interno e luz ambiente. */
  glassSolid: string; glassBorder: string; glassHighlight: string; ambient: string;
  /** tripla "r g b" usada para sombras */ shadowRgb: string;
  heroFrom: string; heroTo: string;
};

type ModeInput = { canvas: string; ink: string; primary: string; link: string; accent: string; accentText: string; accentSoft?: string; reflection?: string; surface?: string; sideBg?: string; /** anel de foco próprio (padrão: derivado do link) */ ring?: string };
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
  // NextLevel marca-mãe e Master (D198, "capa" no padrão de painel maduro): roxo de ação, área de trabalho gelo neutra,
  // menu cinza-claro com item ativo em cápsula branca e superfícies brancas. O roxo é exclusivo da marca-mãe e do Master;
  // os produtos seguem com a cor de cada um. O turquesa do pacote v2 fica como acento decorativo (o nosso toque).
  nextlevel: {
    label: "NextLevel Soluções Digitais (grupo e Master)",
    light: { canvas: CAPA.claro.canvas, surface: "#FFFFFF", ink: CAPA.claro.ink, primary: CAPA.claro.acao, link: CAPA.claro.link, accent: NL.cores.turquesa, accentText: "#0B5E55", accentSoft: "#DDF7F3", reflection: CAPA.escuro.link, sideBg: CAPA.claro.menu, ring: CAPA.claro.acao },
    dark: { canvas: CAPA.escuro.canvas, surface: CAPA.escuro.surface, ink: "#F4F4F6", primary: CAPA.escuro.acao, link: CAPA.escuro.link, accent: NL.cores.turquesa, accentText: NL.cores.turquesa, reflection: CAPA.escuro.link, sideBg: CAPA.escuro.menu, ring: CAPA.escuro.link },
  },
  // NextLevel E-commerce v1 (D163): cores do pacote oficial (`src/lib/marcas/nextlevel-ecommerce.ts`). Área de trabalho
  // gelo/branca, texto e estrutura marinho, ação azul sólida (o tom mais escuro do pacote no claro, para texto branco passar
  // AA), ciano como reflexo e foco no escuro. A barra lateral fica clara no claro (painel de uso diário, pouca fadiga).
  commerce: {
    label: EC.name,
    light: { canvas: EC.claro.surfaceMuted, surface: EC.claro.surface, ink: EC.cores.marinho, primary: EC.claro.action, link: EC.claro.link, accent: EC.cores.ciano, accentText: EC.cores.marinho, accentSoft: mix(EC.claro.surface, EC.cores.azul, 0.1), reflection: EC.cores.ciano, ring: EC.claro.focus },
    dark: { canvas: EC.escuro.surface, surface: EC.escuro.surfaceMuted, ink: EC.cores.gelo, primary: EC.escuro.action, link: EC.escuro.link, accent: EC.cores.ciano, accentText: EC.cores.ciano, reflection: EC.cores.ciano, ring: EC.escuro.focus },
  },
  superdrop: produto("SuperDrop", ["#118728", "#03721D"], ["#62C268", "#62C268"]),
  creators: produto("Creators Hub", ["#BA327B", "#9E2567"], ["#F975B5", "#F975B5"]),
  play: produto("NextLevel Play (planejada)", ["#8B4AC3", "#753CA6"], ["#C588FF", "#C588FF"]),
  china: produto("China Hub (planejada)", ["#008085", "#006B70"], ["#3BBEC5", "#3BBEC5"]),
  // Brás Digital Club (D158): cores do pacote oficial (`src/lib/marcas/bras-digital-club.ts`). Navy na estrutura (barra lateral
  // navy também no claro), área de trabalho clara, azul elétrico nas ações e ciano como pulso (reflexo e foco no escuro).
  // O foco no claro é azul: o ciano sobre branco não chega a 3:1 (contraste mínimo de indicador de foco). O link (texto e
  // selos) é o azul de ação mais escuro no claro e um azul clareado no escuro, para passar AA também sobre o fundo suave.
  bras: {
    label: BDC.name,
    light: { canvas: BDC.claro.surfaceMuted, surface: BDC.claro.surface, ink: BDC.cores.navy, primary: BDC.claro.action, link: BDC.claro.actionHover, accent: BDC.cores.ciano, accentText: BDC.cores.navy, accentSoft: BDC.claro.surfaceBrandSoft, reflection: BDC.cores.ciano, sideBg: BDC.cores.navy, ring: BDC.claro.action },
    dark: { canvas: BDC.escuro.surface, surface: BDC.escuro.surfaceMuted, ink: BDC.cores.offWhite, primary: BDC.claro.action, link: mix(BDC.escuro.actionHover, "#FFFFFF", 0.3), accent: BDC.cores.ciano, accentText: BDC.cores.ciano, reflection: BDC.cores.ciano, ring: BDC.escuro.focus },
  },
  cargas: produto("NextLevel Cargas", ["#4B4FD8", "#3A3DBE"], ["#9EA2FF", "#9EA2FF"]),
};

/** Marca do sistema (código de `src/lib/brand.ts`) → tema. Marca desconhecida cai na holding. */
export const THEME_FOR_BRAND: Record<string, ThemeKey> = {
  NEXTLEVEL: "nextlevel", NEXTLEVEL_COMMERCE: "commerce", SUPERDROP: "superdrop",
  BRAS_DIGITAL: "bras", CREATORS_HUB: "creators", CHINA_HUB: "china", NEXTLEVEL_CARGAS: "cargas",
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
    // Vidro: translúcido só onde há desfoque (o CSS escolhe glassSolid sem backdrop-filter); claro e escuro com parâmetros próprios.
    glass: rgba(canvas, dark ? 0.74 : 0.78), ring: i.ring ?? (dark ? mix(i.link, "#FFFFFF", 0.25) : i.link),
    glassSolid: rgba(canvas, 0.97),
    glassBorder: dark ? rgba("#FFFFFF", 0.09) : rgba(i.ink, 0.09),
    glassHighlight: dark ? rgba("#FFFFFF", 0.06) : rgba("#FFFFFF", 0.7),
    ambient: rgba(i.primary, dark ? 0.16 : 0.09),
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
/** Degradê do botão do Agente (padrão Hostinger, D210): igual em todos os temas, lido como `--agente-*`. */
export const AGENTE_DEGRADE = { fundo: "#0c0718", rosa: "#ff3fd1", lilas: "#b44cff", violeta: "#6a5cff", azul: "#3d8bff", coral: "#ff5a5a" } as const;
const agenteCss = () => Object.entries(AGENTE_DEGRADE).map(([k, v]) => `--agente-${k}:${v};`).join("");
// Junto vão as constantes `--bdc-*` da Brás Digital Club `--nlg-*` da marca-mãe e `--ec-*` do NextLevel E-commerce: nomes próprios, lidos só pelos componentes de cada uma.
const seriesCss = () => `:root{${DATAVIZ_SERIES.map((c, i) => `--series-${i + 1}:${c};`).join("")}${bdcCssVars()}${nlCssVars()}${ecCssVars()}${agenteCss()}}`;

export function themeCss(key: ThemeKey): string {
  const light = decls(themeColors(key, "light")), dark = decls(themeColors(key, "dark"));
  const sel = `:root[data-ds-theme="${key}"]`;
  // Barra lateral escura no modo claro (ex.: navy do Master): o logo dentro dela usa a versão para fundo escuro.
  const sideDarkInLight = luminance(themeColors(key, "light").sideBg) < 0.18;
  const sideLogo = sideDarkInLight ? `${sel} :is(.ds-side,.ds-drawer) .nl-logo-light{display:none}${sel} :is(.ds-side,.ds-drawer) .nl-logo-dark{display:inline-block}` : "";
  // Ilha escura (`.ds-tema-escuro`, ex.: rodapé institucional): o modo escuro da mesma marca, em qualquer modo da página.
  return seriesCss() + sideLogo + `${sel}{color-scheme:light;${light}}` + `${sel} .ds-tema-escuro{color-scheme:dark;${dark}}` +
    `${sel}[data-theme="dark"]{color-scheme:dark;${dark}}` +
    `@media (prefers-color-scheme: dark){${sel}:not([data-theme="light"]){color-scheme:dark;${dark}}}`;
}

/**
 * Tema de uma ÁREA, independente do endereço (ex.: o Estúdio da Brás aberto pelo Master, o Meu Brás): as mesmas variáveis
 * de `themeCss`, com seletor mais forte que o do tema do <html>, para valer sobre ele. Renderizado pelo layout da área,
 * entra e sai junto com ela na navegação (o tema do <html> é do layout raiz e não muda ao trocar de página).
 */
export function themeAreaCss(key: ThemeKey): string {
  const light = decls(themeColors(key, "light")), dark = decls(themeColors(key, "dark"));
  // Mais forte que `:root[data-ds-theme="…"]` do tema do endereço (0,2,0): aqui (0,3,1).
  const sel = "html:root:root[data-ds-theme]";
  const sideDarkInLight = luminance(themeColors(key, "light").sideBg) < 0.18;
  const sideLogo = sideDarkInLight ? `${sel} :is(.ds-side,.ds-drawer) .nl-logo-light{display:none}${sel} :is(.ds-side,.ds-drawer) .nl-logo-dark{display:inline-block}` : "";
  return sideLogo + `${sel}{color-scheme:light;${light}}` + `${sel} .ds-tema-escuro{color-scheme:dark;${dark}}` +
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
