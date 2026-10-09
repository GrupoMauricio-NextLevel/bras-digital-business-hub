import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { activities, bdImporters, bdMembers, bdOffers, bdRequests, bdVideos, users, type BrasAnalysis } from "@/db/schema";
import { brasMarginRange, type BrasLevel } from "./descobertas";
import { newId } from "@/lib/ids";
import { requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { DomainError, ForbiddenError, NotFoundError } from "../errors";
import { notifyBrasRequestCreated, notifyBrasRequestStatus } from "./avisos";
import { brasPublishedWhere } from "./videos";

/**
 * Catálogo e pedido de compra da Brás Digital (D93), primeira etapa e manual:
 * - importadora cadastrada pelo Master, sem login (o Balcão entra depois);
 * - oferta ligada à descoberta: importadora (oculta do membro até o pedido confirmado, D95), preço da caixa, unidades e
 *   caixas disponíveis (informativo, sem baixa
 *   automática nem trava de concorrência: D92 deixou o controle de estoque para depois);
 * - pedido de compra do membro com os dados de envio; a equipe da Brás confirma preço, caixas e pagamento (o pagamento
 *   vai direto para a importadora, D92). A importadora, quando tiver acesso, recebe só a visão de envio (`brasShippingView`).
 */

// ---------------------------------------------------------------------------
// Importadoras (só Master)
// ---------------------------------------------------------------------------
export const brasImporterSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da importadora").max(80),
  notes: z.string().trim().max(300).optional(),
});

export async function listBrasImporters(db: Database, actor: Actor) {
  requireMaster(actor);
  return db.select().from(bdImporters).orderBy(desc(bdImporters.active), asc(bdImporters.name));
}

export async function addBrasImporter(db: Database, actor: Actor, raw: z.input<typeof brasImporterSchema>) {
  requireMaster(actor);
  const input = brasImporterSchema.parse(raw);
  const dup = await db.select({ id: bdImporters.id }).from(bdImporters).where(sql`lower(${bdImporters.name}) = ${input.name.toLowerCase()}`).limit(1);
  if (dup.length) throw new DomainError("IMPORTER_DUP", "Já existe uma importadora com este nome.");
  const id = newId("bdi");
  await db.insert(bdImporters).values({ id, name: input.name, notes: input.notes || null });
  await recordAudit(db, actor, { action: "BRAS_IMPORTER_ADDED", entityType: "bd_importer", entityId: id, after: { name: input.name } });
  return { id };
}

export async function setBrasImporterActive(db: Database, actor: Actor, id: string, active: boolean) {
  requireMaster(actor);
  const i = await db.query.bdImporters.findFirst({ where: eq(bdImporters.id, id) });
  if (!i) throw new NotFoundError("Importadora não encontrada.");
  await db.update(bdImporters).set({ active }).where(eq(bdImporters.id, id));
  await recordAudit(db, actor, { action: "BRAS_IMPORTER_UPDATED", entityType: "bd_importer", entityId: id, before: { active: i.active }, after: { active } });
  return { ok: true as const };
}

// ---------------------------------------------------------------------------
// Oferta do vídeo (só Master define; só membro ativo vê)
// ---------------------------------------------------------------------------
export const brasOfferSchema = z.object({
  importerId: z.string().min(1, "Escolha a importadora"),
  priceBoxCents: z.number().int().min(100, "Informe o preço da caixa").max(100_000_000),
  unitsPerBox: z.number().int().min(1, "Informe quantas unidades vêm na caixa").max(100_000),
  /** Caixas disponíveis (informativo). Vazio = "consultar a equipe". */
  boxesAvailable: z.number().int().min(0).max(1_000_000).nullable(),
});

