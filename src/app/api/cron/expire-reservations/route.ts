import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { expireStaleReservations } from "@/lib/domain/orders";
import { expireUnfundedOrders } from "@/lib/domain/wallet";

export const dynamic = "force-dynamic";

/** Agende a cada 5–10 min (cron da plataforma) com o header `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  const db = await getDb();
  const r = await expireStaleReservations(db);
  const unfunded = await expireUnfundedOrders(db);
  return NextResponse.json({ ok: true, ...r, unfunded });
}
