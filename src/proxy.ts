import { NextResponse, type NextRequest } from "next/server";
import { slugFromHost } from "@/lib/store-url";

/**
 * Subdomínio da loja: `slug.<SUPERDROP_ROOT_DOMAIN>/x` é servido por `/store/slug/x`.
 * Sem SUPERDROP_ROOT_DOMAIN nada muda e o caminho /store/[slug] continua sendo o único endereço.
 */
export function proxy(req: NextRequest) {
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
  const slug = slugFromHost(req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  if (!slug) return NextResponse.next();
  const url = req.nextUrl.clone();
  if (url.pathname.startsWith("/store/") || url.pathname.startsWith("/api/")) return NextResponse.next();
  url.pathname = `/store/${slug}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2)$).*)"] };
