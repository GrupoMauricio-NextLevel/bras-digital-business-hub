import { cache } from "react";
import { getBrand } from "@/lib/brand-server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db/client";
import { brandOfStore } from "@/lib/store-brand";
import { themeKeyForBrand, type ThemeKey } from "@/design-system/themes";

/**
 * Tema de cores da requisição (UM dono: o <html> do layout raiz). O endereço define a marca; lojista logado usa a marca da
 * organização da loja (nunca herda a identidade do endereço técnico). Sem cookie de sessão não toca no banco.
 */
export const getThemeKey = cache(async (): Promise<ThemeKey> => {
  const brand = await getBrand();
  try {
    const session = await getSession();
    if (session?.store && session.user.role === "STORE_OWNER") return themeKeyForBrand((await brandOfStore(await getDb(), session.store)).code);
  } catch { /* sem sessão utilizável: vale a marca do endereço */ }
  return themeKeyForBrand(brand.code);
});
