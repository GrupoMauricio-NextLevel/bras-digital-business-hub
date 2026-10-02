import { and, asc, count, desc, eq, gt, inArray, lt, max } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { entitlements, orderClaims, orderItems, orderLabelFiles, orders, pickWaveOrders, pickWaves, stores, supplierOps, suppliers, users, userProductAccess, labelPrints, products, type Cutoffs, type OrderStatus } from "@/db/schema";
import { newId } from "@/lib/ids";
import { generateTemporaryPassword, hashPassword } from "@/lib/security/password";
import { assertCanAccess, hasAreaRole, isSupplierSide, requireSupplierId, requireSupplierOperationalId, type Actor } from "./access";
import { DEFAULT_CUTOFFS, cutoffStatus, localDate, validateOps, waveDateFor, type Ops } from "./cutoff";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { emitEvent } from "./events";
import { mergeLabels } from "./labels";
import { advanceOrder } from "./orders";

export const CLAIM_MINUTES = 30;
export const BASE_DISPATCH_SEATS = 2;

// ---------------------------------------------------------------------------
// Configuração de operação (corte, feriados, fuso)
// ---------------------------------------------------------------------------
export async function getOps(db: Database, supplierId: string): Promise<Ops & { configured: boolean }> {
  const row = await db.query.supplierOps.findFirst({ where: eq(supplierOps.supplierId, supplierId) });
  if (!row) return { timezone: "America/Sao_Paulo", cutoffs: { ...DEFAULT_CUTOFFS }, holidays: [], configured: false };
  return { timezone: row.timezone, cutoffs: row.cutoffs, holidays: row.holidays, configured: true };
}

const opsSchema = z.object({ timezone: z.string().min(3), cutoffs: z.object({ mon: z.string().nullable(), tue: z.string().nullable(), wed: z.string().nullable(), thu: z.string().nullable(), fri: z.string().nullable(), sat: z.string().nullable(), sun: z.string().nullable() }), holidays: z.array(z.string()).max(60) });

export async function saveOps(db: Database, actor: Actor, raw: z.input<typeof opsSchema>) {
  const supplierId = requireSupplierId(actor);
  const input = opsSchema.parse(raw);
  const err = validateOps(input as Ops);
  if (err) throw new DomainError("OPS_INVALID", err);
  const value = { timezone: input.timezone, cutoffs: input.cutoffs as Cutoffs, holidays: [...new Set(input.holidays)].sort() };
  await db.insert(supplierOps).values({ supplierId, ...value }).onConflictDoUpdate({ target: supplierOps.supplierId, set: { ...value, updatedAt: new Date().toISOString() } });
  await emitEvent(db, { type: "CUTOFF_CONFIGURED", supplierId, actorRole: actor.role });
}

// ---------------------------------------------------------------------------
// Esteira (DTO sem nenhum valor monetário)
// ---------------------------------------------------------------------------
export type EsteiraOrder = {
  id: string; number: number; status: OrderStatus; storeName: string; customerName: string; city: string | null; state: string | null;
  createdAt: string; releasedAt: string | null; ageMinutes: number;
  items: { productName: string; label: string; quantity: number }[]; itemCount: number;
  labelCount: number; labelPrinted: boolean; listPrinted: boolean;
  claim: { userId: string; userName: string; mine: boolean } | null;
  wave: { id: string; number: number } | null;
  bucket: "TODAY" | "NEXT" | null; waveDate: string | null;
};

export const ESTEIRA_COLUMNS = ["AWAITING_CENTRAL_PAYMENT", "AWAITING_LABEL", "READY_TO_PICK", "PICKING", "READY_TO_SHIP", "SHIPPED"] as const;
export const DISPATCH_COLUMNS = ["READY_TO_PICK", "PICKING", "READY_TO_SHIP", "SHIPPED"] as const;

