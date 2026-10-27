"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { addOrderNote, advanceOrder, cancelOrder, confirmCustomerPayment, createOrder, getOrderForActor, marcarEnviado, type CreateOrderInput, type envioSchema } from "@/lib/domain/orders";
import type { z } from "zod";
import { syncOrderPayment } from "@/lib/payments/service";
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

export async function confirmCustomerPaymentAction(orderId: string) {
  return runAction(async () => {
    const s = await actor();
    const r = await confirmCustomerPayment((await getDb()), s.actor, orderId);
    revalidateOrders();
    return { status: r.status };
  });
}


/** Consulta o Mercado Pago e confirma o pagamento se (e só se) o provedor confirmar. */
export async function syncOrderPaymentAction(orderId: string) {
  return runAction(async () => {
    const s = await actor();
    const db = await getDb();
    await getOrderForActor(db, s.actor, orderId); // isolamento: só quem enxerga o pedido
    const r = await syncOrderPayment(db, orderId);
    revalidateOrders();
    return { paid: r.paid };
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

/** Loja independente (D180): marca como enviado com a forma de envio e o código de rastreio. */
export async function marcarEnviadoAction(orderId: string, input: z.input<typeof envioSchema>) {
  return runAction(async () => {
    const s = await actor();
    const r = await marcarEnviado((await getDb()), s.actor, orderId, input);
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

/** Resumo do pedido para a gaveta de visualização rápida (só o que o ator pode ver). */
export async function orderQuickViewAction(orderId: string) {
  const s = await getSession();
  if (!s) return null;
  try {
    const db = await getDb();
    const { order, items, events } = await getOrderForActor(db, s.actor, orderId);
    const independente = (await (await import("@/lib/domain/order-policy")).storeModality(db, order.storeId)) === "INDEPENDENT";
    return { order, items, events: events.slice(0, 12), role: s.user.role, independente };
  } catch { return null; }
}

export async function addOrderNoteAction(orderId: string, text: string) {
  return runAction(async () => {
    const s = await actor();
    await addOrderNote(await getDb(), s.actor, orderId, text);
    revalidateOrders();
    return undefined;
  });
}

// ---------------------------------------------------------------------------
// Pedido na mesa (W1, D184)
// ---------------------------------------------------------------------------
export async function mudarSituacaoNaLinhaAction(orderId: string, para: OrderStatus) {
  return runAction(async () => {
    const s = await actor();
    const { mudarSituacaoNaLinha } = await import("@/lib/domain/pedido-mesa");
    const r = await mudarSituacaoNaLinha(await getDb(), s.actor, orderId, para);
    revalidateOrders();
    return { status: r.status };
  });
}

export async function marcarEstrelaAction(orderId: string, valor: boolean) {
  return runAction(async () => {
    const s = await actor();
    await (await import("@/lib/domain/pedido-mesa")).marcarEstrela(await getDb(), s.actor, orderId, valor);
    revalidatePath("/merchant/orders");
    return undefined;
  });
}

export async function marcarImpressoAction(orderId: string) {
  return runAction(async () => {
    const s = await actor();
    await (await import("@/lib/domain/pedido-mesa")).marcarImpresso(await getDb(), s.actor, orderId);
    revalidatePath("/merchant/orders");
    return undefined;
  });
}

export async function sinalizarFraudeAction(orderId: string, motivo: string | null) {
  return runAction(async () => {
    const s = await actor();
    const m = await import("@/lib/domain/pedido-mesa");
    if (motivo === null) await m.retirarFraude(await getDb(), s.actor, orderId);
    else await m.sinalizarFraude(await getDb(), s.actor, orderId, motivo);
    revalidateOrders();
    return undefined;
  });
}

export async function ajustarEnderecoAction(orderId: string, endereco: { address: string; city: string; state: string; zip: string }) {
  return runAction(async () => {
    const s = await actor();
    await (await import("@/lib/domain/pedido-mesa")).ajustarEnderecoDoPedido(await getDb(), s.actor, orderId, endereco);
    revalidateOrders();
    return undefined;
  });
}

/** "Compre junto" e dias de produção do produto (W3, D186). */
export async function salvarVendaJuntoAction(productId: string, input: { relatedIds: string[]; productionDays: number }) {
  return runAction(async () => {
    const s = await actor();
    await (await import("@/lib/domain/venda-junto")).salvarVendaJunto(await getDb(), s.actor, productId, input);
    revalidatePath(`/merchant/catalogo/${productId}`);
    return undefined;
  });
}
