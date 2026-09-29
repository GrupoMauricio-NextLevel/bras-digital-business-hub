"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { advanceOrder, cancelOrder, confirmCentralPayment, confirmCustomerPayment, createOrder, registerShippingLabel, type CreateOrderInput } from "@/lib/domain/orders";
import type { OrderStatus } from "@/db/schema";

async function actor() {
  const session = await getSession();
  if (!session) throw new ForbiddenError("Sessão expirada.");
  return session;
}

function revalidateOrders() {
  revalidatePath("/merchant", "layout");
  revalidatePath("/supplier", "layout");
  revalidatePath("/master", "layout");
}

export async function confirmCentralPaymentAction(orderId: string) {
  return runAction(async () => {
    const s = await actor();
    const r = await confirmCentralPayment((await getDb()), s.actor, orderId);
    revalidateOrders();
    return { status: r.status };
  });
}

export async function confirmCustomerPaymentAction(orderId: string) {
  return runAction(async () => {
    const s = await actor();
    const r = await confirmCustomerPayment((await getDb()), s.actor, orderId);
    revalidateOrders();
    return { status: r.status };
  });
}

export async function registerLabelAction(orderId: string, input: { code: string; carrier: string }) {
  return runAction(async () => {
    const s = await actor();
    const r = await registerShippingLabel((await getDb()), s.actor, orderId, input);
    revalidateOrders();
    return { status: r.status };
  });
}

export async function advanceOrderAction(orderId: string, next: OrderStatus) {
  return runAction(async () => {
    const s = await actor();
    const r = await advanceOrder((await getDb()), s.actor, orderId, next);
    revalidateOrders();
    return { status: r.status };
  });
}

export async function cancelOrderAction(orderId: string) {
  return runAction(async () => {
    const s = await actor();
    await cancelOrder((await getDb()), s.actor, orderId);
    revalidateOrders();
    return undefined;
  });
}

/** Venda manual pelo painel do lojista. */
export async function createManualOrderAction(input: Omit<CreateOrderInput, "storeId">) {
  return runAction(async () => {
    const s = await actor();
    if (!s.store) throw new ForbiddenError("Apenas lojistas podem criar pedidos manuais.");
    const r = await createOrder((await getDb()), { ...input, storeId: s.store.id });
    revalidateOrders();
    return r;
  });
}
