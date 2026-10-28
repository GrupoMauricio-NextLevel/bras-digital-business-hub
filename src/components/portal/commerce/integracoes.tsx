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

/** Maurício na home (IA0, D194): o que a IA faz, com rótulo honesto de Beta e plano. Exemplo gravado, sem chamada à IA. */
export function MauricioFaixa({ cta }: { cta: string }) {
  const itens = [
    { t: "Escreve", d: "Descrição do produto, título para o Google, tradução e resposta ao cliente." },
    { t: "Analisa", d: "\"Quanto vendi esta semana?\" respondido com os números da sua loja." },
    { t: "Prepara", d: "Cadastro por conversa e preço em massa: você confere e confirma." },
  ];
  return (
    <section id="mauricio" aria-labelledby="mau-t" className="scroll-mt-16 bg-surface px-4 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
        <div>
          <p className="im-eyebrow im-eyebrow--claro">Inteligência artificial · Beta</p>
          <h2 id="mau-t" className="im-h2 mt-3 text-foreground">Conta com o <span style={{ color: "var(--ec-acao)" }}>Maurício</span>.</h2>
          <p className="mt-4 text-lg text-body">Você pede, o Maurício prepara e você confere antes de qualquer mudança. Ferramentas de texto no plano Pro; o Maurício completo no Scale.</p>
          <ul className="mt-6 space-y-3">{itens.map((i) => <li key={i.t} className="flex gap-3"><b className="w-20 shrink-0 text-foreground">{i.t}</b><span className="text-body">{i.d}</span></li>)}</ul>
          <Link href={cta} className="mt-8 inline-flex h-12 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground">Pede pro Maurício na sua loja</Link>
        </div>
        <div className="rounded-[28px] border border-border bg-canvas p-5 shadow-[0_20px_60px_rgb(0_0_0/0.08)]" aria-label="Exemplo de conversa com o Maurício">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Exemplo</p>
          <p className="ml-10 mt-3 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-foreground" style={{ background: "color-mix(in srgb, var(--ec-acao) 12%, transparent)" }}>Escreve a descrição do vestido midi floral de viscose, com alça regulável.</p>
          <p className="mt-3 rounded-2xl rounded-tl-sm bg-surface px-4 py-3 text-sm text-body">Leve e fresco para o dia a dia: vestido midi em viscose com estampa floral e alças reguláveis que se ajustam ao seu corpo. Combina com tênis ou sandália.</p>
          <div className="mt-4 flex items-center gap-2 rounded-full border-[1.5px] px-4 py-2.5 text-sm text-muted-foreground" style={{ borderColor: "color-mix(in srgb, var(--ec-acao) 45%, transparent)" }}>Peça ao Maurício…</div>
        </div>
      </div>
    </section>
  );
}
