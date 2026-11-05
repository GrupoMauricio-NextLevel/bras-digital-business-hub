import { requireMasterFn } from "./access";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { commissionRules, corporateOrders, partnerCommissions, partnerLeads, partners, platformSettings, stores, users, type CatalogFamily, type PriceCycle } from "@/db/schema";
import { newId } from "@/lib/ids";
import { commissionOf } from "@/lib/finance/partner-rules";
import type { Actor } from "./access";
import { ForbiddenError } from "./errors";
import { CORPORATE, recordFinancialAudit } from "./fin-audit";
import { periodOf } from "./finance";
import { seededOnce } from "./nl-catalog";

/**
 * Comissão de parceiro sobre vendas do catálogo Master (D90). Regras versionadas em `commission_rules`;
 * lançamentos no livro-razão imutável `partner_commissions` (tipos SALE e RECURRING).
 *
 * base comissionável = valor efetivamente recebido − imposto − taxa do gateway
 *   (o desconto já está fora porque o recebido é o valor com desconto; estorno/chargeback revogam ou lançam débito).
 * Nunca entra: verba de mídia (não passa pela NextLevel), domínio de terceiros, taxa de gateway, estorno.
 */
const DAY = 86_400_000;
const FIN_KEY = "finance_settings";
export type FinanceSettings = { taxBps: number };

export async function getFinanceSettings(db: Database): Promise<FinanceSettings> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, FIN_KEY) });
  const v = row?.value as Partial<FinanceSettings> | undefined;
  return { taxBps: Number.isInteger(v?.taxBps) && v!.taxBps! >= 0 && v!.taxBps! <= 3000 ? v!.taxBps! : 0 };
}

export async function saveFinanceSettings(db: Database, actor: Actor, s: FinanceSettings) {
  requireMasterFn(actor, ["FINANCEIRO"]);
  const before = await getFinanceSettings(db);
  await db.insert(platformSettings).values({ key: FIN_KEY, value: s, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value: s, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "FINANCE_SETTINGS", entityType: "platform_settings", entityId: FIN_KEY, before, after: s });
}

export function commissionBase(paidCents: number, feeCents: number | null, taxBps: number) {
  return Math.max(0, paidCents - (feeCents ?? 0) - Math.round((paidCents * taxBps) / 10_000));
}

type Rule = typeof commissionRules.$inferSelect;

/** Regra mais específica e vigente: produto > família; ciclo e tipo de parceiro exatos > genéricos; última versão. */
export async function findRule(db: Database, input: { family: CatalogFamily; productKey: string; cycle: PriceCycle; partnerKind: string; at?: Date }): Promise<Rule | null> {
  await seededOnce(db);
  const at = (input.at ?? new Date()).toISOString();
  const rows = (await db.select().from(commissionRules).where(eq(commissionRules.family, input.family)).orderBy(desc(commissionRules.version))).filter((r) => r.effectiveFrom <= at);
  const latest = new Map<string, Rule>();
  for (const r of rows) if (!latest.has(r.key)) latest.set(r.key, r);
  const candidates = [...latest.values()].filter((r) => r.active && (!r.productKey || r.productKey === input.productKey) && (!r.cycle || r.cycle === input.cycle) && (!r.partnerKind || r.partnerKind === input.partnerKind));
  const score = (r: Rule) => (r.productKey ? 4 : 0) + (r.cycle ? 2 : 0) + (r.partnerKind ? 1 : 0);
  return candidates.sort((a, b) => score(b) - score(a))[0] ?? null;
}

// ---------------------------------------------------------------------------
// Atribuição (último toque não direto, com proteção da loja e do lead já registrados)
// ---------------------------------------------------------------------------
export type Attribution = { partnerId: string; via: "STORE" | "LEAD" | "LINK"; flagged: boolean } | null;

/**
 * Prioridade: (1) loja já atribuída a um parceiro (nunca muda); (2) lead registrado no CRM de um parceiro pelo e-mail;
 * (3) último toque não direto (código do link/cookie) dentro da janela. Autoindicação (mesmo CPF/CNPJ, mesmo usuário
 * ou mesmo e-mail do parceiro) é marcada e não comissiona.
 */
