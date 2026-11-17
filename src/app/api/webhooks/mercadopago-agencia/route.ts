import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { conferirPagamento } from "@/lib/agencias/cobranca";

export const dynamic = "force-dynamic";

/**
 * Aviso do Mercado Pago das cobranças das agências (D318): ?fatura=<id>. O corpo não é confiável: a cobrança é conferida
 * na API do Mercado Pago da própria agência, e a baixa acontece uma vez só.
 */
export async function POST(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("fatura");
  if (!id || !/^agft_[a-z0-9]+$/i.test(id)) return NextResponse.json({ ok: true, ignored: true });
  try {
    const r = await conferirPagamento(await getDb(), id);
    return NextResponse.json({ ok: true, paga: r.paga });
  } catch (e) {
    console.error("[agencia webhook]", e instanceof Error ? e.message : "erro");
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() { return NextResponse.json({ ok: true, service: "mercadopago-agencia-webhook" }); }
