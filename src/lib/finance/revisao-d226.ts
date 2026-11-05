import type { PartnerKind } from "@/db/schema";

/**
 * Comissões de parceiros da D226 (aprovadas pelo dono em 03/11/2026), versionadas sobre a D220 sem apagar o histórico.
 * "Enquanto o cliente ficar" = 600 meses. No anual, a 1ª cobrança vale 12 meses: o percentual equivale a 50% de um mês
 * mais a recorrência dos outros 11 (ex.: criador (0,5 + 11 × 0,20) ÷ 12 = 22,50%). As renovações anuais pagam a recorrência.
 * Teto (teste garante): 1ª mensalidade ≤ 50%; recorrente ≤ 32% (Elite). Exceção explícita: Black (100% da 1ª, D226).
 */
export const REF_D226 = "D226";
export const ENQUANTO_FICAR = 600;
export const TETO_PRIMEIRA_BPS = 5000;
export const TETO_RECORRENTE_BPS = 3200;
export const anual = (recorrenteBps: number, primeiraBps = 5000) => Math.round((primeiraBps + 11 * recorrenteBps) / 12);

export type RegraD226 = { key: string; cycle: "MONTHLY" | "ANNUAL"; partnerKind: PartnerKind | null; firstBps: number; recurringBps: number; recurringMonths: number; benefit: string };
const par = (sufixo: string, kind: PartnerKind | null, rec: number, benefit: string): RegraD226[] => [
  { key: `COMMERCE_MENSAL${sufixo}`, cycle: "MONTHLY", partnerKind: kind, firstBps: 5000, recurringBps: rec, recurringMonths: ENQUANTO_FICAR, benefit },
  { key: `COMMERCE_ANUAL${sufixo}`, cycle: "ANNUAL", partnerKind: kind, firstBps: anual(rec), recurringBps: rec, recurringMonths: ENQUANTO_FICAR, benefit },
];
export const COMISSOES_D226: RegraD226[] = [
  ...par("", null, 2000, "Criador: 50% da 1ª mensalidade + 20% enquanto o cliente ficar"),
  ...par("_REPRESENTANTE", "REPRESENTATIVE", 2000, "Representante: 50% + 20% enquanto ficar + bônus por loja ativada"),
  ...par("_AGENCIA", "AGENCY", 2500, "Agência: 50% + 25% enquanto ficar, desde o 1º cliente"),
  ...par("_AGENCIA_ELITE", "AGENCY_ELITE", 3200, "Agência Elite: 50% + 32% enquanto ficar"),
];

/**
 * Black (D226): durante a campanha, a 1ª cobrança de um cliente novo paga 100% de uma mensalidade ao parceiro.
 * Mensal: 100%. Anual: 1 mês inteiro + a recorrência dos outros 11, sobre o valor do ano.
 */
export const bpsPrimeiraNaBlack = (cycle: string, recurringBps: number) => (cycle === "ANNUAL" ? anual(recurringBps, 10_000) : 10_000);

/** Bônus do representante (D226): por loja ativada e pela meta do mês. */
export const BONUS_ATIVACAO_CENTS = 3_000;
export const BONUS_META_CENTS = 10_000;
export const BONUS_META_ATIVACOES = 10;
