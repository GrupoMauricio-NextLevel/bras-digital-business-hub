import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { commissionWithTier, getReputationRules, REPUTATION_TIERS, tiersOf } from "./reputacao";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { bdImporters, bdProducts, bdRequests, bdWarehouses, brandLeads, organizations, trCarrierDocuments, trCarrierUsers, trCarriers, trLoadEvents, trLoadRatings, trLoadRequests, trLoads, users } from "@/db/schema";
import { newId, slugify } from "@/lib/ids";
import { hashPassword } from "@/lib/security/password";
import { BRAS_UFS } from "@/lib/bras/ufs";
import { CARGAS_DOC_KINDS, CARGAS_VEHICLES, cargasDocsSeal, cargasToday } from "@/lib/cargas/rotulos";
import { getGroupCompanies, groupDocuments } from "../grupo";
import { isMaster, requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { DomainError, ForbiddenError, NotFoundError } from "../errors";
import { brasShippingView } from "../bras/catalogo";
import { myImporter, brasStaffCan } from "../bras/importadora";
import { isValidCnpj } from "../bras/membros";
import { getBrasRules } from "../bras/regras";
import { isValidCpf } from "./interesse";
import { activateCarrierReferral, linkCarrierReferral } from "../club/indicacoes";

/**
 * NextLevel Cargas v1 (D111, módulo G do prompt v2). A importadora chama a transportadora para os pedidos da Brás;
 * a transportadora aceita informando o frete (a comissão da NextLevel fica congelada no aceite, pelo plano dela);
 * a coleta acontece no balcão com o código de cada pedido (D103) e o motorista marca a entrega pelo link (sem login).
 * Fronteiras: a transportadora vê de cada pedido só o envio (`brasShippingView`), e o código de retirada só depois de
 * aceitar a carga. Nada do comprador (CNPJ, e-mail, WhatsApp, empresa) nem preço da mercadoria.
 */
const digits = (v: string) => v.replace(/\D/g, "");
const hash = (t: string) => createHash("sha256").update(t).digest("hex");
const TOKEN = /^[A-Za-z0-9_-]{32,64}$/;

// ---------------------------------------------------------------------------
// Transportadoras
// ---------------------------------------------------------------------------
export const carrierSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da transportadora").max(120),
  docType: z.enum(["CNPJ", "CPF"]),
  document: z.string().transform(digits),
  contactName: z.string().trim().min(2, "Informe o contato").max(80),
  phone: z.string().transform(digits).refine((v) => v.length >= 10 && v.length <= 13, "WhatsApp com DDD"),
  email: z.string().trim().toLowerCase().email("E-mail inválido").optional().or(z.literal("")).transform((v) => v || null),
  ufs: z.array(z.enum(BRAS_UFS)).min(1, "Marque pelo menos um estado atendido").max(27),
  vehicles: z.array(z.enum(CARGAS_VEHICLES)).min(1, "Marque pelo menos um tipo de veículo").max(5),
  rntrc: z.string().trim().max(20).optional().transform((v) => v || null),
  insurance: z.boolean().default(false),
  rateNotes: z.string().trim().max(500).optional().transform((v) => v || null),
  operation: z.enum(["CARGA", "EXCURSAO"]).default("CARGA"),
}).superRefine((v, ctx) => {
  if (!(v.docType === "CPF" ? isValidCpf(v.document) : isValidCnpj(v.document))) ctx.addIssue({ code: "custom", path: ["document"], message: `${v.docType} inválido. Confira os números.` });
});
export type CarrierInput = z.input<typeof carrierSchema>;

/** Quem cadastra: Master ou alguém da importadora (menos o financeiro). Documento já cadastrado devolve a existente. */
export async function createCarrier(db: Database, actor: Actor, raw: CarrierInput) {
  let importerId: string | null = null;
  if (!isMaster(actor)) {
    const me = await myImporter(db, actor);
    if (me.staffRole === "FINANCEIRO") throw new ForbiddenError("Cadastrar transportadora é do balcão, do estoque, do comercial ou do dono.");
    importerId = me.importer.id;
  }
  const v = carrierSchema.parse(raw);
  const exists = await db.query.trCarriers.findFirst({ where: eq(trCarriers.document, v.document), columns: { id: true } });
  if (exists) return { id: exists.id, existed: true };
  const id = newId("trc");
  await db.insert(trCarriers).values({ id, ...v, createdByImporterId: importerId, createdBy: actor.userId });
  await linkCarrierReferral(db, { id, phone: v.phone });
  await recordAudit(db, actor, { action: "CARGAS_CARRIER_CREATED", entityType: "tr_carrier", entityId: id, after: { name: v.name, importerId } }, { force: true });
  return { id, existed: false };
}

/** Lista para o Master (todas) ou para a importadora (só as ativas, com contato para chamar). Filtro por UF atendida.
 * Cada uma traz o selo "empresa do grupo" (CNPJ das empresas do dono, D112) e "documentação em dia". */
export async function listCarriers(db: Database, actor: Actor, opts: { uf?: string; operation?: "CARGA" | "EXCURSAO" } = {}) {
  if (!isMaster(actor)) await myImporter(db, actor);
  return carrierCatalog(db, { uf: opts.uf, operation: opts.operation, all: isMaster(actor), full: isMaster(actor) });
}

