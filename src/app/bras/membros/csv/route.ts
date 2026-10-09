import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { brasMembersActivity, brasMembersCsv, listBrasMembers } from "@/lib/domain/bras/membros";

export const dynamic = "force-dynamic";

/** CSV dos membros (só Master). Contém dados pessoais: uso interno da equipe da Brás. */
export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== "NEXTLEVEL_MASTER") return new Response("Acesso negado.", { status: 403 });
  const db = await getDb();
  const [members, activity] = await Promise.all([listBrasMembers(db, session.actor), brasMembersActivity(db, session.actor)]);
  return new Response(`﻿${brasMembersCsv(members, activity)}`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="bras-membros.csv"', "cache-control": "no-store" } });
}
