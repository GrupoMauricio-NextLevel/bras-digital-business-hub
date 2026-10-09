import { randomInt } from "node:crypto";
import { and, desc, eq, gte, inArray, isNotNull, lt } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { bdCommissionSettlements, bdImporters, bdMembers, bdRequests, platformSettings } from "@/db/schema";
import { newId } from "@/lib/ids";
import { requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { DomainError, NotFoundError } from "../errors";

/**
 * Comissão das importadoras da Brás (D102), controle manual: o dinheiro do pedido vai todo para a importadora e ela paga a
 * comissão ao dono à parte (D92). O sistema calcula por importadora e mês, o dono cobra e marca como recebida.
 * O percentual fica congelado no pedido quando ele vira Pago: mudar o percentual depois não reescreve o passado.
 * Valores em centavos; arredondamento por pedido (meio para cima). Nada é cobrado pelo sistema.
 */
const DEFAULT_KEY = "bras.default_commission_bps";
const MAX_BPS = 5000;

export async function getBrasDefaultCommissionBps(db: Database): Promise<number> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, DEFAULT_KEY) });
  const n = Number(row?.value);
  return Number.isInteger(n) && n >= 0 && n <= MAX_BPS ? n : 0;
}

export async function setBrasDefaultCommissionBps(db: Database, actor: Actor, bps: number) {
  requireMaster(actor);
  if (!Number.isInteger(bps) || bps < 0 || bps > MAX_BPS) throw new DomainError("BPS", "Comissão entre 0% e 50%.");
  const before = await getBrasDefaultCommissionBps(db);
  await db.insert(platformSettings).values({ key: DEFAULT_KEY, value: bps, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value: bps, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  await recordAudit(db, actor, { action: "BRAS_DEFAULT_COMMISSION", entityType: "platform_settings", entityId: DEFAULT_KEY, before: { bps: before }, after: { bps } });
  return { ok: true as const };
}

/** Percentual de uma importadora (null = volta ao padrão). */
export async function setBrasImporterCommission(db: Database, actor: Actor, importerId: string, bps: number | null) {
  requireMaster(actor);
  if (bps !== null && (!Number.isInteger(bps) || bps < 0 || bps > MAX_BPS)) throw new DomainError("BPS", "Comissão entre 0% e 50%.");
  const i = await db.query.bdImporters.findFirst({ where: eq(bdImporters.id, importerId) });
  if (!i) throw new NotFoundError("Importadora não encontrada.");
  await db.update(bdImporters).set({ commissionBps: bps }).where(eq(bdImporters.id, importerId));
  await recordAudit(db, actor, { action: "BRAS_IMPORTER_COMMISSION", entityType: "bd_importer", entityId: importerId, before: { bps: i.commissionBps }, after: { bps } });
  return { ok: true as const };
}

/** Percentual que vale para a importadora agora (o dela ou o padrão). */
export async function brasCommissionBpsFor(db: Database, importerId: string): Promise<number> {
  const i = await db.query.bdImporters.findFirst({ where: eq(bdImporters.id, importerId), columns: { commissionBps: true } });
  return i?.commissionBps ?? (await getBrasDefaultCommissionBps(db));
}

/** Comissão de um pedido, em centavos (meio para cima). */
export const brasCommissionCents = (totalCents: number, bps: number) => Math.round((totalCents * bps) / 10_000);

/** Mês "AAAA-MM" no horário de Brasília (UTC-3). */
export const brasMonthOf = (iso: string) => new Date(new Date(iso).getTime() - 3 * 3600_000).toISOString().slice(0, 7);
/** Início e fim (UTC) de um mês "AAAA-MM" de Brasília. */
export function brasMonthRange(month: string) {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return { start: new Date(Date.UTC(y, m - 1, 1, 3)).toISOString(), end: new Date(Date.UTC(y, m, 1, 3)).toISOString() };
}
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Código de retirada legível (sem 0/O, 1/I/L): "BD-7KQ4". Único (a coluna tem restrição; tenta de novo se colidir). */
const ALFA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const newPickupCode = () => `BD-${Array.from({ length: 4 }, () => ALFA[randomInt(ALFA.length)]).join("")}`;

export type BrasCommissionLine = { importerId: string; importerName: string; month: string; requests: { id: string; number: number; productTitle: string; boxes: number; totalCents: number; bps: number; commissionCents: number; paidAt: string; status: string }[]; totalCents: number; commissionCents: number; settlement: { id: string; amountCents: number; receivedAt: string; note: string | null } | null };

/**
 * Relatório de comissões (só Master): pedidos Pagos ou Retirados, agrupados por importadora e mês do pagamento.
 * Sem `month`, os últimos 6 meses com movimento. Mostra o fechamento ativo de cada linha, se houver.
 */
export async function brasCommissionReport(db: Database, actor: Actor, month?: string, now = new Date()): Promise<BrasCommissionLine[]> {
  requireMaster(actor);
  if (month && !MONTH.test(month)) throw new DomainError("MONTH", "Mês inválido.");
  const range = month ? brasMonthRange(month) : { start: brasMonthRange(brasMonthOf(new Date(now.getTime() - 155 * 86400_000).toISOString())).start, end: brasMonthRange(brasMonthOf(now.toISOString())).end };
  const rows = await db.select({ r: bdRequests, defaultName: bdImporters.name }).from(bdRequests).innerJoin(bdImporters, eq(bdImporters.id, bdRequests.importerId))
    .where(and(inArray(bdRequests.status, ["PAID", "PICKED_UP"]), isNotNull(bdRequests.paidAt), gte(bdRequests.paidAt, range.start), lt(bdRequests.paidAt, range.end)))
    .orderBy(desc(bdRequests.paidAt));
  const groups = new Map<string, BrasCommissionLine>();
  for (const { r, defaultName } of rows) {
    const m = brasMonthOf(r.paidAt!);
    const key = `${r.importerId}|${m}`;
    const g = groups.get(key) ?? { importerId: r.importerId, importerName: defaultName, month: m, requests: [], totalCents: 0, commissionCents: 0, settlement: null };
    const bps = r.commissionBps ?? 0;
    const c = brasCommissionCents(r.totalCents, bps);
    g.requests.push({ id: r.id, number: r.number, productTitle: r.productTitle, boxes: r.boxes, totalCents: r.totalCents, bps, commissionCents: c, paidAt: r.paidAt!, status: r.status });
    g.totalCents += r.totalCents; g.commissionCents += c;
    groups.set(key, g);
  }
  const lines = [...groups.values()];
  if (lines.length) {
    const sets = await db.select().from(bdCommissionSettlements).where(and(eq(bdCommissionSettlements.status, "ACTIVE"), inArray(bdCommissionSettlements.importerId, [...new Set(lines.map((l) => l.importerId))])));
    for (const l of lines) { const s = sets.find((x) => x.importerId === l.importerId && x.month === l.month); l.settlement = s ? { id: s.id, amountCents: s.amountCents, receivedAt: s.receivedAt, note: s.note } : null; }
  }
  return lines.sort((a, b) => b.month.localeCompare(a.month) || a.importerName.localeCompare(b.importerName));
}

export const brasSettleSchema = z.object({ importerId: z.string().min(1), month: z.string().regex(MONTH, "Mês inválido."), note: z.string().trim().max(300).optional() });

/** Marca a comissão do mês como recebida, com o valor calculado agora (fica gravado; pedido novo depois não muda o fechamento). */
export async function settleBrasCommission(db: Database, actor: Actor, raw: z.input<typeof brasSettleSchema>) {
  requireMaster(actor);
  const input = brasSettleSchema.parse(raw);
  const [line] = (await brasCommissionReport(db, actor, input.month)).filter((l) => l.importerId === input.importerId);
  if (!line) throw new DomainError("NOTHING", "Não há pedidos pagos dessa importadora nesse mês.");
  if (line.settlement) throw new DomainError("SETTLED", "Este mês já está marcado como recebido.");
  const id = newId("bdc");
  try {
    await db.insert(bdCommissionSettlements).values({ id, importerId: input.importerId, month: input.month, amountCents: line.commissionCents, requestsCount: line.requests.length, note: input.note || null, receivedAt: new Date().toISOString(), createdBy: actor.userId });
  } catch { throw new DomainError("SETTLED", "Este mês já está marcado como recebido."); }
  await recordAudit(db, actor, { action: "BRAS_COMMISSION_SETTLED", entityType: "bd_commission_settlement", entityId: id, after: { importerId: input.importerId, month: input.month, amountCents: line.commissionCents, requests: line.requests.length } }, { force: true });
  return { id, amountCents: line.commissionCents };
}

/** Desfaz um fechamento (não apaga: fica UNDONE com o motivo). */
export async function undoBrasSettlement(db: Database, actor: Actor, settlementId: string, reason: string) {
  requireMaster(actor);
  const motivo = reason.trim().slice(0, 200);
  if (!motivo) throw new DomainError("REASON", "Informe o motivo para desfazer.");
  const s = await db.query.bdCommissionSettlements.findFirst({ where: eq(bdCommissionSettlements.id, settlementId) });
  if (!s || s.status !== "ACTIVE") throw new NotFoundError("Fechamento não encontrado.");
  await db.update(bdCommissionSettlements).set({ status: "UNDONE", undoneAt: new Date().toISOString(), undoReason: motivo }).where(eq(bdCommissionSettlements.id, settlementId));
  await recordAudit(db, actor, { action: "BRAS_COMMISSION_UNDONE", entityType: "bd_commission_settlement", entityId: settlementId, before: { status: "ACTIVE", amountCents: s.amountCents }, after: { status: "UNDONE", reason: motivo } }, { force: true });
  return { ok: true as const };
}

const csvCell = (v: string | number) => { const t = String(v); return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
const reais = (c: number) => (c / 100).toFixed(2).replace(".", ",");

/** CSV (separador ;, decimal com vírgula, para abrir no Excel em português). Só dados da operação; nenhum dado do membro. */
export function brasCommissionCsv(lines: BrasCommissionLine[]): string {
  const head = ["Mês", "Importadora", "Pedido", "Produto", "Caixas", "Valor do pedido (R$)", "Comissão (%)", "Comissão (R$)", "Pago em", "Recebida"];
  const out = [head.join(";")];
  for (const l of lines) for (const r of l.requests) out.push([l.month, l.importerName, r.number, r.productTitle, r.boxes, reais(r.totalCents), (r.bps / 100).toString().replace(".", ","), reais(r.commissionCents), r.paidAt.slice(0, 10), l.settlement ? "sim" : "não"].map(csvCell).join(";"));
  return out.join("\n");
}

/**
 * Visão geral do Estúdio (D102): membros novos, pedidos por situação, mês corrente (caixas, valor, comissão),
 * pedidos parados (Recebido há mais de 24 h).
 */
export async function brasOverview(db: Database, actor: Actor, now = new Date()) {
  requireMaster(actor);
  const desde = (dias: number) => now.getTime() - dias * 86400_000;
  const [members, requests] = await Promise.all([
    db.select({ createdAt: bdMembers.createdAt, status: bdMembers.status }).from(bdMembers),
    db.select({ id: bdRequests.id, number: bdRequests.number, status: bdRequests.status, productTitle: bdRequests.productTitle, boxes: bdRequests.boxes, totalCents: bdRequests.totalCents, createdAt: bdRequests.createdAt, paidAt: bdRequests.paidAt, commissionBps: bdRequests.commissionBps, shipCity: bdRequests.shipCity, shipState: bdRequests.shipState }).from(bdRequests),
  ]);
  const mes = brasMonthOf(now.toISOString());
  const pagosMes = requests.filter((r) => (r.status === "PAID" || r.status === "PICKED_UP") && r.paidAt && brasMonthOf(r.paidAt) === mes);
  const parados = requests.filter((r) => r.status === "NEW" && new Date(r.createdAt).getTime() < now.getTime() - 86400_000).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const porSituacao = { NEW: 0, CONFIRMED: 0, PAID: 0, PICKED_UP: 0, CANCELED: 0 } as Record<string, number>;
  for (const r of requests) porSituacao[r.status] = (porSituacao[r.status] ?? 0) + 1;
  return {
    month: mes,
    members: { total: members.length, active: members.filter((m) => m.status === "ACTIVE").length, last7: members.filter((m) => new Date(m.createdAt).getTime() >= desde(7)).length, last30: members.filter((m) => new Date(m.createdAt).getTime() >= desde(30)).length },
    requests: porSituacao,
    monthPaid: { count: pagosMes.length, boxes: pagosMes.reduce((s, r) => s + r.boxes, 0), totalCents: pagosMes.reduce((s, r) => s + r.totalCents, 0), commissionCents: pagosMes.reduce((s, r) => s + brasCommissionCents(r.totalCents, r.commissionBps ?? 0), 0) },
    stalled: parados.slice(0, 5).map((r) => ({ id: r.id, number: r.number, productTitle: r.productTitle, boxes: r.boxes, city: `${r.shipCity}/${r.shipState}`, createdAt: r.createdAt })),
    stalledCount: parados.length,
  };
}

export const brasImporterDetailsSchema = z.object({
  pickupAddress: z.string().trim().max(200, "Endereço com até 200 caracteres").nullable(),
  /** Percentual (ex.: 5 ou 2,5); null = usar o padrão. */
  commissionPct: z.number().min(0, "Comissão entre 0% e 50%.").max(50, "Comissão entre 0% e 50%.").nullable(),
});

/** Endereço de retirada e comissão da importadora (só Master, auditado). */
export async function updateBrasImporterDetails(db: Database, actor: Actor, importerId: string, raw: z.input<typeof brasImporterDetailsSchema>) {
  requireMaster(actor);
  const input = brasImporterDetailsSchema.parse(raw);
  const i = await db.query.bdImporters.findFirst({ where: eq(bdImporters.id, importerId) });
  if (!i) throw new NotFoundError("Importadora não encontrada.");
  const commissionBps = input.commissionPct === null ? null : Math.round(input.commissionPct * 100);
  const pickupAddress = input.pickupAddress || null;
  await db.update(bdImporters).set({ pickupAddress, commissionBps }).where(eq(bdImporters.id, importerId));
  await recordAudit(db, actor, { action: "BRAS_IMPORTER_DETAILS", entityType: "bd_importer", entityId: importerId, before: { pickupAddress: i.pickupAddress, commissionBps: i.commissionBps }, after: { pickupAddress, commissionBps } });
  return { ok: true as const };
}
