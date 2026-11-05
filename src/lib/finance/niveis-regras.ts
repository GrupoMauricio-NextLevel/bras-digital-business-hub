import type { PartnerTier } from "@/db/schema";
import { TETO_RECORRENTE_BPS } from "./revisao-d226";

/** Regras puras dos níveis de parceiro (D249): usadas no servidor e nas páginas (simulador). */
export const NIVEIS: readonly { tier: PartnerTier; nome: string; minimo: number; efeito: string }[] = [
  { tier: "INICIAL", nome: "Inicial", minimo: 0, efeito: "Regra base da sua trilha, já com recorrência" },
  { tier: "PRATA", nome: "Prata", minimo: 3, efeito: "+2 pontos na recorrência" },
  { tier: "OURO", nome: "Ouro", minimo: 10, efeito: "+4 pontos na recorrência e gerente de sucesso" },
  { tier: "DIAMANTE", nome: "Diamante", minimo: 20, efeito: "Elite: 32% na agência, 26% no criador e no representante" },
];
export const MESES_PARA_DESCER = 2;

export function nivelPorClientes(ativos: number): PartnerTier {
  return [...NIVEIS].reverse().find((n) => ativos >= n.minimo)!.tier;
}

/** Recorrência com o bônus do nível, sem passar do teto (32%). Agência no Diamante = Elite. */
export function recorrenteDoNivel(baseBps: number, tier: PartnerTier, kind: string): number {
  if (baseBps <= 0) return baseBps;
  const agencia = kind === "AGENCY" || kind === "AGENCY_ELITE";
  const alvo = tier === "PRATA" ? baseBps + 200 : tier === "OURO" ? baseBps + 400 : tier === "DIAMANTE" ? Math.max(baseBps, agencia ? 3200 : 2600) : baseBps;
  return Math.min(Math.max(alvo, baseBps), Math.max(TETO_RECORRENTE_BPS, baseBps));
}