/** Nota média por transportadora (pontualidade e cuidado, de 1 a 5), com o número de avaliações. */
export async function carrierRatings(db: Pick<Database, "select">) {
  const rows = await db.select({ carrierId: trLoadRatings.carrierId, n: sql<number>`count(*)`, p: sql<number>`avg(${trLoadRatings.punctuality})`, c: sql<number>`avg(${trLoadRatings.care})` }).from(trLoadRatings).groupBy(trLoadRatings.carrierId);
  return new Map(rows.map((r) => [r.carrierId, { count: Number(r.n), score: Math.round(((Number(r.p) + Number(r.c)) / 2) * 10) / 10 }]));
}

/** Catálogo de transportadoras (importadora, membro e Master): ativas, com selos; ordem pública (D112, seção 3.4). */
export async function carrierCatalog(db: Database, opts: { uf?: string; operation?: "CARGA" | "EXCURSAO"; all?: boolean; full?: boolean } = {}) {
  const [rows, docs, group, ratings] = await Promise.all([
    db.select().from(trCarriers).where(opts.all ? undefined : eq(trCarriers.status, "ATIVA")).orderBy(asc(trCarriers.name)),
    db.select({ carrierId: trCarrierDocuments.carrierId, status: trCarrierDocuments.status, validUntil: trCarrierDocuments.validUntil }).from(trCarrierDocuments),
    getGroupCompanies(db),
    carrierRatings(db),
  ]);
  const grupo = groupDocuments(group);
  const today = cargasToday();
  const visible = rows.filter((c) => (!opts.uf || c.ufs.includes(opts.uf)) && (!opts.operation || c.operation === opts.operation));
  // Reputação (D139): Ouro e Prata vêm primeiro, sempre com o selo; as outras continuam na lista.
  const tiers = await tiersOf(db, visible.map((c) => c.id));
  const rank = (id: string) => REPUTATION_TIERS.indexOf(tiers.get(id) ?? "BRONZE");
  return visible.sort((a, b) => rank(b.id) - rank(a.id)).map((c) => ({
    tier: tiers.get(c.id) ?? ("BRONZE" as const),
    id: c.id, name: c.name, contactName: c.contactName, phone: c.phone, ufs: c.ufs, vehicles: c.vehicles, plan: c.plan, status: c.status, operation: c.operation,
    insurance: c.insurance, hasRntrc: !!c.rntrc, rateNotes: c.rateNotes, hasDriverLink: !!c.driverTokenHash,
    groupCompany: grupo.has(c.document), docsOk: cargasDocsSeal(docs.filter((d) => d.carrierId === c.id), today).ok, rating: ratings.get(c.id) ?? null,
    ...(opts.full ? { document: c.document, docType: c.docType, email: c.email, rntrc: c.rntrc, createdByImporterId: c.createdByImporterId } : {}),
  }));
}

export async function myCarrier(db: Database, actor: Actor) {
  if (actor.role !== "CARRIER") throw new ForbiddenError("Área da transportadora da NextLevel Cargas.");
  const [row] = await db.select({ c: trCarriers }).from(trCarrierUsers).innerJoin(trCarriers, eq(trCarriers.id, trCarrierUsers.carrierId)).where(eq(trCarrierUsers.userId, actor.userId)).limit(1);
  if (!row) throw new ForbiddenError("Seu acesso não está ligado a uma transportadora. Fale com a NextLevel Cargas.");
  if (row.c.status !== "ATIVA") throw new ForbiddenError("A transportadora está pausada na NextLevel Cargas.");
  return row.c;
}

async function carrierScope(db: Database, actor: Actor, carrierId: string | null) {
  if (isMaster(actor)) {
    if (!carrierId) throw new DomainError("CARRIER", "Escolha a transportadora.");
    const c = await db.query.trCarriers.findFirst({ where: eq(trCarriers.id, carrierId) });
    if (!c) throw new NotFoundError("Transportadora não encontrada.");
    return { carrier: c, master: true };
  }
  const c = await myCarrier(db, actor);
  if (carrierId && carrierId !== c.id) throw new ForbiddenError();
  return { carrier: c, master: false };
}

const profileSchema = z.object({
  contactName: z.string().trim().min(2).max(80).optional(),
  phone: z.string().transform(digits).refine((v) => v.length >= 10 && v.length <= 13, "WhatsApp com DDD").optional(),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  ufs: z.array(z.enum(BRAS_UFS)).min(1).max(27).optional(),
  vehicles: z.array(z.enum(CARGAS_VEHICLES)).min(1).max(5).optional(),
  rntrc: z.string().trim().max(20).optional(),
  insurance: z.boolean().optional(),
  rateNotes: z.string().trim().max(500).optional(),
  plan: z.enum(["GRATIS", "PRO", "PREMIUM"]).optional(),
  status: z.enum(["ATIVA", "PAUSADA"]).optional(),
  operation: z.enum(["CARGA", "EXCURSAO"]).optional(),
});
/** Perfil: a transportadora atualiza rota, veículos, documentos e tabela; plano e situação só o Master. */
export async function updateCarrierProfile(db: Database, actor: Actor, carrierId: string | null, raw: z.input<typeof profileSchema>) {
  const s = await carrierScope(db, actor, carrierId);
  const v = profileSchema.parse(raw);
  if (!s.master) { delete v.plan; delete v.status; delete v.operation; }
  const patch = Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => [k, x === "" ? null : x]));
  if (!Object.keys(patch).length) return { ok: true as const };
  await db.update(trCarriers).set(patch).where(eq(trCarriers.id, s.carrier.id));
  await recordAudit(db, actor, { action: "CARGAS_CARRIER_PROFILE", entityType: "tr_carrier", entityId: s.carrier.id, before: Object.fromEntries(Object.keys(patch).map((k) => [k, (s.carrier as Record<string, unknown>)[k] ?? null])), after: patch }, { force: true });
  return { ok: true as const };
}

