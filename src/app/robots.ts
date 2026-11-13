import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { HOLDING_CODE, brandOfHostStrict } from "@/lib/brand";
import { groupSiteUrl } from "@/lib/host-routing";
import { ROBOS_DE_IA, robotsPlan } from "@/lib/seo-marca";

export const dynamic = "force-dynamic";

/** robots.txt do endereço que pediu (D149): cada marca o dela; demonstração e escritório ficam fora da busca. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(":")[0]!.toLowerCase();
  const brand = brandOfHostStrict(host);
  const office = !!brand?.officeUrl && new URL(brand.officeUrl).hostname === host;
  const plan = robotsPlan({ brand, office });
  if (!plan.index || !brand) return { rules: { userAgent: "*", disallow: "/" } };
  const base = brand.code === HOLDING_CODE ? groupSiteUrl() : brand.baseUrl;
  // Os robôs de busca e de IA aparecem por nome (D293), com as mesmas regras: deixa explícito que as páginas públicas estão liberadas.
  return { rules: [{ userAgent: "*", allow: plan.allow, disallow: plan.disallow }, { userAgent: [...ROBOS_DE_IA], allow: plan.allow, disallow: plan.disallow }], sitemap: `${base}/sitemap.xml` };
}
