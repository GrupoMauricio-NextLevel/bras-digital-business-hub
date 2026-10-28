import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { INTEGRACOES_PUBLICAS, totalDeIntegracoes } from "@/lib/marcas/integracoes-publicas";

/**
 * Integrações nas páginas públicas da E-commerce (D192). Sem logos de terceiros e sem cartões repetidos: cada grupo é uma
 * linha editorial (o que resolve, à esquerda; os serviços, à direita). Dados de `integracoes-publicas.ts`.
 */
export function IntegracoesFaixa({ cta, comecar }: { cta: string; comecar: string }) {
  return (
    <section id="integracoes" aria-labelledby="integ-t" className="scroll-mt-16 px-4 py-16 text-white md:py-24" style={{ background: "var(--ec-marinho)" }}>
      <div className="mx-auto max-w-6xl">
        <p className="im-eyebrow" style={{ color: "var(--ec-link-escuro)" }}>Integrações</p>
        <h2 id="integ-t" className="im-h2 mt-3 max-w-3xl">Conecta com o que você <span style={{ color: "var(--ec-ciano)" }}>já usa</span>.</h2>
        <p className="mt-4 max-w-2xl text-lg" style={{ color: "var(--ec-texto-suave)" }}>{totalDeIntegracoes()} serviços prontos para ligar no painel, sem programar: você cola o código ou o token e a loja faz o resto.</p>
        <dl className="mt-10 border-t border-white/15">
          {INTEGRACOES_PUBLICAS.map((g) => (
            <div key={g.key} className="im-surge grid gap-3 border-b border-white/15 py-6 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-10">
              <dt>
                <span className="block font-[family-name:var(--nl-font-display)] text-2xl font-extrabold tracking-tight">{g.titulo}</span>
                <span className="mt-1 block text-[15px]" style={{ color: "var(--ec-texto-suave)" }}>{g.frase}</span>
              </dt>
              <dd className="flex flex-wrap content-start gap-x-2 gap-y-2.5 md:pt-1">
                {g.itens.map((i) => <span key={i.nome} className="rounded-full border border-white/25 px-3.5 py-1.5 text-[15px] font-semibold">{i.nome}</span>)}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href={cta} className="inline-flex h-12 items-center rounded-full px-6 font-semibold" style={{ background: "var(--ec-acao)", color: "#fff" }}>{comecar}</Link>
          <Link href="/integracoes" className="inline-flex items-center gap-2 font-semibold underline underline-offset-4" style={{ color: "var(--ec-link-escuro)" }}>Como cada uma funciona <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
      </div>
    </section>
  );
}

/** Lista completa da página /integracoes: o que cada serviço faz e o que o lojista precisa para ligar. */
export function IntegracoesCompleto() {
  return (
    <div className="space-y-14">
      {INTEGRACOES_PUBLICAS.map((g) => (
        <section key={g.key} id={g.key} aria-labelledby={`g-${g.key}`} className="scroll-mt-24 grid gap-6 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] md:gap-12">
          <div>
            <h2 id={`g-${g.key}`} className="font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight text-foreground">{g.titulo}</h2>
            <p className="mt-2 text-body">{g.frase}</p>
            <p className="mt-3 text-sm text-muted-foreground"><b className="font-semibold text-foreground">Para ligar:</b> {g.como}</p>
          </div>
          <ul className="divide-y divide-border border-y border-border">
            {g.itens.map((i) => (
              <li key={i.nome} className="flex flex-col gap-0.5 py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <span className="font-semibold text-foreground">{i.nome}</span>
                <span className="text-body sm:text-right">{i.detalhe}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
