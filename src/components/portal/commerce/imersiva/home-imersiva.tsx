import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Brand } from "@/lib/brand";
import { getDb } from "@/db/client";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { isReleased, THEME_CATALOG } from "@/lib/themes/catalog";
import { FAMILY_INFO, LEVEL_INFO } from "@/lib/themes/levels";
import { JsonLd } from "@/components/portal/json-ld";
import { HeroV2 } from "@/components/portal/commerce/hero-v2";
import { ClosingCta, Faq, H2 } from "@/components/portal/commerce/sections";
import { ThemeGallery } from "@/components/portal/commerce/theme-gallery";
import { Personalize } from "@/components/portal/commerce/personalize";
import { CommercePlansSection } from "@/components/portal/commerce/plans-section";
import { LojasExemplo } from "@/components/portal/commerce-home";
import { EC_HOME_ACERVO, type EcHomeFotoNome } from "@/lib/marcas/ecommerce-home-imagens";
import { FotoImersiva } from "@/components/imersiva/foto";
import { JornadaMarca, type PassoMarca } from "@/components/imersiva/jornada";
import "../commerce.css";

/**
 * Home da NextLevel E-commerce, versão imersiva (D165, padrão da Soluções D162). Mesma primeira dobra (texto e oferta vindos
 * do Master), depois a jornada "a loja que cresce" (cinco passos, foto presa na tela), as quatro portas, a prova (lojas de
 * exemplo), a personalização interativa, temas, planos (simulador), dúvidas e a chamada final. Cada frase corresponde a algo
 * que o sistema já faz (conferido em docs/design/ecommerce-home-imersiva-previa.md).
 */
