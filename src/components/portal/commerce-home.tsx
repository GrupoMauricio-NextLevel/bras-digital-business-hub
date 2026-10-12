import Link from "next/link";
import { ImagemEmCriacao, TexturaDeFundo } from "@/components/portal/imagem-em-criacao";
import "./commerce/commerce.css";
import type { Brand } from "@/lib/brand";
import { JsonLd } from "@/components/portal/json-ld";
import { isReleased, THEME_CATALOG } from "@/lib/themes/catalog";
import { formatBRL } from "@/lib/money";
import { DEMO_STORES } from "@/components/portal/commerce/demo-stores";
import { StoreGallery, type GalleryTheme } from "@/components/portal/commerce/store-gallery";
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
import { FechoMarca, VitrineMarca } from "@/components/portal/marca-institucional";

/**
 * Home da NextLevel Commerce (v2, cadastro aberto): prova (lojas de exemplo), como começar sozinho, para quem é, o que a
 * plataforma faz, temas com imagem real, planos com simulador e dúvidas. Só anuncia o que existe.
 * Decisões: docs/design/HOME-COMMERCE-V1.md e D97.
 */
export async function CommerceHome({ brand }: { brand: Brand }) {
  const cta = brand.signupOpen ? "/cadastro" : "/quero-minha-loja";
  const pv = await commercePlansView(await getDb());
  const offer = pv.offer ? { trialDays: pv.offer.trialDays, firstPeriodCents: pv.offer.firstPeriodCents ?? null, feeHolidayMonths: pv.offer.feeHolidayMonths } : null;
  const released = THEME_CATALOG.filter(isReleased);
  const themes: Record<string, GalleryTheme> = Object.fromEntries(THEME_CATALOG.map((t) => [t.key, { key: t.key, name: t.name, priceLabel: t.priceCents === 0 ? "grátis" : formatBRL(t.priceCents), tagline: t.tagline, features: t.features.slice(0, 4) }]));
  const section = "scroll-mt-16 px-4 py-16 md:py-24";
  return (
    <>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: brand.name, url: brand.baseUrl, parentOrganization: { "@type": "Organization", name: "NextLevel Marketing Ltda." } },
        { "@context": "https://schema.org", "@type": "SoftwareApplication", name: brand.name, applicationCategory: "BusinessApplication", operatingSystem: "Web", description: brand.description },
      ]} />
      <HeroV2 cta={cta} signupOpen={brand.signupOpen} offer={offer} />
      <Marquee />
      <VitrineMarca slug="nextlevel-commerce" titulo="Tudo o que a sua loja precisa para vender" />

      {/* 1. Prova: lojas montadas com os temas que existem hoje. */}
      <section id="exemplos" aria-labelledby="exemplos-t" className={`${section} bg-band`}>
        <div className="mx-auto max-w-6xl">
          <h2 id="exemplos-t" className={`${H2} max-w-2xl text-band-foreground`}>Moda, casa, esporte: cada loja com a sua cara.</h2>
          <p className="mt-4 max-w-2xl text-lg text-band-foreground/85">Lojas de demonstração montadas com temas que você pode usar hoje. Nomes, produtos e preços são fictícios.</p>
          <div className="mt-10"><StoreGallery stores={DEMO_STORES} themes={themes} ctaHref={cta} /></div>
        </div>
      </section>

      {/* 2. Como começar, sozinho e na hora. */}
      <section id="comecar" aria-labelledby="com-t" className={`${section} bg-canvas`}>
        <div className="mx-auto max-w-6xl">
          <h2 id="com-t" className={`${H2} mb-12 max-w-2xl text-foreground sm:text-5xl`}>Sua loja no ar em três passos.</h2>
          <Steps cta={cta} signupOpen={brand.signupOpen} offer={offer} />
        </div>
      </section>

      {/* 3. Para quem é. */}
      <section id="para-quem" aria-labelledby="pq-t" className={section}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 grid items-end gap-8 md:grid-cols-[1fr_minmax(0,14rem)]">
            <h2 id="pq-t" className={`${H2} max-w-2xl text-foreground`}>Para quem vende e quer uma loja de verdade.</h2>
            <ImagemEmCriacao marca="commerce" nome="cm-hero-celular-vitrine" alt="Mão segurando o celular diante de uma arara de roupas" ratio="4 / 5" posicao="50% 40%" className="mx-auto w-full max-w-[14rem] md:mx-0" />
          </div>
          <ForWhom cta={cta} />
        </div>
      </section>

      {/* 4. O que vem na loja. */}
      <section id="canais" aria-labelledby="canais-t" className={`${section} bg-canvas`}>
        <div className="mx-auto max-w-6xl">
          <h2 id="canais-t" className={`${H2} mb-12 max-w-3xl text-foreground sm:text-5xl`}>Venda pela loja, receba por Pix e acompanhe tudo em um só lugar.</h2>
          <Bento />
        </div>
      </section>

      <section id="personalizar" aria-labelledby="pers-t" className={`${section} bg-highlight-soft`}>
        <div className="mx-auto max-w-6xl">
          <h2 id="pers-t" className={`${H2} mb-12 max-w-3xl text-foreground sm:text-5xl`}>Deixe a loja com a cara da sua marca, sem escrever código.</h2>
          <Personalize />
        </div>
      </section>

      <section id="operacao" aria-labelledby="op-t" className={`${section} bg-band`}>
        <div className="mx-auto max-w-6xl">
          <h2 id="op-t" className={`${H2} mb-16 max-w-3xl text-band-foreground sm:text-5xl`}>Depois que a loja está no ar, o painel cuida do resto.</h2>
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
          <ThemeGallery themes={released.map((t) => ({ key: t.key, name: t.name, priceCents: t.priceCents, tagline: t.tagline, family: t.family, familyName: FAMILY_INFO[t.family].name, levelName: LEVEL_INFO[t.level].goal, niche: t.niche }))} />
        </div>
      </section>

      {/* 6. Planos com simulador. */}
      <section id="planos" aria-labelledby="planos-t" className={`${section} bg-highlight-soft`}>
        <div className="mx-auto max-w-6xl">
          <h2 id="planos-t" className={`${H2} mx-auto mb-3 max-w-3xl text-center text-foreground sm:text-5xl`}>Um plano para cada tamanho de loja.</h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-lg text-body">Mova a régua com o quanto você vende e veja quanto custa cada plano, com a taxa incluída.</p>
          <CommercePlansSection cta={cta} signupOpen={brand.signupOpen} />
        </div>
      </section>

      <section id="duvidas" aria-labelledby="duv-t" className={`${section} bg-canvas`}>
        <div className="mx-auto max-w-6xl"><h2 id="duv-t" className={`${H2} mx-auto mb-8 max-w-3xl text-foreground`}>Perguntas que costumam aparecer.</h2><Faq plans={pv.plans} offer={offer} themes={released.map((t) => ({ name: t.name, priceCents: t.priceCents }))} /></div>
      </section>

      <section className="relative overflow-hidden bg-band py-16 md:py-20" aria-label="Chamada final"><TexturaDeFundo marca="commerce" nome="cm-textura-fundo" /><div className="relative"><ClosingCta cta={cta} signupOpen={brand.signupOpen} offer={offer} /></div></section>
      <FechoMarca slug="nextlevel-commerce" cta={{ href: cta, label: "Criar minha loja" }} />
    </>
  );
}