export async function setBrasOffer(db: Database, actor: Actor, videoId: string, raw: z.input<typeof brasOfferSchema>) {
  requireMaster(actor);
  const input = brasOfferSchema.parse(raw);
  const video = await db.query.bdVideos.findFirst({ where: eq(bdVideos.id, videoId), columns: { id: true } });
  if (!video) throw new NotFoundError("Vídeo não encontrado.");
  const imp = await db.query.bdImporters.findFirst({ where: eq(bdImporters.id, input.importerId) });
  if (!imp || !imp.active) throw new DomainError("IMPORTER", "Escolha uma importadora ativa.");
  const before = await db.query.bdOffers.findFirst({ where: eq(bdOffers.videoId, videoId) });
  const values = { importerId: input.importerId, priceBoxCents: input.priceBoxCents, unitsPerBox: input.unitsPerBox, boxesAvailable: input.boxesAvailable, updatedAt: new Date().toISOString(), updatedBy: actor.userId };
  if (before) await db.update(bdOffers).set(values).where(eq(bdOffers.id, before.id));
  else await db.insert(bdOffers).values({ id: newId("bdo"), videoId, ...values });
  await recordAudit(db, actor, { action: "BRAS_OFFER_SAVED", entityType: "bd_offer", entityId: videoId, before: before ? { importerId: before.importerId, priceBoxCents: before.priceBoxCents, unitsPerBox: before.unitsPerBox, boxesAvailable: before.boxesAvailable } : undefined, after: { importerId: input.importerId, priceBoxCents: input.priceBoxCents, unitsPerBox: input.unitsPerBox, boxesAvailable: input.boxesAvailable } }, { force: !before });
  return { ok: true as const };
}

export async function removeBrasOffer(db: Database, actor: Actor, videoId: string) {
  requireMaster(actor);
  await db.delete(bdOffers).where(eq(bdOffers.videoId, videoId));
  await recordAudit(db, actor, { action: "BRAS_OFFER_REMOVED", entityType: "bd_offer", entityId: videoId }, { force: true });
  return { ok: true as const };
}

/** Ofertas por vídeo para o Estúdio. */
export async function listBrasOffersForMaster(db: Database, actor: Actor) {
  requireMaster(actor);
  return db.select().from(bdOffers);
}

export type BrasFeedItem = {
  id: string; youtubeId: string; title: string; summary: string | null;
  /** Público: sinal de tendência em palavras. */
  trendSignal: string | null;
  /** Membro (cadastro grátis ativo): veredito, nota, trecho da análise e se existe análise completa. */
  member: { verdict: string | null; score: number | null; teaserYoutubeId: string | null; hasAnalysis: boolean } | null;
  /** Membro: preço da caixa e caixas. A importadora NÃO vem aqui: só aparece no pedido confirmado (D95). */
  offer: { priceBoxCents: number; unitsPerBox: number; boxesAvailable: number | null } | null;
  /** Acesso à análise: vídeo completo, dados e margem estimada. */
  analysis: { analysisYoutubeId: string | null; data: BrasAnalysis | null; margin: ReturnType<typeof brasMarginRange> } | null;
};

/**
 * Descobertas ativas na fronteira de dados (D95): cada camada só sai do servidor para quem tem o nível.
 * VISITOR: Shorts, título, gancho e sinal. MEMBER: + veredito, nota, trecho e oferta (sem importadora). ANALYST: + análise.
 */
