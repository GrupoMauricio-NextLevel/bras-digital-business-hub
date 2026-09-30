/**
 * Como a NextLevel mostra preço: o **preço de lista** é o valor cheio no cartão, em até 6x sem acréscimo na tela;
 * o Pix tem um **desconto** sobre a lista (`pixDiscountBps` na tabela de preços).
 */
export const CARD_MAX_INSTALLMENTS = 6;
export type PaymentMethod = "PIX" | "CARD";
export type Quote = { listCents: number; pixCents: number; pixDiscountCents: number; pixDiscountPct: number; installments: number; installmentCents: number };

export function quote(listCents: number, pixDiscountBps: number, installments = CARD_MAX_INSTALLMENTS): Quote {
  const discount = Math.round((listCents * pixDiscountBps) / 10_000);
  return { listCents, pixCents: listCents - discount, pixDiscountCents: discount, pixDiscountPct: pixDiscountBps / 100, installments, installmentCents: Math.ceil(listCents / installments) };
}

/** Valor a cobrar no método escolhido. */
export const amountFor = (q: Quote, method: PaymentMethod) => (method === "PIX" ? q.pixCents : q.listCents);
