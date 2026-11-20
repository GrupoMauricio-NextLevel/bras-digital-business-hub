import { CartaFundador, FotoEquipeLeve } from "@/components/portal/equipe/blocos";
import { USOS_EQUIPE } from "@/lib/marcas/equipe-usos";
import { SecaoEquipe } from "@/components/portal/equipe/secao-equipe";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { businessLigado } from "@/lib/business/modulos";
import { TambemDaNextLevel } from "@/components/portal/frentes/tambem-da-nextlevel";
import { ArrowDown, ArrowRight, Mail, MessageCircle } from "lucide-react";
import { getDb } from "@/db/client";
import { getBrand } from "@/lib/brand-server";
import { groupSiteUrl } from "@/lib/host-routing";
import { brandByCode } from "@/lib/brand";
import { finFlag } from "@/lib/finance/flags";
import { listCatalog } from "@/lib/domain/nl-catalog";
import { getJourneyConfig } from "@/lib/domain/journey";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { DIAGNOSTIC_NEEDS } from "@/lib/domain/corporate-sales";
import { FAMILY_LABEL, priceLines } from "@/lib/finance/catalog-labels";
import { currentAttribution, withAttribution } from "@/lib/attribution";
import { JsonLd } from "@/components/portal/json-ld";
import { formatBRL } from "@/lib/money";
import { DiagnosticoForm } from "./diagnostico-form";
import { FotoOpcional } from "@/components/portal/imagem-em-criacao";
import { NL } from "@/lib/marcas/nextlevel";
import { FamiliaFoto } from "@/components/nl-store/familia-foto";
import { FechoMarca } from "@/components/portal/marca-institucional";
import { HeroiNextLevel } from "@/components/portal/nextlevel/heroi-nextlevel";
import { VitrineSecoes, fotoSolucoes } from "@/components/portal/solucoes/vitrine-v2";
import { SelecaoProvider } from "@/components/portal/solucoes/selecao";
import { projetarVitrine } from "@/lib/solucoes/vitrine";
import { getSession } from "@/lib/auth";
import { supportContacts } from "@/lib/support";
import { BrandLogo } from "@/components/brand/brand-logo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const title = "NextLevel Soluções para empresas: loja virtual, migração, temas e marketing";
  const description = "Diagnóstico gratuito e uma jornada clara: fundação, lançamento, aquisição, otimização e escala. Plataforma Commerce, Loja Pronta, Migração, temas, tráfego e White Label.";
  return { title: { absolute: title }, description, alternates: { canonical: `${groupSiteUrl()}/solucoes` }, openGraph: { title, description, url: `${groupSiteUrl()}/solucoes`, siteName: "NextLevel", type: "website", locale: "pt_BR", images: [{ url: `${groupSiteUrl()}/portal/nextlevel/equipe/v1/eq-og-escritorio.jpg`, width: 1200, height: 630, alt: "Equipe NextLevel na sede, em São Paulo" }] } };
}

const H2 = "font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight sm:text-4xl";

/** Dúvidas reais sobre a contratação, só com o que o sistema e o catálogo já fazem (sem número, prazo ou resultado prometido). */
const FAQ_SOLUCOES = [
  { q: "O diagnóstico tem custo?", a: "Não. Você conta o momento do seu negócio no formulário abaixo e recebe o próximo passo recomendado, sem compromisso." },
  { q: "Como sei o preço de cada solução?", a: "Quando o preço é fixo, ele está publicado na página da solução, com as formas de pagamento. Quando depende do seu cenário, a solução aparece como sob consulta e você recebe uma proposta por escrito." },
  { q: "Quais formas de pagamento vocês aceitam?", a: "Pix e cartão, conforme cada solução. Onde o produto permite, o Pix tem desconto e o cartão pode ser parcelado." },
  { q: "A verba de anúncios passa pela NextLevel?", a: "Não. Na gestão de anúncios, a verba é paga por você direto à plataforma (Meta, Google, Mercado Livre). A NextLevel cobra só a gestão." },
  { q: "Consigo trazer a minha loja de outra plataforma?", a: "Sim, pela Migração. Ela atende lojas de plataformas como Shopify, Nuvemshop, Tray, WooCommerce, Loja Integrada, Yampi e WBuy; o limite de produtos e o que entra em cada pacote estão descritos na página da solução." },
  { q: "Vocês garantem resultado de vendas?", a: "Não. Entregamos o que está escrito no escopo de cada solução. O resultado depende do seu produto, do preço e da operação." },
  { q: "Quem está por trás da NextLevel?", a: "A NextLevel Marketing Ltda., o grupo que desenvolve e opera a NextLevel Commerce e a NextLevel Cargas." },
];

