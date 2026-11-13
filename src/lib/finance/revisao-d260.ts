import { COMISSOES_D226 } from "./revisao-d226";

/**
 * Regra única dos parceiros da Commerce (D260, aprovada pelo dono em 06/11/2026). Substitui a D226 sem apagar o
 * histórico: todos os parceiros (criador, vendedor, agência) recebem o mesmo percentual de TODA mensalidade paga,
 * desde a 1ª, enquanto o cliente ficar. O percentual depende só dos clientes ativos (níveis em `niveis-regras.ts`):
 * 20% (1 a 9), 24% (10 a 24) e 28% (25 ou mais). Sem Black, sem bônus e sem regra diferente por tipo.
 * No plano anual, o percentual vale sobre o valor pago no ano.
 */
export const REF_D260 = "D260";
export const BASE_D260_BPS = 2000;
export const TETO_D260_BPS = 2800;

/** As mesmas chaves das regras anteriores (uma por tipo e ciclo), todas com a mesma regra. */
export const COMISSOES_D260 = COMISSOES_D226.map((r) => ({ ...r, firstBps: BASE_D260_BPS, recurringBps: BASE_D260_BPS, benefit: "20% de toda mensalidade, desde o 1º cliente; 24% com 10 clientes ativos e 28% com 25" }));
