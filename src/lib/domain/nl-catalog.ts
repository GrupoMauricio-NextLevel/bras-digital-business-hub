import { and, asc, desc, eq, gt, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { CATALOG_STATUSES, catalogOffers, nlSubscriptions, catalogPriceVersions, catalogProducts, commissionRules, GATEWAYS, JOURNEY_PHASES, PARTNER_KINDS, PRICE_CYCLES, type CatalogContent, type CatalogStatus, type OfferRules, type PriceCycle } from "@/db/schema";
import { newId } from "@/lib/ids";
import { COMISSOES_D220, PRECOS_D220, REF_D220, descontoAnualBps } from "@/lib/finance/revisao-d220";
import { COMISSOES_D226, REF_D226 } from "@/lib/finance/revisao-d226";
import { PRECOS_D228, REF_D228 } from "@/lib/finance/revisao-d228";
import { ENTRY_OFFER_KEY, FAQ_ANUAL, FAQ_TESTE, SEED_COMMISSION_RULES, SEED_DOOR_OFFERS, SEED_OFFER, SEED_PRODUCTS } from "@/lib/finance/catalog-seed";
import type { PriceRule } from "@/lib/finance/catalog-pricing";
import { isMaster, requireMasterFn, type Actor } from "./access";
import { campanhaBlack } from "./campanha-black";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { assertReauth, CORPORATE, recordFinancialAudit } from "./fin-audit";

/**
 * Catálogo corporativo da NextLevel (D90): `nextlevel_corporate_finance`. Só o Master cria, edita, publica, pausa e
 * arquiva. Fornecedor, membro, loja e parceiro apenas leem os produtos PUBLICADOS com o preço vigente.
 */
export type CatalogProduct = typeof catalogProducts.$inferSelect;
export type PriceVersion = typeof catalogPriceVersions.$inferSelect;
export type CatalogItem = CatalogProduct & { prices: Partial<Record<PriceCycle, PriceVersion>> };

/** Catálogo e preços (D138): o dono e o Financeiro da equipe. */
const requireMaster = (actor: Actor) => { if (!isMaster(actor)) throw new ForbiddenError("Apenas a NextLevel administra o catálogo e os preços."); requireMasterFn(actor, ["FINANCEIRO"]); };

// ---------------------------------------------------------------------------
// Semente (idempotente): grava a versão 1 aprovada pelo dono só para o que ainda não existe.
// ---------------------------------------------------------------------------
const seeded = new WeakMap<object, Promise<number>>();
export async function ensureCatalogSeed(db: Database): Promise<number> {
  const existing = new Set((await db.select({ key: catalogProducts.key }).from(catalogProducts)).map((r) => r.key));
  let created = 0;
  for (const p of SEED_PRODUCTS) {
    if (existing.has(p.key)) continue;
    const id = newId("cpr");
    const inserted = await db.insert(catalogProducts).values({ id, key: p.key, slug: p.slug, name: p.name, family: p.family, kind: p.kind, status: p.status ?? "PUBLISHED", phase: p.phase, audience: p.audience, tagline: p.tagline, summary: p.summary, content: p.content, prerequisites: p.prerequisites ?? [], lockMode: p.lockMode ?? "RECOMMENDED", unlocks: p.unlocks ?? [], deliveryDays: p.deliveryDays ?? null, grantsKey: p.grantsKey ?? null, partnerDiscountMaxBps: p.partnerDiscountMaxBps ?? 0, commissionHoldDays: p.commissionHoldDays ?? 14, meta: p.meta ?? {}, sortOrder: p.sortOrder }).onConflictDoNothing().returning({ id: catalogProducts.id });
    if (!inserted.length) continue;
    for (const pr of p.prices) {
      await db.insert(catalogPriceVersions).values({ id: newId("cpv"), productId: id, cycle: pr.cycle, version: 1, amountCents: pr.amountCents, platformFeeBps: pr.platformFeeBps ?? null, methods: pr.methods ?? ["PIX", "CARD"], pixDiscountBps: pr.pixDiscountBps ?? 0, cardMaxInstallments: pr.cardMaxInstallments ?? 1, cardMarkupBps: pr.cardMarkupBps ?? 0, annualDiscountBps: pr.annualDiscountBps ?? null, effectiveFrom: new Date(0).toISOString(), reason: `Tabela aprovada pelo dono (${p.ref ?? "D90"})`, approvalRef: p.ref ?? "D90" }).onConflictDoNothing();
    }
    created++;
  }
  if (!(await db.query.catalogOffers.findFirst({ where: eq(catalogOffers.key, ENTRY_OFFER_KEY) }))) {
    await db.insert(catalogOffers).values({ id: newId("cof"), key: SEED_OFFER.key, version: 1, name: SEED_OFFER.name, rules: SEED_OFFER.rules, effectiveFrom: new Date(0).toISOString(), reason: "Oferta aprovada pelo dono (D90)" }).onConflictDoNothing();
  }
  for (const d of SEED_DOOR_OFFERS) {
    if (await db.query.catalogOffers.findFirst({ where: eq(catalogOffers.key, d.key) })) continue;
    await db.insert(catalogOffers).values({ id: newId("cof"), key: d.key, version: 1, name: d.name, status: "PAUSED", rules: d.rules, effectiveFrom: new Date(0).toISOString(), reason: "Porta de entrada em rascunho, pausada até o dono aprovar (D126)" }).onConflictDoNothing();
  }
  const ruleKeys = new Set((await db.select({ key: commissionRules.key }).from(commissionRules)).map((r) => r.key));
  for (const r of SEED_COMMISSION_RULES) {
    if (ruleKeys.has(r.key)) continue;
    await db.insert(commissionRules).values({ id: newId("crl"), key: r.key, version: 1, family: r.family, productKey: r.productKey ?? null, cycle: r.cycle ?? null, partnerKind: r.partnerKind ?? null, firstBps: r.firstBps, recurringBps: r.recurringBps ?? 0, recurringMonths: r.recurringMonths ?? 0, holdDays: r.holdDays, benefit: r.benefit, effectiveFrom: new Date(0).toISOString(), reason: "Tabela de comissões aprovada pelo dono (D90)" }).onConflictDoNothing();
  }
  await aplicarRevisaoD220(db);
  await agendarRevisaoD228(db);
  await aplicarOfertaSemPrimeiroMes(db);
  await aplicarComissoesD226(db);
  return created;
}

/** Comissões da D226 (PV0): nova versão de cada regra, uma vez por banco (marcador "D226" no motivo). */
async function aplicarComissoesD226(db: Database) {
  const regras = await db.select().from(commissionRules).orderBy(desc(commissionRules.version));
  for (const r of COMISSOES_D226) {
    const ult = regras.find((x) => x.key === r.key);
    if (ult?.reason.includes(REF_D226)) continue;
    await db.insert(commissionRules).values({ id: newId("crl"), key: r.key, version: (ult?.version ?? 0) + 1, family: "COMMERCE_PLAN", productKey: null, cycle: r.cycle, partnerKind: r.partnerKind, firstBps: r.firstBps, recurringBps: r.recurringBps, recurringMonths: r.recurringMonths, holdDays: 30, benefit: r.benefit, effectiveFrom: new Date(0).toISOString(), reason: `Programa de parceiros v2: criador e representante 50% + 20%, agência 50% + 25%, Elite 50% + 32%, enquanto o cliente ficar (${REF_D226})` }).onConflictDoNothing();
  }
}

/**
 * D233: a oferta de entrada deixa de ter o 1º mês por R$ 9,90 (mantém o teste grátis e o resto). Nova versão, uma vez por
 * banco (marcador "D233" no motivo). Quem já usou a oferta antiga mantém as condições que recebeu.
 */
async function aplicarOfertaSemPrimeiroMes(db: Database) {
  // FAQ gravado no conteúdo dos planos: troca as respostas antigas (R$ 9,90 e "25%") pelas atuais.
  const planos = await db.select({ id: catalogProducts.id, content: catalogProducts.content }).from(catalogProducts).where(eq(catalogProducts.family, "COMMERCE_PLAN"));
  for (const pl of planos) {
    // D247: "sem limite de cadastro" deixou de valer (limite de produtos por plano).
    const scope = pl.content?.scope ?? [];
    if (scope.some((x) => /sem limite de cadastro/.test(x))) {
      pl.content = { ...pl.content, scope: scope.map((x) => x.replace("sem limite de cadastro", "(limite de produtos por plano)")) };
      await db.update(catalogProducts).set({ content: pl.content }).where(eq(catalogProducts.id, pl.id));
    }
    const faq = pl.content?.faq ?? [];
    if (!faq.some((f) => /9,90|25%/.test(f.a))) continue;
    const novo = faq.map((f) => /9,90/.test(f.a) ? { ...f, a: FAQ_TESTE } : /25%/.test(f.a) && /anual/i.test(f.q) ? { ...f, a: FAQ_ANUAL } : f);
    await db.update(catalogProducts).set({ content: { ...pl.content, faq: novo } }).where(eq(catalogProducts.id, pl.id));
  }
  const versoes = await db.select().from(catalogOffers).where(eq(catalogOffers.key, ENTRY_OFFER_KEY)).orderBy(desc(catalogOffers.version));
  const ult = versoes[0];
  if (!ult || versoes.some((v) => v.reason?.includes("D233")) || ult.rules.firstPeriodCents == null) return;
  await db.insert(catalogOffers).values({ id: newId("cof"), key: ult.key, version: ult.version + 1, name: ult.name, status: ult.status, rules: { ...ult.rules, firstPeriodCents: null }, effectiveFrom: new Date(0).toISOString(), reason: "Sem 1º mês por R$ 9,90; a Black passa a ser a oferta (D233)" }).onConflictDoNothing();
}

/**
 * Revisão D220 (taxa zero, mensalidades novas e comissões de parceiros): nova versão de preço e de regra, uma vez por
 * banco (marcador `approvalRef`/`reason` com "D220"). Assinaturas existentes passam a ter taxa zero (a favor do lojista).
 */
async function aplicarRevisaoD220(db: Database) {
  const agora = new Date().toISOString();
  // A tabela nova vale como a tabela vigente (sobrepõe a v1 pela versão maior), inclusive para contas com relógio antigo.
  const vigencia = new Date(0).toISOString();
  const prods = await db.select({ id: catalogProducts.id, key: catalogProducts.key }).from(catalogProducts).where(inArray(catalogProducts.key, Object.keys(PRECOS_D220)));
  for (const p of prods) {
    const novo = PRECOS_D220[p.key]!;
    const versoes = await db.select().from(catalogPriceVersions).where(eq(catalogPriceVersions.productId, p.id)).orderBy(desc(catalogPriceVersions.version));
    if (versoes.some((v) => v.approvalRef === REF_D220)) continue;
    for (const cycle of ["MONTHLY", "ANNUAL"] as const) {
      const ult = versoes.find((v) => v.cycle === cycle);
      await db.insert(catalogPriceVersions).values({ id: newId("cpv"), productId: p.id, cycle, version: (ult?.version ?? 0) + 1, amountCents: cycle === "MONTHLY" ? novo.mensal : novo.anual, platformFeeBps: 0, methods: ult?.methods ?? ["PIX", "CARD"], pixDiscountBps: ult?.pixDiscountBps ?? 0, cardMaxInstallments: ult?.cardMaxInstallments ?? 1, cardMarkupBps: ult?.cardMarkupBps ?? 0, annualDiscountBps: cycle === "ANNUAL" ? descontoAnualBps(novo) : null, effectiveFrom: vigencia, reason: "Taxa zero com Mercado Pago e mensalidades abaixo da concorrência (D220)", approvalRef: REF_D220 }).onConflictDoNothing();
    }
  }
  if (prods.length) await db.update(nlSubscriptions).set({ platformFeeBps: 0, updatedAt: agora }).where(gt(nlSubscriptions.platformFeeBps, 0));
  const regras = await db.select().from(commissionRules).orderBy(desc(commissionRules.version));
  for (const r of COMISSOES_D220) {
    const ult = regras.find((x) => x.key === r.key);
    if (ult?.reason.includes(REF_D220)) continue;
    await db.insert(commissionRules).values({ id: newId("crl"), key: r.key, version: (ult?.version ?? 0) + 1, family: "COMMERCE_PLAN", productKey: null, cycle: r.cycle, partnerKind: r.partnerKind, firstBps: r.firstBps, recurringBps: r.recurringBps, recurringMonths: r.recurringMonths, holdDays: ult?.holdDays ?? 14, benefit: r.benefit, effectiveFrom: vigencia, reason: "Programa de parceiros da E-commerce: indicador 20% + 10%, agência 30% + 15% (D220)" }).onConflictDoNothing();
  }
}

/**
 * Preço depois da Black (D228): nova versão agendada para o instante seguinte ao fim da campanha, uma vez por banco.
 * Até lá vale a D220 (versão menor já vigente); depois, a D228 (versão maior). Ver `campanha-black.ts`.
 */
async function agendarRevisaoD228(db: Database) {
  const fim = (await campanhaBlack(db)).fim;
  const vigencia = new Date(Date.parse(fim) + 1000).toISOString();
  const prods = await db.select({ id: catalogProducts.id, key: catalogProducts.key }).from(catalogProducts).where(inArray(catalogProducts.key, Object.keys(PRECOS_D228)));
  for (const p of prods) {
    const novo = PRECOS_D228[p.key]!;
    const versoes = await db.select().from(catalogPriceVersions).where(eq(catalogPriceVersions.productId, p.id)).orderBy(desc(catalogPriceVersions.version));
    if (versoes.some((v) => v.approvalRef === REF_D228)) continue;
    for (const cycle of ["MONTHLY", "ANNUAL"] as const) {
      const ult = versoes.find((v) => v.cycle === cycle);
      await db.insert(catalogPriceVersions).values({ id: newId("cpv"), productId: p.id, cycle, version: (ult?.version ?? 0) + 1, amountCents: cycle === "MONTHLY" ? novo.mensal : novo.anual, platformFeeBps: 0, methods: ult?.methods ?? ["PIX", "CARD"], pixDiscountBps: ult?.pixDiscountBps ?? 0, cardMaxInstallments: ult?.cardMaxInstallments ?? 1, cardMarkupBps: ult?.cardMarkupBps ?? 0, annualDiscountBps: cycle === "ANNUAL" ? descontoAnualBps(novo) : null, effectiveFrom: vigencia, reason: "Preço depois da Black NextLevel, meio-termo (D228)", approvalRef: REF_D228 }).onConflictDoNothing();
    }
  }
}

/** Garante a semente uma vez por banco aberto (leituras do catálogo chamam isto). */
export async function seededOnce(db: Database) {
  let p = seeded.get(db);
  if (!p) { p = ensureCatalogSeed(db).catch((e) => { seeded.delete(db); throw e; }); seeded.set(db, p); }
  await p;
}

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------
/** Versão vigente de cada ciclo (maior versão com vigência já iniciada). */
async function currentPrices(db: Database, productIds: string[], now = new Date()) {
  if (!productIds.length) return new Map<string, Partial<Record<PriceCycle, PriceVersion>>>();
  const rows = await db.select().from(catalogPriceVersions).where(and(inArray(catalogPriceVersions.productId, productIds), lte(catalogPriceVersions.effectiveFrom, now.toISOString()))).orderBy(asc(catalogPriceVersions.version));
  const out = new Map<string, Partial<Record<PriceCycle, PriceVersion>>>();
  for (const r of rows) { const m = out.get(r.productId) ?? {}; m[r.cycle] = r; out.set(r.productId, m); }
  return out;
}

export async function listCatalog(db: Database, opts: { includeUnpublished?: boolean; families?: string[] } = {}, now = new Date()): Promise<CatalogItem[]> {
  await seededOnce(db);
  const where = opts.includeUnpublished ? undefined : eq(catalogProducts.status, "PUBLISHED");
  let rows = await db.select().from(catalogProducts).where(where).orderBy(asc(catalogProducts.sortOrder), asc(catalogProducts.name));
  if (opts.families) rows = rows.filter((r) => opts.families!.includes(r.family));
  const prices = await currentPrices(db, rows.map((r) => r.id), now);
  return rows.map((r) => ({ ...r, prices: prices.get(r.id) ?? {} }));
}

export async function getCatalogItem(db: Database, by: { key?: string; slug?: string; id?: string }, opts: { includeUnpublished?: boolean } = {}, now = new Date()): Promise<CatalogItem | null> {
  await seededOnce(db);
  const where = by.id ? eq(catalogProducts.id, by.id) : by.key ? eq(catalogProducts.key, by.key) : by.slug ? eq(catalogProducts.slug, by.slug) : undefined;
  if (!where) return null;
  const p = await db.query.catalogProducts.findFirst({ where });
  if (!p || (!opts.includeUnpublished && p.status !== "PUBLISHED")) return null;
  const prices = await currentPrices(db, [p.id], now);
  return { ...p, prices: prices.get(p.id) ?? {} };
}

export const toPriceRule = (v: PriceVersion): PriceRule => ({ id: v.id, version: v.version, cycle: v.cycle, amountCents: v.amountCents, methods: v.methods, pixDiscountBps: v.pixDiscountBps, cardMaxInstallments: v.cardMaxInstallments, cardMarkupBps: v.cardMarkupBps });

export async function priceHistory(db: Database, actor: Actor, productId: string) {
  requireMaster(actor);
  return db.select().from(catalogPriceVersions).where(eq(catalogPriceVersions.productId, productId)).orderBy(desc(catalogPriceVersions.createdAt));
}

// ---------------------------------------------------------------------------
// Administração (Master)
// ---------------------------------------------------------------------------
const contentSchema = z.object({
  forWho: z.array(z.string().trim().min(1).max(200)).max(10), notFor: z.array(z.string().trim().min(1).max(200)).max(10),
  problem: z.string().trim().min(5).max(600), outcome: z.string().trim().min(5).max(600),
  scope: z.array(z.string().trim().min(1).max(200)).max(20), deliverables: z.array(z.string().trim().min(1).max(200)).max(20),
  timeline: z.string().trim().max(300).optional(), limits: z.array(z.string().trim().min(1).max(300)).max(10),
  faq: z.array(z.object({ q: z.string().trim().min(3).max(200), a: z.string().trim().min(3).max(800) })).max(15),
  policy: z.string().trim().max(600).optional(), partnerPerk: z.string().trim().max(300).optional(),
});

const productSchema = z.object({
  key: z.string().trim().toUpperCase().regex(/^[A-Z0-9_]{3,40}$/, "Chave: 3 a 40 letras maiúsculas, números ou _"),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{3,60}$/, "Endereço: 3 a 60 letras minúsculas, números ou -"),
  name: z.string().trim().min(3).max(80),
  family: z.enum(["COMMERCE_PLAN", "LOJA_PRONTA", "MIGRACAO", "TEMA", "MARKETING", "CONSULTORIA", "WHITE_LABEL", "ADDON"]),
  kind: z.enum(["subscription", "one_time", "quote_required", "usage_fee"]),
  phase: z.enum(JOURNEY_PHASES),
  audience: z.array(z.enum(["STORE", "SUPPLIER", "PARTNER", "PUBLIC"])).min(1),
  tagline: z.string().trim().min(5).max(140), summary: z.string().trim().min(10).max(400),
  content: contentSchema,
  prerequisites: z.array(z.string().trim().max(60)).max(10).default([]),
  lockMode: z.enum(["HARD", "RECOMMENDED"]).default("RECOMMENDED"),
  unlocks: z.array(z.string().trim().max(40)).max(10).default([]),
  deliveryDays: z.number().int().min(1).max(365).nullable().default(null),
  gateway: z.enum(GATEWAYS).nullable().default(null),
  partnerDiscountMaxBps: z.number().int().min(0).max(1000).default(0),
  commissionHoldDays: z.number().int().min(0).max(120).default(14),
  sortOrder: z.number().int().min(0).max(10_000).default(100),
});

