import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { brandLeads, corporateOrders, corporateQuotes, nlSubscriptions, PARTNER_KINDS, PARTNER_LEAD_STAGES, partnerLeads, partners, QUOTE_STATUSES, stores, users, type PartnerLeadStage, type QuoteStatus } from "@/db/schema";
import { newId } from "@/lib/ids";
import { emails, sendEmail } from "@/lib/email";
import { isMaster, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { CORPORATE, recordFinancialAudit } from "./fin-audit";
import { getCatalogItem, listCatalog } from "./nl-catalog";

/**
 * Vendas consultivas da NextLevel (D90): propostas de produtos sob consulta, diagnóstico gratuito (porta de entrada
 * da Nextlevel Soluções) e CRM do parceiro. `nextlevel_corporate_finance`: o parceiro vê só os próprios leads.
 */
const requireMaster = (actor: Actor) => { if (!isMaster(actor)) throw new ForbiddenError("Apenas a NextLevel."); };

// ---------------------------------------------------------------------------
// Diagnóstico gratuito (público)
// ---------------------------------------------------------------------------
export const DIAGNOSTIC_NEEDS = {
  CRIAR_LOJA: "Criar minha loja virtual",
  MIGRAR: "Trazer minha loja de outra plataforma",
  LOJA_PRONTA: "Quero a loja montada pela equipe",
  TEMA: "Melhorar o visual da loja",
  TRAFEGO: "Anúncios (Meta, Google, Mercado Livre)",
  REDES: "Conteúdo para redes sociais",
  CONSULTORIA: "Entender por que não vendo mais",
  SUPERDROP: "Vender sem estoque (SuperDrop)",
  FORNECEDOR: "Sou fornecedor e quero lojistas vendendo meus produtos",
  WHITE_LABEL: "Revender a plataforma com a minha marca",
} as const;
export type DiagnosticNeed = keyof typeof DIAGNOSTIC_NEEDS;

/** Roteamento por necessidade: qual solução apresentar primeiro. */
export const NEED_ROUTE: Record<DiagnosticNeed, { label: string; href: string }> = {
  CRIAR_LOJA: { label: "Planos Commerce", href: "/solucoes/commerce-start" },
  MIGRAR: { label: "Migração", href: "/solucoes/migracao-lite" },
  LOJA_PRONTA: { label: "Loja Pronta", href: "/solucoes/loja-pronta-essencial" },
  TEMA: { label: "Temas", href: "/temas" },
  TRAFEGO: { label: "Gestão de tráfego", href: "/solucoes/meta-ads" },
  REDES: { label: "Gestão de redes sociais", href: "/solucoes/gestao-redes-sociais" },
  CONSULTORIA: { label: "Consultoria de crescimento", href: "/solucoes/consultoria-crescimento" },
  SUPERDROP: { label: "SuperDrop", href: "/solucoes#superdrop" },
  FORNECEDOR: { label: "SuperDrop para fornecedores", href: "/seja-fornecedor" },
  WHITE_LABEL: { label: "White Label", href: "/solucoes/white-label" },
};

export const diagnosticSchema = z.object({
  name: z.string().trim().min(3, "Informe o seu nome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(160),
  phone: z.string().transform((v) => v.replace(/\D/g, "")).refine((d) => d.length >= 10 && d.length <= 13, "WhatsApp inválido (com DDD)"),
  company: z.string().trim().max(120).optional(),
  stage: z.enum(["IDEIA", "COMECANDO", "VENDENDO", "ESCALANDO"]),
  needs: z.array(z.enum(Object.keys(DIAGNOSTIC_NEEDS) as [DiagnosticNeed, ...DiagnosticNeed[]])).min(1, "Marque pelo menos uma necessidade").max(6),
  message: z.string().trim().max(600).optional(),
  consent: z.literal(true, { error: "É preciso concordar com o contato" }),
});
const ATTR_KEYS = ["ref", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "page", "intent"] as const;
const cleanAttribution = (a: Record<string, string> | undefined) => Object.fromEntries(Object.entries(a ?? {}).filter(([k, v]) => (ATTR_KEYS as readonly string[]).includes(k) && typeof v === "string" && v.length <= 120).map(([k, v]) => [k, v.replace(/[^\w\-./ :]/g, "")]));

/** Pedido de diagnóstico: vira interessado da marca NextLevel (CRM do Master) e, se veio de parceiro, lead dele. */
export async function requestDiagnostic(db: Database, raw: z.input<typeof diagnosticSchema>, attribution?: Record<string, string>) {
  const input = diagnosticSchema.parse(raw);
  const attr = cleanAttribution(attribution);
  const ref = attr.ref?.toUpperCase() ?? null;
  const message = [`Momento: ${input.stage}`, ...input.needs.map((n) => `• ${DIAGNOSTIC_NEEDS[n]}`), input.message ?? ""].filter(Boolean).join("\n").slice(0, 600);
  const existing = await db.query.brandLeads.findFirst({ where: and(eq(brandLeads.brand, "NEXTLEVEL"), eq(brandLeads.email, input.email), eq(brandLeads.kind, "DIAGNOSTIC")) });
  let id = existing?.id ?? newId("bld");
  if (existing) await db.update(brandLeads).set({ name: input.name, phone: input.phone, storeName: input.company ?? existing.storeName, message, needs: input.needs, attribution: { ...existing.attribution, ...attr }, updatedAt: new Date().toISOString() }).where(eq(brandLeads.id, existing.id));
  else {
    await db.insert(brandLeads).values({ id, brand: "NEXTLEVEL", kind: "DIAGNOSTIC", name: input.name, email: input.email, phone: input.phone, storeName: input.company ?? null, segment: input.stage, message, needs: input.needs, attribution: attr, affiliateRef: ref });
    await sendEmail(db, { kind: "DIAGNOSTIC_RECEIVED", to: input.email, brand: "NEXTLEVEL", dedupeKey: `DIAG:${id}`, ...emails.leadReceived(input.name.split(" ")[0]!) });
  }
  // Parceiro de origem: o lead entra no CRM dele (se ninguém registrou antes: proteção do lead já registrado).
  if (ref) {
    const p = await db.query.partners.findFirst({ where: eq(partners.code, ref) });
    if (p && p.status !== "SUSPENDED") await db.insert(partnerLeads).values({ id: newId("pld"), partnerId: p.id, name: input.name, email: input.email, phone: input.phone, company: input.company ?? null, stage: "NEW", notes: `Diagnóstico pelo site: ${input.needs.map((n) => DIAGNOSTIC_NEEDS[n]).join(", ")}` }).onConflictDoNothing();
  }
  id = existing?.id ?? id;
  return { id, routes: input.needs.map((n) => NEED_ROUTE[n]) };
}

// ---------------------------------------------------------------------------
// Propostas (produtos sob consulta)
// ---------------------------------------------------------------------------
export const quoteRequestSchema = z.object({
  productKey: z.string().min(3).max(40),
  briefing: z.string().trim().min(10, "Conte em poucas linhas o que você precisa").max(2000),
  contact: z.object({ name: z.string().trim().min(3).max(120), email: z.string().trim().toLowerCase().email(), phone: z.string().trim().max(20).optional() }).optional(),
});

/** Pedido de proposta (lojista, fornecedor, parceiro para um lead, ou visitante). Nunca gera cobrança. */
export async function requestQuote(db: Database, actor: Actor | null, raw: z.input<typeof quoteRequestSchema>, attribution?: Record<string, string>) {
  const input = quoteRequestSchema.parse(raw);
  const p = await getCatalogItem(db, { key: input.productKey });
  if (!p) throw new NotFoundError("Produto não encontrado.");
  let requesterType: "STORE" | "SUPPLIER" | "PARTNER" | "GUEST" = "GUEST"; let storeId: string | null = null; let supplierId: string | null = null; let partnerId: string | null = null;
  let contact = input.contact;
  if (actor?.role === "STORE_OWNER" && actor.storeId) { requesterType = "STORE"; storeId = actor.storeId; }
  else if (actor?.role === "SUPPLIER_ADMIN" && actor.supplierId) { requesterType = "SUPPLIER"; supplierId = actor.supplierId; }
  else if (actor?.role === "AFFILIATE") { requesterType = "PARTNER"; partnerId = (await db.query.partners.findFirst({ where: eq(partners.userId, actor.userId) }))?.id ?? null; }
  if (actor && requesterType !== "GUEST" && !contact) { const u = await db.query.users.findFirst({ where: eq(users.id, actor.userId) }); if (u) contact = { name: u.name, email: u.email }; }
  if (!contact) throw new DomainError("CONTACT", "Informe nome e e-mail para receber a proposta.");
  if (requesterType === "PARTNER" && !input.contact) throw new DomainError("CONTACT", "Informe os dados do cliente da proposta.");
  if (!partnerId && attribution?.ref) partnerId = (await db.query.partners.findFirst({ where: eq(partners.code, attribution.ref.toUpperCase()) }))?.id ?? null;
  const open = await db.select({ id: corporateQuotes.id }).from(corporateQuotes).where(and(eq(corporateQuotes.productId, p.id), eq(corporateQuotes.contactEmail, contact.email), inArray(corporateQuotes.status, ["REQUESTED", "DRAFTING", "SENT"]))).limit(1);
  if (open[0]) return { id: open[0].id, created: false };
  const id = newId("cqt");
  await db.insert(corporateQuotes).values({ id, productId: p.id, requesterType, storeId, supplierId, partnerId, contactName: contact.name, contactEmail: contact.email, contactPhone: contact.phone ?? null, briefing: input.briefing, attribution: cleanAttribution(attribution) });
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "QUOTE_REQUESTED", entityType: "corporate_quote", entityId: id, storeId, supplierId, partnerId, after: { productKey: p.key } });
  return { id, created: true };
}

