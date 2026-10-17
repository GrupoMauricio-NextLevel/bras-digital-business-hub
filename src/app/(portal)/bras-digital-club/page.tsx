import type { Metadata } from "next";
import { getDb } from "@/db/client";
import { brandByCode } from "@/lib/brand";
import { BDC } from "@/lib/marcas/bras-digital-club";
import { listPublicBrasVideos } from "@/lib/domain/bras/videos";
import { getBrasAnalysisSettings } from "@/lib/domain/bras/descobertas";
import { BrasHome } from "@/components/portal/bras/bras-home";
import { AreaTheme } from "@/design-system/components/area-theme";
import { ogImageFor } from "@/lib/og-marca";

export const dynamic = "force-dynamic";

/** Sem endereço canônico até a extensão do domínio ser confirmada; página espelho, fora dos buscadores. */
export function generateMetadata(): Metadata {
  const brand = brandByCode("BRAS_DIGITAL");
  return { title: { absolute: `${BDC.name} · ${BDC.tagline}` }, description: brand.description, robots: { index: false, follow: true }, openGraph: { title: `${BDC.name} · ${BDC.tagline}`, description: brand.description, images: [ogImageFor(brand)] } };
}

/**
 * Página institucional do Brás Digital Club em `/bras-digital-club` (D158). Nos endereços das marcas e do grupo a rota leva à
 * página inicial do endereço da Brás (`routeHost`); aqui ela só abre em endereço técnico (demonstração), com o tema da marca.
 */
export default async function BrasDigitalClubPage() {
  const db = await getDb();
  const [videos, analysis] = await Promise.all([listPublicBrasVideos(db), getBrasAnalysisSettings(db)]);
  return <><AreaTheme theme="bras" brand="BRAS_DIGITAL" /><BrasHome brand={brandByCode("BRAS_DIGITAL")} videos={videos} analysis={analysis} /></>;
}
