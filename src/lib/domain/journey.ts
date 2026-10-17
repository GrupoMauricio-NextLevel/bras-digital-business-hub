import { and, count, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { corporateOrders, entitlements, JOURNEY_PHASES, orders, platformSettings, serviceDeliveries, storeProducts, stores, storeThemes, type JourneyPhase } from "@/db/schema";
import { isMaster, type Actor } from "./access";
import { ForbiddenError } from "./errors";
import { CORPORATE, recordFinancialAudit } from "./fin-audit";
import { listCatalog, type CatalogItem } from "./nl-catalog";
import { storeAccess } from "./store-access";

/**
 * Jornada da Loja NextLevel interna (D90): fases configuráveis no Master, marcos medidos com dados REAIS da loja
 * (nunca inventa progresso) e estado de cada produto para o cliente. Produto bloqueado nunca some: explica o
 * pré-requisito e leva à landing ("Entender esta solução").
 */
export const MILESTONES = {
  PLAN_ACTIVE: "Plano ativo ou em teste",
  BRAND_IDENTITY: "Logo e identidade aplicadas",
  CHECKOUT_READY: "Recebimento conectado (Mercado Pago da loja)",
  SHIPPING_READY: "Frete configurado",
  CATALOG_READY: "Pelo menos 10 produtos ativos",
  DOMAIN_CONNECTED: "Domínio próprio conectado",
  STORE_PUBLISHED: "Loja publicada com produtos à venda",
  THEME_SET: "Tema escolhido",
  FIRST_SALE: "Primeira venda paga",
  TEN_SALES: "10 vendas pagas",
  REPEAT_CUSTOMER: "Cliente que comprou de novo",
  SERVICE_DELIVERED: "Serviço NextLevel entregue e aceito",
  HUNDRED_SALES: "100 vendas pagas",
} as const;
export type MilestoneKey = keyof typeof MILESTONES;

export type PhaseConfig = { key: JourneyPhase; name: string; goal: string; explanation: string; milestones: MilestoneKey[] };
export type JourneyConfig = { phases: PhaseConfig[]; earlyAccess: { planKeys: string[]; partnerKinds: string[] } };

export const DEFAULT_JOURNEY: JourneyConfig = {
  phases: [
    { key: "FUNDACAO", name: "Fundação", goal: "Deixar a loja pronta para receber o primeiro pedido.", explanation: "Identidade, recebimento, frete e catálogo são o que faz o cliente confiar e conseguir pagar. Sem isso, qualquer tráfego se perde.", milestones: ["PLAN_ACTIVE", "BRAND_IDENTITY", "CHECKOUT_READY", "SHIPPING_READY", "CATALOG_READY"] },
    { key: "LANCAMENTO", name: "Lançamento", goal: "Publicar a vitrine e fazer a primeira venda.", explanation: "Um tema que combina com a marca e uma vitrine organizada aumentam a chance de conversão das primeiras visitas.", milestones: ["THEME_SET", "STORE_PUBLISHED", "DOMAIN_CONNECTED", "FIRST_SALE"] },
    { key: "AQUISICAO", name: "Aquisição", goal: "Trazer visitas qualificadas com constância.", explanation: "Conteúdo e anúncios bem medidos trazem quem tem chance de comprar. A verba de anúncio é sua e vai direto à plataforma.", milestones: ["TEN_SALES"] },
    { key: "OTIMIZACAO", name: "Otimização", goal: "Vender mais para quem já visita e já comprou.", explanation: "Melhorar conversão e recompra rende mais do que só comprar mais tráfego.", milestones: ["REPEAT_CUSTOMER", "SERVICE_DELIVERED"] },
    { key: "ESCALA", name: "Escala", goal: "Crescer com operação, integrações e canais.", explanation: "Com volume, entram migrações maiores, integrações e soluções sob consulta.", milestones: ["HUNDRED_SALES"] },
  ],
  earlyAccess: { planKeys: ["COMMERCE_SCALE"], partnerKinds: ["AGENCY_ELITE"] },
};

const KEY = "journey_config";
const configSchema = z.object({
  phases: z.array(z.object({ key: z.enum(JOURNEY_PHASES), name: z.string().trim().min(2).max(40), goal: z.string().trim().min(5).max(200), explanation: z.string().trim().min(5).max(500), milestones: z.array(z.enum(Object.keys(MILESTONES) as [MilestoneKey, ...MilestoneKey[]])).max(10) })).length(5),
  earlyAccess: z.object({ planKeys: z.array(z.string().max(40)).max(10), partnerKinds: z.array(z.string().max(40)).max(10) }),
});

export async function getJourneyConfig(db: Database): Promise<JourneyConfig> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) });
  const parsed = configSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : DEFAULT_JOURNEY;
}