export async function listQuotes(db: Database, actor: Actor) {
  if (isMaster(actor)) return db.select().from(corporateQuotes).orderBy(desc(corporateQuotes.createdAt)).limit(300);
  if (actor.role === "STORE_OWNER" && actor.storeId) return db.select().from(corporateQuotes).where(eq(corporateQuotes.storeId, actor.storeId)).orderBy(desc(corporateQuotes.createdAt));
  if (actor.role === "SUPPLIER_ADMIN" && actor.supplierId) return db.select().from(corporateQuotes).where(eq(corporateQuotes.supplierId, actor.supplierId)).orderBy(desc(corporateQuotes.createdAt));
  if (actor.role === "AFFILIATE") { const p = await db.query.partners.findFirst({ where: eq(partners.userId, actor.userId) }); return p ? db.select().from(corporateQuotes).where(eq(corporateQuotes.partnerId, p.id)).orderBy(desc(corporateQuotes.createdAt)) : []; }
  return [];
}

const quoteUpdateSchema = z.object({
  status: z.enum(QUOTE_STATUSES).optional(),
  items: z.array(z.object({ description: z.string().trim().min(2).max(200), amountCents: z.number().int().min(0).max(100_000_000) })).max(20).optional(),
  discountCents: z.number().int().min(0).max(100_000_000).optional(),
  terms: z.string().trim().max(2000).optional(),
  validUntil: z.string().datetime().nullable().optional(),
});