/** Cria um produto em RASCUNHO (sem preço). Preço entra por `addPriceVersion`. */
export async function createCatalogProduct(db: Database, actor: Actor, raw: z.input<typeof productSchema>) {
  requireMaster(actor);
  const p = productSchema.parse(raw);
  if (await db.query.catalogProducts.findFirst({ where: eq(catalogProducts.key, p.key) })) throw new DomainError("KEY_TAKEN", "Já existe um produto com esta chave.");
  if (await db.query.catalogProducts.findFirst({ where: eq(catalogProducts.slug, p.slug) })) throw new DomainError("SLUG_TAKEN", "Já existe um produto com este endereço.");
  const id = newId("cpr");
  await db.insert(catalogProducts).values({ id, ...p, status: "DRAFT", content: p.content as CatalogContent });
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "CATALOG_PRODUCT_CREATED", entityType: "catalog_product", entityId: id, after: { key: p.key, name: p.name, family: p.family, kind: p.kind } });
  return { id };
}

const editSchema = productSchema.omit({ key: true, family: true }).partial();

/** Edita textos, fase, pré-requisitos, gateway e limites. Não muda preço (preço é sempre nova versão). */
export async function updateCatalogProduct(db: Database, actor: Actor, productId: string, raw: z.input<typeof editSchema>) {
  requireMaster(actor);
  const patch = editSchema.parse(raw);
  const before = await db.query.catalogProducts.findFirst({ where: eq(catalogProducts.id, productId) });
  if (!before) throw new NotFoundError("Produto não encontrado.");
  if (patch.slug && patch.slug !== before.slug && (await db.query.catalogProducts.findFirst({ where: eq(catalogProducts.slug, patch.slug) }))) throw new DomainError("SLUG_TAKEN", "Já existe um produto com este endereço.");
  await db.update(catalogProducts).set({ ...patch, content: (patch.content ?? before.content) as CatalogContent, updatedAt: new Date().toISOString() }).where(eq(catalogProducts.id, productId));
  const changed = Object.keys(patch);
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "CATALOG_PRODUCT_UPDATED", entityType: "catalog_product", entityId: productId, before: Object.fromEntries(changed.map((k) => [k, (before as Record<string, unknown>)[k]])), after: patch as Record<string, unknown> });
}

