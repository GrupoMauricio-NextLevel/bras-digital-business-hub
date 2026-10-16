import Link from "next/link";
import { formatBRL } from "@/lib/money";
import { DEMO_STORES } from "./demo-stores";
import { Phone, Tablet } from "./device";
import { OrdersCards, OrdersPanel } from "./panel-ui";
import { StoreMock } from "./store-mock";
import { CabecalhoSobreHeroi } from "@/components/portal/superdrop/cabecalho-sobre-heroi";

// Azul cheio com texto branco em 19 px negrito: texto grande, contraste 3,8:1 (AA para texto grande).
const CTA = "inline-flex h-14 items-center justify-center rounded-full bg-[#2F81F4] px-8 text-[1.1875rem] font-bold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/** Marinho retirado da faixa da foto principal do pacote (hero-key-visual): foto e fundo se emendam sem costura. */
const NAVY = "#0B1A36";
const AZUL_CLARO = "#71AAFF";

/**
 * Primeira dobra (Commerce v3, docs/prompts/commerce-home-v3-analise-e-prompt.md): a foto do pacote é o fundo e o texto fica
 * sobre a faixa marinho dela; abaixo, o palco com a loja e o painel de demonstração. Sem amarelo, sem grade e sem manchas de luz.
 * Os números da oferta vêm de `offer` (nunca fixos); "grátis" só junto do prazo do teste.
 */
export function HeroV2({ cta, signupOpen, offer }: { cta: string; signupOpen: boolean; offer?: { trialDays: number; firstPeriodCents: number | null } | null }) {
  const moda = DEMO_STORES[0]!;
  const b = "/marcas/nextlevel-commerce/imagens/hero-key-visual";
  return (
    <section id="inicio" data-heroi-escuro="commerce" className="relative isolate overflow-hidden text-white" style={{ background: NAVY }} aria-labelledby="titulo">
      <CabecalhoSobreHeroi alvo="inicio" />
      <div className="relative aspect-[16/10] w-full md:absolute md:inset-x-0 md:top-0 md:aspect-auto md:h-[44rem]">
        {/* eslint-disable-next-line @next/next/no-img-element -- WebP estático com srcset próprio */}
        <img src={`${b}-1600.webp`} srcSet={`${b}-800.webp 800w, ${b}-1600.webp 1600w`} sizes="100vw" alt="Equipe de uma marca própria arrumando a vitrine e embalando pedidos" width={1600} height={900} loading="eager" fetchPriority="high" decoding="sync" className="size-full object-cover" style={{ objectPosition: "70% 40%" }} />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#0B1A36] via-transparent to-transparent md:bg-[linear-gradient(90deg,#0B1A36_0%,rgba(11,26,54,0.85)_40%,transparent_72%)]" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 hidden h-48 bg-gradient-to-t from-[#0B1A36] to-transparent md:block" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-2 md:pb-8 md:pt-32 lg:pt-36">
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em]" style={{ color: AZUL_CLARO }}>Plataforma de lojas virtuais</p>
          <h1 id="titulo" className="mt-4 font-[family-name:var(--nl-font-display)] text-[2.4rem] font-extrabold leading-[1.04] tracking-[-0.035em] sm:text-6xl lg:text-[4.6rem]">
            A loja da sua marca, <span style={{ color: AZUL_CLARO }}>pronta para vender.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85">Escolha um tema, ajuste no editor e receba por Pix e cartão direto na sua conta. Pedidos da loja, do WhatsApp e do Instagram no mesmo painel.</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href={cta} className={CTA}>{signupOpen ? (offer ? `Começar ${offer.trialDays} dias grátis` : "Criar minha loja") : "Quero minha loja"}</Link>
            <a href="#exemplos" className="inline-flex h-14 items-center gap-2 px-1 font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Ver lojas de exemplo ↓</a>
          </div>
          <p className="mt-5 text-sm text-white/70">
            {signupOpen ? (offer ? <>{offer.firstPeriodCents !== null ? <>Depois, 1º mês por {formatBRL(offer.firstPeriodCents)} · </> : null}o dinheiro das vendas cai na sua conta · cancele quando quiser</> : "Crie a sua conta e comece a montar.") : "Cadastro por convite no momento."}
          </p>
        </div>
      </div>

      <div className="relative mx-auto mt-6 max-w-6xl px-3 sm:px-4">
        <div className="relative overflow-hidden rounded-t-[2rem] px-4 pb-0 pt-8 sm:rounded-t-[2.75rem] sm:px-10 sm:pt-12" style={{ minHeight: "28rem" }}>
          <div className="relative -mb-24 grid items-end gap-6 md:-mb-32 md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.75fr)]">
            <div className="hidden md:block"><Tablet className="cm-drift translate-y-0"><OrdersPanel /></Tablet></div>
            <div className="md:hidden"><OrdersCards /></div>
            <div className="mx-auto w-[16.5rem] sm:w-[17.5rem] md:mx-0 md:justify-self-end">
              <div className="cm-drift-fast"><Phone><div className="max-h-[27rem] overflow-hidden"><StoreMock store={moda} eager /></div></Phone></div>
            </div>
          </div>
          <p className="cm-pop absolute right-4 top-4 hidden max-w-[16rem] items-start gap-3 rounded-2xl bg-surface px-4 py-3 text-sm text-foreground shadow-xl md:flex" style={{ animationDelay: "0.4s" }}>
            <span aria-hidden className="cm-live-dot mt-1.5 size-2.5 shrink-0 rounded-full bg-emerald-600" />
            <span><b>Pedido #1042 pago por Pix</b><br /><span className="text-muted-foreground">{formatBRL(18990)} · pronto para envio</span></span>
          </p>
          <p className="absolute bottom-3 left-4 z-10 rounded-full bg-black/75 px-3 py-1 text-[11px] text-band-foreground/90 sm:left-10">Loja e painel de demonstração, com nomes, produtos e preços fictícios.</p>
        </div>
      </div>
    </section>
  );
}