/** Master monta e envia a proposta (itens, desconto, validade, termos). Valores ficam congelados ao enviar. */
export async function updateQuote(db: Database, actor: Actor, id: string, raw: z.input<typeof quoteUpdateSchema>) {
  requireMaster(actor);
  const patch = quoteUpdateSchema.parse(raw);
  const q = await db.query.corporateQuotes.findFirst({ where: eq(corporateQuotes.id, id) });
  if (!q) throw new NotFoundError("Proposta não encontrada.");
  if (["ACCEPTED", "CONVERTED"].includes(q.status) && (patch.items || patch.discountCents !== undefined)) throw new DomainError("QUOTE_LOCKED", "Proposta aceita não muda de valor.");
  const items = patch.items ?? q.items;
  const discount = patch.discountCents ?? q.discountCents;
  const subtotal = items.reduce((s, i) => s + i.amountCents, 0);
  if (discount > subtotal) throw new DomainError("DISCOUNT", "Desconto maior que o total.");
  const status: QuoteStatus = patch.status ?? q.status;
  if (status === "SENT" && !items.length) throw new DomainError("QUOTE_EMPTY", "Inclua os itens antes de enviar.");
  await db.update(corporateQuotes).set({ status, items, discountCents: discount, totalCents: items.length ? subtotal - discount : null, terms: patch.terms ?? q.terms, validUntil: patch.validUntil === undefined ? q.validUntil : patch.validUntil, updatedAt: new Date().toISOString() }).where(eq(corporateQuotes.id, id));
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "QUOTE_UPDATED", entityType: "corporate_quote", entityId: id, before: { status: q.status, totalCents: q.totalCents }, after: { status, totalCents: items.length ? subtotal - discount : null } });
  if (status === "SENT" && q.status !== "SENT") await sendEmail(db, { kind: "QUOTE_SENT", to: q.contactEmail, brand: "NEXTLEVEL", dedupeKey: `QUOTE_SENT:${id}`, subject: "Sua proposta da NextLevel está pronta", text: `Olá, ${q.contactName.split(" ")[0]}! Preparamos a proposta que você pediu. Total: R$ ${((subtotal - discount) / 100).toFixed(2).replace(".", ",")}. A equipe NextLevel vai combinar com você o aceite e a forma de pagamento.` });
}

