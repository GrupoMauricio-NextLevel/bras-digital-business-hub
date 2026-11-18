import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { slugFromHost, TESTE_DOMAIN } from "@/lib/store-url";
import { PANEL_PREFIXES, routeHost } from "@/lib/host-routing";
import { contarRobo, roboDe } from "@/lib/trafego/robos";
import { brandOfHostStrict, brandPreviewAllowed } from "@/lib/brand";
import { isPanelPath } from "@/lib/host-routing";
import { CLICK_IDS, canalDe, ehRobo } from "@/lib/trafego/canal";
import { CONSENT_COOKIE, lerConsentimento, podeMedir } from "@/lib/trafego/consentimento";

/** Host que pode ser domínio próprio de uma loja (D234): não é da plataforma, nem técnico (localhost, IP, onrender). */
export function podeSerDominioDeLoja(host: string | null | undefined): boolean {
  const h = (host ?? "").split(":")[0]!.toLowerCase();
  if (!h.includes(".") || /^[\d.]+$/.test(h) || h.endsWith(".onrender.com") || h.endsWith(".test") || h.endsWith(".local")) return false;
  return !brandOfHostStrict(h) && !slugFromHost(h);
}

/**
 * Subdomínio da loja: `slug.<SUPERDROP_ROOT_DOMAIN>/x` é servido por `/store/slug/x`.
 * Sem SUPERDROP_ROOT_DOMAIN nada muda e o caminho /store/[slug] continua sendo o único endereço.
 */
/**
 * Atribuição (D90): visita com `ref` (código do parceiro) ou `utm_*` grava o ÚLTIMO TOQUE NÃO DIRETO em cookie primário
 * (`nl-attr`, 30 dias; `nl-ref` com o código). Visita direta não apaga nada. Só campos curtos e sem dado pessoal.
 * TR1 (D290): guarda também o identificador do clique do anúncio (`fbclid`, `gclid`, `gbraid`, `wbraid`, `ttclid`) e o
 * momento do clique (`ts`), que servem depois para devolver a venda à Meta e ao Google; e o canal calculado.
 */
const ATTR = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
const limpaClique = (v: string) => v.replace(/[^A-Za-z0-9_\-.]/g, "").slice(0, 120);
export function attributionFrom(url: URL): Record<string, string> | null {
  const ref = url.searchParams.get("ref");
  const out: Record<string, string> = {};
  if (ref && /^[A-Za-z0-9_-]{3,24}$/.test(ref)) out.ref = ref.toUpperCase();
  for (const k of ATTR) { const v = url.searchParams.get(k); if (v) out[k] = v.replace(/[^\w\-. ]/g, "").slice(0, 60); }
  for (const k of CLICK_IDS) { const v = url.searchParams.get(k); const c = v ? limpaClique(v) : ""; if (c) out[k] = c; }
  if (!Object.keys(out).length) return null;
  if (CLICK_IDS.some((k) => out[k])) out.ts = String(Date.now());
  out.canal = canalDe(out);
  out.page = url.pathname.slice(0, 80);
  out.at = new Date().toISOString().slice(0, 10);
  return out;
}

/**
 * Primeiro toque (TR1, D290): a PRIMEIRA vez que a pessoa abre o site, de onde veio (etiqueta, clique do anúncio ou site
 * de origem) e em qual página entrou. Nunca é sobrescrito (90 dias). Só nas páginas públicas das marcas: nunca nas lojas
 * dos lojistas (lá a contagem é sem cookie, D185), nos painéis, na API, em pré-carregamento ou para robôs; e não grava se a
 * pessoa recusou a medição no aviso de cookies.
 */
