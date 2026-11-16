import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { coupons, financeInvoices, organizations, partners, stores, suppliers, trialClaims, users, type InvoiceLine, type Store } from "@/db/schema";
import { BRAND_CODES, closedCommerceBrandCodes } from "@/lib/brand";
import { OFFER_KEYS } from "@/lib/finance/price-book";
import { hashPassword } from "@/lib/security/password";
import { createStore } from "./provisioning";
import { newId } from "@/lib/ids";
import { isMaster, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { emitEvent } from "./events";
import { getPriceBook } from "./finance";
import { supplierOfStore } from "./nextlevel-billing";
import { attributeStore } from "./partners";
import { isClosedCommerceSupplier } from "./bras/fronteira";
import { activeDoor, creditPlanCashback, doorFields, doorPlanPrice, repriceOpenSetup, type EntrySnapshot } from "./precos/porta-entrada";
import { inTreatment } from "./experimentos";

/**
 * Regra de acesso da loja (teste de 7 dias e assinatura).
 * - Sem `trialEndsAt` e sem `paidUntil`: sem regra (contas antigas e de demonstração) → FREE.
 * - `paidUntil` no futuro → PAID. `trialEndsAt` no futuro → TRIAL. Senão → BLOCKED (só a tela de pagamento).
 * - Loja que entrou pela porta de entrada (D126, `entryOffer`): no lugar do bloqueio cai no plano grátis → GRATIS
 *   (continua vendendo e paga a taxa do grátis sobre a venda).
 */
export type AccessState = "FREE" | "TRIAL" | "PAID" | "BLOCKED" | "GRATIS";
export type StoreAccess = { state: AccessState; endsAt: Date | null; daysLeft: number | null };
type AccessFields = Pick<Store, "trialEndsAt" | "paidUntil"> & { entryOffer?: Store["entryOffer"] };

const DAY = 86_400_000;
export function storeAccess(store: AccessFields, now = new Date()): StoreAccess {
  const paid = store.paidUntil ? new Date(store.paidUntil) : null;
  const trial = store.trialEndsAt ? new Date(store.trialEndsAt) : null;
  if (paid && paid > now) return { state: "PAID", endsAt: paid, daysLeft: Math.ceil((paid.getTime() - now.getTime()) / DAY) };
  if (trial && trial > now && !paid) return { state: "TRIAL", endsAt: trial, daysLeft: Math.ceil((trial.getTime() - now.getTime()) / DAY) };
  if (!paid && !trial) return { state: "FREE", endsAt: null, daysLeft: null };
  if (store.entryOffer) return { state: "GRATIS", endsAt: null, daysLeft: null };
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
  if (c.partnerId) { const p = await db.query.partners.findFirst({ where: eq(partners.id, c.partnerId) }); if (!p || p.status !== "ACTIVE") throw new DomainError("COUPON_PAUSED", "Este cupom está pausado."); }
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
  if (coupon.supplierId && (await supplierOfStore(db, store.id)) !== coupon.supplierId) throw new DomainError("COUPON_SUPPLIER", "Este cupom é de outro fornecedor.");
  const claimed = await db.query.trialClaims.findFirst({ where: eq(trialClaims.taxId, taxId) });
  if (claimed) throw new DomainError("TRIAL_USED", "Este CPF/CNPJ já usou o teste gratuito.");
  // Porta de entrada do SuperDrop ligada (D126): teste reverso da porta no lugar dos dias do cupom.
  const door = (await activeDoor(db, "SUPERDROP", now)) && (await inTreatment(db, "PORTA_SUPERDROP", store.id, now)) ? await activeDoor(db, "SUPERDROP", now) : null;
  const ends = new Date(now.getTime() + (door ? door.trialDays : coupon.trialDays) * DAY);
  await db.transaction(async (tx) => {
    await tx.insert(trialClaims).values({ taxId, storeId: store.id, couponId: coupon.id });
    await tx.update(stores).set({ trialEndsAt: ends.toISOString(), couponId: coupon.id, taxId, updatedAt: now.toISOString(), ...(door ? doorFields(door, now) : {}) }).where(eq(stores.id, store.id));
    await tx.update(coupons).set({ redemptions: sql`${coupons.redemptions} + 1` }).where(eq(coupons.id, coupon.id));
  });
  if (door) await repriceOpenSetup(db, store.id, store.offer, door);
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

/**
 * Fatura aberta para liberar a loja por Pix. Se a loja ainda deve a ativação (setup + primeira mensalidade),
 * é essa a cobrança (uma só). Senão, gera a mensalidade: preço de lista × meses, idempotente por loja, ciclo e mês.
 */
export async function ensurePlanInvoice(db: Database, store: Store, months: PlanMonths = 1, now = new Date()) {
  // Loja Commerce com assinatura (D90): valor e ciclo vêm da assinatura (plano congelado + oferta de entrada).
  const { ensureSubscriptionInvoice } = await import("./commerce-plans");
  const sub = await ensureSubscriptionInvoice(db, store, now);
  if (sub) return sub;
  const setup = await db.query.financeInvoices.findFirst({ where: and(eq(financeInvoices.storeId, store.id), eq(financeInvoices.kind, "STORE_SETUP"), eq(financeInvoices.status, "OPEN")) });
  if (setup) return { invoiceId: setup.id, amountCents: setup.amountCents, description: setup.description, includesSetup: true };
  const book = await getPriceBook(db);
  const offer = book.offers[store.offer];
  // Anual da porta de entrada (D126): "pague N, leve 12" (faturas de plano são só Pix).
  const promo = months === 12 ? (store.entryOffer as EntrySnapshot | null)?.annualPromo : null;
  // Experimento com os preços da Proposta (D140): a mensalidade congelada na loja vale no lugar da tabela de hoje.
  const monthly = doorPlanPrice(store.entryOffer, store.offer)?.monthlyCents ?? offer.monthlyCents;
  const amount = monthly * (promo ? promo.paidMonths : months);
  const dedupeKey = `STORE_PLAN:${store.id}:${store.offer}:${months}:${now.toISOString().slice(0, 7)}`;
  const existing = await db.query.financeInvoices.findFirst({ where: eq(financeInvoices.dedupeKey, dedupeKey) });
  if (existing && existing.status === "OPEN") return { invoiceId: existing.id, amountCents: existing.amountCents, description: existing.description, includesSetup: false };
  const key = existing ? `${dedupeKey}:${now.getTime()}` : dedupeKey;
  const id = newId("fin");
  const description = `Plano ${offer.name} · ${PLAN_CYCLES[months]}`;
  const lines: InvoiceLine[] = [{ kind: "STORE_PLAN", description: `${offer.name} · ${months} ${months === 1 ? "mês" : "meses"}${promo ? ` (pague ${promo.paidMonths}, leve 12 no Pix)` : ""}`, amountCents: amount }];
  await db.insert(financeInvoices).values({ id, dedupeKey: key, payerType: "STORE", supplierId: await supplierOfStore(db, store.id), storeId: store.id, kind: "STORE_PLAN", description, amountCents: amount, lines, status: "OPEN", dueDate: new Date(now.getTime() + 3 * DAY).toISOString() });
  return { invoiceId: id, amountCents: amount, description, includesSetup: false };
}

/** Soma meses de acesso pago (a partir de hoje ou do fim atual) e reativa a loja. */
export async function grantPlanMonths(db: Database, storeId: string, months: number, invoice: { id: string; supplierId: string | null }, now = new Date()) {
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  if (!store) return;
  const base = store.paidUntil && new Date(store.paidUntil) > now ? new Date(store.paidUntil) : now;
  const until = new Date(base); until.setUTCMonth(until.getUTCMonth() + months);
  await db.update(stores).set({ paidUntil: until.toISOString(), status: store.status === "PENDING_PAYMENT" ? "ACTIVE" : store.status, updatedAt: now.toISOString() }).where(eq(stores.id, store.id));
  await emitEvent(db, { type: "PLAN_PAID", supplierId: invoice.supplierId, storeId: store.id, payload: { months, until: until.toISOString(), invoiceId: invoice.id }, dedupeKey: `PLAN_PAID:${invoice.id}` });
}

/** Chamado quando a fatura é paga: mensalidade soma os meses contratados; ativação (setup) soma o primeiro mês. */
export async function fulfillPlanInvoice(db: Database, inv: typeof financeInvoices.$inferSelect, now = new Date()) {
  if (!inv.storeId) return;
  if (inv.dedupeKey.startsWith("NLSUB:")) { const { onSubscriptionInvoicePaid } = await import("./commerce-plans"); await onSubscriptionInvoicePaid(db, inv, now); return; }
  if (inv.kind === "STORE_PLAN") await grantPlanMonths(db, inv.storeId, Number(inv.dedupeKey.split(":")[3]) || 1, inv, now);
  else if (inv.kind === "STORE_SETUP") await grantPlanMonths(db, inv.storeId, 1, inv, now);
  await creditPlanCashback(db, inv, now);
}

export const isBlocked = (store: AccessFields, now = new Date()) => storeAccess(store, now).state === "BLOCKED";

// ---------------------------------------------------------------------------
// Cadastro público: com cupom inicia o teste de 7 dias; sem cupom vai direto ao pagamento do plano
// ---------------------------------------------------------------------------
export const signupSchema = z.object({
  storeName: z.string().min(2, "Informe o nome da loja"),
  ownerName: z.string().min(2, "Informe o seu nome"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres"),
  taxId: z.string().min(11, "Informe o CPF ou CNPJ"),
  code: z.string().optional(),
  supplierSlug: z.string().optional(),
  /** Código do parceiro (link `/r/...`, cookie `nl-ref`). O cupom de parceiro tem prioridade sobre ele. */
  ref: z.string().max(40).optional(),
  /** Marca do endereço em que o cadastro foi feito. */
  brand: z.enum(BRAND_CODES).optional(),
  offer: z.enum(OFFER_KEYS).default("STORE_SUBDOMAIN"),
  /** Loja independente da NextLevel Commerce (D89): abre sem fornecedor e sem rede, dona do próprio catálogo. */
  independent: z.boolean().default(false),
  /** Plano Commerce escolhido no cadastro (D90). Só para loja independente com os planos novos ligados. */
  plan: z.enum(["COMMERCE_START", "COMMERCE_PRO", "COMMERCE_SCALE"]).optional(),
  cycle: z.enum(["MONTHLY", "ANNUAL"]).default("MONTHLY"),
  /** "Como você conheceu a NextLevel?" (D303): opcional; vai só para a origem do contato, nunca para a loja. */
  conheceuPor: z.string().max(20).optional(),
});

/** Fornecedores que aceitam novos membros (página pública ativa). Importadoras de marca fechada (Brás Digital) nunca entram na lista pública. */
export async function listSignupSuppliers(db: Database) {
  const closed = closedCommerceBrandCodes();
  const rows = await db.select({ slug: suppliers.slug, name: suppliers.name, status: suppliers.status, brand: organizations.brand }).from(suppliers)
    .innerJoin(organizations, eq(organizations.id, suppliers.organizationId)).where(eq(suppliers.hidden, false));
  return rows.filter((r) => (r.status === "ACTIVE" || r.status === "WARNING") && !closed.includes(r.brand)).map((r) => ({ slug: r.slug, name: r.name }));
}

/** Dias inteiros de teste que restam (arredonda para cima; zero quando não há teste ou já acabou). */
export function diasDeTeste(trialEndsAt: string | null, agora = new Date()): number {
  if (!trialEndsAt) return 0;
  return Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - agora.getTime()) / 86_400_000));
}

