import Link from "next/link";
import { getDb } from "@/db/client";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { CommercePricing } from "./pricing";

/**
 * Planos NextLevel Commerce vindos do catálogo Master (D90), com a oferta de entrada, mensal/anual e o simulador por
 * faturamento. `cta` leva ao cadastro (ou à lista de espera quando o cadastro está fechado), preservando a atribuição.
 */
export async function CommercePlansSection({ cta, signupOpen, suffix = "" }: { cta: string; signupOpen: boolean; suffix?: string }) {
  const v = await commercePlansView(await getDb());
  return (
    <div>
      <CommercePricing plans={v.plans.map((p) => ({ key: p.key, slug: p.slug, name: p.name, tagline: p.tagline, quote: p.quote, monthlyCents: p.monthlyCents, annualCents: p.annualCents, feeBps: p.feeBps, features: p.features }))} offer={v.offer ? { trialDays: v.offer.trialDays, firstPeriodCents: v.offer.firstPeriodCents ?? null, feeHolidayMonths: v.offer.feeHolidayMonths } : null} signupOpen={signupOpen} cta={cta} suffix={suffix} />
      <p className="mt-4 text-center text-sm">Prefere ajuda para começar? <Link className="font-semibold text-link underline" href={`/solucoes/loja-pronta-essencial${suffix}`}>Loja Pronta</Link>, <Link className="font-semibold text-link underline" href={`/solucoes/migracao-lite${suffix}`}>Migração</Link> ou <Link className="font-semibold text-link underline" href={`/solucoes${suffix}#diagnostico`}>diagnóstico gratuito</Link>.</p>
    </div>
  );
}
