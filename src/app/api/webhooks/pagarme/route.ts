import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { handleGatewayEvent } from "@/lib/domain/corporate-checkout";
import { verifyWebhookAuth } from "@/lib/payments/pagarme";

export const dynamic = "force-dynamic";

/**
 * Webhook do Pagar.me (D90). Exige a autenticação básica cadastrada no painel do Pagar.me
 * (PAGARME_WEBHOOK_USER/PASSWORD). O evento só aponta o pedido: o estado é sempre consultado na API.
 * Evento repetido (mesmo id) é ignorado.
 */
export async function POST(req: NextRequest) {
  if (!verifyWebhookAuth(req.headers.get("authorization"))) return NextResponse.json({ ok: false }, { status: 401 });
  let body: { id?: string; type?: string; data?: { id?: string; code?: string; order?: { id?: string; code?: string } } } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ ok: true, ignored: true }); }
  const orderId = body.data?.order?.id ?? (body.data?.id?.startsWith("or_") ? body.data.id : null);
  const code = body.data?.order?.code ?? body.data?.code ?? null;
  if (!body.id || !body.type || (!orderId && !code)) return NextResponse.json({ ok: true, ignored: true });
  try {
    const r = await handleGatewayEvent(await getDb(), { gateway: "PAGARME", eventKey: `pg:${body.id}`.slice(0, 200), type: body.type, txId: code && /^gtx_[a-z0-9]+$/.test(code) ? code : null, externalId: orderId });
    return NextResponse.json({ ok: true, result: r.result });
  } catch (e) {
    console.error("[pagarme webhook]", e instanceof Error ? e.message : "erro");
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() { return NextResponse.json({ ok: true, service: "pagarme-webhook" }); }
