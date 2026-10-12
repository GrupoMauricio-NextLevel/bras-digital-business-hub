import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { HOLDING_CODE, brandOfHostStrict } from "@/lib/brand";
import { groupSiteUrl } from "@/lib/host-routing";
import { robotsPlan } from "@/lib/seo-marca";

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
  return { rules: { userAgent: "*", allow: plan.allow, disallow: plan.disallow }, sitemap: `${base}/sitemap.xml` };
}