export async function saveJourneyConfig(db: Database, actor: Actor, raw: unknown) {
  if (!isMaster(actor)) throw new ForbiddenError("Apenas a NextLevel configura a jornada.");
  const value = configSchema.parse(raw);
  const before = await getJourneyConfig(db);
  await db.insert(platformSettings).values({ key: KEY, value, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "JOURNEY_CONFIG", entityType: "platform_settings", entityId: KEY, before: before as never, after: value as never });
}

/** Marcos cumpridos, medidos nos dados da própria loja. */
export async function milestonesFor(db: Database, storeId: string, now = new Date()): Promise<Record<MilestoneKey, boolean>> {
  const s = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  const out = Object.fromEntries(Object.keys(MILESTONES).map((k) => [k, false])) as Record<MilestoneKey, boolean>;
  if (!s) return out;
  const [active] = await db.select({ n: count() }).from(storeProducts).where(and(eq(storeProducts.storeId, storeId), eq(storeProducts.active, true)));
  const [paid] = await db.select({ n: count() }).from(orders).where(and(eq(orders.storeId, storeId), eq(orders.customerPaymentStatus, "PAID"), sql`${orders.status} <> 'CANCELED'`));
  const repeat = (await db.execute(sql`select 1 from orders where store_id = ${storeId} and customer_payment_status = 'PAID' and customer_email is not null group by lower(customer_email) having count(*) > 1 limit 1`)) as { rows: unknown[] };
  const theme = await db.query.storeThemes.findFirst({ where: eq(storeThemes.storeId, storeId) });
  const [delivered] = await db.select({ n: count() }).from(serviceDeliveries).where(and(eq(serviceDeliveries.storeId, storeId), eq(serviceDeliveries.status, "ACCEPTED")));
  const access = storeAccess(s, now).state;
  const activeN = active?.n ?? 0, paidN = paid?.n ?? 0;
  out.PLAN_ACTIVE = access === "PAID" || access === "TRIAL" || access === "FREE" || access === "GRATIS";
  out.BRAND_IDENTITY = !!(s.logoUrl || s.logoText);
  out.CHECKOUT_READY = s.paymentStatus === "CONNECTED";
  out.SHIPPING_READY = !!s.shippingProvider || !!s.networkId;
  out.CATALOG_READY = activeN >= 10;
  out.DOMAIN_CONNECTED = !!s.customDomain;
  out.STORE_PUBLISHED = s.status === "ACTIVE" && activeN >= 1;
  out.THEME_SET = !!theme;
  out.FIRST_SALE = paidN >= 1;
  out.TEN_SALES = paidN >= 10;
  out.HUNDRED_SALES = paidN >= 100;
  out.REPEAT_CUSTOMER = repeat.rows.length > 0;
  out.SERVICE_DELIVERED = (delivered?.n ?? 0) > 0;
  return out;
}

export type ProductState = "available" | "recommended" | "in_progress" | "completed" | "locked" | "not_eligible" | "quote_required";
export const STATE_LABEL: Record<ProductState, string> = { available: "Disponível", recommended: "Recomendado", in_progress: "Em andamento", completed: "Você já tem", locked: "Bloqueado", not_eligible: "Não disponível para você", quote_required: "Sob consulta" };

export type JourneyCard = { product: CatalogItem; state: ProductState; reason: string; missing: string[]; phase: PhaseConfig };

const prereqLabel = (k: string, catalog: CatalogItem[]) => (k.startsWith("PRODUCT:") ? `Ter ${catalog.find((c) => c.key === k.slice(8))?.name ?? k.slice(8)}` : (MILESTONES as Record<string, string>)[k] ?? k);

/**
 * Jornada da loja: progresso por fase, fase atual (primeira com marco pendente) e estado de cada produto.
 * Só o próprio lojista (ou o Master) consulta.
 */
