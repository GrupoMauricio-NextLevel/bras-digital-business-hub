import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/base-url";
import { getDb } from "@/db/client";
import { recordClick, getPartnerSettings } from "@/lib/domain/partners";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Link rastreável do parceiro: conta o clique, guarda o parceiro em cookie (30 dias) e leva ao cadastro. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const to = new URL("/cadastro", requestOrigin(req));
  if (!/^[a-zA-Z0-9-]{3,24}$/.test(slug) || !rateLimit(`r:${ip}`, 60, 60_000)) return NextResponse.redirect(to);
  const db = await getDb();
  const hit = await recordClick(db, slug, { ip, ua: req.headers.get("user-agent") ?? "" });
  if (!hit || !hit.active) return NextResponse.redirect(to);
  to.searchParams.set("ref", hit.partnerCode);
  if (hit.planKey) to.searchParams.set("plano", hit.planKey);
  const res = NextResponse.redirect(to);
  const days = (await getPartnerSettings(db)).attributionDays;
  res.cookies.set("nl-ref", hit.partnerCode, { httpOnly: true, sameSite: "lax", secure: to.protocol === "https:", maxAge: days * 86_400, path: "/" });
  return res;
}
