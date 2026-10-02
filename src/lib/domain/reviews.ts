import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { orderItems, orders, productReviews, products } from "@/db/schema";
import { newId } from "@/lib/ids";
import { DomainError, NotFoundError } from "./errors";

const fold = (s: string) => s.trim().toLowerCase();

/** Pedido do cliente identificado por número + e-mail (mesma regra do acompanhamento). Só pedido pago, enviado/entregue e não cancelado pode avaliar. */
async function purchasedOrder(db: Database, storeId: string, input: { number: string; email: string }) {
  const num = Number(String(input.number).replace(/\D/g, ""));
  if (!Number.isInteger(num) || num <= 0 || !input.email.includes("@")) return null;
  const order = await db.query.orders.findFirst({ where: and(eq(orders.storeId, storeId), eq(orders.number, num), sql`lower(${orders.customerEmail}) = ${fold(input.email)}`) });
  if (!order || order.status === "CANCELED" || order.customerPaymentStatus !== "PAID" || !["SHIPPED", "DELIVERED"].includes(order.status)) return null;
  return order;
}

/** Produtos que o cliente já pode avaliar neste pedido (sem avaliação anterior). */
export async function reviewableItems(db: Database, storeId: string, input: { number: string; email: string }) {
  const order = await purchasedOrder(db, storeId, input);
  if (!order) return [];
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const done = new Set((await db.select({ p: productReviews.productId }).from(productReviews).where(eq(productReviews.orderId, order.id))).map((r) => r.p));
  const seen = new Set<string>();
  return items.flatMap((i) => (seen.has(i.productId) || done.has(i.productId) ? [] : (seen.add(i.productId), [{ productId: i.productId, name: i.productName }])));
}

const submitSchema = z.object({
  number: z.string().min(1), email: z.string().email(), productId: z.string().min(1),
  rating: z.number().int().min(1, "Escolha de 1 a 5 estrelas").max(5, "Escolha de 1 a 5 estrelas"),
  body: z.string().trim().max(500, "O comentário pode ter no máximo 500 caracteres").optional(),
});

/** Registra a avaliação como PENDENTE: só aparece na loja depois que o lojista aprovar. Uma por produto em cada pedido. */
export async function submitReview(db: Database, storeId: string, raw: z.input<typeof submitSchema>) {
  const d = submitSchema.parse(raw);
  const order = await purchasedOrder(db, storeId, d);
  if (!order) throw new DomainError("REVIEW_NOT_ALLOWED", "Só é possível avaliar depois que o pedido foi pago e enviado. Confira o número e o e-mail.");
  const bought = await db.query.orderItems.findFirst({ where: and(eq(orderItems.orderId, order.id), eq(orderItems.productId, d.productId)) });
  if (!bought) throw new DomainError("REVIEW_NOT_ALLOWED", "Este produto não faz parte do pedido.");
  const first = order.customerName.trim().split(/\s+/)[0] ?? "Cliente";
  try {
    await db.insert(productReviews).values({ id: newId("rev"), storeId, productId: d.productId, orderId: order.id, authorName: first, rating: d.rating, body: d.body || null });
  } catch {
    throw new DomainError("REVIEW_EXISTS", "Você já avaliou este produto neste pedido.");
  }
}

export async function approvedReviews(db: Database, storeId: string, productId: string) {
  const rows = await db.select().from(productReviews).where(and(eq(productReviews.storeId, storeId), eq(productReviews.productId, productId), eq(productReviews.status, "APPROVED"))).orderBy(desc(productReviews.createdAt)).limit(50);
  const count = rows.length;
  const avg = count ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
  return { count, avg, items: rows.map((r) => ({ id: r.id, author: r.authorName, rating: r.rating, body: r.body, createdAt: r.createdAt })) };
}

export async function listReviewsForStore(db: Database, storeId: string) {
  return db.select({ r: productReviews, productName: products.name }).from(productReviews).innerJoin(products, eq(products.id, productReviews.productId)).where(eq(productReviews.storeId, storeId)).orderBy(desc(productReviews.createdAt)).limit(200);
}

export async function moderateReview(db: Database, storeId: string, id: string, status: "APPROVED" | "REJECTED") {
  const done = await db.update(productReviews).set({ status }).where(and(eq(productReviews.id, id), eq(productReviews.storeId, storeId))).returning({ id: productReviews.id });
  if (done.length === 0) throw new NotFoundError("Avaliação não encontrada.");
}