export async function loadEsteira(db: Database, actor: Actor, now = new Date()) {
  const supplierId = requireSupplierOperationalId(actor);
  const ops = await getOps(db, supplierId);
  const cutoff = cutoffStatus(ops, now);
  const dispatchOnly = hasAreaRole(actor, "SUPERDROP", "OPERATOR") && !hasAreaRole(actor, "SUPERDROP", "SUPPLIER_ADMIN");
  const statuses = (dispatchOnly ? DISPATCH_COLUMNS : ESTEIRA_COLUMNS) as readonly OrderStatus[];
  const dayStart = new Date(now.getTime() - 36 * 3_600_000).toISOString();
  const rows = await db.select({ o: orders, storeName: stores.name }).from(orders).innerJoin(stores, eq(stores.id, orders.storeId))
    .where(and(eq(orders.supplierId, supplierId), eq(orders.sourceArea, "SUPERDROP"), inArray(orders.status, [...statuses]))).orderBy(asc(orders.centralPaidAt), asc(orders.createdAt));
  const relevant = rows.filter((r) => r.o.status !== "SHIPPED" || (r.o.updatedAt >= dayStart && localDate(new Date(r.o.updatedAt), ops.timezone) === cutoff.today));
  const ids = relevant.map((r) => r.o.id);
  const [items, labels, claims, waveRows, prints] = ids.length ? await Promise.all([
    db.select().from(orderItems).where(inArray(orderItems.orderId, ids)),
    db.select({ orderId: orderLabelFiles.orderId, n: count() }).from(orderLabelFiles).where(inArray(orderLabelFiles.orderId, ids)).groupBy(orderLabelFiles.orderId),
    db.select().from(orderClaims).where(and(inArray(orderClaims.orderId, ids), gt(orderClaims.claimedAt, new Date(now.getTime() - CLAIM_MINUTES * 60_000).toISOString()))),
    db.select({ orderId: pickWaveOrders.orderId, waveId: pickWaves.id, number: pickWaves.number }).from(pickWaveOrders).innerJoin(pickWaves, eq(pickWaves.id, pickWaveOrders.waveId)).where(inArray(pickWaveOrders.orderId, ids)),
    db.select().from(labelPrints).where(inArray(labelPrints.orderId, ids)),
  ]) : [[], [], [], [], []] as const;
  const dto: EsteiraOrder[] = relevant.map(({ o, storeName }) => {
    const claim = claims.find((c) => c.orderId === o.id);
    const wave = waveRows.find((w) => w.orderId === o.id);
    const released = o.centralPaidAt ? new Date(o.centralPaidAt) : null;
    const its = items.filter((i) => i.orderId === o.id).map((i) => ({ productName: i.productName, label: i.label, quantity: i.quantity }));
    const waveDate = released ? waveDateFor(ops, released) : null;
    return {
      id: o.id, number: o.number, status: o.status, storeName, customerName: o.customerName, city: o.shippingCity, state: o.shippingState,
      createdAt: o.createdAt, releasedAt: o.centralPaidAt, ageMinutes: Math.max(0, Math.floor((now.getTime() - new Date(o.centralPaidAt ?? o.createdAt).getTime()) / 60_000)),
      items: its, itemCount: its.reduce((s, i) => s + i.quantity, 0),
      labelCount: labels.find((l) => l.orderId === o.id)?.n ?? 0,
      labelPrinted: prints.some((p) => p.orderId === o.id && p.kind === "LABEL"), listPrinted: prints.some((p) => p.orderId === o.id && p.kind === "PICKING_LIST"),
      claim: claim ? { userId: claim.userId, userName: claim.userName, mine: claim.userId === actor.userId } : null,
      wave: wave ? { id: wave.waveId, number: wave.number } : null,
      waveDate, bucket: waveDate ? (waveDate === cutoff.today ? "TODAY" : "NEXT") : null,
    };
  });
  return { ops, cutoff: { ...cutoff, cutoffAt: cutoff.cutoffAt?.toISOString() ?? null, nextCutoffAt: cutoff.nextCutoffAt.toISOString() }, orders: dto, columns: statuses };
}

