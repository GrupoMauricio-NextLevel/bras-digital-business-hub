import { and, count, eq, gte, inArray, ne, sql, sum } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { bdAccessGrants, bdMembers, bdRequests, clubCards, orders, organizations, platformSettings, storeProducts, stores, trCarrierUsers, trCarriers, trLoads, trParcels, trTrips, PRICE_SURVEY_BRANDS } from "@/db/schema";
import { requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { emitEvent } from "../events";
import { getPriceBook } from "../finance";
import { listCatalog } from "../nl-catalog";
import { clubBalance } from "../club/pontos";
import { getClubRules, pointsToCents } from "../club/regras";
import { storeAccess } from "../store-access";
import type { EntrySnapshot } from "../precos/porta-entrada";

/**
 * Benefícios gamificados nos painéis (D128, fase P5V do prompt de público e preço). **Um agregador só**: carteira do
 * grupo (pontos do Club em pontos e em reais), trilha de primeiros passos da persona, medidor do teste e simulador
 * "quando o plano se paga". Entrega tudo pronto para a tela; **o componente não decide regra**. Ligado por marca no
 * Master (`beneficios.painel`), **desligado por padrão**.
 */
export const BENEFIT_BRANDS = PRICE_SURVEY_BRANDS;
export type BenefitBrand = (typeof BENEFIT_BRANDS)[number];
export const benefitsSettingsSchema = z.object({ brands: z.array(z.enum(BENEFIT_BRANDS)).max(BENEFIT_BRANDS.length) });
export type BenefitsSettings = z.output<typeof benefitsSettingsSchema>;
const KEY = "beneficios.painel";
export async function getBenefitsSettings(db: Database): Promise<BenefitsSettings> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) });
  const p = benefitsSettingsSchema.safeParse(row?.value);
  return p.success ? p.data : { brands: [] };
}
export async function saveBenefitsSettings(db: Database, actor: Actor, raw: z.input<typeof benefitsSettingsSchema>) {
  requireMaster(actor);
  const before = await getBenefitsSettings(db);
  const v = benefitsSettingsSchema.parse(raw);
  await db.insert(platformSettings).values({ key: KEY, value: v, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value: v, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  await recordAudit(db, actor, { action: "BENEFITS_SETTINGS", entityType: "platform_settings", entityId: KEY, before, after: v }, { force: true });
  return v;
}

export type TrailStep = { key: string; label: string; done: boolean; href: string | null };
export type PlanOption = { name: string; monthlyCents: number; feeBps: number; totalCents: number; current: boolean };
export type BenefitsPanel = {
  brand: BenefitBrand;
  wallet: { points: number; valueCents: number; expiringSoon: number; href: string | null };
  trail: { title: string; steps: TrailStep[]; done: number; next: TrailStep | null };
  trial: { daysLeft: number; totalDays: number; gainedDays: number; capDays: number; milestones: { label: string; days: number; done: boolean }[] } | null;
  simulator: { salesCents: number; options: PlanOption[]; best: PlanOption; savingsCents: number } | null;
  /** Passos concluídos desde a última visita: a tela comemora uma vez (já registrado). */
  celebrate: TrailStep[];
};

const DAY = 86_400_000;
const since30 = (now: Date) => new Date(now.getTime() - 30 * DAY).toISOString();

async function brandOfActor(db: Database, actor: Actor): Promise<BenefitBrand | null> {
  if (actor.role === "BRAS_MEMBER") return "BRAS_DIGITAL";
  if (actor.role === "CARRIER") return "NEXTLEVEL_CARGAS";
  if (actor.role !== "STORE_OWNER" || !actor.storeId) return null;
  const [r] = await db.select({ brand: organizations.brand, networkId: stores.networkId }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(eq(stores.id, actor.storeId)).limit(1);
  if (!r) return null;
  if (r.brand === "SUPERDROP" || r.brand === "NEXTLEVEL_COMMERCE") return r.brand;
  return r.networkId ? "SUPERDROP" : "NEXTLEVEL_COMMERCE";
}

/** Custo mensal de um plano para quem vende `salesCents` (mensalidade + taxa sobre a venda). */
export const monthlyCost = (monthlyCents: number, feeBps: number, salesCents: number) => monthlyCents + Math.round((salesCents * feeBps) / 10_000);

/** Simulador puro: dado o volume e os planos (com o atual marcado), devolve o melhor e quanto economiza. */
export function simulatePlans(salesCents: number, plans: Omit<PlanOption, "totalCents">[]) {
  const options = plans.map((p) => ({ ...p, totalCents: monthlyCost(p.monthlyCents, p.feeBps, salesCents) }));
  const best = options.reduce((a, b) => (b.totalCents < a.totalCents ? b : a));
  const current = options.find((o) => o.current) ?? options[0]!;
  return { salesCents, options, best, savingsCents: Math.max(0, current.totalCents - best.totalCents) };
}

async function storeTrail(db: Database, storeId: string): Promise<TrailStep[]> {
  const s = (await db.query.stores.findFirst({ where: eq(stores.id, storeId) }))!;
  const [active] = await db.select({ n: count() }).from(storeProducts).where(and(eq(storeProducts.storeId, storeId), eq(storeProducts.active, true)));
  const [paid] = await db.select({ n: count() }).from(orders).where(and(eq(orders.storeId, storeId), eq(orders.customerPaymentStatus, "PAID"), ne(orders.status, "CANCELED")));
  return [
    { key: "LOGO", label: "Coloque a sua logo", done: !!(s.logoUrl || s.logoText), href: "/merchant/appearance" },
    { key: "PRODUTOS", label: "Tenha produtos à venda", done: (active?.n ?? 0) >= 1, href: "/merchant/products" },
    { key: "PAGAMENTO", label: "Conecte o recebimento", done: s.paymentStatus === "CONNECTED" || s.paymentStatus === "DEMO", href: "/merchant/settings" },
    { key: "PUBLICAR", label: "Publique a loja", done: !!s.publishedAt, href: "/merchant/storefront" },
    { key: "VENDA1", label: "Faça a primeira venda", done: (paid?.n ?? 0) >= 1, href: "/merchant/orders" },
    { key: "VENDA10", label: "Chegue a 10 vendas", done: (paid?.n ?? 0) >= 10, href: "/merchant/orders" },
  ];
}

async function memberTrail(db: Database, userId: string): Promise<TrailStep[]> {
  const m = await db.query.bdMembers.findFirst({ where: eq(bdMembers.userId, userId) });
  const reqs = m ? await db.select({ status: bdRequests.status, paidAt: bdRequests.paidAt }).from(bdRequests).where(eq(bdRequests.memberId, m.id)) : [];
  const card = await db.query.clubCards.findFirst({ where: eq(clubCards.userId, userId) });
  const parcels = await db.select({ n: count() }).from(trParcels).where(eq(trParcels.clientUserId, userId));
  const plan = m ? await db.query.bdAccessGrants.findFirst({ where: and(eq(bdAccessGrants.memberId, m.id), eq(bdAccessGrants.kind, "SUBSCRIPTION")) }) : null;
  return [
    { key: "PERFIL", label: "Responda o seu perfil de compra", done: !!m?.profileAnsweredAt, href: "/meu-bras/perfil" },
    { key: "PEDIDO1", label: "Faça o primeiro pedido de caixa", done: reqs.length > 0, href: "/meu-bras" },
    { key: "PAGO1", label: "Primeiro pedido pago", done: reqs.some((r) => r.paidAt), href: "/meu-bras/pedidos" },
    { key: "FRETE", label: "Mande um fardo pelo frete do grupo", done: (parcels[0]?.n ?? 0) > 0, href: "/meu-bras/fretes" },
    { key: "CARTAO", label: "Pegue o seu cartão do Club", done: !!card, href: "/meu-bras/club" },
    { key: "PLANO", label: "Conheça os planos com análise de produto", done: !!plan, href: "/meu-bras#mb-plano" },
  ];
}

async function carrierTrail(db: Database, userId: string): Promise<TrailStep[]> {
  const [link] = await db.select({ c: trCarriers }).from(trCarrierUsers).innerJoin(trCarriers, eq(trCarriers.id, trCarrierUsers.carrierId)).where(eq(trCarrierUsers.userId, userId)).limit(1);
  const c = link?.c;
  if (!c) return [];
  const [loads] = await db.select({ n: count() }).from(trLoads).where(and(eq(trLoads.carrierId, c.id), inArray(trLoads.status, ["ACEITA", "COLETADA", "ENTREGUE"])));
  const [delivered] = await db.select({ n: count() }).from(trLoads).where(and(eq(trLoads.carrierId, c.id), eq(trLoads.status, "ENTREGUE")));
  const [trips] = await db.select({ n: count() }).from(trTrips).where(eq(trTrips.carrierId, c.id));
  const bus = c.operation === "EXCURSAO";
  return [
    { key: "MOTORISTA", label: "Gere o link do motorista", done: !!c.driverTokenHash, href: "/transportadora/perfil" },
    bus ? { key: "VIAGEM", label: "Abra a primeira viagem", done: (trips?.n ?? 0) > 0, href: "/transportadora/rotas" } : { key: "ACEITE", label: "Aceite a primeira carga", done: (loads?.n ?? 0) > 0, href: "/transportadora" },
    { key: "ENTREGA", label: bus ? "Entregue o primeiro fardo" : "Entregue a primeira carga", done: bus ? !!(await db.query.trParcels.findFirst({ where: and(eq(trParcels.carrierId, c.id), eq(trParcels.status, "ENTREGUE")) })) : (delivered?.n ?? 0) > 0, href: "/transportadora" },
    { key: "PIX", label: "Conecte o Pix para receber", done: !!c.mpConnectedAt, href: "/transportadora/perfil" },
    { key: "INDICAR", label: "Indique uma importadora", done: false, href: "/transportadora/indicacoes" },
  ];
}

async function storeSimulator(db: Database, storeId: string, brand: BenefitBrand, now: Date): Promise<BenefitsPanel["simulator"]> {
  const s = (await db.query.stores.findFirst({ where: eq(stores.id, storeId) }))!;
  const [g] = await db.select({ v: sum(orders.subtotalCents) }).from(orders).where(and(eq(orders.storeId, storeId), eq(orders.customerPaymentStatus, "PAID"), ne(orders.status, "CANCELED"), gte(orders.createdAt, since30(now))));
  const salesCents = Number(g?.v ?? 0);
  const snap = s.entryOffer as EntrySnapshot | null;
  const free = snap && storeAccess(s, now).state === "GRATIS";
  const plans: Omit<PlanOption, "totalCents">[] = [];
  if (snap) plans.push({ name: "Grátis", monthlyCents: 0, feeBps: snap.freeTierFeeBps, current: !!free });
  if (brand === "SUPERDROP") {
    const book = await getPriceBook(db);
    for (const k of ["DROP_MANUAL", "STORE_SUBDOMAIN", "STORE_OWN"] as const) plans.push({ name: book.offers[k].name, monthlyCents: book.offers[k].monthlyCents, feeBps: book.orderFees[k] ?? 0, current: !free && s.offer === k });
  } else {
    const catalog = await listCatalog(db, { families: ["COMMERCE_PLAN"] });
    const sub = await db.query.nlSubscriptions.findFirst({ where: (t, { eq: e }) => e(t.storeId, storeId) });
    for (const p of catalog) {
      const m = p.prices.MONTHLY?.amountCents;
      if (!m) continue;
      plans.push({ name: p.name, monthlyCents: m, feeBps: (p.meta as { platformFeeBps?: number } | null)?.platformFeeBps ?? 0, current: !free && sub?.productKey === p.key });
    }
  }
  if (plans.length < 2) return null;
  if (!plans.some((p) => p.current)) plans[0]!.current = true;
  return simulatePlans(salesCents, plans);
}

/** Painel de benefícios de quem está logado, ou `null` (marca desligada ou papel sem painel). */
export async function benefitsPanel(db: Database, actor: Actor, now = new Date()): Promise<BenefitsPanel | null> {
  const brand = await brandOfActor(db, actor);
  if (!brand || !(await getBenefitsSettings(db)).brands.includes(brand)) return null;
  const [rules, bal] = await Promise.all([getClubRules(db), clubBalance(db, actor.userId, now)]);
  const wallet = { points: bal.available, valueCents: pointsToCents(bal.available, rules), expiringSoon: bal.expiringSoon, href: brand === "BRAS_DIGITAL" ? "/meu-bras/club" : brand === "NEXTLEVEL_CARGAS" ? "/transportadora/indicacoes" : null };

  const steps = actor.role === "STORE_OWNER" && actor.storeId ? await storeTrail(db, actor.storeId) : actor.role === "BRAS_MEMBER" ? await memberTrail(db, actor.userId) : await carrierTrail(db, actor.userId);
  const done = steps.filter((x) => x.done).length;
  const trail = { title: "Seus primeiros passos", steps, done, next: steps.find((x) => !x.done) ?? null };

  // Comemoração: cada passo concluído vira um evento único por pessoa; só os novos voltam para a tela.
  const celebrate: TrailStep[] = [];
  for (const st of steps.filter((x) => x.done)) {
    const first = await emitEvent(db, { type: "BENEFIT_MILESTONE", storeId: actor.storeId ?? null, actorRole: actor.role, payload: { step: st.key, brand }, dedupeKey: `BENEFIT_MILESTONE:${actor.userId}:${brand}:${st.key}` });
    if (first) celebrate.push(st);
  }

  let trial: BenefitsPanel["trial"] = null;
  let simulator: BenefitsPanel["simulator"] = null;
  if (actor.role === "STORE_OWNER" && actor.storeId) {
    const s = (await db.query.stores.findFirst({ where: eq(stores.id, actor.storeId) }))!;
    const acc = storeAccess(s, now);
    const snap = s.entryOffer as EntrySnapshot | null;
    if (acc.state === "TRIAL" && snap && s.trialStartedAt && s.trialEndsAt) {
      const total = Math.round((new Date(s.trialEndsAt).getTime() - new Date(s.trialStartedAt).getTime()) / DAY);
      const events = await db.execute(sql`select payload->>'event' as e from domain_events where store_id = ${s.id} and type = 'TRIAL_MILESTONE'`) as { rows: { e: string }[] };
      const got = new Set(events.rows.map((r) => r.e));
      trial = { daysLeft: acc.daysLeft ?? 0, totalDays: total, gainedDays: Math.max(0, total - snap.trialDays), capDays: snap.milestoneCapDays, milestones: snap.milestones.map((m) => ({ label: m.event === "STORE_PUBLISHED" ? "Publicar a loja" : "Primeira venda", days: m.days, done: got.has(m.event) })) };
    }
    simulator = await storeSimulator(db, actor.storeId, brand, now);
  }
  return { brand, wallet, trail, trial, simulator, celebrate };
}
