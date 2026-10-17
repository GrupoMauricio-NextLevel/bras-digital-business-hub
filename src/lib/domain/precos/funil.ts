import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "@/db/client";
import { bdAccessGrants, bdMembers, bdRequests, clubReferrals, financeInvoices, nlSubscriptions, orders, organizations, products, storeCampaigns, storeDiscounts, storeProducts, stores, trCarriers, trLoads, trParcels, trTrips } from "@/db/schema";
import { isEligibleSale, netSaleCents } from "../analytics";
import { requireMaster, type Actor } from "../access";

/**
 * Funil por marca (D124, fase P1 do prompt de público e preço): **só números agregados**, nunca nome, documento,
 * e-mail ou telefone. Cadastros por semana, etapas de ativação até pagante, coortes por mês de entrada, faixas de venda,
 * uso de recursos (pagante × não pagante) e origem. As funções puras abaixo recebem "entidades" anônimas (datas e números);
 * os carregadores leem o banco só para montar essas entidades. A mesma conta alimenta a tela do Master e o script
 * `scripts/funil-marcas.ts` (consulta reproduzível, só leitura).
 */

export type FunnelBrand = "NEXTLEVEL_COMMERCE" | "SUPERDROP" | "BRAS_DIGITAL" | "NEXTLEVEL_CARGAS";
export const FUNNEL_BRANDS: { brand: FunnelBrand; label: string; unit: string; revenueLabel: string; activity: string }[] = [
  { brand: "NEXTLEVEL_COMMERCE", label: "NextLevel E-commerce", unit: "lojas", revenueLabel: "Pago à NextLevel por loja", activity: "teve venda paga a partir do dia" },
  { brand: "SUPERDROP", label: "SuperDrop", unit: "lojas", revenueLabel: "Pago à NextLevel por loja", activity: "teve venda paga a partir do dia" },
  { brand: "BRAS_DIGITAL", label: "Brás Digital", unit: "membros", revenueLabel: "Comissão da Brás por membro", activity: "fez pedido a partir do dia" },
  { brand: "NEXTLEVEL_CARGAS", label: "NextLevel Cargas", unit: "transportadoras", revenueLabel: "Comissão da Cargas por transportadora", activity: "teve carga ou viagem a partir do dia" },
];

/** Uma conta anônima: quando entrou, quando chegou a cada etapa, quando esteve ativa, quanto rendeu ao grupo. */
export type FunnelEntity = {
  createdAt: string;
  stages: Record<string, string | null>;
  activity: string[];
  revenueCents: number;
  /** Vendas (ou compras) nos últimos 30 dias, para as faixas. `null` = a marca não tem faixa de venda. */
  sales30Cents: number | null;
  origin: string;
  paying: boolean;
  features: Record<string, boolean>;
};
export type StageDef = { key: string; label: string };
export type FunnelStage = StageDef & { count: number; pctOfFirst: number; medianDaysFromPrev: number | null };
export type FunnelCohort = { month: string; entered: number; d30: number | null; d60: number | null; d90: number | null; revenuePerClientCents: number };
export type FunnelCount = { label: string; count: number };
export type FunnelUsage = { feature: string; payingPct: number | null; freePct: number | null };
export type BrandFunnel = {
  brand: FunnelBrand; label: string; unit: string; revenueLabel: string; activity: string;
  total: number; weekly: FunnelCount[]; stages: FunnelStage[]; cohorts: FunnelCohort[]; bands: FunnelCount[] | null; origins: FunnelCount[]; usage: FunnelUsage[];
};

const DAY = 86_400_000;
const days = (a: string, b: string) => (new Date(b).getTime() - new Date(a).getTime()) / DAY;
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2);
  return Math.round((s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2) * 10) / 10;
}
const minDate = (xs: (string | null | undefined)[]) => xs.filter((x): x is string => !!x).sort()[0] ?? null;

