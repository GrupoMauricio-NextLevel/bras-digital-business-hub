import { randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { orders, proposals, stores, type ProposalLine } from "@/db/schema";
import { newId } from "@/lib/ids";
import { DomainError, NotFoundError } from "./errors";
import { listStoreCatalog } from "./catalog";
import { createOrder, orderLineSchema } from "./orders";
import { z } from "zod";

const createSchema = z.object({
  customer: z.object({ name: z.string().min(2, "Informe o nome"), email: z.string().email("E-mail inválido"), phone: z.string().optional() }),
  items: z.array(orderLineSchema).min(1, "Adicione ao menos um item"),
  validDays: z.number().int().min(1).max(30).default(3),
});

/** Preço e descrição vêm SEMPRE do catálogo da loja no servidor (nunca do navegador). */
async function priceLines(db: Database, storeId: string, items: z.infer<typeof orderLineSchema>[]): Promise<ProposalLine[]> {
  const catalog = new Map((await listStoreCatalog(db, storeId)).map((c) => [c.product.id, c]));
  return items.map((l) => {
    const c = catalog.get(l.productId);
    if (!c) throw new DomainError("PRODUCT_NOT_AVAILABLE", "Produto não disponível para esta loja.");
    if (l.packId) {
      const pack = c.packs.find((p) => p.id === l.packId);
      if (!pack || !c.product.sellsPack) throw new DomainError("PACK_NOT_AVAILABLE", "Grade não disponível.");
      return { ...l, label: `${c.product.name} — ${pack.name}`, unitPriceCents: c.storeProduct.packPriceCents ?? pack.suggestedPriceCents };
    }
    const v = c.variants.find((x) => x.id === l.variantId);
    if (!v || !c.product.sellsUnit) throw new DomainError("VARIANT_NOT_AVAILABLE", "Tamanho não disponível.");
    return { ...l, label: `${c.product.name} — Tam. ${v.size}`, unitPriceCents: c.storeProduct.priceCents };
  });
}

export async function createProposal(db: Database, storeId: string, raw: z.input<typeof createSchema>, now = new Date()) {
  const input = createSchema.parse(raw);
  const items = await priceLines(db, storeId, input.items);
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(now.getTime() + input.validDays * 86_400_000).toISOString();
  const id = newId("prp");
  await db.insert(proposals).values({ id, storeId, token, customerName: input.customer.name, customerEmail: input.customer.email.toLowerCase(), customerPhone: input.customer.phone, items, subtotalCents: items.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0), expiresAt });
  return { id, token, expiresAt };
}

export async function listProposals(db: Database, storeId: string, now = new Date()) {
  const rows = await db.select().from(proposals).where(eq(proposals.storeId, storeId)).orderBy(desc(proposals.createdAt)).limit(100);
  return rows.map((p) => ({ ...p, expired: p.status === "OPEN" && new Date(p.expiresAt) <= now }));
}

export async function cancelProposal(db: Database, storeId: string, id: string) {
  const done = await db.update(proposals).set({ status: "CANCELED" }).where(and(eq(proposals.id, id), eq(proposals.storeId, storeId), eq(proposals.status, "OPEN"))).returning({ id: proposals.id });
  if (done.length === 0) throw new NotFoundError("Proposta não encontrada ou já finalizada.");
}

/** Leitura pública pelo link: só o necessário para o cliente (sem custos, sem dados de outras lojas). */
export async function getPublicProposal(db: Database, token: string, now = new Date()) {
  const p = await db.query.proposals.findFirst({ where: eq(proposals.token, token) });
  if (!p) return null;
  const store = await db.query.stores.findFirst({ where: eq(stores.id, p.storeId) });
  const expired = p.status === "OPEN" && new Date(p.expiresAt) <= now;
  return { proposal: p, storeName: store?.name ?? "", storeSlug: store?.slug ?? "", state: p.status === "OPEN" ? (expired ? ("EXPIRED" as const) : ("OPEN" as const)) : p.status };
}

/**
 * Cliente aceita a proposta: vira UM pedido. Idempotente (clique duplo, duas abas, retomada após erro):
 * a proposta é reservada com atualização condicional antes de criar o pedido e volta a ficar aberta se a criação falhar.
 */
export async function acceptProposal(db: Database, token: string, now = new Date()): Promise<{ orderId: string; number: number; created: boolean }> {
  const p = await db.query.proposals.findFirst({ where: eq(proposals.token, token) });
  if (!p) throw new NotFoundError("Proposta não encontrada.");
  if (p.status === "CANCELED") throw new DomainError("PROPOSAL_CANCELED", "Esta proposta foi cancelada pela loja.");
  if (p.status === "CONVERTED") return existing(db, p.orderId);
  if (new Date(p.expiresAt) <= now) throw new DomainError("PROPOSAL_EXPIRED", "Esta proposta expirou. Peça uma nova à loja.");
  const current = await priceLines(db, p.storeId, p.items.map(({ productId, variantId, packId, quantity }) => ({ productId, variantId, packId, quantity })));
  if (current.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0) !== p.subtotalCents) throw new DomainError("PROPOSAL_PRICE_CHANGED", "Os preços mudaram desde a proposta. Peça uma nova à loja.");

  const claimed = await db.update(proposals).set({ status: "CONVERTED" }).where(and(eq(proposals.id, p.id), eq(proposals.status, "OPEN"))).returning({ id: proposals.id });
  if (claimed.length === 0) {
    const again = await db.query.proposals.findFirst({ where: eq(proposals.id, p.id) });
    if (again?.status === "CONVERTED" && again.orderId) return existing(db, again.orderId);
    throw new DomainError("PROPOSAL_BUSY", "Esta proposta está sendo processada. Atualize a página em instantes.");
  }
  try {
    const r = await createOrder(db, { storeId: p.storeId, channel: "MANUAL", customer: { name: p.customerName, email: p.customerEmail, phone: p.customerPhone ?? undefined, marketingOptIn: false }, items: p.items.map(({ productId, variantId, packId, quantity }) => ({ productId, variantId, packId, quantity })), customerPaymentStatus: "PENDING", notes: "Origem: proposta comercial" }, { paymentProvider: "MANUAL", reservationMinutes: 60 * 24 });
    await db.update(proposals).set({ orderId: r.orderId }).where(eq(proposals.id, p.id));
    return { orderId: r.orderId, number: r.number, created: true };
  } catch (e) {
    await db.update(proposals).set({ status: "OPEN" }).where(eq(proposals.id, p.id));
    throw e;
  }
}

async function existing(db: Database, orderId: string | null) {
  const o = orderId ? await db.query.orders.findFirst({ where: eq(orders.id, orderId) }) : null;
  if (!o) throw new DomainError("PROPOSAL_BUSY", "Esta proposta está sendo processada. Atualize a página em instantes.");
  return { orderId: o.id, number: o.number, created: false };
}