export async function resolveAttribution(db: Database, input: { storeId?: string | null; buyerEmail: string; buyerTaxId?: string | null; buyerUserId?: string | null; refCode?: string | null }): Promise<Attribution> {
  let partnerId: string | null = null; let via: "STORE" | "LEAD" | "LINK" | null = null;
  if (input.storeId) {
    const s = await db.query.stores.findFirst({ where: eq(stores.id, input.storeId) });
    if (s?.partnerId) { partnerId = s.partnerId; via = "STORE"; if (s.attributionFlag) return { partnerId, via, flagged: true }; }
  }
  if (!partnerId) {
    const lead = await db.query.partnerLeads.findFirst({ where: eq(partnerLeads.email, input.buyerEmail.toLowerCase()) });
    if (lead) { partnerId = lead.partnerId; via = "LEAD"; }
  }
  if (!partnerId && input.refCode) {
    const p = await db.query.partners.findFirst({ where: eq(partners.code, input.refCode.trim().toUpperCase()) });
    if (p) { partnerId = p.id; via = "LINK"; }
  }
  if (!partnerId || !via) return null;
  const p = await db.query.partners.findFirst({ where: eq(partners.id, partnerId) });
  if (!p || p.status === "SUSPENDED") return null;
  const owner = await db.query.users.findFirst({ where: eq(users.id, p.userId) });
  const flagged = (!!input.buyerTaxId && p.taxId === input.buyerTaxId) || (!!input.buyerUserId && p.userId === input.buyerUserId) || owner?.email.toLowerCase() === input.buyerEmail.toLowerCase();
  return { partnerId, via, flagged };
}

// ---------------------------------------------------------------------------
// Lançamentos
// ---------------------------------------------------------------------------
export type CommissionInput = {
  partnerId: string; family: CatalogFamily; productKey: string; cycle: PriceCycle;
  /** 1 = primeiro pagamento; 2.. = recorrências do mesmo cliente. */
  paymentIndex: number;
  paidCents: number; feeCents: number | null;
  storeId?: string | null; orderId?: string | null; invoiceId?: string | null; dedupeKey: string; now?: Date;
};

/** Lança a comissão (PENDENTE em carência). Idempotente pela chave. Devolve null quando não há regra ou não cabe. */
export async function recordSaleCommission(db: Database, c: CommissionInput) {
  const now = c.now ?? new Date();
  const p = await db.query.partners.findFirst({ where: eq(partners.id, c.partnerId) });
  if (!p || p.status === "SUSPENDED") return null;
  const rule = await findRule(db, { family: c.family, productKey: c.productKey, cycle: c.cycle, partnerKind: p.kind, at: now });
  if (!rule) return null;
  const first = c.paymentIndex <= 1;
  if (!first && c.paymentIndex > 1 + rule.recurringMonths) return null;
  // D226: durante a Black, a 1ª cobrança de plano da E-commerce paga 100% de uma mensalidade ao parceiro.
  let bps = first ? rule.firstBps : rule.recurringBps;
  if (first && c.family === "COMMERCE_PLAN") {
    const { blackAgora } = await import("./campanha-black");
    if ((await blackAgora(db, now)).ativa) { const { bpsPrimeiraNaBlack } = await import("@/lib/finance/revisao-d226"); bps = bpsPrimeiraNaBlack(c.cycle, rule.recurringBps); }
  }
  if (bps <= 0) return null;
  const { taxBps } = await getFinanceSettings(db);
  const base = commissionBase(c.paidCents, c.feeCents, taxBps);
  const amount = commissionOf(base, bps);
  if (amount <= 0) return null;
  const id = newId("pcm");
  const r = await db.insert(partnerCommissions).values({ id, partnerId: p.id, storeId: c.storeId ?? null, invoiceId: c.invoiceId ?? null, orderId: c.orderId ?? null, ruleId: rule.id, kind: first ? "SALE" : "RECURRING", baseCents: base, rateBps: bps, amountCents: amount, period: periodOf(now), status: "PENDING", availableAt: new Date(now.getTime() + rule.holdDays * DAY).toISOString(), note: `${c.productKey} · regra ${rule.key} v${rule.version}`, dedupeKey: c.dedupeKey }).onConflictDoNothing().returning({ id: partnerCommissions.id });
  if (!r.length) return null;
  await recordFinancialAudit(db, null, { domain: CORPORATE, action: "COMMISSION_ACCRUED", entityType: "partner_commission", entityId: id, partnerId: p.id, storeId: c.storeId ?? null, after: { productKey: c.productKey, baseCents: base, rateBps: bps, amountCents: amount, rule: `${rule.key} v${rule.version}`, holdDays: rule.holdDays } });
  return { id, amountCents: amount, baseCents: base, bps, holdDays: rule.holdDays };
}

