import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { syncNextLevelPayment } from "@/lib/domain/nextlevel-billing";
import { syncNlOrder } from "@/lib/domain/nl-sales";
import { handleGatewayEvent } from "@/lib/domain/corporate-checkout";

export const dynamic = "force-dynamic";

/**
 * Notificações das cobranças da NextLevel: ?payment=<id> (faturas), ?order=<id> (Loja NextLevel pública) e
 * ?tx=<id> (checkout do catálogo Master, D90). O corpo não é confiável: a API do Mercado Pago é consultada.
 * No checkout do catálogo, cada notificação é registrada com chave única (duplicada = ignorada).
 */
export async function POST(req: NextRequest) {
  const q = new URL(req.url).searchParams;
  const id = q.get("payment"); const orderId = q.get("order"); const txId = q.get("tx");
  if (!id && !orderId && !txId) return NextResponse.json({ ok: true, ignored: true });
  try {
    const db = await getDb();
    if (txId) {
      let body: { id?: string | number; type?: string; action?: string; data?: { id?: string | number } } = {};
      try { body = await req.json(); } catch { /* sem corpo */ }
      const dataId = body.data?.id !== undefined ? String(body.data.id) : q.get("data.id");
      const eventKey = `mp:${txId}:${body.id ?? req.headers.get("x-request-id") ?? "sem-id"}:${body.action ?? body.type ?? q.get("type") ?? "payment"}:${dataId ?? ""}`;
      const r = await handleGatewayEvent(db, { gateway: "MERCADOPAGO", eventKey: eventKey.slice(0, 200), type: body.action ?? body.type ?? "payment", txId, externalId: dataId && /^\d+$/.test(dataId) ? dataId : null });
      return NextResponse.json({ ok: true, result: r.result });
    }
    const r = orderId ? await syncNlOrder(db, orderId) : await syncNextLevelPayment(db, id!);
    return NextResponse.json({ ok: true, paid: r.paid });
  } catch (e) {
    console.error("[nextlevel webhook]", e instanceof Error ? e.message : "erro");
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() { return NextResponse.json({ ok: true, service: "mercadopago-nextlevel-webhook" }); }