export default async function SolucoesPage({ searchParams }: { searchParams: Promise<{ previa?: string; porta?: string }> }) {
  if (!finFlag("FIN_PUBLIC_SOLUTIONS")) notFound();
  const sp = await searchParams;
  // Vitrine imersiva (D162): no ar com a chave FIN_SOLUTIONS_V2; antes disso, só o Master vê, em /solucoes?previa=v2.
  const previa = sp.previa === "v2" && (await getSession())?.user.role === "NEXTLEVEL_MASTER";
  const v2 = finFlag("FIN_SOLUTIONS_V2") || previa;
  const db = await getDb();
  const [brand, items, journey, plans, attr] = await Promise.all([getBrand(), listCatalog(db), getJourneyConfig(db), commercePlansView(db), currentAttribution()]);
  const commerce = brandByCode("NEXTLEVEL_COMMERCE");
  const pub = items.filter((i) => i.audience.includes("PUBLIC") && i.family !== "TEMA");
  const families = ["COMMERCE_PLAN", "LOJA_PRONTA", "MIGRACAO", "MARKETING", "CONSULTORIA", "WHITE_LABEL"] as const;
  const commerceHref = withAttribution(`${brand.code === "NEXTLEVEL_COMMERCE" ? "" : commerce.baseUrl}/planos`, attr);
  const MARCAS_DO_GRUPO = [commerce];
  const contato = supportContacts();
  const vitrine = v2 ? projetarVitrine({
    itens: items, fases: journey.phases, oferta: plans.offer ? { trialDays: plans.offer.trialDays, firstPeriodCents: plans.offer.firstPeriodCents ?? null, feeHolidayMonths: plans.offer.feeHolidayMonths } : null,
    link: (path) => withAttribution(path, attr), commerce: { base: brand.code === "NEXTLEVEL_COMMERCE" ? "" : commerce.baseUrl, signupOpen: commerce.signupOpen },
  }) : null;
  const porta = vitrine?.portas.find((p) => p.key === sp.porta)?.key ?? null;
  const conteudo = (
    <>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: "NextLevel Marketing Ltda.", url: `${groupSiteUrl()}/solucoes`, brand: ["NextLevel Commerce"].map((n) => ({ "@type": "Brand", name: n })) },
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ_SOLUCOES.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
        { "@context": "https://schema.org", "@type": "ItemList", name: "Soluções NextLevel", itemListElement: pub.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${groupSiteUrl()}/solucoes/${p.slug}`, name: p.name })) },
      ]} />
      {/* Marca-mãe v2 (D161): herói marinho com a assinatura Prisma Digital e a peça 3D do pacote; textos e botões em HTML. */}
      <HeroiNextLevel
        titulo={<>O próximo nível começa com <span className="text-[var(--nlg-luminoso)]">estrutura.</span></>}
        texto="Tecnologia, serviços e operações conectadas para quem vende online: loja virtual, revenda sem estoque, loja montada pela equipe, migração, temas e marketing, do mesmo grupo. Comece pelo diagnóstico gratuito e receba o próximo passo por escrito."
        ctas={[{ href: "#diagnostico", label: "Fazer diagnóstico gratuito", primary: true }, { href: "#catalogo", label: "Ver soluções e preços" }]}
        pontos={["Diagnóstico sem custo", "Preço publicado ou proposta por escrito", "Sem promessa de faturamento"]}
      />

      {/* Ecossistema: cada marca com a própria logo (versão para fundo escuro) e o papel dela; links reais. */}
      <section aria-labelledby="eco-t" className="ds-tema-escuro bg-[var(--nlg-marinho)] px-4 pb-16 pt-14 text-[var(--nlg-gelo)] md:pb-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--nlg-luminoso)]">Ecossistema</p>
          <h2 id="eco-t" className={`${H2} mt-3 text-white`}>Um grupo, várias frentes.</h2>
          <p className="mt-3 max-w-3xl text-lg text-[var(--nlg-texto-suave)]">Quem começa numa marca encontra as outras quando o negócio pede: loja própria, revenda sem estoque, atacado e transporte. Cada produto é {NL.endosso.produto}.</p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MARCAS_DO_GRUPO.map((m) => (
              <li key={m.code}>
                <a href={withAttribution(`${m.baseUrl}/`, attr)} className="group flex h-full flex-col rounded-[1.25rem] border border-[var(--nlg-linha-escura)] bg-[var(--nlg-marinho-2)] p-5 transition-colors hover:border-[var(--nlg-luminoso)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nlg-luminoso)]">
                  <span className="flex h-12 items-center"><BrandLogo brand={m} tone="on-dark" className="h-8 max-w-full" /></span>
                  <span className="mt-4 flex-1 text-base text-[var(--nlg-texto-suave)]">{m.tagline}.</span>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white">Conhecer <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /><span className="sr-only">{m.name}</span></span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {vitrine ? <VitrineSecoes v={vitrine} porta={porta} previa={previa && !finFlag("FIN_SOLUTIONS_V2")} cursosHref={withAttribution("/loja-nextlevel", attr)} /> : <>
      <section id="jornada" className="px-4 py-16" aria-labelledby="jor-t">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-link">Método</p>
          <h2 id="jor-t" className={`${H2} mt-3`}>Uma jornada em cinco fases.</h2>
          <p className="mt-3 max-w-3xl text-lg text-muted-foreground">Cada fase tem um objetivo e soluções que ajudam a cumprir. Dentro do painel, a jornada mede o que já está pronto na sua loja e mostra o próximo passo.</p>
          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {journey.phases.map((p, i) => (
              <li key={p.key} className="flex flex-col rounded-[1.25rem] border border-border bg-surface p-5">
                <span aria-hidden className="grid size-11 place-items-center rounded-full bg-[var(--nlg-marinho)] font-[family-name:var(--nl-font-display)] text-lg font-extrabold text-[var(--nlg-luminoso)] ring-1 ring-[var(--nlg-linha-escura)]">{i + 1}</span>
                <h3 className="mt-4 text-xl font-extrabold"><span className="sr-only">Fase {i + 1}: </span>{p.name}</h3>
                <p className="mt-2 text-base text-body">{p.goal}</p>
                <ul className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">{pub.filter((x) => x.phase === p.key).slice(0, 4).map((x) => <li key={x.key}><Link href={withAttribution(`/solucoes/${x.slug}`, attr)} className="text-link underline underline-offset-2">{x.name}</Link></li>)}</ul>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="catalogo" className="bg-highlight-soft px-4 py-16" aria-labelledby="cat-t">
        <div className="mx-auto max-w-6xl">
          <h2 id="cat-t" className={H2}>Soluções e preços.</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">Preço claro quando ele é fixo; sob consulta quando depende do seu cenário. Pix com desconto e cartão parcelado onde o produto permite.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-border bg-surface p-5">
              <FamiliaFoto family="COMMERCE_PLAN" className="mb-4 !rounded-lg" />
              <h3 className="text-xl font-bold">Plataforma NextLevel Commerce</h3>
              <p className="mt-1 text-sm text-muted-foreground">Loja virtual com sua marca, temas, Pix e cartão na sua conta.{plans.offer ? ` Clientes novos: ${plans.offer.trialDays} dias grátis e taxa zero da plataforma.` : ""}</p>
              <ul className="mt-3 space-y-1 text-sm">{plans.plans.map((p) => <li key={p.key}><Link className="font-semibold text-link underline" href={withAttribution(`/solucoes/${p.slug}`, attr)}>{p.name}</Link>: {p.quote ? "sob consulta" : `${formatBRL(p.monthlyCents ?? 0)}/mês ou ${formatBRL(p.annualCents ?? 0)}/ano · taxa ${((p.feeBps ?? 0) / 100).toString().replace(".", ",")}%`}</li>)}</ul>
              <Link href={commerceHref} className="mt-4 inline-flex text-sm font-semibold text-link underline">Conhecer a NextLevel Commerce →</Link>
            </article>
            {families.filter((f) => f !== "COMMERCE_PLAN").map((f) => {
              const list = pub.filter((x) => x.family === f);
              if (!list.length) return null;
              return (
                <article key={f} className="rounded-xl border border-border bg-surface p-5">
                  <FamiliaFoto family={f} className="mb-4 !rounded-lg" />
                  <h3 className="text-xl font-bold">{FAMILY_LABEL[f]}</h3>
                  <ul className="mt-3 space-y-2 text-sm">{list.map((x) => <li key={x.key}><Link className="font-semibold text-link underline" href={withAttribution(`/solucoes/${x.slug}`, attr)}>{x.name}</Link>: <span className="tabular-nums">{priceLines(x).main}</span><span className="block text-xs text-muted-foreground">{x.tagline}</span></li>)}</ul>
                  {f === "MARKETING" ? <p className="mt-3 text-xs text-muted-foreground">A verba de anúncios é paga por você direto à plataforma (Meta, Google, Mercado Livre) e nunca passa pela NextLevel.</p> : null}
                </article>
              );
            })}
            <article className="rounded-xl border border-border bg-surface p-5">
              <FamiliaFoto family="TEMA" className="mb-4 !rounded-lg" />
              <h3 className="text-xl font-bold">Temas</h3>
              <p className="mt-1 text-sm text-muted-foreground">Compra única, sem mensalidade, com loja de demonstração para ver antes.</p>
              <Link href={withAttribution(`${brand.code === "NEXTLEVEL_COMMERCE" ? "" : commerce.baseUrl}/temas`, attr)} className="mt-4 inline-flex text-sm font-semibold text-link underline">Ver os temas →</Link>
            </article>
            <article className="rounded-xl border border-border bg-surface p-5">
              <FotoOpcional marca="nextlevel" nome="nl-solucoes-hero" alt="" ratio="16 / 9" className="mb-4 !rounded-lg" />
              <h3 className="text-xl font-bold">Cursos e assessorias</h3>
              <p className="mt-1 text-sm text-muted-foreground">Produtos digitais e assessorias com compra em 1 clique, sem precisar de conta.</p>
              <Link href={withAttribution("/loja-nextlevel", attr)} className="mt-4 inline-flex text-sm font-semibold text-link underline">Ver a Loja NextLevel →</Link>
            </article>
          </div>
        </div>
      </section>
      </>}

      <section className="px-4 py-16" aria-labelledby="junto-t">
        <div className="mx-auto max-w-6xl">
          <h2 id="junto-t" className={H2}>Três caminhos. Você escolhe.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[["Fazer sozinho", "Você configura tudo, no seu tempo. Funciona bem para quem tem conhecimento técnico e tempo livre; o risco é deixar brechas no checkout, no frete e na mensuração."], ["Contratar um produto isolado", "Resolve um ponto específico (um tema, uma migração, uma campanha). Bom quando você já sabe exatamente o que falta."]].map(([t, d]) => <div key={t} className="rounded-[1.25rem] border border-border bg-surface p-6"><h3 className="text-lg font-bold">{t}</h3><p className="mt-2 text-muted-foreground">{d}</p></div>)}
            <div className="rounded-[1.25rem] bg-[var(--nlg-marinho)] p-6 text-[var(--nlg-gelo)] ring-1 ring-[var(--nlg-linha-escura)]">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--nlg-luminoso)]">Recomendado</p>
              <h3 className="mt-2 text-lg font-bold">Evoluir pela jornada NextLevel</h3>
              <p className="mt-2 text-[var(--nlg-texto-suave)]">O diagnóstico aponta a fase em que você está e o próximo passo. Cada solução prepara a seguinte, e um parceiro pode acompanhar você do começo ao fim.</p>
              <a href="#diagnostico" className="mt-4 inline-flex items-center gap-2 font-semibold text-[var(--nlg-link-escuro)] underline underline-offset-4">Começar pelo diagnóstico <ArrowDown className="size-4" aria-hidden /></a>
            </div>
          </div>
        </div>
      </section>

      <SecaoEquipe code="NEXTLEVEL" nomeDaMarca="NextLevel" className="text-foreground" />

      <CartaFundador className="bg-surface text-foreground" />

      <section id="duvidas" className="px-4 pb-16" aria-labelledby="faq-t">
        <div className="mx-auto max-w-3xl">
          <h2 id="faq-t" className={H2}>Dúvidas.</h2>
          <div className="mt-8 divide-y divide-border rounded-[1.25rem] border border-border bg-surface">
            {FAQ_SOLUCOES.map((f) => (
              <details key={f.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-md text-lg font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">{f.q}<span aria-hidden className="text-2xl leading-none text-link transition-transform group-open:rotate-45">+</span></summary>
                <p className="mt-2 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <FechoMarca slug="nextlevel" cta={{ href: "#diagnostico", label: "Fazer diagnóstico gratuito" }} />

      <section id="diagnostico" className="scroll-mt-20 bg-highlight-soft px-4 py-16" aria-labelledby="diag-t">
        <div className="mx-auto max-w-3xl">
          {vitrine && fotoSolucoes("sol-campanha-diagnostico") ? (
            // eslint-disable-next-line @next/next/no-img-element -- foto estática da vitrine (lote 3), decorativa
            <img src={`${fotoSolucoes("sol-campanha-diagnostico")}-1600.webp`} srcSet={`${fotoSolucoes("sol-campanha-diagnostico")}-800.webp 800w, ${fotoSolucoes("sol-campanha-diagnostico")}-1600.webp 1600w`} sizes="(min-width: 768px) 48rem, 100vw" alt="" width={1600} height={1067} loading="lazy" decoding="async" className="mb-8 aspect-[3/1] w-full rounded-[1.25rem] object-cover object-[60%_45%]" />
          ) : null}
          <h2 id="diag-t" className={H2}>Diagnóstico gratuito.</h2>
          <p className="mt-3 text-muted-foreground">Conte em que momento está o seu negócio. Respondemos com o próximo passo recomendado, sem compromisso.</p>
          <div className="mt-6 flex items-center gap-4 rounded-2xl bg-surface/70 p-3">
            <FotoEquipeLeve nome={USOS_EQUIPE["solucoes-diagnostico"].fotos[0]!} className="block h-20 w-28 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-36" />
            <p className="text-sm"><b>{USOS_EQUIPE["solucoes-diagnostico"].titulo}.</b> {USOS_EQUIPE["solucoes-diagnostico"].texto}</p>
          </div>
          <div className="mt-6"><DiagnosticoForm needs={Object.entries(DIAGNOSTIC_NEEDS)} /></div>
          {contato.whatsappUrl || contato.email ? (
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <span className="text-muted-foreground">Prefere conversar?</span>
              {contato.whatsappUrl ? <a href={contato.whatsappUrl.replace(/text=.*$/, `text=${encodeURIComponent("Olá! Quero conversar sobre as soluções da NextLevel.")}`)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-link underline underline-offset-4"><MessageCircle className="size-4" aria-hidden />WhatsApp</a> : null}
              {contato.email ? <a href={`mailto:${contato.email}`} className="inline-flex min-h-11 items-center gap-2 font-semibold text-link underline underline-offset-4"><Mail className="size-4" aria-hidden />{contato.email}</a> : null}
            </div>
          ) : null}
        </div>
      </section>
      {/* Ecossistema tudo em um (D336): a agência leva às outras três frentes, no site da Commerce. */}
      {businessLigado() ? <TambemDaNextLevel atual="solucoes" solucoesHref="/solucoes" base={brand.code === "NEXTLEVEL_COMMERCE" ? "" : commerce.baseUrl} /> : null}
    </>
  );
  return vitrine ? <SelecaoProvider catalogo={[...vitrine.itens]}>{conteudo}</SelecaoProvider> : conteudo;
}
