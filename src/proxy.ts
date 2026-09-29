import { NextResponse, type NextRequest } from "next/server";
import { slugFromHost } from "@/lib/store-url";

/**
 * Subdomínio da loja: `slug.<SUPERDROP_ROOT_DOMAIN>/x` é servido por `/store/slug/x`.
 * Sem SUPERDROP_ROOT_DOMAIN nada muda e o caminho /store/[slug] continua sendo o único endereço.
 */
export function proxy(req: NextRequest) {
  const slug = slugFromHost(req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  if (!slug) return NextResponse.next();
  const url = req.nextUrl.clone();
  if (url.pathname.startsWith("/store/") || url.pathname.startsWith("/api/")) return NextResponse.next();
  url.pathname = `/store/${slug}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2)$).*)"] };
