import { themeColors, type ThemeKey } from "@/design-system/themes";

export type ProductContextKey = "master" | "commerce";

export type ProductContext = {
  key: ProductContextKey;
  name: string;
  shortName: string;
  descriptor: string;
  accent: string;
  accentSoft: string;
  accentContrast: string;
  href?: string;
  available: boolean;
};

/** Cor de orientação de cada produto: sai do TEMA (themes.ts), uma única fonte. */
const accentOf = (k: ThemeKey) => { const c = themeColors(k, "light"); return { accent: c.primary, accentSoft: c.soft, accentContrast: c.primaryContrast }; };

export const PRODUCT_CONTEXTS: Record<ProductContextKey, ProductContext> = {
  master: { key: "master", name: "NextLevel Master", shortName: "Master", descriptor: "Control Center", ...accentOf("nextlevel"), href: "/master", available: true },
  commerce: { key: "commerce", name: "NextLevel Commerce", shortName: "Commerce", descriptor: "Lojas virtuais", ...accentOf("commerce"), href: "/master/marcas/commerce", available: true },
};

/** Contexto de produto do painel: vem da MARCA (e, no Master, do módulo aberto), nunca de um padrão fixo. */
export function productContextForPath(pathname: string, panel?: string, brandCode?: string): ProductContext {
  if (pathname.startsWith("/commerce")) return PRODUCT_CONTEXTS.commerce;
  if (pathname.startsWith("/master") || panel === "master") return PRODUCT_CONTEXTS.master;
  switch (brandCode) {
    case "NEXTLEVEL_COMMERCE": return PRODUCT_CONTEXTS.commerce;
    default: return PRODUCT_CONTEXTS.commerce;
  }
}

export const BUSINESS_CONTEXTS = [
  PRODUCT_CONTEXTS.commerce,
] as const;
