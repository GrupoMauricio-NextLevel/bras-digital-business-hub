import { NextResponse, type NextRequest } from "next/server";
import { slugFromHost } from "@/lib/store-url";
import { routeHost } from "@/lib/host-routing";

/**
 * Subdomínio da loja: `slug.<SUPERDROP_ROOT_DOMAIN>/x` é servido por `/store/slug/x`.
 * Sem SUPERDROP_ROOT_DOMAIN nada muda e o caminho /store/[slug] continua sendo o único endereço.
 */
/**
 * Atribuição (D90): visita com `ref` (código do parceiro) ou `utm_*` grava o ÚLTIMO TOQUE NÃO DIRETO em cookie primário
 * (`nl-attr`, 30 dias; `nl-ref` com o código). Visita direta não apaga nada. Só campos curtos e sem dado pessoal.
 */
const ATTR = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export function attributionFrom(url: URL): Record<string, string> | null {
  const ref = url.searchParams.get("ref");
  const out: Record<string, string> = {};
  if (ref && /^[A-Za-z0-9_-]{3,24}$/.test(ref)) out.ref = ref.toUpperCase();
  for (const k of ATTR) { const v = url.searchParams.get(k); if (v) out[k] = v.replace(/[^\w\-. ]/g, "").slice(0, 60); }
  if (!Object.keys(out).length) return null;
  out.page = url.pathname.slice(0, 80);
  out.at = new Date().toISOString().slice(0, 10);
  return out;
}
function withAttribution(req: NextRequest, res: NextResponse) {
  if (req.method !== "GET" || req.nextUrl.pathname.startsWith("/api/")) return res;
  const a = attributionFrom(req.nextUrl);
  if (!a) return res;
  const secure = (req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "")) === "https";
  res.cookies.set("nl-attr", encodeURIComponent(JSON.stringify(a)), { path: "/", sameSite: "lax", secure, httpOnly: true, maxAge: 30 * 86_400 });
  if (a.ref) res.cookies.set("nl-ref", a.ref, { path: "/", sameSite: "lax", secure, httpOnly: true, maxAge: 30 * 86_400 });
  return res;
}

export function proxy(req: NextRequest) {
  return withAttribution(req, route(req));
}

function route(req: NextRequest) {
  // Prévia da NextLevel Commerce em qualquer endereço: /lojas liga, /lojas/sair desliga (apresentação apenas, não muda permissões).
  const path = req.nextUrl.pathname;
  if (path === "/lojas" || path === "/lojas/" || path === "/lojas/sair") {
    const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
    const res = NextResponse.redirect(new URL("/", `${proto}://${host}`));
    if (path === "/lojas/sair") res.cookies.delete("nl-brand");
    else res.cookies.set("nl-brand", "NEXTLEVEL_COMMERCE", { path: "/", sameSite: "lax", secure: proto === "https", maxAge: 60 * 60 * 24 * 30 });
    return res;
  }
  // Endereço público × endereço dos painéis de cada marca (ver src/lib/host-routing.ts).
  const hostHeader = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const route = routeHost({ host: hostHeader, pathname: path, search: req.nextUrl.search });
  if (route.kind === "redirect") {
    // Destino no mesmo endereço: monta o endereço completo com o host recebido (o Next não aceita Location relativa).
    if (route.url.startsWith("/")) {
      const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
      return NextResponse.redirect(new URL(route.url, `${proto}://${req.headers.get("host") ?? hostHeader ?? req.nextUrl.host}`), 307);
    }
    return NextResponse.redirect(route.url, 307);
  }
  if (route.kind === "rewrite") { const u = req.nextUrl.clone(); u.pathname = route.path; return NextResponse.rewrite(u); }
  const slug = slugFromHost(req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  if (!slug) return NextResponse.next();
  const url = req.nextUrl.clone();
  if (url.pathname.startsWith("/store/") || url.pathname.startsWith("/api/")) return NextResponse.next();
  url.pathname = `/store/${slug}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2)$).*)"] };
