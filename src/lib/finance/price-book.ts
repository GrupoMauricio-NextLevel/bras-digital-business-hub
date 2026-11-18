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

/**
 * MODULO_SITE (NextLevel Business, D310/D311): o site da empresa para quem já é lojista. Não existe adicional de loja: a loja
 * virtual são os planos Start, Pro e Scale, intactos (quem entrou pelo caminho Site já assina um deles).
 */
export const ADDON_KEYS = ["ACADEMY_STORE", "PREMIUM_SUPPORT", "ADVANCED_REPORTS", "EXTRA_DISPATCH_SEAT", "MODULO_SITE"] as const;
export type AddonKey = (typeof ADDON_KEYS)[number];

export type AddonDef = { name: string; description: string; audience: "STORE" | "SUPPLIER" | "BOTH"; monthlyCents: number; annualCents: number };
const DEFAULT_ADDONS: Record<AddonKey, AddonDef> = {
  ACADEMY_STORE: { name: "Academy do lojista", description: "Trilha completa do zero ao faturamento: catálogo, preço com margem, Pix, primeira venda, tráfego e recompra.", audience: "STORE", monthlyCents: 4_700, annualCents: 39_700 },
  PREMIUM_SUPPORT: { name: "Suporte Premium", description: "Chat com prioridade e resposta em até 2h úteis com especialista dedicado.", audience: "BOTH", monthlyCents: 9_700, annualCents: 97_000 },
  ADVANCED_REPORTS: { name: "Relatórios avançados", description: "Margem por produto, recompra e exportação para planilha.", audience: "STORE", monthlyCents: 2_900, annualCents: 29_000 },
  // Preço provisório (D310): o dono define o valor em Master → Financeiro → Tabela de preços.
  MODULO_SITE: { name: "Site para a empresa", description: "Páginas da empresa (Sobre, Serviços, Contato, campanha), serviços e o formulário de orçamento com a origem de cada pedido.", audience: "STORE", monthlyCents: 2_900, annualCents: 29_000 },
  EXTRA_DISPATCH_SEAT: { name: "Assento extra de expedição", description: "Mais um funcionário usando a esteira de separação.", audience: "SUPPLIER", monthlyCents: 1_900, annualCents: 19_000 },
};

const cents = z.number().int().nonnegative();
const bps = z.number().int().min(0).max(10000);
const days = z.number().int().min(0).max(365);

export const DEFAULT_FRENTES = {
  segundoProdutoBps: 5000,
  sitesStartCents: 7_900,
  businessClienteBps: 3000,
  business: { essencialCents: 19_900, profissionalCents: 49_900, avancadoCents: 99_900, essencialPessoas: 5, profissionalPessoas: 20, avancadoPessoas: 50 },
};

