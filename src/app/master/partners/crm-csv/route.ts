import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { cartoesDeParceiros, csvDoSegmento, filtrar, filtroSchema } from "@/lib/domain/crm-parceiros";

export const dynamic = "force-dynamic";

/** CSV do segmento filtrado no funil (só Master, D251). */
export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s || s.user.role !== "NEXTLEVEL_MASTER") return new NextResponse("Não autorizado", { status: 403 });
  const f = filtroSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!f.success) return new NextResponse("Filtro inválido", { status: 400 });
  const csv = csvDoSegmento(filtrar(await cartoesDeParceiros(await getDb(), s.actor), f.data));
  return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="parceiros-segmento.csv"' } });
}
