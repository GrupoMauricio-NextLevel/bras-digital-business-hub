import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { syncNextLevelPayment } from "@/lib/domain/nextlevel-billing";

export const dynamic = "force-dynamic";

/** Notificações das cobranças da NextLevel (?payment=<id>). O corpo não é confiável: a API do Mercado Pago é consultada. */
export async function POST(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("payment");
  if (!id) return NextResponse.json({ ok: true, ignored: true });
  try {
    const r = await syncNextLevelPayment(await getDb(), id);
    return NextResponse.json({ ok: true, paid: r.paid });
  } catch (e) {
    console.error("[nextlevel webhook]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() { return NextResponse.json({ ok: true, service: "mercadopago-nextlevel-webhook" }); }
