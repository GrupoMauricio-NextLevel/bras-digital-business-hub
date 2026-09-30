import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { coupons, financeInvoices, stores, trialClaims, users, type Store } from "@/db/schema";
import { OFFER_KEYS } from "@/lib/finance/price-book";
import { hashPassword } from "@/lib/security/password";
import { createStore } from "./provisioning";
import { newId } from "@/lib/ids";
import { isMaster, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { emitEvent } from "./events";
import { getPriceBook } from "./finance";
import { supplierOfStore } from "./nextlevel-billing";

/**
 * Regra de acesso da loja (teste de 7 dias e assinatura).
 * - Sem `trialEndsAt` e sem `paidUntil`: sem regra (contas antigas e de demonstração) → FREE.
 * - `paidUntil` no futuro → PAID. `trialEndsAt` no futuro → TRIAL. Senão → BLOCKED (só a tela de pagamento).
 */
export type AccessState = "FREE" | "TRIAL" | "PAID" | "BLOCKED";
export type StoreAccess = { state: AccessState; endsAt: Date | null; daysLeft: number | null };

const DAY = 86_400_000;
export function storeAccess(store: Pick<Store, "trialEndsAt" | "paidUntil">, now = new Date()): StoreAccess {
  const paid = store.paidUntil ? new Date(store.paidUntil) : null;
  const trial = store.trialEndsAt ? new Date(store.trialEndsAt) : null;
  if (paid && paid > now) return { state: "PAID", endsAt: paid, daysLeft: Math.ceil((paid.getTime() - now.getTime()) / DAY) };
  if (trial && trial > now && !paid) return { state: "TRIAL", endsAt: trial, daysLeft: Math.ceil((trial.getTime() - now.getTime()) / DAY) };
  if (!paid && !trial) return { state: "FREE", endsAt: null, daysLeft: null };
  return { state: "BLOCKED", endsAt: paid ?? trial, daysLeft: 0 };
}

/** CPF ou CNPJ válido (dígitos verificadores). Devolve só os dígitos ou lança. */
export function normalizeTaxId(raw: string): string {
  const d = raw.replace(/\D/g, "");
  const cpf = (s: string) => { if (/^(\d)\1+$/.test(s)) return false; const calc = (n: number) => { let sum = 0; for (let i = 0; i < n; i++) sum += Number(s[i]) * (n + 1 - i); const r = (sum * 10) % 11; return r === 10 ? 0 : r; }; return calc(9) === Number(s[9]) && calc(10) === Number(s[10]); };
  const cnpj = (s: string) => { if (/^(\d)\1+$/.test(s)) return false; const calc = (n: number) => { const w = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; let sum = 0; for (let i = 0; i < n; i++) sum += Number(s[i]) * w[i]!; const r = sum % 11; return r < 2 ? 0 : 11 - r; }; return calc(12) === Number(s[12]) && calc(13) === Number(s[13]); };
  if ((d.length === 11 && cpf(d)) || (d.length === 14 && cnpj(d))) return d;
  throw new DomainError("TAX_ID", "CPF ou CNPJ inválido.");
}

// ---------------------------------------------------------------------------
// Cupons e teste
// ---------------------------------------------------------------------------
export async function createCoupon(db: Database, actor: Actor, input: { code: string; supplierId?: string; trialDays?: number; maxRedemptions?: number | null }) {
  const supplierId = isMaster(actor) ? input.supplierId : actor.role === "SUPPLIER_ADMIN" ? actor.supplierId : null;
  if (!supplierId) throw new ForbiddenError("Só o Master ou o fornecedor criam cupons.");
  if (actor.role === "SUPPLIER_ADMIN" && input.supplierId && input.supplierId !== actor.supplierId) throw new ForbiddenError("Cupom de outro fornecedor.");
  const code = input.code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) throw new DomainError("COUPON", "Use de 3 a 24 letras, números, - ou _.");
  const exists = await db.query.coupons.findFirst({ where: eq(coupons.code, code) });
  if (exists) throw new DomainError("COUPON_TAKEN", "Este cupom já existe.");
  const id = newId("cpn");
  await db.insert(coupons).values({ id, code, supplierId, trialDays: Math.min(Math.max(input.trialDays ?? 7, 1), 60), maxRedemptions: input.maxRedemptions ?? null });
  return { couponId: id, code };
}

