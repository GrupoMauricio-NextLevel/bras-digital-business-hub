import { isClosedCommerceBrand, type Brand } from "@/lib/brand";

/**
 * Operação fechada (hoje a Brás Digital): nenhuma página do endereço da marca vira conteúdo indexável.
 * Vem da configuração da marca (`closedCommerce`), não de comparação com o código da empresa.
 */
export function robotsForBrandPortal(brand: Pick<Brand, "closedCommerce">): { index: false; follow: false } | undefined {
  return isClosedCommerceBrand(brand) ? { index: false, follow: false } : undefined;
}
