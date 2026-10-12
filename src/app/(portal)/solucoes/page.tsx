import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
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
import { FotoOpcional, formatosDisponiveis } from "@/components/portal/imagem-em-criacao";
import { FamiliaFoto } from "@/components/nl-store/familia-foto";
import { FechoMarca, VitrineMarca } from "@/components/portal/marca-institucional";

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
  const heroFoto = formatosDisponiveis("nextlevel", "nl-solucoes-hero").length > 0;
  const families = ["COMMERCE_PLAN", "LOJA_PRONTA", "MIGRACAO", "MARKETING", "CONSULTORIA", "WHITE_LABEL"] as const;
  const commerceHref = withAttribution(`${brand.code === "NEXTLEVEL_COMMERCE" ? "" : commerce.baseUrl}/planos`, attr);
  const superdropHref = withAttribution(`${brand.code === "SUPERDROP" ? "" : superdrop.baseUrl}/`, attr);
  return (
    <>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: "NextLevel Marketing Ltda.", url: `${groupSiteUrl()}/solucoes`, brand: ["NextLevel Commerce", "SuperDrop"].map((n) => ({ "@type": "Brand", name: n })) },
        { "@context": "https://schema.org", "@type": "ItemList", name: "Soluções NextLevel", itemListElement: pub.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${groupSiteUrl()}/solucoes/${p.slug}`, name: p.name })) },
      ]} />
      <section className="bg-band px-4 py-16 text-band-foreground md:py-24" aria-labelledby="hero-t">
        <div className={`mx-auto max-w-6xl ${heroFoto ? "grid items-center gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]" : ""}`}>
          <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-band-muted">NextLevel Soluções para empresas</p>
          <h1 id="hero-t" className="nl-display mt-3 max-w-4xl">Do primeiro produto cadastrado à operação em escala, com um próximo passo claro.</h1>
          <p className="mt-5 max-w-2xl text-lg text-band-muted">Para marcas e lojistas que vendem online no Brasil. Plataforma de loja virtual, revenda sem estoque, loja montada pela equipe, migração, temas e marketing, organizados numa jornada. Comece pelo diagnóstico gratuito.</p>
          <div className="mt-8 flex flex-wrap gap-3"><a href="#diagnostico" className="ds-pub-btn">Fazer diagnóstico gratuito <ArrowRight className="size-4" aria-hidden /></a><a href="#catalogo" className="ds-pub-btn" style={{ background: "transparent", color: "inherit", borderColor: "currentColor", boxShadow: "none" }}>Ver soluções</a></div>
          </div>
          {heroFoto ? <FotoOpcional marca="nextlevel" nome="nl-solucoes-hero" alt="Duas pessoas da equipe trabalhando lado a lado: uma monta a vitrine de uma loja no notebook, a outra organiza fotos de produto." priority className="!rounded-2xl" /> : null}
        </div>
      </section>
      <VitrineMarca slug="nextlevel" titulo="Uma estrutura, várias frentes" />

      <section id="jornada" className="px-4 py-16" aria-labelledby="jor-t">
        <div className="mx-auto max-w-6xl">
          <h2 id="jor-t" className={H2}>Uma jornada em cinco fases.</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">Cada fase tem um objetivo e soluções que ajudam a cumprir. Dentro do painel, a jornada mede o que já está pronto na sua loja e mostra o próximo passo.</p>
          <ol className="mt-8 grid gap-4 md:grid-cols-5">
            {journey.phases.map((p, i) => (
              <li key={p.key} className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground">Fase {i + 1}</p>
                <h3 className="text-lg font-bold">{p.name}</h3>
                <p className="mt-1 text-sm">{p.goal}</p>
                <ul className="mt-3 space-y-1 text-xs">{pub.filter((x) => x.phase === p.key).slice(0, 4).map((x) => <li key={x.key}><Link href={withAttribution(`/solucoes/${x.slug}`, attr)} className="text-link underline">{x.name}</Link></li>)}</ul>
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
              <h3 className="text-xl font-bold">Cursos e assessorias</h3>
              <p className="mt-1 text-sm text-muted-foreground">Produtos digitais e assessorias com compra em 1 clique, sem precisar de conta.</p>
              <Link href={withAttribution("/loja-nextlevel", attr)} className="mt-4 inline-flex text-sm font-semibold text-link underline">Ver a Loja NextLevel →</Link>
            </article>
          </div>
        </div>
      </section>

      <section className="px-4 py-16" aria-labelledby="junto-t">
        <div className="mx-auto max-w-6xl">
          <h2 id="junto-t" className={H2}>Produto, serviço e parceiro trabalhando juntos.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[["Fazer sozinho", "Você configura tudo, no seu tempo. Funciona bem para quem tem conhecimento técnico e tempo livre; o risco é deixar brechas no checkout, no frete e na mensuração."], ["Contratar um produto isolado", "Resolve um ponto específico (um tema, uma migração, uma campanha). Bom quando você já sabe exatamente o que falta."], ["Evoluir pela jornada NextLevel", "O diagnóstico aponta a fase em que você está e o próximo passo. Cada solução prepara a seguinte, e um parceiro pode acompanhar você do começo ao fim."]].map(([t, d]) => <div key={t} className="rounded-xl border border-border p-5"><h3 className="font-bold">{t}</h3><p className="mt-2 text-sm text-muted-foreground">{d}</p></div>)}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">Resultados de clientes: publicamos apenas casos com autorização e números verificáveis. Esta seção fica vazia até lá.</p>
        </div>
      </section>

      <section id="diagnostico" className="scroll-mt-20 bg-highlight-soft px-4 py-16" aria-labelledby="diag-t">
        <div className="mx-auto max-w-3xl">
          <h2 id="diag-t" className={H2}>Diagnóstico gratuito.</h2>
          <p className="mt-3 text-muted-foreground">Conte em que momento está o seu negócio. Respondemos com o próximo passo recomendado, sem compromisso.</p>
          <div className="mt-6"><DiagnosticoForm needs={Object.entries(DIAGNOSTIC_NEEDS)} /></div>
        </div>
      </section>
      <FechoMarca slug="nextlevel" cta={{ href: "#diagnostico", label: "Fazer diagnóstico gratuito" }} />
    </>
  );
}
