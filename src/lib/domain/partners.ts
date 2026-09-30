import { createHmac, randomBytes } from "node:crypto";
import { and, count, desc, eq, gte, inArray, lt, lte, ne, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { coupons, financeInvoices, organizations, partnerClicks, partnerCommissions, partnerLinks, partnerMonthStatus, partnerPayouts, partners, platformSettings, stores, users, type InvoiceLine, type PartnerCommissionKind } from "@/db/schema";
import { newId } from "@/lib/ids";
import { hashPassword } from "@/lib/security/password";
import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import { commissionOf, DEFAULT_PARTNER_SETTINGS, partnerSettingsSchema, tierFor, type PartnerSettings } from "@/lib/finance/partner-rules";
import { isMaster, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { emitEvent } from "./events";
import { periodBounds, periodOf } from "./finance";
import { normalizeTaxId, storeAccess } from "./store-access";
import { emails, sendEmail } from "@/lib/email";

const SETTINGS_KEY = "partner_settings";
const DAY = 86_400_000;

// ---------------------------------------------------------------------------
// Configurações (Master)
// ---------------------------------------------------------------------------
export async function getPartnerSettings(db: Database): Promise<PartnerSettings> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, SETTINGS_KEY) });
  const parsed = partnerSettingsSchema.safeParse({ ...DEFAULT_PARTNER_SETTINGS, ...(row?.value as object | undefined) });
  return parsed.success ? parsed.data : DEFAULT_PARTNER_SETTINGS;
}

