import { z } from "zod";

/**
 * Tabela de preços da plataforma. Valores em centavos e taxas em pontos-base (100 bps = 1%).
 * É a única fonte dos valores de lista: contratos nascem daqui e o simulador lê daqui.
 */
export const OFFER_KEYS = ["DROP_MANUAL", "STORE_SUBDOMAIN", "STORE_OWN"] as const;
export type OfferKey = (typeof OFFER_KEYS)[number];
export const TIER_KEYS = ["START", "GROWTH", "SCALE"] as const;
export type TierKey = (typeof TIER_KEYS)[number];
export type SupplierModel = "SUPERDROP" | "WHITE_LABEL";

const cents = z.number().int().nonnegative();
const bps = z.number().int().min(0).max(10000);
const days = z.number().int().min(0).max(365);

export const priceBookSchema = z.object({
  supplierTiers: z.record(z.enum(TIER_KEYS), z.object({ name: z.string(), monthlyCents: cents, maxSkus: z.number().int().nullable(), maxOrders: z.number().int().nullable() })),
  superdrop: z.object({ setupCents: cents, volumeFeeBps: bps, minMonthlyFeeCents: cents }),
  whiteLabel: z.object({ setupCents: cents, monthlyCents: cents, volumeFeeBps: bps, minMonthlyFeeCents: cents, perOrderFeeCents: cents }),
  offers: z.record(z.enum(OFFER_KEYS), z.object({ name: z.string(), description: z.string(), setupCents: cents, monthlyCents: cents })),
  channel: z.object({ setupCommissionBps: bps, guaranteeDays: days }),
  templates: z.record(z.enum(["PRO", "ELITE"]), z.object({ oneTimeCents: cents, monthlyCents: cents })),
  services: z.object({ targetMarginBps: bps }),
  billing: z.object({ dueDay: z.number().int().min(1).max(28), waiverDays: days, priceLockMonths: z.number().int().min(0).max(60) }),
  dunning: z.object({ warningDays: days, partialBlockDays: days, suspendedDays: days, closedDays: days }),
  costs: z.object({ collectionFeeBps: bps, infraPerStoreCents: cents, supportPerSupplierCents: cents }),
});
export type PriceBook = z.infer<typeof priceBookSchema>;

export const DEFAULT_PRICE_BOOK: PriceBook = {
  supplierTiers: {
    START: { name: "Start", monthlyCents: 49_700, maxSkus: 100, maxOrders: 300 },
    GROWTH: { name: "Growth", monthlyCents: 99_700, maxSkus: 500, maxOrders: 1500 },
    SCALE: { name: "Scale", monthlyCents: 199_700, maxSkus: null, maxOrders: null },
  },
  superdrop: { setupCents: 0, volumeFeeBps: 300, minMonthlyFeeCents: 30_000 },
  whiteLabel: { setupCents: 1_500_000, monthlyCents: 200_000, volumeFeeBps: 150, minMonthlyFeeCents: 50_000, perOrderFeeCents: 0 },
  offers: {
    DROP_MANUAL: { name: "Drop manual", description: "Pedidos manuais, estoque central e financeiro, sem loja virtual.", setupCents: 0, monthlyCents: 4_900 },
    STORE_SUBDOMAIN: { name: "Loja SuperDrop", description: "Loja básica em subdomínio SuperDrop, com selo SuperDrop.", setupCents: 20_000, monthlyCents: 9_700 },
    STORE_OWN: { name: "Loja própria", description: "Loja White Label com marca e domínio próprios, sem selo SuperDrop.", setupCents: 200_000, monthlyCents: 19_700 },
  },
  channel: { setupCommissionBps: 2500, guaranteeDays: 7 },
  templates: { PRO: { oneTimeCents: 29_700, monthlyCents: 3_900 }, ELITE: { oneTimeCents: 69_700, monthlyCents: 8_900 } },
  services: { targetMarginBps: 5000 },
  billing: { dueDay: 5, waiverDays: 90, priceLockMonths: 12 },
  dunning: { warningDays: 1, partialBlockDays: 10, suspendedDays: 15, closedDays: 30 },
  costs: { collectionFeeBps: 200, infraPerStoreCents: 800, supportPerSupplierCents: 50_000 },
};

export const TIER_LABEL: Record<TierKey, string> = { START: "Start", GROWTH: "Growth", SCALE: "Scale" };
export const OFFER_LABEL: Record<OfferKey, string> = { DROP_MANUAL: "Drop manual", STORE_SUBDOMAIN: "Loja SuperDrop", STORE_OWN: "Loja própria" };
