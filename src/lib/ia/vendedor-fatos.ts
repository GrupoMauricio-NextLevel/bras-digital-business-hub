import type { Database } from "@/db/client";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { isReleased, THEME_CATALOG } from "@/lib/themes/catalog";
import { INTEGRACOES_PUBLICAS } from "@/lib/marcas/integracoes-publicas";
import type { FatosVenda } from "./vendedor-publico";

/** Fatos reais que o vendedor da home pode usar (planos e oferta do Master, integrações e temas do código). */
export async function fatosDoVendedor(db: Database, cadastro = "/cadastro"): Promise<FatosVenda> {
  const pv = await commercePlansView(db);
  return {
    marca: "NextLevel E-commerce", cadastro,
    planos: pv.plans.map((p) => ({ key: p.key, name: p.name, monthlyCents: p.monthlyCents, feeBps: p.feeBps, quote: p.quote })),
    oferta: pv.offer ? { trialDays: pv.offer.trialDays, firstPeriodCents: pv.offer.firstPeriodCents ?? null, feeHolidayMonths: pv.offer.feeHolidayMonths } : null,
    integracoes: INTEGRACOES_PUBLICAS.map((g) => ({ grupo: g.key, nomes: g.itens.map((i) => i.nome) })),
    temasGratis: THEME_CATALOG.filter(isReleased).filter((t) => t.priceCents === 0).length,
  };
}
