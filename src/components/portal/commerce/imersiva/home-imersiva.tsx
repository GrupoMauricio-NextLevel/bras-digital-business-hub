import Link from "next/link";
import { ArrowRight, BadgeCheck, Banknote, ShieldCheck } from "lucide-react";
import type { Brand } from "@/lib/brand";
import { getDb } from "@/db/client";
import { anualBlackCents, blackAgora } from "@/lib/domain/campanha-black";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { isReleased, THEME_CATALOG } from "@/lib/themes/catalog";
import { FAMILY_INFO, LEVEL_INFO } from "@/lib/themes/levels";
import { JsonLd } from "@/components/portal/json-ld";
import { HeroiCapaEc } from "@/components/portal/commerce/capa/heroi-capa";
import { ClosingCta, Faq, H2 } from "@/components/portal/commerce/sections";
import { ThemeGallery } from "@/components/portal/commerce/theme-gallery";
import { CommercePlansSection } from "@/components/portal/commerce/plans-section";
import { LojasExemplo } from "@/components/portal/commerce-home";
import { EC_HOME_ACERVO } from "@/lib/marcas/ecommerce-home-imagens";
import { ComparativoHome, FaixaTaxaZero, PorQueNextLevel } from "@/components/portal/commerce/comparativo";
import { FeitaParaAtacado } from "@/components/portal/commerce/imersiva/feita-para-atacado";
import { PlacarSecao } from "@/components/placar/placar-secao";
import { DueloBlack } from "@/components/black/duelo-black";
import { VivenciaRua } from "@/components/portal/commerce/imersiva/vivencia-rua";
import { FotoImersiva } from "@/components/imersiva/foto";
import { SecaoEquipe } from "@/components/portal/equipe/secao-equipe";
import { groupLink } from "@/lib/brand-server";
import "../commerce.css";
import "../capa/capa.css";

/**
 * Home da NextLevel E-commerce, versão imersiva (D165; racional objetivo com comparativo em D219). Mesma primeira dobra (texto e oferta vindos
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
  const solucoes = await groupLink("/solucoes");
  const link = "underline underline-offset-4 text-link";

  const pagos = pv.plans.filter((p) => !p.quote && p.annualCents);
  // Black NextLevel (D229): durante a campanha, o "a partir de" já é o anual com 2 meses grátis.
  const bk = await blackAgora(await getDb());
  const black = bk.ativa;
  const bkCont = black ? { fim: bk.fim, restanteMs: bk.restanteMs } : null;
  const aPartirDe = pagos.length ? Math.min(...pagos.map((p) => Math.round((black ? anualBlackCents(p.annualCents!) : p.annualCents!) / 12))) : null;
  // D220: degraus da NextLevel (Start, Pro, Scale) para o comparativo plano a plano.
  const degrausNl = pagos.map((p) => ({ nome: p.name.replace(/^Commerce\s+/i, ""), mensalCents: p.monthlyCents!, anualMesCents: Math.round(p.annualCents! / 12) }));

  return (
    <div className="im-tema-ecommerce contents">
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: brand.name, url: brand.baseUrl, parentOrganization: { "@type": "Organization", name: "NextLevel Marketing Ltda." } },
        { "@context": "https://schema.org", "@type": "SoftwareApplication", name: brand.name, applicationCategory: "BusinessApplication", operatingSystem: "Web", description: brand.description },
      ]} />
      <HeroiCapaEc cta={cta} signupOpen={brand.signupOpen} offer={offer} aPartirDeCents={aPartirDe} black={bkCont} />
      <DueloBlack cta={cta} />
      <FaixaTaxaZero black={bkCont} />
      <PlacarSecao cta={cta} />

      {/* D219: a home ficou só com o que convence (motivos, planos, comparativo, prova, temas, equipe, dúvidas).
          Como funciona, portas de entrada, personalização, Maurício e integrações foram para /recursos. */}
      <PorQueNextLevel degrausNl={degrausNl} />
      <FeitaParaAtacado />
      <VivenciaRua />

      <section id="planos" aria-labelledby="planos-t" className="ecc-planos ds-tema-escuro scroll-mt-16">
        <div className="mx-auto max-w-6xl">
          <h2 id="planos-t" className="ecc-h2 text-center">Escolha o plano e comece hoje</h2>
          <p className="ecc-garantias">
            <span><ShieldCheck className="size-4" aria-hidden />Sem fidelidade</span>
            <span><Banknote className="size-4" aria-hidden />Dinheiro direto na sua conta</span>
            <span><BadgeCheck className="size-4" aria-hidden />Mensal ou anual, você escolhe</span>
          </p>
          <CommercePlansSection cta={cta} signupOpen={brand.signupOpen} />
        </div>
      </section>

      <ComparativoHome degrausNl={degrausNl} cta={cta} comecar={comecar} />

      <LojasExemplo cta={cta} className={`${section} bg-surface`} />

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

      <SecaoEquipe code={brand.code} nomeDaMarca={brand.name} className="bg-canvas text-foreground">
        <span className="w-full font-normal opacity-80">Prefere ajuda para começar?</span>
        <Link className={link} href={`${solucoes}/loja-pronta-essencial`}>Loja Pronta</Link>
        <Link className={link} href={`${solucoes}/migracao-lite`}>Migração</Link>
        <Link className={link} href={`${solucoes}#diagnostico`}>Diagnóstico gratuito</Link>
      </SecaoEquipe>

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