/**
 * Publicar, pausar ou arquivar. Pausar/arquivar só impede NOVAS compras: pedidos, assinaturas e direitos já adquiridos
 * continuam valendo (nada aqui toca em pedidos ou assinaturas).
 */
export async function setCatalogStatus(db: Database, actor: Actor, productId: string, status: CatalogStatus, reason: string) {
  requireMaster(actor);
  z.enum(CATALOG_STATUSES).parse(status);
  const why = z.string().trim().min(3, "Informe o motivo").max(300).parse(reason);
  const p = await db.query.catalogProducts.findFirst({ where: eq(catalogProducts.id, productId) });
  if (!p) throw new NotFoundError("Produto não encontrado.");
  if (status === "PUBLISHED") {
    const prices = await currentPrices(db, [productId]);
    if (!Object.keys(prices.get(productId) ?? {}).length) throw new DomainError("NO_PRICE", "Cadastre um preço (ou marque como sob consulta) antes de publicar.");
  }
  await db.update(catalogProducts).set({ status, updatedAt: new Date().toISOString() }).where(eq(catalogProducts.id, productId));
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "CATALOG_STATUS", entityType: "catalog_product", entityId: productId, before: { status: p.status }, after: { status }, reason: why });
}

const priceSchema = z.object({
  cycle: z.enum(PRICE_CYCLES),
  amountCents: z.number().int().min(0).max(100_000_000).nullable(),
  platformFeeBps: z.number().int().min(0).max(2000).nullable().default(null),
  methods: z.array(z.enum(["PIX", "CARD"])).min(1).default(["PIX", "CARD"]),
  pixDiscountBps: z.number().int().min(0).max(3000).default(0),
  cardMaxInstallments: z.number().int().min(1).max(12).default(1),
  cardMarkupBps: z.number().int().min(0).max(5000).default(0),
  annualDiscountBps: z.number().int().min(0).max(5000).nullable().default(null),
  effectiveFrom: z.string().datetime().optional(),
  reason: z.string().trim().min(5, "Explique o motivo da mudança de preço").max(300),
  approvalRef: z.string().trim().max(80).optional(),
});

