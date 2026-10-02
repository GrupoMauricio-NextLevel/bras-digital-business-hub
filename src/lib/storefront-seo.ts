import { storeUrl } from "@/lib/store-url";
import { getBaseUrl } from "@/lib/base-url";

/** Endereço público e absoluto da loja (subdomínio, domínio próprio ou /store/<loja> no endereço atual). Sem barra no fim. */
export async function storeOrigin(store: { slug: string; offer?: string; customDomain?: string | null; domainStatus?: string }): Promise<string> {
  const u = storeUrl(store.slug, store.offer, store.customDomain, store.domainStatus);
  return (u.startsWith("/") ? `${await getBaseUrl()}${u}` : u).replace(/\/$/, "");
}

const fold = (s: string) => s.replace(/\s+/g, " ").trim();
/** Descrição curta para busca: no máximo ~155 letras, sem cortar palavra no meio. */
export function shortDescription(text: string | null | undefined, fallback: string): string {
  const t = fold(text ?? "") || fallback;
  if (t.length <= 155) return t;
  return `${t.slice(0, 152).replace(/\s+\S*$/, "")}…`;
}

/** JSON seguro para dentro de <script type="application/ld+json">. */
export const ldJson = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

export const SCHEMA_AVAILABILITY = { IN_STOCK: "https://schema.org/InStock", OUT_OF_STOCK: "https://schema.org/OutOfStock" } as const;
