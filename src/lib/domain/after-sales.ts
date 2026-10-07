import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { orderEvents, orderItems, orderLabelFiles, orders, stores } from "@/db/schema";
import { newId } from "@/lib/ids";
import { assertCanAccess, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";

export type AfterSalesStage = "AWAITING_CUSTOMER" | "AWAITING_FUNDS" | "AWAITING_LABEL" | "IN_DISPATCH" | "IN_TRANSIT" | "DELIVERED";
export const STAGE_ORDER: AfterSalesStage[] = ["AWAITING_CUSTOMER", "AWAITING_FUNDS", "AWAITING_LABEL", "IN_DISPATCH", "IN_TRANSIT", "DELIVERED"];
export const STAGE_LABEL: Record<AfterSalesStage, { title: string; hint: string }> = {
  AWAITING_CUSTOMER: { title: "Cliente ainda não pagou", hint: "Cobre o cliente pelo WhatsApp" },
  AWAITING_FUNDS: { title: "Aguardando recarga", hint: "Recarregue o saldo para liberar" },
  AWAITING_LABEL: { title: "Falta a etiqueta", hint: "Anexe o PDF da etiqueta" },
  IN_DISPATCH: { title: "Na Central", hint: "Separação e conferência" },
  IN_TRANSIT: { title: "A caminho do cliente", hint: "Enviado, acompanhe a entrega" },
  DELIVERED: { title: "Entregues (14 dias)", hint: "Peça uma avaliação" },
};

export type AfterSalesOrder = {
  id: string; number: number; stage: AfterSalesStage; customerName: string; customerPhone: string | null; customerEmail: string; city: string | null; state: string | null;
  createdAt: string; ageHours: number; items: { productName: string; label: string; quantity: number }[]; totalCents: number;
  tracking: { code: string; carrier: string | null } | null; attention: string | null; whatsappUrl: string | null; message: string;
  notes: { id: string; text: string; createdAt: string }[]; labelCount: number;
};

export function stageOf(o: { status: string; customerPaymentStatus: string }): AfterSalesStage | null {
  if (o.status === "CANCELED") return null;
  if (o.status === "PENDING") return "AWAITING_CUSTOMER";
  if (o.status === "AWAITING_CENTRAL_PAYMENT") return "AWAITING_FUNDS";
  if (o.status === "AWAITING_LABEL") return "AWAITING_LABEL";
  if (o.status === "READY_TO_PICK" || o.status === "PICKING" || o.status === "READY_TO_SHIP") return "IN_DISPATCH";
  if (o.status === "SHIPPED") return "IN_TRANSIT";
  if (o.status === "DELIVERED") return "DELIVERED";
  return null;
}

/** Alerta quando o pedido está parado além do razoável para o estágio. Puro. */
export function attentionFor(stage: AfterSalesStage, ageHours: number): string | null {
  if (stage === "AWAITING_CUSTOMER" && ageHours >= 24) return "Sem pagamento há mais de 24h";
  if (stage === "AWAITING_FUNDS") return ageHours >= 48 ? "Cancela sozinho em breve: recarregue" : "Recarregue para liberar o envio";
  if (stage === "AWAITING_LABEL" && ageHours >= 12) return "Etiqueta pendente há mais de 12h";
  if (stage === "IN_DISPATCH" && ageHours >= 48) return "Parado na Central há mais de 48h";
  if (stage === "IN_TRANSIT" && ageHours >= 24 * 7) return "Sem confirmação de entrega há mais de 7 dias";
  return null;
}

const digits = (p: string) => p.replace(/\D/g, "");
export function whatsappUrl(phone: string | null | undefined, text: string): string | null {
  if (!phone) return null;
  const d = digits(phone);
  if (d.length < 10) return null;
  return `https://wa.me/${d.length <= 11 ? `55${d}` : d}?text=${encodeURIComponent(text)}`;
}

/** Mensagem pronta (pt-BR) para o cliente, conforme o estágio. Pura. */
export function messageFor(stage: AfterSalesStage, o: { number: number; customerName: string; trackingCode?: string | null }, storeName: string): string {
  const first = o.customerName.split(" ")[0];
  switch (stage) {
    case "AWAITING_CUSTOMER": return `Olá ${first}, aqui é da ${storeName}. Seu pedido #${o.number} está reservado e aguardando o pagamento por Pix. Posso ajudar?`;
    case "AWAITING_FUNDS": case "AWAITING_LABEL": case "IN_DISPATCH": return `Olá ${first}, seu pedido #${o.number} da ${storeName} está sendo preparado. Assim que sair, aviso com o código de rastreio.`;
    case "IN_TRANSIT": return `Olá ${first}, seu pedido #${o.number} da ${storeName} já foi enviado${o.trackingCode ? `. Código de rastreio: ${o.trackingCode}` : ""}. Qualquer dúvida é só chamar.`;
    case "DELIVERED": return `Olá ${first}, seu pedido #${o.number} da ${storeName} foi entregue. Deu tudo certo? Sua opinião ajuda muito.`;
  }
}

export async function loadAfterSales(db: Database, actor: Actor, now = new Date()) {
  if (actor.role !== "STORE_OWNER" || !actor.storeId) throw new ForbiddenError("Área do lojista.");
  const store = await db.query.stores.findFirst({ where: eq(stores.id, actor.storeId) });
  if (!store) throw new NotFoundError("Loja não encontrada.");
  const since = new Date(now.getTime() - 14 * 86_400_000).toISOString();
  const rows = (await db.select().from(orders).where(eq(orders.storeId, store.id)).orderBy(desc(orders.createdAt)))
    .filter((o) => o.status !== "DELIVERED" || o.updatedAt >= since);
  const ids = rows.map((r) => r.id);
  const [items, events, labels] = ids.length ? await Promise.all([
    db.select().from(orderItems).where(inArray(orderItems.orderId, ids)),
    db.select().from(orderEvents).where(and(inArray(orderEvents.orderId, ids), eq(orderEvents.type, "NOTE"))).orderBy(desc(orderEvents.createdAt)),
    db.select({ orderId: orderLabelFiles.orderId, id: orderLabelFiles.id }).from(orderLabelFiles).where(inArray(orderLabelFiles.orderId, ids)),
  ]) : [[], [], []];
  const list: AfterSalesOrder[] = [];
  for (const o of rows) {
    const stage = stageOf(o);
    if (!stage) continue;
    const ageHours = Math.max(0, Math.floor((now.getTime() - new Date(o.createdAt).getTime()) / 3_600_000));
    const message = messageFor(stage, { number: o.number, customerName: o.customerName, trackingCode: o.shippingLabelCode }, store.name);
    list.push({
      id: o.id, number: o.number, stage, customerName: o.customerName, customerPhone: o.customerPhone, customerEmail: o.customerEmail, city: o.shippingCity, state: o.shippingState,
      createdAt: o.createdAt, ageHours, items: items.filter((i) => i.orderId === o.id).map((i) => ({ productName: i.productName, label: i.label, quantity: i.quantity })), totalCents: o.totalCents,
      tracking: o.shippingLabelCode && (stage === "IN_TRANSIT" || stage === "DELIVERED") ? { code: o.shippingLabelCode, carrier: o.shippingCarrier } : null,
      attention: attentionFor(stage, ageHours), whatsappUrl: whatsappUrl(o.customerPhone, message), message,
      notes: events.filter((e) => e.orderId === o.id).slice(0, 3).map((e) => ({ id: e.id, text: e.message, createdAt: e.createdAt })), labelCount: labels.filter((l) => l.orderId === o.id).length,
    });
  }
  const byStage = Object.fromEntries(STAGE_ORDER.map((s) => [s, list.filter((o) => o.stage === s)])) as Record<AfterSalesStage, AfterSalesOrder[]>;
  return { store: { name: store.name }, orders: list, byStage, summary: { inProgress: list.filter((o) => o.stage !== "DELIVERED").length, attention: list.filter((o) => o.attention).length, inTransit: byStage.IN_TRANSIT.length, delivered: byStage.DELIVERED.length } };
}

const noteSchema = z.string().trim().min(2, "Escreva a anotação").max(500, "Máximo de 500 caracteres");

/** Anotação de atendimento no histórico do pedido (visível ao lojista e à Central). */
export async function addOrderNote(db: Database, actor: Actor, orderId: string, raw: string) {
  if (actor.role !== "STORE_OWNER") throw new ForbiddenError("Apenas o lojista anota no pedido.");
  const text = noteSchema.parse(raw);
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) throw new NotFoundError("Pedido não encontrado.");
  assertCanAccess(actor, order);
  if (order.status === "CANCELED") throw new DomainError("ORDER_CANCELED", "Pedido cancelado.");
  await db.insert(orderEvents).values({ id: newId("evt"), orderId, type: "NOTE", message: text, actorRole: actor.role });
}

/** Fila de etiquetas do lojista: pedidos que esperam o PDF e os que já têm etiqueta e aguardam a separação. */
export async function labelQueue(db: Database, actor: Actor) {
  if (actor.role !== "STORE_OWNER" || !actor.storeId) throw new ForbiddenError("Área do lojista.");
  const rows = await db.select().from(orders).where(and(eq(orders.storeId, actor.storeId), inArray(orders.status, ["AWAITING_CENTRAL_PAYMENT", "AWAITING_LABEL", "READY_TO_PICK"]), gte(orders.createdAt, new Date(Date.now() - 60 * 86_400_000).toISOString()))).orderBy(orders.createdAt);
  const ids = rows.map((r) => r.id);
  const items = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];
  const labels = ids.length ? await db.select({ orderId: orderLabelFiles.orderId }).from(orderLabelFiles).where(inArray(orderLabelFiles.orderId, ids)) : [];
  return rows.map((o) => ({ order: o, items: items.filter((i) => i.orderId === o.id), labelCount: labels.filter((l) => l.orderId === o.id).length, ageHours: Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 3_600_000) }));
}
