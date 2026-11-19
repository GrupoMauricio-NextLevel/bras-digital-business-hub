"use client";

import * as React from "react";
import { normalizeStadiumTokens, toCssVars, type PartialStadiumThemeTokens, type StadiumThemeTokens } from "@/theme-estadio/tokens";

type Ctx = {
  tokens: StadiumThemeTokens;
  updateTokens: (partial: PartialStadiumThemeTokens) => void;
  setTokens: (next: StadiumThemeTokens) => void;
};

const StadiumThemeContext = React.createContext<Ctx | null>(null);

export function StadiumThemeProvider({ initialTokens, children }: { initialTokens?: unknown; children: React.ReactNode }) {
  const [tokens, setTokensState] = React.useState<StadiumThemeTokens>(() => normalizeStadiumTokens(initialTokens));

  const updateTokens = React.useCallback((partial: PartialStadiumThemeTokens) => {
    setTokensState((curr) => normalizeStadiumTokens({ ...curr, ...partial, colors: { ...curr.colors, ...(partial.colors ?? {}) }, typography: { ...curr.typography, ...(partial.typography ?? {}) }, radius: { ...curr.radius, ...(partial.radius ?? {}) }, shadows: { ...curr.shadows, ...(partial.shadows ?? {}) }, effects: { ...curr.effects, ...(partial.effects ?? {}) } }));
  }, []);

  const setTokens = React.useCallback((next: StadiumThemeTokens) => setTokensState(normalizeStadiumTokens(next)), []);
  const cssVars = React.useMemo(() => toCssVars(tokens), [tokens]);
  const value = React.useMemo(() => ({ tokens, updateTokens, setTokens }), [tokens, updateTokens, setTokens]);

  return (
    <StadiumThemeContext.Provider value={value}>
      <div className="stadium-scope" style={cssVars as React.CSSProperties}>{children}</div>
    </StadiumThemeContext.Provider>
  );
}

export function useStadiumTheme() {
  const ctx = React.useContext(StadiumThemeContext);
  if (!ctx) throw new Error("useStadiumTheme precisa estar dentro de <StadiumThemeProvider>");
  return ctx;
}