export function primeiroToqueFrom(input: { url: URL; referrer: string | null; host: string | null; ua: string | null }): Record<string, string> {
  const a = attributionFrom(input.url) ?? {};
  let refHost = "";
  try { refHost = input.referrer ? new URL(input.referrer).hostname.replace(/^www\./, "").toLowerCase().slice(0, 60) : ""; } catch { refHost = ""; }
  const hostProprio = (input.host ?? "").split(":")[0]!.replace(/^www\./, "").toLowerCase();
  if (refHost === hostProprio) refHost = "";
  const out: Record<string, string> = { ...a, canal: canalDe({ ...a, referrer: refHost, hostProprio }), page: input.url.pathname.slice(0, 80), at: new Date().toISOString().slice(0, 10) };
  if (refHost) out.ref_host = refHost;
  return out;
}

const ehLoja = (path: string, host: string | null) => path.startsWith("/store/") || path.startsWith("/loja/") || !!slugFromHost(host);
function withAttribution(req: NextRequest, res: NextResponse, opts: { loja?: boolean } = {}) {
  if (req.method !== "GET" || req.nextUrl.pathname.startsWith("/api/")) return res;
  const secure = (req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "")) === "https";
  const a = attributionFrom(req.nextUrl);
  if (a) {
    res.cookies.set("nl-attr", encodeURIComponent(JSON.stringify(a)), { path: "/", sameSite: "lax", secure, httpOnly: true, maxAge: 30 * 86_400 });
    if (a.ref) res.cookies.set("nl-ref", a.ref, { path: "/", sameSite: "lax", secure, httpOnly: true, maxAge: 30 * 86_400 });
  }
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const path = req.nextUrl.pathname;
  const prefetch = req.headers.get("next-router-prefetch") || req.headers.get("purpose") === "prefetch" || req.headers.get("sec-purpose")?.includes("prefetch");
  const consent = lerConsentimento(req.cookies.get(CONSENT_COOKIE)?.value);
  if (!podeMedir(consent)) { if (req.cookies.get("nl-first")) res.cookies.delete("nl-first"); return res; }
  if (!opts.loja && !req.cookies.get("nl-first") && !prefetch && !ehLoja(path, host) && !isPanelPath(path) && !path.startsWith("/l/") && !path.startsWith("/r/") && !ehRobo(req.headers.get("user-agent"))
    && (req.headers.get("accept") ?? "").includes("text/html")) {
    const f = primeiroToqueFrom({ url: req.nextUrl, referrer: req.headers.get("referer"), host, ua: req.headers.get("user-agent") });
    res.cookies.set("nl-first", encodeURIComponent(JSON.stringify(f)), { path: "/", sameSite: "lax", secure, httpOnly: true, maxAge: 90 * 86_400 });
  }
  return res;
}

export async function proxy(req: NextRequest, event?: NextFetchEvent) {
  // Domínio próprio da loja (D234): host cadastrado por um lojista abre a vitrine dele (o resto do roteamento não se aplica).
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  contarVisitaDeRobo(req, host, event);
  if (podeSerDominioDeLoja(host)) {
    const { getDb } = await import("@/db/client");
    const { lojaPorDominio } = await import("@/lib/domain/dominio-proprio");
    const slug = await lojaPorDominio(await getDb(), host!).catch(() => null);
    if (slug) {
      const url = req.nextUrl.clone();
      if (url.pathname.startsWith("/store/") || url.pathname.startsWith("/api/")) return withAttribution(req, NextResponse.next(withPath(req)), { loja: true });
      url.pathname = `/store/${slug}${url.pathname === "/" ? "" : url.pathname}`;
      return withAttribution(req, NextResponse.rewrite(url, withPath(req)), { loja: true });
    }
  }
  return withAttribution(req, route(req));
}

/**
 * Robôs de busca e de IA nas páginas públicas das marcas (D303): só conta (em memória) e grava em lote em segundo plano.
 * Painéis, API e arquivos internos ficam fora; as lojas dos lojistas também (não são páginas da marca). Nunca atrasa nem
 * derruba a resposta.
 */
