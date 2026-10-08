import { isClosedCommerceBrand, type Brand } from "@/lib/brand";

/**
 * Operação fechada (hoje a Brás Digital): enquanto a marca está "em breve", nenhuma página do endereço é indexável.
 * Com o cadastro aberto (D91), a página de apresentação pode ser encontrada na busca; preço e estoque continuam só
 * para membro, atrás do login. Vem da configuração da marca, não de comparação com o código da empresa.
 */
export function robotsForBrandPortal(brand: Pick<Brand, "closedCommerce" | "soon">): { index: false; follow: false } | undefined {
  return isClosedCommerceBrand(brand) && brand.soon ? { index: false, follow: false } : undefined;
}