/** Login da transportadora (só Master): senha provisória, troca no primeiro acesso, no endereço da Cargas. */
export async function createCarrierAccess(db: Database, actor: Actor, carrierId: string, raw: { name: string; email: string; password: string }) {
  requireMaster(actor);
  const d = z.object({ name: z.string().trim().min(2, "Informe o nome"), email: z.string().trim().toLowerCase().email("E-mail inválido"), password: z.string().min(8, "Senha provisória com pelo menos 8 caracteres") }).parse(raw);
  const c = await db.query.trCarriers.findFirst({ where: eq(trCarriers.id, carrierId) });
  if (!c) throw new NotFoundError("Transportadora não encontrada.");
  if (await db.query.users.findFirst({ where: eq(users.email, d.email), columns: { id: true } })) throw new DomainError("EMAIL_IN_USE", "Já existe uma conta com esse e-mail.");
  const userId = newId("usr");
  await db.transaction(async (tx) => {
    let orgId = c.organizationId;
    if (!orgId) {
      orgId = newId("org");
      await tx.insert(organizations).values({ id: orgId, name: c.name, slug: `cargas-${slugify(c.name).slice(0, 40)}-${c.id.slice(-6)}`, type: "SUPPLIER", brand: "NEXTLEVEL_CARGAS" });
      await tx.update(trCarriers).set({ organizationId: orgId }).where(eq(trCarriers.id, c.id));
    }
    await tx.insert(users).values({ id: userId, name: d.name, email: d.email, role: "CARRIER", organizationId: orgId, passwordHash: hashPassword(d.password), mustChangePassword: true });
    await tx.insert(trCarrierUsers).values({ id: newId("trcu"), carrierId: c.id, userId });
  });
  await recordAudit(db, actor, { action: "CARGAS_CARRIER_ACCESS", entityType: "tr_carrier", entityId: c.id, after: { userId } }, { force: true });
  return { userId };
}

export async function listCarrierAccess(db: Database, actor: Actor, carrierId: string) {
  requireMaster(actor);
  return db.select({ userId: users.id, name: users.name, email: users.email, lastLoginAt: users.lastLoginAt, disabledAt: users.disabledAt }).from(trCarrierUsers).innerJoin(users, eq(users.id, trCarrierUsers.userId)).where(eq(trCarrierUsers.carrierId, carrierId));
}

/** Interessado da Cargas (lista da página pública) vira transportadora: lê o que o formulário guardou. Só Master. */
export async function carrierFromLead(db: Database, actor: Actor, leadId: string) {
  requireMaster(actor);
  const l = await db.query.brandLeads.findFirst({ where: and(eq(brandLeads.id, leadId), eq(brandLeads.brand, "NEXTLEVEL_CARGAS")) });
  if (!l) throw new NotFoundError("Interessado não encontrado.");
  if (l.segment === "IMPORTADORA") throw new DomainError("LEAD_KIND", "Este interessado é uma importadora: cadastre em Importadoras.");
  const doc = /documento (\d{11,14})/.exec(l.message ?? "")?.[1] ?? "";
  const r = await createCarrier(db, actor, {
    name: l.storeName || l.name, docType: doc.length === 11 ? "CPF" : "CNPJ", document: doc, contactName: l.name, phone: l.phone, email: l.email,
    ufs: l.needs.filter((n) => n.startsWith("UF:")).map((n) => n.slice(3)) as (typeof BRAS_UFS)[number][],
    vehicles: l.needs.filter((n) => n.startsWith("VEICULO:")).map((n) => n.slice(8)) as (typeof CARGAS_VEHICLES)[number][],
    rntrc: /RNTRC: sim/.test(l.message ?? "") ? "declarado" : undefined, insurance: /Seguro de carga: sim/.test(l.message ?? ""),
  });
  await db.update(brandLeads).set({ status: "WON", updatedAt: new Date().toISOString() }).where(eq(brandLeads.id, l.id));
  return r;
}

/** Interessados da página da Cargas (transportadoras e autônomos) ainda não cadastrados. Só Master. */
export async function cargasCarrierLeads(db: Database, actor: Actor) {
  requireMaster(actor);
  const rows = await db.select().from(brandLeads).where(and(eq(brandLeads.brand, "NEXTLEVEL_CARGAS"), inArray(brandLeads.status, ["NEW", "CONTACTED"]))).orderBy(desc(brandLeads.createdAt)).limit(100);
  return rows.filter((l) => l.segment !== "IMPORTADORA").map((l) => ({ id: l.id, name: l.name, company: l.storeName, phone: l.phone, email: l.email, segment: l.segment, message: l.message, createdAt: new Date(l.createdAt).toISOString() }));
}

// ---------------------------------------------------------------------------
// Autorizações (D112): a transportadora informa; o Master confere. Selo "documentação em dia".
// ---------------------------------------------------------------------------
export const carrierDocSchema = z.object({
  kind: z.enum(CARGAS_DOC_KINDS),
  number: z.string().trim().min(2, "Informe o número").max(60),
  issuer: z.string().trim().max(80).optional().transform((v) => v || null),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida").optional().or(z.literal("")).transform((v) => v || null),
  notes: z.string().trim().max(300).optional().transform((v) => v || null),
});

