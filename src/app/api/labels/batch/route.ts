import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { mergeLabels } from "@/lib/domain/labels";
import { DomainError } from "@/lib/domain/errors";

export const dynamic = "force-dynamic";

/** PDF único com as etiquetas dos pedidos (?ids=a,b,c). Só Central (ADM e expedição). */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse("Não autenticado", { status: 401 });
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").filter(Boolean);
  try {
    const r = await mergeLabels(await getDb(), session.actor, ids);
    return new NextResponse(Buffer.from(r.bytes), { headers: { "content-type": "application/pdf", "content-disposition": 'inline; filename="etiquetas.pdf"', "cache-control": "private, no-store", "x-label-pages": String(r.pages) } });
  } catch (e) {
    if (e instanceof DomainError) return new NextResponse(e.message, { status: 400 });
    throw e;
  }
}
