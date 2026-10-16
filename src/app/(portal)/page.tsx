import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";
import { brandHas, isClosedCommerceBrand } from "@/lib/brand";
import { getDb } from "@/db/client";
import { listPublicBrasVideos } from "@/lib/domain/bras/videos";
import { CargasHome } from "@/components/portal/cargas/cargas-home";
import { getBrasAnalysisSettings } from "@/lib/domain/bras/descobertas";
import { BrasHome } from "@/components/portal/bras/bras-home";
import { getBrand, groupLink } from "@/lib/brand-server";
import { robotsForBrandPortal } from "@/lib/bras/visibility";
import { CommerceHome } from "@/components/portal/commerce-home";
import { SoonHome } from "@/components/portal/soon-home";
import { JsonLd } from "@/components/portal/json-ld";
import { FAQ } from "./content";
import { SuperDropHomeV4 } from "@/components/portal/superdrop/home-v4";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  // Brás: prévia de link própria quando a imagem existir (D105; redes não leem AVIF, por isso PNG/JPG/WebP).
  const og = isClosedCommerceBrand(brand) ? (["jpg", "png", "webp"] as const).find((e) => existsSync(join(process.cwd(), "public", "portal", "bras", "v3", `bd-og-portal.${e}`))) : undefined;
  return { title: { absolute: `${brand.name} · ${brand.tagline}` }, description: brand.description, alternates: { canonical: "/" }, ...(robotsForBrandPortal(brand) ? { robots: robotsForBrandPortal(brand) } : {}), ...(og ? { openGraph: { title: brand.name, description: brand.description, images: [{ url: `/portal/bras/v3/bd-og-portal.${og}`, width: 1200, height: 630 }] } } : {}) };
}

export default async function Portal() {
  const session = await getSession();
  if (session) redirect(homeFor(session.user.role));
  const brand = await getBrand();
  const solucoes = await groupLink("/solucoes");
  // Marca com página inicial própria (NextLevel Cargas, D108).
  if (brand.landing === "cargas") return <CargasHome brand={brand} />;
  // Produto ainda sem sistema (Brás Digital, Hub Creators, China Hub): página "em breve" com lista de espera.
  if (brand.soon) return <SoonHome brand={brand} />;
  // Operação fechada já aberta (Brás Digital, D92): apresentação, vídeos de análise e cadastro; nunca preço.
  if (isClosedCommerceBrand(brand)) { const db = await getDb(); return <BrasHome brand={brand} videos={await listPublicBrasVideos(db)} analysis={await getBrasAnalysisSettings(db)} />; }
  // Marcas sem dropshipping (NextLevel Commerce) têm portal próprio.
  if (!brandHas(brand, "dropship")) return <CommerceHome brand={brand} />;
  const faq = FAQ.slice(0, 5);
  return (
    <>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: "SuperDrop", url: "https://superdrop.com.br", logo: "https://superdrop.com.br/brand/v2/superdrop/claro/assinatura-completa-640.png", parentOrganization: { "@type": "Organization", name: "NextLevel Marketing Ltda" } },
        { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "SuperDrop", applicationCategory: "BusinessApplication", operatingSystem: "Web", description: "Loja online sem estoque para quem vende, com fornecedores que separam e enviam." },
        { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      ]} />

      <SuperDropHomeV4 faq={faq} solucoes={solucoes} />
    </>
  );
}
