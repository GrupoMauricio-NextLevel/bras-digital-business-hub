/**
 * Preço depois da Black NextLevel (D228, aprovado pelo dono em 2026-11-03): meio-termo, sem subir demais.
 * Mensal R$ 67 / 167 / 397 e anual R$ 49 / 139 / 339 por mês. Entra sozinho no fim da Black (vigência = fim + 1 s,
 * movida junto quando o Master prorroga a campanha). Quem assinou antes mantém o valor congelado na assinatura.
 * Continua vencendo todos no custo total (mensalidade + taxa da plataforma) a partir de R$ 2,1 mil / 9,3 mil / 28,1 mil
 * vendidos por mês (seção 14.6 de docs/prompts/parceiros-v2-crm-niveis-planos.md).
 */
export const REF_D228 = "D228";
export const PRECOS_D228: Record<string, { mensal: number; anual: number }> = {
  COMMERCE_START: { mensal: 6_700, anual: 58_800 },
  COMMERCE_PRO: { mensal: 16_700, anual: 166_800 },
  COMMERCE_SCALE: { mensal: 39_700, anual: 406_800 },
};
