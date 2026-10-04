import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { exportCustomerData } from "@/lib/domain/privacy";
import { ForbiddenError, NotFoundError } from "@/lib/domain/errors";

export const dynamic = "force-dynamic";

/** Todos os dados de um cliente da PRÓPRIA loja (direito de acesso do titular). Só o dono. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse("Não autenticado", { status: 401 });
  const { id } = await params;
  try {
    const data = await exportCustomerData(await getDb(), session.actor, id);
    return new NextResponse(JSON.stringify(data, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": 'attachment; filename="dados-do-cliente.json"', "cache-control": "no-store" } });
  } catch (e) {
    if (e instanceof ForbiddenError) return new NextResponse("Sem permissão", { status: 403 });
    if (e instanceof NotFoundError) return new NextResponse("Não encontrado", { status: 404 });
    throw e;
  }
}
