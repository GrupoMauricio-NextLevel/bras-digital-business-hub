import Link from "next/link";
import { getDb } from "@/db/client";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { groupLink } from "@/lib/brand-server";
import { anualBlackCents, blackAgora } from "@/lib/domain/campanha-black";
import { PRECOS_D228 } from "@/lib/finance/revisao-d228";
import { CommercePricing } from "./pricing";
import { beneficiosPorPlano } from "@/lib/domain/beneficios-plano";

/**
 * Planos NextLevel E-commerce vindos do catálogo Master (D90), com a oferta de entrada, mensal/anual e o simulador por
 * faturamento. `cta` leva ao cadastro (ou à lista de espera quando o cadastro está fechado), preservando a atribuição.
 */
export async function CommercePlansSection({ cta, signupOpen, suffix = "" }: { cta: string; signupOpen: boolean; suffix?: string }) {
  const db = await getDb();
  const [v, b, ben] = await Promise.all([commercePlansView(db), blackAgora(db), beneficiosPorPlano(db)]);
  // Black NextLevel (D229): o anual mostrado já é o que se paga na Black (2 meses grátis) e o "de" é o preço depois dela.
  const black = b.ativa ? { fim: b.fim, restanteMs: b.restanteMs, depois: PRECOS_D228 } : null;
  const solucoes = await groupLink("/solucoes"); // páginas da agência: direto no site do grupo (D149)
  return (
    <div>
      <CommercePricing black={black} beneficios={ben} plans={v.plans.map((p) => ({ key: p.key, slug: p.slug, name: p.name, tagline: p.tagline, quote: p.quote, monthlyCents: p.monthlyCents, annualCents: black && p.annualCents ? anualBlackCents(p.annualCents) : p.annualCents, feeBps: p.feeBps, features: p.features }))} offer={v.offer ? { trialDays: v.offer.trialDays, firstPeriodCents: v.offer.firstPeriodCents ?? null, feeHolidayMonths: v.offer.feeHolidayMonths } : null} signupOpen={signupOpen} cta={cta} suffix={suffix} solucoes={solucoes} />
      <p className="mt-4 text-center text-sm">Prefere ajuda para começar? <Link className="font-semibold text-link underline" href={`${solucoes}/loja-pronta-essencial${suffix}`}>Loja Pronta</Link>, <Link className="font-semibold text-link underline" href={`${solucoes}/migracao-lite${suffix}`}>Migração</Link> ou <Link className="font-semibold text-link underline" href={`${solucoes}${suffix}#diagnostico`}>diagnóstico gratuito</Link>.</p>
    </div>
  );
}
