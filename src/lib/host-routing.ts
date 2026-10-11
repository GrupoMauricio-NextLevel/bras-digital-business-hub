import { HOLDING_CODE, brandByCode, brandOfHostStrict } from "./brand";

/**
 * Cada marca tem um endereço PÚBLICO (portal, vitrines, lojas dos fornecedores) e, se configurado, um endereço de PAINÉIS
 * (o "escritório": login, Master, fornecedor, lojista, afiliado). Esta função pura decide o que fazer com uma requisição.
 * Sem `officeUrl` na marca (padrão) nada muda: os painéis ficam no endereço público. Só `/loja/<nome>` vira apelido da vitrine.
 */
export const PANEL_PREFIXES = ["/master", "/commerce", "/supplier", "/merchant", "/partner", "/meu-bras", "/importadora", "/transportadora", "/bras", "/account", "/theme-editor", "/login", "/esqueci-senha", "/redefinir-senha"];
/** Páginas públicas de uma marca de operação fechada já aberta (D92). */
export const CLOSED_PUBLIC_PATHS = ["/", "", "/cadastro", "/quero-minha-loja", "/termos", "/privacidade"];
export const isPanelPath = (p: string) => PANEL_PREFIXES.some((x) => p === x || p.startsWith(`${x}/`));

export type HostRoute = { kind: "next" } | { kind: "redirect"; url: string } | { kind: "rewrite"; path: string };

const bare = (host: string | null | undefined) => (host ?? "").split(":")[0]!.toLowerCase();

export function routeHost(input: { host: string | null | undefined; pathname: string; search?: string }, env: Record<string, string | undefined> = process.env): HostRoute {
  const { pathname } = input;
  const search = input.search ?? "";
  const host = bare(input.host);
  const brand = brandOfHostStrict(host, env);
  // Master central (holding): só painéis e login. Qualquer outra página vai ao login.
  if (brand?.code === HOLDING_CODE) {
    if (isPanelPath(pathname) || pathname === "/solucoes" || pathname.startsWith("/solucoes/") || pathname.startsWith("/api/")) return { kind: "next" };
    return { kind: "redirect", url: "/login" };
  }
  // Com MASTER_HOST_ONLY=true o Master só abre no endereço central; nos endereços dos produtos vai para lá.
  if (brand && env.MASTER_HOST_ONLY === "true" && (pathname === "/master" || pathname.startsWith("/master/"))) {
    return { kind: "redirect", url: `${brandByCode(HOLDING_CODE, env).baseUrl}${pathname}${search}` };
  }
  const officeHost = brand?.officeUrl ? bare(new URL(brand.officeUrl).host) : null;
  const isOffice = !!officeHost && host === officeHost;
  const passthrough = pathname.startsWith("/api/") || pathname === "/api" || pathname.startsWith("/_next/");
  if (passthrough) return { kind: "next" };

  if (isOffice && brand) {
    // Atalhos de convite: o link bonito leva ao login; depois de entrar, cada pessoa cai no painel do seu nível.
    let m = /^\/f\/([a-z0-9-]+)\/?$/.exec(pathname);
    if (m) return { kind: "redirect", url: `/login?area=fornecedor&nome=${m[1]}` };
    m = /^\/loja\/([a-z0-9-]+)\/?$/.exec(pathname);
    if (m) return { kind: "redirect", url: `/login?area=loja&nome=${m[1]}` };
    if (pathname === "/afiliado" || pathname === "/afiliado/") return { kind: "redirect", url: "/login?area=afiliado" };
    if (pathname === "/" || pathname === "") return { kind: "redirect", url: "/login" };
    if (isPanelPath(pathname)) return { kind: "next" };
    // Página pública no endereço dos painéis: leva ao endereço público da marca.
    return { kind: "redirect", url: `${brand.baseUrl}${pathname}${search}` };
  }

  // Produto sem sistema ainda ("em breve"): só a página inicial, a lista de espera e os painéis; o resto volta para a página inicial.
  if (brand?.soon && !isPanelPath(pathname) && pathname !== "/" && pathname !== "/quero-minha-loja" && !pathname.startsWith("/r/") && !pathname.startsWith("/c/")) return { kind: "redirect", url: "/" };
  // Operação fechada aberta (Brás Digital, D92): no endereço público só a apresentação, o cadastro e os painéis. As páginas das outras marcas não existem aqui.
  if (brand?.closedCommerce && !brand.soon && !isPanelPath(pathname) && !CLOSED_PUBLIC_PATHS.includes(pathname) && !pathname.startsWith("/r/") && !pathname.startsWith("/c/") && !/^\/d\/[a-z0-9_]+$/.test(pathname) && !/^\/balcao\/[A-Za-z0-9_-]{32,64}$/.test(pathname) && !/^\/balcao-club\/[A-Za-z0-9_-]{32,64}$/.test(pathname)) return { kind: "redirect", url: "/" };
  // Marca com lista fechada de páginas públicas (NextLevel Cargas, D108): o resto volta para a página inicial.
  if (brand?.publicPaths && !isPanelPath(pathname) && !brand.publicPaths.includes(pathname) && !pathname.startsWith("/r/") && !pathname.startsWith("/c/") && !(brand.publicPatterns ?? []).some((re) => new RegExp(re).test(pathname))) return { kind: "redirect", url: "/" };
  if (brand?.officeUrl && isPanelPath(pathname)) return { kind: "redirect", url: `${brand.officeUrl}${pathname}${search}` };

  // `/loja/<nome>` é o endereço bonito da vitrine do vendedor (a rota interna continua `/store/<nome>`).
  const loja = /^\/loja\/([a-z0-9-]+)(\/.*)?$/.exec(pathname);
  if (loja) return { kind: "rewrite", path: `/store/${loja[1]}${loja[2] ?? ""}` };
  return { kind: "next" };
}

/** Endereço de um caminho de painel para a marca: no escritório quando ele existe, senão no endereço público. */
export function panelUrl(brand: { baseUrl: string; officeUrl: string | null }, path: string): string {
  return `${brand.officeUrl ?? brand.baseUrl}${path}`;
}
