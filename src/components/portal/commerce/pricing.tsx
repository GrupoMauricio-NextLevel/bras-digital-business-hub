"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Gift, Sparkles } from "lucide-react";
import { formatBRL } from "@/lib/money";

export type PricingPlan = { key: string; slug: string; name: string; tagline: string | null; quote: boolean; monthlyCents: number | null; annualCents: number | null; feeBps: number | null; features: string[] };
export type PricingOffer = { trialDays: number; firstPeriodCents: number | null; feeHolidayMonths: number } | null;

/** Faixas do simulador (faturamento mensal em centavos). A última abre o Enterprise. */
const FAIXAS = [0, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000, 20_000_000, 50_000_000];
const rotulo = (c: number, i: number) => (c === 0 ? "Começando" : i === FAIXAS.length - 1 ? "R$ 500 mil+" : `R$ ${c / 100_000} mil`);
/** Para quem é cada plano (o texto do catálogo repete o preço, que já aparece no cartão). */
const PARA_QUEM: Record<string, string> = { COMMERCE_START: "Para quem está começando a vender online.", COMMERCE_PRO: "Para quem já vende todo mês e quer pagar menos taxa.", COMMERCE_SCALE: "Para operações com volume: a menor taxa sobre as vendas.", COMMERCE_ENTERPRISE: "Para operações grandes, com condições negociadas." };
const pct = (bps: number | null) => `${((bps ?? 0) / 100).toString().replace(".", ",")}%`;

/**
 * Planos da NextLevel E-commerce (D90, dados do catálogo Master). Mensal ou anual, e um simulador: para o faturamento
 * informado, soma mensalidade e taxa de plataforma e destaca o plano mais em conta. É estimativa, não promessa.
 */
