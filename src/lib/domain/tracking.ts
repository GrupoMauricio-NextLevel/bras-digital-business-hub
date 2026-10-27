import { and, eq, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { orderEvents, orderItems, orders, type Order } from "@/db/schema";

/** Etapas da jornada do cliente final. Nada de custo, fornecedor ou termos internos. */
export const JOURNEY = ["RECEIVED", "PAID", "PREPARING", "SHIPPED", "DELIVERED"] as const;
export type JourneyStep = (typeof JOURNEY)[number];
export const JOURNEY_LABEL: Record<JourneyStep, { title: string; text: string }> = {
  RECEIVED: { title: "Pedido recebido", text: "Recebemos o seu pedido e reservamos os itens." },
  PAID: { title: "Pagamento confirmado", text: "O pagamento foi aprovado." },
  PREPARING: { title: "Preparando o envio", text: "Estamos separando e conferindo o seu pedido." },
  SHIPPED: { title: "Enviado", text: "O pedido saiu e está a caminho." },
  DELIVERED: { title: "Entregue", text: "O pedido chegou. Obrigado por comprar!" },
};

/** Etapa atual a partir do estado do pedido. Cancelado é tratado à parte. */
export function journeyStepOf(o: Pick<Order, "status" | "customerPaymentStatus">): JourneyStep {
  if (o.status === "DELIVERED") return "DELIVERED";
  if (o.status === "SHIPPED") return "SHIPPED";
  if (["READY_TO_PICK", "PICKING", "READY_TO_SHIP"].includes(o.status)) return "PREPARING";
  if (o.customerPaymentStatus === "PAID") return "PAID";
  return "RECEIVED";
}

export type TrackedOrder = {
  id: string; number: number; canceled: boolean; /** Valor devolvido ao cliente no cancelamento (D180). */ refunded: boolean; step: JourneyStep; stepIndex: number; createdAt: string;
  carrier: string | null; trackingCode: string | null; paid: boolean; totalCents: number;
  items: { name: string; label: string; quantity: number }[]; city: string; state: string;
  timeline: { at: string; title: string }[];
  /** Previsão de entrega da loja independente (D184): só enquanto não foi entregue. */
  expectedDeliveryAt: string | null;
};

const fold = (s: string) => s.trim().toLowerCase();

/**
 * Consulta pública de pedido: exige o número e o e-mail usados na compra (os dois batendo), da própria loja.
 * A resposta é a mesma para "não existe" e "e-mail diferente", para ninguém descobrir pedidos de outras pessoas.
 */
export async function trackOrder(db: Database, storeId: string, input: { number: string; email: string }): Promise<TrackedOrder | null> {
  const num = Number(String(input.number).replace(/\D/g, ""));
  if (!Number.isInteger(num) || num <= 0 || !input.email.includes("@")) return null;
  const order = await db.query.orders.findFirst({ where: and(eq(orders.storeId, storeId), eq(orders.number, num), sql`lower(${orders.customerEmail}) = ${fold(input.email)}`) });
  if (!order) return null;
  return toTracked(db, order);
}

/** Pedido já identificado (página de confirmação, cujo endereço tem o id aleatório do pedido). */
export async function toTracked(db: Database, order: Order): Promise<TrackedOrder> {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const events = await db.select().from(orderEvents).where(eq(orderEvents.orderId, order.id)).orderBy(orderEvents.createdAt);
  const step = journeyStepOf(order);
  const map: Record<string, string> = { CREATED: "Pedido recebido", CUSTOMER_PAID: "Pagamento confirmado", STATUS_PICKING: "Pedido em separação", STATUS_READY_TO_SHIP: "Pedido conferido e embalado", STATUS_SHIPPED: "Pedido enviado", STATUS_DELIVERED: "Pedido entregue", STATUS_CANCELED: "Pedido cancelado" };
  const seen = new Set<string>();
  const timeline = events.flatMap((e) => { const t = map[e.type]; if (!t || seen.has(t)) return []; seen.add(t); return [{ at: e.createdAt, title: t }]; });
  return {
    id: order.id, number: order.number, canceled: order.status === "CANCELED", refunded: order.customerPaymentStatus === "REFUNDED", step, stepIndex: JOURNEY.indexOf(step), createdAt: order.createdAt,
    carrier: order.status === "SHIPPED" || order.status === "DELIVERED" ? order.shippingCarrier : null, trackingCode: order.status === "SHIPPED" || order.status === "DELIVERED" ? order.shippingLabelCode : null,
    paid: order.customerPaymentStatus === "PAID", totalCents: order.totalCents,
    items: items.map((i) => ({ name: i.productName, label: i.label.split(" (")[0]!, quantity: i.quantity })), city: order.shippingCity ?? "", state: order.shippingState ?? "", timeline,
    expectedDeliveryAt: order.status !== "DELIVERED" && order.status !== "CANCELED" ? order.expectedDeliveryAt : null,
  };
}
