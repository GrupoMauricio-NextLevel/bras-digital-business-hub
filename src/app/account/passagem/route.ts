import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { setSessionCookie } from "@/lib/auth";
import { consumePassCode } from "@/lib/domain/conta-grupo";

export const dynamic = "force-dynamic";

/** Passagem da conta do grupo (D141): abre o perfil da mesma pessoa nesta marca com o código de uso único. */
export async function GET(req: NextRequest) {
  const r = await consumePassCode(await getDb(), req.nextUrl.searchParams.get("c") ?? "");
  // Atrás do proxy do Render o endereço público vem nos cabeçalhos encaminhados.
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  if (!r) return NextResponse.redirect(new URL("/login?error=passagem", `${proto}://${host}`));
  await setSessionCookie(r.userId);
  return NextResponse.redirect(new URL(r.home, `${proto}://${host}`));
}