/** Marca de versão da esteira: muda quando qualquer pedido, claim ou onda do fornecedor muda (base do modo ao vivo). */
export async function ordersVersion(db: Database, supplierId: string): Promise<string> {
  const [o] = await db.select({ t: max(orders.updatedAt), n: count() }).from(orders).where(eq(orders.supplierId, supplierId));
  const [c] = await db.select({ t: max(orderClaims.claimedAt), n: count() }).from(orderClaims).where(eq(orderClaims.supplierId, supplierId));
  const [w] = await db.select({ n: count() }).from(pickWaveOrders).innerJoin(pickWaves, eq(pickWaves.id, pickWaveOrders.waveId)).where(eq(pickWaves.supplierId, supplierId));
  const [p] = await db.select({ n: count() }).from(labelPrints).innerJoin(orders, eq(orders.id, labelPrints.orderId)).where(eq(orders.supplierId, supplierId));
  return [o?.t ?? "0", o?.n ?? 0, c?.t ?? "0", c?.n ?? 0, w?.n ?? 0, p?.n ?? 0].join("|");
}

// ---------------------------------------------------------------------------
// Claims: quem está separando
// ---------------------------------------------------------------------------
export async function claimOrder(db: Database, actor: Actor, orderId: string, now = new Date()) {
  if (!isSupplierSide(actor)) throw new ForbiddenError();
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) throw new NotFoundError("Pedido não encontrado.");
  assertCanAccess(actor, order);
  if (!["READY_TO_PICK", "PICKING"].includes(order.status)) throw new DomainError("NOT_PICKABLE", "Este pedido não está na fila de separação.");
  const user = await db.query.users.findFirst({ where: eq(users.id, actor.userId) });
  const limit = new Date(now.getTime() - CLAIM_MINUTES * 60_000).toISOString();
  return db.transaction(async (tx) => {
    await tx.delete(orderClaims).where(and(eq(orderClaims.orderId, orderId), lt(orderClaims.claimedAt, limit)));
    const inserted = await tx.insert(orderClaims).values({ orderId, supplierId: order.supplierId, userId: actor.userId, userName: user?.name ?? "Equipe", claimedAt: now.toISOString() }).onConflictDoNothing().returning({ orderId: orderClaims.orderId });
    if (inserted.length === 0) {
      const cur = await tx.query.orderClaims.findFirst({ where: eq(orderClaims.orderId, orderId) });
      if (cur && cur.userId !== actor.userId) throw new DomainError("CLAIMED", `${cur.userName} já está separando este pedido.`);
      await tx.update(orderClaims).set({ claimedAt: now.toISOString() }).where(eq(orderClaims.orderId, orderId)); // renova o próprio claim
    }
    return { claimedBy: user?.name ?? "Equipe" };
  });
}

export async function releaseClaim(db: Database, actor: Actor, orderId: string) {
  if (!isSupplierSide(actor)) throw new ForbiddenError();
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) throw new NotFoundError("Pedido não encontrado.");
  assertCanAccess(actor, order);
  const cur = await db.query.orderClaims.findFirst({ where: eq(orderClaims.orderId, orderId) });
  if (cur && cur.userId !== actor.userId && !hasAreaRole(actor, "SUPERDROP", "SUPPLIER_ADMIN")) throw new ForbiddenError("Só quem está separando (ou o gestor) libera o pedido.");
  await db.delete(orderClaims).where(eq(orderClaims.orderId, orderId));
}