export async function saveCarrierDocument(db: Database, actor: Actor, carrierId: string | null, raw: z.input<typeof carrierDocSchema>) {
  const s = await carrierScope(db, actor, carrierId);
  const v = carrierDocSchema.parse(raw);
  const id = newId("trcd");
  // Cadastrado pelo Master já nasce conferido; pela transportadora, aguarda a conferência.
  await db.insert(trCarrierDocuments).values({ id, carrierId: s.carrier.id, ...v, status: s.master ? "VERIFICADA" : "PENDENTE", verifiedBy: s.master ? actor.userId : null, verifiedAt: s.master ? new Date().toISOString() : null, createdBy: actor.userId });
  await recordAudit(db, actor, { action: "CARGAS_DOC_SAVED", entityType: "tr_carrier", entityId: s.carrier.id, after: { kind: v.kind, validUntil: v.validUntil } }, { force: true });
  return { id };
}

export async function reviewCarrierDocument(db: Database, actor: Actor, docId: string, decision: "VERIFICADA" | "RECUSADA") {
  requireMaster(actor);
  const d = await db.query.trCarrierDocuments.findFirst({ where: eq(trCarrierDocuments.id, docId) });
  if (!d) throw new NotFoundError("Autorização não encontrada.");
  await db.update(trCarrierDocuments).set({ status: decision, verifiedBy: actor.userId, verifiedAt: new Date().toISOString() }).where(eq(trCarrierDocuments.id, d.id));
  await recordAudit(db, actor, { action: "CARGAS_DOC_REVIEWED", entityType: "tr_carrier", entityId: d.carrierId, before: { status: d.status }, after: { status: decision } }, { force: true });
  return { ok: true as const };
}

export async function deleteCarrierDocument(db: Database, actor: Actor, docId: string) {
  const d = await db.query.trCarrierDocuments.findFirst({ where: eq(trCarrierDocuments.id, docId) });
  if (!d) throw new NotFoundError("Autorização não encontrada.");
  await carrierScope(db, actor, isMaster(actor) ? d.carrierId : null).then((s) => { if (s.carrier.id !== d.carrierId) throw new ForbiddenError(); });
  await db.delete(trCarrierDocuments).where(eq(trCarrierDocuments.id, d.id));
  await recordAudit(db, actor, { action: "CARGAS_DOC_DELETED", entityType: "tr_carrier", entityId: d.carrierId, before: { kind: d.kind, number: d.number } }, { force: true });
  return { ok: true as const };
}

export async function listCarrierDocuments(db: Database, actor: Actor, carrierId: string | null) {
  const s = await carrierScope(db, actor, carrierId);
  const rows = await db.select().from(trCarrierDocuments).where(eq(trCarrierDocuments.carrierId, s.carrier.id)).orderBy(desc(trCarrierDocuments.createdAt));
  return rows.map((d) => ({ id: d.id, kind: d.kind, number: d.number, issuer: d.issuer, validUntil: d.validUntil, notes: d.notes, status: d.status }));
}

/** Autorizações a conferir e a vencer em 30 dias (fila do Master). */
export async function carrierDocsQueue(db: Database, actor: Actor) {
  requireMaster(actor);
  const today = cargasToday();
  const limit = new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, Number(today.slice(8, 10)) + 30)).toISOString().slice(0, 10);
  const rows = await db.select({ d: trCarrierDocuments, name: trCarriers.name }).from(trCarrierDocuments).innerJoin(trCarriers, eq(trCarriers.id, trCarrierDocuments.carrierId)).orderBy(asc(trCarrierDocuments.validUntil));
  return {
    pending: rows.filter((r) => r.d.status === "PENDENTE").map((r) => ({ id: r.d.id, carrierName: r.name, kind: r.d.kind, number: r.d.number, issuer: r.d.issuer, validUntil: r.d.validUntil })),
    expiring: rows.filter((r) => r.d.status === "VERIFICADA" && r.d.validUntil && r.d.validUntil <= limit).map((r) => ({ id: r.d.id, carrierName: r.name, kind: r.d.kind, validUntil: r.d.validUntil!, expired: r.d.validUntil! < today })),
  };
}

// ---------------------------------------------------------------------------
// Cargas (coletas)
// ---------------------------------------------------------------------------
const ACTIVE = ["CHAMADA", "ACEITA", "COLETADA"] as const;
export const callSchema = z.object({
  carrierId: z.string().min(1, "Escolha a transportadora"),
  requestIds: z.array(z.string().min(1)).min(1, "Escolha pelo menos um pedido").max(50),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha o dia da coleta"),
  period: z.enum(["MANHA", "TARDE"]),
  warehouseId: z.string().optional().transform((v) => v || null),
  notes: z.string().trim().max(500).optional().transform((v) => v || null),
});
const brtToday = (now: Date) => new Date(now.getTime() - 3 * 3600_000).toISOString().slice(0, 10);

async function event(db: Pick<Database, "insert">, loadId: string, kind: string, actor: string, note?: string | null) {
  await db.insert(trLoadEvents).values({ id: newId("trle"), loadId, kind, actor, note: note ?? null });
}

