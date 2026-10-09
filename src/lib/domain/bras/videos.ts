import { and, asc, count, eq, gte, isNotNull, isNull, lt, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { bdMembers, bdRequests, bdVideos, platformSettings } from "@/db/schema";
import { newId } from "@/lib/ids";
import { requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { DomainError, NotFoundError } from "../errors";

/**
 * Vídeos de análise de produto da Brás Digital (D92): ficam no YouTube (Shorts ou vídeo comum) e o Master cola o link.
 * A página pública mostra o vídeo com o botão de compra que leva ao cadastro. Nunca guardamos preço nem importadora aqui:
 * esses dados só existem para membro ativo, pela projeção comercial (`projectBrasCommercial`).
 */
const ID = /^[A-Za-z0-9_-]{11}$/;

/** Código do vídeo a partir do link do YouTube (watch, youtu.be, shorts, embed, live) ou do próprio código. */
export function parseYoutubeId(raw: string): string | null {
  const v = raw.trim();
  if (ID.test(v)) return v;
  let u: URL;
  try { u = new URL(v.startsWith("http") ? v : `https://${v}`); } catch { return null; }
  const host = u.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = u.pathname.split("/")[1] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") id = u.searchParams.get("v");
    else { const m = /^\/(shorts|embed|live|v)\/([^/?#]+)/.exec(u.pathname); id = m ? m[2]! : null; }
  }
  return id && ID.test(id) ? id : null;
}

export const brasVideoSchema = z.object({
  url: z.string().min(5, "Cole o link do vídeo no YouTube"),
  title: z.string().trim().min(3, "Dê um título ao vídeo").max(90, "Título com até 90 caracteres"),
  summary: z.string().trim().max(200, "Resumo com até 200 caracteres").optional(),
});

export type BrasPublicVideo = { id: string; youtubeId: string; title: string; summary: string | null; trendSignal: string | null };

/** Descoberta publicada (D101): ativa e sem agenda ou com a hora da agenda já passada. Vale para visitante, membro e pedido. */
export const brasPublishedWhere = (now = new Date()) => and(eq(bdVideos.active, true), or(isNull(bdVideos.publishAt), lte(bdVideos.publishAt, now.toISOString())));

const PUBLIC_COLS = { id: bdVideos.id, youtubeId: bdVideos.youtubeId, title: bdVideos.title, summary: bdVideos.summary, trendSignal: bdVideos.trendSignal };

/** Descobertas publicadas, na ordem do Estúdio. Só campos públicos (sem preço, importadora, veredito ou análise). */
export async function listPublicBrasVideos(db: Database, limit = 12, now = new Date()): Promise<BrasPublicVideo[]> {
  return db.select(PUBLIC_COLS).from(bdVideos).where(brasPublishedWhere(now)).orderBy(asc(bdVideos.position), asc(bdVideos.createdAt)).limit(limit);
}

/** Uma descoberta publicada para a página de compartilhamento `/d/<id>` (D101). Só campos públicos; inexistente ou fora do ar = null. */
export async function getPublicBrasVideo(db: Database, id: string, now = new Date()): Promise<BrasPublicVideo | null> {
  if (!/^bdv_[a-z0-9]{6,40}$/.test(id)) return null;
  const [v] = await db.select(PUBLIC_COLS).from(bdVideos).where(and(eq(bdVideos.id, id), brasPublishedWhere(now))).limit(1);
  return v ?? null;
}

/** Agenda a publicação (ISO) ou publica já (null). Só Master; fica na auditoria. */
export async function setBrasVideoPublishAt(db: Database, actor: Actor, id: string, publishAt: string | null) {
  requireMaster(actor);
  const v = await db.query.bdVideos.findFirst({ where: eq(bdVideos.id, id) });
  if (!v) throw new NotFoundError("Vídeo não encontrado.");
  let iso: string | null = null;
  if (publishAt) {
    const d = new Date(publishAt);
    if (Number.isNaN(d.getTime())) throw new DomainError("PUBLISH_AT", "Data de publicação inválida.");
    iso = d.toISOString();
  }
  await db.update(bdVideos).set({ publishAt: iso }).where(eq(bdVideos.id, id));
  await recordAudit(db, actor, { action: "BRAS_VIDEO_SCHEDULED", entityType: "bd_video", entityId: id, before: { publishAt: v.publishAt }, after: { publishAt: iso } });
  return { ok: true as const, publishAt: iso };
}

const GOAL_KEY = "bras.weekly_goal";
/** Meta semanal de descobertas (decisão do dono: 4 por semana no começo). `platform_settings` `bras.weekly_goal`. */
export async function brasWeeklyGoal(db: Database): Promise<number> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, GOAL_KEY) });
  const n = Number(row?.value);
  return Number.isInteger(n) && n >= 1 && n <= 50 ? n : 4;
}

/** Segunda-feira 00:00 no horário de Brasília (UTC-3, sem horário de verão desde 2019) da semana de `now`, em UTC. */
export function brasWeekStart(now = new Date()): Date {
  const local = new Date(now.getTime() - 3 * 3600_000);
  const dow = (local.getUTCDay() + 6) % 7;
  const start = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - dow) + 3 * 3600_000;
  return new Date(start);
}

/**
 * Semana do Estúdio (D101): descobertas ativas que entram no ar de segunda a domingo (agendadas pela hora da agenda;
 * sem agenda, pela data em que foram criadas), a meta e quanto falta.
 */
