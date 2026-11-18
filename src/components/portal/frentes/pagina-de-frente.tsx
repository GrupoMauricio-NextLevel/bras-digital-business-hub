import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { CabecalhoTech } from "@/components/portal/commerce/cabecalho-tech";
import { BlocoEquipe } from "@/components/portal/equipe/blocos";
import type { Frente } from "@/lib/marcas/frentes";
import { TambemDaNextLevel } from "./tambem-da-nextlevel";

export type Cta = { rotulo: string; href: string };

/**
 * Molde das páginas de frente (ecossistema tudo em um, D336): o mesmo visual da NextLevel Commerce, com a copy da frente.
 * Peças reaproveitadas: `CabecalhoTech` (D223), cartões `ec-cartao`, `BlocoEquipe` e a ponte "Também da NextLevel".
 * Preço entra pelo `planos` (a página lê da tabela do Master); nada de valor escrito aqui.
 */
export function PaginaDeFrente({ frente, dados, cta, ctaSecundario, planos, solucoesHref }: {
  frente: Frente; dados?: { rotulo: string; valor: string }[]; cta: Cta; ctaSecundario?: Cta; planos?: React.ReactNode; solucoesHref: string;
}) {
  const h = frente.heroi;
  return (
    <>
      <CabecalhoTech rotulo={h.rotulo} titulo={<>{h.antes} <em>{h.destaque}</em>{h.depois ? <> {h.depois}</> : null}</>} texto={h.texto} dados={dados}>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href={cta.href} className="ds-pub-btn gap-2">{cta.rotulo}<ArrowRight className="size-4" aria-hidden /></Link>
          {ctaSecundario ? <Link href={ctaSecundario.href} className="inline-flex min-h-[48px] items-center rounded-full border border-white/30 px-5 font-semibold text-white hover:bg-white/10">{ctaSecundario.rotulo}</Link> : null}
        </div>
      </CabecalhoTech>

      {frente.beneficios.length ? (
        <section aria-labelledby="vem-t" className="px-4 py-14 md:py-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--ds-link)]">{frente.nome}</p>
            <h2 id="vem-t" className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">O que vem</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {frente.beneficios.map(([t, d]) => <li key={t} className="ec-cartao !p-5"><Check className="size-5 text-[var(--ds-link)]" aria-hidden /><b className="mt-3 block">{t}</b><span className="mt-1 block text-sm text-body">{d}</span></li>)}
            </ul>
          </div>
        </section>
      ) : null}

      {frente.passos.length ? (
        <section aria-labelledby="passos-t" className="bg-surface px-4 py-14 md:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 id="passos-t" className="text-3xl font-semibold tracking-tight">Como funciona</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {frente.passos.map(([t, d], i) => (
                <li key={t} className="ec-cartao !p-6">
                  <span className="ec-mono text-sm text-[var(--ds-link)]">{String(i + 1).padStart(2, "0")}</span>
                  <b className="mt-2 block text-lg">{t}</b><span className="mt-1 block text-sm text-body">{d}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {frente.quadro.length ? (
        <section aria-labelledby="quadro-t" className="px-4 py-14 md:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 id="quadro-t" className="text-3xl font-semibold tracking-tight">O que muda no dia a dia</h2>
            <p className="mt-3 max-w-2xl text-body">Peças soltas contra um painel só.</p>
            <div className="mt-8 overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Sem a {frente.nome} e com a {frente.nome}</caption>
                <thead className="bg-surface-muted text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th scope="col" className="px-4 py-3">No dia a dia</th><th scope="col" className="px-4 py-3">Com peças soltas</th><th scope="col" className="px-4 py-3">Com a {frente.nome}</th></tr>
                </thead>
                <tbody>
                  {frente.quadro.map((l) => (
                    <tr key={l.tema} className="border-t border-border align-top">
                      <th scope="row" className="px-4 py-3 font-semibold">{l.tema}</th>
                      <td className="px-4 py-3 text-muted-foreground"><span className="flex gap-2"><Minus className="mt-0.5 size-4 shrink-0" aria-hidden />{l.sem}</span></td>
                      <td className="px-4 py-3"><span className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />{l.com}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {planos}

      <BlocoEquipe lugar="quero-minha-loja" className="bg-surface" />

      {frente.faq.length ? (
        <section aria-labelledby="faq-t" className="px-4 py-14 md:py-20">
          <div className="mx-auto max-w-3xl">
            <h2 id="faq-t" className="text-3xl font-semibold tracking-tight">Dúvidas</h2>
            <div className="mt-6 divide-y divide-border rounded-2xl border border-border">
              {frente.faq.map((f) => (
                <details key={f.q} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none font-semibold marker:hidden">{f.q}</summary>
                  <p className="mt-2 text-sm text-body">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <TambemDaNextLevel atual={frente.chave} solucoesHref={solucoesHref} />
    </>
  );
}
