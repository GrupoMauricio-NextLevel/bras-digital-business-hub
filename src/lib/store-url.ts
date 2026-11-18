/** Domínio raiz das lojas SuperDrop (ex.: superdrop.com.br). Sem ele, o caminho /store/[slug] é usado. */
export const ROOT_DOMAIN = process.env.SUPERDROP_ROOT_DOMAIN?.toLowerCase() || "";

/** Endereço público da loja: subdomínio quando configurado; senão o caminho /store/[slug]. */
export function storeUrl(slug: string, offer?: string, customDomain?: string | null, domainStatus?: string): string {
  // Domínio próprio conectado vale em qualquer plano (D234: liberado para todo lojista Commerce; no SuperDrop, só quem pode cadastrar).
  if (customDomain && domainStatus === "CONNECTED") return `https://${customDomain}`;
  if (ROOT_DOMAIN && offer !== "DROP_MANUAL") return `https://${slug}.${ROOT_DOMAIN}`;
  return `/store/${slug}`;
}

/**
 * Endereço de teste das lojas da Commerce (como "loja.lojawbuy.com.br"): `slug.<LOJA_TESTE_DOMINIO>`, sempre ativo, ao lado
 * do domínio oficial. Exige no DNS do domínio da plataforma um registro coringa (`*` → hospedagem) e o mesmo coringa nos
 * domínios do Render. Sem a variável, não existe (as lojas seguem em /store/slug).
 */
export const TESTE_DOMAIN = process.env.LOJA_TESTE_DOMINIO?.trim().toLowerCase().replace(/^\*\./, "") || "";
export const enderecoDeTeste = (slug: string, raiz = TESTE_DOMAIN) => (raiz ? `https://${slug}.${raiz}` : null);

/** Subdomínios que são da plataforma, nunca de loja. */
const RESERVADOS = ["www", "app", "admin", "api", "painel", "master", "office", "lojas", "mail", "email", "webmail", "smtp", "blog", "ajuda", "status", "cdn", "assets", "static", "demo", "teste", "suporte"];

/** Extrai o slug de `slug.dominio-raiz` (das lojas SuperDrop ou do endereço de teste); null para a raiz, www e hosts de fora. */
export function slugFromHost(host: string | null | undefined, root: string | string[] = [ROOT_DOMAIN, TESTE_DOMAIN]): string | null {
  if (!host) return null;
  const h = host.split(":")[0]!.toLowerCase();
  for (const r of (Array.isArray(root) ? root : [root]).filter(Boolean)) {
    if (!h.endsWith(`.${r}`)) continue;
    const sub = h.slice(0, -(r.length + 1));
    if (!sub || sub.includes(".") || RESERVADOS.includes(sub)) return null;
    return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(sub) ? sub : null;
  }
  return null;
}
