import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { mergeLabels } from "@/lib/domain/labels";
import { waveLabelsPdf } from "@/lib/domain/operations";
import { DomainError } from "@/lib/domain/errors";

export const dynamic = "force-dynamic";

/** PDF único com as etiquetas dos pedidos (?ids=a,b,c) ou de uma onda (?wave=id). Só Central (ADM e expedição). */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse("Não autenticado", { status: 401 });
  const sp = new URL(req.url).searchParams;
  const ids = (sp.get("ids") ?? "").split(",").filter(Boolean);
  const wave = sp.get("wave");
  try {
    const r = wave ? await waveLabelsPdf(await getDb(), session.actor, wave) : await mergeLabels(await getDb(), session.actor, ids);
    return new NextResponse(Buffer.from(r.bytes), { headers: { "content-type": "application/pdf", "content-disposition": 'inline; filename="etiquetas.pdf"', "cache-control": "private, no-store", "x-label-pages": String(r.pages) } });
  } catch (e) {
    if (e instanceof DomainError) return new NextResponse(e.message, { status: 400 });
    throw e;
  }
}
