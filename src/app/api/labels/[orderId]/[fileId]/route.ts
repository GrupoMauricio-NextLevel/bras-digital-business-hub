import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { getLabelBytes } from "@/lib/domain/labels";
import { DomainError } from "@/lib/domain/errors";

export const dynamic = "force-dynamic";

/** Download protegido: só quem enxerga o pedido (lojista dono, fornecedor/expedição, master). */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ orderId: string; fileId: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse("Não autenticado", { status: 401 });
  try {
    const { orderId, fileId } = await ctx.params;
    const f = await getLabelBytes(await getDb(), session.actor, orderId, fileId);
    return new NextResponse(Buffer.from(f.bytes), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${f.filename}"`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
  } catch (e) {
    if (e instanceof DomainError) return new NextResponse(e.message, { status: e.code === "NOT_FOUND" ? 404 : 403 });
    throw e;
  }
}
