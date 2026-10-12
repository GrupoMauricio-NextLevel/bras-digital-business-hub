import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getDb } from "@/db/client";
import { HOLDING_CODE, brandOfHostStrict } from "@/lib/brand";
import { finFlag } from "@/lib/finance/flags";
import { listCatalog } from "@/lib/domain/nl-catalog";
import { groupSiteUrl } from "@/lib/host-routing";
import { robotsPlan, sitemapPaths } from "@/lib/seo-marca";
import { THEME_CATALOG } from "@/lib/themes/catalog";

export const dynamic = "force-dynamic";

/** sitemap.xml do endereço que pediu (D149): só as páginas daquela marca. Endereço técnico e escritório: vazio. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(":")[0]!.toLowerCase();
  const brand = brandOfHostStrict(host);
  const office = !!brand?.officeUrl && new URL(brand.officeUrl).hostname === host;
  if (!brand || !robotsPlan({ brand, office }).index) return [];
  const holding = brand.code === HOLDING_CODE;
  const publicSolutions = finFlag("FIN_PUBLIC_SOLUTIONS");
  // As soluções vêm do catálogo do Master; se o banco não responder, o sitemap sai sem elas (nunca quebra).
  const solutions = holding && publicSolutions ? await listCatalog(await getDb()).then((l) => l.filter((i) => i.audience.includes("PUBLIC") && i.family !== "TEMA").map((i) => i.slug)).catch(() => []) : [];
  const themes = THEME_CATALOG.filter((t) => t.release === "released").map((t) => t.key);
  const base = holding ? groupSiteUrl() : brand.baseUrl;
  return sitemapPaths(brand, { themes, solutions, publicSolutions }).map((p) => ({ url: `${base}${p === "/" ? "" : p}`, changeFrequency: "weekly", priority: p === "/" || p === "/solucoes" ? 1 : 0.6 }));
}
