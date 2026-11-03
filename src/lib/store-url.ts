/** Domínio raiz das lojas SuperDrop (ex.: superdrop.com.br). Sem ele, o caminho /store/[slug] é usado. */
export const ROOT_DOMAIN = process.env.SUPERDROP_ROOT_DOMAIN?.toLowerCase() || "";

/** Endereço público da loja: subdomínio quando configurado; senão o caminho /store/[slug]. */
export function storeUrl(slug: string, offer?: string, customDomain?: string | null, domainStatus?: string): string {
  // Domínio próprio conectado vale em qualquer plano (D234: liberado para todo lojista E-commerce; no SuperDrop, só quem pode cadastrar).
  if (customDomain && domainStatus === "CONNECTED") return `https://${customDomain}`;
  if (ROOT_DOMAIN && offer !== "DROP_MANUAL") return `https://${slug}.${ROOT_DOMAIN}`;
  return `/store/${slug}`;
}

/** Extrai o slug de `slug.dominio-raiz`; null para o domínio raiz, www e hosts que não pertencem à rede. */
export function slugFromHost(host: string | null | undefined, root = ROOT_DOMAIN): string | null {
  if (!host || !root) return null;
  const h = host.split(":")[0]!.toLowerCase();
  if (!h.endsWith(`.${root}`)) return null;
  const sub = h.slice(0, -(root.length + 1));
  if (!sub || sub.includes(".") || ["www", "app", "admin", "api"].includes(sub)) return null;
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(sub) ? sub : null;
}
