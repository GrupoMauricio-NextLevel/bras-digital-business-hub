/**
 * Motor financeiro puro (sem banco, sem React). Todo valor em centavos, taxas em pontos-base.
 * Usado pelo fechamento mensal, pelas telas e pelo simulador.
 */
import { OFFER_KEYS, type OfferKey, type PriceBook, type SupplierModel, type TierKey } from "./price-book";

export const pct = (valueCents: number, bps: number) => Math.round((valueCents * bps) / 10_000);

// ---------------------------------------------------------------------------
// Contrato
// ---------------------------------------------------------------------------
export type ContractTerms = {
  model: SupplierModel;
  tier: TierKey;
  monthlyFeeCents: number;
  setupFeeCents: number;
  volumeFeeBps: number;
  minMonthlyFeeCents: number;
  perOrderFeeCents: number;
  storeSetupCommissionBps: number;
  monthlyWaivedUntil: string | null;
  setupWaivedUntil: string | null;
  priceLockUntil: string | null;
  creditBalanceCents: number;
};

/** Contrato padrão de lista para um modelo comercial. */
export function defaultContract(book: PriceBook, model: SupplierModel, tier: TierKey = "GROWTH"): ContractTerms {
  const wl = model === "WHITE_LABEL";
  return {
    model, tier,
    monthlyFeeCents: wl ? book.whiteLabel.monthlyCents : book.supplierTiers[tier].monthlyCents,
    setupFeeCents: wl ? book.whiteLabel.setupCents : book.superdrop.setupCents,
    volumeFeeBps: wl ? book.whiteLabel.volumeFeeBps : book.superdrop.volumeFeeBps,
    minMonthlyFeeCents: wl ? book.whiteLabel.minMonthlyFeeCents : book.superdrop.minMonthlyFeeCents,
    perOrderFeeCents: wl ? book.whiteLabel.perOrderFeeCents : 0,
    storeSetupCommissionBps: book.channel.setupCommissionBps,
    monthlyWaivedUntil: null, setupWaivedUntil: null, priceLockUntil: null, creditBalanceCents: 0,
  };
}

export const isWaived = (until: string | null | undefined, at: Date) => !!until && new Date(until).getTime() > at.getTime();

/** Comissão do canal sobre o setup de uma loja nova. */
export const storeSetupCommission = (setupCents: number, bps: number) => pct(setupCents, bps);

// ---------------------------------------------------------------------------
// Taxa de volume e fechamento mensal
// ---------------------------------------------------------------------------
export type VolumeFee = { percentCents: number; perOrderCents: number; minAdjustmentCents: number; totalCents: number };

/** Taxa sobre o custo dos pedidos pagos à Central no mês, com piso mensal. */
export function volumeFee(c: Pick<ContractTerms, "volumeFeeBps" | "minMonthlyFeeCents" | "perOrderFeeCents">, input: { baseCents: number; orders: number }): VolumeFee {
  const percentCents = pct(input.baseCents, c.volumeFeeBps);
  const perOrderCents = c.perOrderFeeCents * input.orders;
  const earned = percentCents + perOrderCents;
  const minAdjustmentCents = Math.max(0, c.minMonthlyFeeCents - earned);
  return { percentCents, perOrderCents, minAdjustmentCents, totalCents: earned + minAdjustmentCents };
}

export type ClosingLine = { kind: "VOLUME_FEE" | "PER_ORDER_FEE" | "MIN_FEE_TOPUP" | "COMMISSION_CREDIT" | "BALANCE_ADJUSTMENT" | "CARRY_FORWARD"; description: string; amountCents: number };
export type Closing = { fee: VolumeFee; commissionCreditCents: number; balanceUsedCents: number; netCents: number; carryOutCents: number; lines: ClosingLine[] };

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Fechamento do mês do fornecedor: taxa de volume menos comissões de canal elegíveis e saldo anterior.
 * Se o líquido ficar negativo, a fatura é zero e a diferença vira saldo a favor para o mês seguinte.
 */