export const priceBookSchema = z.object({
  supplierTiers: z.record(z.enum(TIER_KEYS), z.object({ name: z.string(), monthlyCents: cents, maxSkus: z.number().int().nullable(), maxOrders: z.number().int().nullable() })),
  superdrop: z.object({ setupCents: cents, volumeFeeBps: bps, minMonthlyFeeCents: cents }),
  whiteLabel: z.object({ setupCents: cents, monthlyCents: cents, volumeFeeBps: bps, minMonthlyFeeCents: cents, perOrderFeeCents: cents }),
  offers: z.record(z.enum(OFFER_KEYS), z.object({ name: z.string(), description: z.string(), setupCents: cents, monthlyCents: cents })),
  channel: z.object({ setupCommissionBps: bps, guaranteeDays: days }),
  /** Taxa por pedido do membro (bps sobre o valor dos produtos, sem frete), por oferta. Cobrada no fechamento mensal. */
  orderFees: z.record(z.enum(OFFER_KEYS), bps).default(() => ({ DROP_MANUAL: 500, STORE_SUBDOMAIN: 500, STORE_OWN: 300 })),
  templates: z.record(z.enum(["PRO", "ELITE"]), z.object({ oneTimeCents: cents, monthlyCents: cents })),
  services: z.object({ targetMarginBps: bps }),
  billing: z.object({ dueDay: z.number().int().min(1).max(28), waiverDays: days, priceLockMonths: z.number().int().min(0).max(60), /** Desconto para pagar por Pix (em centésimos de %) sobre o preço de lista, que é o valor cheio no cartão em até 6x. */ pixDiscountBps: z.number().int().min(0).max(5000).default(1000) }),
  dunning: z.object({ warningDays: days, partialBlockDays: days, suspendedDays: days, closedDays: days }),
  costs: z.object({ collectionFeeBps: bps, infraPerStoreCents: cents, supportPerSupplierCents: cents }),
  /**
   * Frentes da NextLevel Commerce (ecossistema tudo em um, D336): Sites, regra do segundo produto e níveis de referência do
   * NextLevel Business. Tudo editável no Master; tabela salva antes desta seção ganha os valores padrão.
   */
  frentes: z.object({
    /** Desconto no segundo produto (Site para quem tem loja, loja para quem tem site), em centésimos de %. */
    segundoProdutoBps: bps,
    /** Mensalidade do Sites Start (os níveis Pro e Scale do Sites têm o mesmo preço dos planos da loja). */
    sitesStartCents: cents,
    /** Desconto do NextLevel Business para quem já tem Sites ou Loja virtual, em centésimos de %. */
    businessClienteBps: bps,
    business: z.object({ essencialCents: cents, profissionalCents: cents, avancadoCents: cents, essencialPessoas: z.number().int().min(1), profissionalPessoas: z.number().int().min(1), avancadoPessoas: z.number().int().min(1) }),
  }).default(() => structuredClone(DEFAULT_FRENTES)),
  /** Add-ons mensais/anuais liberados por entitlement. audience: quem pode comprar. */
  addons: z.record(z.string(), z.object({ name: z.string(), description: z.string(), audience: z.enum(["STORE", "SUPPLIER", "BOTH"]), monthlyCents: cents, annualCents: cents })).default(() => structuredClone(DEFAULT_ADDONS))
    // Tabela salva antes ou depois de um adicional mudar continua válida (D310/D311): o que faltar entra com o valor padrão
    // e chave que não existe mais é ignorada (nunca derruba a tabela inteira de volta ao padrão).
    .transform((v) => ({ ...structuredClone(DEFAULT_ADDONS), ...Object.fromEntries(Object.entries(v).filter(([k]) => (ADDON_KEYS as readonly string[]).includes(k))) }) as Record<AddonKey, AddonDef>),
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
  orderFees: { DROP_MANUAL: 500, STORE_SUBDOMAIN: 500, STORE_OWN: 300 },
  templates: { PRO: { oneTimeCents: 29_700, monthlyCents: 3_900 }, ELITE: { oneTimeCents: 69_700, monthlyCents: 8_900 } },
  services: { targetMarginBps: 5000 },
  billing: { dueDay: 5, waiverDays: 90, priceLockMonths: 12, pixDiscountBps: 1000 },
  // Prazos flexíveis: aviso 3 dias após o vencimento, bloqueio parcial em 15, suspensão em 25 e encerramento em 90.
  dunning: { warningDays: 3, partialBlockDays: 15, suspendedDays: 25, closedDays: 90 },
  costs: { collectionFeeBps: 200, infraPerStoreCents: 800, supportPerSupplierCents: 50_000 },
  frentes: structuredClone(DEFAULT_FRENTES),
  addons: structuredClone(DEFAULT_ADDONS),
};

export const TIER_LABEL: Record<TierKey, string> = { START: "Start", GROWTH: "Growth", SCALE: "Scale" };
export const OFFER_LABEL: Record<OfferKey, string> = { DROP_MANUAL: "Drop manual", STORE_SUBDOMAIN: "Loja SuperDrop", STORE_OWN: "Loja própria" };