export async function brasWeekPlan(db: Database, actor: Actor, now = new Date()) {
  requireMaster(actor);
  const start = brasWeekStart(now);
  const end = new Date(start.getTime() + 7 * 86400_000);
  const s = start.toISOString(), e = end.toISOString();
  const rows = await db.select({ id: bdVideos.id, title: bdVideos.title, publishAt: bdVideos.publishAt, createdAt: bdVideos.createdAt }).from(bdVideos)
    .where(and(eq(bdVideos.active, true), or(and(isNotNull(bdVideos.publishAt), gte(bdVideos.publishAt, s), lt(bdVideos.publishAt, e)), and(isNull(bdVideos.publishAt), gte(bdVideos.createdAt, s), lt(bdVideos.createdAt, e)))));
  const items = rows.map((r) => ({ id: r.id, title: r.title, at: r.publishAt ?? r.createdAt, scheduled: !!r.publishAt && new Date(r.publishAt) > now })).sort((a, b) => a.at.localeCompare(b.at));
  const goal = await brasWeeklyGoal(db);
  return { start: s, end: e, goal, items, missing: Math.max(0, goal - items.length) };
}

/** Cadastros e pedidos por descoberta (D101, origem gravada no cadastro): o dono vê qual vídeo traz membro e pedido. */
export async function brasDiscoveryStats(db: Database, actor: Actor): Promise<Record<string, { signups: number; requests: number }>> {
  requireMaster(actor);
  const [s, r] = await Promise.all([
    db.select({ id: bdMembers.sourceVideoId, n: count() }).from(bdMembers).where(isNotNull(bdMembers.sourceVideoId)).groupBy(bdMembers.sourceVideoId),
    db.select({ id: bdRequests.videoId, n: count() }).from(bdRequests).groupBy(bdRequests.videoId),
  ]);
  const out: Record<string, { signups: number; requests: number }> = {};
  for (const x of s) if (x.id) (out[x.id] ??= { signups: 0, requests: 0 }).signups = Number(x.n);
  for (const x of r) if (x.id) (out[x.id] ??= { signups: 0, requests: 0 }).requests = Number(x.n);
  return out;
}

export async function listBrasVideosForMaster(db: Database, actor: Actor) {
  requireMaster(actor);
  return db.select().from(bdVideos).orderBy(asc(bdVideos.position), asc(bdVideos.createdAt));
}

export async function addBrasVideo(db: Database, actor: Actor, raw: z.input<typeof brasVideoSchema>) {
  requireMaster(actor);
  const input = brasVideoSchema.parse(raw);
  const youtubeId = parseYoutubeId(input.url);
  if (!youtubeId) throw new DomainError("VIDEO_URL", "Link do YouTube não reconhecido. Copie o link do vídeo ou do Shorts e cole aqui.");
  if (await db.query.bdVideos.findFirst({ where: eq(bdVideos.youtubeId, youtubeId), columns: { id: true } })) throw new DomainError("VIDEO_DUP", "Este vídeo já está na lista.");
  const [{ next }] = await db.select({ next: sql<number>`coalesce(max(${bdVideos.position}), -1) + 1` }).from(bdVideos) as [{ next: number }];
  const id = newId("bdv");
  await db.insert(bdVideos).values({ id, youtubeId, title: input.title, summary: input.summary || null, position: Number(next), createdBy: actor.userId });
  await recordAudit(db, actor, { action: "BRAS_VIDEO_ADDED", entityType: "bd_video", entityId: id, after: { youtubeId, title: input.title } });
  return { id, youtubeId };
}

export async function setBrasVideoActive(db: Database, actor: Actor, id: string, active: boolean) {
  requireMaster(actor);
  const v = await db.query.bdVideos.findFirst({ where: eq(bdVideos.id, id) });
  if (!v) throw new NotFoundError("Vídeo não encontrado.");
  await db.update(bdVideos).set({ active }).where(eq(bdVideos.id, id));
  await recordAudit(db, actor, { action: "BRAS_VIDEO_UPDATED", entityType: "bd_video", entityId: id, before: { active: v.active }, after: { active } });
  return { ok: true as const };
}

/** Sobe ou desce o vídeo uma posição (troca com o vizinho). */
export async function moveBrasVideo(db: Database, actor: Actor, id: string, dir: "up" | "down") {
  requireMaster(actor);
  const all = await db.select({ id: bdVideos.id }).from(bdVideos).orderBy(asc(bdVideos.position), asc(bdVideos.createdAt));
  const i = all.findIndex((v) => v.id === id);
  if (i < 0) throw new NotFoundError("Vídeo não encontrado.");
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= all.length) return { ok: true as const };
  [all[i], all[j]] = [all[j]!, all[i]!];
  await db.transaction(async (tx) => { for (const [pos, v] of all.entries()) await tx.update(bdVideos).set({ position: pos }).where(eq(bdVideos.id, v.id)); });
  return { ok: true as const };
}

export async function removeBrasVideo(db: Database, actor: Actor, id: string) {
  requireMaster(actor);
  const v = await db.query.bdVideos.findFirst({ where: eq(bdVideos.id, id) });
  if (!v) throw new NotFoundError("Vídeo não encontrado.");
  await db.delete(bdVideos).where(eq(bdVideos.id, id));
  await recordAudit(db, actor, { action: "BRAS_VIDEO_REMOVED", entityType: "bd_video", entityId: id, before: { youtubeId: v.youtubeId, title: v.title } }, { force: true });
  return { ok: true as const };
}

/** Descobertas publicadas desde uma data (D104), pela hora em que entraram no ar (agenda ou criação). Sem data = 0. */
export async function countNewBrasDiscoveries(db: Database, since: string | null, now = new Date()): Promise<number> {
  if (!since) return 0;
  const [r] = await db.select({ n: count() }).from(bdVideos).where(and(brasPublishedWhere(now), sql`coalesce(${bdVideos.publishAt}, ${bdVideos.createdAt}) > ${new Date(since).toISOString()}`));
  return Number(r?.n ?? 0);
}
