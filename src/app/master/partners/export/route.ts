import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { partnersCsv } from "@/lib/domain/partners";

export const dynamic = "force-dynamic";

/** CSV do mês (só Master). */
export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s || s.user.role !== "NEXTLEVEL_MASTER") return new NextResponse("Não autorizado", { status: 403 });
  const period = req.nextUrl.searchParams.get("period") ?? "";
  if (!/^\d{4}-\d{2}$/.test(period)) return new NextResponse("Competência inválida", { status: 400 });
  return new NextResponse(await partnersCsv(await getDb(), s.actor, period), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="parceiros-${period}.csv"` } });
}