/** Nova versão de preço (nunca altera a anterior). Exige reautenticação. Pedidos e assinaturas já criados mantêm o preço deles. */
export async function addPriceVersion(db: Database, actor: Actor, productId: string, raw: z.input<typeof priceSchema>, password: string | undefined) {
  requireMaster(actor);
  await assertReauth(db, actor, password);
  const v = priceSchema.parse(raw);
  if (v.cycle === "QUOTE" && v.amountCents !== null) throw new DomainError("QUOTE_PRICE", "Preço sob consulta não tem valor.");
  if (v.cycle !== "QUOTE" && v.amountCents === null) throw new DomainError("PRICE_REQUIRED", "Informe o valor.");
  if (v.methods.includes("PIX") && v.pixDiscountBps > 0 && v.methods.length === 1 && v.cardMarkupBps > 0) throw new DomainError("PRICE_RULE", "Acréscimo de cartão sem cartão habilitado.");
  const p = await db.query.catalogProducts.findFirst({ where: eq(catalogProducts.id, productId) });
  if (!p) throw new NotFoundError("Produto não encontrado.");
  const last = await db.select({ version: catalogPriceVersions.version }).from(catalogPriceVersions).where(and(eq(catalogPriceVersions.productId, productId), eq(catalogPriceVersions.cycle, v.cycle))).orderBy(desc(catalogPriceVersions.version)).limit(1);
  const version = (last[0]?.version ?? 0) + 1;
  const id = newId("cpv");
  await db.insert(catalogPriceVersions).values({ id, productId, cycle: v.cycle, version, amountCents: v.amountCents, platformFeeBps: v.platformFeeBps, methods: v.methods, pixDiscountBps: v.pixDiscountBps, cardMaxInstallments: v.cardMaxInstallments, cardMarkupBps: v.cardMarkupBps, annualDiscountBps: v.annualDiscountBps, effectiveFrom: v.effectiveFrom ?? new Date().toISOString(), authorUserId: actor.userId, reason: v.reason, approvalRef: v.approvalRef ?? null });
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "PRICE_VERSION_CREATED", entityType: "catalog_price_version", entityId: id, after: { productKey: p.key, cycle: v.cycle, version, amountCents: v.amountCents, pixDiscountBps: v.pixDiscountBps, cardMarkupBps: v.cardMarkupBps, cardMaxInstallments: v.cardMaxInstallments, platformFeeBps: v.platformFeeBps }, reason: v.reason });
  return { id, version };
}