export async function HomeImersivaEc({ brand }: { brand: Brand }) {
  const cta = brand.signupOpen ? "/cadastro" : "/quero-minha-loja";
  const pv = await commercePlansView(await getDb());
  const offer = pv.offer ? { trialDays: pv.offer.trialDays, firstPeriodCents: pv.offer.firstPeriodCents ?? null, feeHolidayMonths: pv.offer.feeHolidayMonths } : null;
  const released = THEME_CATALOG.filter(isReleased);
  const comecar = brand.signupOpen ? (offer ? `Começar ${offer.trialDays} dias grátis` : "Criar minha loja") : "Quero minha loja";
  const section = "scroll-mt-16 px-4 py-16 md:py-24";

  const passos: PassoMarca<EcHomeFotoNome>[] = [
    { key: "produto", nome: "Cadastrar", foto: "ec-jornada-1-produto", retrato: "ec-jornada-1-produto-retrato", titulo: "Cadastre como você vende.", texto: "Produtos com variações de tamanho e cor, estoque e categorias, sem limite de cadastro. Um a um ou por planilha.", links: [{ label: "Ver o que vem nos planos", href: "#planos" }] },
    { key: "loja", nome: "Montar", foto: "ec-temas", retrato: "ec-jornada-2-loja-retrato", titulo: "Sua vitrine, com a cara da marca.", texto: "Tema gratuito, editor visual com prévia ao vivo e domínio próprio. Enquanto não publica, só você vê.", links: [{ label: "Ver temas", href: "/temas" }, { label: "Lojas de exemplo", href: "#exemplos" }] },
    { key: "pedido", nome: "Vender", foto: "ec-jornada-3-pedido", retrato: "ec-jornada-3-pedido-retrato", titulo: "O pagamento cai na sua conta.", texto: "Pix e cartão pelo Mercado Pago da sua loja: você recebe 100% das vendas, direto na sua conta.", links: [{ label: "Dúvidas sobre pagamento", href: "#duvidas" }] },
    { key: "envio", nome: "Enviar", foto: "ec-jornada-4-envio", retrato: "ec-jornada-4-envio-retrato", titulo: "Pedido organizado até a entrega.", texto: "Frete por regras próprias ou plataforma de envio, código de rastreio e mensagem pronta para o cliente no WhatsApp.", links: [{ label: "Dúvidas sobre frete", href: "#duvidas" }] },
    { key: "rotina", nome: "Crescer", foto: "ec-jornada-5-rotina", retrato: "ec-jornada-5-rotina-retrato", titulo: "Uma operação que cabe no seu dia.", texto: "Pós-venda, cupons, campanhas, avaliações e equipe com acessos separados, no mesmo painel.", links: [{ label: comecar, href: cta }] },
  ];
  const portas: { foto: EcHomeFotoNome; titulo: string; texto: string }[] = [
    { foto: "ec-porta-zero", titulo: "Começar do zero", texto: "Tema grátis, editor visual e produtos cadastrados um a um ou por planilha." },
    { foto: "ec-porta-instagram", titulo: "Já vendo pelo Instagram e WhatsApp", texto: "Os pedidos do WhatsApp e do Instagram entram no mesmo painel da loja." },
    { foto: "ec-porta-migrar", titulo: "Sair de outra plataforma", texto: "Traga os seus produtos por planilha e mantenha a sua marca." },
    { foto: "ec-porta-fisica", titulo: "Tenho loja física", texto: "A mesma vitrine no site, com Pix e cartão na sua conta Mercado Pago." },
  ];

  return (
    <div className="im-tema-ecommerce contents">
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: brand.name, url: brand.baseUrl, parentOrganization: { "@type": "Organization", name: "NextLevel Marketing Ltda." } },
        { "@context": "https://schema.org", "@type": "SoftwareApplication", name: brand.name, applicationCategory: "BusinessApplication", operatingSystem: "Web", description: brand.description },
      ]} />
      <HeroV2 cta={cta} signupOpen={brand.signupOpen} offer={offer} />

      <JornadaMarca acervo={EC_HOME_ACERVO} passos={passos} eyebrow="Como funciona" titulo="Da primeira foto à rotina de pedidos." rotulo="A loja que cresce, em cinco passos" />

      <section id="portas" aria-labelledby="portas-t" className={`${section} bg-canvas`}>
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow im-eyebrow--claro">Por onde começar</p>
          <h2 id="portas-t" className={`im-h2 mt-3 max-w-3xl text-foreground`}>Cada marca chega de um jeito.</h2>
          <p className="mt-4 max-w-2xl text-lg text-body">Escolha o seu ponto de partida. O cadastro é o mesmo e leva um minuto.</p>
          <ul className="im-portas mt-10">
            {portas.map((p) => (
              <li key={p.foto} className="im-surge">
                <Link href={cta} className="im-porta">
                  <FotoImersiva acervo={EC_HOME_ACERVO} nome={p.foto} alt="" sizes="(min-width: 1024px) 18rem, (min-width: 480px) 50vw, 100vw" />
                  <h3>{p.titulo}</h3>
                  <p>{p.texto}</p>
                  <span data-cta>Começar por aqui <ArrowRight className="size-4" aria-hidden /></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <LojasExemplo cta={cta} className={`${section} bg-surface`} />

      <section id="personalizar" aria-labelledby="pers-t" className={`${section} bg-canvas`}>
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow im-eyebrow--claro">Personalização</p>
          <h2 id="pers-t" className="im-h2 mt-3 mb-12 max-w-3xl text-foreground">A cara da sua marca, sem escrever código.</h2>
          <Personalize />
        </div>
      </section>

      <section id="temas" aria-labelledby="temas-t" className={`${section} bg-surface`}>
        <div className="mx-auto max-w-6xl">
          <div className="im-lado mb-12">
            <div className="im-surge">
              <p className="im-eyebrow im-eyebrow--claro">Temas</p>
              <h2 id="temas-t" className="im-h2 mt-3 text-foreground">Temas que vendem pela primeira impressão.</h2>
              <p className="mt-4 text-lg text-body">{released.filter((t) => t.priceCents === 0).length} temas grátis e {released.filter((t) => t.priceCents > 0).length} temas pagos, por segmento. Abra a loja de demonstração e navegue antes de escolher; os pagos têm pagamento único e instalam com um clique, mantendo o seu conteúdo.</p>
              <Link href="/temas" className="mt-6 inline-flex items-center gap-2 font-semibold text-link underline underline-offset-4">Ver todos os temas <ArrowRight className="size-4" aria-hidden /></Link>
            </div>
            <FotoImersiva acervo={EC_HOME_ACERVO} nome="ec-entrar" alt="Notebook aceso sobre a mesa do ateliê mostrando a loja" sizes="(min-width: 900px) 36rem, 100vw" className="im-surge" />
          </div>
          <ThemeGallery themes={released.map((t) => ({ key: t.key, name: t.name, priceCents: t.priceCents, tagline: t.tagline, family: t.family, familyName: FAMILY_INFO[t.family].name, levelName: LEVEL_INFO[t.level].goal, niche: t.niche }))} />
        </div>
      </section>

      <section id="planos" aria-labelledby="planos-t" className={`${section} bg-canvas`}>
        <div className="mx-auto max-w-6xl">
          <div className="im-lado mb-12">
            <FotoImersiva acervo={EC_HOME_ACERVO} nome="ec-planos" alt="" sizes="(min-width: 900px) 36rem, 100vw" className="im-surge" />
            <div className="im-surge">
              <p className="im-eyebrow im-eyebrow--claro">Planos</p>
              <h2 id="planos-t" className="im-h2 mt-3 text-foreground">Preço claro, sem fidelidade.</h2>
              <p className="mt-4 text-lg text-body">{offer ? `Comece com ${offer.trialDays} dias grátis e escolha mensal ou anual.` : "Escolha mensal ou anual."} Mova a régua com o quanto você vende e veja quanto custa cada plano, com a taxa incluída.</p>
            </div>
          </div>
          <CommercePlansSection cta={cta} signupOpen={brand.signupOpen} />
        </div>
      </section>

      <section id="duvidas" aria-labelledby="duv-t" className={`${section} bg-surface`}>
        <div className="mx-auto max-w-6xl"><h2 id="duv-t" className={`${H2} mx-auto mb-8 max-w-3xl text-foreground`}>Perguntas frequentes</h2><Faq plans={pv.plans} offer={offer} themes={released.map((t) => ({ name: t.name, priceCents: t.priceCents }))} /></div>
      </section>

      <section className="relative isolate overflow-hidden py-20 text-white md:py-28" style={{ background: "var(--ec-marinho)" }} aria-label="Chamada final">
        <div aria-hidden className="absolute inset-0 -z-10">
          <FotoImersiva acervo={EC_HOME_ACERVO} nome="ec-fecho" alt="" className="block size-full" imgClassName="size-full object-cover object-[70%_40%]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--ec-marinho)_0%,rgba(16,26,51,0.85)_42%,rgba(16,26,51,0.2)_80%)]" />
          <div className="absolute inset-0 bg-[rgba(16,26,51,0.6)] md:hidden" />
        </div>
        <ClosingCta cta={cta} signupOpen={brand.signupOpen} offer={offer} />
      </section>
    </div>
  );
}