export async function signupMember(db: Database, raw: z.input<typeof signupSchema>, now = new Date()) {
  const input = signupSchema.parse(raw);
  const taxId = normalizeTaxId(input.taxId);
  const code = input.code?.trim();
  let supplierId: string;
  const independent = input.independent;
  const chooseSupplier = async () => {
    const sup = input.supplierSlug ? await db.query.suppliers.findFirst({ where: eq(suppliers.slug, input.supplierSlug) }) : null;
    if (!sup || sup.status === "SUSPENDED" || sup.status === "CLOSED") throw new DomainError("SUPPLIER", "Escolha o fornecedor que vai abastecer a sua loja.");
    return sup.id;
  };
  if (code) {
    const coupon = await findUsableCoupon(db, code);
    if (await db.query.trialClaims.findFirst({ where: eq(trialClaims.taxId, taxId) })) throw new DomainError("TRIAL_USED", "Este CPF/CNPJ já usou o teste gratuito.");
    if (independent && coupon.supplierId) throw new DomainError("COUPON_SUPPLIER", "Este cupom vale só para lojas de um fornecedor.");
    // Cupom de fornecedor define o fornecedor; cupom de parceiro deixa o cliente escolher.
    supplierId = independent ? "" : (coupon.supplierId ?? (await chooseSupplier()));
  } else if (independent) {
    supplierId = "";
  } else {
    const sup = input.supplierSlug ? await db.query.suppliers.findFirst({ where: eq(suppliers.slug, input.supplierSlug) }) : null;
    if (!sup || sup.status === "SUSPENDED" || sup.status === "CLOSED") throw new DomainError("SUPPLIER", "Escolha o fornecedor que vai abastecer a sua loja.");
    supplierId = sup.id;
  }
  // Importadora de marca fechada (Brás Digital) não abastece loja aberta por cadastro público: mesma resposta de fornecedor inválido, sem revelar que existe.
  if (!independent && (await isClosedCommerceSupplier(db, supplierId))) throw new DomainError("SUPPLIER", "Escolha o fornecedor que vai abastecer a sua loja.");
  if (independent && (await db.query.users.findFirst({ where: eq(users.email, input.email.toLowerCase()) }))) throw new DomainError("EMAIL_TAKEN", "Já existe um usuário com este e-mail.");
  // Loja independente da NextLevel Commerce (D89): sem fornecedor e sem rede.
  const created = await createStore(db, independent ? null : supplierId, { name: input.storeName, offer: input.offer, ownerName: input.ownerName, ownerEmail: input.email, brand: input.brand });
  if (independent) await db.update(stores).set({ kind: "SUPPLIER_OWN" }).where(eq(stores.id, created.storeId));
  const user = await db.query.users.findFirst({ where: eq(users.email, input.email.toLowerCase()) });
  if (!user) throw new NotFoundError("Usuário não encontrado.");
  await db.update(users).set({ passwordHash: hashPassword(input.password), mustChangePassword: false }).where(eq(users.id, user.id));
  await db.update(stores).set({ status: "ACTIVE", taxId }).where(eq(stores.id, created.storeId));
  await attributeStore(db, { storeId: created.storeId, taxId, email: input.email, couponCode: code, refCode: input.ref, now });
  // Commerce com planos (D90): a assinatura decide o acesso (oferta de entrada: 3 dias grátis, taxa zero da plataforma; sem 1º mês especial desde D233).
  const { finFlag } = await import("@/lib/finance/flags");
  if (independent && finFlag("FIN_COMMERCE_PLANS")) {
    const { startCommerceSubscription } = await import("./commerce-plans");
    const sub = await startCommerceSubscription(db, { storeId: created.storeId, productKey: input.plan ?? "COMMERCE_START", cycle: input.cycle, taxId, now });
    return { storeId: created.storeId, userId: user.id, slug: created.slug, trial: sub.trial };
  }
  if (code) await startTrial(db, { storeId: created.storeId, code, taxId, now });
  else {
    // Porta do SuperDrop ligada (D126): sem cupom também entra pelo teste reverso (um por CPF/CNPJ).
    const door = (await activeDoor(db, "SUPERDROP", now)) && (await inTreatment(db, "PORTA_SUPERDROP", created.storeId, now)) ? await activeDoor(db, "SUPERDROP", now) : null;
    const claimed = door ? await db.insert(trialClaims).values({ taxId, storeId: created.storeId }).onConflictDoNothing().returning({ taxId: trialClaims.taxId }) : [];
    if (door && claimed.length) {
      await db.update(stores).set({ trialEndsAt: new Date(now.getTime() + door.trialDays * DAY).toISOString(), ...doorFields(door, now) }).where(eq(stores.id, created.storeId));
      const st = await db.query.stores.findFirst({ where: eq(stores.id, created.storeId), columns: { offer: true } });
      if (st) await repriceOpenSetup(db, created.storeId, st.offer, door);
      return { storeId: created.storeId, userId: user.id, slug: created.slug, trial: door.trialDays > 0 };
    }
    // Sem cupom: o acesso já nasce pendente de pagamento e o painel abre direto no checkout Pix.
    await db.update(stores).set({ trialEndsAt: new Date(now.getTime() - 1000).toISOString() }).where(eq(stores.id, created.storeId));
  }
  return { storeId: created.storeId, userId: user.id, slug: created.slug, trial: !!code };
}

/** Avisa por e-mail os donos de lojas cujo teste termina em até 2 dias (uma vez por loja). */
export async function runTrialReminders(db: Database, now = new Date()): Promise<{ sent: number }> {
  const { notifyTenant, emails } = await import("@/lib/email");
  const soon = new Date(now.getTime() + 2 * DAY).toISOString();
  const rows = await db.select().from(stores).where(and(sql`${stores.trialEndsAt} is not null`, sql`${stores.trialEndsAt} > ${now.toISOString()}`, sql`${stores.trialEndsAt} <= ${soon}`));
  let sent = 0;
  for (const s of rows) {
    if (s.paidUntil && new Date(s.paidUntil) > now) continue;
    const days = Math.max(0, Math.ceil((new Date(s.trialEndsAt!).getTime() - now.getTime()) / DAY));
    sent += await notifyTenant(db, { storeId: s.id }, { kind: "TRIAL_ENDING", dedupeKey: `TRIAL_END:${s.id}`, ...emails.trialEnding(days, "/merchant") });
  }
  return { sent };
}
