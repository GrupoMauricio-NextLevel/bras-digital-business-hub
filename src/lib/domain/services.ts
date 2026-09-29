import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { activities, serviceMessages, serviceOrders, services, stores, type ServiceOrderStatus, type Service } from "@/db/schema";
import { newId } from "@/lib/ids";
import { assertCanAccess, isMaster, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";

export type Audience = "lite" | "pro" | "supplier";

// ---------------------------------------------------------------------------
// Recomendação (pura): quais serviços mostrar primeiro, e por quê
// ---------------------------------------------------------------------------
export type RecommendationContext = {
  audience: Audience;
  offer?: "DROP_MANUAL" | "STORE_SUBDOMAIN" | "STORE_OWN";
  ordersLast30: number;
  activeProducts: number;
  hasLogo?: boolean;
  hasCustomDomain?: boolean;
  /** Serviços que o solicitante já pediu (não são recomendados de novo). */
  requested?: Set<string>;
  /** Fornecedor: quantos lojistas ativos na rede. */
  networkStores?: number;
};

export type Recommendation = { key: string; score: number; reason: string };

/** Regras simples e explicáveis; cada recomendação carrega o motivo exibido ao usuário. */
export function recommendServices(ctx: RecommendationContext, catalog: Pick<Service, "key" | "audience" | "active" | "upgradeOffer">[]): Recommendation[] {
  const has = new Set(catalog.filter((s) => s.active && s.audience.includes(ctx.audience)).map((s) => s.key));
  const out: Recommendation[] = [];
  const add = (key: string, score: number, reason: string) => { if (has.has(key) && !ctx.requested?.has(key)) out.push({ key, score, reason }); };

  if (ctx.audience === "lite" || ctx.audience === "pro") {
    if (ctx.offer === "DROP_MANUAL") {
      if (ctx.ordersLast30 >= 5) add("upgrade-loja-superdrop", 100, `Você fez ${ctx.ordersLast30} pedidos manuais em 30 dias. Uma vitrine própria vende sozinha enquanto você atende.`);
      else add("upgrade-loja-superdrop", 70, "Ative sua loja no subdomínio SuperDrop e receba pedidos sem depender do WhatsApp.");
    }
    if (ctx.offer === "STORE_SUBDOMAIN") {
      if (ctx.ordersLast30 >= 20) add("upgrade-loja-propria", 95, `Com ${ctx.ordersLast30} pedidos em 30 dias, vale ter domínio e marca próprios.`);
      else add("upgrade-loja-propria", 55, "Domínio próprio, analytics e templates premium para crescer.");
      if (!ctx.hasLogo) add("identidade-visual", 85, "Sua loja ainda não tem logo definida.");
    }
    if (ctx.offer === "STORE_OWN" && !ctx.hasCustomDomain) add("configuracao-profissional", 75, "Falta conectar o domínio próprio para publicar com a sua marca.");
    if (ctx.activeProducts < 10) add("fotos-catalogo", 40, "Poucos produtos ativos: mais catálogo aumenta a conversão.");
    if (ctx.ordersLast30 < 10) { add("trafego-pago", 80, "Poucas vendas recentes: anúncios trazem os primeiros pedidos mais rápido."); add("banners", 60, "Banners de campanha ajudam a divulgar a loja."); }
    else { add("automacao-whatsapp", 78, "Com esse volume, automatizar respostas e recuperar carrinhos rende vendas extras."); add("conteudo-redes", 65, "Conteúdo constante mantém a demanda."); }
    add("template-premium", ctx.offer === "STORE_OWN" ? 60 : 30, "Visual premium para aumentar o ticket médio.");
    add("suporte-premium", 20, "Atendimento prioritário com especialista dedicado.");
  } else {
    if ((ctx.networkStores ?? 0) < 5) add("captacao-lojistas", 95, `Sua rede tem ${ctx.networkStores ?? 0} loja(s). Cada nova loja rende 25% do setup para você.`);
    else add("captacao-lojistas", 60, "Continue crescendo a rede: 25% de cada setup fica com você.");
    if (ctx.activeProducts < 20) add("fotos-catalogo", 90, `Seu catálogo tem ${ctx.activeProducts} modelo(s). Boas fotos aumentam a venda em todas as lojas.`);
    else add("fotos-catalogo", 50, "Renove as fotos dos modelos mais vendidos.");
    add("treinamento-expedicao", 45, "Padronize a separação e reduza erros de envio.");
    add("suporte-premium", 20, "Atendimento prioritário com especialista dedicado.");
  }
  return out.sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// Pedidos de serviço
// ---------------------------------------------------------------------------
const requestSchema = z.object({ serviceId: z.string().min(1), briefing: z.string().trim().min(10, "Conte o que você precisa (mín. 10 caracteres)").max(2000) });

export async function requestService(db: Database, actor: Actor, raw: z.input<typeof requestSchema>) {
  const input = requestSchema.parse(raw);
  const isStore = actor.role === "STORE_OWNER" && actor.storeId;
  const isSupplier = actor.role === "SUPPLIER_ADMIN" && actor.supplierId;
  if (!isStore && !isSupplier) throw new ForbiddenError("Apenas lojistas e fornecedores contratam serviços.");
  const service = await db.query.services.findFirst({ where: eq(services.id, input.serviceId) });
  if (!service || !service.active) throw new NotFoundError("Serviço não encontrado.");
  if (isSupplier ? !service.audience.includes("supplier") : !(service.audience.includes("lite") || service.audience.includes("pro"))) throw new DomainError("NOT_FOR_YOU", "Este serviço não está disponível para o seu perfil.");
  const open = await db.select().from(serviceOrders).where(and(eq(serviceOrders.serviceId, service.id), isStore ? eq(serviceOrders.storeId, actor.storeId!) : eq(serviceOrders.supplierId, actor.supplierId!)));
  if (open.some((o) => !["DELIVERED", "CANCELED"].includes(o.status))) throw new DomainError("ALREADY_REQUESTED", "Você já tem um pedido em andamento para este serviço.");
  const id = newId("sor");
  await db.transaction(async (tx) => {
    await tx.insert(serviceOrders).values({ id, serviceId: service.id, requesterType: isStore ? "STORE" : "SUPPLIER", storeId: isStore ? actor.storeId : null, supplierId: isSupplier ? actor.supplierId : actor.supplierId ?? null, requesterUserId: actor.userId, briefing: input.briefing });
    await tx.insert(serviceMessages).values({ id: newId("smg"), serviceOrderId: id, authorRole: actor.role, authorUserId: actor.userId, body: input.briefing });
    await tx.insert(activities).values({ id: newId("act"), scope: "PLATFORM", storeId: isStore ? actor.storeId : null, supplierId: isSupplier ? actor.supplierId : null, type: "SERVICE_REQUESTED", message: `Novo pedido de serviço: ${service.name}` });
  });
  return { id };
}

async function loadServiceOrder(db: Database, actor: Actor, id: string) {
  const o = await db.query.serviceOrders.findFirst({ where: eq(serviceOrders.id, id) });
  if (!o) throw new NotFoundError("Pedido de serviço não encontrado.");
  if (!isMaster(actor)) {
    if (o.requesterType === "STORE") assertCanAccess(actor, { storeId: o.storeId });
    else if (actor.role !== "SUPPLIER_ADMIN" || actor.supplierId !== o.supplierId) throw new ForbiddenError();
  }
  return o;
}

export async function listServiceOrders(db: Database, actor: Actor) {
  const rows = await db.select({ order: serviceOrders, serviceName: services.name }).from(serviceOrders).innerJoin(services, eq(services.id, serviceOrders.serviceId)).orderBy(desc(serviceOrders.createdAt));
  if (isMaster(actor)) return rows;
  if (actor.role === "STORE_OWNER") return rows.filter((r) => r.order.storeId === actor.storeId);
  if (actor.role === "SUPPLIER_ADMIN") return rows.filter((r) => r.order.requesterType === "SUPPLIER" && r.order.supplierId === actor.supplierId);
  return [];
}

export async function getServiceOrder(db: Database, actor: Actor, id: string) {
  const order = await loadServiceOrder(db, actor, id);
  const messages = await db.select().from(serviceMessages).where(eq(serviceMessages.serviceOrderId, id)).orderBy(asc(serviceMessages.createdAt));
  const service = await db.query.services.findFirst({ where: eq(services.id, order.serviceId) });
  return { order, messages, service };
}

export async function postServiceMessage(db: Database, actor: Actor, id: string, body: string) {
  const text = z.string().trim().min(1, "Escreva a mensagem").max(2000).parse(body);
  const o = await loadServiceOrder(db, actor, id);
  if (o.status === "CANCELED" || o.status === "DELIVERED") throw new DomainError("CLOSED", "Este pedido já foi encerrado.");
  await db.insert(serviceMessages).values({ id: newId("smg"), serviceOrderId: id, authorRole: actor.role, authorUserId: actor.userId, body: text });
}

const NEXT: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  REQUESTED: ["IN_ANALYSIS", "QUOTED", "CANCELED"],
  IN_ANALYSIS: ["QUOTED", "CANCELED"],
  QUOTED: ["IN_PROGRESS", "CANCELED"],
  IN_PROGRESS: ["DELIVERED", "CANCELED"],
  DELIVERED: [],
  CANCELED: [],
};

/** Equipe NextLevel conduz o pedido; o solicitante só cancela antes de o trabalho começar. */
export async function advanceServiceOrder(db: Database, actor: Actor, id: string, next: ServiceOrderStatus, opts: { quotedCents?: number } = {}) {
  const o = await loadServiceOrder(db, actor, id);
  if (!isMaster(actor) && !(next === "CANCELED" && ["REQUESTED", "IN_ANALYSIS", "QUOTED"].includes(o.status))) throw new ForbiddenError("Apenas a NextLevel conduz o pedido.");
  if (!NEXT[o.status].includes(next)) throw new DomainError("INVALID_TRANSITION", `Transição ${o.status} → ${next} não permitida.`);
  if (next === "QUOTED" && (!opts.quotedCents || opts.quotedCents <= 0)) throw new DomainError("QUOTE_REQUIRED", "Informe o valor do orçamento.");
  await db.transaction(async (tx) => {
    await tx.update(serviceOrders).set({ status: next, quotedCents: opts.quotedCents ?? o.quotedCents, updatedAt: new Date().toISOString() }).where(eq(serviceOrders.id, id));
    await tx.insert(serviceMessages).values({ id: newId("smg"), serviceOrderId: id, authorRole: actor.role, authorUserId: actor.userId, body: `Status: ${next}${opts.quotedCents ? ` · orçamento ${(opts.quotedCents / 100).toFixed(2).replace(".", ",")}` : ""}` });
  });
}

export async function storeOfferOf(db: Database, storeId: string) {
  return (await db.query.stores.findFirst({ where: eq(stores.id, storeId) }))?.offer;
}

const serviceEditSchema = z.object({
  priceFromCents: z.number().int().nonnegative().max(100_000_00).optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  description: z.string().trim().min(10).max(400).optional(),
  deliveryDays: z.number().int().min(1).max(90).nullable().optional(),
});

/** Master edita a vitrine da Loja NextLevel: preço, destaque, ativação e prazo. */
export async function updateService(db: Database, actor: Actor, serviceId: string, raw: z.input<typeof serviceEditSchema>) {
  if (!isMaster(actor)) throw new ForbiddenError("Apenas a NextLevel edita o catálogo de serviços.");
  const patch = serviceEditSchema.parse(raw);
  const s = await db.query.services.findFirst({ where: eq(services.id, serviceId) });
  if (!s) throw new NotFoundError("Serviço não encontrado.");
  await db.update(services).set(patch).where(eq(services.id, serviceId));
}