/** Avanço operacional da esteira: iniciar separação assume o pedido; concluir/enviar libera. */
export async function dispatchAdvance(db: Database, actor: Actor, orderId: string, next: "PICKING" | "READY_TO_SHIP" | "SHIPPED", now = new Date()) {
  if (!isSupplierSide(actor)) throw new ForbiddenError();
  if (next === "PICKING") await claimOrder(db, actor, orderId, now);
  else {
    const cur = await db.query.orderClaims.findFirst({ where: eq(orderClaims.orderId, orderId) });
    const fresh = cur && new Date(cur.claimedAt).getTime() > now.getTime() - CLAIM_MINUTES * 60_000;
    if (fresh && cur.userId !== actor.userId && !hasAreaRole(actor, "SUPERDROP", "SUPPLIER_ADMIN")) throw new DomainError("CLAIMED", `${cur.userName} está separando este pedido.`);
  }
  const r = await advanceOrder(db, actor, orderId, next);
  if (next !== "PICKING") await db.delete(orderClaims).where(eq(orderClaims.orderId, orderId));
  return r;
}

// ---------------------------------------------------------------------------
// Ondas de separação
// ---------------------------------------------------------------------------
const waveSchema = z.object({ orderIds: z.array(z.string()).max(200).optional(), untilCutoff: z.boolean().optional() });

/** Cria uma onda com pedidos prontos para separar (com etiqueta) que ainda não estão em outra onda. */
export async function createWave(db: Database, actor: Actor, raw: z.input<typeof waveSchema>, now = new Date()) {
  const supplierId = requireSupplierOperationalId(actor);
  const input = waveSchema.parse(raw);
  const ops = await getOps(db, supplierId);
  const today = localDate(now, ops.timezone);
  return db.transaction(async (tx) => {
    const ready = await tx.select().from(orders).where(and(eq(orders.supplierId, supplierId), eq(orders.status, "READY_TO_PICK"), eq(orders.shippingLabelStatus, "READY"))).orderBy(asc(orders.centralPaidAt));
    const already = new Set((await tx.select({ id: pickWaveOrders.orderId }).from(pickWaveOrders)).map((r) => r.id));
    let picked = ready.filter((o) => !already.has(o.id));
    if (input.untilCutoff) picked = picked.filter((o) => o.centralPaidAt && waveDateFor(ops, new Date(o.centralPaidAt)) <= today);
    else if (input.orderIds?.length) picked = picked.filter((o) => input.orderIds!.includes(o.id));
    else throw new DomainError("NO_SELECTION", "Selecione pedidos ou escolha \"todos até o corte\".");
    if (picked.length === 0) throw new DomainError("EMPTY_WAVE", "Nenhum pedido elegível: precisam estar prontos para separar, com etiqueta e fora de outra onda.");
    const [{ n } = { n: 0 }] = await tx.select({ n: max(pickWaves.number) }).from(pickWaves).where(eq(pickWaves.supplierId, supplierId));
    const number = (n ?? 0) + 1;
    const id = newId("wav");
    await tx.insert(pickWaves).values({ id, supplierId, number, waveDate: today, createdBy: actor.userId });
    await tx.insert(pickWaveOrders).values(picked.map((o) => ({ orderId: o.id, waveId: id })));
    await emitEvent(tx, { type: "WAVE_CREATED", supplierId, actorRole: actor.role, payload: { waveId: id, orders: picked.length } });
    return { id, number, orders: picked.length, orderIds: picked.map((o) => o.id) };
  });
}

export async function loadWave(db: Database, actor: Actor, waveId: string) {
  const supplierId = requireSupplierOperationalId(actor);
  const wave = await db.query.pickWaves.findFirst({ where: eq(pickWaves.id, waveId) });
  if (!wave) throw new NotFoundError("Onda não encontrada.");
  if (wave.supplierId !== supplierId) throw new ForbiddenError();
  const links = await db.select({ orderId: pickWaveOrders.orderId }).from(pickWaveOrders).where(eq(pickWaveOrders.waveId, waveId));
  return { wave, orderIds: links.map((l) => l.orderId) };
}