/** Início da semana (segunda-feira, UTC) no formato AAAA-MM-DD. */
export function weekStart(iso: string) {
  const d = new Date(iso); d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
const ddmm = (ymd: string) => `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`;

/** Faixas de venda dos últimos 30 dias (é a distribuição que mostra onde um plano maior se paga). Faixas de análise, não preço. */
export const SALES_BANDS: { label: string; upTo: number }[] = [
  { label: "Sem venda", upTo: 0 },
  { label: "Até R$ 1 mil", upTo: 100_000 },
  { label: "R$ 1 mil a R$ 5 mil", upTo: 500_000 },
  { label: "R$ 5 mil a R$ 20 mil", upTo: 2_000_000 },
  { label: "Acima de R$ 20 mil", upTo: Number.POSITIVE_INFINITY },
];

/** Conta pura do funil: recebe entidades anônimas e devolve só agregados. */
export function buildFunnel(meta: (typeof FUNNEL_BRANDS)[number], defs: StageDef[], entities: FunnelEntity[], now: Date, features: string[] = []): BrandFunnel {
  const nowIso = now.toISOString();
  // Cadastros nas últimas 8 semanas (inclui a atual), com zero onde não houve.
  const thisWeek = weekStart(nowIso);
  const weeks = Array.from({ length: 8 }, (_, i) => new Date(new Date(thisWeek).getTime() - (7 - i) * 7 * DAY).toISOString().slice(0, 10));
  const weekly = weeks.map((w) => ({ label: ddmm(w), count: entities.filter((e) => weekStart(e.createdAt) === w).length }));

  const reached = (e: FunnelEntity, key: string) => (key === "signup" ? e.createdAt : e.stages[key] ?? null);
  const first = entities.length;
  const stages: FunnelStage[] = defs.map((d, i) => {
    const prev = defs[i - 1];
    const gaps = prev ? entities.map((e) => { const a = reached(e, prev.key); const b = reached(e, d.key); return a && b ? Math.max(0, days(a, b)) : null; }).filter((x): x is number => x !== null) : [];
    const count = entities.filter((e) => reached(e, d.key)).length;
    return { ...d, count, pctOfFirst: pct(count, first), medianDaysFromPrev: prev ? median(gaps) : null };
  });

  // Coortes por mês de entrada: retenção = ainda ativo a partir do dia N (só conta quem já tem N dias de casa).
  const months = [...new Set(entities.map((e) => e.createdAt.slice(0, 7)))].sort().reverse().slice(0, 6);
  const retained = (group: FunnelEntity[], n: number) => {
    const eligible = group.filter((e) => days(e.createdAt, nowIso) >= n);
    if (!eligible.length) return null;
    return pct(eligible.filter((e) => e.activity.some((a) => days(e.createdAt, a) >= n)).length, eligible.length);
  };
  const cohorts = months.map((month) => {
    const g = entities.filter((e) => e.createdAt.startsWith(month));
    return { month, entered: g.length, d30: retained(g, 30), d60: retained(g, 60), d90: retained(g, 90), revenuePerClientCents: g.length ? Math.round(g.reduce((s, e) => s + e.revenueCents, 0) / g.length) : 0 };
  });

  const withSales = entities.filter((e) => e.sales30Cents !== null);
  const bands = withSales.length
    ? SALES_BANDS.map((b, i) => ({ label: b.label, count: withSales.filter((e) => { const v = e.sales30Cents!; const lo = i === 0 ? -1 : SALES_BANDS[i - 1]!.upTo; return v > lo && v <= b.upTo; }).length }))
    : null;

  const originMap = new Map<string, number>();
  for (const e of entities) originMap.set(e.origin, (originMap.get(e.origin) ?? 0) + 1);
  const origins = [...originMap].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);

  const payingE = entities.filter((e) => e.paying); const freeE = entities.filter((e) => !e.paying);
  const usage = features.map((f) => ({ feature: f, payingPct: payingE.length ? pct(payingE.filter((e) => e.features[f]).length, payingE.length) : null, freePct: freeE.length ? pct(freeE.filter((e) => e.features[f]).length, freeE.length) : null }));

  return { ...meta, total: entities.length, weekly, stages, cohorts, bands, origins, usage };
}