/** Estorno/chargeback/cancelamento de um pedido: anula o que está em carência; o que já foi liberado vira débito. */
export async function clawbackOrder(db: Database, orderId: string, reason: string, now = new Date()) {
  const rows = await db.select().from(partnerCommissions).where(and(eq(partnerCommissions.orderId, orderId), inArray(partnerCommissions.kind, ["SALE", "RECURRING"]), ne(partnerCommissions.status, "VOID")));
  let voided = 0, debited = 0;
  for (const r of rows) {
    if (r.status === "PENDING") { await db.update(partnerCommissions).set({ status: "VOID", note: `${r.note ?? ""} · ${reason}` }).where(and(eq(partnerCommissions.id, r.id), eq(partnerCommissions.status, "PENDING"))); voided++; }
    else {
      const ok = await db.insert(partnerCommissions).values({ id: newId("pcm"), partnerId: r.partnerId, storeId: r.storeId, orderId, refId: r.id, kind: "CLAWBACK", amountCents: -r.amountCents, period: periodOf(now), status: "AVAILABLE", availableAt: now.toISOString(), note: reason, dedupeKey: `CLAWBACK:${r.id}` }).onConflictDoNothing().returning({ id: partnerCommissions.id });
      if (ok.length) debited++;
    }
  }
  if (voided || debited) await recordFinancialAudit(db, null, { domain: CORPORATE, action: "COMMISSION_CLAWBACK", entityType: "corporate_order", entityId: orderId, after: { voided, debited }, reason });
  return { voided, debited };
}

// ---------------------------------------------------------------------------
// Extrato do parceiro (só dele)
// ---------------------------------------------------------------------------
export type StatementState = "pendente" | "em_carencia" | "liberada" | "paga" | "cancelada";
export const STATEMENT_LABEL: Record<StatementState, string> = { pendente: "Pendente", em_carencia: "Em carência", liberada: "Liberada", paga: "Paga", cancelada: "Cancelada/estornada" };

export async function partnerStatement(db: Database, actor: Actor, now = new Date()) {
  if (actor.role !== "AFFILIATE") throw new ForbiddenError("Extrato disponível só para o parceiro.");
  const p = await db.query.partners.findFirst({ where: eq(partners.userId, actor.userId) });
  if (!p) throw new ForbiddenError();
  const entries = await db.select().from(partnerCommissions).where(eq(partnerCommissions.partnerId, p.id)).orderBy(desc(partnerCommissions.createdAt)).limit(300);
  const pendingOrders = await db.select({ id: corporateOrders.id, code: corporateOrders.code, totalCents: corporateOrders.totalCents, createdAt: corporateOrders.createdAt, product: corporateOrders.snapshot }).from(corporateOrders).where(and(eq(corporateOrders.partnerId, p.id), eq(corporateOrders.status, "PENDING_PAYMENT"))).orderBy(desc(corporateOrders.createdAt)).limit(50);
  const stateOf = (e: typeof entries[number]): StatementState => e.status === "VOID" || e.kind === "CLAWBACK" ? "cancelada" : e.status === "PAID" || e.kind === "PAYOUT" ? "paga" : e.status === "AVAILABLE" ? "liberada" : "em_carencia";
  const rows = entries.map((e) => ({ id: e.id, kind: e.kind, state: stateOf(e), amountCents: e.amountCents, baseCents: e.baseCents, rateBps: e.rateBps, availableAt: e.availableAt, note: e.note, createdAt: e.createdAt }));
  const sum = (s: StatementState) => rows.filter((r) => r.state === s && r.kind !== "PAYOUT").reduce((t, r) => t + r.amountCents, 0);
  return {
    partner: { id: p.id, code: p.code, kind: p.kind, displayName: p.displayName },
    totals: { em_carencia: sum("em_carencia"), liberada: sum("liberada"), paga: sum("paga"), cancelada: sum("cancelada") },
    pending: pendingOrders.map((o) => ({ code: o.code, totalCents: o.totalCents, createdAt: o.createdAt, productName: o.product.productName })),
    rows,
    now: now.toISOString(),
  };
}

/** Contagem de pagamentos já feitos para a mesma assinatura (para saber se é a 1ª ou a n-ésima). */
export async function paidCountForSubscription(db: Database, storeId: string) {
  const r = (await db.execute(sql`select count(*)::int as n from finance_invoices where store_id = ${storeId} and dedupe_key like 'NLSUB:%' and status = 'PAID'`)) as { rows: { n: number }[] };
  return r.rows[0]?.n ?? 0;
}
