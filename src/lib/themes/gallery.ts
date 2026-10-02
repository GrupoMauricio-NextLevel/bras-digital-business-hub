import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { stores } from "@/db/schema";
import { themeQuote } from "@/lib/domain/nextlevel-billing";
import type { Quote } from "@/lib/finance/pricing";
import { THEME_BY_KEY, THEME_CATALOG, type ThemeInfo } from "./catalog";
import { showcaseSlug } from "./showcase";

export type PublicTheme = ThemeInfo & { quote: Quote | null; demoReady: boolean };

/** Temas à venda, para a página pública. O preço sai do catálogo e da tabela de preços, nunca de texto fixo. */
export async function publicThemes(db: Database): Promise<PublicTheme[]> {
  const list = THEME_CATALOG.filter((t) => t.released !== false);
  return Promise.all(list.map((t) => publicTheme(db, t.key) as Promise<PublicTheme>));
}

/** Um tema pelo endereço, vendido ou em aprovação (este só abre por link, sem entrar na galeria). */
export async function publicTheme(db: Database, key: string): Promise<PublicTheme | null> {
  const info = THEME_BY_KEY[key]; if (!info) return null;
  const demo = await db.query.stores.findFirst({ where: eq(stores.slug, showcaseSlug(key)) });
  return { ...info, quote: info.priceCents > 0 ? await themeQuote(db, key) : null, demoReady: !!demo?.showcaseTheme };
}

/** Imagens de apresentação (capturas das lojas de demonstração), guardadas em public/temas. */
export const themeShot = (key: string, device: "desktop" | "mobile") => `/temas/${key}-${device}.webp`;
