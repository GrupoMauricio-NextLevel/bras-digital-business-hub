import type { Store } from "@/db/schema";
import type { PublicProduct } from "@/lib/queries/storefront";
import type { SettingValue, ThemeGlobals } from "@/lib/themes/types";

/** Tudo o que uma seção precisa para se desenhar. Os dados já vêm resolvidos pelo servidor. */
export type SectionCtx = {
  slug: string;
  /** Endereço base da loja (ex.: /store/minha-loja). Links do tema começam por aqui. */
  base: string;
  store: Store;
  categories: { id: string; name: string; slug: string }[];
  products: PublicProduct[];
  /** Produtos de cada seção de vitrine ou grade, já repartidos (sem repetir). */
  planned: Record<string, PublicProduct[]>;
  hero: PublicProduct | undefined;
  globals: ThemeGlobals;
};

export type SectionProps = {
  id: string;
  settings: Record<string, SettingValue>;
  blocks: { id: string; type: string; settings: Record<string, SettingValue> }[];
  ctx: SectionCtx;
};
