import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { exportStoreCsv } from "@/lib/domain/privacy";
import { ForbiddenError } from "@/lib/domain/errors";

export const dynamic = "force-dynamic";

const KINDS = { pedidos: "orders", produtos: "products", clientes: "customers" } as const;

/** CSV de pedidos, produtos ou clientes da PRÓPRIA loja. Só o dono. */
export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse("Não autenticado", { status: 401 });
  const { kind } = await params;
  const k = (KINDS as Record<string, "orders" | "products" | "customers">)[kind];
  if (!k) return new NextResponse("Não encontrado", { status: 404 });
  try {
    const csv = await exportStoreCsv(await getDb(), session.actor, k);
    return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${kind}.csv"`, "cache-control": "no-store" } });
  } catch (e) {
    if (e instanceof ForbiddenError) return new NextResponse("Sem permissão", { status: 403 });
    throw e;
  }
}
