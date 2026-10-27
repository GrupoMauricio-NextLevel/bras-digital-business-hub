import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { expireStaleReservations } from "@/lib/domain/orders";
import { expireUnfundedOrders } from "@/lib/domain/wallet";
import { runJob } from "@/lib/domain/job-runs";
import { lembrarCarrinhos } from "@/lib/domain/carrinho-abandonado";
import { reconcilePendingPayments } from "@/lib/payments/service";
import { rodarErp } from "@/lib/domain/erp";

export const dynamic = "force-dynamic";

/** Agende a cada 5–10 min (cron da plataforma) com o header `Authorization: Bearer $CRON_SECRET`. Cada etapa é isolada e o resultado fica registrado. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  const db = await getDb();
  const r = await runJob(db, "expire-reservations", [
    { name: "pagamentos", run: () => reconcilePendingPayments(db), summarize: (x: { checked: number; paid: number; failed: number }) => `conferidos ${x.checked}, pagos ${x.paid}, falhas ${x.failed}` },
    { name: "reservas", run: () => expireStaleReservations(db), summarize: (x: { expired: number }) => `liberadas ${x.expired}` },
    { name: "sem saldo", run: () => expireUnfundedOrders(db) },
    { name: "carrinhos", run: () => lembrarCarrinhos(db), summarize: (x: { primeiro: number; segundo: number }) => `1º lembrete ${x.primeiro}, 2º lembrete ${x.segundo}` },
    { name: "erp", run: () => rodarErp(db), summarize: (x: { novos: number; enviados: number; erros: number; ajustados: number }) => `na fila ${x.novos}, enviados ${x.enviados}, erros ${x.erros}, estoques ajustados ${x.ajustados}` },
  ]);
  return NextResponse.json({ ok: r.ok, ...r.results, failed: r.failed }, { status: r.ok ? 200 : 207 });
}
