import type { BrandCode } from "@/lib/brand";

/**
 * Formas de pagamento do cliente na loja (D178). A loja da NextLevel E-commerce aceita Pix e cartão de crédito em até
 * 6x na conta Mercado Pago do próprio lojista (tarifas e juros do parcelamento seguem a conta dele). O SuperDrop segue
 * só com Pix, como sempre foi (D22, "Checkout das lojas somente Pix").
 */
export const MAX_PARCELAS_LOJA = 6;

export function lojaAceitaCartao(brand: BrandCode | null | undefined): boolean {
  return brand === "NEXTLEVEL_COMMERCE";
}

/** Parcelas a liberar na preferência do Mercado Pago; nulo = só Pix. */
export function parcelasDaLoja(brand: BrandCode | null | undefined): number | undefined {
  return lojaAceitaCartao(brand) ? MAX_PARCELAS_LOJA : undefined;
}
