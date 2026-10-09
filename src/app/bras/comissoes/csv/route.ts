import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { brasCommissionCsv, brasCommissionReport } from "@/lib/domain/bras/comissoes";

export const dynamic = "force-dynamic";

/** CSV das comissões (só Master). Separador ; e decimal com vírgula, para o Excel em português. */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "NEXTLEVEL_MASTER") return new Response("Acesso negado.", { status: 403 });
  const month = new URL(req.url).searchParams.get("mes") ?? undefined;
  const csv = brasCommissionCsv(await brasCommissionReport(await getDb(), session.actor, month || undefined));
  return new Response(`﻿${csv}`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="bras-comissoes${month ? `-${month}` : ""}.csv"`, "cache-control": "no-store" } });
}
