import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { bdAccessGrants, bdMembers, bdRequests, bdVideos, platformSettings, users, type BrasAnalysis } from "@/db/schema";
import { newId } from "@/lib/ids";
import { requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { DomainError, NotFoundError } from "../errors";
import { parseYoutubeId } from "./videos";

/**
 * Descobertas da Brás (D95): três camadas.
 * - VISITOR (qualquer pessoa): o Shorts de descoberta, o gancho e o sinal de tendência em palavras.
 * - MEMBER (cadastro grátis ativo): + preço da caixa e pedido, veredito, nota e trecho da análise.
 * - ANALYST (acesso à análise): + vídeo completo da análise e os dados (tendência, concorrência, preço de venda, riscos,
 *   como anunciar). Na fase de lançamento a análise fica aberta aos membros; quando o dono passar a cobrar, vale assinatura
 *   (liberada à mão pelo Master até a cobrança entrar pelo Financeiro Master) OU compras pagas no período acima do volume.
 * Regra de ouro: nunca cobrar pela compra, só pela inteligência.
 */
export type BrasLevel = "VISITOR" | "MEMBER" | "ANALYST";
export type BrasAccessReason = "OPEN" | "SUBSCRIPTION" | "COURTESY" | "VOLUME" | null;

const SETTINGS_KEY = "bras.analysis_access";
export const brasAnalysisSettingsSchema = z.object({
  /** OPEN = análise aberta a todo membro (lançamento); PAID = só assinatura ou volume de compra. */
  mode: z.enum(["OPEN", "PAID"]),
  /** Preço da assinatura mensal (informativo nesta etapa: a cobrança é combinada pela equipe). Null = a definir. */
  monthlyPriceCents: z.number().int().min(0).max(10_000_000).nullable(),
  /** Compras pagas no período que liberam a análise. Null = sem liberação por volume. */
  volumeThresholdCents: z.number().int().min(0).max(1_000_000_000).nullable(),
  volumeWindowDays: z.number().int().min(7).max(90),
}).refine((s) => s.mode === "OPEN" || s.monthlyPriceCents !== null || s.volumeThresholdCents !== null, { message: "Para cobrar, defina o preço da assinatura, o volume de compra, ou os dois." });
export type BrasAnalysisSettings = z.infer<typeof brasAnalysisSettingsSchema>;
export const DEFAULT_BRAS_ANALYSIS_SETTINGS: BrasAnalysisSettings = { mode: "OPEN", monthlyPriceCents: null, volumeThresholdCents: null, volumeWindowDays: 30 };

export async function getBrasAnalysisSettings(db: Database): Promise<BrasAnalysisSettings> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, SETTINGS_KEY) });
  const parsed = brasAnalysisSettingsSchema.safeParse({ ...DEFAULT_BRAS_ANALYSIS_SETTINGS, ...(row?.value as object | undefined) });
  return parsed.success ? parsed.data : DEFAULT_BRAS_ANALYSIS_SETTINGS;
}

