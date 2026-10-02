import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { runDailyFinanceJobs } from "@/lib/domain/finance";
import { expireStaleReservations } from "@/lib/domain/orders";
import { expireUnfundedOrders } from "@/lib/domain/wallet";
import { runJob } from "@/lib/domain/job-runs";
import { sendDailySummary } from "@/lib/domain/daily-summary";
import { reconcilePendingPayments } from "@/lib/payments/service";

export const dynamic = "force-dynamic";

/**
 * Rotina financeira diária. Agende uma vez por dia (ex.: 03:00 UTC) com `Authorization: Bearer $CRON_SECRET`.
 * No dia 1 emite mensalidades e fecha o mês anterior; todo dia atualiza atrasos, bloqueios e reservas vencidas.
 * Cada etapa é isolada: se uma falha, as outras rodam, o erro fica registrado e a resposta é 207.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  const db = await getDb();
  const r = await runJob(db, "finance", [
    { name: "financeiro", run: () => runDailyFinanceJobs(db) },
    { name: "pagamentos", run: () => reconcilePendingPayments(db), summarize: (x: { checked: number; paid: number }) => `conferidos ${x.checked}, pagos ${x.paid}` },
    { name: "reservas", run: () => expireStaleReservations(db), summarize: (x: { expired: number }) => `liberadas ${x.expired}` },
    { name: "sem saldo", run: () => expireUnfundedOrders(db) },
    { name: "resumo", run: () => sendDailySummary(db), summarize: (x: { recipients: number }) => `enviado a ${x.recipients}` },
  ]);
  return NextResponse.json({ ok: r.ok, ...r.results, failed: r.failed }, { status: r.ok ? 200 : 207 });
}