// ---------------------------------------------------------------------------
// CRM do parceiro (só os próprios leads)
// ---------------------------------------------------------------------------
async function partnerOf(db: Database, actor: Actor) {
  if (actor.role !== "AFFILIATE") throw new ForbiddenError("Área do parceiro.");
  const p = await db.query.partners.findFirst({ where: eq(partners.userId, actor.userId) });
  if (!p) throw new ForbiddenError();
  return p;
}

export const STAGE_LABEL: Record<PartnerLeadStage, string> = { NEW: "Novo lead", DIAG_SCHEDULED: "Diagnóstico agendado", DIAG_DELIVERED: "Diagnóstico entregue", PROPOSAL_SENT: "Proposta enviada", NEGOTIATION: "Negociação", WON: "Ganho", LOST: "Perdido", ONBOARDING: "Onboarding", REACTIVATION: "Reativação" };

const leadSchema = z.object({ name: z.string().trim().min(3).max(120), email: z.string().trim().toLowerCase().email(), phone: z.string().trim().max(20).optional(), company: z.string().trim().max(120).optional(), notes: z.string().trim().max(1000).optional() });

/** Registra o lead para o parceiro. E-mail já registrado por outro parceiro: recusa (proteção de quem chegou primeiro). */
export async function createPartnerLead(db: Database, actor: Actor, raw: z.input<typeof leadSchema>) {
  const p = await partnerOf(db, actor);
  const input = leadSchema.parse(raw);
  const taken = await db.query.partnerLeads.findFirst({ where: eq(partnerLeads.email, input.email) });
  if (taken) throw new DomainError(taken.partnerId === p.id ? "LEAD_EXISTS" : "LEAD_TAKEN", taken.partnerId === p.id ? "Este lead já está na sua carteira." : "Este contato já foi registrado por outro parceiro.");
  const id = newId("pld");
  await db.insert(partnerLeads).values({ id, partnerId: p.id, name: input.name, email: input.email, phone: input.phone ?? null, company: input.company ?? null, notes: input.notes ?? null });
  return { id };
}

export async function listPartnerLeads(db: Database, actor: Actor) {
  const p = await partnerOf(db, actor);
  return db.select().from(partnerLeads).where(eq(partnerLeads.partnerId, p.id)).orderBy(desc(partnerLeads.updatedAt));
}

