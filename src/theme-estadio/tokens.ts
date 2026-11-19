export type StadiumThemeTokens = {
  colors: {
    background: string;
    surface: string;
    text: string;
    mutedText: string;
    primary: string;
    primaryContrast: string;
    accent: string;
    accentContrast: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
    overlay: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    ctaFont: string;
    baseSize: number;
    lineHeight: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    pill: number;
  };
  shadows: {
    soft: string;
    medium: string;
    strong: string;
    glow: string;
  };
  effects: {
    gradient: string;
    noiseOpacity: number;
    focusRing: string;
  };
};

export type PartialStadiumThemeTokens = {
  [K in keyof StadiumThemeTokens]?: Partial<StadiumThemeTokens[K]>;
};

export const STADIUM_CSS_VAR_MAP = {
  "colors.background": "--stadium-bg",
  "colors.surface": "--stadium-surface",
  "colors.text": "--stadium-text",
  "colors.mutedText": "--stadium-muted",
  "colors.primary": "--stadium-primary",
  "colors.primaryContrast": "--stadium-on-primary",
  "colors.accent": "--stadium-accent",
  "colors.accentContrast": "--stadium-on-accent",
  "colors.border": "--stadium-border",
  "colors.success": "--stadium-success",
  "colors.warning": "--stadium-warning",
  "colors.danger": "--stadium-danger",
  "colors.overlay": "--stadium-overlay",
  "typography.headingFont": "--stadium-font-heading",
  "typography.bodyFont": "--stadium-font-body",
  "typography.ctaFont": "--stadium-font-cta",
  "typography.baseSize": "--stadium-font-size-base",
  "typography.lineHeight": "--stadium-line-height",
  "radius.sm": "--stadium-radius-sm",
  "radius.md": "--stadium-radius-md",
  "radius.lg": "--stadium-radius-lg",
  "radius.pill": "--stadium-radius-pill",
  "shadows.soft": "--stadium-shadow-soft",
  "shadows.medium": "--stadium-shadow-medium",
  "shadows.strong": "--stadium-shadow-strong",
  "shadows.glow": "--stadium-shadow-glow",
  "effects.gradient": "--stadium-gradient",
  "effects.noiseOpacity": "--stadium-noise-opacity",
  "effects.focusRing": "--stadium-focus-ring",
} as const;

export const STADIUM_BASE_TOKENS: StadiumThemeTokens = {
  colors: {
    background: "#060b17",
    surface: "#101828",
    text: "#f8fafc",
    mutedText: "#94a3b8",
    primary: "#06b6d4",
    primaryContrast: "#082f49",
    accent: "#22c55e",
    accentContrast: "#052e16",
    border: "#1e293b",
    success: "#16a34a",
    warning: "#f59e0b",
    danger: "#ef4444",
    overlay: "rgba(2, 6, 23, 0.72)",
  },
  typography: {
    headingFont: "var(--estadio-font-bebas), var(--estadio-font-barlow), sans-serif",
    bodyFont: "var(--estadio-font-inter), var(--estadio-font-montserrat), sans-serif",
    ctaFont: "var(--estadio-font-oswald), var(--estadio-font-barlow), sans-serif",
    baseSize: 16,
    lineHeight: 1.5,
  },
  radius: { sm: 8, md: 14, lg: 20, pill: 999 },
  shadows: {
    soft: "0 14px 30px rgba(2, 6, 23, 0.18)",
    medium: "0 18px 40px rgba(2, 6, 23, 0.28)",
    strong: "0 20px 55px rgba(2, 6, 23, 0.36)",
    glow: "0 0 0 1px rgba(34, 197, 94, 0.3), 0 0 30px rgba(6, 182, 212, 0.35)",
  },
  effects: {
    gradient: "linear-gradient(135deg, #06b6d4 0%, #16a34a 48%, #22c55e 100%)",
    noiseOpacity: 0.09,
    focusRing: "0 0 0 2px rgba(6, 182, 212, 0.55)",
  },
};

export function mergeStadiumTokens(active: StadiumThemeTokens, partial?: PartialStadiumThemeTokens | null): StadiumThemeTokens {
  if (!partial) return active;
  return {
    colors: { ...active.colors, ...(partial.colors ?? {}) },
    typography: { ...active.typography, ...(partial.typography ?? {}) },
    radius: { ...active.radius, ...(partial.radius ?? {}) },
    shadows: { ...active.shadows, ...(partial.shadows ?? {}) },
    effects: { ...active.effects, ...(partial.effects ?? {}) },
  };
}

export function toCssVars(tokens: StadiumThemeTokens): Record<string, string> {
  const css: Record<string, string> = {};
  const entries = Object.entries(STADIUM_CSS_VAR_MAP) as Array<[keyof typeof STADIUM_CSS_VAR_MAP, string]>;
  for (const [path, cssVar] of entries) {
    const [group, field] = path.split(".") as [keyof StadiumThemeTokens, string];
    const val = (tokens[group] as Record<string, string | number>)[field];
    css[cssVar] = typeof val === "number" ? String(val) : String(val ?? "");
  }
  return css;
}

export function normalizeStadiumTokens(input?: unknown): StadiumThemeTokens {
  if (!input || typeof input !== "object") return STADIUM_BASE_TOKENS;
  return mergeStadiumTokens(STADIUM_BASE_TOKENS, input as PartialStadiumThemeTokens);
}
