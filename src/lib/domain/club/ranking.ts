import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { clubProfiles, clubReferrals, users } from "@/db/schema";
import { BRAS_UFS } from "@/lib/bras/ufs";
import type { Actor } from "../access";

/**
 * Ranking do "Indique e ganhe" por cidade (D122, seção 7B.5 do prompt). Só aparece quem aceitar, com o primeiro nome e
 * a cidade (sem documento). O ranking só mostra a posição: a recompensa é sempre a meta atingida (pontos por indicação
 * confirmada), nunca prêmio por posição ou sorteio (seção 12).
 */
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const monthStartBrt = (now: Date) => { const b = new Date(now.getTime() - 3 * 3600_000); return new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), 1, 3)).toISOString(); };

export const rankingOptInSchema = z.object({
  show: z.boolean(),
  city: z.string().trim().min(2, "Informe a cidade").max(80),
  uf: z.enum(BRAS_UFS),
});

/** Aceitar (ou sair) do ranking da cidade. O nome exibido é só o primeiro nome do cadastro. */
export async function setRankingOptIn(db: Database, actor: Actor, raw: z.input<typeof rankingOptInSchema>) {
  const v = rankingOptInSchema.parse(raw);
  const u = await db.query.users.findFirst({ where: eq(users.id, actor.userId), columns: { name: true } });
  const displayName = (u?.name ?? "").trim().split(/\s+/)[0] || "Membro";
  await db.insert(clubProfiles).values({ userId: actor.userId, showInRanking: v.show, displayName, city: v.city, uf: v.uf })
    .onConflictDoUpdate({ target: clubProfiles.userId, set: { showInRanking: v.show, displayName, city: v.city, uf: v.uf, updatedAt: new Date().toISOString() } });
  return { ok: true as const };
}

/** Ranking do mês na cidade de quem pergunta (indicações ativadas no mês), só entre quem aceitou aparecer. */
export async function cityRanking(db: Database, actor: Actor, now = new Date()) {
  const me = await db.query.clubProfiles.findFirst({ where: eq(clubProfiles.userId, actor.userId) });
  if (!me) return { optedIn: false, city: null, uf: null, rows: [] };
  const peers = (await db.select().from(clubProfiles).where(and(eq(clubProfiles.uf, me.uf), eq(clubProfiles.showInRanking, true)))).filter((p) => norm(p.city) === norm(me.city));
  if (!peers.length) return { optedIn: me.showInRanking, city: me.city, uf: me.uf, rows: [] };
  const counts = await db.select({ userId: clubReferrals.referrerUserId, n: sql<number>`count(*)` }).from(clubReferrals)
    .where(and(inArray(clubReferrals.referrerUserId, peers.map((p) => p.userId)), inArray(clubReferrals.status, ["ATIVOU", "RECORRENTE"]), gte(clubReferrals.activatedAt, monthStartBrt(now))))
    .groupBy(clubReferrals.referrerUserId);
  const rows = peers.map((p) => ({ userId: p.userId, name: p.displayName, activated: Number(counts.find((c) => c.userId === p.userId)?.n ?? 0) }))
    .filter((r) => r.activated > 0 || r.userId === actor.userId)
    .sort((a, b) => b.activated - a.activated || a.name.localeCompare(b.name, "pt-BR"));
  let pos = 0; let last = -1;
  return {
    optedIn: me.showInRanking, city: me.city, uf: me.uf,
    rows: rows.map((r, i) => { if (r.activated !== last) { pos = i + 1; last = r.activated; } return { position: pos, name: r.name, activated: r.activated, me: r.userId === actor.userId }; }).slice(0, 20),
  };
}
