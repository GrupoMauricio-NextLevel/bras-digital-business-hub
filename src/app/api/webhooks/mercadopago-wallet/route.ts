import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { syncRecharge } from "@/lib/domain/wallet";

export const dynamic = "force-dynamic";

/**
 * Notificações das recargas Pix. URL registrada por cobrança: /api/webhooks/mercadopago-wallet?recharge=<id>.
 * O corpo nunca é confiável: `syncRecharge` consulta o pagamento na API com o token do fornecedor,
 * confere a referência externa e o valor, e credita uma única vez.
 */
export async function POST(req: NextRequest) {
  const rechargeId = new URL(req.url).searchParams.get("recharge");
  if (!rechargeId) return NextResponse.json({ ok: true, ignored: true });
  try {
    const r = await syncRecharge(await getDb(), rechargeId);
    return NextResponse.json({ ok: true, paid: r.paid });
  } catch (e) {
    console.error("[wallet webhook]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "mercadopago-wallet-webhook" });
}
