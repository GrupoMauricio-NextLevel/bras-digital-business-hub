import type { Brand } from "@/lib/brand";

/** A Brás Digital começa como operação fechada: sua página de espera não vira conteúdo indexável. */
export function robotsForBrandPortal(brand: Pick<Brand, "code">): { index: false; follow: false } | undefined {
  return brand.code === "BRAS_DIGITAL" ? { index: false, follow: false } : undefined;
}