export function CommercePricing({ plans, offer, signupOpen, cta, suffix = "", solucoes = "/solucoes" }: { plans: PricingPlan[]; offer: PricingOffer; signupOpen: boolean; cta: string; suffix?: string; solucoes?: string }) {
  const [cycle, setCycle] = React.useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [faixa, setFaixa] = React.useState(2);
  const venda = FAIXAS[faixa]!;
  const enterprise = faixa === FAIXAS.length - 1;
  const pagos = plans.filter((p) => !p.quote && p.monthlyCents && p.annualCents);
  const mensal = (p: PricingPlan) => (cycle === "ANNUAL" ? Math.round(p.annualCents! / 12) : p.monthlyCents!);
  const total = (p: PricingPlan) => mensal(p) + Math.round((venda * (p.feeBps ?? 0)) / 10_000);
  const melhor = enterprise ? null : pagos.reduce<PricingPlan | null>((b, p) => (!b || total(p) < total(b) ? p : b), null);
  const extra = suffix ? `&${suffix.slice(1)}` : "";
  const desconto = pagos[0] ? Math.round((1 - pagos[0].annualCents! / (pagos[0].monthlyCents! * 12)) * 100) : 0;

  return (
    <div className="cm-pricing">
      {offer ? (
        <p className="mx-auto mb-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full bg-[var(--ec-azul-suave)] text-[var(--ec-marinho)] px-5 py-3 text-center text-sm">
          <Gift className="size-4 text-link" aria-hidden />
          <b>Para começar:</b>
          <span>{offer.trialDays} dias grátis</span><span aria-hidden>·</span>
          {offer.firstPeriodCents !== null ? <><span>1º mês por {formatBRL(offer.firstPeriodCents)} no mensal</span><span aria-hidden>·</span></> : null}
          <span>taxa zero por {offer.feeHolidayMonths} meses</span>
        </p>
      ) : null}

      <div className="mx-auto mb-10 grid max-w-4xl gap-6 rounded-[1.75rem] border border-border bg-surface p-5 shadow-[var(--ds-shadow-sm)] sm:p-7 md:grid-cols-[auto_1fr] md:items-center">
        <div role="group" aria-label="Forma de pagamento" className="cm-seg mx-auto md:mx-0">
          <button type="button" aria-pressed={cycle === "MONTHLY"} onClick={() => setCycle("MONTHLY")}>Mensal</button>
          <button type="button" aria-pressed={cycle === "ANNUAL"} onClick={() => setCycle("ANNUAL")}>Anual <span className="cm-seg-badge">-{desconto}%</span></button>
        </div>
        <div>
          <label htmlFor="cm-faixa" className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-semibold text-foreground">
            <span>Quanto você vende por mês?</span>
            <output htmlFor="cm-faixa" className="font-[family-name:var(--nl-font-display)] text-xl font-extrabold tabular-nums text-link">{rotulo(venda, faixa)}</output>
          </label>
          <input id="cm-faixa" type="range" min={0} max={FAIXAS.length - 1} step={1} value={faixa} onChange={(e) => setFaixa(Number(e.target.value))} className="cm-range mt-3 w-full" aria-valuetext={rotulo(venda, faixa)} />
          <div aria-hidden className="mt-1 hidden justify-between text-[11px] text-muted-foreground sm:flex">{FAIXAS.map((c, i) => <span key={c}>{rotulo(c, i)}</span>)}</div>
        </div>
      </div>

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => {
          const destaque = p.quote ? enterprise : melhor?.key === p.key;
          return (
            <li key={p.key} className={`cm-plan relative flex flex-col rounded-[1.5rem] border p-6 transition ${destaque ? "cm-plan--on border-transparent" : "border-border bg-surface"}`}>
              {destaque ? <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow"><Sparkles className="size-3.5" aria-hidden />{p.quote ? "Para o seu tamanho" : "Melhor para o seu faturamento"}</span> : null}
              <h3 className="font-[family-name:var(--nl-font-display)] text-xl font-extrabold">{p.name.replace(/^Commerce /, "")}</h3>
              {PARA_QUEM[p.key] || (p.tagline && !/R\$/.test(p.tagline)) ? <p className={`mt-1 min-h-10 text-sm ${destaque ? "text-band-foreground/80" : "text-muted-foreground"}`}>{PARA_QUEM[p.key] ?? p.tagline}</p> : null}
              {p.quote ? (
                <>
                  <p className="mt-5 font-[family-name:var(--nl-font-display)] text-3xl font-extrabold">Sob consulta</p>
                  <p className={`mt-1 text-sm ${destaque ? "text-band-foreground/80" : "text-muted-foreground"}`}>Condições, taxa e implantação em proposta, para operações maiores.</p>
                </>
              ) : (
                <>
                  <p className="mt-5 flex items-baseline gap-1"><span className="font-[family-name:var(--nl-font-display)] text-4xl font-extrabold tabular-nums">{formatBRL(mensal(p))}</span><span className={`text-sm ${destaque ? "text-band-foreground/80" : "text-muted-foreground"}`}>/mês</span></p>
                  <p className={`text-sm ${destaque ? "text-band-foreground/80" : "text-muted-foreground"}`}>{cycle === "ANNUAL" ? <>{formatBRL(p.annualCents!)} por ano, pagamento único</> : <>ou {formatBRL(Math.round(p.annualCents! / 12))}/mês no anual</>}</p>
                  <p className={`mt-3 rounded-xl px-3 py-2 text-sm ${destaque ? "bg-white/10" : "bg-surface-muted"}`}>
                    + <b>{pct(p.feeBps)}</b> sobre as vendas pagas
                    <span className="mt-1 block text-xs opacity-80">{venda === 0 ? "Sem vendas ainda" : `Vendendo ${rotulo(venda, faixa)} por mês`}: <b className="tabular-nums">{formatBRL(total(p))}/mês</b> no total</span>
                  </p>
                </>
              )}
              <ul className="mt-5 space-y-2 text-sm">{p.features.slice(0, 5).map((f) => <li key={f} className="flex gap-2"><Check className={`mt-0.5 size-4 shrink-0 ${destaque ? "text-[var(--ec-link-escuro)]" : "text-success"}`} aria-hidden />{f}</li>)}</ul>
              <div className="mt-auto pt-6">
                {p.quote
                  ? <Link href={`${solucoes}/${p.slug}${suffix}`} className={`cm-plan-btn ${destaque ? "cm-plan-btn--on" : "cm-plan-btn--ghost"}`}>Pedir proposta <ArrowRight className="size-4" aria-hidden /></Link>
                  : <Link href={signupOpen ? `/cadastro?plano=${p.key}&ciclo=${cycle}${extra}` : `${cta}${suffix}`} className={`cm-plan-btn ${destaque ? "cm-plan-btn--on" : ""}`}>{signupOpen ? (offer ? "Começar grátis" : "Criar minha loja") : "Quero minha loja"} <ArrowRight className="size-4" aria-hidden /></Link>}
                <Link href={`${solucoes}/${p.slug}${suffix}`} className={`mt-3 block text-center text-sm font-semibold underline underline-offset-4 ${destaque ? "text-band-foreground" : "text-link"}`}>Ver tudo o que inclui</Link>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-center text-xs text-muted-foreground">Estimativa de custo da plataforma: mensalidade mais a taxa sobre o valor dos produtos dos pedidos pagos. Não inclui as tarifas do Mercado Pago. Você recebe 100% das vendas na sua conta Mercado Pago; a NextLevel cobra o plano e a taxa em fatura separada.</p>
    </div>
  );
}