export async function listWaves(db: Database, actor: Actor, limit = 20) {
  const supplierId = requireSupplierOperationalId(actor);
  const rows = await db.select({ wave: pickWaves, n: count(pickWaveOrders.orderId) }).from(pickWaves).leftJoin(pickWaveOrders, eq(pickWaveOrders.waveId, pickWaves.id)).where(eq(pickWaves.supplierId, supplierId)).groupBy(pickWaves.id).orderBy(desc(pickWaves.number)).limit(limit);
  return rows;
}

export type PickLine = { key: string; productName: string; label: string; quantity: number; orders: number[] };

/** Lista de separação agrupada por produto/variação: uma passada pela prateleira atende todos os pedidos. Pura. */
export function aggregatePickingList(items: { orderId: string; productName: string; label: string; quantity: number }[], numberByOrder: Map<string, number>): PickLine[] {
  const m = new Map<string, PickLine>();
  for (const it of items) {
    const key = `${it.productName}|${it.label.split(" (")[0]}`;
    const line = m.get(key) ?? { key, productName: it.productName, label: it.label.split(" (")[0]!, quantity: 0, orders: [] };
    line.quantity += it.quantity;
    const n = numberByOrder.get(it.orderId);
    if (n !== undefined && !line.orders.includes(n)) line.orders.push(n);
    m.set(key, line);
  }
  return [...m.values()].map((l) => ({ ...l, orders: l.orders.sort((a, b) => a - b) })).sort((a, b) => a.productName.localeCompare(b.productName) || a.label.localeCompare(b.label));
}

export async function pickingListFor(db: Database, actor: Actor, orderIds: string[]) {
  if (!isSupplierSide(actor)) throw new ForbiddenError();
  const found = orderIds.length ? await db.select().from(orders).where(inArray(orders.id, orderIds)) : [];
  for (const o of found) assertCanAccess(actor, o);
  const items = found.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, found.map((o) => o.id))) : [];
  const stock = items.length ? await db.select({ id: products.id, sku: products.sku }).from(products).where(inArray(products.id, [...new Set(items.map((i) => i.productId))])) : [];
  const lines = aggregatePickingList(items, new Map(found.map((o) => [o.id, o.number])));
  return { lines, orders: found.map((o) => ({ id: o.id, number: o.number, customerName: o.customerName })), skuOf: new Map(stock.map((s) => [s.id, s.sku])) };
}

/** Etiquetas de uma onda em PDF único (registra a impressão de cada pedido). */
export async function waveLabelsPdf(db: Database, actor: Actor, waveId: string) {
  const { orderIds } = await loadWave(db, actor, waveId);
  return mergeLabels(db, actor, orderIds);
}

// ---------------------------------------------------------------------------
// Equipe de expedição (assentos = 2 + add-ons ativos)
// ---------------------------------------------------------------------------
export async function dispatchSeats(db: Database, supplierId: string, now = new Date()) {
  const extra = (await db.select().from(entitlements).where(and(eq(entitlements.supplierId, supplierId), eq(entitlements.key, "EXTRA_DISPATCH_SEAT")))).filter((e) => e.endsAt === null || new Date(e.endsAt) > now).length;
  const used = (await db.select({ n: count() }).from(users).where(and(eq(users.supplierId, supplierId), eq(users.role, "SUPPLIER_DISPATCH"))))[0]?.n ?? 0;
  return { total: BASE_DISPATCH_SEATS + extra, extra, used };
}

export async function listTeam(db: Database, actor: Actor) {
  const supplierId = requireSupplierId(actor);
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, lastLoginAt: users.lastLoginAt, mustChangePassword: users.mustChangePassword }).from(users).where(eq(users.supplierId, supplierId)).orderBy(users.name);
}

const memberSchema = z.object({ name: z.string().trim().min(2, "Informe o nome"), email: z.string().email("E-mail inválido") });

