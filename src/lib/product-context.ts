import { themeColors, type ThemeKey } from "@/design-system/themes";

export type ProductContextKey = "master" | "commerce" | "superdrop" | "bras" | "creators" | "china" | "cargas";

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
  superdrop: { key: "superdrop", name: "SuperDrop", shortName: "SuperDrop", descriptor: "Distribuição e dropshipping", ...accentOf("superdrop"), href: "/master/marcas/superdrop", available: true },
  bras: { key: "bras", name: "Brás Digital", shortName: "Brás Digital", descriptor: "Atacado B2B", ...accentOf("bras"), href: "/bras", available: true },
  creators: { key: "creators", name: "Creators Hub", shortName: "Creators", descriptor: "Creators & Social Commerce", ...accentOf("creators"), available: false },
  cargas: { key: "cargas", name: "NextLevel Cargas", shortName: "Cargas", descriptor: "Transporte e coletas", ...accentOf("cargas"), available: false },
  china: { key: "china", name: "China Hub", shortName: "China Hub", descriptor: "Brasil ↔ China", ...accentOf("china"), available: false },
};

/** Contexto de produto do painel: vem da MARCA (e, no Master, do módulo aberto), nunca de um padrão fixo. */
export function productContextForPath(pathname: string, panel?: string, brandCode?: string): ProductContext {
  if (pathname.startsWith("/commerce")) return PRODUCT_CONTEXTS.commerce;
  if (pathname === "/bras" || pathname.startsWith("/bras/") || pathname.startsWith("/meu-bras") || pathname.startsWith("/importadora")) return PRODUCT_CONTEXTS.bras;
  if (pathname.startsWith("/master") || panel === "master") return PRODUCT_CONTEXTS.master;
  switch (brandCode) {
    case "NEXTLEVEL_COMMERCE": return PRODUCT_CONTEXTS.commerce;
    case "BRAS_DIGITAL": return PRODUCT_CONTEXTS.bras;
    case "CREATORS_HUB": return PRODUCT_CONTEXTS.creators;
    case "CHINA_HUB": return PRODUCT_CONTEXTS.china;
    case "NEXTLEVEL_CARGAS": return PRODUCT_CONTEXTS.cargas;
    default: return PRODUCT_CONTEXTS.superdrop;
  }
}

export const BUSINESS_CONTEXTS = [
  PRODUCT_CONTEXTS.superdrop,
  PRODUCT_CONTEXTS.commerce,
  PRODUCT_CONTEXTS.bras,
  PRODUCT_CONTEXTS.creators,
  PRODUCT_CONTEXTS.china,
] as const;