/** "Chamar transportadora": a importadora junta pedidos confirmados ou pagos numa coleta para uma transportadora. */
export async function callCarrier(db: Database, actor: Actor, raw: z.input<typeof callSchema>, now = new Date()) {
  const me = await myImporter(db, actor);
  if (!brasStaffCan(me.staffRole, "pedidos_balcao") && !brasStaffCan(me.staffRole, "pedidos_disponibilidade")) throw new ForbiddenError("Sua função não chama transportadora.");
  const v = callSchema.parse(raw);
  const ids = [...new Set(v.requestIds)];
  if (v.pickupDate < brtToday(now)) throw new DomainError("DATE", "A coleta precisa ser hoje ou depois.");
  if (v.pickupDate > new Date(now.getTime() + 30 * 86_400_000).toISOString().slice(0, 10)) throw new DomainError("DATE", "Coleta em até 30 dias.");
  const carrier = await db.query.trCarriers.findFirst({ where: eq(trCarriers.id, v.carrierId) });
  if (!carrier || carrier.status !== "ATIVA") throw new DomainError("CARRIER", "Transportadora indisponível.");
  if (v.warehouseId && !(await db.query.bdWarehouses.findFirst({ where: and(eq(bdWarehouses.id, v.warehouseId), eq(bdWarehouses.importerId, me.importer.id)), columns: { id: true } }))) throw new NotFoundError("Galpão não encontrado.");
  const reqs = await db.select().from(bdRequests).where(and(inArray(bdRequests.id, ids), eq(bdRequests.importerId, me.importer.id)));
  if (reqs.length !== ids.length) throw new NotFoundError("Pedido não encontrado.");
  const fora = reqs.filter((r) => r.status !== "CONFIRMED" && r.status !== "PAID");
  if (fora.length) throw new DomainError("STATUS", `Só pedidos confirmados ou pagos entram na coleta (pedido ${fora.map((r) => r.number).join(", ")}).`);
  const ocupados = await db.select({ requestId: trLoadRequests.requestId, number: trLoads.number }).from(trLoadRequests).innerJoin(trLoads, eq(trLoads.id, trLoadRequests.loadId)).where(and(inArray(trLoadRequests.requestId, ids), inArray(trLoads.status, [...ACTIVE])));
  if (ocupados.length) throw new DomainError("IN_LOAD", `Pedido já está na coleta ${ocupados[0]!.number}.`);
  // Volume e peso: dos produtos ligados que têm medidas (estimativa para a transportadora).
  const prodIds = reqs.map((r) => r.productId).filter((x): x is string => !!x);
  const prods = prodIds.length ? await db.select().from(bdProducts).where(inArray(bdProducts.id, prodIds)) : [];
  let liters = 0, grams = 0, medidos = 0;
  for (const r of reqs) {
    const p = prods.find((x) => x.id === r.productId);
    if (p?.boxLengthMm && p.boxWidthMm && p.boxHeightMm) { liters += (p.boxLengthMm * p.boxWidthMm * p.boxHeightMm / 1_000_000) * r.boxes; medidos++; }
    if (p?.grossWeightG) grams += p.grossWeightG * r.boxes;
  }
  const destinations = [...new Set(reqs.map((r) => `${r.shipCity}/${r.shipState}`))].join(", ");
  const boxes = reqs.reduce((s, r) => s + r.boxes, 0);
  const id = newId("trl");
  let number = 0;
  await db.transaction(async (tx) => {
    const [{ n }] = await tx.select({ n: sql<number>`greatest(coalesce(max(${trLoads.number}), 5000), 5000) + 1` }).from(trLoads) as [{ n: number }];
    number = Number(n);
    await tx.insert(trLoads).values({ id, number, importerId: me.importer.id, carrierId: carrier.id, warehouseId: v.warehouseId, pickupDate: v.pickupDate, period: v.period, boxes, volumeLiters: medidos === reqs.length && liters ? Math.round(liters) : null, weightKg: grams ? Math.round(grams / 1000) : null, destinations, notes: v.notes, createdBy: actor.userId });
    for (const r of reqs) await tx.insert(trLoadRequests).values({ id: newId("trlr"), loadId: id, requestId: r.id });
    await event(tx, id, "CHAMADA", `Importadora ${me.importer.name}`, v.notes);
  });
  await recordAudit(db, actor, { action: "CARGAS_LOAD_CALLED", entityType: "tr_load", entityId: id, after: { carrierId: carrier.id, requests: ids.length, boxes } });
  const periodo = v.period === "MANHA" ? "manhã" : "tarde";
  const dia = new Date(`${v.pickupDate}T12:00:00-03:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const text = `Olá, ${carrier.contactName}! A ${me.importer.name} chamou a ${carrier.name} pela NextLevel Cargas: coleta ${number}, ${boxes} caixa(s) no Brás, ${dia} (${periodo}), destino ${destinations}. Aceite e informe o frete em cargas.nextlevelgroup.com.br.`;
  return { id, number, whatsappUrl: `https://wa.me/${carrier.phone.startsWith("55") ? carrier.phone : `55${carrier.phone}`}?text=${encodeURIComponent(text)}`, text };
}

/** Pedidos que podem entrar numa coleta: confirmados ou pagos, ainda não retirados e fora de coleta ativa. */
export async function loadableRequests(db: Database, actor: Actor) {
  const me = await myImporter(db, actor);
  const reqs = await db.select().from(bdRequests).where(and(eq(bdRequests.importerId, me.importer.id), inArray(bdRequests.status, ["CONFIRMED", "PAID"]))).orderBy(asc(bdRequests.createdAt)).limit(200);
  if (!reqs.length) return [];
  const busy = await db.select({ requestId: trLoadRequests.requestId }).from(trLoadRequests).innerJoin(trLoads, eq(trLoads.id, trLoadRequests.loadId)).where(and(inArray(trLoadRequests.requestId, reqs.map((r) => r.id)), inArray(trLoads.status, [...ACTIVE])));
  const ocupado = new Set(busy.map((b) => b.requestId));
  return reqs.filter((r) => !ocupado.has(r.id)).map((r) => ({ id: r.id, ...brasShippingView(r), suggestedCarrierId: r.carrierId }));
}

/** A importadora cancela a coleta enquanto não foi coletada. Os pedidos voltam a poder entrar em outra. */
export async function cancelLoad(db: Database, actor: Actor, loadId: string, reason?: string) {
  const me = await myImporter(db, actor);
  const l = await db.query.trLoads.findFirst({ where: and(eq(trLoads.id, loadId), eq(trLoads.importerId, me.importer.id)) });
  if (!l) throw new NotFoundError("Coleta não encontrada.");
  if (l.status !== "CHAMADA" && l.status !== "ACEITA") throw new DomainError("STATUS", "Só coletas chamadas ou aceitas podem ser canceladas.");
  await db.update(trLoads).set({ status: "CANCELADA", updatedAt: new Date().toISOString() }).where(eq(trLoads.id, l.id));
  await event(db, l.id, "CANCELADA", `Importadora ${me.importer.name}`, reason?.trim().slice(0, 200) || null);
  return { ok: true as const };
}

const monthStartBrt = (now: Date) => { const b = new Date(now.getTime() - 3 * 3600_000); return new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), 1, 3)).toISOString(); };

