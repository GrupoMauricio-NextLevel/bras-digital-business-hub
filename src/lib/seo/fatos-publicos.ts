import type { Database } from "@/db/client";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { beneficiosPorPlano, NOME_PLANO_BENEFICIO, PLANOS_BENEFICIO } from "@/lib/domain/beneficios-plano";
import { LIMITES_ATACADO } from "@/lib/domain/atacado";
import type { FatosFaq } from "./faq-commerce";

/**
 * Fatos públicos da NextLevel Commerce lidos do sistema (D293, D302): planos e oferta do Master, benefícios por plano e
 * limites do atacado. Uma fonte só para as perguntas frequentes, o `llms.txt` e as versões em texto das páginas.
 */
export type FatosPublicos = FatosFaq & { planosAnuais: { nome: string; anualCents: number | null }[] };

export async function fatosPublicos(db: Database): Promise<FatosPublicos> {
  const [pv, beneficios] = await Promise.all([commercePlansView(db), beneficiosPorPlano(db)]);
  const planos = PLANOS_BENEFICIO.map((key) => {
    const p = pv.plans.find((x) => x.key === key);
    const b = beneficios[key];
    return { nome: NOME_PLANO_BENEFICIO[key], mensalCents: p?.monthlyCents ?? null, taxaBps: p?.feeBps ?? null, suporte: b.suporte, migracao: b.migracao, faixasAtacado: LIMITES_ATACADO[key].faixas, produtos: b.produtos, anualCents: p?.annualCents ?? null };
  });
  return {
    diasDeTeste: pv.offer?.trialDays ?? null,
    planos: planos.map((p) => ({ nome: p.nome, mensalCents: p.mensalCents, taxaBps: p.taxaBps, suporte: p.suporte, migracao: p.migracao, faixasAtacado: p.faixasAtacado, produtos: p.produtos })),
    planosAnuais: planos.map((p) => ({ nome: p.nome, anualCents: p.anualCents })),
  };
}