const diagAnswers = z.object({ hasStore: z.enum(["nao", "sim_outra", "sim_nextlevel"]), monthlyOrders: z.enum(["0", "1-30", "31-300", "300+"]), ads: z.enum(["nao", "as_vezes", "sempre"]), catalog: z.enum(["ate_30", "ate_150", "ate_1000", "mais"]), social: z.enum(["nao", "irregular", "constante"]) });

/** Diagnóstico padronizado do parceiro: nota de maturidade (0–100) e recomendações do catálogo, com validade de 30 dias. */
export function scoreDiagnosis(a: z.infer<typeof diagAnswers>) {
  let score = 0; const rec: string[] = [];
  score += a.hasStore === "sim_nextlevel" ? 25 : a.hasStore === "sim_outra" ? 15 : 0;
  score += { "0": 0, "1-30": 10, "31-300": 20, "300+": 25 }[a.monthlyOrders];
  score += { nao: 0, as_vezes: 10, sempre: 20 }[a.ads];
  score += { nao: 0, irregular: 8, constante: 15 }[a.social];
  score += a.catalog === "ate_30" ? 5 : a.catalog === "ate_150" ? 10 : 15;
  if (a.hasStore === "nao") rec.push(a.catalog === "ate_30" ? "LOJA_PRONTA_ESSENCIAL" : "LOJA_PRONTA_PROFISSIONAL", "COMMERCE_START");
  if (a.hasStore === "sim_outra") rec.push(a.catalog === "ate_30" || a.catalog === "ate_150" ? "MIGRACAO_LITE" : a.catalog === "ate_1000" ? "MIGRACAO_PRO" : "MIGRACAO_SCALE");
  if (a.ads !== "sempre" && a.hasStore !== "nao") rec.push("MKT_META_ADS");
  if (a.social !== "constante") rec.push("MKT_SOCIAL");
  if (a.monthlyOrders === "31-300" || a.monthlyOrders === "300+") rec.push("CONSULTORIA_CRESCIMENTO");
  return { score: Math.min(100, score), recommendations: [...new Set(rec)] };
}

export async function savePartnerDiagnosis(db: Database, actor: Actor, leadId: string, raw: z.input<typeof diagAnswers>, now = new Date()) {
  const p = await partnerOf(db, actor);
  const a = diagAnswers.parse(raw);
  const lead = await db.query.partnerLeads.findFirst({ where: and(eq(partnerLeads.id, leadId), eq(partnerLeads.partnerId, p.id)) });
  if (!lead) throw new NotFoundError("Lead não encontrado.");
  const r = scoreDiagnosis(a);
  const diagnosis = { score: r.score, answers: a as Record<string, string>, recommendations: r.recommendations, validUntil: new Date(now.getTime() + 30 * 86_400_000).toISOString() };
  await db.update(partnerLeads).set({ diagnosis, stage: lead.stage === "NEW" || lead.stage === "DIAG_SCHEDULED" ? "DIAG_DELIVERED" : lead.stage, updatedAt: now.toISOString() }).where(eq(partnerLeads.id, lead.id));
  return diagnosis;
}

export async function movePartnerLead(db: Database, actor: Actor, leadId: string, stage: PartnerLeadStage, notes?: string) {
  const p = await partnerOf(db, actor);
  z.enum(PARTNER_LEAD_STAGES).parse(stage);
  const r = await db.update(partnerLeads).set({ stage, ...(notes !== undefined ? { notes: notes.slice(0, 1000) } : {}), updatedAt: new Date().toISOString() }).where(and(eq(partnerLeads.id, leadId), eq(partnerLeads.partnerId, p.id))).returning({ id: partnerLeads.id });
  if (!r.length) throw new NotFoundError("Lead não encontrado.");
}

