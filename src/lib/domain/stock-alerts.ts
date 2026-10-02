import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { productVariants, products, stockAlerts } from "@/db/schema";
import { newId } from "@/lib/ids";
import { DomainError, NotFoundError } from "./errors";
import { listStoreCatalog } from "./catalog";

const MAX_PER_CONTACT = 20;

/** E-mail ou WhatsApp (10 a 13 dígitos). Devolve o tipo e o valor normalizado. */
export function parseContact(raw: string): { kind: "EMAIL" | "WHATSAPP"; value: string } | null {
  const v = raw.trim();
  if (z.string().email().safeParse(v).success) return { kind: "EMAIL", value: v.toLowerCase() };
  const digits = v.replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 13) return { kind: "WHATSAPP", value: digits };
  return null;
}

/** Cliente pede aviso de um tamanho esgotado da loja. Só vale para variante realmente sem estoque e do catálogo da loja. */
export async function subscribeStockAlert(db: Database, storeId: string, input: { productId: string; variantId: string; contact: string }) {
  const c = parseContact(input.contact);
  if (!c) throw new DomainError("INVALID_CONTACT", "Informe um e-mail válido ou um WhatsApp com DDD.");
  const item = (await listStoreCatalog(db, storeId)).find((i) => i.product.id === input.productId);
  const variant = item?.variants.find((v) => v.id === input.variantId);
  if (!item || !variant) throw new NotFoundError("Produto indisponível.");
  if (variant.level.available > 0) throw new DomainError("IN_STOCK", "Este tamanho já está disponível. Pode comprar!");
  const mine = await db.select({ id: stockAlerts.id }).from(stockAlerts).where(and(eq(stockAlerts.storeId, storeId), eq(stockAlerts.contact, c.value)));
  if (mine.length >= MAX_PER_CONTACT) throw new DomainError("TOO_MANY", "Limite de avisos atingido para este contato.");
  const dup = await db.query.stockAlerts.findFirst({ where: and(eq(stockAlerts.storeId, storeId), eq(stockAlerts.variantId, variant.id), eq(stockAlerts.contact, c.value)) });
  if (dup) return { created: false as const };
  await db.insert(stockAlerts).values({ id: newId("sal"), storeId, productId: item.product.id, variantId: variant.id, contactKind: c.kind, contact: c.value });
  return { created: true as const };
}

/** Demanda por produto/tamanho para o lojista (inclui se já voltou ao estoque). Contatos ficam só no painel da própria loja. */
export async function stockDemand(db: Database, storeId: string) {
  const rows = await db.select({ a: stockAlerts, productName: products.name, size: productVariants.size }).from(stockAlerts).innerJoin(products, eq(products.id, stockAlerts.productId)).innerJoin(productVariants, eq(productVariants.id, stockAlerts.variantId)).where(and(eq(stockAlerts.storeId, storeId), isNull(stockAlerts.notifiedAt))).orderBy(desc(stockAlerts.createdAt));
  const catalog = await listStoreCatalog(db, storeId, { onlyActive: false });
  const availability = new Map(catalog.flatMap((i) => i.variants.map((v) => [v.id, v.level.available] as const)));
  const groups = new Map<string, { productName: string; size: string; variantId: string; available: number; contacts: { id: string; kind: "EMAIL" | "WHATSAPP"; contact: string }[] }>();
  for (const r of rows) {
    const g = groups.get(r.a.variantId) ?? { productName: r.productName, size: r.size, variantId: r.a.variantId, available: availability.get(r.a.variantId) ?? 0, contacts: [] };
    g.contacts.push({ id: r.a.id, kind: r.a.contactKind, contact: r.a.contact });
    groups.set(r.a.variantId, g);
  }
  return [...groups.values()].sort((a, b) => Number(b.available > 0) - Number(a.available > 0) || b.contacts.length - a.contacts.length);
}

/** Lojista marca os avisos de um tamanho como feitos (some da lista). */
export async function markAlertsNotified(db: Database, storeId: string, variantId: string) {
  const done = await db.update(stockAlerts).set({ notifiedAt: new Date().toISOString() }).where(and(eq(stockAlerts.storeId, storeId), eq(stockAlerts.variantId, variantId), isNull(stockAlerts.notifiedAt))).returning({ id: stockAlerts.id });
  if (done.length === 0) throw new NotFoundError("Nenhum aviso pendente para este tamanho.");
  return { marked: done.length };
}