/** A transportadora aceita (com o valor do frete; comissão congelada pelo plano) ou recusa (com motivo). */
export async function respondLoad(db: Database, actor: Actor, loadId: string, raw: { accept: true; freightCents: number } | { accept: false; reason: string }, now = new Date()) {
  const c = await myCarrier(db, actor);
  const l = await db.query.trLoads.findFirst({ where: and(eq(trLoads.id, loadId), eq(trLoads.carrierId, c.id)) });
  if (!l) throw new NotFoundError("Coleta não encontrada.");
  if (l.status !== "CHAMADA") throw new DomainError("STATUS", "Esta coleta não está mais aguardando resposta.");
  if (!raw.accept) {
    const reason = raw.reason?.trim().slice(0, 200);
    if (!reason) throw new DomainError("REASON", "Conte o motivo (a importadora chama outra transportadora).");
    await db.update(trLoads).set({ status: "RECUSADA", refuseReason: reason, updatedAt: now.toISOString() }).where(and(eq(trLoads.id, l.id), eq(trLoads.status, "CHAMADA")));
    await event(db, l.id, "RECUSADA", c.name, reason);
    return { ok: true as const };
  }
  if (!Number.isInteger(raw.freightCents) || raw.freightCents < 100 || raw.freightCents > 100_000_000) throw new DomainError("FREIGHT", "Informe o valor do frete.");
  const rules = await getBrasRules(db);
  if (c.plan === "GRATIS") {
    const [m] = await db.select({ n: sql<number>`count(*)` }).from(trLoads).where(and(eq(trLoads.carrierId, c.id), inArray(trLoads.status, ["ACEITA", "COLETADA", "ENTREGUE"]), sql`${trLoads.acceptedAt} >= ${monthStartBrt(now)}`));
    if (Number(m?.n ?? 0) >= rules.carriers.freeLoadsPerMonth) throw new DomainError("FREE_LIMIT", `O plano grátis vale até ${rules.carriers.freeLoadsPerMonth} cargas por mês. Para aceitar mais, fale com a NextLevel Cargas sobre o plano Pro.`);
  }
  // Vantagem do nível Ouro (D139): comissão menor, gravada na carga no momento do aceite.
  const bps = commissionWithTier(rules.carriers.commissionBps[c.plan], (await tiersOf(db, [c.id], now)).get(c.id) ?? "BRONZE", await getReputationRules(db));
  const upd = await db.update(trLoads).set({ status: "ACEITA", freightCents: raw.freightCents, commissionBps: bps, commissionCents: Math.round((raw.freightCents * bps) / 10_000), acceptedAt: now.toISOString(), updatedAt: now.toISOString() }).where(and(eq(trLoads.id, l.id), eq(trLoads.status, "CHAMADA"))).returning({ id: trLoads.id });
  if (!upd.length) throw new DomainError("STATUS_RACE", "A coleta mudou. Atualize a página.");
  await event(db, l.id, "ACEITA", c.name, `Frete informado: ${(raw.freightCents / 100).toFixed(2).replace(".", ",")}`);
  return { ok: true as const, commissionBps: bps };
}

export { syncLoadCollected } from "./coleta";

async function deliver(db: Database, carrierId: string, loadId: string, who: string, note?: string | null, now = new Date()) {
  const l = await db.query.trLoads.findFirst({ where: and(eq(trLoads.id, loadId), eq(trLoads.carrierId, carrierId)) });
  if (!l) throw new NotFoundError("Coleta não encontrada.");
  if (l.status !== "COLETADA") throw new DomainError("STATUS", l.status === "ACEITA" ? "Primeiro a coleta no balcão, com o código de cada pedido." : "Esta coleta não está em trânsito.");
  await db.update(trLoads).set({ status: "ENTREGUE", deliveredAt: now.toISOString(), updatedAt: now.toISOString() }).where(and(eq(trLoads.id, l.id), eq(trLoads.status, "COLETADA")));
  await event(db, l.id, "ENTREGUE", who, note?.trim().slice(0, 300) || null);
  await activateCarrierReferral(db, carrierId, now);
  return { ok: true as const };
}
export async function carrierMarkDelivered(db: Database, actor: Actor, loadId: string, note?: string) {
  const c = await myCarrier(db, actor);
  return deliver(db, c.id, loadId, c.name, note);
}

