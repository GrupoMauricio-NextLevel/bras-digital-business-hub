import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { bdMembers, bdRequests, trCarriers, trParcelEvents, trParcels, trRoutes, trTrips } from "@/db/schema";
import { newId } from "@/lib/ids";
import { BRAS_UFS } from "@/lib/bras/ufs";
import { isValidNfeKey, normalizeNfeKey } from "@/lib/fiscal/nfe";
import { isMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { DomainError, ForbiddenError, NotFoundError } from "../errors";
import { getGroupCompanies, groupDocuments } from "../grupo";
import { activateCarrierReferral } from "../club/indicacoes";
import { carrierByDriverToken, myCarrier } from "./cargas";
import { excursionFeeCents, getExcursionRules, PARCEL_SIZES, type ParcelSize } from "./regras-excursao";

/**
 * Cargas Excursão (D114): o ônibus de excursão como rede de frete do Brás. Rota fixa → viagem com bagageiro medido em
 * fardinhos equivalentes → fardos (P, M, G) com preço e taxa congelados. O cliente reserva, o dono do ônibus aceita como
 * num app de corrida, o ajudante coleta no Brás pelo código da etiqueta e entrega na cidade com o código do cliente.
 * Fronteiras: o dono do ônibus vê destinatário e loja de coleta, nunca CNPJ, e-mail ou WhatsApp do cliente; o
 * ajudante não vê valores; o cliente vê só os próprios fardos.
 */

const priceCents = z.number().int().min(0).max(1_000_000);

// ---------------------------------------------------------------------------
// Escopo do dono do ônibus
// ---------------------------------------------------------------------------
async function busScope(db: Database, actor: Actor, carrierId: string | null) {
  if (isMaster(actor)) {
    if (!carrierId) throw new DomainError("CARRIER", "Escolha o ônibus.");
    const c = await db.query.trCarriers.findFirst({ where: eq(trCarriers.id, carrierId) });
    if (!c) throw new NotFoundError("Transportadora não encontrada.");
    return c;
  }
  const c = await myCarrier(db, actor);
  if (carrierId && carrierId !== c.id) throw new ForbiddenError();
  if (c.operation !== "EXCURSAO") throw new ForbiddenError("Viagens e fardos são do ônibus de excursão. Fale com a NextLevel Cargas para mudar o tipo.");
  return c;
}

// ---------------------------------------------------------------------------
// Rotas
// ---------------------------------------------------------------------------
export const routeSchema = z.object({
  name: z.string().trim().min(3, "Dê um nome à rota").max(80),
  originCity: z.string().trim().min(2, "Informe a cidade de origem").max(80),
  originUf: z.enum(BRAS_UFS),
  citiesServed: z.array(z.object({ city: z.string().trim().min(2).max(80), uf: z.enum(BRAS_UFS) })).max(30).default([]),
  brasPoint: z.string().trim().min(5, "Informe o ponto de embarque no Brás").max(200),
  cityPoint: z.string().trim().min(5, "Informe onde o cliente retira na cidade").max(200),
  arrivalWeekdays: z.array(z.number().int().min(0).max(6)).max(7).default([]),
  travelHours: z.number().int().min(1).max(96),
  prices: z.object({ P: priceCents, M: priceCents, G: priceCents }),
  active: z.boolean().default(true),
}).superRefine((v, ctx) => {
  if (!(v.prices.P > 0 && v.prices.P <= v.prices.M && v.prices.M <= v.prices.G)) ctx.addIssue({ code: "custom", path: ["prices"], message: "Preço do P maior que zero, e o maior fardo nunca mais barato que o menor." });
});
export type RouteInput = z.input<typeof routeSchema>;

export async function saveRoute(db: Database, actor: Actor, carrierId: string | null, routeId: string | null, raw: RouteInput) {
  const c = await busScope(db, actor, carrierId);
  const v = routeSchema.parse(raw);
  if (routeId) {
    const r = await db.query.trRoutes.findFirst({ where: and(eq(trRoutes.id, routeId), eq(trRoutes.carrierId, c.id)) });
    if (!r) throw new NotFoundError("Rota não encontrada.");
    await db.update(trRoutes).set({ ...v, updatedAt: new Date().toISOString() }).where(eq(trRoutes.id, r.id));
    await recordAudit(db, actor, { action: "EXCURSION_ROUTE_SAVED", entityType: "tr_route", entityId: r.id, before: { prices: r.prices }, after: { prices: v.prices } }, { force: true });
    return { id: r.id };
  }
  const id = newId("trr");
  await db.insert(trRoutes).values({ id, carrierId: c.id, ...v });
  await recordAudit(db, actor, { action: "EXCURSION_ROUTE_SAVED", entityType: "tr_route", entityId: id, after: { prices: v.prices } }, { force: true });
  return { id };
}

export async function listRoutes(db: Database, actor: Actor, carrierId: string | null) {
  const c = await busScope(db, actor, carrierId);
  return db.select().from(trRoutes).where(eq(trRoutes.carrierId, c.id)).orderBy(asc(trRoutes.name));
}

// ---------------------------------------------------------------------------
// Viagens
// ---------------------------------------------------------------------------
export const tripSchema = z.object({
  routeId: z.string().min(1, "Escolha a rota"),
  /** Chegada ao Brás e saída de São Paulo, "AAAA-MM-DDTHH:MM" no horário de Brasília. */
  arriveBrasAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Informe dia e hora da chegada ao Brás"),
  departAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Informe dia e hora da saída"),
  capacityUnits: z.number().int().min(10).max(2000).optional(),
});
const brt = (local: string) => new Date(`${local}:00-03:00`).toISOString();

export async function createTrip(db: Database, actor: Actor, carrierId: string | null, raw: z.input<typeof tripSchema>, now = new Date()) {
  const c = await busScope(db, actor, carrierId);
  const v = tripSchema.parse(raw);
  const route = await db.query.trRoutes.findFirst({ where: and(eq(trRoutes.id, v.routeId), eq(trRoutes.carrierId, c.id)) });
  if (!route || !route.active) throw new NotFoundError("Rota não encontrada ou pausada.");
  const arrive = brt(v.arriveBrasAt), depart = brt(v.departAt);
  if (depart <= arrive) throw new DomainError("DATES", "A saída precisa ser depois da chegada ao Brás.");
  if (new Date(depart) < now) throw new DomainError("DATES", "A saída já passou.");
  const rules = await getExcursionRules(db);
  const id = newId("trt");
  let number = 0;
  await db.transaction(async (tx) => {
    const [{ n }] = await tx.select({ n: sql<number>`coalesce(max(${trTrips.number}), 8000) + 1` }).from(trTrips) as [{ n: number }];
    number = Number(n);
    const arriveCity = new Date(new Date(depart).getTime() + route.travelHours * 3_600_000).toISOString();
    await tx.insert(trTrips).values({ id, number, routeId: route.id, carrierId: c.id, arriveBrasAt: arrive, departAt: depart, arriveCityAt: arriveCity, capacityUnits: v.capacityUnits ?? rules.defaultCapacityUnits });
  });
  await recordAudit(db, actor, { action: "EXCURSION_TRIP_CREATED", entityType: "tr_trip", entityId: id, after: { number, routeId: route.id } }, { force: true });
  return { id, number };
}

const OCCUPYING = ["ACEITO", "PRONTO", "COLETADO", "EM_VIAGEM", "CHEGOU", "ENTREGUE"] as const;
const ACTIVE_PARCEL = ["SOLICITADO", "ESPERA", "ACEITO", "PRONTO", "COLETADO", "EM_VIAGEM", "CHEGOU"] as const;

async function occupiedUnits(db: Pick<Database, "select">, tripId: string) {
  const [r] = await db.select({ u: sql<number>`coalesce(sum(${trParcels.units}), 0)` }).from(trParcels).where(and(eq(trParcels.tripId, tripId), inArray(trParcels.status, [...OCCUPYING])));
  return Number(r?.u ?? 0);
}

async function parcelEvent(db: Pick<Database, "insert">, parcelId: string, kind: string, actor: string, note?: string | null) {
  await db.insert(trParcelEvents).values({ id: newId("trpe"), parcelId, kind, actor, note: note ?? null });
}

/** Viagem: saí de São Paulo, cheguei, encerrar, cancelar. Ao sair, os fardos coletados viram "em viagem" e os não coletados voltam para o cliente. */
export async function tripAction(db: Database, actor: Actor, tripId: string, action: "FECHAR" | "REABRIR" | "SAIR" | "CHEGAR" | "ENCERRAR" | "CANCELAR", now = new Date()) {
  const t = await db.query.trTrips.findFirst({ where: eq(trTrips.id, tripId) });
  if (!t) throw new NotFoundError("Viagem não encontrada.");
  const c = await busScope(db, actor, isMaster(actor) ? t.carrierId : null);
  if (c.id !== t.carrierId) throw new ForbiddenError();
  const from: Record<typeof action, string[]> = { FECHAR: ["ABERTA"], REABRIR: ["LOTADA"], SAIR: ["ABERTA", "LOTADA"], CHEGAR: ["EM_VIAGEM"], ENCERRAR: ["CHEGOU"], CANCELAR: ["ABERTA", "LOTADA"] };
  if (!from[action].includes(t.status)) throw new DomainError("STATUS", "Essa ação não vale para a situação atual da viagem.");
  const to = { FECHAR: "LOTADA", REABRIR: "ABERTA", SAIR: "EM_VIAGEM", CHEGAR: "CHEGOU", ENCERRAR: "ENCERRADA", CANCELAR: "CANCELADA" } as const;
  const who = c.name;
  await db.transaction(async (tx) => {
    await tx.update(trTrips).set({ status: to[action], updatedAt: now.toISOString(), ...(action === "SAIR" ? { departedAt: now.toISOString() } : action === "CHEGAR" ? { arrivedAt: now.toISOString() } : {}) }).where(eq(trTrips.id, t.id));
    const parcels = await tx.select({ id: trParcels.id, status: trParcels.status }).from(trParcels).where(eq(trParcels.tripId, t.id));
    for (const p of parcels) {
      let next: (typeof trParcels.$inferSelect)["status"] | null = null;
      if (action === "SAIR") next = p.status === "COLETADO" ? "EM_VIAGEM" : (["SOLICITADO", "ESPERA", "ACEITO", "PRONTO"] as string[]).includes(p.status) ? "NAO_EMBARCOU" : null;
      if (action === "CHEGAR" && p.status === "EM_VIAGEM") next = "CHEGOU";
      if (action === "CANCELAR" && (ACTIVE_PARCEL as readonly string[]).includes(p.status)) next = "CANCELADO";
      if (next) { await tx.update(trParcels).set({ status: next, updatedAt: now.toISOString() }).where(eq(trParcels.id, p.id)); await parcelEvent(tx, p.id, next, who, action === "CANCELAR" ? "Viagem cancelada pelo ônibus" : null); }
    }
  });
  if (action === "ENCERRAR") await activateCarrierReferral(db, c.id, now);
  return { ok: true as const, status: to[action] };
}

// ---------------------------------------------------------------------------
// Cliente: achar ônibus e reservar
// ---------------------------------------------------------------------------
/** Viagens abertas para a UF (e cidade, se houver) de entrega: origem ou cidade atendida na rota. Ordem pública: data, preço. */
export async function excursionOptions(db: Database, opts: { uf: string; city?: string }, now = new Date()) {
  const rows = await db.select({ t: trTrips, r: trRoutes, c: trCarriers }).from(trTrips).innerJoin(trRoutes, eq(trRoutes.id, trTrips.routeId)).innerJoin(trCarriers, eq(trCarriers.id, trTrips.carrierId))
    .where(and(inArray(trTrips.status, ["ABERTA", "LOTADA"]), gte(trTrips.departAt, now.toISOString()), eq(trCarriers.status, "ATIVA"), eq(trRoutes.active, true))).orderBy(asc(trTrips.departAt)).limit(200);
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const serves = (r: typeof trRoutes.$inferSelect) => {
    const all = [{ city: r.originCity, uf: r.originUf }, ...r.citiesServed];
    return all.some((x) => x.uf === opts.uf && (!opts.city || norm(x.city) === norm(opts.city)));
  };
  const grupo = groupDocuments(await getGroupCompanies(db));
  const out = [];
  for (const { t, r, c } of rows.filter((x) => serves(x.r))) {
    const used = await occupiedUnits(db, t.id);
    out.push({
      tripId: t.id, number: t.number, carrierId: c.id, carrierName: c.name, groupCompany: grupo.has(c.document), routeName: r.name,
      origin: `${r.originCity}/${r.originUf}`, cities: r.citiesServed.map((x) => `${x.city}/${x.uf}`), brasPoint: r.brasPoint, cityPoint: r.cityPoint,
      arriveBrasAt: new Date(t.arriveBrasAt).toISOString(), departAt: new Date(t.departAt).toISOString(), arriveCityAt: t.arriveCityAt ? new Date(t.arriveCityAt).toISOString() : null,
      prices: r.prices, capacityUnits: t.capacityUnits, usedUnits: used, full: t.status === "LOTADA" || used >= t.capacityUnits,
    });
  }
  return out;
}

export const reserveSchema = z.object({
  tripId: z.string().min(1),
  items: z.object({ P: z.number().int().min(0).max(50), M: z.number().int().min(0).max(50), G: z.number().int().min(0).max(50) }).refine((v) => v.P + v.M + v.G > 0, "Escolha pelo menos um fardo").refine((v) => v.P + v.M + v.G <= 50, "Até 50 fardos por reserva"),
  storeName: z.string().trim().min(2, "Informe a loja onde o ônibus coleta").max(120),
  storeAddress: z.string().trim().max(200).optional().transform((v) => v || null),
  recipientName: z.string().trim().min(2, "Informe quem retira na cidade").max(80),
  requestId: z.string().max(60).optional().transform((v) => v || null),
  invoiceKey: z.string().optional().transform((v) => (v ? normalizeNfeKey(v) : null)).refine((v) => v === null || isValidNfeKey(v), "Chave da nota inválida. Confira os 44 números."),
});

const code = () => `EX-${randomBytes(3).toString("hex").toUpperCase()}`;

async function clientOf(db: Database, actor: Actor) {
  if (actor.role !== "BRAS_MEMBER") throw new ForbiddenError("Reserva de fardo disponível para membros da Brás Digital.");
  const m = await db.query.bdMembers.findFirst({ where: eq(bdMembers.userId, actor.userId) });
  if (!m) throw new ForbiddenError("Cadastro de membro não encontrado.");
  if (m.status !== "ACTIVE") throw new DomainError("MEMBER_BLOCKED", "Seu cadastro está em análise. Fale com a equipe da Brás Digital.");
  return m;
}

/** Reserva: um fardo por unidade (cada um com etiqueta e código). Viagem lotada → lista de espera. Preço congelado. */
export async function reserveParcels(db: Database, actor: Actor, raw: z.input<typeof reserveSchema>, now = new Date()) {
  const m = await clientOf(db, actor);
  const v = reserveSchema.parse(raw);
  const row = await db.select({ t: trTrips, r: trRoutes, c: trCarriers }).from(trTrips).innerJoin(trRoutes, eq(trRoutes.id, trTrips.routeId)).innerJoin(trCarriers, eq(trCarriers.id, trTrips.carrierId)).where(eq(trTrips.id, v.tripId)).limit(1).then((x) => x[0]);
  if (!row || !(["ABERTA", "LOTADA"] as string[]).includes(row.t.status) || row.c.status !== "ATIVA" || new Date(row.t.departAt) < now) throw new DomainError("TRIP", "Essa viagem não está recebendo fardos.");
  if (v.requestId) {
    const req = await db.query.bdRequests.findFirst({ where: and(eq(bdRequests.id, v.requestId), eq(bdRequests.memberId, m.id)) });
    if (!req) throw new NotFoundError("Pedido não encontrado.");
  }
  const rules = await getExcursionRules(db);
  const used = await occupiedUnits(db, row.t.id);
  const wanted = PARCEL_SIZES.reduce((s, k) => s + v.items[k] * rules.sizes[k].units, 0);
  const waitlist = row.t.status === "LOTADA" || used + wanted > row.t.capacityUnits;
  const created: { id: string; label: string; size: ParcelSize; deliveryCode: string; priceCents: number }[] = [];
  await db.transaction(async (tx) => {
    const [{ n }] = await tx.select({ n: sql<number>`coalesce(max(${trParcels.seq}), 0)` }).from(trParcels).where(eq(trParcels.tripId, row.t.id)) as [{ n: number }];
    let seq = Number(n);
    for (const size of PARCEL_SIZES) {
      for (let i = 0; i < v.items[size]; i++) {
        seq++;
        const id = newId("trp");
        const deliveryCode = code();
        const price = row.r.prices[size];
        await tx.insert(trParcels).values({
          id, tripId: row.t.id, carrierId: row.c.id, clientUserId: actor.userId, memberId: m.id, requestId: v.requestId, seq, size, units: rules.sizes[size].units, priceCents: price,
          storeName: v.storeName, storeAddress: v.storeAddress, recipientName: v.recipientName, deliveryCode, invoiceKey: v.invoiceKey, status: waitlist ? "ESPERA" : "SOLICITADO",
        });
        await parcelEvent(tx, id, waitlist ? "ESPERA" : "SOLICITADO", "Cliente", null);
        created.push({ id, label: `${row.t.number}-${String(seq).padStart(2, "0")}`, size, deliveryCode, priceCents: price });
      }
    }
  });
  await recordAudit(db, actor, { action: "EXCURSION_PARCELS_RESERVED", entityType: "tr_trip", entityId: row.t.id, after: { count: created.length, waitlist } });
  const total = created.reduce((s, x) => s + x.priceCents, 0);
  const text = `Olá! Os fardos do meu pedido vão no ônibus ${row.c.name}, viagem ${row.t.number}, que sai do Brás em ${new Date(row.t.departAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}. Etiquetas: ${created.map((x) => x.label).join(", ")}. Ponto de embarque: ${row.r.brasPoint}.`;
  return { waitlist, parcels: created, totalCents: total, storeMessage: text };
}

/** Cliente cancela antes da coleta e dentro do prazo da regra. */
export async function cancelMyParcel(db: Database, actor: Actor, parcelId: string, now = new Date()) {
  const p = await db.query.trParcels.findFirst({ where: and(eq(trParcels.id, parcelId), eq(trParcels.clientUserId, actor.userId)) });
  if (!p) throw new NotFoundError("Fardo não encontrado.");
  if (!(["SOLICITADO", "ESPERA", "ACEITO", "PRONTO"] as string[]).includes(p.status)) throw new DomainError("STATUS", "Esse fardo já foi coletado e não pode ser cancelado.");
  const t = (await db.query.trTrips.findFirst({ where: eq(trTrips.id, p.tripId) }))!;
  const rules = await getExcursionRules(db);
  if (p.status !== "SOLICITADO" && p.status !== "ESPERA" && new Date(t.departAt).getTime() - now.getTime() < rules.cancelHours * 3_600_000) throw new DomainError("LATE", `Cancelamento até ${rules.cancelHours} h antes da saída. Fale com o ônibus.`);
  await db.update(trParcels).set({ status: "CANCELADO", updatedAt: now.toISOString() }).where(eq(trParcels.id, p.id));
  await parcelEvent(db, p.id, "CANCELADO", "Cliente", null);
  return { ok: true as const };
}

/** Nota do fardo (cliente ou dono do ônibus): chave conferida pelo dígito. */
export async function setParcelInvoice(db: Database, actor: Actor, parcelId: string, key: string) {
  const p = await db.query.trParcels.findFirst({ where: eq(trParcels.id, parcelId) });
  if (!p) throw new NotFoundError("Fardo não encontrado.");
  const own = p.clientUserId === actor.userId || (actor.role === "CARRIER" && (await myCarrier(db, actor)).id === p.carrierId) || isMaster(actor);
  if (!own) throw new NotFoundError("Fardo não encontrado.");
  const k = normalizeNfeKey(key);
  if (!isValidNfeKey(k)) throw new DomainError("NFE", "Chave da nota inválida. Confira os 44 números.");
  await db.update(trParcels).set({ invoiceKey: k, updatedAt: new Date().toISOString() }).where(eq(trParcels.id, p.id));
  await parcelEvent(db, p.id, "NOTA", actor.role === "CARRIER" ? "Ônibus" : "Cliente", null);
  return { ok: true as const };
}

// ---------------------------------------------------------------------------
// Dono do ônibus: chamadas, coleta e entrega
// ---------------------------------------------------------------------------
export async function respondParcel(db: Database, actor: Actor, parcelId: string, raw: { accept: true } | { accept: false; reason: string }, now = new Date()) {
  const c = await busScope(db, actor, null);
  const p = await db.query.trParcels.findFirst({ where: and(eq(trParcels.id, parcelId), eq(trParcels.carrierId, c.id)) });
  if (!p) throw new NotFoundError("Fardo não encontrado.");
  if (p.status !== "SOLICITADO" && p.status !== "ESPERA") throw new DomainError("STATUS", "Esse fardo não está aguardando resposta.");
  if (!raw.accept) {
    const reason = raw.reason?.trim().slice(0, 120);
    if (!reason) throw new DomainError("REASON", "Escolha o motivo da recusa.");
    await db.update(trParcels).set({ status: "RECUSADO", refuseReason: reason, updatedAt: now.toISOString() }).where(eq(trParcels.id, p.id));
    await parcelEvent(db, p.id, "RECUSADO", c.name, reason);
    return { ok: true as const };
  }
  const t = (await db.query.trTrips.findFirst({ where: eq(trTrips.id, p.tripId) }))!;
  if (!(["ABERTA", "LOTADA"] as string[]).includes(t.status)) throw new DomainError("TRIP", "A viagem não está recebendo fardos.");
  const rules = await getExcursionRules(db);
  const fee = excursionFeeCents(rules, p.priceCents);
  await db.transaction(async (tx) => {
    // Aceite condicional: só cabe se a soma dos aceitos + este não passar da capacidade (sem vender o mesmo espaço duas vezes).
    const upd = await tx.update(trParcels).set({ status: "ACEITO", feeCents: fee, acceptedAt: now.toISOString(), updatedAt: now.toISOString() })
      .where(and(eq(trParcels.id, p.id), inArray(trParcels.status, ["SOLICITADO", "ESPERA"]), sql`(select coalesce(sum(x.units), 0) from tr_parcels x where x.trip_id = ${t.id} and x.status in ('ACEITO','PRONTO','COLETADO','EM_VIAGEM','CHEGOU','ENTREGUE')) + ${p.units} <= ${t.capacityUnits}`))
      .returning({ id: trParcels.id });
    if (!upd.length) throw new DomainError("FULL", "Não cabe mais no bagageiro desta viagem.");
    await parcelEvent(tx, p.id, "ACEITO", c.name, null);
  });
  return { ok: true as const, feeCents: fee };
}

/** Label "8001-07" → fardo da viagem do próprio ônibus. */
async function parcelByLabel(db: Database, carrierId: string, label: string) {
  const m = /^(\d{4,6})-(\d{1,4})$/.exec(label.trim());
  if (!m) throw new DomainError("LABEL", "Código da etiqueta inválido. Ex.: 8001-07.");
  const t = await db.query.trTrips.findFirst({ where: and(eq(trTrips.number, Number(m[1])), eq(trTrips.carrierId, carrierId)) });
  if (!t) throw new NotFoundError("Etiqueta não encontrada nas suas viagens.");
  const p = await db.query.trParcels.findFirst({ where: and(eq(trParcels.tripId, t.id), eq(trParcels.seq, Number(m[2]))) });
  if (!p) throw new NotFoundError("Etiqueta não encontrada nas suas viagens.");
  return { p, t };
}

async function collect(db: Database, carrierId: string, who: string, label: string, now: Date) {
  const { p, t } = await parcelByLabel(db, carrierId, label);
  if (p.status !== "ACEITO" && p.status !== "PRONTO") throw new DomainError("STATUS", p.status === "COLETADO" ? "Esse fardo já foi coletado." : "Esse fardo não está aceito nesta viagem.");
  if (!(["ABERTA", "LOTADA"] as string[]).includes(t.status)) throw new DomainError("TRIP", "A viagem já saiu.");
  const rules = await getExcursionRules(db);
  if (rules.requireInvoice && !p.invoiceKey) throw new DomainError("NO_INVOICE", "Fardo sem nota não embarca. Peça a chave da nota à loja ou ao cliente.");
  await db.update(trParcels).set({ status: "COLETADO", collectedAt: now.toISOString(), updatedAt: now.toISOString() }).where(and(eq(trParcels.id, p.id), inArray(trParcels.status, ["ACEITO", "PRONTO"])));
  await parcelEvent(db, p.id, "COLETADO", who, null);
  return { ok: true as const, parcelId: p.id };
}

async function deliver(db: Database, carrierId: string, who: string, parcelId: string, deliveryCode: string, now: Date) {
  const p = await db.query.trParcels.findFirst({ where: and(eq(trParcels.id, parcelId), eq(trParcels.carrierId, carrierId)) });
  if (!p) throw new NotFoundError("Fardo não encontrado.");
  if (p.status !== "CHEGOU") throw new DomainError("STATUS", "Entrega só depois de marcar a chegada da viagem.");
  if (deliveryCode.trim().toUpperCase().replace(/\s/g, "") !== p.deliveryCode) throw new DomainError("CODE", "Código não confere. Peça ao cliente o código do fardo.");
  await db.update(trParcels).set({ status: "ENTREGUE", deliveredAt: now.toISOString(), updatedAt: now.toISOString() }).where(and(eq(trParcels.id, p.id), eq(trParcels.status, "CHEGOU")));
  await parcelEvent(db, p.id, "ENTREGUE", who, null);
  return { ok: true as const };
}

export async function busCollectParcel(db: Database, actor: Actor, label: string, now = new Date()) {
  const c = await busScope(db, actor, null);
  return collect(db, c.id, c.name, label, now);
}
export async function busDeliverParcel(db: Database, actor: Actor, parcelId: string, deliveryCode: string, now = new Date()) {
  const c = await busScope(db, actor, null);
  return deliver(db, c.id, c.name, parcelId, deliveryCode, now);
}
/** Ajudante pelo link do motorista (D111), sem login e sem valores. */
export async function helperCollectParcel(db: Database, token: string, label: string, now = new Date()) {
  const c = await carrierByDriverToken(db, token);
  if (!c || c.operation !== "EXCURSAO") throw new NotFoundError("Link do ajudante inválido.");
  return collect(db, c.id, `Ajudante da ${c.name}`, label, now);
}
export async function helperDeliverParcel(db: Database, token: string, parcelId: string, deliveryCode: string, now = new Date()) {
  const c = await carrierByDriverToken(db, token);
  if (!c || c.operation !== "EXCURSAO") throw new NotFoundError("Link do ajudante inválido.");
  return deliver(db, c.id, `Ajudante da ${c.name}`, parcelId, deliveryCode, now);
}

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------
export type ParcelLine = {
  id: string; label: string; size: ParcelSize; units: number; status: (typeof trParcels.$inferSelect)["status"]; storeName: string; storeAddress: string | null; recipientName: string;
  priceCents: number | null; feeCents: number | null; hasInvoice: boolean; refuseReason: string | null; createdAt: string;
};
const line = (tripNumber: number, p: typeof trParcels.$inferSelect, withMoney: boolean): ParcelLine => ({
  id: p.id, label: `${tripNumber}-${String(p.seq).padStart(2, "0")}`, size: p.size, units: p.units, status: p.status, storeName: p.storeName, storeAddress: p.storeAddress, recipientName: p.recipientName,
  priceCents: withMoney ? p.priceCents : null, feeCents: withMoney ? p.feeCents : null, hasInvoice: !!p.invoiceKey, refuseReason: p.refuseReason, createdAt: new Date(p.createdAt).toISOString(),
});

/** Painel do dono do ônibus: viagens ativas com medidor, chamadas e fardos (o "app de corrida"). */
export async function busBoard(db: Database, actor: Actor) {
  const c = await busScope(db, actor, null);
  return tripsBoard(db, c.id, true);
}

async function tripsBoard(db: Database, carrierId: string, withMoney: boolean) {
  const trips = await db.select({ t: trTrips, r: trRoutes }).from(trTrips).innerJoin(trRoutes, eq(trRoutes.id, trTrips.routeId)).where(and(eq(trTrips.carrierId, carrierId), inArray(trTrips.status, ["ABERTA", "LOTADA", "EM_VIAGEM", "CHEGOU"]))).orderBy(asc(trTrips.departAt)).limit(20);
  if (!trips.length) return [];
  const parcels = await db.select().from(trParcels).where(inArray(trParcels.tripId, trips.map((x) => x.t.id))).orderBy(asc(trParcels.seq));
  return trips.map(({ t, r }) => {
    const ps = parcels.filter((p) => p.tripId === t.id);
    const used = ps.filter((p) => (OCCUPYING as readonly string[]).includes(p.status)).reduce((s, p) => s + p.units, 0);
    return {
      id: t.id, number: t.number, status: t.status, routeName: r.name, brasPoint: r.brasPoint, cityPoint: r.cityPoint,
      arriveBrasAt: new Date(t.arriveBrasAt).toISOString(), departAt: new Date(t.departAt).toISOString(), arriveCityAt: t.arriveCityAt ? new Date(t.arriveCityAt).toISOString() : null,
      capacityUnits: t.capacityUnits, usedUnits: used,
      freightCents: withMoney ? ps.filter((p) => (OCCUPYING as readonly string[]).includes(p.status)).reduce((s, p) => s + p.priceCents, 0) : null,
      parcels: ps.filter((p) => p.status !== "CANCELADO" && p.status !== "RECUSADO").map((p) => line(t.number, p, withMoney)),
    };
  });
}

/** Ajudante (link do motorista): coletar e entregar, sem valores. */
export async function helperBoard(db: Database, token: string) {
  const c = await carrierByDriverToken(db, token);
  if (!c || c.operation !== "EXCURSAO") return null;
  return { carrierName: c.name, trips: await tripsBoard(db, c.id, false) };
}

/** Fardos do cliente (painel de frete único). */
export async function myParcels(db: Database, actor: Actor) {
  const rows = await db.select({ p: trParcels, t: trTrips, r: trRoutes, c: trCarriers }).from(trParcels).innerJoin(trTrips, eq(trTrips.id, trParcels.tripId)).innerJoin(trRoutes, eq(trRoutes.id, trTrips.routeId)).innerJoin(trCarriers, eq(trCarriers.id, trParcels.carrierId))
    .where(eq(trParcels.clientUserId, actor.userId)).orderBy(desc(trParcels.createdAt)).limit(300);
  const ids = rows.map((x) => x.p.id);
  const evs = ids.length ? await db.select().from(trParcelEvents).where(inArray(trParcelEvents.parcelId, ids)) : [];
  return rows.map(({ p, t, r, c }) => ({
    ...line(t.number, p, true), feeCents: null, deliveryCode: p.deliveryCode, tripNumber: t.number, tripStatus: t.status, carrierName: c.name, carrierPhone: c.phone, routeName: r.name,
    brasPoint: r.brasPoint, cityPoint: r.cityPoint, departAt: new Date(t.departAt).toISOString(), arriveCityAt: t.arriveCityAt ? new Date(t.arriveCityAt).toISOString() : null,
    events: evs.filter((e) => e.parcelId === p.id).map((e) => ({ kind: e.kind, at: new Date(e.createdAt).toISOString() })),
  }));
}

/** Extrato do ônibus por viagem encerrada ou em curso (frete e taxa congelada). */
export async function busStatement(db: Database, actor: Actor) {
  const c = await busScope(db, actor, null);
  const rows = await db.select({ t: trTrips, p: trParcels }).from(trParcels).innerJoin(trTrips, eq(trTrips.id, trParcels.tripId)).where(and(eq(trParcels.carrierId, c.id), inArray(trParcels.status, [...OCCUPYING])));
  const by = new Map<string, { number: number; departAt: string; parcels: number; freightCents: number; feeCents: number }>();
  for (const { t, p } of rows) {
    const x = by.get(t.id) ?? { number: t.number, departAt: new Date(t.departAt).toISOString(), parcels: 0, freightCents: 0, feeCents: 0 };
    x.parcels++; x.freightCents += p.priceCents; x.feeCents += p.feeCents ?? 0;
    by.set(t.id, x);
  }
  return [...by.values()].sort((a, b) => b.departAt.localeCompare(a.departAt));
}

/** Master: viagens de todos os ônibus. */
export async function allTrips(db: Database, actor: Actor) {
  if (!isMaster(actor)) throw new ForbiddenError();
  const rows = await db.select({ t: trTrips, r: trRoutes, c: trCarriers }).from(trTrips).innerJoin(trRoutes, eq(trRoutes.id, trTrips.routeId)).innerJoin(trCarriers, eq(trCarriers.id, trTrips.carrierId)).orderBy(desc(trTrips.departAt)).limit(100);
  const parcels = rows.length ? await db.select({ tripId: trParcels.tripId, status: trParcels.status, units: trParcels.units, price: trParcels.priceCents, fee: trParcels.feeCents }).from(trParcels).where(inArray(trParcels.tripId, rows.map((x) => x.t.id))) : [];
  return rows.map(({ t, r, c }) => {
    const ps = parcels.filter((p) => p.tripId === t.id && (OCCUPYING as readonly string[]).includes(p.status));
    return { id: t.id, number: t.number, status: t.status, carrierName: c.name, routeName: r.name, departAt: new Date(t.departAt).toISOString(), capacityUnits: t.capacityUnits, usedUnits: ps.reduce((s, p) => s + p.units, 0), parcels: ps.length, freightCents: ps.reduce((s, p) => s + p.price, 0), feeCents: ps.reduce((s, p) => s + (p.fee ?? 0), 0), waiting: parcels.filter((p) => p.tripId === t.id && (p.status === "SOLICITADO" || p.status === "ESPERA")).length };
  });
}