export function closeSupplierMonth(input: { contract: Pick<ContractTerms, "volumeFeeBps" | "minMonthlyFeeCents" | "perOrderFeeCents" | "creditBalanceCents">; baseCents: number; orders: number; commissions: { label: string; cents: number }[] }): Closing {
  const fee = volumeFee(input.contract, { baseCents: input.baseCents, orders: input.orders });
  const lines: ClosingLine[] = [];
  lines.push({ kind: "VOLUME_FEE", description: `Taxa de volume ${input.contract.volumeFeeBps / 100}% sobre ${brl(input.baseCents)} pagos à Central`, amountCents: fee.percentCents });
  if (fee.perOrderCents > 0) lines.push({ kind: "PER_ORDER_FEE", description: `${input.orders} pedidos × ${brl(input.contract.perOrderFeeCents)}`, amountCents: fee.perOrderCents });
  if (fee.minAdjustmentCents > 0) lines.push({ kind: "MIN_FEE_TOPUP", description: `Complemento até a taxa mínima mensal de ${brl(input.contract.minMonthlyFeeCents)}`, amountCents: fee.minAdjustmentCents });
  let commissionCreditCents = 0;
  for (const c of input.commissions) { commissionCreditCents += c.cents; lines.push({ kind: "COMMISSION_CREDIT", description: c.label, amountCents: -c.cents }); }
  const balanceUsedCents = input.contract.creditBalanceCents;
  if (balanceUsedCents !== 0) lines.push({ kind: "BALANCE_ADJUSTMENT", description: balanceUsedCents > 0 ? "Saldo a favor de meses anteriores" : "Débito de meses anteriores", amountCents: -balanceUsedCents });
  const raw = fee.totalCents - commissionCreditCents - balanceUsedCents;
  // Quando o crédito supera a taxa, a fatura é zero e a sobra vira saldo. A linha mantém a soma das linhas igual ao valor cobrado.
  if (raw < 0) lines.push({ kind: "CARRY_FORWARD", description: "Saldo a seu favor para o próximo fechamento", amountCents: -raw });
  return { fee, commissionCreditCents, balanceUsedCents, netCents: Math.max(0, raw), carryOutCents: Math.max(0, -raw), lines };
}

// ---------------------------------------------------------------------------
// Acesso por inadimplência
// ---------------------------------------------------------------------------
export type AccessState = "ACTIVE" | "WARNING" | "PARTIAL_BLOCK" | "SUSPENDED" | "CLOSED";
export type Capabilities = { canLogin: boolean; canCreateOrders: boolean; canCreateStores: boolean; canExpedite: boolean; canManageCatalog: boolean };

export function accessStateForOverdue(daysOverdue: number, rules: PriceBook["dunning"]): AccessState {
  if (daysOverdue >= rules.closedDays) return "CLOSED";
  if (daysOverdue >= rules.suspendedDays) return "SUSPENDED";
  if (daysOverdue >= rules.partialBlockDays) return "PARTIAL_BLOCK";
  if (daysOverdue >= rules.warningDays) return "WARNING";
  return "ACTIVE";
}

/** O bloqueio parcial protege o consumidor final: pedidos já pagos continuam sendo expedidos. */
export const ACCESS_CAPABILITIES: Record<AccessState, Capabilities> = {
  ACTIVE: { canLogin: true, canCreateOrders: true, canCreateStores: true, canExpedite: true, canManageCatalog: true },
  WARNING: { canLogin: true, canCreateOrders: true, canCreateStores: true, canExpedite: true, canManageCatalog: true },
  PARTIAL_BLOCK: { canLogin: true, canCreateOrders: false, canCreateStores: false, canExpedite: true, canManageCatalog: true },
  SUSPENDED: { canLogin: true, canCreateOrders: false, canCreateStores: false, canExpedite: false, canManageCatalog: false },
  CLOSED: { canLogin: false, canCreateOrders: false, canCreateStores: false, canExpedite: false, canManageCatalog: false },
};

export const ACCESS_LABEL: Record<AccessState, string> = { ACTIVE: "Ativo", WARNING: "Aviso de atraso", PARTIAL_BLOCK: "Bloqueio parcial", SUSPENDED: "Suspenso", CLOSED: "Encerrado" };

export const daysBetween = (from: Date, to: Date) => Math.floor((to.getTime() - from.getTime()) / 86_400_000);

// ---------------------------------------------------------------------------
// Simulador
// ---------------------------------------------------------------------------
export type SimSupplier = { name: string; model: SupplierModel; tier: TierKey; waived: boolean; startingStores: number; newStoresPerMonth: number; volumePerStoreCents: number };
export type SimInput = {
  months: number;
  suppliers: SimSupplier[];
  /** Percentual de lojas por oferta, somando 100. */
  mix: Record<OfferKey, number>;
  churnBps: number;
  templateAttachBps: number;
  templateTicketCents: number;
  serviceAttachBps: number;
  serviceTicketCents: number;
};

export const STREAMS = ["supplierMonthly", "volumeFee", "storeMonthly", "storeSetup", "templates", "services"] as const;
export type Stream = (typeof STREAMS)[number];
export const STREAM_LABEL: Record<Stream, string> = {
  supplierMonthly: "Mensalidade de fornecedores",
  volumeFee: "Taxa de volume",
  storeMonthly: "Mensalidade de lojistas",
  storeSetup: "Setup de lojas",
  templates: "Templates",
  services: "Serviços",
};

