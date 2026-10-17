import Link from "next/link";
import { ImagemEmCriacao } from "@/components/portal/imagem-em-criacao";
import "./commerce/commerce.css";
import type { Brand } from "@/lib/brand";
import { JsonLd } from "@/components/portal/json-ld";
import { isReleased, THEME_CATALOG } from "@/lib/themes/catalog";
import { Bento } from "@/components/portal/commerce/bento";
import { HeroV2 } from "@/components/portal/commerce/hero-v2";
import { Marquee } from "@/components/portal/commerce/marquee";
import { Personalize } from "@/components/portal/commerce/personalize";
import { ClosingCta, Faq, ForWhom, H2, Operation, Steps } from "@/components/portal/commerce/sections";
import { ThemeGallery } from "@/components/portal/commerce/theme-gallery";
import { CommercePlansSection } from "@/components/portal/commerce/plans-section";
import { getDb } from "@/db/client";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { FAMILY_INFO, LEVEL_INFO } from "@/lib/themes/levels";
import { MockWindow } from "@/components/portal/mock-window";

/**
 * Home da NextLevel E-commerce (v2, cadastro aberto): prova (lojas de exemplo), como começar sozinho, para quem é, o que a
 * plataforma faz, temas com imagem real, planos com simulador e dúvidas. Só anuncia o que existe.
 * Decisões: docs/design/HOME-COMMERCE-V1.md e D97.
 */
/** Lojas de demonstração fotografadas do próprio sistema (mesmas capturas da home SuperDrop v4). */
const LOJAS = [
  { arquivo: "loja-1", nome: "Trama Urbana", segmento: "moda", tema: "atelier", temaNome: "Atelier" },
  { arquivo: "loja-2", nome: "Linha de Jogo", segmento: "esporte", tema: "podio", temaNome: "Pódio" },
  { arquivo: "loja-3", nome: "Casa em Ordem", segmento: "casa", tema: "varanda", temaNome: "Varanda" },
] as const;

