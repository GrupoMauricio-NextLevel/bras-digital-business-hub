import type { OrderStatus } from "@/db/schema";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pendente",
  AWAITING_CENTRAL_PAYMENT: "Aguardando recarga",
  AWAITING_LABEL: "Aguardando etiqueta",
  READY_TO_PICK: "Pronto para separação",
  PICKING: "Em separação",
  READY_TO_SHIP: "Pronto para envio",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
};

export type StatusTone = "neutral" | "warning" | "info" | "success" | "danger";

export const ORDER_STATUS_TONE: Record<OrderStatus, StatusTone> = {
  PENDING: "neutral",
  AWAITING_CENTRAL_PAYMENT: "warning",
  AWAITING_LABEL: "warning",
  READY_TO_PICK: "info",
  PICKING: "info",
  READY_TO_SHIP: "info",
  SHIPPED: "success",
  DELIVERED: "success",
  CANCELED: "danger",
};

/** Transições operacionais permitidas (fornecedor/expedição). */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["AWAITING_CENTRAL_PAYMENT", "CANCELED"],
  AWAITING_CENTRAL_PAYMENT: ["AWAITING_LABEL", "READY_TO_PICK", "CANCELED"],
  AWAITING_LABEL: ["READY_TO_PICK", "CANCELED"],
  READY_TO_PICK: ["PICKING", "CANCELED"],
  PICKING: ["READY_TO_SHIP", "CANCELED"],
  READY_TO_SHIP: ["SHIPPED", "CANCELED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export const CANCELABLE: OrderStatus[] = ["PENDING", "AWAITING_CENTRAL_PAYMENT", "AWAITING_LABEL", "READY_TO_PICK", "PICKING", "READY_TO_SHIP"];

/**
 * Regra central do MVP: o pedido só fica pronto para separação quando
 * a Central foi paga E a etiqueta está pronta. Loja independente da E-commerce (D180): quem envia é o próprio
 * lojista, que separa antes e informa o rastreio ao marcar como enviado; a etiqueta não trava a separação
 * (`etiquetaAntes: false`). O SuperDrop continua exigindo a etiqueta, porque a Central imprime na expedição.
 */
export function resolveFulfillmentStatus(input: {
  status: OrderStatus;
  customerPaymentStatus: "PENDING" | "PAID" | "REFUNDED";
  centralPaymentStatus: "PENDING" | "PAID";
  shippingLabelStatus: "PENDING" | "READY";
}, opts: { etiquetaAntes?: boolean } = {}): OrderStatus {
  const { status } = input;
  const preFulfillment: OrderStatus[] = ["PENDING", "AWAITING_CENTRAL_PAYMENT", "AWAITING_LABEL"];
  if (!preFulfillment.includes(status)) return status;
  if (input.customerPaymentStatus !== "PAID") return "PENDING";
  if (input.centralPaymentStatus !== "PAID") return "AWAITING_CENTRAL_PAYMENT";
  if (input.shippingLabelStatus !== "READY" && opts.etiquetaAntes !== false) return "AWAITING_LABEL";
  return "READY_TO_PICK";
}

export const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  READY_TO_PICK: { label: "Iniciar separação", next: "PICKING" },
  PICKING: { label: "Concluir separação", next: "READY_TO_SHIP" },
  READY_TO_SHIP: { label: "Marcar como enviado", next: "SHIPPED" },
  SHIPPED: { label: "Marcar como entregue", next: "DELIVERED" },
};
