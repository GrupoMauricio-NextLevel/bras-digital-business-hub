import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { bdImporters, bdRequests, bdWarehouses, trCarrierPreferences, trCarriers, trLoadEvents, trLoadRatings, trLoads } from "@/db/schema";
import { newId } from "@/lib/ids";
import { isMaster, requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { DomainError, NotFoundError } from "../errors";
import { myImporter } from "../bras/importadora";
import { carrierRatings, myCarrier } from "./cargas";
export { carrierRatings };

/**
 * Importadoras e transportadoras nas duas vias (D118). A transportadora vê as importadoras da rede (dados públicos da
 * ficha) e a demanda agregada por estado de destino (sem cliente, sem valor, sem pedido individual) e pede para ser
 * "preferida". A importadora aceita, combina a coleta fixa e avalia depois de cada coleta. A nota média é pública.
 */
const MIN_PER_UF = 3; // estado com menos pedidos que isso aparece como "outros" (não identifica ninguém)

// ---------------------------------------------------------------------------
// Transportadora → importadora
// ---------------------------------------------------------------------------
/** Importadoras na rede com a demanda dos últimos 30 dias por UF de destino (agregada) e a situação do pedido de preferida. */
export async function importersForCarrier(db: Database, actor: Actor, now = new Date()) {
  const c = await myCarrier(db, actor);
  const since = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const [imps, whs, demand, prefs] = await Promise.all([
    db.select({ id: bdImporters.id, name: bdImporters.name, pickupAddress: bdImporters.pickupAddress }).from(bdImporters).where(eq(bdImporters.active, true)).orderBy(asc(bdImporters.name)),
    db.select({ importerId: bdWarehouses.importerId, name: bdWarehouses.name, address: bdWarehouses.address, hours: bdWarehouses.hours }).from(bdWarehouses).where(eq(bdWarehouses.active, true)),
    db.select({ importerId: bdRequests.importerId, uf: bdRequests.shipState, n: sql<number>`count(*)`, boxes: sql<number>`coalesce(sum(${bdRequests.boxes}), 0)` }).from(bdRequests).where(and(gte(bdRequests.createdAt, since), inArray(bdRequests.status, ["CONFIRMED", "PAID", "PICKED_UP"]))).groupBy(bdRequests.importerId, bdRequests.shipState),
    db.select().from(trCarrierPreferences).where(eq(trCarrierPreferences.carrierId, c.id)),
  ]);
  return imps.map((i) => {
    const rows = demand.filter((d) => d.importerId === i.id);
    const shown = rows.filter((d) => Number(d.n) >= MIN_PER_UF).map((d) => ({ uf: d.uf, requests: Number(d.n), boxes: Number(d.boxes), servesUf: c.ufs.includes(d.uf) })).sort((a, b) => b.boxes - a.boxes);
    const others = rows.filter((d) => Number(d.n) < MIN_PER_UF).reduce((s, d) => s + Number(d.n), 0);
    const pref = prefs.find((p) => p.importerId === i.id);
    return { id: i.id, name: i.name, warehouses: whs.filter((w) => w.importerId === i.id).map((w) => ({ name: w.name, address: w.address, hours: w.hours })), pickupAddress: i.pickupAddress, demand: shown, otherRequests: others, preference: pref ? { status: pref.status, weekdays: pref.fixedWeekdays, time: pref.fixedTime } : null };
  });
}

export async function askPreferred(db: Database, actor: Actor, importerId: string, message?: string) {
  const c = await myCarrier(db, actor);
  const imp = await db.query.bdImporters.findFirst({ where: and(eq(bdImporters.id, importerId), eq(bdImporters.active, true)), columns: { id: true } });
  if (!imp) throw new NotFoundError("Importadora não encontrada.");
  const ex = await db.query.trCarrierPreferences.findFirst({ where: and(eq(trCarrierPreferences.importerId, importerId), eq(trCarrierPreferences.carrierId, c.id)) });
  if (ex && ex.status !== "RECUSADA") throw new DomainError("EXISTS", ex.status === "ACEITA" ? "Você já é preferida dessa importadora." : "O pedido já está com a importadora.");
  if (ex) await db.update(trCarrierPreferences).set({ status: "PEDIDO", message: message?.trim().slice(0, 300) || null, updatedAt: new Date().toISOString() }).where(eq(trCarrierPreferences.id, ex.id));
  else await db.insert(trCarrierPreferences).values({ id: newId("trcp"), importerId, carrierId: c.id, status: "PEDIDO", message: message?.trim().slice(0, 300) || null });
  return { ok: true as const };
}

// ---------------------------------------------------------------------------
// Importadora: preferidas, coleta fixa e avaliação
// ---------------------------------------------------------------------------
export async function importerPreferences(db: Database, actor: Actor) {
  const me = await myImporter(db, actor);
  const rows = await db.select({ p: trCarrierPreferences, name: trCarriers.name, contactName: trCarriers.contactName, phone: trCarriers.phone, ufs: trCarriers.ufs, operation: trCarriers.operation }).from(trCarrierPreferences).innerJoin(trCarriers, eq(trCarriers.id, trCarrierPreferences.carrierId)).where(eq(trCarrierPreferences.importerId, me.importer.id)).orderBy(desc(trCarrierPreferences.updatedAt));
  return rows.map(({ p, ...c }) => ({ id: p.id, carrierId: p.carrierId, status: p.status, message: p.message, weekdays: p.fixedWeekdays, time: p.fixedTime, ...c }));
}

export async function answerPreferred(db: Database, actor: Actor, preferenceId: string, accept: boolean) {
  const me = await myImporter(db, actor);
  const p = await db.query.trCarrierPreferences.findFirst({ where: and(eq(trCarrierPreferences.id, preferenceId), eq(trCarrierPreferences.importerId, me.importer.id)) });
  if (!p) throw new NotFoundError("Pedido não encontrado.");
  await db.update(trCarrierPreferences).set({ status: accept ? "ACEITA" : "RECUSADA", updatedAt: new Date().toISOString() }).where(eq(trCarrierPreferences.id, p.id));
  await recordAudit(db, actor, { action: accept ? "CARGAS_PREFERRED_ACCEPTED" : "CARGAS_PREFERRED_REFUSED", entityType: "tr_carrier_preference", entityId: p.id });
  return { ok: true as const };
}

/** A importadora também pode marcar como preferida direto (transportadora que ela já usa). */
export async function markPreferred(db: Database, actor: Actor, carrierId: string) {
  const me = await myImporter(db, actor);
  const c = await db.query.trCarriers.findFirst({ where: eq(trCarriers.id, carrierId), columns: { id: true } });
  if (!c) throw new NotFoundError("Transportadora não encontrada.");
  const ex = await db.query.trCarrierPreferences.findFirst({ where: and(eq(trCarrierPreferences.importerId, me.importer.id), eq(trCarrierPreferences.carrierId, carrierId)) });
  if (ex) await db.update(trCarrierPreferences).set({ status: "ACEITA", updatedAt: new Date().toISOString() }).where(eq(trCarrierPreferences.id, ex.id));
  else await db.insert(trCarrierPreferences).values({ id: newId("trcp"), importerId: me.importer.id, carrierId, status: "ACEITA" });
  return { ok: true as const };
}

export const fixedPickupSchema = z.object({
  weekdays: z.array(z.number().int().min(0).max(6)).max(7),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora no formato 15:00").or(z.literal("")),
});
/** Coleta fixa com uma preferida (ex.: toda quinta às 15h). Vazio desliga. */
export async function setFixedPickup(db: Database, actor: Actor, preferenceId: string, raw: z.input<typeof fixedPickupSchema>) {
  const me = await myImporter(db, actor);
  const v = fixedPickupSchema.parse(raw);
  const p = await db.query.trCarrierPreferences.findFirst({ where: and(eq(trCarrierPreferences.id, preferenceId), eq(trCarrierPreferences.importerId, me.importer.id)) });
  if (!p) throw new NotFoundError("Preferida não encontrada.");
  if (p.status !== "ACEITA") throw new DomainError("STATUS", "Coleta fixa só com transportadora preferida.");
  if (v.weekdays.length && !v.time) throw new DomainError("TIME", "Informe a hora da coleta fixa.");
  await db.update(trCarrierPreferences).set({ fixedWeekdays: [...new Set(v.weekdays)].sort(), fixedTime: v.time || null, updatedAt: new Date().toISOString() }).where(eq(trCarrierPreferences.id, p.id));
  return { ok: true as const };
}

/** Coletas fixas de hoje (dia da semana no horário de Brasília), para o "Hoje" da importadora e da transportadora. */
export function fixedToday<T extends { weekdays: number[]; time: string | null; status: string }>(list: T[], now = new Date()): T[] {
  const dow = new Date(now.getTime() - 3 * 3_600_000).getUTCDay();
  return list.filter((p) => p.status === "ACEITA" && p.time && p.weekdays.includes(dow));
}

/** Coletas fixas combinadas com as importadoras (para o "Hoje" da transportadora). */
export async function carrierFixedPickups(db: Database, actor: Actor) {
  const c = await myCarrier(db, actor);
  const rows = await db.select({ p: trCarrierPreferences, importer: bdImporters.name, pickupAddress: bdImporters.pickupAddress }).from(trCarrierPreferences).innerJoin(bdImporters, eq(bdImporters.id, trCarrierPreferences.importerId)).where(and(eq(trCarrierPreferences.carrierId, c.id), eq(trCarrierPreferences.status, "ACEITA")));
  return rows.map(({ p, importer, pickupAddress }) => ({ id: p.id, importer, pickupAddress, status: p.status, weekdays: p.fixedWeekdays, time: p.fixedTime }));
}

/** Coletas da importadora já avaliadas (para esconder o formulário). */
export async function ratedLoadIds(db: Database, actor: Actor) {
  const me = await myImporter(db, actor);
  const rows = await db.select({ loadId: trLoadRatings.loadId }).from(trLoadRatings).where(eq(trLoadRatings.importerId, me.importer.id));
  return new Set(rows.map((r) => r.loadId));
}

export const ratingSchema = z.object({ punctuality: z.number().int().min(1).max(5), care: z.number().int().min(1).max(5), comment: z.string().trim().max(300).optional() });
/** Avaliação da coleta (uma por coleta, só depois de coletada ou entregue). Vira a nota pública da transportadora. */
export async function rateLoad(db: Database, actor: Actor, loadId: string, raw: z.input<typeof ratingSchema>) {
  const me = await myImporter(db, actor);
  const v = ratingSchema.parse(raw);
  const l = await db.query.trLoads.findFirst({ where: and(eq(trLoads.id, loadId), eq(trLoads.importerId, me.importer.id)) });
  if (!l) throw new NotFoundError("Coleta não encontrada.");
  if (l.status !== "COLETADA" && l.status !== "ENTREGUE") throw new DomainError("STATUS", "Avalie depois da coleta.");
  if (await db.query.trLoadRatings.findFirst({ where: eq(trLoadRatings.loadId, l.id), columns: { id: true } })) throw new DomainError("RATED", "Essa coleta já foi avaliada.");
  await db.insert(trLoadRatings).values({ id: newId("trrt"), loadId: l.id, carrierId: l.carrierId, importerId: me.importer.id, punctuality: v.punctuality, care: v.care, comment: v.comment || null });
  return { ok: true as const };
}


// ---------------------------------------------------------------------------
// Conversa presa à coleta (seção 6B.3): fica no histórico da coleta, que os dois lados já veem.
// ---------------------------------------------------------------------------
export const LOAD_QUICK_MESSAGES = { importadora: ["Carga pronta", "Faltou volume", "Nota anexada"], transportadora: ["Chego em 30 min", "Estou no galpão", "Carga entregue"] } as const;
export const loadMessageSchema = z.string().trim().min(2, "Escreva a mensagem").max(300);
/**
 * Mensagem curta numa coleta. Só a importadora dona e a transportadora da coleta escrevem e leem. Ninguém vê o que o
 * próprio painel não mostra: a mensagem é texto livre do lado que escreve, e o frete nunca entra no histórico da importadora.
 */
export async function loadMessage(db: Database, actor: Actor, loadId: string, raw: string) {
  const text = loadMessageSchema.parse(raw);
  let who: string;
  let where;
  if (actor.role === "CARRIER") { const c = await myCarrier(db, actor); who = c.name; where = and(eq(trLoads.id, loadId), eq(trLoads.carrierId, c.id)); }
  else if (actor.role === "BRAS_IMPORTER") { const me = await myImporter(db, actor); who = `Importadora ${me.importer.name}`; where = and(eq(trLoads.id, loadId), eq(trLoads.importerId, me.importer.id)); }
  else if (isMaster(actor)) { who = "Equipe NextLevel Cargas"; where = eq(trLoads.id, loadId); }
  else throw new DomainError("FORBIDDEN", "Só a importadora e a transportadora da coleta conversam aqui.");
  const l = await db.query.trLoads.findFirst({ where, columns: { id: true, status: true } });
  if (!l) throw new NotFoundError("Coleta não encontrada.");
  if (l.status === "CANCELADA" || l.status === "RECUSADA") throw new DomainError("STATUS", "Coleta encerrada: não recebe mensagens.");
  await db.insert(trLoadEvents).values({ id: newId("trle"), loadId: l.id, kind: "MENSAGEM", actor: who, note: text });
  return { ok: true as const };
}

/** Coleta fixa de hoje (seção 6B.1): os pedidos prontos para os estados que a preferida atende, para a importadora confirmar. */
export function fixedPickupPlan<P extends { carrierId: string; name: string; ufs: string[]; weekdays: number[]; time: string | null; status: string }, R extends { id: string; shipState: string | null; boxes: number }>(prefs: P[], requests: R[], now = new Date()) {
  return fixedToday(prefs, now).map((p) => {
    const reqs = requests.filter((r) => r.shipState && p.ufs.includes(r.shipState));
    return { carrierId: p.carrierId, name: p.name, time: p.time!, period: (p.time! < "12:00" ? "MANHA" : "TARDE") as "MANHA" | "TARDE", requestIds: reqs.map((r) => r.id), boxes: reqs.reduce((s, r) => s + r.boxes, 0) };
  }).filter((x) => x.requestIds.length);
}

// ---------------------------------------------------------------------------
// Master: mapa de demanda (onde abrir rota)
// ---------------------------------------------------------------------------
/** Demanda por cidade de destino nos últimos 90 dias: pedidos da Brás, fardos de ônibus e indicações de ônibus/transportadora. Agregado. */
export async function demandMap(db: Database, actor: Actor, now = new Date()) {
  requireMaster(actor);
  const since = new Date(now.getTime() - 90 * 86_400_000).toISOString();
  const reqs = await db.select({ city: bdRequests.shipCity, uf: bdRequests.shipState, n: sql<number>`count(*)`, boxes: sql<number>`coalesce(sum(${bdRequests.boxes}), 0)`, withCarrier: sql<number>`count(${bdRequests.carrierId})` }).from(bdRequests).where(gte(bdRequests.createdAt, since)).groupBy(bdRequests.shipCity, bdRequests.shipState);
  const carriers = await db.select({ ufs: trCarriers.ufs, status: trCarriers.status }).from(trCarriers);
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const by = new Map<string, { city: string; uf: string; requests: number; boxes: number; withCarrier: number }>();
  for (const r of reqs) {
    const k = `${norm(r.city)}|${r.uf}`;
    const x = by.get(k) ?? { city: r.city, uf: r.uf, requests: 0, boxes: 0, withCarrier: 0 };
    x.requests += Number(r.n); x.boxes += Number(r.boxes); x.withCarrier += Number(r.withCarrier);
    by.set(k, x);
  }
  const carriersPerUf = (uf: string) => carriers.filter((c) => c.status === "ATIVA" && c.ufs.includes(uf)).length;
  return [...by.values()].map((x) => ({ ...x, carriersInUf: carriersPerUf(x.uf), withoutCatalogCarrier: x.requests - x.withCarrier })).sort((a, b) => b.boxes - a.boxes).slice(0, 100);
}
