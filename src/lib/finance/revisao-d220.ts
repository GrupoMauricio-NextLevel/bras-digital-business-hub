import type { PartnerKind } from "@/db/schema";

/**
 * Revisão de preços e comissões da NextLevel Commerce (D220, decisão do dono em 2026-10-29):
 *  - TAXA ZERO sobre as vendas em todos os planos (checkout Mercado Pago, parceiro oficial). A NextLevel fica com a
 *    mensalidade, temas, serviços e parceiros.
 *  - mensalidades abaixo de Nuvemshop e Tray em cada degrau, no mensal e no anual (comparativo em
 *    `src/lib/marcas/comparativo-ecommerce.ts`).
 *  - programa de parceiros: indicador 20% na 1ª venda + 10% recorrente por 12 meses; agência 30% + 15% recorrente
 *    enquanto o cliente ficar (até 120 meses).
 * Aplicada uma vez por banco como NOVA versão (as versões antigas ficam no histórico). Marcador: `approvalRef = REF`.
 */
export const REF_D220 = "D220";
export const PRECOS_D220: Record<string, { mensal: number; anual: number }> = {
  COMMERCE_START: { mensal: 5_700, anual: 44_400 },
  COMMERCE_PRO: { mensal: 14_700, anual: 142_800 },
  COMMERCE_SCALE: { mensal: 34_700, anual: 356_400 },
};
/** Desconto do anual sobre 12 mensalidades, em pontos-base (para o rótulo do plano). */
export const descontoAnualBps = (p: { mensal: number; anual: number }) => Math.round((1 - p.anual / (p.mensal * 12)) * 10_000);

export type RegraD220 = { key: string; cycle: "MONTHLY" | "ANNUAL"; partnerKind: PartnerKind | null; firstBps: number; recurringBps: number; recurringMonths: number; benefit: string };
export const COMISSOES_D220: RegraD220[] = [
  { key: "COMMERCE_MENSAL", cycle: "MONTHLY", partnerKind: null, firstBps: 2000, recurringBps: 1000, recurringMonths: 12, benefit: "Taxa zero nas vendas com Mercado Pago e mensalidade a partir de R$ 57" },
  { key: "COMMERCE_ANUAL", cycle: "ANNUAL", partnerKind: null, firstBps: 2000, recurringBps: 1000, recurringMonths: 1, benefit: "Anual a partir de R$ 37 por mês, taxa zero nas vendas" },
  { key: "COMMERCE_MENSAL_AGENCIA", cycle: "MONTHLY", partnerKind: "AGENCY", firstBps: 3000, recurringBps: 1500, recurringMonths: 120, benefit: "Agência parceira: condição especial para os seus clientes" },
  { key: "COMMERCE_ANUAL_AGENCIA", cycle: "ANNUAL", partnerKind: "AGENCY", firstBps: 3000, recurringBps: 1500, recurringMonths: 10, benefit: "Agência parceira: anual com taxa zero" },
  { key: "COMMERCE_MENSAL_AGENCIA_ELITE", cycle: "MONTHLY", partnerKind: "AGENCY_ELITE", firstBps: 3000, recurringBps: 1500, recurringMonths: 120, benefit: "Agência elite: condição especial para os seus clientes" },
  { key: "COMMERCE_ANUAL_AGENCIA_ELITE", cycle: "ANNUAL", partnerKind: "AGENCY_ELITE", firstBps: 3000, recurringBps: 1500, recurringMonths: 10, benefit: "Agência elite: anual com taxa zero" },
];
