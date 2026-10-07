import { MosaicoEditorial } from "@/components/portal/mosaico-editorial";
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
import { ClosingCta, Faq, ForWhom, H2, Operation, Steps, ThemesAndPrices } from "@/components/portal/commerce/sections";

/**
 * Home da NextLevel Commerce (v1, protótipo em revisão): o que é, que lojas dá para montar, como a marca ganha forma,
 * o que o painel faz, como começar. Só anuncia o que existe; atacado e demais frentes ficam de fora.
 * Documento de decisões: docs/design/HOME-COMMERCE-V1.md.
 */
export function CommerceHome({ brand }: { brand: Brand }) {
  const cta = brand.signupOpen ? "/cadastro" : "/quero-minha-loja";
  const themes: Record<string, GalleryTheme> = Object.fromEntries(THEME_CATALOG.map((t) => [t.key, { key: t.key, name: t.name, priceLabel: t.priceCents === 0 ? "grátis" : formatBRL(t.priceCents), tagline: t.tagline, features: t.features.slice(0, 4) }]));
  const section = "scroll-mt-16 px-4 py-16 md:py-24";
  return (
    <>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: brand.name, url: brand.baseUrl, parentOrganization: { "@type": "Organization", name: "NextLevel Marketing Ltda." } },
        { "@context": "https://schema.org", "@type": "SoftwareApplication", name: brand.name, applicationCategory: "BusinessApplication", operatingSystem: "Web", description: brand.description },
      ]} />
      <HeroV2 cta={cta} signupOpen={brand.signupOpen} />
      <Marquee />

      <section id="canais" aria-labelledby="canais-t" className={`${section} bg-canvas`}>
        <div className="mx-auto max-w-6xl">
          <h2 id="canais-t" className={`${H2} mb-12 max-w-3xl text-foreground sm:text-5xl`}>Venda pela loja, receba por Pix e acompanhe tudo em um só lugar.</h2>
          <Bento />
        </div>
      </section>

      <section id="bastidores" aria-label="Sua marca, sua operação" className={section}>
        <MosaicoEditorial marca="commerce" eyebrow="Sua marca, sua operação" titulo="Do ateliê ao pedido embalado, tudo com a sua cara." texto="Fotografe, cadastre, venda e entregue com a identidade da sua marca. O painel acompanha cada etapa."
          pecas={[
            { nome: "cm-hero-marca-propria", alt: "Ateliê de moda com araras, peças dobradas e notebook aberto", ratio: "4 / 5", posicao: "40% 50%", titulo: "Sua marca no centro", texto: "Tema, cores e domínio próprios, sem cara de marketplace." },
            { nome: "cm-catalogo-fotografia", alt: "Mini estúdio fotografando uma peça em manequim invisível", ratio: "4 / 3", posicao: "42% 50%", titulo: "Catálogo que vende", texto: "Fotos, variações e estoque organizados no painel." },
            { nome: "cm-pedido-embalado", alt: "Sacola de loja própria com papel de seda azul", ratio: "4 / 3", posicao: "50% 58%", titulo: "Pedido com a sua embalagem", texto: "Pix e cartão confirmados antes de separar." },
          ]} />
      </section>

      <section id="para-quem" aria-labelledby="pq-t" className={section}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 grid items-end gap-8 md:grid-cols-[1fr_minmax(0,14rem)]">
            <h2 id="pq-t" className={`${H2} max-w-2xl text-foreground`}>Para quem vende e quer uma loja de verdade.</h2>
            <ImagemEmCriacao marca="commerce" nome="cm-hero-celular-vitrine" alt="Mão segurando o celular diante de uma arara de roupas" ratio="4 / 5" posicao="50% 40%" className="mx-auto w-full max-w-[14rem] md:mx-0" />
          </div>
          <ForWhom cta={cta} />
        </div>
      </section>

      <section id="exemplos" aria-labelledby="exemplos-t" className={`${section} bg-band`}>
        <div className="mx-auto max-w-6xl">
          <h2 id="exemplos-t" className={`${H2} max-w-2xl text-band-foreground`}>Moda, casa, acessórios: cada loja com a sua cara.</h2>
          <p className="mt-4 max-w-2xl text-lg text-band-foreground/85">Três lojas de demonstração, criadas com temas que existem hoje. Nomes, produtos e preços são fictícios.</p>
          <ImagemEmCriacao marca="commerce" nome="cm-temas-ambiente" alt="Três ambientes de loja lado a lado: moda, acessórios e casa, com a mesma luz" ratio="21 / 9" posicao="50% 55%" className="mt-8" />
          <div className="mt-10"><StoreGallery stores={DEMO_STORES} themes={themes} ctaHref={cta} /></div>
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

      <section id="comecar" aria-labelledby="com-t" className={`${section} bg-highlight-soft`}>
        <div className="mx-auto max-w-6xl">
          <h2 id="com-t" className={`${H2} mb-12 max-w-2xl text-foreground`}>Do primeiro contato à loja publicada.</h2>
          <Steps cta={cta} />
        </div>
      </section>

      <section id="valores" aria-label="Temas e valores" className={section}>
        <div className="mx-auto max-w-6xl"><ThemesAndPrices themes={THEME_CATALOG.filter(isReleased).map((t) => ({ key: t.key, name: t.name, priceCents: t.priceCents, tagline: t.tagline }))} /></div>
      </section>

      <section id="duvidas" aria-labelledby="duv-t" className={`${section} bg-highlight-soft`}>
        <div className="mx-auto max-w-6xl"><h2 id="duv-t" className={`${H2} mx-auto mb-8 max-w-3xl text-foreground`}>Perguntas que costumam aparecer.</h2><Faq themes={THEME_CATALOG.filter(isReleased).map((t) => ({ name: t.name, priceCents: t.priceCents }))} /></div>
      </section>

      <section className="relative overflow-hidden bg-band py-16 md:py-20" aria-label="Chamada final"><TexturaDeFundo marca="commerce" nome="cm-textura-fundo" /><div className="relative"><ClosingCta cta={cta} signupOpen={brand.signupOpen} /></div></section>
    </>
  );
}