// ---------------------------------------------------------------------------
// Ofertas (oferta de entrada Commerce) — versionadas
// ---------------------------------------------------------------------------
export async function activeOffer(db: Database, key: string, now = new Date()) {
  await seededOnce(db);
  const rows = await db.select().from(catalogOffers).where(and(eq(catalogOffers.key, key), lte(catalogOffers.effectiveFrom, now.toISOString()))).orderBy(desc(catalogOffers.version)).limit(1);
  const o = rows[0];
  return o && o.status === "ACTIVE" ? o : null;
}

export async function listOffers(db: Database, actor: Actor) {
  requireMaster(actor);
  await seededOnce(db);
  return db.select().from(catalogOffers).orderBy(asc(catalogOffers.key), desc(catalogOffers.version));
}

const offerSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED"]),
  trialDays: z.number().int().min(0).max(30), firstPeriodCents: z.number().int().min(0).max(100_000).nullable(), feeHolidayMonths: z.number().int().min(0).max(12),
  perk: z.string().trim().max(200).optional(), reason: z.string().trim().min(5).max(300),
});

/** Nova versão da oferta (pausar = versão PAUSED). Quem já usou a oferta mantém as condições que recebeu. */
export async function addOfferVersion(db: Database, actor: Actor, key: string, raw: z.input<typeof offerSchema>, password: string | undefined) {
  requireMaster(actor);
  await assertReauth(db, actor, password);
  const v = offerSchema.parse(raw);
  const last = (await db.select().from(catalogOffers).where(eq(catalogOffers.key, key)).orderBy(desc(catalogOffers.version)).limit(1))[0];
  if (!last) throw new NotFoundError("Oferta não encontrada.");
  const rules: OfferRules = { ...last.rules, trialDays: v.trialDays, firstPeriodCents: v.firstPeriodCents, feeHolidayMonths: v.feeHolidayMonths, perk: v.perk };
  const id = newId("cof");
  await db.insert(catalogOffers).values({ id, key, version: last.version + 1, name: last.name, status: v.status, rules, authorUserId: actor.userId, reason: v.reason });
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "OFFER_VERSION_CREATED", entityType: "catalog_offer", entityId: id, before: { version: last.version, status: last.status, rules: last.rules }, after: { version: last.version + 1, status: v.status, rules }, reason: v.reason });
  return { id, version: last.version + 1 };
}