// ---------------------------------------------------------------- carregadores (leem o banco, devolvem entidades anônimas)

const STORE_STAGES: StageDef[] = [
  { key: "signup", label: "Cadastro" }, { key: "product", label: "1º produto" }, { key: "published", label: "Loja publicada" },
  { key: "sale", label: "1ª venda paga" }, { key: "paying", label: "Pagou a NextLevel" },
];
const STORE_FEATURES = ["Logo própria", "Mercado Pago conectado", "Envio conectado", "Domínio próprio", "Cupom ou campanha"];

async function storeEntities(db: Database, brand: "NEXTLEVEL_COMMERCE" | "SUPERDROP", now: Date): Promise<FunnelEntity[]> {
  const rows = await db.select({ s: stores }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId))
    .where(and(eq(organizations.brand, brand), isNull(stores.showcaseTheme)));
  if (!rows.length) return [];
  const ids = new Set(rows.map((r) => r.s.id));
  const [prods, sp, ords, inv, subs, camps, discs, refs] = await Promise.all([
    db.select({ storeId: products.storeId, createdAt: products.createdAt }).from(products),
    db.select({ storeId: storeProducts.storeId, productId: storeProducts.productId }).from(storeProducts),
    db.select({ storeId: orders.storeId, createdAt: orders.createdAt, status: orders.status, customerPaymentStatus: orders.customerPaymentStatus, subtotalCents: orders.subtotalCents, discountCents: orders.discountCents }).from(orders),
    db.select({ storeId: financeInvoices.storeId, amountCents: financeInvoices.amountCents, paidAt: financeInvoices.paidAt }).from(financeInvoices).where(eq(financeInvoices.status, "PAID")),
    db.select({ storeId: nlSubscriptions.storeId, status: nlSubscriptions.status, currentPeriodStart: nlSubscriptions.currentPeriodStart }).from(nlSubscriptions),
    db.select({ storeId: storeCampaigns.storeId }).from(storeCampaigns),
    db.select({ storeId: storeDiscounts.storeId }).from(storeDiscounts),
    db.select({ targetId: clubReferrals.targetId }).from(clubReferrals).where(eq(clubReferrals.targetType, "store")),
  ]);
  const productDates = new Map<string, string[]>();
  for (const p of prods) if (p.storeId && ids.has(p.storeId)) productDates.set(p.storeId, [...(productDates.get(p.storeId) ?? []), p.createdAt]);
  const linkedProducts = new Set(sp.filter((x) => ids.has(x.storeId)).map((x) => x.storeId));
  const salesBy = new Map<string, { at: string; cents: number }[]>();
  for (const o of ords) if (ids.has(o.storeId) && isEligibleSale(o)) salesBy.set(o.storeId, [...(salesBy.get(o.storeId) ?? []), { at: o.createdAt, cents: netSaleCents(o) }]);
  const paidBy = new Map<string, { at: string; cents: number }[]>();
  for (const i of inv) if (i.storeId && ids.has(i.storeId) && i.paidAt) paidBy.set(i.storeId, [...(paidBy.get(i.storeId) ?? []), { at: i.paidAt, cents: i.amountCents }]);
  const subBy = new Map(subs.map((s) => [s.storeId, s]));
  const promo = new Set([...camps, ...discs].map((x) => x.storeId));
  const clubRef = new Set(refs.map((r) => r.targetId));
  const since30 = new Date(now.getTime() - 30 * DAY).toISOString();
  return rows.map(({ s }) => {
    const sales = salesBy.get(s.id) ?? []; const paid = paidBy.get(s.id) ?? []; const sub = subBy.get(s.id);
    const activeSub = sub && (sub.status === "active" || sub.status === "past_due");
    const paying = !!activeSub || (!!s.paidUntil && s.paidUntil > now.toISOString());
    return {
      createdAt: s.createdAt,
      stages: {
        // Loja do SuperDrop recebe o catálogo da rede (sem data própria): conta a entrada como o 1º produto.
        product: minDate(productDates.get(s.id) ?? []) ?? (linkedProducts.has(s.id) ? s.createdAt : null),
        published: s.publishedAt ?? null,
        sale: minDate(sales.map((x) => x.at)),
        paying: minDate([...paid.map((x) => x.at), activeSub ? sub.currentPeriodStart : null]),
      },
      activity: sales.map((x) => x.at),
      revenueCents: paid.reduce((a, x) => a + x.cents, 0),
      sales30Cents: sales.filter((x) => x.at >= since30).reduce((a, x) => a + x.cents, 0),
      origin: s.partnerId ? "Parceiro" : clubRef.has(s.id) ? "Indicação do Club" : s.couponId ? "Fornecedor (cupom)" : "Direto (site)",
      paying,
      features: {
        "Logo própria": !!s.logoUrl, "Mercado Pago conectado": s.paymentStatus === "CONNECTED", "Envio conectado": s.shippingStatus === "CONNECTED",
        "Domínio próprio": s.domainStatus === "CONNECTED", "Cupom ou campanha": promo.has(s.id),
      },
    };
  });
}