/** Valida o cupom sem consumir (usado no cadastro para mostrar de quem é). */
export async function findUsableCoupon(db: Database, rawCode: string) {
  const c = await db.query.coupons.findFirst({ where: eq(coupons.code, rawCode.trim().toUpperCase()) });
  if (!c || !c.active) throw new DomainError("COUPON_INVALID", "Cupom inválido.");
  if (c.maxRedemptions !== null && c.redemptions >= c.maxRedemptions) throw new DomainError("COUPON_EXHAUSTED", "Este cupom atingiu o limite de usos.");
  return c;
}

/** Inicia o teste da loja com cupom: 1 por CPF/CNPJ, atribuído ao fornecedor do cupom. */
export async function startTrial(db: Database, input: { storeId: string; code: string; taxId: string; now?: Date }) {
  const now = input.now ?? new Date();
  const taxId = normalizeTaxId(input.taxId);
  const coupon = await findUsableCoupon(db, input.code);
  const store = await db.query.stores.findFirst({ where: eq(stores.id, input.storeId) });
  if (!store) throw new NotFoundError("Loja não encontrada.");
  if (store.trialEndsAt || store.paidUntil) throw new DomainError("TRIAL_ALREADY", "Esta loja já tem teste ou assinatura.");
  if ((await supplierOfStore(db, store.id)) !== coupon.supplierId) throw new DomainError("COUPON_SUPPLIER", "Este cupom é de outro fornecedor.");
  const claimed = await db.query.trialClaims.findFirst({ where: eq(trialClaims.taxId, taxId) });
  if (claimed) throw new DomainError("TRIAL_USED", "Este CPF/CNPJ já usou o teste gratuito.");
  const ends = new Date(now.getTime() + coupon.trialDays * DAY);
  await db.transaction(async (tx) => {
    await tx.insert(trialClaims).values({ taxId, storeId: store.id, couponId: coupon.id });
    await tx.update(stores).set({ trialEndsAt: ends.toISOString(), couponId: coupon.id, taxId, updatedAt: now.toISOString() }).where(eq(stores.id, store.id));
    await tx.update(coupons).set({ redemptions: sql`${coupons.redemptions} + 1` }).where(eq(coupons.id, coupon.id));
  });
  await emitEvent(db, { type: "TRIAL_STARTED", supplierId: coupon.supplierId, storeId: store.id, payload: { code: coupon.code, endsAt: ends.toISOString() }, dedupeKey: `TRIAL_STARTED:${store.id}` });
  return { trialEndsAt: ends };
}

/** Prorroga o teste (Master ou o fornecedor da loja). */
export async function extendTrial(db: Database, actor: Actor, storeId: string, days: number, now = new Date()) {
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  if (!store) throw new NotFoundError("Loja não encontrada.");
  const supplierId = await supplierOfStore(db, storeId);
  if (!isMaster(actor) && !(actor.role === "SUPPLIER_ADMIN" && actor.supplierId === supplierId)) throw new ForbiddenError("Sem permissão para prorrogar este teste.");
  if (!store.trialEndsAt) throw new DomainError("NO_TRIAL", "Esta loja não está em teste.");
  const d = Math.min(Math.max(Math.trunc(days), 1), 30);
  const base = new Date(store.trialEndsAt) > now ? new Date(store.trialEndsAt) : now;
  const ends = new Date(base.getTime() + d * DAY);
  await db.update(stores).set({ trialEndsAt: ends.toISOString(), updatedAt: now.toISOString() }).where(eq(stores.id, storeId));
  await emitEvent(db, { type: "TRIAL_EXTENDED", supplierId, storeId, actorRole: actor.role, payload: { days: d, endsAt: ends.toISOString() } });
  return { trialEndsAt: ends };
}

// ---------------------------------------------------------------------------
// Assinatura da loja: fatura de plano por Pix; ao pagar libera o acesso sozinho
// ---------------------------------------------------------------------------
export const PLAN_CYCLES = { 1: "mensal", 6: "semestral", 12: "anual" } as const;
export type PlanMonths = keyof typeof PLAN_CYCLES;

