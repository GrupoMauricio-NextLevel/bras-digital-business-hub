import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import type { CatalogItem } from "@/lib/domain/nl-catalog";
import type { ProductState } from "@/lib/domain/journey";
import { STATE_LABEL } from "@/lib/domain/journey";
import { FAMILY_LABEL, KIND_LABEL, PHASE_LABEL, priceLines } from "@/lib/finance/catalog-labels";
import { Badge } from "@/components/ui/badge";
import { CheckoutDialog } from "./checkout-dialog";
import { checkoutPriceOf } from "./product-card";
import { ChoosePlan, RequestQuote } from "./plan-actions";
import { FamiliaFoto, temFamiliaFoto } from "./familia-foto";

/**
 * Landing canônica do produto (D90): dados do catálogo Master + conteúdo editorial. Usada no painel (com estado e
 * checkout) e no site público (`/solucoes/<slug>`, com CTA de cadastro/diagnóstico). Sem prova social inventada.
 */
export function ProductLanding({ product: p, mode, state, reason, base, demo, unlocks, related, signupHref, loginLinks, currentPlan }: {
  product: CatalogItem; mode: "panel" | "public"; state?: ProductState; reason?: string; base?: string; demo?: boolean;
  unlocks: { name: string; href: string }[]; related: { name: string; href: string; price: string }[]; signupHref?: string; currentPlan?: { productKey: string; cycle: string } | null;
  /** No site do grupo (D149) o cliente entra pelo endereço da marca dele: um botão por marca. */
  loginLinks?: { label: string; href: string }[];
}) {
  const lines = priceLines(p);
  const c = p.content;
  const price = checkoutPriceOf(p);
  const canBuy = mode === "panel" && (state === "available" || state === "recommended");
  const cta = (() => {
    if (p.kind === "quote_required") return <RequestQuote productKey={p.key} productName={p.name} needsContact={mode === "public"} />;
    if (mode === "public") return p.family === "COMMERCE_PLAN" ? <Link className="ds-btn" href={signupHref ?? "/cadastro"}>Começar com 3 dias grátis <ArrowRight className="size-4" aria-hidden /></Link> : loginLinks?.length ? <>{loginLinks.map((l, i) => <Link key={l.href} className={i ? "ds-btn ds-btn--secondary" : "ds-btn"} href={l.href}>{l.label} <ArrowRight className="size-4" aria-hidden /></Link>)}</> : <Link className="ds-btn" href={signupHref ?? "/login"}>Entrar para contratar <ArrowRight className="size-4" aria-hidden /></Link>;
    if (!canBuy) return null;
    if (p.family === "COMMERCE_PLAN") return <ChoosePlan productKey={p.key as never} current={currentPlan} />;
    if (price) return <CheckoutDialog productKey={p.key} productName={p.name} price={price} policy={c.policy} returnPath={`${base}/services/solucao/${p.slug}`} demo={!!demo} triggerLabel="Pagar agora" />;
    return null;
  })();
  const foto = temFamiliaFoto(p.family);
  return (
    <article className="mx-auto max-w-5xl">
      <header className={`rounded-2xl border border-border p-6 md:p-10 ${foto ? "grid items-center gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" : ""}`} style={{ background: "var(--ds-glass)" }}>
        <div>
        <div className="mb-3 flex flex-wrap items-center gap-2"><Badge tone="outline">{FAMILY_LABEL[p.family]}</Badge><span className="text-xs text-muted-foreground">Etapa da jornada: {PHASE_LABEL[p.phase]} · {KIND_LABEL[p.kind]}</span>{state ? <Badge tone={state === "locked" || state === "not_eligible" ? "neutral" : state === "completed" ? "success" : "info"}>{STATE_LABEL[state]}</Badge> : null}</div>
        <h1 className="font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight md:text-5xl">{p.name}</h1>
        <p className="mt-3 max-w-3xl text-lg text-muted-foreground">{p.tagline}</p>
        {reason ? <p className="mt-3 rounded-md bg-surface-muted p-3 text-sm" role="note">{reason}</p> : null}
        <div className="mt-6 flex flex-wrap items-center gap-3">{cta}{mode === "public" ? <Link href="/solucoes#diagnostico" className="ds-btn ds-btn--secondary">Diagnóstico gratuito</Link> : null}</div>
        </div>
        {foto ? <FamiliaFoto family={p.family} ratio="4 / 3" priority className="!rounded-xl" /> : null}
      </header>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <section aria-labelledby="pr"><h2 id="pr" className="text-xl font-bold">O problema</h2><p className="mt-2 text-muted-foreground">{c.problem}</p><h2 className="mt-6 text-xl font-bold">Resultado esperado</h2><p className="mt-2 text-muted-foreground">{c.outcome}</p><p className="mt-2 text-xs text-muted-foreground">Sem promessa de faturamento: resultado depende do produto, do preço e da operação.</p></section>
        <section aria-labelledby="pq"><h2 id="pq" className="text-xl font-bold">Para quem é</h2><ul className="mt-2 space-y-1 text-sm">{c.forWho.map((x) => <li key={x} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />{x}</li>)}</ul><h2 className="mt-6 text-xl font-bold">Para quem não é</h2><ul className="mt-2 space-y-1 text-sm">{c.notFor.map((x) => <li key={x} className="flex gap-2"><XCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />{x}</li>)}</ul></section>
      </div>

      <section className="mt-10 grid gap-8 md:grid-cols-2" aria-labelledby="esc">
        <div><h2 id="esc" className="text-xl font-bold">Escopo</h2><ul className="mt-2 space-y-1 text-sm">{c.scope.map((x) => <li key={x}>• {x}</li>)}</ul></div>
        <div><h2 className="text-xl font-bold">Entregáveis e prazo</h2><ul className="mt-2 space-y-1 text-sm">{c.deliverables.map((x) => <li key={x}>• {x}</li>)}</ul>{c.timeline ? <p className="mt-2 text-sm text-muted-foreground">{c.timeline}</p> : p.deliveryDays ? <p className="mt-2 text-sm text-muted-foreground">Prazo estimado: até {p.deliveryDays} dias úteis.</p> : null}{p.prerequisites.length ? <p className="mt-2 text-sm"><strong>Pré-requisitos:</strong> {reason && state === "locked" ? reason : "ver a jornada no painel."}</p> : null}</div>
      </section>

      {c.limits.length ? <section className="mt-10" aria-labelledby="lim"><h2 id="lim" className="text-xl font-bold">Limites e o que não está incluído</h2><ul className="mt-2 space-y-1 text-sm text-muted-foreground">{c.limits.map((x) => <li key={x}>• {x}</li>)}</ul></section> : null}

      <section className="mt-10 rounded-2xl border border-border p-6" aria-labelledby="preco">
        <h2 id="preco" className="text-xl font-bold">Preço e condições</h2>
        <p className="mt-2 text-3xl font-extrabold tabular-nums">{lines.main}</p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">{lines.details.map((d) => <li key={d}>{d}</li>)}</ul>
        {c.partnerPerk ? <p className="mt-2 text-sm">{c.partnerPerk}</p> : null}
        {c.policy ? <p className="mt-3 text-sm"><strong>Cancelamento e reembolso:</strong> {c.policy}</p> : null}
        <div className="mt-4 flex flex-wrap gap-3">{cta}</div>
      </section>

      {related.length ? <section className="mt-10" aria-labelledby="comp"><h2 id="comp" className="text-xl font-bold">Compare as opções</h2><ul className="mt-3 grid gap-3 sm:grid-cols-3">{related.map((r) => <li key={r.href} className="rounded-lg border border-border p-4"><Link href={r.href} className="font-semibold text-link underline">{r.name}</Link><p className="text-sm tabular-nums">{r.price}</p></li>)}</ul></section> : null}
      {unlocks.length ? <section className="mt-10" aria-labelledby="desb"><h2 id="desb" className="text-xl font-bold">O que esta solução prepara</h2><ul className="mt-2 flex flex-wrap gap-2">{unlocks.map((u) => <li key={u.href}><Link href={u.href} className="ds-pill ds-pill--outline">{u.name}</Link></li>)}</ul></section> : null}
      {c.faq.length ? <section className="mt-10" aria-labelledby="faq"><h2 id="faq" className="text-xl font-bold">Perguntas frequentes</h2><div className="mt-3 space-y-2">{c.faq.map((f) => <details key={f.q} className="rounded-lg border border-border p-4"><summary className="cursor-pointer font-semibold">{f.q}</summary><p className="mt-2 text-sm text-muted-foreground">{f.a}</p></details>)}</div></section> : null}
      <p className="mt-10 text-xs text-muted-foreground">Ainda não publicamos casos e números de clientes desta solução; quando houver, entram aqui com fonte verificável.</p>
    </article>
  );
}
