export type ProductContextKey = "master" | "commerce" | "superdrop" | "bras" | "creators" | "china";

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

export const PRODUCT_CONTEXTS: Record<ProductContextKey, ProductContext> = {
  master: { key: "master", name: "NextLevel Master", shortName: "Master", descriptor: "Control Center", accent: "#2563EB", accentSoft: "#E8F0FF", accentContrast: "#FFFFFF", href: "/master", available: true },
  commerce: { key: "commerce", name: "NextLevel Commerce", shortName: "Commerce", descriptor: "Core operacional", accent: "#0891B2", accentSoft: "#E2F7FB", accentContrast: "#FFFFFF", href: "/master/commerce", available: true },
  superdrop: { key: "superdrop", name: "SuperDrop", shortName: "SuperDrop", descriptor: "Distribuição & Dropshipping", accent: "#F97316", accentSoft: "#FFF0E6", accentContrast: "#17120E", href: "/master", available: true },
  bras: { key: "bras", name: "Brás Digital", shortName: "Brás Digital", descriptor: "Atacado B2B", accent: "#D59A16", accentSoft: "#FFF6DC", accentContrast: "#17130A", available: false },
  creators: { key: "creators", name: "Creators Hub", shortName: "Creators", descriptor: "Creators & Social Commerce", accent: "#A855F7", accentSoft: "#F4E8FF", accentContrast: "#FFFFFF", available: false },
  china: { key: "china", name: "China Hub", shortName: "China Hub", descriptor: "Brasil ↔ China", accent: "#D73737", accentSoft: "#FFE9E7", accentContrast: "#FFFFFF", available: false },
};

export function productContextForPath(pathname: string, panel?: string): ProductContext {
  if (pathname.startsWith("/master/commerce")) return PRODUCT_CONTEXTS.commerce;
  if (pathname.startsWith("/merchant") || pathname.startsWith("/supplier")) return PRODUCT_CONTEXTS.superdrop;
  if (pathname.startsWith("/master")) return PRODUCT_CONTEXTS.master;
  if (panel === "master") return PRODUCT_CONTEXTS.master;
  return PRODUCT_CONTEXTS.superdrop;
}

export const BUSINESS_CONTEXTS = [
  PRODUCT_CONTEXTS.superdrop,
  PRODUCT_CONTEXTS.commerce,
  PRODUCT_CONTEXTS.bras,
  PRODUCT_CONTEXTS.creators,
  PRODUCT_CONTEXTS.china,
] as const;
