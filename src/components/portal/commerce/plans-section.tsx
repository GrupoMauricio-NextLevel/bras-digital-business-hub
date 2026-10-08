import Link from "next/link";
import { Check } from "lucide-react";
import { getDb } from "@/db/client";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { formatBRL } from "@/lib/money";

/**
 * Planos NextLevel Commerce vindos do catálogo Master (D90), com a oferta de entrada e os termos por extenso.
 * `cta` leva ao cadastro (ou à lista de espera quando o cadastro está fechado), preservando a atribuição na URL.
 */
export async function CommercePlansSection({ cta, signupOpen, suffix = "" }: { cta: string; signupOpen: boolean; suffix?: string }) {
  const v = await commercePlansView(await getDb());
  const pct = (bps: number | null) => `${((bps ?? 0) / 100).toString().replace(".", ",")}%`;
  return (
    <div>
      {v.offer ? (
        <p className="mb-6 rounded-xl border border-border bg-surface p-4 text-sm">
          <strong>Para começar:</strong> {v.offer.trialDays} dias grátis, primeiro mês por {formatBRL(v.offer.firstPeriodCents ?? 0)} no plano mensal e taxa de plataforma zero nos primeiros {v.offer.feeHolidayMonths} meses. Vale para clientes novos, uma vez por CPF/CNPJ. Depois, vale o preço e a taxa do plano escolhido.
        </p>
      ) : null}
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {v.plans.map((p) => (
          <li key={p.key} className="flex flex-col rounded-2xl border border-border bg-surface p-5">
            <h3 className="text-lg font-bold">{p.name}</h3>
            {p.quote ? (
              <><p className="mt-2 text-2xl font-extrabold">Sob consulta</p><p className="text-sm text-muted-foreground">Condições, taxa e implantação negociadas em proposta.</p></>
            ) : (
              <>
                <p className="mt-2 text-3xl font-extrabold tabular-nums">{formatBRL(p.monthlyCents ?? 0)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <p className="text-sm">ou <strong className="tabular-nums">{formatBRL(p.annualCents ?? 0)}</strong> no anual à vista (25% de desconto, pagamento único)</p>
                <p className="mt-1 text-sm text-muted-foreground">Taxa de plataforma de {pct(p.feeBps)} sobre o valor dos produtos dos pedidos pagos, depois da carência.</p>
              </>
            )}
            <ul className="mt-4 space-y-1 text-sm">{p.features.slice(0, 5).map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />{f}</li>)}</ul>
            <div className="mt-auto pt-5">
              {p.quote ? <Link href={`/solucoes/${p.slug}${suffix}`} className="ds-pub-btn ds-pub-btn--ghost w-full justify-center">Pedir proposta</Link> : <Link href={signupOpen ? `/cadastro?plano=${p.key}${suffix ? `&${suffix.slice(1)}` : ""}` : `${cta}${suffix}`} className="ds-pub-btn w-full justify-center">{signupOpen ? "Começar grátis" : "Quero minha loja"}</Link>}
              <Link href={`/solucoes/${p.slug}${suffix}`} className="mt-2 block text-center text-sm font-semibold text-link underline">Ver detalhes do plano</Link>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">Você recebe 100% das suas vendas na sua conta Mercado Pago. A NextLevel cobra o plano e a taxa em fatura separada. Recuperação de carrinho, marketplace, ERP e API ainda não fazem parte da plataforma; quando entrarem, aparecem aqui.</p>
      <p className="mt-2 text-sm">Precisa de ajuda para começar? <Link className="font-semibold text-link underline" href={`/solucoes/loja-pronta-essencial${suffix}`}>Loja Pronta</Link>, <Link className="font-semibold text-link underline" href={`/solucoes/migracao-lite${suffix}`}>Migração</Link> ou <Link className="font-semibold text-link underline" href={`/solucoes${suffix}#diagnostico`}>diagnóstico gratuito</Link>.</p>
    </div>
  );
}
