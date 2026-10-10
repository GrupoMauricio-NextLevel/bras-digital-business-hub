import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { referrerByCode } from "@/lib/domain/club/pontos";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Convite do Brás Digital Club (D115): guarda quem convidou (30 dias) e leva ao cadastro. Código inválido só leva ao cadastro. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const to = new URL("/cadastro", req.url);
  const c = code.toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(c) || !rateLimit(`c:${ip}`, 60, 60_000)) return NextResponse.redirect(to);
  if (!(await referrerByCode(await getDb(), c))) return NextResponse.redirect(to);
  to.searchParams.set("convite", c);
  const res = NextResponse.redirect(to);
  res.cookies.set("club-ref", c, { httpOnly: true, sameSite: "lax", secure: req.nextUrl.protocol === "https:", maxAge: 30 * 86_400, path: "/" });
  return res;
}