/** Catálogo comercial liberado ao parceiro: preço público, desconto permitido, comissão e benefício (regra vigente). */
export async function partnerCatalog(db: Database, actor: Actor) {
  const p = await partnerOf(db, actor);
  const { findRule } = await import("./corporate-commissions");
  const items = (await listCatalog(db)).filter((i) => i.audience.includes("PARTNER"));
  return Promise.all(items.map(async (i) => {
    const cycle = i.prices.MONTHLY ? "MONTHLY" : i.prices.ONE_TIME ? "ONE_TIME" : "QUOTE";
    const rule = await findRule(db, { family: i.family, productKey: i.key, cycle, partnerKind: p.kind });
    const annual = i.prices.ANNUAL ? await findRule(db, { family: i.family, productKey: i.key, cycle: "ANNUAL", partnerKind: p.kind }) : null;
    return { key: i.key, slug: i.slug, name: i.name, family: i.family, kind: i.kind, tagline: i.tagline, prices: i.prices, partnerDiscountMaxBps: i.partnerDiscountMaxBps, rule: rule ? { firstBps: rule.firstBps, recurringBps: rule.recurringBps, recurringMonths: rule.recurringMonths, holdDays: rule.holdDays, benefit: rule.benefit } : null, annualRule: annual ? { firstBps: annual.firstBps, benefit: annual.benefit } : null, link: `/solucoes/${i.slug}?ref=${p.code}` };
  }));
}

/** Dashboard do parceiro (só dele): leads por etapa, propostas, vendas atribuídas e conversão. */
export async function partnerSalesDashboard(db: Database, actor: Actor) {
  const p = await partnerOf(db, actor);
  const leads = await db.select({ stage: partnerLeads.stage }).from(partnerLeads).where(eq(partnerLeads.partnerId, p.id));
  const orders = await db.select({ status: corporateOrders.status, totalCents: corporateOrders.totalCents }).from(corporateOrders).where(eq(corporateOrders.partnerId, p.id));
  const subs = await db.select({ status: nlSubscriptions.status }).from(nlSubscriptions).innerJoin(stores, eq(stores.id, nlSubscriptions.storeId)).where(eq(stores.partnerId, p.id));
  const quotes = await db.select({ status: corporateQuotes.status }).from(corporateQuotes).where(eq(corporateQuotes.partnerId, p.id));
  const by = Object.fromEntries(PARTNER_LEAD_STAGES.map((s) => [s, leads.filter((l) => l.stage === s).length])) as Record<PartnerLeadStage, number>;
  const won = orders.filter((o) => o.status === "PAID").length + subs.filter((s) => s.status === "active").length;
  return { kind: p.kind, code: p.code, leads: leads.length, byStage: by, quotes: quotes.length, quotesOpen: quotes.filter((q) => ["REQUESTED", "DRAFTING", "SENT"].includes(q.status)).length, salesPaid: won, salesValueCents: orders.filter((o) => o.status === "PAID").reduce((s, o) => s + o.totalCents, 0), conversionBps: leads.length ? Math.round((by.WON / leads.length) * 10_000) : 0 };
}

/** Master define o tipo do parceiro (Influenciador, Representante, Agência, Agência Elite, White Label). */
export async function setPartnerKind(db: Database, actor: Actor, partnerId: string, kind: (typeof PARTNER_KINDS)[number], reason: string) {
  requireMaster(actor);
  z.enum(PARTNER_KINDS).parse(kind);
  const p = await db.query.partners.findFirst({ where: eq(partners.id, partnerId) });
  if (!p) throw new NotFoundError("Parceiro não encontrado.");
  await db.update(partners).set({ kind }).where(eq(partners.id, partnerId));
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "PARTNER_KIND", entityType: "partner", entityId: partnerId, partnerId, before: { kind: p.kind }, after: { kind }, reason: z.string().trim().min(3).max(300).parse(reason) });
}

export const PARTNER_KIND_LABEL: Record<(typeof PARTNER_KINDS)[number], string> = { AFFILIATE: "Influenciador", REPRESENTATIVE: "Representante", AGENCY: "Agência", AGENCY_ELITE: "Agência Elite", WHITE_LABEL: "White Label" };

