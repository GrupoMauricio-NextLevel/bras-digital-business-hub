import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { runDailyFinanceJobs } from "@/lib/domain/finance";
import { reconcilePendingPayments } from "@/lib/payments/service";
import { expireStaleReservations } from "@/lib/domain/orders";
import { expireUnfundedOrders } from "@/lib/domain/wallet";

export const dynamic = "force-dynamic";

/**
 * Rotina financeira diária. Agende uma vez por dia (ex.: 03:00 UTC) com `Authorization: Bearer $CRON_SECRET`.
 * No dia 1 emite mensalidades e fecha o mês anterior; todo dia atualiza atrasos, bloqueios e reservas vencidas.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  const db = await getDb();
  const finance = await runDailyFinanceJobs(db);
  const reconciled = await reconcilePendingPayments(db);
  const reservations = await expireStaleReservations(db);
  const unfunded = await expireUnfundedOrders(db);
  return NextResponse.json({ ok: true, finance, reconciled, reservations, unfunded });
}
