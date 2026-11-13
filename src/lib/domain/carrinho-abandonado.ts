import { randomBytes } from "node:crypto";
import { and, eq, gte, isNotNull, isNull, lte, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { abandonedCarts, orders, organizations, stores } from "@/db/schema";
import { newId } from "@/lib/ids";
import { appUrl, emails, sendEmail } from "@/lib/email";
import { listStoreCatalog } from "./catalog";
import { storeModality } from "./order-policy";

/**
 * Carrinho abandonado (W3, D186), só por e-mail na primeira versão (decisão 3 de D182):
 * - o carrinho só é guardado com o "sim" do cliente no checkout (consentimento explícito);
 * - lembretes 1 h e 24 h depois da última mexida; param quando vira pedido, quando o cliente sai da lista ou no 2º;
 * - o link refaz o carrinho com o preço e o estoque de AGORA (nunca o preço guardado);
 * - só na loja independente da Commerce (o SuperDrop não muda).
 */
export const LEMBRETE_1_MIN = 60;
export const LEMBRETE_2_MIN = 24 * 60;

const salvarSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().max(80).optional(),
  consent: z.literal(true),
  items: z.array(z.object({ productId: z.string().min(1), variantId: z.string().optional(), packId: z.string().optional(), quantity: z.number().int().min(1).max(999) })).min(1).max(50),
});

/** Guarda ou atualiza o carrinho aberto deste e-mail na loja. Sem consentimento ou loja de rede: não guarda nada. */
export async function salvarCarrinho(db: Database, storeId: string, raw: unknown, agora = new Date()): Promise<{ salvo: boolean }> {
  const p = salvarSchema.safeParse(raw);
  if (!p.success) return { salvo: false };
  if ((await storeModality(db, storeId)) !== "INDEPENDENT") return { salvo: false };
  const v = p.data;
  const aberto = await db.query.abandonedCarts.findFirst({ where: and(eq(abandonedCarts.storeId, storeId), eq(abandonedCarts.email, v.email), isNull(abandonedCarts.recoveredOrderId)) });
  if (aberto?.optedOutAt) return { salvo: false };
  if (aberto) {
    await db.update(abandonedCarts).set({ items: v.items, name: v.name ?? aberto.name, updatedAt: agora.toISOString() }).where(eq(abandonedCarts.id, aberto.id));
  } else {
    await db.insert(abandonedCarts).values({ id: newId("cart"), storeId, email: v.email, name: v.name ?? null, items: v.items, token: randomBytes(18).toString("base64url"), createdAt: agora.toISOString(), updatedAt: agora.toISOString() });
  }
  return { salvo: true };
}

/** O pedido saiu: o carrinho aberto daquele e-mail vira "recuperado" e para de receber lembrete. */
export async function marcarCarrinhoRecuperado(db: Database, storeId: string, email: string, orderId: string) {
  await db.update(abandonedCarts).set({ recoveredOrderId: orderId }).where(and(eq(abandonedCarts.storeId, storeId), eq(abandonedCarts.email, email.trim().toLowerCase()), isNull(abandonedCarts.recoveredOrderId)));
}

export async function sairDosLembretes(db: Database, token: string, agora = new Date()) {
  const r = await db.update(abandonedCarts).set({ optedOutAt: agora.toISOString() }).where(eq(abandonedCarts.token, token)).returning({ id: abandonedCarts.id });
  return r.length > 0;
}

