import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { orders, stores } from "@/db/schema";
import { isMaster, isSupplierSide, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { independentSupplierOfStore } from "./independent";
import { isBlocked } from "./store-access";

/**
 * Política de quem opera cada etapa de um pedido (Onda 1). Marca, cookie e flags do navegador NÃO decidem nada aqui:
 * a modalidade vem dos vínculos reais da loja no banco.
 *  - INDEPENDENT: conta simples (Central oculta); o próprio dono separa e envia.
 *  - SUPPLIER_OWN: loja própria de um fornecedor real; quem expede é o fornecedor.
 *  - NETWORK: loja parceira de uma rede (SuperDrop); quem expede é a Central.
 */
export type StoreModality = "INDEPENDENT" | "SUPPLIER_OWN" | "NETWORK";

export async function storeModality(db: Database, storeId: string): Promise<StoreModality> {
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  if (!store) throw new NotFoundError("Loja não encontrada.");
  if (await independentSupplierOfStore(db, storeId)) return "INDEPENDENT";
  return store.kind === "SUPPLIER_OWN" ? "SUPPLIER_OWN" : "NETWORK";
}

/** Verdadeiro se a loja é uma conta simples (independente). */
export const isIndependentStore = async (db: Database, storeId: string | null | undefined) => !!storeId && (await storeModality(db, storeId)) === "INDEPENDENT";

/**
 * Pode separar e enviar este pedido? Regra pura, útil também para a interface.
 * Master e fornecedor/expedição mantêm o que já tinham (o acesso ao pedido continua em `assertCanAccess`);
 * o dono da loja só ganha a capacidade quando a loja é independente e o pedido é da sua loja.
 */
export function canFulfilOrder(actor: Actor, order: { storeId: string; supplierId: string }, modality: StoreModality): boolean {
  if (isMaster(actor)) return true;
  if (isSupplierSide(actor)) return actor.supplierId === order.supplierId;
  if (actor.role === "STORE_OWNER") return modality === "INDEPENDENT" && actor.storeId === order.storeId;
  return false;
}

/** Garante a capacidade de expedir no servidor, com a mensagem certa para cada modalidade. */
export async function assertCanFulfilOrder(db: Database, actor: Actor, order: typeof orders.$inferSelect): Promise<StoreModality> {
  const modality = await storeModality(db, order.storeId);
  if (!canFulfilOrder(actor, order, modality)) {
    throw new ForbiddenError(actor.role === "STORE_OWNER" ? "A separação e o envio deste pedido são feitos pela Central do fornecedor." : undefined);
  }
  // Conta simples: a fonte financeira é o plano da própria loja (não a do fornecedor oculto, que não tem cobrança).
  if (modality === "INDEPENDENT" && actor.role === "STORE_OWNER") {
    const store = await db.query.stores.findFirst({ where: eq(stores.id, order.storeId) });
    if (store && isBlocked(store)) throw new DomainError("STORE_BLOCKED", "Expedição indisponível: o plano da sua loja está vencido. Regularize para continuar.");
  }
  return modality;
}

/**
 * Confirmação manual de recebimento só vale para pedido de pagamento manual (WhatsApp, Instagram, balcão, Pix combinado).
 * Pedido de gateway é confirmado exclusivamente pela consulta à API do provedor.
 */
export function assertManualPaymentConfirmable(order: Pick<typeof orders.$inferSelect, "paymentProvider" | "status" | "customerPaymentStatus">): void {
  if (order.paymentProvider === "MERCADO_PAGO") {
    throw new DomainError("GATEWAY_PAYMENT", "Este pedido é pago pelo Mercado Pago e é confirmado automaticamente pelo provedor. Use “Verificar pagamento”.");
  }
  if (order.paymentProvider !== "MANUAL") throw new DomainError("PAYMENT_NOT_MANUAL", "Este pedido não aceita confirmação manual de pagamento.");
  if (order.status === "CANCELED") throw new DomainError("ORDER_CANCELED", "Pedido cancelado.");
  if (order.customerPaymentStatus === "REFUNDED") throw new DomainError("PAYMENT_REFUNDED", "Pagamento estornado: crie uma nova venda.");
}
