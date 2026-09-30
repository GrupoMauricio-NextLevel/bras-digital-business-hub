/** Regras simples de frete para demonstração (substituíveis por cotação real). */
export const SHIPPING_FLAT_CENTS = 2490;
export const FREE_SHIPPING_FROM_CENTS = 29900;

export function shippingFor(subtotalCents: number): number {
  return subtotalCents >= FREE_SHIPPING_FROM_CENTS ? 0 : SHIPPING_FLAT_CENTS;
}
