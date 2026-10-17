import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, Check } from "lucide-react";
import { getDb } from "@/db/client";
import { getBrand } from "@/lib/brand-server";
import { groupSiteUrl } from "@/lib/host-routing";
import { brandByCode } from "@/lib/brand";
import { ogImageFor } from "@/lib/og-marca";
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
import { FamiliaFoto } from "@/components/nl-store/familia-foto";
import { AberturaMarca, FechoMarca, VitrineMarca } from "@/components/portal/marca-institucional";
import { BrandLogo } from "@/components/brand/brand-logo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const title = "NextLevel Soluções para empresas: loja virtual, migração, temas e marketing";
  const description = "Diagnóstico gratuito e uma jornada clara: fundação, lançamento, aquisição, otimização e escala. Plataforma Commerce, SuperDrop, Loja Pronta, Migração, temas, tráfego e White Label.";
  return { title: { absolute: title }, description, alternates: { canonical: `${groupSiteUrl()}/solucoes` }, openGraph: { title, description, url: `${groupSiteUrl()}/solucoes`, siteName: "NextLevel", type: "website", locale: "pt_BR", images: [ogImageFor(brandByCode("NEXTLEVEL"))] } };
}

const H2 = "font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight sm:text-4xl";

export default async function SolucoesPage() {
  if (!finFlag("FIN_PUBLIC_SOLUTIONS")) notFound();
  const db = await getDb();
  const [brand, items, journey, plans, attr] = await Promise.all([getBrand(), listCatalog(db), getJourneyConfig(db), commercePlansView(db), currentAttribution()]);
  const commerce = brandByCode("NEXTLEVEL_COMMERCE");
  const superdrop = brandByCode("SUPERDROP");
  const pub = items.filter((i) => i.audience.includes("PUBLIC") && i.family !== "TEMA");
  const families = ["COMMERCE_PLAN", "LOJA_PRONTA", "MIGRACAO", "MARKETING", "CONSULTORIA", "WHITE_LABEL"] as const;
  const commerceHref = withAttribution(`${brand.code === "NEXTLEVEL_COMMERCE" ? "" : commerce.baseUrl}/planos`, attr);
  const superdropHref = withAttribution(`${brand.code === "SUPERDROP" ? "" : superdrop.baseUrl}/`, attr);
  const MARCAS_DO_GRUPO = [superdrop, commerce, brandByCode("BRAS_DIGITAL"), brandByCode("NEXTLEVEL_CARGAS")];
  return (
    <>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: "NextLevel Marketing Ltda.", url: `${groupSiteUrl()}/solucoes`, brand: ["NextLevel Commerce", "SuperDrop"].map((n) => ({ "@type": "Brand", name: n })) },
        { "@context": "https://schema.org", "@type": "ItemList", name: "Soluções NextLevel", itemListElement: pub.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${groupSiteUrl()}/solucoes/${p.slug}`, name: p.name })) },
      ]} />
      <AberturaMarca
        slug="nextlevel"
        eyebrow="Soluções para empresas que vendem online"
        titulo={<>Estrutura digital para o seu negócio <span className="text-[#F5BC00]">ir além.</span></>}
        texto="Loja virtual, revenda sem estoque, loja montada pela equipe, migração, temas e marketing, do mesmo grupo. Comece pelo diagnóstico gratuito e receba o próximo passo por escrito."
        foto={{ nome: "hero-key-visual", posicao: "68% 50%", alt: "Equipe da NextLevel reunida numa mesa de trabalho, com o centro de distribuição ao fundo" }}
        ctas={[{ href: "#diagnostico", label: "Fazer diagnóstico gratuito", primary: true }, { href: "#catalogo", label: "Ver soluções e preços" }]}
      >
        <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#F4F1E9]/80">
          {["Diagnóstico sem custo", "Preço publicado ou proposta por escrito", "Sem promessa de faturamento"].map((t) => <li key={t} className="flex items-center gap-2"><Check className="size-4 text-[#F5BC00]" aria-hidden />{t}</li>)}
        </ul>
      </AberturaMarca>

      <section aria-labelledby="marcas-t" className="border-b border-border bg-canvas">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-10 gap-y-5 px-4 py-8">
          <h2 id="marcas-t" className="text-sm font-semibold text-muted-foreground">As marcas do grupo:</h2>
          <ul className="flex flex-wrap items-center gap-x-10 gap-y-5">
            {MARCAS_DO_GRUPO.map((m) => (
              <li key={m.code}><a href={withAttribution(`${m.baseUrl}/`, attr)} className="flex items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"><BrandLogo brand={m} className="h-8 md:h-9" /></a></li>
            ))}
          </ul>
        </div>
      </section>
      <VitrineMarca slug="nextlevel" titulo="Uma estrutura, várias frentes" comFoto={false} />

      <section id="jornada" className="px-4 py-16" aria-labelledby="jor-t">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-link">Como trabalhamos</p>
          <h2 id="jor-t" className={`${H2} mt-3`}>Uma jornada em cinco fases.</h2>
          <p className="mt-3 max-w-3xl text-lg text-muted-foreground">Cada fase tem um objetivo e soluções que ajudam a cumprir. Dentro do painel, a jornada mede o que já está pronto na sua loja e mostra o próximo passo.</p>
          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {journey.phases.map((p, i) => (
              <li key={p.key} className="flex flex-col rounded-[1.25rem] border border-border bg-surface p-5">
                <span aria-hidden className="grid size-11 place-items-center rounded-full bg-[#101B34] font-[family-name:var(--nl-font-display)] text-lg font-extrabold text-[#F5BC00]">{i + 1}</span>
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
              <p className="mt-1 text-sm text-muted-foreground">Loja virtual com sua marca, temas, Pix e cartão na sua conta.{plans.offer ? ` Clientes novos: ${plans.offer.trialDays} dias grátis, 1º mês por ${formatBRL(plans.offer.firstPeriodCents ?? 0)} e taxa de plataforma zero por ${plans.offer.feeHolidayMonths} meses.` : ""}</p>
              <ul className="mt-3 space-y-1 text-sm">{plans.plans.map((p) => <li key={p.key}><Link className="font-semibold text-link underline" href={withAttribution(`/solucoes/${p.slug}`, attr)}>{p.name}</Link>: {p.quote ? "sob consulta" : `${formatBRL(p.monthlyCents ?? 0)}/mês ou ${formatBRL(p.annualCents ?? 0)}/ano · taxa ${((p.feeBps ?? 0) / 100).toString().replace(".", ",")}%`}</li>)}</ul>
              <Link href={commerceHref} className="mt-4 inline-flex text-sm font-semibold text-link underline">Conhecer a NextLevel Commerce →</Link>
            </article>
            <article id="superdrop" className="rounded-xl border border-border bg-surface p-5">
              {/* eslint-disable-next-line @next/next/no-img-element -- WebP estático do kit SuperDrop */}
              <img src="/marcas/superdrop/imagens/hero-key-visual-800.webp" alt="" width={800} height={450} loading="lazy" decoding="async" className="mb-4 aspect-video w-full rounded-lg object-cover" style={{ objectPosition: "72% 45%" }} />
              <h3 className="text-xl font-bold">SuperDrop</h3>
              <p className="mt-1 text-sm text-muted-foreground">Revenda sem estoque: fornecedores parceiros separam e enviam; o lojista vende com a própria loja e fica com 100% das vendas. Fornecedores recebem as recargas direto na conta deles.</p>
              <Link href={superdropHref} className="mt-4 inline-flex text-sm font-semibold text-link underline">Conhecer o SuperDrop →</Link>
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

      <section className="px-4 py-16" aria-labelledby="junto-t">
        <div className="mx-auto max-w-6xl">
          <h2 id="junto-t" className={H2}>Três caminhos. Você escolhe.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[["Fazer sozinho", "Você configura tudo, no seu tempo. Funciona bem para quem tem conhecimento técnico e tempo livre; o risco é deixar brechas no checkout, no frete e na mensuração."], ["Contratar um produto isolado", "Resolve um ponto específico (um tema, uma migração, uma campanha). Bom quando você já sabe exatamente o que falta."]].map(([t, d]) => <div key={t} className="rounded-[1.25rem] border border-border bg-surface p-6"><h3 className="text-lg font-bold">{t}</h3><p className="mt-2 text-muted-foreground">{d}</p></div>)}
            <div className="rounded-[1.25rem] bg-[#101B34] p-6 text-[#F4F1E9]">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#F5BC00]">Recomendado</p>
              <h3 className="mt-2 text-lg font-bold">Evoluir pela jornada NextLevel</h3>
              <p className="mt-2 text-[#F4F1E9]/85">O diagnóstico aponta a fase em que você está e o próximo passo. Cada solução prepara a seguinte, e um parceiro pode acompanhar você do começo ao fim.</p>
              <a href="#diagnostico" className="mt-4 inline-flex items-center gap-2 font-semibold text-[#F5BC00] underline underline-offset-4">Começar pelo diagnóstico <ArrowDown className="size-4" aria-hidden /></a>
            </div>
          </div>
        </div>
      </section>

      <FechoMarca slug="nextlevel" cta={{ href: "#diagnostico", label: "Fazer diagnóstico gratuito" }} />

      <section id="diagnostico" className="scroll-mt-20 bg-highlight-soft px-4 py-16" aria-labelledby="diag-t">
        <div className="mx-auto max-w-3xl">
          <h2 id="diag-t" className={H2}>Diagnóstico gratuito.</h2>
          <p className="mt-3 text-muted-foreground">Conte em que momento está o seu negócio. Respondemos com o próximo passo recomendado, sem compromisso.</p>
          <div className="mt-6"><DiagnosticoForm needs={Object.entries(DIAGNOSTIC_NEEDS)} /></div>
        </div>
      </section>
    </>
  );
}
