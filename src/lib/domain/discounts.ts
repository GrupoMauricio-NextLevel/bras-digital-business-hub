import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { storeDiscounts } from "@/db/schema";
import { newId } from "@/lib/ids";
import { DomainError, NotFoundError } from "./errors";
import { storeModality } from "./order-policy";

/**
 * Cupom de desconto do consumidor, por loja. Regras de segurança:
 *  - nunca deixa o subtotal abaixo do custo dos produtos (sem venda no prejuízo);
 *  - não vale em loja de rede (SuperDrop), onde o fornecedor define o preço mínimo;
 *  - uso limitado é contado com atualização condicional (duas compras simultâneas não passam do limite).
 */
const schema = z.object({
  code: z.string().trim().min(3, "Código com no mínimo 3 caracteres").max(24, "Código com no máximo 24 caracteres").regex(/^[A-Za-z0-9_-]+$/, "Use só letras, números, - e _"),
  kind: z.enum(["PERCENT", "FIXED"]),
  value: z.number().int().positive("Informe o valor do desconto"),
  minSubtotalCents: z.number().int().nonnegative().default(0),
  maxRedemptions: z.number().int().positive().nullable().optional(),
  startsAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
});
export const normalizeCode = (c: string) => c.trim().toUpperCase();

export async function createDiscount(db: Database, storeId: string, raw: z.input<typeof schema>) {
  const d = schema.parse(raw);
  if (d.kind === "PERCENT" && d.value > 90) throw new DomainError("INVALID_DISCOUNT", "O desconto percentual vai de 1% a 90%.");
  if ((await storeModality(db, storeId)) === "NETWORK") throw new DomainError("DISCOUNT_NOT_ALLOWED", "Cupons de desconto não estão disponíveis para lojas de rede.");
  const code = normalizeCode(d.code);
  if (await db.query.storeDiscounts.findFirst({ where: and(eq(storeDiscounts.storeId, storeId), eq(storeDiscounts.code, code)) })) throw new DomainError("DISCOUNT_EXISTS", "Já existe um cupom com esse código.");
  const iso = (v?: string | null) => (v ? new Date(v).toISOString() : null);
  const startsAt = iso(d.startsAt), expiresAt = iso(d.expiresAt);
  if (startsAt && expiresAt && expiresAt <= startsAt) throw new DomainError("INVALID_PERIOD", "O fim precisa ser depois do início.");
  const id = newId("dsc");
  await db.insert(storeDiscounts).values({ id, storeId, code, kind: d.kind, value: d.value, minSubtotalCents: d.minSubtotalCents, maxRedemptions: d.maxRedemptions ?? null, startsAt, expiresAt });
  return { id };
}

export async function listDiscounts(db: Database, storeId: string) {
  return db.select().from(storeDiscounts).where(eq(storeDiscounts.storeId, storeId)).orderBy(desc(storeDiscounts.createdAt));
}

export async function setDiscountActive(db: Database, storeId: string, id: string, active: boolean) {
  const done = await db.update(storeDiscounts).set({ active }).where(and(eq(storeDiscounts.id, id), eq(storeDiscounts.storeId, storeId))).returning({ id: storeDiscounts.id });
  if (done.length === 0) throw new NotFoundError("Cupom não encontrado.");
}

export type AppliedDiscount = { id: string; code: string; cents: number };

/** Valida o código e calcula o desconto. Não consome o uso (isso é feito em `redeemDiscount`, dentro da transação do pedido). */
export async function priceDiscount(db: Database, storeId: string, rawCode: string, subtotalCents: number, costTotalCents: number | null, now = new Date()): Promise<AppliedDiscount> {
  const code = normalizeCode(rawCode);
  const d = await db.query.storeDiscounts.findFirst({ where: and(eq(storeDiscounts.storeId, storeId), eq(storeDiscounts.code, code)) });
  const invalid = () => new DomainError("DISCOUNT_INVALID", "Cupom inválido ou indisponível.");
  if (!d || !d.active) throw invalid();
  const iso = now.toISOString();
  if ((d.startsAt && d.startsAt > iso) || (d.expiresAt && d.expiresAt <= iso)) throw new DomainError("DISCOUNT_EXPIRED", "Este cupom não está no prazo de validade.");
  if (d.maxRedemptions !== null && d.redemptions >= d.maxRedemptions) throw new DomainError("DISCOUNT_EXHAUSTED", "Este cupom já atingiu o limite de usos.");
  if (subtotalCents < d.minSubtotalCents) throw new DomainError("DISCOUNT_MIN", "O pedido não atingiu o valor mínimo deste cupom.");
  if ((await storeModality(db, storeId)) === "NETWORK") throw invalid();
  let cents = d.kind === "PERCENT" ? Math.floor((subtotalCents * d.value) / 100) : Math.min(d.value, subtotalCents);
  if (costTotalCents !== null) cents = Math.min(cents, Math.max(0, subtotalCents - costTotalCents)); // nunca abaixo do custo
  if (cents <= 0) throw new DomainError("DISCOUNT_NO_EFFECT", "Este cupom não gera desconto para este pedido.");
  return { id: d.id, code: d.code, cents };
}

/** Consome um uso, de forma atômica. Chame dentro da transação que cria o pedido. */
export async function redeemDiscount(db: Database, id: string): Promise<void> {
  const done = await db.update(storeDiscounts).set({ redemptions: sql`${storeDiscounts.redemptions} + 1` }).where(and(eq(storeDiscounts.id, id), eq(storeDiscounts.active, true), sql`(${storeDiscounts.maxRedemptions} is null or ${storeDiscounts.redemptions} < ${storeDiscounts.maxRedemptions})`)).returning({ id: storeDiscounts.id });
  if (done.length === 0) throw new DomainError("DISCOUNT_EXHAUSTED", "Este cupom já atingiu o limite de usos.");
}

/** Devolve o uso quando o pedido é cancelado/expira sem pagamento. */
export async function releaseDiscount(db: Database, id: string | null | undefined): Promise<void> {
  if (!id) return;
  await db.update(storeDiscounts).set({ redemptions: sql`greatest(${storeDiscounts.redemptions} - 1, 0)` }).where(eq(storeDiscounts.id, id));
}
