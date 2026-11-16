import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { expireStaleReservations } from "@/lib/domain/orders";
import { expireUnfundedOrders } from "@/lib/domain/wallet";
import { runJob } from "@/lib/domain/job-runs";
import { lembrarCarrinhos } from "@/lib/domain/carrinho-abandonado";
import { reconcilePendingPayments } from "@/lib/payments/service";
import { rodarErp } from "@/lib/domain/erp";
import { enfileirarPagantes, enviarConversoes } from "@/lib/domain/trafego/retorno";
import { sincronizarMeta } from "@/lib/domain/trafego/meta-leitura";

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
    // TR5 (D298): quem virou pagante entra na fila; a fila vai para a Meta e o Google.
    { name: "retorno às plataformas", run: async () => ({ pagantes: await enfileirarPagantes(db), ...(await enviarConversoes(db)) }), summarize: (x: { pagantes: number; enviados: number; falhas: number; ignorados: number }) => `pagantes novos ${x.pagantes}, enviados ${x.enviados}, falhas ${x.falhas}, fora da janela ${x.ignorados}` },
    // TR6 (D302): números das campanhas na Meta (no máximo uma leitura por hora).
    { name: "leitura da Meta", run: () => sincronizarMeta(db), summarize: (x: { pulou?: boolean; contas: number; linhas: number; ok: boolean }) => x.pulou ? "lida há menos de 1 hora" : `${x.contas} conta(s), ${x.linhas} linha(s)${x.ok ? "" : ", com aviso"}` },
    { name: "erp", run: () => rodarErp(db), summarize: (x: { novos: number; enviados: number; erros: number; ajustados: number }) => `na fila ${x.novos}, enviados ${x.enviados}, erros ${x.erros}, estoques ajustados ${x.ajustados}` },
  ]);
  return NextResponse.json({ ok: r.ok, ...r.results, failed: r.failed }, { status: r.ok ? 200 : 207 });
}