export async function saveBrasAnalysisSettings(db: Database, actor: Actor, raw: unknown): Promise<BrasAnalysisSettings> {
  requireMaster(actor);
  const value = brasAnalysisSettingsSchema.parse(raw);
  const before = await getBrasAnalysisSettings(db);
  await db.insert(platformSettings).values({ key: SETTINGS_KEY, value, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  await recordAudit(db, actor, { action: "BRAS_ANALYSIS_SETTINGS", entityType: "platform_settings", entityId: SETTINGS_KEY, before, after: value });
  return value;
}

/** Compras pagas (pagas ou já retiradas) do membro dentro da janela. */
export async function brasPaidVolume(db: Database, memberId: string, windowDays: number, now = new Date()): Promise<number> {
  const since = new Date(now.getTime() - windowDays * 86_400_000).toISOString();
  const [r] = await db.select({ total: sql<number>`coalesce(sum(${bdRequests.totalCents}), 0)` }).from(bdRequests)
    .where(and(eq(bdRequests.memberId, memberId), inArray(bdRequests.status, ["PAID", "PICKED_UP"]), gte(bdRequests.createdAt, since)));
  return Number(r?.total ?? 0);
}

export type BrasAccess = {
  level: BrasLevel; reason: BrasAccessReason; memberId: string | null;
  settings: BrasAnalysisSettings; volumeCents: number; grantUntil: string | null;
};

/** Nível de acesso a partir da sessão e do banco (status do membro, liberações e compras), nunca do navegador. */
export async function brasAccessFor(db: Database, session: { user: { id: string; role: string } } | null | undefined, now = new Date()): Promise<BrasAccess> {
  const settings = await getBrasAnalysisSettings(db);
  const base = { settings, volumeCents: 0, grantUntil: null, memberId: null } as const;
  if (!session?.user?.id || session.user.role !== "BRAS_MEMBER") return { ...base, level: "VISITOR", reason: null };
  const m = await db.query.bdMembers.findFirst({ where: eq(bdMembers.userId, session.user.id) });
  if (!m || m.status !== "ACTIVE") return { ...base, level: "VISITOR", reason: null };
  const [grant] = await db.select({ kind: bdAccessGrants.kind, validUntil: bdAccessGrants.validUntil }).from(bdAccessGrants)
    .where(and(eq(bdAccessGrants.memberId, m.id), isNull(bdAccessGrants.revokedAt), gte(bdAccessGrants.validUntil, now.toISOString())))
    .orderBy(desc(bdAccessGrants.validUntil)).limit(1);
  const volumeCents = await brasPaidVolume(db, m.id, settings.volumeWindowDays, now);
  const out = { settings, memberId: m.id, volumeCents, grantUntil: grant?.validUntil ?? null };
  if (settings.mode === "OPEN") return { ...out, level: "ANALYST", reason: "OPEN" };
  if (grant) return { ...out, level: "ANALYST", reason: grant.kind };
  if (settings.volumeThresholdCents !== null && volumeCents >= settings.volumeThresholdCents) return { ...out, level: "ANALYST", reason: "VOLUME" };
  return { ...out, level: "MEMBER", reason: null };
}

// ---------------------------------------------------------------------------
// Liberação de acesso à análise (só Master)
// ---------------------------------------------------------------------------
export const brasGrantSchema = z.object({
  memberId: z.string().min(1),
  kind: z.enum(["SUBSCRIPTION", "COURTESY"]),
  /** Plano concedido (D108). Padrão Prata (o acesso à análise de antes). */
  plan: z.enum(["PRATA", "OURO", "PLATINUM"]).default("PRATA"),
  days: z.number().int().min(1, "Mínimo de 1 dia").max(366, "Máximo de 1 ano"),
  note: z.string().trim().max(200).optional(),
});

export async function grantBrasAccess(db: Database, actor: Actor, raw: z.input<typeof brasGrantSchema>, now = new Date()) {
  requireMaster(actor);
  const input = brasGrantSchema.parse(raw);
  const m = await db.query.bdMembers.findFirst({ where: eq(bdMembers.id, input.memberId), columns: { id: true } });
  if (!m) throw new NotFoundError("Membro não encontrado.");
  // Renovação do MESMO plano soma a partir do fim da liberação atual (não perde os dias que faltam); plano diferente começa já.
  const [atual] = await db.select({ validUntil: bdAccessGrants.validUntil }).from(bdAccessGrants)
    .where(and(eq(bdAccessGrants.memberId, m.id), eq(bdAccessGrants.plan, input.plan), isNull(bdAccessGrants.revokedAt), gte(bdAccessGrants.validUntil, now.toISOString())))
    .orderBy(desc(bdAccessGrants.validUntil)).limit(1);
  const start = atual ? new Date(atual.validUntil) : now;
  const validUntil = new Date(start.getTime() + input.days * 86_400_000).toISOString();
  const id = newId("bdg");
  await db.insert(bdAccessGrants).values({ id, memberId: m.id, kind: input.kind, plan: input.plan, validUntil, note: input.note || null, createdBy: actor.userId });
  await recordAudit(db, actor, { action: "BRAS_ACCESS_GRANTED", entityType: "bd_access_grant", entityId: id, after: { memberId: m.id, kind: input.kind, plan: input.plan, validUntil } });
  return { id, validUntil };
}

export async function revokeBrasAccess(db: Database, actor: Actor, grantId: string) {
  requireMaster(actor);
  const g = await db.query.bdAccessGrants.findFirst({ where: eq(bdAccessGrants.id, grantId) });
  if (!g) throw new NotFoundError("Liberação não encontrada.");
  if (g.revokedAt) return { ok: true as const };
  await db.update(bdAccessGrants).set({ revokedAt: new Date().toISOString() }).where(eq(bdAccessGrants.id, grantId));
  await recordAudit(db, actor, { action: "BRAS_ACCESS_REVOKED", entityType: "bd_access_grant", entityId: grantId, before: { revoked: false }, after: { revoked: true } });
  return { ok: true as const };
}

export async function listBrasGrants(db: Database, actor: Actor) {
  requireMaster(actor);
  return db.select({ g: bdAccessGrants, companyName: bdMembers.companyName, email: users.email })
    .from(bdAccessGrants).innerJoin(bdMembers, eq(bdMembers.id, bdAccessGrants.memberId)).innerJoin(users, eq(users.id, bdMembers.userId))
    .orderBy(desc(bdAccessGrants.createdAt)).limit(300);
}

// ---------------------------------------------------------------------------
// Análise da descoberta (só Master edita)
// ---------------------------------------------------------------------------
const texto = (max: number) => z.string().trim().max(max).optional().transform((v) => v || undefined);
const optUrl = z.string().trim().optional().transform((v) => v || undefined);
export const brasDiscoverySchema = z.object({
  trendSignal: z.string().trim().max(60, "Sinal de tendência com até 60 caracteres").optional(),
  verdict: z.string().trim().max(140, "Veredito com até 140 caracteres").optional(),
  score: z.number().int().min(0).max(10).nullable().optional(),
  teaserUrl: optUrl,
  analysisUrl: optUrl,
  analysis: z.object({
    trend: texto(1200), competition: texto(1200), risks: texto(1200), howToSell: texto(1200),
    salePriceMinCents: z.number().int().min(0).max(100_000_000).optional(),
    salePriceMaxCents: z.number().int().min(0).max(100_000_000).optional(),
  }).optional(),
}).refine((d) => !d.analysis?.salePriceMinCents || !d.analysis?.salePriceMaxCents || d.analysis.salePriceMinCents <= d.analysis.salePriceMaxCents, { message: "O preço mínimo de venda não pode ser maior que o máximo." });

/** Sinais em palavras: nunca números no público. */
const NUMEROS = /\d/;

export async function setBrasDiscovery(db: Database, actor: Actor, videoId: string, raw: z.input<typeof brasDiscoverySchema>) {
  requireMaster(actor);
  const input = brasDiscoverySchema.parse(raw);
  const v = await db.query.bdVideos.findFirst({ where: eq(bdVideos.id, videoId) });
  if (!v) throw new NotFoundError("Descoberta não encontrada.");
  if (input.trendSignal && NUMEROS.test(input.trendSignal)) throw new DomainError("TREND_NUMBERS", "O sinal de tendência é público: use só palavras (ex.: \"Buscas subindo\"). Os números ficam na análise.");
  const id = (url: string | undefined, campo: string) => {
    if (!url) return null;
    const yid = parseYoutubeId(url);
    if (!yid) throw new DomainError("VIDEO_URL", `Link do YouTube não reconhecido em "${campo}".`);
    return yid;
  };
  const teaserYoutubeId = id(input.teaserUrl, "Trecho da análise");
  const analysisYoutubeId = id(input.analysisUrl, "Vídeo da análise");
  if (analysisYoutubeId && analysisYoutubeId === v.youtubeId) throw new DomainError("SAME_VIDEO", "O vídeo da análise precisa ser outro, não o Shorts público.");
  if (analysisYoutubeId && teaserYoutubeId === analysisYoutubeId) throw new DomainError("SAME_VIDEO", "O trecho precisa ser um vídeo curto separado: o link da análise completa não pode ir para quem não tem acesso.");
  const a = input.analysis ?? {};
  const analysis: BrasAnalysis | null = Object.values(a).some((x) => x !== undefined) ? a : null;
  const values = { trendSignal: input.trendSignal || null, verdict: input.verdict || null, score: input.score ?? null, teaserYoutubeId, analysisYoutubeId, analysis, analysisUpdatedAt: new Date().toISOString() };
  await db.update(bdVideos).set(values).where(eq(bdVideos.id, videoId));
  await recordAudit(db, actor, { action: "BRAS_DISCOVERY_SAVED", entityType: "bd_video", entityId: videoId, before: { verdict: v.verdict, score: v.score, analysisYoutubeId: v.analysisYoutubeId }, after: { verdict: values.verdict, score: values.score, analysisYoutubeId } }, { force: true });
  return { ok: true as const };
}

/** Margem bruta estimada por unidade (antes de taxas, frete e impostos). Estimativa, nunca garantia. */
export function brasMarginRange(priceBoxCents: number, unitsPerBox: number, a: BrasAnalysis | null | undefined) {
  if (!a?.salePriceMinCents || !a.salePriceMaxCents || unitsPerBox <= 0) return null;
  const unitCost = Math.round(priceBoxCents / unitsPerBox);
  const pct = (sale: number) => (sale > 0 ? Math.round(((sale - unitCost) / sale) * 100) : 0);
  return { unitCostCents: unitCost, minPct: pct(a.salePriceMinCents), maxPct: pct(a.salePriceMaxCents) };
}