export async function storeJourney(db: Database, actor: Actor, storeId: string, now = new Date()) {
  if (!isMaster(actor) && !(actor.role === "STORE_OWNER" && actor.storeId === storeId)) throw new ForbiddenError();
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  if (!store) throw new ForbiddenError();
  const [config, ms, catalog] = await Promise.all([getJourneyConfig(db), milestonesFor(db, storeId, now), listCatalog(db)]);
  const { brandCodeOfStore } = await import("@/lib/store-brand");
  const brand = await brandCodeOfStore(db, store);
  const { subscriptionOf } = await import("./commerce-plans");
  const sub = await subscriptionOf(db, storeId);
  const ents = new Set((await db.select({ key: entitlements.key, endsAt: entitlements.endsAt }).from(entitlements).where(eq(entitlements.storeId, storeId))).filter((e) => !e.endsAt || new Date(e.endsAt) > now).map((e) => e.key));
  const myOrders = await db.select({ productId: corporateOrders.productId, status: corporateOrders.status }).from(corporateOrders).where(and(eq(corporateOrders.storeId, storeId), inArray(corporateOrders.status, ["PENDING_PAYMENT", "PAID"])));
  const deliveries = await db.select({ productKey: serviceDeliveries.productKey, status: serviceDeliveries.status }).from(serviceDeliveries).where(eq(serviceDeliveries.storeId, storeId));
  const ownedKeys = new Set<string>([...deliveries.filter((d) => d.status === "ACCEPTED").map((d) => d.productKey), ...catalog.filter((c) => c.grantsKey && ents.has(c.grantsKey)).map((c) => c.key)]);
  if (sub && ["active", "trial"].includes(sub.status)) ownedKeys.add(sub.productKey);
  const phases = config.phases.map((p) => ({ ...p, done: p.milestones.filter((m) => ms[m]).length, total: p.milestones.length, items: p.milestones.map((m) => ({ key: m, label: MILESTONES[m], done: ms[m] })) }));
  const currentIndex = Math.max(0, phases.findIndex((p) => p.done < p.total));
  const current = phases[currentIndex === -1 ? phases.length - 1 : currentIndex]!;
  const early = (sub && config.earlyAccess.planKeys.includes(sub.productKey)) || false;
  const met = (k: string) => (k.startsWith("PRODUCT:") ? ownedKeys.has(k.slice(8)) : !!ms[k as MilestoneKey]);
  const phaseOf = (k: JourneyPhase) => phases.find((p) => p.key === k) ?? phases[0]!;

  const cards: JourneyCard[] = catalog.filter((c) => c.audience.includes("STORE")).map((p) => {
    const phase = phaseOf(p.phase);
    const brands = p.meta.brands as string[] | undefined;
    const missing = p.prerequisites.filter((k) => !met(k)).map((k) => prereqLabel(k, catalog));
    const pending = myOrders.some((o) => o.productId === p.id && o.status === "PENDING_PAYMENT") || deliveries.some((d) => d.productKey === p.key && !["ACCEPTED", "CANCELED"].includes(d.status)) || (sub?.productKey === p.key && sub.status === "pending_payment");
    if (brands && !brands.includes(brand)) return { product: p, state: "not_eligible", reason: brand === "SUPERDROP" ? "Feito para lojas da NextLevel E-commerce. No SuperDrop, o equivalente é o upgrade de oferta da sua loja." : "Não disponível para o seu tipo de conta.", missing: [], phase };
    if (ownedKeys.has(p.key)) return { product: p, state: "completed", reason: p.family === "COMMERCE_PLAN" ? "É o seu plano atual." : "Já está com você.", missing: [], phase };
    if (pending) return { product: p, state: "in_progress", reason: "Pedido aberto ou entrega em andamento.", missing: [], phase };
    if (p.kind === "quote_required") return { product: p, state: "quote_required", reason: "Precisa de diagnóstico: peça a proposta.", missing, phase };
    if (missing.length && p.lockMode === "HARD" && !early) return { product: p, state: "locked", reason: `Disponível depois de: ${missing.join(", ")}.`, missing, phase };
    const recommended = p.phase === current.key && !missing.length;
    return { product: p, state: recommended ? "recommended" : "available", reason: recommended ? `Próximo passo da fase ${current.name}.` : missing.length ? `Recomendado depois de: ${missing.join(", ")}.` : `Faz parte da fase ${phase.name}.`, missing, phase };
  });
  return { phases, currentKey: current.key, cards, brand, subscription: sub };
}

/** Painel do fornecedor: produtos da NextLevel para fornecedores (sem jornada de loja). */
export async function supplierOffers(db: Database, actor: Actor) {
  if (actor.role !== "SUPPLIER_ADMIN" || !actor.supplierId) throw new ForbiddenError();
  const catalog = await listCatalog(db);
  return catalog.filter((c) => c.audience.includes("SUPPLIER")).map((p) => ({ product: p, state: (p.kind === "quote_required" ? "quote_required" : "available") as ProductState }));
}

/** Contagem simples para o Master (quantas lojas em cada fase). */
export async function journeyDistribution(db: Database, actor: Actor, limit = 200) {
  if (!isMaster(actor)) throw new ForbiddenError();
  const list = await db.select({ id: stores.id }).from(stores).where(eq(stores.status, "ACTIVE")).limit(limit);
  const config = await getJourneyConfig(db);
  const dist: Record<string, number> = Object.fromEntries(config.phases.map((p) => [p.key, 0]));
  for (const s of list) {
    const ms = await milestonesFor(db, s.id);
    const idx = config.phases.findIndex((p) => p.milestones.some((m) => !ms[m]));
    dist[config.phases[idx === -1 ? config.phases.length - 1 : idx]!.key]!++;
  }
  return dist;
}

