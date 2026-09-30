import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { syncMercadoPagoPayment } from "@/lib/payments/service";

export const dynamic = "force-dynamic";

/**
 * Notificações do Mercado Pago. URL registrada por preferência: /api/webhooks/mercadopago?store=<slug>
 * Aceita os formatos `?type=payment&data.id=123` e o corpo JSON `{ type, data: { id } }`.
 * Responde 200 sempre que a notificação foi entendida, para o MP não reenviar indefinidamente.
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const storeSlug = url.searchParams.get("store");
  let type = url.searchParams.get("type") ?? url.searchParams.get("topic");
  let paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  try {
    const body = (await req.json()) as { type?: string; topic?: string; data?: { id?: string | number }; resource?: string };
    type = type ?? body.type ?? body.topic ?? null;
    paymentId = paymentId ?? (body.data?.id !== undefined ? String(body.data.id) : null) ?? (body.resource ? body.resource.split("/").pop() ?? null : null);
  } catch { /* sem corpo */ }
  if (!storeSlug || !paymentId || (type && type !== "payment")) return NextResponse.json({ ok: true, ignored: true });
  try {
    const r = await syncMercadoPagoPayment(await getDb(), { storeSlug, paymentId });
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    console.error("[mercadopago webhook]", e);
    // 500 faz o Mercado Pago tentar novamente (falha transitória de rede/banco).
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "mercadopago-webhook" });
}
