import { getDb } from "@/db/client";
import { modulosDoNegocio, temLoja } from "./modulos";

/**
 * Vitrine de quem escolheu o caminho Site (NB1, D297): sem o módulo Loja, catálogo, produto, carrinho, checkout e o
 * arquivo de produtos para o Google respondem "não encontrado". A página inicial e as demais seguem normais.
 * Com a chave BUSINESS_V1 desligada, todo negócio volta a ter loja (nada some).
 */
export async function lojaFechadaNaVitrine(storeId: string): Promise<boolean> {
  return !temLoja(await modulosDoNegocio(await getDb(), storeId));
}