/** Rotina (a cada 5 a 10 minutos): manda o 1º e o 2º lembrete na hora certa. Envio único por carrinho e lembrete. */
export async function lembrarCarrinhos(db: Database, agora = new Date()): Promise<{ primeiro: number; segundo: number }> {
  const ate1 = new Date(agora.getTime() - LEMBRETE_1_MIN * 60_000).toISOString();
  const ate2 = new Date(agora.getTime() - LEMBRETE_2_MIN * 60_000).toISOString();
  const base = and(isNull(abandonedCarts.recoveredOrderId), isNull(abandonedCarts.optedOutAt), isNull(abandonedCarts.remindedAt2));
  const lista = await db.select({ c: abandonedCarts, slug: stores.slug, loja: stores.name, brand: organizations.brand })
    .from(abandonedCarts).innerJoin(stores, eq(stores.id, abandonedCarts.storeId)).innerJoin(organizations, eq(organizations.id, stores.organizationId))
    .where(and(base, lte(abandonedCarts.updatedAt, ate1))).limit(200);
  let primeiro = 0, segundo = 0;
  for (const { c, slug, loja, brand } of lista) {
    const qual = !c.remindedAt1 ? 1 : c.updatedAt <= ate2 ? 2 : 0;
    if (!qual) continue;
    const site = appUrl(brand);
    const m = emails.abandonedCart(loja, c.name, qual, `${site}/store/${slug}/carrinho/voltar/${c.token}`, `${site}/store/${slug}/carrinho/sair/${c.token}`);
    await sendEmail(db, { kind: "ABANDONED_CART", to: c.email, brand, dedupeKey: `carrinho:${c.id}:${qual}`, ...m });
    await db.update(abandonedCarts).set(qual === 1 ? { remindedAt1: agora.toISOString() } : { remindedAt2: agora.toISOString() }).where(eq(abandonedCarts.id, c.id));
    if (qual === 1) primeiro++; else segundo++;
  }
  return { primeiro, segundo };
}

export type LinhaDoCarrinho = { key: string; productId: string; variantId?: string; packId?: string; name: string; label: string; unitPriceCents: number; quantity: number; images: string[]; max: number; tiers?: { minQty: number; priceCents: number }[] };

/** Refaz o carrinho pelo link do e-mail: preço e estoque atuais; o que acabou fica de fora. */
export async function refazerCarrinho(db: Database, token: string): Promise<{ storeId: string; linhas: LinhaDoCarrinho[] } | null> {
  const c = await db.query.abandonedCarts.findFirst({ where: eq(abandonedCarts.token, token) });
  if (!c) return null;
  const cat = new Map((await listStoreCatalog(db, c.storeId)).map((x) => [x.product.id, x]));
  const linhas: LinhaDoCarrinho[] = [];
  for (const it of c.items) {
    const x = cat.get(it.productId);
    if (!x || !x.storeProduct.active) continue;
    const key = `${it.productId}:${it.variantId ?? ""}:${it.packId ?? ""}`;
    if (it.packId) {
      const pack = x.packs.find((pk) => pk.id === it.packId);
      if (!pack || pack.available < 1) continue;
      linhas.push({ key, productId: it.productId, packId: it.packId, name: x.product.name, label: `${pack.name} (${pack.items.map((i) => `${i.size}:${i.quantity}`).join(" ")})`, unitPriceCents: x.storeProduct.packPriceCents ?? pack.suggestedPriceCents, quantity: Math.min(it.quantity, pack.available), images: x.product.images, max: pack.available });
    } else {
      const v = x.variants.find((vv) => vv.id === it.variantId);
      if (!v || v.level.available < 1) continue;
      linhas.push({ key, productId: it.productId, variantId: it.variantId, name: x.product.name, label: `Tam. ${v.size}`, unitPriceCents: x.storeProduct.priceCents, quantity: Math.min(it.quantity, v.level.available), images: x.product.images, max: v.level.available, tiers: x.tiers });
    }
  }
  return { storeId: c.storeId, linhas };
}

/** Painel do lojista: carrinhos guardados, lembrados e que voltaram como pedido pago nos últimos N dias. */
export async function resumoCarrinhos(db: Database, storeId: string, dias = 30, agora = new Date()) {
  const desde = new Date(agora.getTime() - dias * 86_400_000).toISOString();
  const onde = and(eq(abandonedCarts.storeId, storeId), gte(abandonedCarts.createdAt, desde));
  const [g] = await db.select({
    guardados: sql<number>`count(*)::int`,
    lembrados: sql<number>`count(${abandonedCarts.remindedAt1})::int`,
  }).from(abandonedCarts).where(onde);
  const [r] = await db.select({ n: sql<number>`count(*)::int`, valor: sql<number>`coalesce(sum(${orders.subtotalCents} - ${orders.discountCents}), 0)::int` })
    .from(abandonedCarts).innerJoin(orders, eq(orders.id, abandonedCarts.recoveredOrderId))
    .where(and(onde, isNotNull(abandonedCarts.remindedAt1), eq(orders.customerPaymentStatus, "PAID")));
  return { guardados: Number(g?.guardados ?? 0), lembrados: Number(g?.lembrados ?? 0), voltaram: Number(r?.n ?? 0), valorCents: Number(r?.valor ?? 0) };
}
