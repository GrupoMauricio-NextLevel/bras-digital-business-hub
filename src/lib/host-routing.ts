import { HOLDING_CODE, brandByCode, brandOfHostStrict, type BrandCode } from "./brand";
import { BDC } from "./marcas/bras-digital-club";

/**
 * Cada marca tem um endereço PÚBLICO (portal, vitrines, lojas dos fornecedores) e, se configurado, um endereço de PAINÉIS
 * (o "escritório": login, Master, fornecedor, lojista, afiliado). Esta função pura decide o que fazer com uma requisição.
 * Sem `officeUrl` na marca (padrão) nada muda: os painéis ficam no endereço público. Só `/loja/<nome>` vira apelido da vitrine.
 */
export const PANEL_PREFIXES = ["/master", "/commerce", "/supplier", "/merchant", "/partner", "/meu-bras", "/importadora", "/transportadora", "/agencia", "/bras", "/account", "/theme-editor", "/login", "/esqueci-senha", "/redefinir-senha"];
/** Páginas públicas de uma marca de operação fechada já aberta (D92). */
export const CLOSED_PUBLIC_PATHS = ["/", "", "/cadastro", "/fornecer", "/ativar", "/quero-minha-loja", "/termos", "/privacidade"];
/** Páginas do grupo que abrem no endereço da holding (D147: vão para nextlevelgroup.com.br quando o site do grupo existir). */
export const GROUP_PATHS = ["/solucoes", "/termos", "/privacidade", "/loja-nextlevel", "/club", "/meu-contador"];
/** Páginas que são da NextLevel Soluções Digitais (agência): nos endereços das marcas vão para o endereço do grupo (D149). */
const GROUP_OWNED = ["/solucoes", "/loja-nextlevel", "/club", "/meu-contador"];
/** Painéis da equipe NextLevel: só no Master (D149; `MASTER_HOST_ONLY=false` desliga). */
export const TEAM_PANEL_PREFIXES = ["/master", "/commerce", "/bras"];
/** Painéis de clientes que têm uma marca só: no endereço de outra marca vão para o da marca deles (D149). */
const PANEL_HOME: { prefix: string; brand: "BRAS_DIGITAL" | "NEXTLEVEL_CARGAS" }[] = [
  { prefix: "/meu-bras", brand: "BRAS_DIGITAL" }, { prefix: "/importadora", brand: "BRAS_DIGITAL" }, { prefix: "/transportadora", brand: "NEXTLEVEL_CARGAS" },
];
/** Páginas públicas do SuperDrop: abertas no endereço da Commerce vão para o SuperDrop (D149). */
const SUPERDROP_OWNED = ["/seja-fornecedor", "/fornecedores"];
/** Rota pública da marca Brás Digital Club (`BDC.publicRoute`). */
export const BRAS_CLUB_ROUTE = BDC.publicRoute;
const under = (p: string, x: string) => p === x || p.startsWith(`${x}/`);
/** Atalhos públicos que valem em qualquer endereço de marca: link do parceiro (/r/), cupom (/c/) e link rastreado (/l/, D290). */
const atalho = (p: string) => p.startsWith("/r/") || p.startsWith("/c/") || p.startsWith("/l/");
/** Endereço do site do grupo: `GROUP_SITE_URL` quando nextlevelgroup.com.br estiver ligado (Fase 3); até lá, o da holding. */
export const groupSiteUrl = (env: Record<string, string | undefined> = process.env) => (env.GROUP_SITE_URL?.replace(/\/$/, "") || brandByCode(HOLDING_CODE, env).baseUrl);
/** Link para uma página do grupo visto de um endereço: no próprio grupo e em endereço técnico (demonstração, localhost), relativo; nas marcas, direto no site do grupo, sem passar por redirecionamento (D149). */
export const groupLinkFor = (path: string, hostBrand: BrandCode | null | undefined, env: Record<string, string | undefined> = process.env) =>
  !hostBrand || hostBrand === HOLDING_CODE ? path : `${groupSiteUrl(env)}${path}`;
