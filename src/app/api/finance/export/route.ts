import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { operationalExportCsv } from "@/lib/domain/operational-finance";
import { ForbiddenError } from "@/lib/domain/errors";

export const dynamic = "force-dynamic";

/** Extrato operacional do PRÓPRIO negócio (fornecedor: recargas; lojista: vendas). Nunca dados de outro tenant. */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return new NextResponse("Não autenticado", { status: 401 });
  const kind = new URL(req.url).searchParams.get("tipo");
  if (kind !== "recargas" && kind !== "vendas") return new NextResponse("Não encontrado", { status: 404 });
  try {
    const body = await operationalExportCsv(await getDb(), session.actor, kind);
    return new NextResponse(body, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${kind}.csv"`, "cache-control": "no-store" } });
  } catch (e) {
    if (e instanceof ForbiddenError) return new NextResponse("Sem permissão", { status: 403 });
    throw e;
  }
}
