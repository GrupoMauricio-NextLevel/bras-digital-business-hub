import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { BRAS_CONTENT_FORMATS, BRAS_CONTENT_STATUSES, bdContentItems, bdImporters, bdVideos } from "@/db/schema";
import { newId } from "@/lib/ids";
import { requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { NotFoundError } from "../errors";

/**
 * Pauta da máquina de conteúdo (D108, versão mínima da F0): do roteiro à publicação, por dia de gravação e importadora.
 * Ligada à descoberta quando o vídeo já existe. Só o Master (equipe de conteúdo) mexe.
 */
export type BrasContentFormat = (typeof BRAS_CONTENT_FORMATS)[number];
export type BrasContentStatus = (typeof BRAS_CONTENT_STATUSES)[number];
export const BRAS_FORMAT_LABEL: Record<BrasContentFormat, string> = {
  SHORTS: "Shorts de descoberta", TRECHO: "Trecho da análise", ANALISE: "Análise de mercado", TOUR: "Tour do showroom", CAIXA_ABERTA: "Caixa aberta",
  BRAS_X_ML: "Brás × Mercado Livre", CONTEINER: "Chegou no contêiner", RANKING: "Ranking da semana", TRES_JEITOS: "1 produto, 3 jeitos de vender",
};
export const BRAS_FORMAT_HINT: Record<BrasContentFormat, string> = {
  SHORTS: "30 a 60 s, vertical, público", TRECHO: "até 60 s, membro grátis", ANALISE: "5 a 10 min, horizontal, assinante", TOUR: "2 a 3 min, público", CAIXA_ABERTA: "30 a 45 s, público",
  BRAS_X_ML: "45 a 60 s, público", CONTEINER: "30 a 60 s, público e Platinum", RANKING: "60 s, público", TRES_JEITOS: "60 a 90 s, membro",
};
export const BRAS_CONTENT_STATUS_LABEL: Record<BrasContentStatus, string> = { IDEIA: "Ideia", GRAVAR: "Para gravar", GRAVADO: "Gravado", EDICAO: "Em edição", PUBLICADO: "Publicado" };
/** Ganchos testados (seção 11.1 do prompt v2), sugeridos ao criar a pauta. */
export const BRAS_HOOKS = [
  "Achei no Brás e quase ninguém vende no Mercado Livre ainda",
  "Essa caixa tem 48 unidades e…",
  "Não compre isso antes de ver a análise",
  "O que chega no próximo mês no contêiner",
];

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")).transform((v) => v || null);
const opt = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);
export const brasContentSchema = z.object({
  title: z.string().trim().min(3, "Dê um título (ex.: \"Garrafa térmica 48 un.\").").max(140),
  format: z.enum(BRAS_CONTENT_FORMATS),
  status: z.enum(BRAS_CONTENT_STATUSES).default("IDEIA"),
  importerId: opt(60), videoId: opt(60), recordDate: dateOnly, owner: opt(80), hook: opt(200), notes: opt(1000),
});

export async function listBrasContent(db: Database, actor: Actor) {
  requireMaster(actor);
  return db.select({ c: bdContentItems, importerName: bdImporters.name, videoTitle: bdVideos.title })
    .from(bdContentItems).leftJoin(bdImporters, eq(bdImporters.id, bdContentItems.importerId)).leftJoin(bdVideos, eq(bdVideos.id, bdContentItems.videoId))
    .orderBy(asc(bdContentItems.recordDate), asc(bdContentItems.createdAt)).limit(500);
}

export async function saveBrasContent(db: Database, actor: Actor, id: string | null, raw: z.input<typeof brasContentSchema>) {
  requireMaster(actor);
  const v = brasContentSchema.parse(raw);
  if (v.importerId && !(await db.query.bdImporters.findFirst({ where: eq(bdImporters.id, v.importerId), columns: { id: true } }))) throw new NotFoundError("Importadora não encontrada.");
  if (v.videoId && !(await db.query.bdVideos.findFirst({ where: eq(bdVideos.id, v.videoId), columns: { id: true } }))) throw new NotFoundError("Descoberta não encontrada.");
  if (!id) {
    const nid = newId("bdct");
    await db.insert(bdContentItems).values({ id: nid, ...v });
    return { id: nid };
  }
  const cur = await db.query.bdContentItems.findFirst({ where: eq(bdContentItems.id, id) });
  if (!cur) throw new NotFoundError("Item da pauta não encontrado.");
  await db.update(bdContentItems).set({ ...v, updatedAt: new Date().toISOString() }).where(eq(bdContentItems.id, id));
  if (cur.status !== v.status) await recordAudit(db, actor, { action: "BRAS_CONTENT_STATUS", entityType: "bd_content_item", entityId: id, before: { status: cur.status }, after: { status: v.status } });
  return { id };
}

export async function deleteBrasContent(db: Database, actor: Actor, id: string) {
  requireMaster(actor);
  await db.delete(bdContentItems).where(eq(bdContentItems.id, id));
  return { ok: true as const };
}

/** Kit do dia de gravação: quantas peças por formato estão marcadas para cada dia (para o planejamento da semana). */
export function brasRecordingDays(items: { recordDate: string | null; format: BrasContentFormat; status: BrasContentStatus }[]) {
  const days = new Map<string, Partial<Record<BrasContentFormat, number>>>();
  for (const i of items) {
    if (!i.recordDate || i.status === "PUBLICADO") continue;
    const d = days.get(i.recordDate) ?? {};
    d[i.format] = (d[i.format] ?? 0) + 1;
    days.set(i.recordDate, d);
  }
  return [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, formats]) => ({ date, formats, total: Object.values(formats).reduce((s, n) => s + (n ?? 0), 0) }));
}