export async function listBrasFeed(db: Database, level: BrasLevel, limit = 60, now = new Date()): Promise<BrasFeedItem[]> {
  const vids = await db.select().from(bdVideos).where(brasPublishedWhere(now)).orderBy(asc(bdVideos.position), asc(bdVideos.createdAt)).limit(limit);
  const pub = (v: typeof vids[number]): BrasFeedItem => ({ id: v.id, youtubeId: v.youtubeId, title: v.title, summary: v.summary, trendSignal: v.trendSignal, member: null, offer: null, analysis: null });
  if (level === "VISITOR" || !vids.length) return vids.map(pub);
  const offers = await db.select({ videoId: bdOffers.videoId, priceBoxCents: bdOffers.priceBoxCents, unitsPerBox: bdOffers.unitsPerBox, boxesAvailable: bdOffers.boxesAvailable, importerActive: bdImporters.active })
    .from(bdOffers).innerJoin(bdImporters, eq(bdImporters.id, bdOffers.importerId)).where(inArray(bdOffers.videoId, vids.map((v) => v.id)));
  const by = new Map(offers.filter((o) => o.importerActive).map((o) => [o.videoId, o]));
  return vids.map((v) => {
    const o = by.get(v.id);
    const offer = o ? { priceBoxCents: o.priceBoxCents, unitsPerBox: o.unitsPerBox, boxesAvailable: o.boxesAvailable } : null;
    return {
      ...pub(v),
      member: { verdict: v.verdict, score: v.score, teaserYoutubeId: v.teaserYoutubeId, hasAnalysis: !!(v.analysisYoutubeId || v.analysis) },
      offer,
      analysis: level === "ANALYST" ? { analysisYoutubeId: v.analysisYoutubeId, data: v.analysis, margin: offer ? brasMarginRange(offer.priceBoxCents, offer.unitsPerBox, v.analysis) : null } : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Pedido de compra do membro
// ---------------------------------------------------------------------------
const UF = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"] as const;
export const brasRequestSchema = z.object({
  videoId: z.string().min(1),
  boxes: z.number().int().min(1, "Mínimo de 1 caixa").max(9999, "Quantidade muito alta"),
  carrier: z.string().trim().min(2, "Informe a transportadora que vai retirar").max(80),
  shipName: z.string().trim().min(2, "Informe o destinatário").max(80),
  shipAddress: z.string().trim().min(5, "Informe o endereço de entrega").max(200),
  shipCity: z.string().trim().min(2, "Informe a cidade").max(80),
  shipState: z.enum(UF, { message: "Escolha o estado" }),
  shipZip: z.string().transform((v) => v.replace(/\D/g, "")).refine((v) => v.length === 8, "CEP com 8 números"),
  notes: z.string().trim().max(300).optional(),
});
export const BRAS_UFS = UF;

export const BRAS_REQUEST_STATUSES = ["NEW", "CONFIRMED", "PAID", "PICKED_UP", "CANCELED"] as const;
export type BrasRequestStatus = (typeof BRAS_REQUEST_STATUSES)[number];
export const BRAS_REQUEST_LABEL: Record<BrasRequestStatus, string> = { NEW: "Recebido", CONFIRMED: "Confirmado", PAID: "Pago", PICKED_UP: "Retirado", CANCELED: "Cancelado" };
/** Caminho do pedido. Cancelar vale até a retirada. */
const NEXT: Record<BrasRequestStatus, BrasRequestStatus[]> = { NEW: ["CONFIRMED", "CANCELED"], CONFIRMED: ["PAID", "CANCELED"], PAID: ["PICKED_UP", "CANCELED"], PICKED_UP: [], CANCELED: [] };
export const brasNextStatuses = (s: BrasRequestStatus) => NEXT[s];

async function activeMemberOf(db: Database, actor: Actor) {
  if (actor.role !== "BRAS_MEMBER") throw new ForbiddenError("Pedido disponível só para membros da Brás Digital.");
  const m = await db.query.bdMembers.findFirst({ where: eq(bdMembers.userId, actor.userId) });
  if (!m) throw new ForbiddenError("Cadastro de membro não encontrado.");
  return m;
}

export async function createBrasRequest(db: Database, actor: Actor, raw: z.input<typeof brasRequestSchema>) {
  const m = await activeMemberOf(db, actor);
  if (m.status !== "ACTIVE") throw new DomainError("MEMBER_BLOCKED", "Seu cadastro está em análise. Fale com a equipe da Brás Digital.");
  const input = brasRequestSchema.parse(raw);
  const [row] = await db.select({ video: bdVideos, offer: bdOffers, importer: bdImporters }).from(bdVideos)
    .innerJoin(bdOffers, eq(bdOffers.videoId, bdVideos.id)).innerJoin(bdImporters, eq(bdImporters.id, bdOffers.importerId))
    .where(eq(bdVideos.id, input.videoId)).limit(1);
  if (!row || !row.video.active || (row.video.publishAt && new Date(row.video.publishAt) > new Date()) || !row.importer.active) throw new DomainError("OFFER", "Este produto não está disponível para pedido agora.");
  // Conferência informativa (sem trava de concorrência, D92): a equipe confirma as caixas antes do pagamento.
  if (row.offer.boxesAvailable !== null && input.boxes > row.offer.boxesAvailable) throw new DomainError("BOXES", row.offer.boxesAvailable === 0 ? "Este produto está sem caixas disponíveis no momento." : `Disponível agora: ${row.offer.boxesAvailable} caixa(s).`);
  const id = newId("bdr");
  const totalCents = row.offer.priceBoxCents * input.boxes;
  await db.transaction(async (tx) => {
    const [{ n }] = await tx.select({ n: sql<number>`coalesce(max(${bdRequests.number}), 1000) + 1` }).from(bdRequests) as [{ n: number }];
    await tx.insert(bdRequests).values({
      id, number: Number(n), memberId: m.id, videoId: row.video.id, importerId: row.importer.id,
      productTitle: row.video.title, importerName: row.importer.name, boxes: input.boxes, unitsPerBox: row.offer.unitsPerBox, priceBoxCents: row.offer.priceBoxCents, totalCents,
      carrier: input.carrier, shipName: input.shipName, shipAddress: input.shipAddress, shipCity: input.shipCity, shipState: input.shipState, shipZip: input.shipZip, notes: input.notes || null,
    });
    // Aviso no sino do Master (sem dado pessoal na mensagem).
    await tx.insert(activities).values({ id: newId("act"), scope: "PLATFORM", type: "BRAS_REQUEST", message: `Brás Digital: novo pedido de ${input.boxes} caixa(s) de ${row.video.title}` });
  });
  await notifyBrasRequestCreated(db, id);
  return { id, totalCents };
}

/** Status em que o membro já sabe de qual importadora retirar (D95: antes disso ela fica oculta). */
export const BRAS_IMPORTER_VISIBLE: BrasRequestStatus[] = ["CONFIRMED", "PAID", "PICKED_UP"];

export async function listMyBrasRequests(db: Database, actor: Actor) {
  const m = await activeMemberOf(db, actor);
  const rows = await db.select().from(bdRequests).where(eq(bdRequests.memberId, m.id)).orderBy(desc(bdRequests.createdAt)).limit(200);
  return rows.map((r) => ({ ...r, importerName: BRAS_IMPORTER_VISIBLE.includes(r.status) ? r.importerName : null, importerId: BRAS_IMPORTER_VISIBLE.includes(r.status) ? r.importerId : null }));
}

/** Último endereço usado pelo membro (para já vir preenchido no próximo pedido). */
export async function lastBrasShipping(db: Database, actor: Actor) {
  const m = await activeMemberOf(db, actor);
  const [r] = await db.select({ carrier: bdRequests.carrier, shipName: bdRequests.shipName, shipAddress: bdRequests.shipAddress, shipCity: bdRequests.shipCity, shipState: bdRequests.shipState, shipZip: bdRequests.shipZip })
    .from(bdRequests).where(eq(bdRequests.memberId, m.id)).orderBy(desc(bdRequests.createdAt)).limit(1);
  return r ?? null;
}

export async function listBrasRequestsForMaster(db: Database, actor: Actor, status?: BrasRequestStatus) {
  requireMaster(actor);
  return db.select({ r: bdRequests, companyName: bdMembers.companyName, whatsapp: bdMembers.whatsapp, email: users.email })
    .from(bdRequests).innerJoin(bdMembers, eq(bdMembers.id, bdRequests.memberId)).innerJoin(users, eq(users.id, bdMembers.userId))
    .where(status ? eq(bdRequests.status, status) : undefined).orderBy(desc(bdRequests.createdAt)).limit(500);
}

export async function setBrasRequestStatus(db: Database, actor: Actor, id: string, status: BrasRequestStatus) {
  requireMaster(actor);
  const r = await db.query.bdRequests.findFirst({ where: eq(bdRequests.id, id) });
  if (!r) throw new NotFoundError("Pedido não encontrado.");
  if (!NEXT[r.status].includes(status)) throw new DomainError("STATUS", `Um pedido "${BRAS_REQUEST_LABEL[r.status]}" não pode ir para "${BRAS_REQUEST_LABEL[status]}".`);
  const upd = await db.update(bdRequests).set({ status, updatedAt: new Date().toISOString() }).where(and(eq(bdRequests.id, id), eq(bdRequests.status, r.status))).returning({ id: bdRequests.id });
  if (!upd.length) throw new DomainError("STATUS_RACE", "O pedido mudou enquanto você mexia. Atualize a página.");
  await recordAudit(db, actor, { action: "BRAS_REQUEST_STATUS", entityType: "bd_request", entityId: id, before: { status: r.status }, after: { status } });
  await notifyBrasRequestStatus(db, id, status);
  return { ok: true as const };
}

/**
 * O que a importadora (Balcão) pode receber de um pedido (D92): o que retirar e para onde enviar.
 * Lista de permissão: nunca CNPJ, empresa, e-mail, WhatsApp, observações internas, preço ou total.
 */
export function brasShippingView(r: typeof bdRequests.$inferSelect) {
  return {
    number: r.number, productTitle: r.productTitle, boxes: r.boxes, unitsPerBox: r.unitsPerBox, status: r.status,
    carrier: r.carrier, shipName: r.shipName, shipAddress: r.shipAddress, shipCity: r.shipCity, shipState: r.shipState, shipZip: r.shipZip,
  };
}
