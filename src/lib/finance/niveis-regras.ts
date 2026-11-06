import type { PartnerTier } from "@/db/schema";

/**
 * Níveis dos parceiros (D260, regra única): o percentual de toda mensalidade depende só dos clientes ativos.
 * Puro: usado no servidor (comissão) e nas páginas (escada e simulador). O nível DIAMANTE da D249 deixou de existir;
 * quem estivesse nele recebe o mesmo que o Ouro (28%).
 */
export const NIVEIS: readonly { tier: PartnerTier; nome: string; minimo: number; bps: number; efeito: string }[] = [
  { tier: "INICIAL", nome: "Inicial", minimo: 0, bps: 2000, efeito: "20% de toda mensalidade, desde o 1º cliente" },
  { tier: "PRATA", nome: "Prata", minimo: 10, bps: 2400, efeito: "24% de toda mensalidade" },
  { tier: "OURO", nome: "Ouro", minimo: 25, bps: 2800, efeito: "28% de toda mensalidade" },
];
export const MESES_PARA_DESCER = 2;

/**
 * D263 (dono): quem recebe no CPF entra no Programa de Indicações, uma frente própria com 5 pontos a menos em cada nível
 * (15% / 19% / 23%). Quem tem CNPJ (criador, vendedor e agência) fica com 20% / 24% / 28%.
 */
export const DESCONTO_CPF_BPS = 500;
export const ehPessoaFisica = (taxId?: string | null) => (taxId ?? "").replace(/\D/g, "").length === 11;

export function nivelPorClientes(ativos: number): PartnerTier {
  return [...NIVEIS].reverse().find((n) => ativos >= n.minimo)!.tier;
}

/** Percentual do nível. `baseBps` 0 (sem regra) continua 0; o tipo do parceiro não muda nada (regra única). */
export function recorrenteDoNivel(baseBps: number, tier: PartnerTier, _kind?: string, pessoaFisica = false): number {
  if (baseBps <= 0) return baseBps;
  return (NIVEIS.find((n) => n.tier === tier) ?? (tier === "DIAMANTE" ? NIVEIS[2] : NIVEIS[0]))!.bps - (pessoaFisica ? DESCONTO_CPF_BPS : 0);
}

export const nomeDoNivel = (tier: PartnerTier) => (NIVEIS.find((n) => n.tier === tier) ?? NIVEIS[2]!).nome;
