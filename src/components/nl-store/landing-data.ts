import type { Database } from "@/db/client";
import { listCatalog, type CatalogItem } from "@/lib/domain/nl-catalog";
import { priceLines } from "@/lib/finance/catalog-labels";

/** Produtos que esta solução prepara e opções comparáveis da mesma família (para a landing). */
export async function landingContext(db: Database, p: CatalogItem, hrefOf: (slug: string) => string) {
  const all = await listCatalog(db);
  const unlocks = p.unlocks.map((k) => all.find((x) => x.key === k)).filter((x): x is CatalogItem => !!x).map((x) => ({ name: x.name, href: hrefOf(x.slug) }));
  const related = p.family === "TEMA" ? [] : all.filter((x) => x.family === p.family && x.id !== p.id).slice(0, 3).map((x) => ({ name: x.name, href: hrefOf(x.slug), price: priceLines(x).main }));
  return { unlocks, related };
}
