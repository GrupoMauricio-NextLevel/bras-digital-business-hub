import type { Database } from "@/db/client";
import { asc, eq } from "drizzle-orm";
import { bonusCampanhas } from "@/db/schema";
import { TETO_POR_PONTO_BPS } from "@/lib/finance/bonus-regras";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { beneficiosPorPlano, NOME_PLANO_BENEFICIO, PLANOS_BENEFICIO } from "@/lib/domain/beneficios-plano";
import { getPartnerSettings } from "@/lib/domain/partners";
import { campanhaBlack, MESES_GRATIS_ANUAL_BLACK } from "@/lib/domain/campanha-black";
import { LIMITES_ATACADO } from "@/lib/domain/atacado";
import { PRECOS_D228 } from "@/lib/finance/revisao-d228";
import { DESCONTO_CPF_BPS, MESES_PARA_DESCER, NIVEIS } from "@/lib/finance/niveis-regras";
import { BARREIRAS, CONSULTA_CONCORRENTES, PROGRAMAS_CONCORRENTES, SHOPIFY_BR_USD } from "@/lib/finance/captacao-regras";
import { taxasNoMercadoPago } from "@/lib/marcas/comparativo-ecommerce";
import { MESES_SEM_CLIENTE } from "@/lib/domain/niveis-parceiro";
import { findRule } from "@/lib/domain/corporate-commissions";

/**
 * Fatos ao vivo da base de conhecimento (BC1, D266). Todo número que aparece numa aula sai daqui, e daqui só sai o que o
 * sistema usa de verdade para cobrar e pagar (catálogo de preços, benefícios por plano, regras de parceiros, limites do
 * atacado, campanha). Mudou a regra no sistema, a aula muda junto.
 */
export type PlanoFato = { key: string; nome: string; mensalCents: number; anualMesCents: number; depoisDaBlackMensalCents: number | null; depoisDaBlackAnualMesCents: number | null; produtos: number | null; pessoas: number; temaPago: boolean; suporte: string; migracao: string; ia: number; atacado: (typeof LIMITES_ATACADO)[keyof typeof LIMITES_ATACADO] };
export type Fatos = {
  planos: PlanoFato[];
  diasDeTeste: number;
  black: { ativa: boolean; fim: string; mesesGratisAnual: number };
  parceiros: { niveis: { nome: string; minimo: number; cnpjBps: number; cpfBps: number }[]; mesesParaDescer: number; saqueMinimoCents: number; atribuicaoDias: number; garantiaDias: number; inativoMeses: number };
  /** Bônus gamificado (D271): campanhas ativas e o teto de custo por loja de cada público (bps de uma mensalidade). */
  bonus: { campanhas: { nome: string; publico: "ONLINE" | "RUA"; periodo: "SEMANA" | "MES"; faixas: { pontos: number; valorCents: number }[] }[]; tetoBps: { ONLINE: number; RUA: number } };
  concorrentes: { consulta: string; programas: { nome: string; regra: string; barreira: string }[]; barreiras: { nome: string; barreira: string }[]; shopifyUsd: number; taxas: { nome: string; maxBps: number }[] };
};

export async function fatosAoVivo(db: Database): Promise<Fatos> {
  const { garantirCampanhasPadrao } = await import("@/lib/domain/bonus");
  await garantirCampanhasPadrao(db);
  const campanhas = await db.select().from(bonusCampanhas).where(eq(bonusCampanhas.ativa, true)).orderBy(asc(bonusCampanhas.publico), asc(bonusCampanhas.periodo));
  const [pv, beneficios, ajustes, black, regra] = await Promise.all([commercePlansView(db), beneficiosPorPlano(db), getPartnerSettings(db), campanhaBlack(db), findRule(db, { family: "COMMERCE_PLAN", productKey: "COMMERCE_PRO", cycle: "MONTHLY", partnerKind: "AFFILIATE" })]);
  const planos: PlanoFato[] = PLANOS_BENEFICIO.map((key) => {
    const p = pv.plans.find((x) => x.key === key);
    const b = beneficios[key];
    const depois = PRECOS_D228[key];
    return {
      key, nome: NOME_PLANO_BENEFICIO[key], mensalCents: p?.monthlyCents ?? 0, anualMesCents: p?.annualCents ? Math.round(p.annualCents / 12) : 0,
      depoisDaBlackMensalCents: depois?.mensal ?? null, depoisDaBlackAnualMesCents: depois ? Math.round(depois.anual / 12) : null,
      produtos: b.produtos, pessoas: b.pessoas, temaPago: b.temaPago, suporte: b.suporte, migracao: b.migracao, ia: b.ia, atacado: LIMITES_ATACADO[key],
    };
  });
  const agora = Date.now();
  return {
    planos,
    diasDeTeste: pv.offer?.trialDays ?? 0,
    black: { ativa: black.ativa && Date.parse(black.fim) > agora, fim: black.fim, mesesGratisAnual: MESES_GRATIS_ANUAL_BLACK },
    parceiros: {
      niveis: NIVEIS.map((n) => ({ nome: n.nome, minimo: n.minimo, cnpjBps: n.bps, cpfBps: n.bps - DESCONTO_CPF_BPS })),
      mesesParaDescer: MESES_PARA_DESCER, saqueMinimoCents: ajustes.minPayoutCents, atribuicaoDias: ajustes.attributionDays, garantiaDias: regra?.holdDays ?? 0, inativoMeses: MESES_SEM_CLIENTE,
    },
    bonus: { campanhas: campanhas.map((c) => ({ nome: c.nome, publico: c.publico, periodo: c.periodo, faixas: c.faixas })), tetoBps: TETO_POR_PONTO_BPS },
    concorrentes: {
      consulta: CONSULTA_CONCORRENTES, shopifyUsd: SHOPIFY_BR_USD,
      programas: PROGRAMAS_CONCORRENTES.map((p) => ({ nome: p.nome, regra: p.regra, barreira: p.barreira })),
      barreiras: BARREIRAS.map((b) => ({ nome: b.nome, barreira: b.barreira })),
      taxas: taxasNoMercadoPago().map((t) => ({ nome: t.nome, maxBps: t.maxBps })),
    },
  };
}