export async function savePartnerSettings(db: Database, actor: Actor, raw: unknown): Promise<PartnerSettings> {
  if (!isMaster(actor)) throw new ForbiddenError("Apenas a NextLevel altera as regras do programa.");
  const value = partnerSettingsSchema.parse(raw);
  await db.insert(platformSettings).values({ key: SETTINGS_KEY, value, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  return value;
}

// ---------------------------------------------------------------------------
// Cadastro do parceiro
// ---------------------------------------------------------------------------
export const partnerSignupSchema = z.object({
  name: z.string().trim().min(3, "Informe o seu nome completo").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres"),
  taxId: z.string().min(11, "Informe o CPF ou CNPJ"),
  phone: z.string().transform((v) => v.replace(/\D/g, "")).refine((d) => d.length >= 10 && d.length <= 13, "WhatsApp inválido (com DDD)"),
  pixKey: z.string().trim().max(140).optional(),
  acceptTerms: z.literal(true, { error: "É preciso aceitar os termos do programa" }),
});

const codeFrom = (name: string) => name.normalize("NFD").replace(/[^\p{L}\p{N}]/gu, "").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);

async function uniquePartnerCode(db: Database, name: string): Promise<string> {
  const base = codeFrom(name).padEnd(4, "X");
  for (let i = 0; i < 20; i++) {
    const code = i === 0 ? base : `${base.slice(0, 14)}${Math.floor(1000 + Math.random() * 9000)}`;
    if (!(await db.query.partners.findFirst({ where: eq(partners.code, code) }))) return code;
  }
  return `${base}${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function registerPartner(db: Database, raw: z.input<typeof partnerSignupSchema>, now = new Date()) {
  const input = partnerSignupSchema.parse(raw);
  const taxId = normalizeTaxId(input.taxId);
  if (await db.query.users.findFirst({ where: eq(users.email, input.email) })) throw new DomainError("EMAIL_TAKEN", "Já existe uma conta com este e-mail. Entre para continuar.");
  if (await db.query.partners.findFirst({ where: eq(partners.taxId, taxId) })) throw new DomainError("TAXID_TAKEN", "Este CPF/CNPJ já tem cadastro no programa.");
  const settings = await getPartnerSettings(db);
  const orgId = newId("org"), userId = newId("usr"), partnerId = newId("prt");
  const code = await uniquePartnerCode(db, input.name);
  await db.transaction(async (tx) => {
    await tx.insert(organizations).values({ id: orgId, name: input.name, slug: `parceiro-${partnerId.slice(-8)}`, type: "PARTNER" });
    await tx.insert(users).values({ id: userId, name: input.name, email: input.email, role: "AFFILIATE", organizationId: orgId, passwordHash: hashPassword(input.password), mustChangePassword: false });
    await tx.insert(partners).values({ id: partnerId, userId, code, displayName: input.name, taxId, phone: input.phone, pixKeyEnc: input.pixKey ? encryptSecret(input.pixKey) : null, status: "ACTIVE", termsVersion: settings.termsVersion, termsAcceptedAt: now.toISOString() });
    await tx.insert(partnerLinks).values({ id: newId("plk"), partnerId, slug: `${code.toLowerCase()}`, label: "Link principal" });
  });
  await emitEvent(db, { type: "PARTNER_REGISTERED", actorRole: "AFFILIATE", payload: { partnerId, code, terms: settings.termsVersion } });
  return { userId, partnerId, code };
}

export async function partnerOfActor(db: Database, actor: Actor) {
  if (actor.role !== "AFFILIATE") throw new ForbiddenError("Área exclusiva de parceiros.");
  const p = await db.query.partners.findFirst({ where: eq(partners.userId, actor.userId) });
  if (!p) throw new NotFoundError("Cadastro de parceiro não encontrado.");
  return p;
}

const requireCaptureActive = (p: { status: string }) => { if (p.status !== "ACTIVE") throw new DomainError("PARTNER_INACTIVE", p.status === "SUSPENDED" ? "Seu cadastro está suspenso. Fale com a NextLevel." : "Seu cadastro está inativo neste mês: reative para voltar a captar."); };

// ---------------------------------------------------------------------------
// Links rastreáveis, cliques e cupons
// ---------------------------------------------------------------------------
const linkSchema = z.object({ label: z.string().trim().min(2, "Dê um nome ao link").max(60), campaign: z.string().trim().max(60).optional(), planKey: z.enum(["DROP_MANUAL", "STORE_SUBDOMAIN", "STORE_OWN"]).optional() });

export async function createLink(db: Database, actor: Actor, raw: z.input<typeof linkSchema>) {
  const p = await partnerOfActor(db, actor); requireCaptureActive(p);
  const input = linkSchema.parse(raw);
  if ((await db.select({ n: count() }).from(partnerLinks).where(eq(partnerLinks.partnerId, p.id)))[0]!.n >= 30) throw new DomainError("LINK_LIMIT", "Limite de 30 links. Apague os que não usa.");
  const id = newId("plk");
  const slug = randomBytes(5).toString("base64url").replace(/[^a-zA-Z0-9]/g, "x").slice(0, 7).toLowerCase();
  await db.insert(partnerLinks).values({ id, partnerId: p.id, slug, label: input.label, campaign: input.campaign || null, planKey: input.planKey ?? null });
  return { id, slug };
}

const salted = (v: string) => createHmac("sha256", process.env.SESSION_SECRET ?? "dev-only-secret-change-me-please").update(v).digest("hex").slice(0, 32);

/** Clique em `/r/[slug]`: só conta e devolve o parceiro se ele puder captar (ativo). Guarda apenas hashes. */
export async function recordClick(db: Database, slug: string, who: { ip: string; ua: string }) {
  const link = await db.query.partnerLinks.findFirst({ where: eq(partnerLinks.slug, slug.toLowerCase()) });
  if (!link) return null;
  const p = await db.query.partners.findFirst({ where: eq(partners.id, link.partnerId) });
  if (!p) return null;
  await db.insert(partnerClicks).values({ id: newId("pck"), linkId: link.id, ipHash: salted(who.ip), uaHash: salted(who.ua) });
  await db.update(partnerLinks).set({ clicks: sql`${partnerLinks.clicks} + 1` }).where(eq(partnerLinks.id, link.id));
  return { partnerCode: p.code, planKey: link.planKey, active: p.status === "ACTIVE" };
}

export async function listLinks(db: Database, actor: Actor) {
  const p = await partnerOfActor(db, actor);
  return db.select().from(partnerLinks).where(eq(partnerLinks.partnerId, p.id)).orderBy(desc(partnerLinks.createdAt));
}

export async function createPartnerCoupon(db: Database, actor: Actor, input: { code: string; maxRedemptions?: number | null }) {
  const p = await partnerOfActor(db, actor); requireCaptureActive(p);
  const code = input.code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) throw new DomainError("COUPON", "Use de 3 a 24 letras, números, - ou _.");
  if (await db.query.coupons.findFirst({ where: eq(coupons.code, code) })) throw new DomainError("COUPON_TAKEN", "Este cupom já existe.");
  if ((await db.select({ n: count() }).from(coupons).where(eq(coupons.partnerId, p.id)))[0]!.n >= 20) throw new DomainError("COUPON_LIMIT", "Limite de 20 cupons.");
  const id = newId("cpn");
  await db.insert(coupons).values({ id, code, supplierId: null, partnerId: p.id, trialDays: 7, maxRedemptions: input.maxRedemptions ?? null });
  return { couponId: id, code };
}

export async function setPartnerCouponActive(db: Database, actor: Actor, couponId: string, active: boolean) {
  const p = await partnerOfActor(db, actor);
  const c = await db.query.coupons.findFirst({ where: and(eq(coupons.id, couponId), eq(coupons.partnerId, p.id)) });
  if (!c) throw new NotFoundError("Cupom não encontrado.");
  await db.update(coupons).set({ active }).where(eq(coupons.id, c.id));
}

export async function listPartnerCoupons(db: Database, actor: Actor) {
  const p = await partnerOfActor(db, actor);
  const rows = await db.select().from(coupons).where(eq(coupons.partnerId, p.id)).orderBy(desc(coupons.createdAt));
  const paid = await db.select({ couponId: stores.couponId, storeId: stores.id }).from(stores).where(eq(stores.partnerId, p.id));
  const converted = new Set((await db.select({ storeId: partnerCommissions.storeId }).from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, p.id), eq(partnerCommissions.kind, "SETUP"), ne(partnerCommissions.status, "VOID")))).map((r) => r.storeId));
  return rows.map((c) => ({ ...c, conversions: paid.filter((s) => s.couponId === c.id && converted.has(s.storeId)).length }));
}

// ---------------------------------------------------------------------------
// Atribuição no cadastro da loja
// ---------------------------------------------------------------------------
/**
 * Resolve o parceiro de uma loja nova: o cupom do parceiro tem prioridade; senão o link (cookie) dentro da janela.
 * Autoindicação (mesmo CPF/CNPJ ou e-mail do parceiro) não gera comissão: marca FRAUD_REVIEW. Grava uma vez e nunca muda.
 */
export async function attributeStore(db: Database, input: { storeId: string; taxId: string; email: string; couponCode?: string | null; refCode?: string | null; now?: Date }) {
  const now = input.now ?? new Date();
  const store = await db.query.stores.findFirst({ where: eq(stores.id, input.storeId) });
  if (!store || store.partnerId) return null;
  let partner: typeof partners.$inferSelect | undefined; let via: "LINK" | "COUPON" | null = null;
  if (input.couponCode) {
    const c = await db.query.coupons.findFirst({ where: eq(coupons.code, input.couponCode.trim().toUpperCase()) });
    if (c?.partnerId) { partner = await db.query.partners.findFirst({ where: eq(partners.id, c.partnerId) }); via = "COUPON"; }
  }
  if (!partner && input.refCode) { partner = await db.query.partners.findFirst({ where: eq(partners.code, input.refCode.trim().toUpperCase()) }); if (partner) via = "LINK"; }
  if (!partner || !via || partner.status === "SUSPENDED") return null;
  const owner = await db.query.users.findFirst({ where: eq(users.id, partner.userId) });
  const self = partner.taxId === input.taxId || owner?.email.toLowerCase() === input.email.toLowerCase();
  await db.update(stores).set({ partnerId: partner.id, attributedVia: via, attributedAt: now.toISOString(), attributionFlag: self ? "FRAUD_REVIEW" : null }).where(and(eq(stores.id, store.id), sql`${stores.partnerId} is null`));
  await emitEvent(db, { type: self ? "PARTNER_SELF_REFERRAL" : "PARTNER_ATTRIBUTED", storeId: store.id, payload: { partnerId: partner.id, via } });
  return { partnerId: partner.id, via, flagged: self };
}

// ---------------------------------------------------------------------------
// Comissões (livro-razão)
// ---------------------------------------------------------------------------
async function insertEntry(db: Database, e: { partnerId: string; storeId?: string | null; invoiceId?: string | null; refId?: string | null; payoutId?: string | null; kind: PartnerCommissionKind; baseCents?: number; rateBps?: number; amountCents: number; period: string; status: "PENDING" | "AVAILABLE" | "PAID" | "VOID"; availableAt?: string | null; note?: string; dedupeKey: string }) {
  const r = await db.insert(partnerCommissions).values({ id: newId("pcm"), partnerId: e.partnerId, storeId: e.storeId ?? null, invoiceId: e.invoiceId ?? null, refId: e.refId ?? null, payoutId: e.payoutId ?? null, kind: e.kind, baseCents: e.baseCents ?? 0, rateBps: e.rateBps ?? 0, amountCents: e.amountCents, period: e.period, status: e.status, availableAt: e.availableAt ?? null, note: e.note ?? null, dedupeKey: e.dedupeKey }).onConflictDoNothing().returning({ id: partnerCommissions.id });
  return r[0]?.id ?? null;
}

export async function activationsInPeriod(db: Database, partnerId: string, period: string) {
  return (await db.select({ n: count() }).from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, partnerId), eq(partnerCommissions.kind, "SETUP"), eq(partnerCommissions.period, period), ne(partnerCommissions.status, "VOID"))))[0]!.n;
}

/** Fatura de ativação paga (setup + 1ª mensalidade): comissão provisória sobre o setup pela faixa atual e 5% sobre a 1ª mensalidade. */
export async function recordActivation(db: Database, inv: typeof financeInvoices.$inferSelect, now = new Date()) {
  if (inv.kind !== "STORE_SETUP" || !inv.storeId) return;
  const store = await db.query.stores.findFirst({ where: eq(stores.id, inv.storeId) });
  if (!store?.partnerId || store.attributionFlag) return;
  const p = await db.query.partners.findFirst({ where: eq(partners.id, store.partnerId) });
  if (!p || p.status === "SUSPENDED") return;
  const s = await getPartnerSettings(db);
  const period = periodOf(now);
  const setup = (inv.lines as InvoiceLine[]).filter((l) => l.kind === "STORE_SETUP").reduce((t, l) => t + l.amountCents, 0);
  const first = (inv.lines as InvoiceLine[]).filter((l) => l.kind === "STORE_FIRST_MONTH").reduce((t, l) => t + l.amountCents, 0);
  const availableAt = new Date(now.getTime() + s.guaranteeDays * DAY).toISOString();
  const already = await activationsInPeriod(db, p.id, period);
  const bps = tierFor(already + 1, s).bps;
  const created = await insertEntry(db, { partnerId: p.id, storeId: store.id, invoiceId: inv.id, kind: "SETUP", baseCents: setup, rateBps: bps, amountCents: commissionOf(setup, bps), period, status: "PENDING", availableAt, dedupeKey: `SETUP:${inv.id}` });
  if (first > 0) await insertEntry(db, { partnerId: p.id, storeId: store.id, invoiceId: inv.id, kind: "MAINTENANCE", baseCents: first, rateBps: s.maintenanceBps, amountCents: commissionOf(first, s.maintenanceBps), period, status: "PENDING", availableAt, dedupeKey: `MAINT:${inv.id}` });
  if (created && p.status === "INACTIVE") await db.update(partners).set({ status: "ACTIVE" }).where(eq(partners.id, p.id));
  if (created) await emitEvent(db, { type: "PARTNER_ACTIVATION", storeId: store.id, payload: { partnerId: p.id, period, bps }, dedupeKey: `PARTNER_ACTIVATION:${inv.id}` });
}

/** Mensalidade paga (todo mês): 5% para o parceiro que indicou a loja, enquanto a loja pagar. */
export async function recordMaintenance(db: Database, inv: typeof financeInvoices.$inferSelect, now = new Date()) {
  if (inv.kind !== "STORE_PLAN" || !inv.storeId) return;
  const store = await db.query.stores.findFirst({ where: eq(stores.id, inv.storeId) });
  if (!store?.partnerId || store.attributionFlag) return;
  const p = await db.query.partners.findFirst({ where: eq(partners.id, store.partnerId) });
  if (!p || p.status === "SUSPENDED") return;
  const s = await getPartnerSettings(db);
  await insertEntry(db, { partnerId: p.id, storeId: store.id, invoiceId: inv.id, kind: "MAINTENANCE", baseCents: inv.amountCents, rateBps: s.maintenanceBps, amountCents: commissionOf(inv.amountCents, s.maintenanceBps), period: periodOf(now), status: "PENDING", availableAt: new Date(now.getTime() + s.guaranteeDays * DAY).toISOString(), dedupeKey: `MAINT:${inv.id}` });
}

/** Chamado por `markInvoicePaid` depois de quitar a fatura. */
export async function onInvoicePaid(db: Database, inv: typeof financeInvoices.$inferSelect, now = new Date()) {
  if (inv.kind === "STORE_SETUP") await recordActivation(db, inv, now);
  else if (inv.kind === "STORE_PLAN") await recordMaintenance(db, inv, now);
  else if (inv.kind === "PARTNER_FEE" && inv.partnerId) await activateByFee(db, inv.partnerId, inv.period ?? periodOf(now));
}

/** PENDING → AVAILABLE depois da garantia (só de faturas ainda pagas). */
export async function releaseCommissions(db: Database, now = new Date()): Promise<number> {
  const due = await db.select({ id: partnerCommissions.id, invoiceId: partnerCommissions.invoiceId }).from(partnerCommissions).where(and(eq(partnerCommissions.status, "PENDING"), lte(partnerCommissions.availableAt, now.toISOString())));
  if (!due.length) return 0;
  const r = await db.update(partnerCommissions).set({ status: "AVAILABLE" }).where(inArray(partnerCommissions.id, due.map((d) => d.id))).returning({ id: partnerCommissions.id });
  return r.length;
}

/** Estorno/cancelamento da fatura: anula o que ainda não foi pago e lança débito (saldo negativo) no que já saiu. */
export async function clawback(db: Database, invoiceId: string, now = new Date()) {
  const rows = await db.select().from(partnerCommissions).where(and(eq(partnerCommissions.invoiceId, invoiceId), inArray(partnerCommissions.kind, ["SETUP", "MAINTENANCE", "ADJUSTMENT"]), ne(partnerCommissions.status, "VOID")));
  let voided = 0, debited = 0;
  for (const r of rows) {
    if (r.status === "PENDING") { await db.update(partnerCommissions).set({ status: "VOID" }).where(eq(partnerCommissions.id, r.id)); voided++; }
    else {
      // Já disponível ou sacada: o lançamento original fica (livro imutável) e um débito igual entra no saldo, que pode ficar negativo a compensar.
      await insertEntry(db, { partnerId: r.partnerId, storeId: r.storeId, invoiceId, refId: r.id, kind: "CLAWBACK", amountCents: -r.amountCents, period: periodOf(now), status: "AVAILABLE", availableAt: now.toISOString(), note: "Estorno da fatura", dedupeKey: `CLAWBACK:${r.id}` });
      debited++;
    }
  }
  return { voided, debited };
}

/** Fechamento do mês: ajusta a faixa das ativações do mês, apura a meta e ativa/inativa o parceiro. Idempotente por parceiro e mês. */
export async function closePartnerMonth(db: Database, period: string, now = new Date()) {
  const s = await getPartnerSettings(db);
  const { start, end } = periodBounds(period);
  const all = await db.select().from(partners).where(ne(partners.status, "SUSPENDED"));
  let closed = 0;
  for (const p of all) {
    if (await db.query.partnerMonthStatus.findFirst({ where: and(eq(partnerMonthStatus.partnerId, p.id), eq(partnerMonthStatus.period, period)) })) continue;
    const setups = await db.select().from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, p.id), eq(partnerCommissions.kind, "SETUP"), eq(partnerCommissions.period, period), ne(partnerCommissions.status, "VOID")));
    const n = setups.length;
    const tier = tierFor(n, s);
    for (const row of setups) {
      const target = commissionOf(row.baseCents, tier.bps);
      const adj = await db.select().from(partnerCommissions).where(and(eq(partnerCommissions.refId, row.id), eq(partnerCommissions.kind, "ADJUSTMENT"), ne(partnerCommissions.status, "VOID")));
      const diff = target - row.amountCents - adj.reduce((t, a) => t + a.amountCents, 0);
      if (diff !== 0) await insertEntry(db, { partnerId: p.id, storeId: row.storeId, invoiceId: row.invoiceId, refId: row.id, kind: "ADJUSTMENT", baseCents: row.baseCents, rateBps: tier.bps, amountCents: diff, period, status: diff < 0 || row.status !== "PENDING" ? "AVAILABLE" : "PENDING", availableAt: row.status === "PENDING" ? row.availableAt : now.toISOString(), note: `Ajuste de faixa do mês: ${n} ativação(ões), ${tier.bps / 100}%`, dedupeKey: `ADJ:${period}:${row.id}` });
    }
    const met = n >= s.monthlyGoal;
    // Cadastro novo só é cobrado a partir do mês seguinte ao do cadastro (carência do mês de entrada).
    const createdInPeriod = new Date(p.createdAt) >= start && new Date(p.createdAt) < end;
    await db.insert(partnerMonthStatus).values({ partnerId: p.id, period, activations: n, tierBps: tier.bps, metGoal: met });
    if (!createdInPeriod) await db.update(partners).set({ status: met ? "ACTIVE" : "INACTIVE" }).where(eq(partners.id, p.id));
    closed++;
  }
  return { closed };
}

// ---------------------------------------------------------------------------
// Inatividade: taxa de manutenção do cadastro (R$ 100/mês) para voltar a captar
// ---------------------------------------------------------------------------
async function activateByFee(db: Database, partnerId: string, period: string) {
  await db.update(partners).set({ status: "ACTIVE", feePaidPeriod: period }).where(and(eq(partners.id, partnerId), ne(partners.status, "SUSPENDED")));
}

/** Fatura Pix da NextLevel (PARTNER_FEE) para reativar no mês corrente; ao pagar, os links voltam sozinhos. */
export async function ensureReactivationInvoice(db: Database, actor: Actor, now = new Date()) {
  const p = await partnerOfActor(db, actor);
  if (p.status === "SUSPENDED") throw new DomainError("PARTNER_SUSPENDED", "Seu cadastro está suspenso. Fale com a NextLevel.");
  if (p.status === "ACTIVE") throw new DomainError("PARTNER_ACTIVE", "Seu cadastro já está ativo.");
  const s = await getPartnerSettings(db);
  const period = periodOf(now);
  const dedupeKey = `PARTNERFEE:${p.id}:${period}`;
  const existing = await db.query.financeInvoices.findFirst({ where: eq(financeInvoices.dedupeKey, dedupeKey) });
  if (existing && existing.status === "OPEN") return { invoiceId: existing.id, amountCents: existing.amountCents };
  if (existing) throw new DomainError("FEE_PAID", "A taxa deste mês já foi paga.");
  const id = newId("fin");
  const due = new Date(now.getTime() + 3 * DAY).toISOString();
  await db.insert(financeInvoices).values({ id, dedupeKey, payerType: "PARTNER", partnerId: p.id, kind: "PARTNER_FEE", period, description: `Reativação do cadastro de parceiro · ${period}`, amountCents: s.inactiveFeeCents, lines: [{ kind: "PARTNER_FEE", description: `Manutenção do cadastro ${period}`, amountCents: s.inactiveFeeCents }], status: "OPEN", dueDate: due });
  return { invoiceId: id, amountCents: s.inactiveFeeCents };
}

/** Alternativa à fatura: abate a taxa do saldo disponível. */
export async function reactivateFromBalance(db: Database, actor: Actor, now = new Date()) {
  const p = await partnerOfActor(db, actor);
  if (p.status !== "INACTIVE") throw new DomainError("PARTNER_STATE", p.status === "ACTIVE" ? "Seu cadastro já está ativo." : "Cadastro suspenso.");
  const s = await getPartnerSettings(db);
  const bal = await balances(db, p.id);
  if (bal.availableCents < s.inactiveFeeCents) throw new DomainError("BALANCE", "Saldo disponível insuficiente para abater a taxa.");
  const period = periodOf(now);
  if (!(await insertEntry(db, { partnerId: p.id, kind: "FEE", amountCents: -s.inactiveFeeCents, period, status: "AVAILABLE", availableAt: now.toISOString(), note: `Taxa de reativação ${period}`, dedupeKey: `FEE:${p.id}:${period}` }))) throw new DomainError("FEE_PAID", "A taxa deste mês já foi paga.");
  await activateByFee(db, p.id, period);
}

// ---------------------------------------------------------------------------
// Saldos, extrato e saques
// ---------------------------------------------------------------------------
export async function balances(db: Database, partnerId: string) {
  const rows = await db.select({ status: partnerCommissions.status, kind: partnerCommissions.kind, sum: sql<number>`coalesce(sum(${partnerCommissions.amountCents}), 0)::int` }).from(partnerCommissions).where(eq(partnerCommissions.partnerId, partnerId)).groupBy(partnerCommissions.status, partnerCommissions.kind);
  const sum = (f: (r: (typeof rows)[number]) => boolean) => rows.filter(f).reduce((t, r) => t + Number(r.sum), 0);
  const paidOut = (await db.select({ s: sql<number>`coalesce(sum(${partnerPayouts.amountCents}), 0)::int` }).from(partnerPayouts).where(and(eq(partnerPayouts.partnerId, partnerId), eq(partnerPayouts.status, "PAID"))))[0]!.s;
  return { pendingCents: sum((r) => r.status === "PENDING"), availableCents: sum((r) => r.status === "AVAILABLE"), paidCents: Number(paidOut) };
}

export async function ledger(db: Database, actor: Actor, opts: { limit?: number } = {}) {
  const p = await partnerOfActor(db, actor);
  const rows = await db.select().from(partnerCommissions).where(eq(partnerCommissions.partnerId, p.id)).orderBy(desc(partnerCommissions.createdAt)).limit(opts.limit ?? 100);
  const ids = [...new Set(rows.map((r) => r.storeId).filter((x): x is string => !!x))];
  const st = ids.length ? await db.select({ id: stores.id, name: stores.name }).from(stores).where(inArray(stores.id, ids)) : [];
  return rows.map((r) => ({ ...r, storeMasked: r.storeId ? maskName(st.find((s) => s.id === r.storeId)?.name ?? "") : null }));
}

/** Nome da loja mascarado para o parceiro: mostra só o início e o fim. */
export const maskName = (name: string) => (name.length <= 3 ? `${name[0] ?? ""}**` : `${name.slice(0, 2)}${"*".repeat(Math.min(name.length - 3, 8))}${name.slice(-1)}`);

export async function savePartnerProfile(db: Database, actor: Actor, input: { phone?: string; pixKey?: string; displayName?: string }) {
  const p = await partnerOfActor(db, actor);
  const patch: Partial<typeof partners.$inferInsert> = {};
  if (input.phone !== undefined) { const d = input.phone.replace(/\D/g, ""); if (d.length < 10 || d.length > 13) throw new DomainError("PHONE", "WhatsApp inválido (com DDD)."); patch.phone = d; }
  if (input.displayName !== undefined) patch.displayName = z.string().trim().min(3).max(120).parse(input.displayName);
  if (input.pixKey !== undefined) patch.pixKeyEnc = input.pixKey.trim() ? encryptSecret(z.string().trim().max(140).parse(input.pixKey)) : null;
  if (Object.keys(patch).length) await db.update(partners).set(patch).where(eq(partners.id, p.id));
}

export const pixKeyOf = (p: { pixKeyEnc: string | null }) => decryptSecret(p.pixKeyEnc);

/** Pede o saque do saldo disponível: mínimo, 1 por semana, Pix do mesmo CPF/CNPJ. O valor sai do saldo na hora (reserva). */
export async function requestPayout(db: Database, actor: Actor, opts: { ownerConfirmed: boolean }, now = new Date()) {
  const p = await partnerOfActor(db, actor);
  if (p.status === "SUSPENDED") throw new DomainError("PARTNER_SUSPENDED", "Cadastro suspenso.");
  const s = await getPartnerSettings(db);
  const pix = pixKeyOf(p);
  if (!pix) throw new DomainError("PIX_KEY", "Cadastre a sua chave Pix no perfil.");
  if (!opts.ownerConfirmed) throw new DomainError("PIX_OWNER", "Confirme que a chave Pix é do mesmo CPF/CNPJ do cadastro.");
  const since = new Date(now.getTime() - 7 * DAY).toISOString();
  const recent = (await db.select({ n: count() }).from(partnerPayouts).where(and(eq(partnerPayouts.partnerId, p.id), ne(partnerPayouts.status, "REJECTED"), gte(partnerPayouts.requestedAt, since))))[0]!.n;
  if (recent >= s.payoutsPerWeek) throw new DomainError("PAYOUT_LIMIT", `Limite de ${s.payoutsPerWeek} pedido(s) de saque por semana.`);
  const id = newId("ppo");
  await db.transaction(async (tx) => {
    const bal = await balances(tx, p.id);
    if (bal.availableCents < Math.max(s.minPayoutCents, 1)) throw new DomainError("PAYOUT_MIN", `O saque mínimo é R$ ${(s.minPayoutCents / 100).toFixed(2).replace(".", ",")}. Saldo disponível: R$ ${(bal.availableCents / 100).toFixed(2).replace(".", ",")}.`);
    await tx.insert(partnerPayouts).values({ id, partnerId: p.id, requestedAt: now.toISOString(), amountCents: bal.availableCents, pixKeySnapshot: encryptSecret(pix) });
    await insertEntry(tx, { partnerId: p.id, payoutId: id, kind: "PAYOUT", amountCents: -bal.availableCents, period: periodOf(now), status: "AVAILABLE", availableAt: now.toISOString(), note: "Saque solicitado", dedupeKey: `PAYOUT:${id}` });
  });
  await emitEvent(db, { type: "PARTNER_PAYOUT_REQUESTED", actorRole: "AFFILIATE", payload: { partnerId: p.id, payoutId: id } });
  return { id };
}

export async function listPayouts(db: Database, actor: Actor) {
  const p = await partnerOfActor(db, actor);
  return db.select({ id: partnerPayouts.id, amountCents: partnerPayouts.amountCents, status: partnerPayouts.status, requestedAt: partnerPayouts.requestedAt, paidAt: partnerPayouts.paidAt, receiptNote: partnerPayouts.receiptNote }).from(partnerPayouts).where(eq(partnerPayouts.partnerId, p.id)).orderBy(desc(partnerPayouts.requestedAt));
}

const need = (actor: Actor) => { if (!isMaster(actor)) throw new ForbiddenError("Apenas a NextLevel."); };

export async function decidePayout(db: Database, actor: Actor, payoutId: string, decision: "APPROVE" | "PAY" | "REJECT", note?: string, now = new Date()) {
  need(actor);
  const po = await db.query.partnerPayouts.findFirst({ where: eq(partnerPayouts.id, payoutId) });
  if (!po) throw new NotFoundError("Saque não encontrado.");
  const t = now.toISOString();
  if (decision === "APPROVE") {
    if (po.status !== "REQUESTED") throw new DomainError("PAYOUT_STATE", "Este saque não está aguardando aprovação.");
    await db.update(partnerPayouts).set({ status: "APPROVED", decidedBy: actor.userId, decidedAt: t }).where(eq(partnerPayouts.id, po.id));
  } else if (decision === "PAY") {
    if (po.status !== "APPROVED" && po.status !== "REQUESTED") throw new DomainError("PAYOUT_STATE", "Este saque não pode ser marcado como pago.");
    if (!note?.trim()) throw new DomainError("RECEIPT", "Informe o comprovante ou a observação do pagamento.");
    await db.update(partnerPayouts).set({ status: "PAID", paidAt: t, decidedBy: actor.userId, decidedAt: po.decidedAt ?? t, receiptNote: note.trim().slice(0, 300) }).where(eq(partnerPayouts.id, po.id));
  } else {
    if (po.status === "PAID" || po.status === "REJECTED") throw new DomainError("PAYOUT_STATE", "Este saque já foi encerrado.");
    if (!note?.trim()) throw new DomainError("REASON", "Informe o motivo da recusa.");
    await db.update(partnerPayouts).set({ status: "REJECTED", decidedBy: actor.userId, decidedAt: t, receiptNote: note.trim().slice(0, 300) }).where(eq(partnerPayouts.id, po.id));
    await insertEntry(db, { partnerId: po.partnerId, payoutId: po.id, kind: "PAYOUT_REVERSAL", amountCents: po.amountCents, period: periodOf(now), status: "AVAILABLE", availableAt: t, note: "Saque recusado: valor devolvido ao saldo", dedupeKey: `PAYOUTREV:${po.id}` });
  }
  if (decision === "PAY") {
    const owner = await db.query.users.findFirst({ where: eq(users.id, (await db.query.partners.findFirst({ where: eq(partners.id, po.partnerId) }))!.userId) });
    if (owner) await sendEmail(db, { kind: "PAYOUT_PAID", to: owner.email, ...emails.payoutPaid((po.amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })) });
  }
  await emitEvent(db, { type: `PARTNER_PAYOUT_${decision}`, actorRole: actor.role, payload: { payoutId, partnerId: po.partnerId } });
}

// ---------------------------------------------------------------------------
// Escritório virtual: indicadores
// ---------------------------------------------------------------------------
export type StageKey = "SIGNUP" | "TRIAL" | "PAID" | "BLOCKED" | "CANCELED";
export const STAGE_LABEL: Record<StageKey, string> = { SIGNUP: "Cadastro", TRIAL: "Em teste", PAID: "Pagante", BLOCKED: "Bloqueado", CANCELED: "Cancelado" };

export async function partnerReferrals(db: Database, actor: Actor, now = new Date()) {
  const p = await partnerOfActor(db, actor);
  const rows = await db.select().from(stores).where(eq(stores.partnerId, p.id)).orderBy(desc(stores.attributedAt));
  const comm = await db.select({ storeId: partnerCommissions.storeId, sum: sql<number>`coalesce(sum(${partnerCommissions.amountCents}), 0)::int` }).from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, p.id), inArray(partnerCommissions.kind, ["SETUP", "MAINTENANCE", "ADJUSTMENT", "CLAWBACK"]), ne(partnerCommissions.status, "VOID"))).groupBy(partnerCommissions.storeId);
  const converted = new Set((await db.select({ storeId: partnerCommissions.storeId }).from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, p.id), eq(partnerCommissions.kind, "SETUP"), ne(partnerCommissions.status, "VOID")))).map((r) => r.storeId));
  return rows.map((s) => {
    const acc = storeAccess(s, now);
    const stage: StageKey = s.status === "CLOSED" ? "CANCELED" : converted.has(s.id) ? (acc.state === "BLOCKED" ? "BLOCKED" : "PAID") : acc.state === "TRIAL" ? "TRIAL" : acc.state === "BLOCKED" ? "BLOCKED" : "SIGNUP";
    return { storeId: s.id, nameMasked: converted.has(s.id) ? maskName(s.name) : maskName(s.name), stage, via: s.attributedVia, at: s.attributedAt, commissionCents: Number(comm.find((c) => c.storeId === s.id)?.sum ?? 0), flagged: !!s.attributionFlag };
  });
}

export async function partnerDashboard(db: Database, actor: Actor, now = new Date()) {
  const p = await partnerOfActor(db, actor);
  const s = await getPartnerSettings(db);
  const period = periodOf(now);
  const { start, end } = periodBounds(period);
  const links = await db.select({ id: partnerLinks.id }).from(partnerLinks).where(eq(partnerLinks.partnerId, p.id));
  const clicks = links.length ? (await db.select({ n: count() }).from(partnerClicks).where(and(inArray(partnerClicks.linkId, links.map((l) => l.id)), gte(partnerClicks.at, start.toISOString()), lt(partnerClicks.at, end.toISOString()))))[0]!.n : 0;
  const refs = await partnerReferrals(db, actor, now);
  const inMonth = refs.filter((r) => r.at && new Date(r.at) >= start && new Date(r.at) < end);
  const activations = await activationsInPeriod(db, p.id, period);
  const monthCommission = (await db.select({ s: sql<number>`coalesce(sum(${partnerCommissions.amountCents}), 0)::int` }).from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, p.id), eq(partnerCommissions.period, period), inArray(partnerCommissions.kind, ["SETUP", "MAINTENANCE", "ADJUSTMENT", "CLAWBACK"]), ne(partnerCommissions.status, "VOID"))))[0]!.s;
  const daily = await db.select({ day: sql<string>`to_char(${partnerCommissions.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`, sum: sql<number>`coalesce(sum(${partnerCommissions.amountCents}), 0)::int` }).from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, p.id), eq(partnerCommissions.period, period), inArray(partnerCommissions.kind, ["SETUP", "MAINTENANCE", "ADJUSTMENT", "CLAWBACK"]), ne(partnerCommissions.status, "VOID"))).groupBy(sql`to_char(${partnerCommissions.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`).orderBy(sql`to_char(${partnerCommissions.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`);
  return {
    partner: { id: p.id, code: p.code, displayName: p.displayName, status: p.status, feePaidPeriod: p.feePaidPeriod },
    settings: s, period, monthEnd: new Date(end.getTime() - 1).toISOString(),
    funnel: { clicks, signups: inMonth.length, trials: inMonth.filter((r) => r.stage === "TRIAL").length, activations },
    tier: tierFor(activations, s), goalMet: activations >= s.monthlyGoal, monthCommissionCents: Number(monthCommission),
    balances: await balances(db, p.id),
    daily: daily.map((d) => ({ day: d.day, cents: Number(d.sum) })),
  };
}

// ---------------------------------------------------------------------------
// Master
// ---------------------------------------------------------------------------
export async function listPartners(db: Database, actor: Actor, now = new Date()) {
  need(actor);
  const list = await db.select().from(partners).orderBy(desc(partners.createdAt));
  const period = periodOf(now);
  const out = [];
  for (const p of list) {
    const b = await balances(db, p.id);
    const refs = (await db.select({ n: count() }).from(stores).where(eq(stores.partnerId, p.id)))[0]!.n;
    const flagged = (await db.select({ n: count() }).from(stores).where(and(eq(stores.partnerId, p.id), eq(stores.attributionFlag, "FRAUD_REVIEW"))))[0]!.n;
    out.push({ ...p, pixKeyEnc: undefined, activationsMonth: await activationsInPeriod(db, p.id, period), referrals: refs, flagged, ...b });
  }
  return out;
}

export async function getPartnerForMaster(db: Database, actor: Actor, partnerId: string) {
  need(actor);
  const p = await db.query.partners.findFirst({ where: eq(partners.id, partnerId) });
  if (!p) throw new NotFoundError("Parceiro não encontrado.");
  const [entries, payouts, refs, months] = await Promise.all([
    db.select().from(partnerCommissions).where(eq(partnerCommissions.partnerId, p.id)).orderBy(desc(partnerCommissions.createdAt)).limit(200),
    db.select().from(partnerPayouts).where(eq(partnerPayouts.partnerId, p.id)).orderBy(desc(partnerPayouts.requestedAt)),
    db.select({ id: stores.id, name: stores.name, via: stores.attributedVia, at: stores.attributedAt, flag: stores.attributionFlag }).from(stores).where(eq(stores.partnerId, p.id)),
    db.select().from(partnerMonthStatus).where(eq(partnerMonthStatus.partnerId, p.id)).orderBy(desc(partnerMonthStatus.period)),
  ]);
  const owner = await db.query.users.findFirst({ where: eq(users.id, p.userId) });
  return { partner: { ...p, pixKeyEnc: undefined, hasPix: !!p.pixKeyEnc, email: owner?.email ?? "" }, entries, payouts, referrals: refs, months, balances: await balances(db, p.id) };
}

export async function setPartnerStatus(db: Database, actor: Actor, partnerId: string, status: "ACTIVE" | "INACTIVE" | "SUSPENDED", reason: string) {
  need(actor);
  if (!reason.trim()) throw new DomainError("REASON", "Informe o motivo.");
  const p = await db.query.partners.findFirst({ where: eq(partners.id, partnerId) });
  if (!p) throw new NotFoundError("Parceiro não encontrado.");
  await db.update(partners).set({ status }).where(eq(partners.id, p.id));
  await emitEvent(db, { type: "PARTNER_STATUS_CHANGED", actorRole: actor.role, payload: { partnerId, from: p.status, to: status, reason: reason.trim().slice(0, 200) } });
}

/** Ajuste manual (positivo ou negativo) com motivo; entra no saldo disponível. */
export async function adjustCommission(db: Database, actor: Actor, partnerId: string, amountCents: number, reason: string, now = new Date()) {
  need(actor);
  if (!Number.isInteger(amountCents) || amountCents === 0) throw new DomainError("AMOUNT", "Informe um valor diferente de zero.");
  if (!reason.trim()) throw new DomainError("REASON", "Informe o motivo do ajuste.");
  const p = await db.query.partners.findFirst({ where: eq(partners.id, partnerId) });
  if (!p) throw new NotFoundError("Parceiro não encontrado.");
  const id = newId("pcm");
  await insertEntry(db, { partnerId, kind: "MANUAL", amountCents, period: periodOf(now), status: "AVAILABLE", availableAt: now.toISOString(), note: reason.trim().slice(0, 200), dedupeKey: `MANUAL:${id}` });
  await emitEvent(db, { type: "PARTNER_MANUAL_ADJUSTMENT", actorRole: actor.role, payload: { partnerId, amountCents, reason: reason.trim().slice(0, 200) } });
}

export async function payoutQueue(db: Database, actor: Actor) {
  need(actor);
  const rows = await db.select({ po: partnerPayouts, name: partners.displayName, code: partners.code, taxId: partners.taxId }).from(partnerPayouts).innerJoin(partners, eq(partners.id, partnerPayouts.partnerId)).orderBy(desc(partnerPayouts.requestedAt));
  return rows.map((r) => ({ ...r.po, pixKeySnapshot: decryptSecret(r.po.pixKeySnapshot) ?? "", partnerName: r.name, partnerCode: r.code, taxId: r.taxId }));
}

/** Lojas indicadas marcadas como autoindicação: sem comissão até o Master decidir. */
export async function fraudQueue(db: Database, actor: Actor) {
  need(actor);
  return db.select({ storeId: stores.id, storeName: stores.name, partnerId: partners.id, partnerName: partners.displayName, at: stores.attributedAt }).from(stores).innerJoin(partners, eq(partners.id, stores.partnerId)).where(eq(stores.attributionFlag, "FRAUD_REVIEW"));
}

/** Decide a revisão: liberar (remove a marca; as próximas faturas passam a comissionar) ou manter sem comissão. */
export async function reviewAttribution(db: Database, actor: Actor, storeId: string, release: boolean) {
  need(actor);
  if (release) await db.update(stores).set({ attributionFlag: null }).where(eq(stores.id, storeId));
  else await db.update(stores).set({ partnerId: null, attributedVia: null, attributedAt: null, attributionFlag: null }).where(eq(stores.id, storeId));
  await emitEvent(db, { type: "PARTNER_ATTRIBUTION_REVIEWED", actorRole: actor.role, storeId, payload: { release } });
}

export async function partnersCsv(db: Database, actor: Actor, period: string) {
  need(actor);
  const list = await db.select().from(partners);
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [["codigo", "nome", "status", "ativacoes_mes", "comissao_setup_centavos", "comissao_manutencao_centavos", "ajustes_centavos"].join(",")];
  for (const p of list) {
    const rows = await db.select({ kind: partnerCommissions.kind, sum: sql<number>`coalesce(sum(${partnerCommissions.amountCents}), 0)::int` }).from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, p.id), eq(partnerCommissions.period, period), ne(partnerCommissions.status, "VOID"))).groupBy(partnerCommissions.kind);
    const g = (k: string) => Number(rows.find((r) => r.kind === k)?.sum ?? 0);
    lines.push([q(p.code), q(p.displayName), q(p.status), await activationsInPeriod(db, p.id, period), g("SETUP"), g("MAINTENANCE"), g("ADJUSTMENT") + g("CLAWBACK") + g("MANUAL")].join(","));
  }
  return lines.join("\n");
}

export async function runDailyPartnerJobs(db: Database, now = new Date()) {
  const released = await releaseCommissions(db, now);
  let closed = 0;
  if (now.getUTCDate() === 1) { const prev = periodOf(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))); closed = (await closePartnerMonth(db, prev, now)).closed; }
  return { released, closed };
}