export type SimMonth = {
  month: number;
  stores: number;
  revenue: Record<Stream, number>;
  supplierSetup: number;
  grossRevenue: number;
  commissions: number;
  costs: number;
  net: number;
  cumulativeNet: number;
};
export type SimResult = { months: SimMonth[]; totals: { grossRevenue: number; commissions: number; costs: number; net: number; supplierSetup: number }; monthsWaived: number; lastMonthMrr: number; lastMonthNet: number; payoutToSuppliers: number };

export const DEFAULT_SIM: SimInput = {
  months: 12,
  suppliers: [
    { name: "Fornecedor 1 (isento)", model: "SUPERDROP", tier: "GROWTH", waived: true, startingStores: 10, newStoresPerMonth: 4, volumePerStoreCents: 600_000 },
    { name: "Fornecedor 2", model: "SUPERDROP", tier: "GROWTH", waived: false, startingStores: 10, newStoresPerMonth: 4, volumePerStoreCents: 600_000 },
  ],
  mix: { DROP_MANUAL: 40, STORE_SUBDOMAIN: 30, STORE_OWN: 30 },
  churnBps: 300,
  templateAttachBps: 1500,
  templateTicketCents: 40_000,
  serviceAttachBps: 2000,
  serviceTicketCents: 60_000,
};

export function simulate(input: SimInput, book: PriceBook): SimResult {
  const mixTotal = OFFER_KEYS.reduce((s, k) => s + input.mix[k], 0) || 1;
  const w = (k: OfferKey) => input.mix[k] / mixTotal;
  const avgMonthly = OFFER_KEYS.reduce((s, k) => s + w(k) * book.offers[k].monthlyCents, 0);
  const avgSetup = OFFER_KEYS.reduce((s, k) => s + w(k) * book.offers[k].setupCents, 0);
  const waivedMonths = Math.ceil(book.billing.waiverDays / 30);
  const state = input.suppliers.map((s) => ({ s, stores: s.startingStores, contract: defaultContract(book, s.model, s.tier) }));
  const months: SimMonth[] = [];
  let cumulative = 0, payout = 0;
  const totals = { grossRevenue: 0, commissions: 0, costs: 0, net: 0, supplierSetup: 0 };

  for (let m = 1; m <= input.months; m++) {
    const rev: Record<Stream, number> = { supplierMonthly: 0, volumeFee: 0, storeMonthly: 0, storeSetup: 0, templates: 0, services: 0 };
    let supplierSetup = 0, commissions = 0, serviceCost = 0, stores = 0;
    for (const st of state) {
      const { s, contract } = st;
      const newStores = s.newStoresPerMonth;
      st.stores = st.stores * (1 - input.churnBps / 10_000) + newStores;
      stores += st.stores;
      const waived = s.waived && m <= waivedMonths;
      if (!waived) rev.supplierMonthly += contract.monthlyFeeCents;
      if (m === 1 && !s.waived) supplierSetup += contract.setupFeeCents;
      rev.volumeFee += volumeFee(contract, { baseCents: Math.round(st.stores * s.volumePerStoreCents), orders: 0 }).totalCents;
      rev.storeMonthly += Math.round(st.stores * avgMonthly);
      const setupGross = Math.round(newStores * avgSetup);
      rev.storeSetup += setupGross;
      commissions += storeSetupCommission(setupGross, contract.storeSetupCommissionBps);
      rev.templates += Math.round(newStores * (input.templateAttachBps / 10_000) * input.templateTicketCents);
      const svc = Math.round(st.stores * (input.serviceAttachBps / 10_000) * input.serviceTicketCents);
      rev.services += svc;
      serviceCost += Math.round(svc * (1 - book.services.targetMarginBps / 10_000));
    }
    payout += commissions;
    const gross = STREAMS.reduce((a, k) => a + rev[k], 0) + supplierSetup;
    const costs = pct(gross, book.costs.collectionFeeBps) + Math.round(stores * book.costs.infraPerStoreCents) + input.suppliers.length * book.costs.supportPerSupplierCents + serviceCost;
    const net = gross - commissions - costs;
    cumulative += net;
    months.push({ month: m, stores, revenue: rev, supplierSetup, grossRevenue: gross, commissions, costs, net, cumulativeNet: cumulative });
    totals.grossRevenue += gross; totals.commissions += commissions; totals.costs += costs; totals.net += net; totals.supplierSetup += supplierSetup;
  }
  const last = months[months.length - 1];
  const lastMrr = last ? last.revenue.supplierMonthly + last.revenue.volumeFee + last.revenue.storeMonthly + last.revenue.services : 0;
  return { months, totals, monthsWaived: waivedMonths, lastMonthMrr: lastMrr, lastMonthNet: last?.net ?? 0, payoutToSuppliers: payout };
}
