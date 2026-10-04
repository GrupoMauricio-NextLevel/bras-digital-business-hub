import { and, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import type { Database } from "@/db/client";
import { customers, marketingConsents, orders, storeCustomers } from "@/db/schema";
import { DomainError, NotFoundError } from "./errors";

/**
 * CRM básico por loja. O perfil (anotação, etiquetas, consentimento) é da loja: a mesma pessoa
 * em outra loja tem outro registro, e nenhuma função aqui lê ou grava dados de outra loja.
 */
export async function listStoreCustomers(db: Database, storeId: string, opts: { q?: string; tag?: string } = {}) {
  const rows = await db.select({ sc: storeCustomers, customer: customers }).from(storeCustomers).innerJoin(customers, eq(customers.id, storeCustomers.customerId)).where(eq(storeCustomers.storeId, storeId)).orderBy(desc(storeCustomers.lastOrderAt));
  const ids = rows.map((r) => r.sc.id);
  const consents = ids.length ? await db.select().from(marketingConsents).where(and(inArray(marketingConsents.storeCustomerId, ids), isNull(marketingConsents.revokedAt))) : [];
  const q = opts.q?.trim().toLowerCase();
  return rows
    .map((r) => ({ ...r, consents: consents.filter((c) => c.storeCustomerId === r.sc.id) }))
    .filter((r) => !q || r.customer.name.toLowerCase().includes(q) || r.customer.email.toLowerCase().includes(q) || (r.customer.phone ?? "").includes(q))
    .filter((r) => !opts.tag || r.sc.tags.includes(opts.tag));
}

async function owned(db: Database, storeId: string, storeCustomerId: string) {
  const row = await db.query.storeCustomers.findFirst({ where: and(eq(storeCustomers.id, storeCustomerId), eq(storeCustomers.storeId, storeId)) });
  if (!row) throw new NotFoundError("Cliente não encontrado.");
  return row;
}

/** Perfil + histórico de compras desta loja (pedidos cancelados não entram no histórico de compras). */
export async function getStoreCustomer(db: Database, storeId: string, storeCustomerId: string) {
  const sc = await owned(db, storeId, storeCustomerId);
  const customer = (await db.query.customers.findFirst({ where: eq(customers.id, sc.customerId) }))!;
  const consents = await db.select().from(marketingConsents).where(and(eq(marketingConsents.storeCustomerId, sc.id), isNull(marketingConsents.revokedAt)));
  const history = await db.select().from(orders).where(and(eq(orders.storeId, storeId), eq(orders.customerEmail, customer.email), ne(orders.status, "CANCELED"))).orderBy(desc(orders.createdAt)).limit(50);
  return { sc, customer, consents, history };
}

const cleanTags = (tags: string[]) => [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 10);

export async function updateStoreCustomerProfile(db: Database, storeId: string, storeCustomerId: string, input: { notes?: string | null; tags?: string[] }) {
  await owned(db, storeId, storeCustomerId);
  const notes = input.notes?.trim() ? input.notes.trim() : null;
  if (notes && notes.length > 1000) throw new DomainError("INVALID_NOTE", "A anotação pode ter no máximo 1000 caracteres.");
  const tags = cleanTags(input.tags ?? []);
  if (tags.some((t) => t.length > 24)) throw new DomainError("INVALID_TAG", "Cada etiqueta pode ter no máximo 24 letras.");
  await db.update(storeCustomers).set({ notes, tags }).where(eq(storeCustomers.id, storeCustomerId));
}

/** Revoga todos os consentimentos de marketing do cliente nesta loja (opt-out). */
export async function revokeMarketingConsents(db: Database, storeId: string, storeCustomerId: string): Promise<{ revoked: number }> {
  await owned(db, storeId, storeCustomerId);
  const done = await db.update(marketingConsents).set({ revokedAt: new Date().toISOString() }).where(and(eq(marketingConsents.storeCustomerId, storeCustomerId), isNull(marketingConsents.revokedAt))).returning({ id: marketingConsents.id });
  return { revoked: done.length };
}

export const csvCell = (v: string) => `"${(/^[=+\-@\t\r]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;

/**
 * Exporta os contatos que autorizaram marketing por e-mail ou WhatsApp. Quem não consentiu (ou revogou) não sai.
 * Células que começam com =, +, - ou @ são neutralizadas contra injeção de fórmula em planilhas.
 */
export async function exportConsentedContactsCsv(db: Database, storeId: string): Promise<string> {
  const rows = await listStoreCustomers(db, storeId);
  const lines = ["nome,email,telefone,canais,etiquetas"];
  for (const r of rows) {
    const channels = r.consents.map((c) => c.purpose).filter((p) => p === "EMAIL_MARKETING" || p === "WHATSAPP_MARKETING");
    if (!channels.length) continue;
    lines.push([r.customer.name, r.customer.email, r.customer.phone ?? "", channels.join(" "), r.sc.tags.join(" ")].map(csvCell).join(","));
  }
  return lines.join("\n") + "\n";
}