/** Fatura aberta do plano (idempotente por loja, ciclo e mês). Preço de lista × meses, Pix. */
export async function ensurePlanInvoice(db: Database, store: Store, months: PlanMonths = 1, now = new Date()) {
  const book = await getPriceBook(db);
  const offer = book.offers[store.offer];
  const amount = offer.monthlyCents * months;
  const dedupeKey = `STORE_PLAN:${store.id}:${store.offer}:${months}:${now.toISOString().slice(0, 7)}`;
  const existing = await db.query.financeInvoices.findFirst({ where: eq(financeInvoices.dedupeKey, dedupeKey) });
  if (existing && existing.status === "OPEN") return { invoiceId: existing.id, amountCents: existing.amountCents, description: existing.description };
  const key = existing ? `${dedupeKey}:${now.getTime()}` : dedupeKey;
  const id = newId("fin");
  const description = `Plano ${offer.name} · ${PLAN_CYCLES[months]}`;
  const due = new Date(now.getTime() + 3 * DAY);
  await db.insert(financeInvoices).values({ id, dedupeKey: key, payerType: "STORE", supplierId: await supplierOfStore(db, store.id), storeId: store.id, kind: "STORE_PLAN", description, amountCents: amount, lines: [{ kind: "STORE_PLAN", description: `${offer.name} · ${months} ${months === 1 ? "mês" : "meses"}`, amountCents: amount }], status: "OPEN", dueDate: due.toISOString() });
  return { invoiceId: id, amountCents: amount, description };
}

/** Chamado quando a fatura do plano é paga: soma os meses a partir de hoje (ou do fim atual) e reativa a loja. */
export async function fulfillPlanInvoice(db: Database, inv: typeof financeInvoices.$inferSelect, now = new Date()) {
  if (inv.kind !== "STORE_PLAN" || !inv.storeId) return;
  const months = Number(inv.dedupeKey.split(":")[3]) || 1;
  const store = await db.query.stores.findFirst({ where: eq(stores.id, inv.storeId) });
  if (!store) return;
  const base = store.paidUntil && new Date(store.paidUntil) > now ? new Date(store.paidUntil) : now;
  const until = new Date(base); until.setUTCMonth(until.getUTCMonth() + months);
  await db.update(stores).set({ paidUntil: until.toISOString(), status: store.status === "PENDING_PAYMENT" ? store.status : "ACTIVE", updatedAt: now.toISOString() }).where(eq(stores.id, store.id));
  await emitEvent(db, { type: "PLAN_PAID", supplierId: inv.supplierId, storeId: store.id, payload: { months, until: until.toISOString(), invoiceId: inv.id }, dedupeKey: `PLAN_PAID:${inv.id}` });
}

export const isBlocked = (store: Pick<Store, "trialEndsAt" | "paidUntil">, now = new Date()) => storeAccess(store, now).state === "BLOCKED";

// ---------------------------------------------------------------------------
// Cadastro público com cupom: cria a loja na rede do fornecedor do cupom e já inicia o teste
// ---------------------------------------------------------------------------
export const signupSchema = z.object({
  storeName: z.string().min(2, "Informe o nome da loja"),
  ownerName: z.string().min(2, "Informe o seu nome"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres"),
  taxId: z.string().min(11, "Informe o CPF ou CNPJ"),
  code: z.string().min(3, "Informe o cupom"),
  offer: z.enum(OFFER_KEYS).default("STORE_SUBDOMAIN"),
});

export async function signupWithCoupon(db: Database, raw: z.input<typeof signupSchema>, now = new Date()) {
  const input = signupSchema.parse(raw);
  const taxId = normalizeTaxId(input.taxId);
  const coupon = await findUsableCoupon(db, input.code);
  if (await db.query.trialClaims.findFirst({ where: eq(trialClaims.taxId, taxId) })) throw new DomainError("TRIAL_USED", "Este CPF/CNPJ já usou o teste gratuito.");
  const created = await createStore(db, coupon.supplierId, { name: input.storeName, offer: input.offer, ownerName: input.ownerName, ownerEmail: input.email });
  const user = await db.query.users.findFirst({ where: eq(users.email, input.email.toLowerCase()) });
  if (!user) throw new NotFoundError("Usuário não encontrado.");
  // Durante o teste tudo é liberado: a loja nasce ativa e o dono escolhe a própria senha.
  await db.update(users).set({ passwordHash: hashPassword(input.password), mustChangePassword: false }).where(eq(users.id, user.id));
  await db.update(stores).set({ status: "ACTIVE" }).where(eq(stores.id, created.storeId));
  await startTrial(db, { storeId: created.storeId, code: coupon.code, taxId, now });
  return { storeId: created.storeId, userId: user.id, slug: created.slug };
}
