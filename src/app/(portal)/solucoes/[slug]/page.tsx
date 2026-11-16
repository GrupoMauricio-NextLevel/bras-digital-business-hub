import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { getBrand } from "@/lib/brand-server";
import { HOLDING_CODE, brandByCode } from "@/lib/brand";
import { groupSiteUrl } from "@/lib/host-routing";
import { ogImageFor } from "@/lib/og-marca";
import { finFlag } from "@/lib/finance/flags";
import { getCatalogItem } from "@/lib/domain/nl-catalog";
import { ProductLanding } from "@/components/nl-store/product-landing";
import { landingContext } from "@/components/nl-store/landing-data";
import { JsonLd } from "@/components/portal/json-ld";
import { currentAttribution, withAttribution } from "@/lib/attribution";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getCatalogItem(await getDb(), { slug: (await params).slug });
  const brand = await getBrand();
  if (!p || !p.audience.includes("PUBLIC")) return { title: "Solução não encontrada", robots: { index: false } };
  const url = `${brand.code === HOLDING_CODE ? groupSiteUrl() : brand.baseUrl}/solucoes/${p.slug}`;
  return { title: `${p.name} · NextLevel Business`, description: p.summary, alternates: { canonical: url }, openGraph: { title: p.name, description: p.summary, url, siteName: "NextLevel", type: "website", locale: "pt_BR", images: [ogImageFor(brandByCode("NEXTLEVEL"))] } };
}

/** Landing pública canônica do produto (`/solucoes/<slug>`), alimentada pelo catálogo Master. */
export default async function SolucaoPublica({ params }: { params: Promise<{ slug: string }> }) {
  if (!finFlag("FIN_PUBLIC_SOLUTIONS")) notFound();
  const db = await getDb();
  const p = await getCatalogItem(db, { slug: (await params).slug });
  if (!p || !p.audience.includes("PUBLIC")) notFound();
  const [brand, attr] = await Promise.all([getBrand(), currentAttribution()]);
  const commerce = brandByCode("NEXTLEVEL_COMMERCE");
  const ctx = await landingContext(db, p, (s) => withAttribution(`/solucoes/${s}`, attr));
  const commerceBase = brand.code === "NEXTLEVEL_COMMERCE" ? "" : commerce.baseUrl;
  const voltar = `/login?voltar=${encodeURIComponent(`/merchant/services/solucao/${p.slug}`)}`;
  const signupHref = p.family === "COMMERCE_PLAN" ? withAttribution(commerce.signupOpen ? `${commerceBase}/cadastro?plano=${p.key}` : `${commerceBase}/quero-minha-loja`, attr) : voltar;
  // No site do grupo não há login de lojista (D149): cada cliente entra pelo endereço da marca da loja dele.
  const loginLinks = brand.code === HOLDING_CODE && p.family !== "COMMERCE_PLAN" ? [{ label: "Entrar pela loja SuperDrop", href: `${brandByCode("SUPERDROP").baseUrl}${voltar}` }, { label: "Entrar pela loja Commerce", href: `${commerce.baseUrl}${voltar}` }] : undefined;
  const offerPrice = p.prices.MONTHLY?.amountCents ?? p.prices.ONE_TIME?.amountCents ?? null;
  return (
    <div className="px-4 py-12">
      <JsonLd data={[{ "@context": "https://schema.org", "@type": "Service", name: p.name, description: p.summary, provider: { "@type": "Organization", name: "NextLevel Marketing Ltda." }, areaServed: "BR", ...(offerPrice !== null && p.kind !== "quote_required" ? { offers: { "@type": "Offer", priceCurrency: "BRL", price: (offerPrice / 100).toFixed(2), url: `${brand.code === HOLDING_CODE ? groupSiteUrl() : brand.baseUrl}/solucoes/${p.slug}` } } : {}) }]} />
      <ProductLanding product={p} mode="public" unlocks={ctx.unlocks} related={ctx.related} signupHref={signupHref} loginLinks={loginLinks} />
    </div>
  );
}
