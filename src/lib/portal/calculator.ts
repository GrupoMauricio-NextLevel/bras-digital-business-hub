/**
 * Calculadora de uma venda para o portal. Só usa regras confirmadas em docs/PLANOS.md (item 0):
 * taxa do membro por tipo de loja, taxa do fornecedor por plano, base sem frete.
 * É uma estimativa de demonstração: não substitui o fechamento real.
 */
export type StoreType = "DROP_MANUAL" | "STORE_SUBDOMAIN" | "STORE_OWN";
export type SupplierPlan = "SUPERDROP" | "WHITE_LABEL";

/** Taxa por pedido do membro, em pontos base (300 = 3%). */
export const MEMBER_FEE_BPS: Record<StoreType, number> = { DROP_MANUAL: 500, STORE_SUBDOMAIN: 500, STORE_OWN: 300 };
/** Taxa por pedido do fornecedor, em pontos base (150 = 1,5%). */
export const SUPPLIER_FEE_BPS: Record<SupplierPlan, number> = { SUPERDROP: 300, WHITE_LABEL: 150 };

export const STORE_TYPE_LABEL: Record<StoreType, string> = { DROP_MANUAL: "Drop manual", STORE_SUBDOMAIN: "Loja básica", STORE_OWN: "Loja própria" };
export const SUPPLIER_PLAN_LABEL: Record<SupplierPlan, string> = { SUPERDROP: "SuperDrop", WHITE_LABEL: "White Label" };

export type SaleEstimate = {
  /** O que o cliente final paga pelos produtos (sem frete). */
  customerPaysCents: number;
  /** O que o membro paga ao fornecedor pelo produto. */
  memberPaysSupplierCents: number;
  memberFeeCents: number;
  supplierFeeCents: number;
  /** Sobra do membro depois do custo e da taxa. */
  memberNetCents: number;
  /** Recebido pelo fornecedor depois da taxa dele (antes do custo de produção dele). */
  supplierReceivesCents: number;
  memberMarginPercent: number;
};

const fee = (cents: number, bps: number) => Math.round((cents * bps) / 10_000);

export function estimateSale(input: { customerPaysCents: number; memberPaysSupplierCents: number; storeType: StoreType; supplierPlan: SupplierPlan }): SaleEstimate {
  const customer = Math.max(0, Math.round(input.customerPaysCents));
  const cost = Math.max(0, Math.round(input.memberPaysSupplierCents));
  const memberFeeCents = fee(customer, MEMBER_FEE_BPS[input.storeType]);
  const supplierFeeCents = fee(cost, SUPPLIER_FEE_BPS[input.supplierPlan]);
  const memberNetCents = customer - cost - memberFeeCents;
  return {
    customerPaysCents: customer, memberPaysSupplierCents: cost, memberFeeCents, supplierFeeCents, memberNetCents,
    supplierReceivesCents: cost - supplierFeeCents,
    memberMarginPercent: customer ? Math.round((memberNetCents / customer) * 1000) / 10 : 0,
  };
}
