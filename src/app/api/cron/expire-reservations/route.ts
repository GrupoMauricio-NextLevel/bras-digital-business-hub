import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { expireStaleReservations } from "@/lib/domain/orders";

export const dynamic = "force-dynamic";

/** Agende a cada 5–10 min (cron da plataforma) com o header `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  const r = await expireStaleReservations(await getDb());
  return NextResponse.json({ ok: true, ...r });
}
