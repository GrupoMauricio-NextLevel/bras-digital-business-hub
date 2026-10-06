import Link from "next/link";
import { formatBRL } from "@/lib/money";
import { DEMO_STORES } from "./demo-stores";
import { Phone, Tablet } from "./device";
import { OrdersCards, OrdersPanel } from "./panel-ui";
import { RotatingWord } from "./rotating-word";
import { StoreMock } from "./store-mock";

const CTA = "inline-flex h-14 items-center justify-center rounded-full bg-primary px-8 text-base font-bold text-primary-foreground transition-colors hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-band-foreground";

/** Primeira dobra: campo de cor cheio, título enorme com palavra que alterna e um palco com dispositivos mostrando a loja e o painel. */
export function HeroV2({ cta, signupOpen }: { cta: string; signupOpen: boolean }) {
  const moda = DEMO_STORES[0]!;
  return (
    <section className="relative overflow-hidden bg-band text-band-foreground" aria-labelledby="titulo">
      <div aria-hidden className="cm-grid-bg pointer-events-none absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[38rem] rounded-full bg-[#2f5bea]/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-40 top-1/2 size-[30rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-32 sm:pt-40">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-highlight">Plataforma de lojas virtuais</p>
        <h1 id="titulo" className="mt-5 max-w-5xl font-[family-name:var(--nl-font-display)] text-[2.4rem] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-[5.4rem]">
          A loja virtual da sua marca. E um painel que cuida <RotatingWord words={["dos pedidos.", "dos pagamentos.", "dos clientes.", "das vendas."]} />
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-band-muted sm:text-xl">Vitrine com o seu estilo, Pix e cartão, pedidos e clientes no mesmo lugar. Você escolhe um tema, ajusta a loja no editor e só publica quando quiser.</p>
        <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link href={cta} className={`${CTA} w-full sm:w-auto`}>Quero minha loja</Link>
          <span aria-hidden className="hidden h-10 w-px bg-surface/25 sm:block" />
          <p className="max-w-xs text-sm text-band-foreground/75">{signupOpen ? "Crie a sua conta e comece a montar." : "Cadastro por convite no momento."} <a href="#exemplos" className="font-semibold text-band-foreground underline underline-offset-4">Ver lojas de exemplo</a></p>
        </div>
      </div>

      <div className="relative mx-auto mt-6 max-w-6xl px-3 sm:px-4">
        <div className="relative overflow-hidden rounded-t-[2rem] bg-band px-4 pb-0 pt-8 sm:rounded-t-[2.75rem] sm:px-10 sm:pt-12" style={{ minHeight: "28rem" }}>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(242,182,0,0.12),transparent_70%)]" />
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