function contarVisitaDeRobo(req: NextRequest, host: string | null, event?: NextFetchEvent) {
  try {
    if (req.method !== "GET") return;
    const robo = roboDe(req.headers.get("user-agent"));
    if (!robo) return;
    const brand = brandOfHostStrict((host ?? "").split(":")[0]!.toLowerCase());
    const path = req.nextUrl.pathname;
    if (!brand || path.startsWith("/api/") || path.startsWith("/_next") || PANEL_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return;
    if (contarRobo(brand.code, robo, path) && event) {
      event.waitUntil((async () => {
        const [{ getDb }, { gravarRobos }] = await Promise.all([import("@/db/client"), import("@/lib/trafego/robos")]);
        await gravarRobos(await getDb());
      })().catch(() => undefined));
    }
  } catch { /* medir nunca derruba a página */ }
}

/** Repassa o caminho e a busca pedidos para as páginas (portão da equipe do Master, D138; vitrine na marca certa, D149). */
const withPath = (req: NextRequest) => { const h = new Headers(req.headers); h.set("x-nl-path", req.nextUrl.pathname); h.set("x-nl-search", req.nextUrl.search); return { request: { headers: h } }; };

function route(req: NextRequest) {
  // Prévia da NextLevel Commerce em qualquer endereço: /lojas liga, /lojas/sair desliga (apresentação apenas, não muda permissões).
  // Só na demonstração (D149): em produção o atalho volta ao início e apaga a prévia que tenha ficado no navegador.
  const path = req.nextUrl.pathname;
  if (path === "/lojas" || path === "/lojas/" || path === "/lojas/sair") {
    const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
    const res = NextResponse.redirect(new URL("/", `${proto}://${host}`));
    if (path === "/lojas/sair" || !brandPreviewAllowed()) res.cookies.delete("nl-brand");
    else res.cookies.set("nl-brand", "NEXTLEVEL_COMMERCE", { path: "/", sameSite: "lax", secure: proto === "https", maxAge: 60 * 60 * 24 * 30 });
    return res;
  }
  // Endereço de teste da loja (slug.<LOJA_TESTE_DOMINIO>): vem antes das regras da marca, que trataria o subdomínio como
  // página pública da Commerce.
  const hostHeader = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const slugTeste = TESTE_DOMAIN ? slugFromHost(hostHeader, TESTE_DOMAIN) : null;
  if (slugTeste) {
    const url = req.nextUrl.clone();
    if (url.pathname.startsWith("/store/") || url.pathname.startsWith("/api/") || url.pathname.startsWith("/assets/") || url.pathname.startsWith("/_next/")) return NextResponse.next(withPath(req));
    url.pathname = `/store/${slugTeste}${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url, withPath(req));
  }
  // Endereço público × endereço dos painéis de cada marca (ver src/lib/host-routing.ts).
  const route = routeHost({ host: hostHeader, pathname: path, search: req.nextUrl.search, method: req.method });
  if (route.kind === "redirect") {
    // Destino no mesmo endereço: monta o endereço completo com o host recebido (o Next não aceita Location relativa).
    if (route.url.startsWith("/")) {
      const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
      return NextResponse.redirect(new URL(route.url, `${proto}://${req.headers.get("host") ?? hostHeader ?? req.nextUrl.host}`), 307);
    }
    return NextResponse.redirect(route.url, route.permanente ? 301 : 307);
  }
  if (route.kind === "rewrite") { const u = req.nextUrl.clone(); u.pathname = route.path; return NextResponse.rewrite(u, withPath(req)); }
  const slug = slugFromHost(req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  if (!slug) return NextResponse.next(withPath(req));
  const url = req.nextUrl.clone();
  if (url.pathname.startsWith("/store/") || url.pathname.startsWith("/api/")) return NextResponse.next(withPath(req));
  url.pathname = `/store/${slug}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

// `.webmanifest` também é arquivo estático (manifesto dos aplicativos das marcas, D158/D161/D163): sem ele, ia para o login.
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|svg|webp|avif|ico|woff2|webmanifest)$).*)"] };