const BRAS_STAGES: StageDef[] = [
  { key: "signup", label: "Cadastro" }, { key: "profile", label: "Perfil respondido" }, { key: "request", label: "1º pedido" },
  { key: "paid", label: "1º pedido pago" }, { key: "paying", label: "Assinou um plano" },
];

async function brasEntities(db: Database, now: Date): Promise<FunnelEntity[]> {
  const [members, reqs, grants, refs] = await Promise.all([
    db.select({ id: bdMembers.id, createdAt: bdMembers.createdAt, profileAnsweredAt: bdMembers.profileAnsweredAt, source: bdMembers.source, sourceVideoId: bdMembers.sourceVideoId }).from(bdMembers),
    db.select({ memberId: bdRequests.memberId, createdAt: bdRequests.createdAt, paidAt: bdRequests.paidAt, totalCents: bdRequests.totalCents, commissionBps: bdRequests.commissionBps }).from(bdRequests),
    db.select({ memberId: bdAccessGrants.memberId, kind: bdAccessGrants.kind, validUntil: bdAccessGrants.validUntil, revokedAt: bdAccessGrants.revokedAt, createdAt: bdAccessGrants.createdAt }).from(bdAccessGrants),
    db.select({ targetId: clubReferrals.targetId }).from(clubReferrals).where(eq(clubReferrals.targetType, "bd_member")),
  ]);
  const clubRef = new Set(refs.map((r) => r.targetId));
  const since30 = new Date(now.getTime() - 30 * DAY).toISOString();
  return members.map((m) => {
    const mine = reqs.filter((r) => r.memberId === m.id); const paid = mine.filter((r) => r.paidAt);
    const subs = grants.filter((g) => g.memberId === m.id && g.kind === "SUBSCRIPTION");
    return {
      createdAt: m.createdAt,
      stages: { profile: m.profileAnsweredAt ?? null, request: minDate(mine.map((r) => r.createdAt)), paid: minDate(paid.map((r) => r.paidAt)), paying: minDate(subs.map((g) => g.createdAt)) },
      activity: mine.map((r) => r.createdAt),
      revenueCents: paid.reduce((a, r) => a + Math.round((r.totalCents * (r.commissionBps ?? 0)) / 10_000), 0),
      sales30Cents: paid.filter((r) => r.paidAt! >= since30).reduce((a, r) => a + r.totalCents, 0),
      origin: clubRef.has(m.id) ? "Indicação do Club" : m.sourceVideoId ? "Vídeo de descoberta" : m.source && m.source !== "direto" ? "Campanha ou link" : "Direto (site)",
      paying: subs.some((g) => !g.revokedAt && g.validUntil > now.toISOString()),
      features: {},
    };
  });
}