// ---------------------------------------------------------------------------
// Regras de comissão — versionadas
// ---------------------------------------------------------------------------
export async function listCommissionRules(db: Database) {
  await seededOnce(db);
  const rows = await db.select().from(commissionRules).orderBy(asc(commissionRules.key), desc(commissionRules.version));
  const latest = new Map<string, typeof rows[number]>();
  for (const r of rows) if (!latest.has(r.key)) latest.set(r.key, r);
  return { latest: [...latest.values()], history: rows };
}

const ruleSchema = z.object({
  firstBps: z.number().int().min(0).max(5000), recurringBps: z.number().int().min(0).max(5000), recurringMonths: z.number().int().min(0).max(120),
  holdDays: z.number().int().min(0).max(120), benefit: z.string().trim().max(200), active: z.boolean(),
  partnerKind: z.enum(PARTNER_KINDS).nullable().optional(), reason: z.string().trim().min(5).max(300),
});

/** Nova versão da regra (comissões já lançadas não mudam). */
export async function addCommissionRuleVersion(db: Database, actor: Actor, key: string, raw: z.input<typeof ruleSchema>, password: string | undefined) {
  requireMaster(actor);
  await assertReauth(db, actor, password);
  const v = ruleSchema.parse(raw);
  const last = (await db.select().from(commissionRules).where(eq(commissionRules.key, key)).orderBy(desc(commissionRules.version)).limit(1))[0];
  if (!last) throw new NotFoundError("Regra não encontrada.");
  const id = newId("crl");
  await db.insert(commissionRules).values({ id, key, version: last.version + 1, family: last.family, productKey: last.productKey, cycle: last.cycle, partnerKind: v.partnerKind === undefined ? last.partnerKind : v.partnerKind, firstBps: v.firstBps, recurringBps: v.recurringBps, recurringMonths: v.recurringMonths, holdDays: v.holdDays, benefit: v.benefit, active: v.active, authorUserId: actor.userId, reason: v.reason });
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "COMMISSION_RULE_VERSION", entityType: "commission_rule", entityId: id, before: { version: last.version, firstBps: last.firstBps, recurringBps: last.recurringBps, holdDays: last.holdDays, active: last.active }, after: { version: last.version + 1, ...v }, reason: v.reason });
  return { id, version: last.version + 1 };
}