// ---------------------------------------------------------------------------
// Leitura: transportadora, importadora, Master
// ---------------------------------------------------------------------------
export type LoadView = {
  id: string; number: number; status: (typeof trLoads.$inferSelect)["status"]; pickupDate: string; period: "MANHA" | "TARDE"; boxes: number; volumeLiters: number | null; weightKg: number | null;
  destinations: string; notes: string | null; freightCents: number | null; commissionCents: number | null; refuseReason: string | null;
  importerName: string; carrierName: string; warehouse: { name: string; address: string; hours: string | null; rules: string | null } | null;
  requests: (ReturnType<typeof brasShippingView> & { id: string; pickupCode: string | null })[];
  events: { kind: string; note: string | null; actor: string; at: string }[];
};

async function loadViews(db: Database, where: ReturnType<typeof eq> | undefined, opts: { withCodes: "ACCEPTED" | "NEVER"; limit?: number }): Promise<LoadView[]> {
  const rows = await db.select({ l: trLoads, importerName: bdImporters.name, carrierName: trCarriers.name, pickupAddress: bdImporters.pickupAddress }).from(trLoads).innerJoin(bdImporters, eq(bdImporters.id, trLoads.importerId)).innerJoin(trCarriers, eq(trCarriers.id, trLoads.carrierId)).where(where).orderBy(desc(trLoads.createdAt)).limit(opts.limit ?? 200);
  if (!rows.length) return [];
  const ids = rows.map((r) => r.l.id);
  const [reqs, evs, whs] = await Promise.all([
    db.select({ loadId: trLoadRequests.loadId, r: bdRequests }).from(trLoadRequests).innerJoin(bdRequests, eq(bdRequests.id, trLoadRequests.requestId)).where(inArray(trLoadRequests.loadId, ids)),
    db.select().from(trLoadEvents).where(inArray(trLoadEvents.loadId, ids)).orderBy(asc(trLoadEvents.createdAt)),
    db.select().from(bdWarehouses).where(inArray(bdWarehouses.importerId, [...new Set(rows.map((r) => r.l.importerId))])),
  ]);
  return rows.map(({ l, importerName, carrierName, pickupAddress }) => {
    const w = whs.find((x) => x.id === l.warehouseId) ?? whs.find((x) => x.importerId === l.importerId && x.isDefault);
    const codes = opts.withCodes === "ACCEPTED" && (l.status === "ACEITA" || l.status === "COLETADA");
    return {
      id: l.id, number: l.number, status: l.status, pickupDate: l.pickupDate, period: l.period, boxes: l.boxes, volumeLiters: l.volumeLiters, weightKg: l.weightKg,
      destinations: l.destinations, notes: l.notes, freightCents: l.freightCents, commissionCents: l.commissionCents, refuseReason: l.refuseReason, importerName, carrierName,
      warehouse: w ? { name: w.name, address: w.address, hours: w.hours, rules: w.rules } : pickupAddress ? { name: "Retirada", address: pickupAddress, hours: null, rules: null } : null,
      requests: reqs.filter((x) => x.loadId === l.id).map(({ r }) => ({ id: r.id, ...brasShippingView(r), pickupCode: codes ? r.pickupCode : null })),
      events: evs.filter((e) => e.loadId === l.id).map((e) => ({ kind: e.kind, note: e.note, actor: e.actor, at: new Date(e.createdAt).toISOString() })),
    };
  });
}

/** Cargas da transportadora logada. O código de retirada só aparece depois de aceitar. */
export async function carrierLoads(db: Database, actor: Actor, now = new Date()) {
  const c = await myCarrier(db, actor);
  const [loads, rules, [m]] = await Promise.all([
    loadViews(db, eq(trLoads.carrierId, c.id), { withCodes: "ACCEPTED" }),
    getBrasRules(db),
    db.select({ n: sql<number>`count(*)` }).from(trLoads).where(and(eq(trLoads.carrierId, c.id), inArray(trLoads.status, ["ACEITA", "COLETADA", "ENTREGUE"]), sql`${trLoads.acceptedAt} >= ${monthStartBrt(now)}`)),
  ]);
  const usage = { commissionBps: commissionWithTier(rules.carriers.commissionBps[c.plan], (await tiersOf(db, [c.id])).get(c.id) ?? "BRONZE", await getReputationRules(db)), acceptedThisMonth: Number(m?.n ?? 0), freeLimit: c.plan === "GRATIS" ? rules.carriers.freeLoadsPerMonth : null };
  return { carrier: { id: c.id, name: c.name, plan: c.plan, contactName: c.contactName, phone: c.phone, email: c.email, ufs: c.ufs, vehicles: c.vehicles, rntrc: c.rntrc, insurance: c.insurance, rateNotes: c.rateNotes, status: c.status, operation: c.operation, hasDriverLink: !!c.driverTokenHash }, loads, usage };
}

