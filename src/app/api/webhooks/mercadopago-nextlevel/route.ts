import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { syncNextLevelPayment } from "@/lib/domain/nextlevel-billing";
import { syncNlOrder } from "@/lib/domain/nl-sales";

export const dynamic = "force-dynamic";

/** Notificações das cobranças da NextLevel (?payment=<id> ou ?order=<id> da Loja NextLevel). O corpo não é confiável: a API do Mercado Pago é consultada. */
export async function POST(req: NextRequest) {
  const q = new URL(req.url).searchParams;
  const id = q.get("payment"); const orderId = q.get("order");
  if (!id && !orderId) return NextResponse.json({ ok: true, ignored: true });
  try {
    const db = await getDb();
    const r = orderId ? await syncNlOrder(db, orderId) : await syncNextLevelPayment(db, id!);
    return NextResponse.json({ ok: true, paid: r.paid });
  } catch (e) {
    console.error("[nextlevel webhook]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() { return NextResponse.json({ ok: true, service: "mercadopago-nextlevel-webhook" }); }