export async function CommerceHome({ brand }: { brand: Brand }) {
  const cta = brand.signupOpen ? "/cadastro" : "/quero-minha-loja";
  const pv = await commercePlansView(await getDb());
  const offer = pv.offer ? { trialDays: pv.offer.trialDays, firstPeriodCents: pv.offer.firstPeriodCents ?? null, feeHolidayMonths: pv.offer.feeHolidayMonths } : null;
  const released = THEME_CATALOG.filter(isReleased);
  const section = "scroll-mt-16 px-4 py-16 md:py-24";
  return (
    <>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: brand.name, url: brand.baseUrl, parentOrganization: { "@type": "Organization", name: "NextLevel Marketing Ltda." } },
        { "@context": "https://schema.org", "@type": "SoftwareApplication", name: brand.name, applicationCategory: "BusinessApplication", operatingSystem: "Web", description: brand.description },
      ]} />
      <HeroV2 cta={cta} signupOpen={brand.signupOpen} offer={offer} />
      <Marquee />

      {/* 1. Prova: lojas reais montadas no sistema (capturas em public/portal/commerce/v4), no lugar das lojas com fotos antigas. */}
      <section id="exemplos" aria-labelledby="exemplos-t" className={`${section} bg-canvas`}>
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-link">Lojas de exemplo</p>
          <h2 id="exemplos-t" className={`${H2} mt-3 max-w-2xl text-foreground`}>Lojas de verdade, montadas aqui.</h2>
          <p className="mt-4 max-w-2xl text-lg text-body">Moda, esporte e casa, com temas que você pode usar hoje. Produtos e preços de demonstração.</p>
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {LOJAS.map((l) => (
              <li key={l.arquivo}>
                <Link href={`/temas/${l.tema}`} className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                  <MockWindow title={`Loja de demonstração · tema ${l.temaNome}`} className="transition group-hover:-translate-y-1">
                    {/* eslint-disable-next-line @next/next/no-img-element -- captura estática da loja */}
                    <img src={`/portal/commerce/v4/${l.arquivo}.webp`} alt={`Página inicial da loja de demonstração ${l.nome}`} width={1200} height={662} loading="lazy" decoding="async" className="block aspect-[16/10] w-full object-cover object-top" />
                  </MockWindow>
                  <p className="mt-3 font-semibold text-foreground">{l.nome} <span className="font-normal text-muted-foreground">· {l.segmento}, tema {l.temaNome}</span></p>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8"><Link href={cta} className="font-semibold text-link underline underline-offset-4">Quero uma loja assim →</Link></p>
        </div>
      </section>

      {/* 2. Como começar, sozinho e na hora. */}
      <section id="comecar" aria-labelledby="com-t" className={`${section} bg-surface`}>
        <div className="mx-auto max-w-6xl">
          <h2 id="com-t" className={`${H2} mb-12 max-w-2xl text-foreground sm:text-5xl`}>Sua loja no ar em três passos.</h2>
          <Steps cta={cta} signupOpen={brand.signupOpen} offer={offer} />
        </div>
      </section>

      {/* 3. Para quem é. */}
      <section id="para-quem" aria-labelledby="pq-t" className={`${section} bg-canvas`}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 grid items-center gap-8 md:grid-cols-[1fr_minmax(0,26rem)]">
            <h2 id="pq-t" className={`${H2} max-w-2xl text-foreground`}>Para quem já vende e quer uma loja com a própria marca.</h2>
            <ImagemEmCriacao marca="commerce" nome="cm-hero-marca-propria" alt="Dona de marca embalando pedidos ao lado do notebook, com araras de roupa ao fundo" ratio="16 / 10" posicao="45% 45%" />
          </div>
          <ForWhom cta={cta} />
        </div>
      </section>

      {/* 4. O que vem na loja. */}
      <section id="canais" aria-labelledby="canais-t" className={`${section} bg-surface`}>
        <div className="mx-auto max-w-6xl">
          <h2 id="canais-t" className={`${H2} mb-12 max-w-3xl text-foreground sm:text-5xl`}>Venda, receba e acompanhe no mesmo painel.</h2>
          <Bento />
        </div>
      </section>

      <section id="personalizar" aria-labelledby="pers-t" className={`${section} bg-canvas`}>
        <div className="mx-auto max-w-6xl">
          <h2 id="pers-t" className={`${H2} mb-12 max-w-3xl text-foreground sm:text-5xl`}>A cara da sua marca, sem escrever código.</h2>
          <Personalize />
        </div>
      </section>

      <section id="operacao" aria-labelledby="op-t" className={section} style={{ background: "var(--ec-marinho)" }}>
        <div className="mx-auto max-w-6xl">
          <h2 id="op-t" className={`${H2} mb-10 max-w-3xl text-white sm:text-5xl`}>Depois que a loja está no ar, o painel organiza o resto.</h2>
          <div className="mb-16 overflow-hidden rounded-3xl" style={{ aspectRatio: "21 / 9" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- foto do pacote da marca com srcset próprio */}
            <img src="/marcas/nextlevel-commerce/imagens/capability-02-1600.webp" srcSet="/marcas/nextlevel-commerce/imagens/capability-02-800.webp 800w, /marcas/nextlevel-commerce/imagens/capability-02-1600.webp 1600w" sizes="(min-width: 1152px) 1152px, 100vw" alt="Equipe da loja embalando um pedido e entregando a sacola no balcão" width={1600} height={1200} loading="lazy" decoding="async" className="size-full object-cover" style={{ objectPosition: "50% 45%" }} />
          </div>
          <Operation />
        </div>
      </section>

      {/* 5. Temas com imagem real, preço e demonstração. */}
      <section id="temas" aria-labelledby="temas-t" className={`${section} bg-canvas`}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <h2 id="temas-t" className={`${H2} max-w-3xl text-foreground sm:text-5xl`}>Comece com um tema grátis. Troque quando quiser.</h2>
              <p className="mt-4 max-w-2xl text-lg text-body">{released.filter((t) => t.priceCents === 0).length} temas grátis e {released.filter((t) => t.priceCents > 0).length} temas pagos, por segmento. Os pagos têm pagamento único e são instalados com um clique, mantendo o seu conteúdo.</p>
            </div>
            <Link href="/temas" className="text-base font-semibold text-link underline underline-offset-4">Ver página de temas</Link>
          </div>
          <div className="mb-10 overflow-hidden rounded-3xl" style={{ aspectRatio: "21 / 8" }}><ImagemEmCriacao marca="commerce" nome="cm-temas-ambiente" alt="Loja conceito com araras, prateleiras e vitrine organizadas por ambiente" ratio="21 / 8" posicao="50% 55%" className="rounded-none" /></div>
          <ThemeGallery themes={released.map((t) => ({ key: t.key, name: t.name, priceCents: t.priceCents, tagline: t.tagline, family: t.family, familyName: FAMILY_INFO[t.family].name, levelName: LEVEL_INFO[t.level].goal, niche: t.niche }))} />
        </div>
      </section>

      {/* 6. Planos com simulador. */}
      <section id="planos" aria-labelledby="planos-t" className={`${section} bg-surface`}>
        <div className="mx-auto max-w-6xl">
          <h2 id="planos-t" className={`${H2} mx-auto mb-3 max-w-3xl text-center text-foreground sm:text-5xl`}>Um plano para cada momento da loja.</h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-lg text-body">Mova a régua com o quanto você vende e veja quanto custa cada plano, com a taxa incluída.</p>
          <CommercePlansSection cta={cta} signupOpen={brand.signupOpen} />
        </div>
      </section>

      <section id="duvidas" aria-labelledby="duv-t" className={`${section} bg-canvas`}>
        <div className="mx-auto max-w-6xl"><h2 id="duv-t" className={`${H2} mx-auto mb-8 max-w-3xl text-foreground`}>Perguntas frequentes</h2><Faq plans={pv.plans} offer={offer} themes={released.map((t) => ({ name: t.name, priceCents: t.priceCents }))} /></div>
      </section>

      {/* Chamada final sobre a foto "momento" do pacote (faixa marinho para o texto). Uma chamada só. */}
      <section className="relative isolate overflow-hidden py-20 text-white md:py-28" style={{ background: "var(--ec-marinho)" }} aria-label="Chamada final">
        <div aria-hidden className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element -- foto decorativa do pacote da marca */}
          <img src="/marcas/nextlevel-commerce/imagens/cta-moment-1600.webp" srcSet="/marcas/nextlevel-commerce/imagens/cta-moment-800.webp 800w, /marcas/nextlevel-commerce/imagens/cta-moment-1600.webp 1600w" sizes="100vw" alt="" width={1600} height={600} loading="lazy" decoding="async" className="size-full object-cover" style={{ objectPosition: "78% 50%" }} />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--ec-marinho)_0%,rgba(16,26,51,0.8)_40%,transparent_75%)]" />
          <div className="absolute inset-0 bg-[rgba(16,26,51,0.55)] md:hidden" />
        </div>
        <ClosingCta cta={cta} signupOpen={brand.signupOpen} offer={offer} />
      </section>
    </>
  );
}
