import { and, eq, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { orderEvents, orders, type OrderStatus } from "@/db/schema";
import { newId } from "@/lib/ids";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { assertCanAccess, type Actor } from "./access";
import { storeModality } from "./order-policy";
import { advanceOrder } from "./orders";
import { previsaoDeEntrega, proximaNaLinha } from "./pedido-mesa-regras";

export { PASSOS_NA_LINHA, previsaoDeEntrega, proximaNaLinha } from "./pedido-mesa-regras";

/**
 * Pedido na mesa (W1, D184): o lojista da Commerce resolve o pedido na própria lista. Mudar a situação na linha só
 * vale para loja independente e só para os passos que não pedem dados (o envio pede o rastreio e vai pela janela de
 * envio). Loja de rede do SuperDrop não muda situação pela lista: quem avança é a Central.
 */
async function pedidoDaLoja(db: Database, actor: Actor, orderId: string) {
  if (actor.role !== "STORE_OWNER") throw new ForbiddenError("Só a loja mexe no próprio pedido por aqui.");
  const o = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!o) throw new NotFoundError("Pedido não encontrado.");
  assertCanAccess(actor, o);
  return o;
}

async function evento(db: Database, orderId: string, type: string, message: string, actor: Actor) {
  await db.insert(orderEvents).values({ id: newId("evt"), orderId, type, message, actorRole: actor.role });
}

export async function mudarSituacaoNaLinha(db: Database, actor: Actor, orderId: string, para: OrderStatus) {
  const o = await pedidoDaLoja(db, actor, orderId);
  const independente = (await storeModality(db, o.storeId)) === "INDEPENDENT";
  if (!independente) throw new DomainError("NOT_ALLOWED", "Nesta loja quem avança o pedido é a Central do fornecedor.");
  if (o.status === para) return o;
  if (proximaNaLinha(o.status, true) !== para) throw new DomainError("INVALID_TRANSITION", "Esse passo não pode ser feito pela lista. Abra o pedido.");
  return advanceOrder(db, actor, orderId, para);
}

export async function marcarEstrela(db: Database, actor: Actor, orderId: string, valor: boolean) {
  const o = await pedidoDaLoja(db, actor, orderId);
  await db.update(orders).set({ starred: valor }).where(eq(orders.id, o.id));
}

/** Marca como impresso na primeira impressão (as seguintes não mudam a data). */
export async function marcarImpresso(db: Database, actor: Actor, orderId: string, agora = new Date()) {
  const o = await pedidoDaLoja(db, actor, orderId);
  await db.update(orders).set({ printedAt: agora.toISOString() }).where(and(eq(orders.id, o.id), isNull(orders.printedAt)));
}

const motivoSchema = z.string().trim().min(5, "Diga em poucas palavras por que suspeita (pelo menos 5 letras).").max(200);

/** Suspeita de fraude: guarda o motivo e segura o envio até a loja retirar a marcação. */
export async function sinalizarFraude(db: Database, actor: Actor, orderId: string, motivo: string) {
  const m = motivoSchema.parse(motivo);
  const o = await pedidoDaLoja(db, actor, orderId);
  if ((await storeModality(db, o.storeId)) !== "INDEPENDENT") throw new DomainError("NOT_ALLOWED", "Nesta loja a suspeita de fraude é tratada com a Central.");
  if (o.status === "SHIPPED" || o.status === "DELIVERED") throw new DomainError("ALREADY_SHIPPED", "O pedido já saiu para entrega.");
  await db.update(orders).set({ fraudFlag: m }).where(eq(orders.id, o.id));
  await evento(db, o.id, "FRAUD_FLAG", `Suspeita de fraude marcada pela loja: ${m}`, actor);
}

export async function retirarFraude(db: Database, actor: Actor, orderId: string) {
  const o = await pedidoDaLoja(db, actor, orderId);
  if (!o.fraudFlag) return;
  await db.update(orders).set({ fraudFlag: null }).where(eq(orders.id, o.id));
  await evento(db, o.id, "FRAUD_CLEARED", "Suspeita de fraude retirada pela loja.", actor);
}

export const enderecoSchema = z.object({
  address: z.string().trim().min(5, "Informe o endereço com número."),
  city: z.string().trim().min(2, "Informe a cidade."),
  state: z.string().trim().length(2, "Informe a UF com 2 letras.").transform((s) => s.toUpperCase()),
  zip: z.string().trim().regex(/^\d{5}-?\d{3}$/, "CEP inválido."),
});

/** Ajusta o endereço antes do envio (cliente errou o número, por exemplo). Fica no histórico com o antes e o depois. */
export async function ajustarEnderecoDoPedido(db: Database, actor: Actor, orderId: string, raw: z.input<typeof enderecoSchema>) {
  const v = enderecoSchema.parse(raw);
  const o = await pedidoDaLoja(db, actor, orderId);
  if ((await storeModality(db, o.storeId)) !== "INDEPENDENT") throw new DomainError("NOT_ALLOWED", "Nesta loja o endereço é ajustado com a Central.");
  if (["SHIPPED", "DELIVERED", "CANCELED"].includes(o.status)) throw new DomainError("ALREADY_SHIPPED", "O pedido já saiu ou foi cancelado; o endereço não muda mais.");
  const antes = [o.shippingAddress, o.shippingCity, o.shippingState, o.shippingZip].filter(Boolean).join(", ") || "sem endereço";
  const depois = `${v.address}, ${v.city}, ${v.state}, ${v.zip}`;
  await db.update(orders).set({ shippingAddress: v.address, shippingCity: v.city, shippingState: v.state, shippingZip: v.zip, updatedAt: new Date().toISOString() })
    .where(and(eq(orders.id, o.id), ne(orders.status, "SHIPPED")));
  await evento(db, o.id, "ADDRESS_CHANGED", `Endereço ajustado pela loja. Antes: ${antes}. Agora: ${depois}.`, actor);
}

/** Grava a previsão quando o pedido de loja independente fica pago (o SuperDrop não muda). */
export async function gravarPrevisaoDeEntrega(db: Database, orderId: string, agora = new Date()) {
  const o = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!o || o.expectedDeliveryAt || o.customerPaymentStatus !== "PAID") return;
  if ((await storeModality(db, o.storeId)) !== "INDEPENDENT") return;
  const producao = await (await import("./venda-junto")).diasDeProducaoDoPedido(db, o.storeId, o.id);
  const p = previsaoDeEntrega(agora, o.shippingDays, producao);
  if (p) await db.update(orders).set({ expectedDeliveryAt: p.toISOString() }).where(eq(orders.id, o.id));
}
