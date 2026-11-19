import { STADIUM_BASE_TOKENS, type PartialStadiumThemeTokens, type StadiumThemeTokens } from "@/theme-estadio/tokens";

export type StadiumPreset = { id: string; nome: string; tokens: StadiumThemeTokens };

const withOverrides = (overrides: PartialStadiumThemeTokens): StadiumThemeTokens => ({
  ...STADIUM_BASE_TOKENS,
  ...overrides,
  colors: { ...STADIUM_BASE_TOKENS.colors, ...(overrides.colors ?? {}) },
  typography: { ...STADIUM_BASE_TOKENS.typography, ...(overrides.typography ?? {}) },
  radius: { ...STADIUM_BASE_TOKENS.radius, ...(overrides.radius ?? {}) },
  shadows: { ...STADIUM_BASE_TOKENS.shadows, ...(overrides.shadows ?? {}) },
  effects: { ...STADIUM_BASE_TOKENS.effects, ...(overrides.effects ?? {}) },
});

export const STADIUM_PRESETS: StadiumPreset[] = [
  { id: "padrao-neon", nome: "Padrão neon", tokens: STADIUM_BASE_TOKENS },
  {
    id: "rubro-negro",
    nome: "Rubro-Negro",
    tokens: withOverrides({
      colors: { primary: "#dc2626", primaryContrast: "#fff1f2", accent: "#111827", accentContrast: "#f9fafb", border: "#3f3f46" },
      effects: { gradient: "linear-gradient(140deg, #7f1d1d 0%, #ef4444 48%, #18181b 100%)" },
    }),
  },
  {
    id: "alvinegro",
    nome: "Alvinegro",
    tokens: withOverrides({
      colors: { background: "#030712", surface: "#111827", primary: "#f3f4f6", primaryContrast: "#111827", accent: "#4b5563", accentContrast: "#f9fafb" },
      effects: { gradient: "linear-gradient(140deg, #f8fafc 0%, #9ca3af 55%, #111827 100%)" },
    }),
  },
  {
    id: "verdao",
    nome: "Verdão",
    tokens: withOverrides({
      colors: { primary: "#16a34a", primaryContrast: "#f0fdf4", accent: "#15803d", accentContrast: "#dcfce7", border: "#14532d" },
      effects: { gradient: "linear-gradient(140deg, #14532d 0%, #22c55e 55%, #4ade80 100%)" },
    }),
  },
  {
    id: "tricolor",
    nome: "Tricolor",
    tokens: withOverrides({
      colors: { primary: "#2563eb", primaryContrast: "#dbeafe", accent: "#dc2626", accentContrast: "#fee2e2", border: "#1e3a8a" },
      effects: { gradient: "linear-gradient(135deg, #1d4ed8 0%, #f8fafc 42%, #dc2626 100%)" },
    }),
  },
  {
    id: "claro",
    nome: "Claro",
    tokens: withOverrides({
      colors: {
        background: "#f8fafc",
        surface: "#ffffff",
        text: "#0f172a",
        mutedText: "#475569",
        primary: "#1d4ed8",
        primaryContrast: "#eff6ff",
        accent: "#0f766e",
        accentContrast: "#ccfbf1",
        border: "#cbd5e1",
        overlay: "rgba(15, 23, 42, 0.15)",
      },
      shadows: { glow: "0 0 0 1px rgba(29, 78, 216, 0.2), 0 0 26px rgba(34, 197, 94, 0.22)" },
      effects: { gradient: "linear-gradient(140deg, #dbeafe 0%, #bbf7d0 45%, #f1f5f9 100%)" },
    }),
  },
];