/** Vitrine de uma marca (SuperDrop × Commerce) aberta no endereço da outra: endereço da marca dona, ou null se está no lugar (D149). Demonstrações de tema ficam onde estão. */
export function storeOwnerBase(hostBrand: BrandCode | null | undefined, storeBrand: BrandCode, showcase: boolean, env: Record<string, string | undefined> = process.env): string | null {
  const pair: BrandCode[] = ["SUPERDROP", "NEXTLEVEL_COMMERCE"];
  if (showcase || !hostBrand || hostBrand === storeBrand || !pair.includes(hostBrand) || !pair.includes(storeBrand)) return null;
  return brandByCode(storeBrand, env).baseUrl;
}
export const isPanelPath = (p: string) => PANEL_PREFIXES.some((x) => p === x || p.startsWith(`${x}/`));

export type HostRoute = { kind: "next" } | { kind: "redirect"; url: string; permanente?: boolean } | { kind: "rewrite"; path: string };

const bare = (host: string | null | undefined) => (host ?? "").split(":")[0]!.toLowerCase();

export function routeHost(input: { host: string | null | undefined; pathname: string; search?: string; method?: string }, env: Record<string, string | undefined> = process.env): HostRoute {
  const { pathname } = input;
  const search = input.search ?? "";
  const host = bare(input.host);
  const brand = brandOfHostStrict(host, env);
  // Arquivos dos buscadores: cada endereço responde o dele (D149).
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return { kind: "next" };
  // Brás Digital Club com um endereço principal só (D158): os outros endereços da marca (www, o antigo bras.nextlevelgroup.com.br)
  // levam ao endereço da marca no ar, mesmo caminho. Sem efeito enquanto o endereço no ar for o único que responde.
  // NextLevel Commerce com um endereço principal só (D281): com BRAND_URL_NEXTLEVEL_COMMERCE apontando para o domínio novo,
  // os outros endereços da marca (o antigo lojas.nextlevelgroup.com.br, o www) levam ao novo, mesmo caminho, redirecionamento
  // permanente (bom para o Google). Só páginas abertas com GET: /api/* (avisos do Mercado Pago, rotinas) e formulários
  // continuam respondendo no endereço em que chegaram.
  // Só com a chave EC_DOMINIO_PRINCIPAL=1 (ligada na hora da troca): antes disso, nenhum endereço da marca redireciona,
  // para o navegador não guardar um redirecionamento permanente na direção errada.
  if (brand?.code === "NEXTLEVEL_COMMERCE" && env.EC_DOMINIO_PRINCIPAL === "1" && !pathname.startsWith("/api/") && (input.method ?? "GET").toUpperCase() === "GET") {
    const principal = bare(new URL(brand.baseUrl).host);
    const escritorio = brand.officeUrl ? bare(new URL(brand.officeUrl).host) : null; // endereço dos painéis fica como está
    if (host !== principal && host !== escritorio && brand.domains.includes(host) && brand.domains.includes(principal)) return { kind: "redirect", url: `${brand.baseUrl.replace(/\/$/, "")}${pathname}${search}`, permanente: true };
  }
  if (brand?.code === "BRAS_DIGITAL") {
    const principal = bare(new URL(brand.baseUrl).host);
    if (host !== principal && brand.domains.includes(host) && brand.domains.includes(principal)) return { kind: "redirect", url: `${brand.baseUrl}${pathname}${search}` };
  }
  // Rota pública do Brás Digital Club (D158): no endereço da marca é a página inicial dela; nos endereços das outras marcas e
  // do grupo leva ao endereço da Brás. Só em endereço técnico (demonstração) a página `/bras-digital-club` abre como está.
  if (pathname === BRAS_CLUB_ROUTE || pathname === `${BRAS_CLUB_ROUTE}/`) {
    const groupH = env.GROUP_SITE_URL ? bare(new URL(env.GROUP_SITE_URL).host) : null;
    if (brand?.code === "BRAS_DIGITAL") return { kind: "redirect", url: `/${search}` };
    if (brand || (groupH && (host === groupH || host === `www.${groupH}`))) return { kind: "redirect", url: `${brandByCode("BRAS_DIGITAL", env).baseUrl}/${search}` };
    return { kind: "next" };
  }
  // Site do grupo no endereço próprio (Fase 3, D156): "www" leva ao endereço principal; lá ficam só as páginas do grupo
  // (Soluções, Club, Meu Contador, Loja NextLevel, termos); login e painéis continuam no Master.
  const groupHost = env.GROUP_SITE_URL ? bare(new URL(env.GROUP_SITE_URL).host) : null;
  if (groupHost && host === `www.${groupHost}`) return { kind: "redirect", url: `${groupSiteUrl(env)}${pathname}${search}` };
  if (groupHost && host === groupHost) {
    if (pathname === "/" || pathname === "") return { kind: "redirect", url: `/solucoes${search}` };
    if (pathname.startsWith("/api/") || atalho(pathname) || GROUP_PATHS.includes(pathname) || pathname.startsWith("/solucoes/") || pathname.startsWith("/loja-nextlevel/")) return { kind: "next" };
    if (isPanelPath(pathname)) return { kind: "redirect", url: `${brandByCode(HOLDING_CODE, env).baseUrl}${pathname}${search}` };
    return { kind: "redirect", url: `/solucoes${search}` };
  }
  // Master central (holding): painéis, login e as páginas do grupo (Soluções, termos e privacidade do grupo, D147/D148). O resto vai ao login.
  if (brand?.code === HOLDING_CODE) {
    if (isPanelPath(pathname) || GROUP_PATHS.includes(pathname) || pathname.startsWith("/solucoes/") || pathname.startsWith("/loja-nextlevel/") || pathname.startsWith("/api/")) return { kind: "next" };
    return { kind: "redirect", url: "/login" };
  }
  // Painéis da equipe NextLevel só no Master (D149): nos endereços dos produtos vão para lá. MASTER_HOST_ONLY=false desliga.
  if (brand && env.MASTER_HOST_ONLY !== "false" && TEAM_PANEL_PREFIXES.some((x) => under(pathname, x))) {
    return { kind: "redirect", url: `${brandByCode(HOLDING_CODE, env).baseUrl}${pathname}${search}` };
  }
  // Painel de cliente de uma marca só (Brás, Cargas) aberto no endereço de outra marca: vai para o da marca dele.
  const home = brand ? PANEL_HOME.find((x) => under(pathname, x.prefix)) : undefined;
  if (brand && home && brand.code !== home.brand) return { kind: "redirect", url: `${brandByCode(home.brand, env).baseUrl}${pathname}${search}` };
  // Páginas da agência (Soluções, Loja NextLevel) moram no site do grupo.
  if (brand && !brand.soon && !brand.closedCommerce && !brand.publicPaths && GROUP_OWNED.some((x) => under(pathname, x))) return { kind: "redirect", url: `${groupSiteUrl(env)}${pathname}${search}` };
  // Páginas do SuperDrop (fornecedor) abertas na Commerce vão para o SuperDrop.
  if (brand?.code === "NEXTLEVEL_COMMERCE" && (SUPERDROP_OWNED.includes(pathname) || /^\/f\/[a-z0-9-]+\/?$/.test(pathname))) return { kind: "redirect", url: `${brandByCode("SUPERDROP", env).baseUrl}${pathname}${search}` };
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
  if (brand?.soon && !isPanelPath(pathname) && pathname !== "/" && pathname !== "/quero-minha-loja" && !atalho(pathname)) return { kind: "redirect", url: "/" };
  // Operação fechada aberta (Brás Digital, D92): no endereço público só a apresentação, o cadastro e os painéis. As páginas das outras marcas não existem aqui.
  if (brand?.closedCommerce && !brand.soon && !isPanelPath(pathname) && !CLOSED_PUBLIC_PATHS.includes(pathname) && !atalho(pathname) && !/^\/d\/[a-z0-9_]+$/.test(pathname) && !/^\/balcao\/[A-Za-z0-9_-]{32,64}$/.test(pathname) && !/^\/balcao-club\/[A-Za-z0-9_-]{32,64}$/.test(pathname)) return { kind: "redirect", url: "/" };
  // Marca com lista fechada de páginas públicas (NextLevel Cargas, D108): o resto volta para a página inicial.
  if (brand?.publicPaths && !isPanelPath(pathname) && !brand.publicPaths.includes(pathname) && !atalho(pathname) && !(brand.publicPatterns ?? []).some((re) => new RegExp(re).test(pathname))) return { kind: "redirect", url: "/" };
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
