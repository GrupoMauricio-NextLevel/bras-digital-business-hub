import { metadadosDaPagina } from "@/lib/seo/metadados";
import type { Metadata } from "next";
import { ogImageFor } from "@/lib/og-marca";
import { BDC } from "@/lib/marcas/bras-digital-club";
import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";
import { isClosedCommerceBrand } from "@/lib/brand";
import { getDb } from "@/db/client";
import { listPublicBrasVideos } from "@/lib/domain/bras/videos";
import { CargasHome } from "@/components/portal/cargas/cargas-home";
import { getBrasAnalysisSettings } from "@/lib/domain/bras/descobertas";
import { BrasHome } from "@/components/portal/bras/bras-home";
import { getBrand } from "@/lib/brand-server";
import { robotsForBrandPortal } from "@/lib/bras/visibility";
import { HomeImersivaEc } from "@/components/portal/commerce/imersiva/home-imersiva";
import { SoonHome } from "@/components/portal/soon-home";
import { JsonLd } from "@/components/portal/json-ld";
import { FAQ } from "./content";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  if (brand.code === "NEXTLEVEL_COMMERCE") return metadadosDaPagina("/");
  // Brás Digital Club (D158): prévia de link do pacote da marca (`ogImageFor`) e sem endereço canônico até a extensão do
  // domínio definitivo ser confirmada (o nome-base é brasdigitalclub). As outras marcas não mudam.
  const closed = isClosedCommerceBrand(brand);
  return {
    title: { absolute: `${brand.name} · ${brand.tagline}` }, description: brand.description,
    // Brás: canônico só quando o endereço no ar for o domínio próprio (brasdigitalclub.com.br).
    ...(!closed || brand.baseUrl === BDC.canonicalUrl ? { alternates: { canonical: "/" } } : {}),
    ...(robotsForBrandPortal(brand) ? { robots: robotsForBrandPortal(brand) } : {}),
    ...(closed ? { openGraph: { title: `${brand.name} · ${brand.tagline}`, description: brand.description, images: [ogImageFor(brand)] }, twitter: { card: "summary_large_image", title: brand.name, description: brand.tagline, images: [ogImageFor(brand).url] } } : {}),
  };
}

export default async function Portal({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Prévia das jornadas imersivas (D167) enquanto as fotos da marca estão em produção.
  const previa = (await searchParams).previa === "imersiva";
  const session = await getSession();
  if (session) redirect(homeFor(session.user.role));
  const brand = await getBrand();
  // Marca com página inicial própria (NextLevel Cargas, D108).
  if (brand.landing === "cargas") return <CargasHome brand={brand} previa={previa} />;
  // Produto ainda sem sistema (Brás Digital Club fechado, Hub Creators, China Hub): página "em breve" com lista de espera.
  if (brand.soon) return <SoonHome brand={brand} />;
  // Operação fechada já aberta (Brás Digital, D92): apresentação, vídeos de análise e cadastro; nunca preço.
  if (isClosedCommerceBrand(brand)) { const db = await getDb(); return <BrasHome brand={brand} videos={await listPublicBrasVideos(db)} analysis={await getBrasAnalysisSettings(db)} previa={previa} />; }
  // Marcas sem dropshipping (NextLevel Commerce) têm portal próprio: a home imersiva (D165).
  // A home antiga de dropshipping saiu do código: toda marca aberta usa a imersiva.
  const faq = FAQ.slice(0, 5);
  return (
    <>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: brand.name, url: brand.baseUrl, parentOrganization: { "@type": "Organization", name: "NextLevel Marketing Ltda" } },
        { "@context": "https://schema.org", "@type": "SoftwareApplication", name: brand.name, applicationCategory: "BusinessApplication", operatingSystem: "Web", description: brand.description },
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      ]} />

      <HomeImersivaEc brand={brand} />
    </>
  );
}
