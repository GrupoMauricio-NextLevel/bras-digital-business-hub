/**
 * Cálculo de preço do catálogo Master (D90). Funções puras, inteiros em centavos, arredondamento determinístico.
 *
 * - Pix: preço-base com o desconto Pix do preço (ex.: 10%).
 * - Cartão: preço-base × (1 + acréscimo) (ex.: ×1,16) em até N parcelas. Nunca Pix e acréscimo juntos.
 * - Desconto do parceiro (em dinheiro, até o teto do produto) NÃO acumula com o desconto Pix (vale o maior)
 *   nem com o anual (o anual já tem 25%: o parceiro dá só benefício não monetário).
 * - Oferta de entrada (primeiro mês): substitui o valor do primeiro ciclo mensal; sem outros descontos juntos.
 */
export type PayMethod = "PIX" | "CARD";

export type PriceRule = {
  id: string;
  version: number;
  cycle: "MONTHLY" | "ANNUAL" | "ONE_TIME" | "QUOTE";
  amountCents: number | null;
  methods: PayMethod[];
  pixDiscountBps: number;
  cardMaxInstallments: number;
  cardMarkupBps: number;
};

export type QuoteInput = {
  method: PayMethod;
  installments?: number;
  /** Desconto pedido pelo parceiro (bps); limitado pelo teto do produto e por 10%. */
  partnerDiscountBps?: number;
  partnerDiscountMaxBps?: number;
  /** Valor do primeiro ciclo pela oferta de entrada (ex.: R$ 9,90). */
  firstPeriodCents?: number | null;
};

export type PriceQuote = {
  baseCents: number;
  method: PayMethod;
  installments: number;
  installmentCents: number;
  /** Última parcela (fecha o total exato). */
  lastInstallmentCents: number;
  pixDiscountCents: number;
  partnerDiscountCents: number;
  offerDiscountCents: number;
  cardMarkupCents: number;
  totalCents: number;
  /** Explicação curta da regra aplicada, gravada no pedido. */
  rule: string;
};

export const PARTNER_DISCOUNT_CAP_BPS = 1000;

export class PricingError extends Error {
  constructor(public code: string, message: string) { super(message); this.name = "PricingError"; }
}

const pctOf = (cents: number, bps: number) => Math.round((cents * bps) / 10_000);

/** Parcelas que somam exatamente o total: as primeiras arredondadas para cima, a última fecha a conta. */
export function installmentPlan(totalCents: number, n: number): { installmentCents: number; lastInstallmentCents: number } {
  const count = Math.max(1, Math.trunc(n));
  if (count === 1) return { installmentCents: totalCents, lastInstallmentCents: totalCents };
  const each = Math.ceil(totalCents / count);
  return { installmentCents: each, lastInstallmentCents: totalCents - each * (count - 1) };
}

export function quotePrice(price: PriceRule, input: QuoteInput): PriceQuote {
  if (price.amountCents === null || price.cycle === "QUOTE") throw new PricingError("QUOTE_REQUIRED", "Este produto é sob consulta: peça uma proposta.");
  if (!price.methods.includes(input.method)) throw new PricingError("METHOD", input.method === "PIX" ? "Este produto não aceita Pix." : "Este produto não aceita cartão.");
  const base = price.amountCents;
  const annual = price.cycle === "ANNUAL";
  const cap = Math.min(input.partnerDiscountMaxBps ?? 0, PARTNER_DISCOUNT_CAP_BPS);
  const askedPartner = Math.max(0, Math.trunc(input.partnerDiscountBps ?? 0));
  if (askedPartner > cap) throw new PricingError("PARTNER_DISCOUNT", `O desconto do parceiro neste produto vai até ${cap / 100}%.`);
  // Anual não acumula com desconto percentual do parceiro.
  const partnerBps = annual ? 0 : askedPartner;
  const rules: string[] = [];
  if (annual && askedPartner > 0) rules.push("anual sem desconto de parceiro (não cumulativo)");

  // Oferta de entrada: o primeiro ciclo mensal custa o valor da oferta, sem outros descontos.
  if (input.firstPeriodCents !== null && input.firstPeriodCents !== undefined && price.cycle === "MONTHLY") {
    const total = Math.min(input.firstPeriodCents, base);
    return { baseCents: base, method: input.method, installments: 1, installmentCents: total, lastInstallmentCents: total, pixDiscountCents: 0, partnerDiscountCents: 0, offerDiscountCents: base - total, cardMarkupCents: 0, totalCents: total, rule: `oferta de entrada: primeiro mês por ${total} centavos` };
  }

  if (input.method === "PIX") {
    const pixD = pctOf(base, price.pixDiscountBps);
    const partnerD = pctOf(base, partnerBps);
    // Pix e desconto do parceiro não acumulam: vale o maior.
    const usePartner = partnerD > pixD;
    const pixDiscountCents = usePartner ? 0 : pixD;
    const partnerDiscountCents = usePartner ? partnerD : 0;
    const total = base - pixDiscountCents - partnerDiscountCents;
    rules.push(usePartner ? `desconto do parceiro ${partnerBps / 100}% (maior que o Pix)` : price.pixDiscountBps ? `Pix com ${price.pixDiscountBps / 100}% de desconto` : "Pix sem desconto");
    return { baseCents: base, method: "PIX", installments: 1, installmentCents: total, lastInstallmentCents: total, pixDiscountCents, partnerDiscountCents, offerDiscountCents: 0, cardMarkupCents: 0, totalCents: total, rule: rules.join("; ") };
  }

  const n = Math.max(1, Math.trunc(input.installments ?? 1));
  if (n > price.cardMaxInstallments) throw new PricingError("INSTALLMENTS", `Este produto aceita até ${price.cardMaxInstallments}x no cartão.`);
  const partnerDiscountCents = pctOf(base, partnerBps);
  const discounted = base - partnerDiscountCents;
  // Acréscimo do cartão é fixo sobre o valor (×1,16), igual para 1x a 10x: o cliente vê o total antes de confirmar.
  const cardMarkupCents = pctOf(discounted, price.cardMarkupBps);
  const total = discounted + cardMarkupCents;
  const plan = installmentPlan(total, n);
  rules.push(price.cardMarkupBps ? `cartão: preço-base × ${(1 + price.cardMarkupBps / 10_000).toFixed(2).replace(".", ",")} em até ${price.cardMaxInstallments}x` : `cartão sem acréscimo em até ${price.cardMaxInstallments}x`);
  if (partnerDiscountCents) rules.push(`desconto do parceiro ${partnerBps / 100}%`);
  return { baseCents: base, method: "CARD", installments: n, ...plan, pixDiscountCents: 0, partnerDiscountCents, offerDiscountCents: 0, cardMarkupCents, totalCents: total, rule: rules.join("; ") };
}

/** Resumo para cards e landings: Pix, cartão (total e parcela máxima) e economia do anual. */
export function priceDisplay(price: PriceRule) {
  if (price.amountCents === null) return null;
  const pix = price.methods.includes("PIX") ? quotePrice(price, { method: "PIX" }) : null;
  const card = price.methods.includes("CARD") ? quotePrice(price, { method: "CARD", installments: price.cardMaxInstallments }) : null;
  return { baseCents: price.amountCents, pix, card };
}

/** Economia do anual frente a 12 mensalidades (em centavos e bps). */
export function annualSaving(monthlyCents: number, annualCents: number) {
  const full = monthlyCents * 12;
  return { savingCents: full - annualCents, savingBps: full > 0 ? Math.round(((full - annualCents) / full) * 10_000) : 0 };
}
