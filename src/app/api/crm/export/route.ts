import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { exportConsentedContactsCsv } from "@/lib/domain/crm";

export const dynamic = "force-dynamic";

/** CSV dos contatos da PRÓPRIA loja que autorizaram marketing. Só o dono da loja. */
export async function GET() {
  const session = await getSession();
  if (!session) return new NextResponse("Não autenticado", { status: 401 });
  if (session.actor.role !== "STORE_OWNER" || !session.actor.storeId) return new NextResponse("Sem permissão", { status: 403 });
  const csv = await exportConsentedContactsCsv(await getDb(), session.actor.storeId);
  return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="contatos-com-consentimento.csv"', "cache-control": "private, no-store" } });
}