/** Gestor cria um usuário de expedição com senha temporária (respeita o limite de assentos). */
export async function createDispatchUser(db: Database, actor: Actor, raw: z.input<typeof memberSchema>) {
  const supplierId = requireSupplierId(actor);
  const input = memberSchema.parse(raw);
  const email = input.email.toLowerCase();
  if (await db.query.users.findFirst({ where: eq(users.email, email) })) throw new DomainError("EMAIL_TAKEN", "Já existe um usuário com este e-mail.");
  const seats = await dispatchSeats(db, supplierId);
  if (seats.used >= seats.total) throw new DomainError("NO_SEATS", `Limite de ${seats.total} usuários de expedição atingido. Contrate um assento extra em Financeiro > Add-ons.`);
  const supplier = await db.query.suppliers.findFirst({ where: eq(suppliers.id, supplierId) });
  if (!supplier) throw new NotFoundError("Fornecedor não encontrado.");
  const temporaryPassword = generateTemporaryPassword();
  const userId = newId("usr");
  await db.transaction(async (tx) => {
    await tx.insert(users).values({ id: userId, name: input.name, email, role: "SUPPLIER_DISPATCH", organizationId: supplier.organizationId, supplierId: supplier.id, passwordHash: hashPassword(temporaryPassword), mustChangePassword: true });
    await tx.insert(userProductAccess).values({
      id: newId("upa"),
      userId,
      organizationId: supplier.organizationId,
      area: "SUPERDROP",
      role: "OPERATOR",
      supplierId: supplier.id,
      active: true,
    });
    await emitEvent(tx, { type: "DISPATCH_USER_CREATED", supplierId: supplier.id, actorRole: actor.role });
  });
  return { email, temporaryPassword };
}

export async function removeDispatchUser(db: Database, actor: Actor, userId: string) {
  const supplierId = requireSupplierId(actor);
  const u = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!u || u.supplierId !== supplierId || u.role !== "SUPPLIER_DISPATCH") throw new NotFoundError("Usuário não encontrado.");
  await db.transaction(async (tx) => {
    await tx.delete(orderClaims).where(eq(orderClaims.userId, userId));
    await tx.delete(userProductAccess).where(eq(userProductAccess.userId, userId));
    await tx.delete(users).where(eq(users.id, userId));
  });
}

// ---------------------------------------------------------------------------
// Onboarding do fornecedor
// ---------------------------------------------------------------------------
export type OnboardingStep = { key: "wallet" | "cutoff" | "team" | "catalog"; label: string; hint: string; href: string; done: boolean };

export async function supplierOnboarding(db: Database, supplierId: string): Promise<{ steps: OnboardingStep[]; doneCount: number }> {
  const s = await db.query.suppliers.findFirst({ where: eq(suppliers.id, supplierId) });
  const ops = await db.query.supplierOps.findFirst({ where: eq(supplierOps.supplierId, supplierId) });
  const team = (await db.select({ n: count() }).from(users).where(and(eq(users.supplierId, supplierId), eq(users.role, "SUPPLIER_DISPATCH"))))[0]?.n ?? 0;
  const prods = (await db.select({ n: count() }).from(products).where(eq(products.supplierId, supplierId)))[0]?.n ?? 0;
  const steps: OnboardingStep[] = [
    { key: "wallet", label: "Conectar o Mercado Pago", hint: "Receba as recargas Pix dos lojistas na sua conta.", href: "/supplier/settings", done: Boolean(s?.walletMpTokenEnc) },
    { key: "cutoff", label: "Definir o horário de corte", hint: "Pedidos pagos até o corte saem no mesmo dia.", href: "/supplier/operations", done: Boolean(ops) },
    { key: "team", label: "Cadastrar a equipe de expedição", hint: "Quem separa e imprime as etiquetas.", href: "/supplier/team", done: team > 0 },
    { key: "catalog", label: "Cadastrar produtos", hint: "Seu catálogo abastece todas as lojas da rede.", href: "/supplier/products", done: prods > 0 },
  ];
  return { steps, doneCount: steps.filter((x) => x.done).length };
}