const CARGAS_STAGES: StageDef[] = [
  { key: "signup", label: "Cadastro" }, { key: "job", label: "1ª carga ou viagem" }, { key: "delivered", label: "1ª entrega" }, { key: "paying", label: "Plano pago" },
];

async function cargasEntities(db: Database, now: Date): Promise<FunnelEntity[]> {
  const [carriers, loads, trips, parcels, refs] = await Promise.all([
    db.select({ id: trCarriers.id, createdAt: trCarriers.createdAt, plan: trCarriers.plan, createdByImporterId: trCarriers.createdByImporterId }).from(trCarriers),
    db.select({ carrierId: trLoads.carrierId, createdAt: trLoads.createdAt, deliveredAt: trLoads.deliveredAt, commissionCents: trLoads.commissionCents, freightCents: trLoads.freightCents }).from(trLoads),
    db.select({ carrierId: trTrips.carrierId, createdAt: trTrips.createdAt }).from(trTrips),
    db.select({ carrierId: trParcels.carrierId, deliveredAt: trParcels.deliveredAt, priceCents: trParcels.priceCents }).from(trParcels),
    db.select({ targetId: clubReferrals.targetId }).from(clubReferrals).where(eq(clubReferrals.targetType, "tr_carrier")),
  ]);
  const clubRef = new Set(refs.map((r) => r.targetId));
  const since30 = new Date(now.getTime() - 30 * DAY).toISOString();
  return carriers.map((c) => {
    const l = loads.filter((x) => x.carrierId === c.id); const t = trips.filter((x) => x.carrierId === c.id);
    const delivered = [...l.filter((x) => x.deliveredAt).map((x) => ({ at: x.deliveredAt!, cents: x.freightCents ?? 0 })), ...parcels.filter((p) => p.carrierId === c.id && p.deliveredAt).map((p) => ({ at: p.deliveredAt!, cents: p.priceCents }))];
    return {
      createdAt: c.createdAt,
      stages: { job: minDate([...l.map((x) => x.createdAt), ...t.map((x) => x.createdAt)]), delivered: minDate(delivered.map((x) => x.at)), paying: c.plan === "GRATIS" ? null : c.createdAt },
      activity: [...l.map((x) => x.createdAt), ...t.map((x) => x.createdAt)],
      revenueCents: l.reduce((a, x) => a + (x.deliveredAt ? x.commissionCents ?? 0 : 0), 0),
      sales30Cents: delivered.filter((x) => x.at >= since30).reduce((a, x) => a + x.cents, 0),
      origin: clubRef.has(c.id) ? "Indicação do Club" : c.createdByImporterId ? "Importadora" : "Cadastro pelo Master",
      paying: c.plan !== "GRATIS",
      features: {},
    };
  });
}

/** Funil de todas as marcas, para o Master. Só agregados. */
export async function brandFunnels(db: Database, actor: Actor, now = new Date()): Promise<BrandFunnel[]> {
  requireMaster(actor);
  return funnelsUnchecked(db, now);
}

/** Mesma conta sem sessão: só para o script de linha de comando (`scripts/funil-marcas.ts`), que já roda com acesso ao banco. */
export async function funnelsUnchecked(db: Database, now = new Date()): Promise<BrandFunnel[]> {
  const meta = (b: FunnelBrand) => FUNNEL_BRANDS.find((x) => x.brand === b)!;
  const [commerce, superdrop, bras, cargas] = await Promise.all([storeEntities(db, "NEXTLEVEL_COMMERCE", now), storeEntities(db, "SUPERDROP", now), brasEntities(db, now), cargasEntities(db, now)]);
  return [
    buildFunnel(meta("NEXTLEVEL_COMMERCE"), STORE_STAGES, commerce, now, STORE_FEATURES),
    buildFunnel(meta("SUPERDROP"), STORE_STAGES, superdrop, now, STORE_FEATURES),
    buildFunnel(meta("BRAS_DIGITAL"), BRAS_STAGES, bras, now),
    buildFunnel(meta("NEXTLEVEL_CARGAS"), CARGAS_STAGES, cargas, now),
  ];
}
