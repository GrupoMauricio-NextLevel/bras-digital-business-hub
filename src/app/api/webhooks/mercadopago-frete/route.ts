import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { syncFreightPayment } from "@/lib/domain/cargas/frete-pix";

export const dynamic = "force-dynamic";

/**
 * Avisos do Pix do frete do ônibus (D119). URL registrada por cobrança: /api/webhooks/mercadopago-frete?pagamento=<id>.
 * O corpo nunca é confiável: `syncFreightPayment` consulta o pagamento na API com o token do ônibus, confere a
 * referência e o valor, e aplica uma única vez.
 */
export async function POST(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("pagamento");
  if (!id) return NextResponse.json({ ok: true, ignored: true });
  try {
    const r = await syncFreightPayment(await getDb(), id);
    return NextResponse.json({ ok: true, paid: r.paid });
  } catch (e) {
    console.error("[frete webhook]", e instanceof Error ? e.message : "erro");
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "mercadopago-frete-webhook" });
}