/** Coletas da importadora logada (ela nunca vê o frete combinado com o comprador nem a comissão). */
export async function importerLoads(db: Database, actor: Actor) {
  const me = await myImporter(db, actor);
  const loads = await loadViews(db, eq(trLoads.importerId, me.importer.id), { withCodes: "NEVER" });
  // O aceite registra o frete no histórico; a importadora recebe o histórico sem esse valor (D118).
  return loads.map((l) => ({ ...l, freightCents: null, commissionCents: null, events: l.events.map((e) => (e.kind === "ACEITA" ? { ...e, note: null } : e)) }));
}

/** Extrato da transportadora por mês: cargas aceitas, frete e comissão da NextLevel. */
export async function carrierStatement(db: Database, actor: Actor) {
  const c = await myCarrier(db, actor);
  const rows = await db.select({ acceptedAt: trLoads.acceptedAt, freight: trLoads.freightCents, commission: trLoads.commissionCents, status: trLoads.status }).from(trLoads).where(and(eq(trLoads.carrierId, c.id), inArray(trLoads.status, ["ACEITA", "COLETADA", "ENTREGUE"])));
  return cargasMonths(rows);
}

function cargasMonths(rows: { acceptedAt: string | null; freight: number | null; commission: number | null }[]) {
  const by = new Map<string, { month: string; loads: number; freightCents: number; commissionCents: number }>();
  for (const r of rows) {
    if (!r.acceptedAt) continue;
    const month = new Date(new Date(r.acceptedAt).getTime() - 3 * 3600_000).toISOString().slice(0, 7);
    const m = by.get(month) ?? { month, loads: 0, freightCents: 0, commissionCents: 0 };
    m.loads++; m.freightCents += r.freight ?? 0; m.commissionCents += r.commission ?? 0;
    by.set(month, m);
  }
  return [...by.values()].sort((a, b) => b.month.localeCompare(a.month));
}

/** Comissão por carga a cobrar (fatura mensal até existir split): por transportadora e mês. Só Master. */
export async function cargasCommissionReport(db: Database, actor: Actor) {
  requireMaster(actor);
  const rows = await db.select({ carrierId: trLoads.carrierId, name: trCarriers.name, plan: trCarriers.plan, acceptedAt: trLoads.acceptedAt, freight: trLoads.freightCents, commission: trLoads.commissionCents }).from(trLoads).innerJoin(trCarriers, eq(trCarriers.id, trLoads.carrierId)).where(inArray(trLoads.status, ["ACEITA", "COLETADA", "ENTREGUE"]));
  const carriers = [...new Map(rows.map((r) => [r.carrierId, { carrierId: r.carrierId, name: r.name, plan: r.plan }])).values()];
  return carriers.map((c) => ({ ...c, months: cargasMonths(rows.filter((r) => r.carrierId === c.carrierId)) }));
}

export async function listAllLoads(db: Database, actor: Actor) {
  requireMaster(actor);
  return loadViews(db, undefined, { withCodes: "NEVER", limit: 300 });
}

// ---------------------------------------------------------------------------
// Link do motorista (sem login, padrão D106)
// ---------------------------------------------------------------------------
export async function createDriverLink(db: Database, actor: Actor, carrierId: string | null) {
  const s = await carrierScope(db, actor, carrierId);
  const token = randomBytes(24).toString("base64url");
  await db.update(trCarriers).set({ driverTokenHash: hash(token), driverTokenCreatedAt: new Date().toISOString() }).where(eq(trCarriers.id, s.carrier.id));
  await recordAudit(db, actor, { action: "CARGAS_DRIVER_LINK", entityType: "tr_carrier", entityId: s.carrier.id }, { force: true });
  return { token, path: `/motorista/${token}` };
}

export async function revokeDriverLink(db: Database, actor: Actor, carrierId: string | null) {
  const s = await carrierScope(db, actor, carrierId);
  await db.update(trCarriers).set({ driverTokenHash: null, driverTokenCreatedAt: null }).where(eq(trCarriers.id, s.carrier.id));
  await recordAudit(db, actor, { action: "CARGAS_DRIVER_LINK_REVOKED", entityType: "tr_carrier", entityId: s.carrier.id }, { force: true });
  return { ok: true as const };
}

export async function carrierByDriverToken(db: Database, token: string) {
  if (!TOKEN.test(token)) return null;
  const h = hash(token);
  const c = await db.query.trCarriers.findFirst({ where: eq(trCarriers.driverTokenHash, h) });
  if (!c?.driverTokenHash || c.status !== "ATIVA" || !timingSafeEqual(Buffer.from(c.driverTokenHash), Buffer.from(h))) return null;
  return c;
}

/** Tela do motorista: cargas aceitas (para coletar) e coletadas (para entregar), com endereço, horário e códigos. */
export async function driverQueue(db: Database, token: string) {
  const c = await carrierByDriverToken(db, token);
  if (!c) return null;
  const loads = (await loadViews(db, eq(trLoads.carrierId, c.id), { withCodes: "ACCEPTED", limit: 100 })).filter((l) => l.status === "ACEITA" || l.status === "COLETADA");
  return { carrier: { name: c.name }, coletar: loads.filter((l) => l.status === "ACEITA").map((l) => ({ ...l, freightCents: null, commissionCents: null })), entregar: loads.filter((l) => l.status === "COLETADA").map((l) => ({ ...l, freightCents: null, commissionCents: null })) };
}

export async function driverMarkDelivered(db: Database, token: string, loadId: string, note?: string) {
  const c = await carrierByDriverToken(db, token);
  if (!c) throw new NotFoundError("Link do motorista inválido.");
  return deliver(db, c.id, loadId, `Motorista da ${c.name}`, note);
}
