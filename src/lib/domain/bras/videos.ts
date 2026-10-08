import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { bdVideos } from "@/db/schema";
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

/** Descobertas ativas, na ordem do Estúdio. Só campos públicos (sem preço, importadora, veredito ou análise). */
export async function listPublicBrasVideos(db: Database, limit = 12): Promise<BrasPublicVideo[]> {
  return db.select({ id: bdVideos.id, youtubeId: bdVideos.youtubeId, title: bdVideos.title, summary: bdVideos.summary, trendSignal: bdVideos.trendSignal })
    .from(bdVideos).where(eq(bdVideos.active, true)).orderBy(asc(bdVideos.position), asc(bdVideos.createdAt)).limit(limit);
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
