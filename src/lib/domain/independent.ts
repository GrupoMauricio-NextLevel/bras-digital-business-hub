import { and, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { activities, networks, organizations, stores, supplierContracts, suppliers } from "@/db/schema";
import { BRAND_CODES, defaultBrandCode, type BrandCode } from "@/lib/brand";
import { newId, slugify } from "@/lib/ids";
import type { Actor } from "./access";
import { ForbiddenError } from "./errors";
import { ensureContract } from "./finance";

/**
 * Conta simples (D34): o lojista da NextLevel Commerce abre a loja sem fornecedor. Por baixo existe uma Central
 * oculta (supplier `hidden`) que só guarda catálogo, estoque e pedidos; o lojista nunca a vê, não paga taxa de
 * Central e não tem carteira (a loja nasce `SUPPLIER_OWN`, em que o custo do pedido é interno).
 * Dívida: o modelo geral `seller` (fase P6) substitui a Central oculta.
 */
export async function createHiddenCentral(db: Database, input: { name: string; brand?: (typeof BRAND_CODES)[number] }): Promise<{ supplierId: string }> {
  const base = slugify(input.name) || "loja";
  const suffix = newId().slice(0, 6);
  const orgId = newId("org");
  const supplierId = newId("sup");
  await db.insert(organizations).values({ id: orgId, name: `Central de ${input.name}`, slug: `c-${base}-${suffix}`, type: "SUPPLIER", brand: input.brand ?? defaultBrandCode() });
  await db.insert(suppliers).values({ id: supplierId, organizationId: orgId, name: input.name, slug: `c-${base}-${suffix}`, hidden: true, businessModel: "WHITE_LABEL", platformFeePercent: 0, setupFeeCents: 0 });
  await db.insert(networks).values({ id: newId("net"), supplierId, name: `Rede ${input.name}`, slug: `rede-c-${base}-${suffix}` });
  // Contrato zerado: a cobrança é só a do plano da loja (nenhuma taxa de Central nem comissão de canal).
  await ensureContract(db, supplierId);
  await db.update(supplierContracts).set({ monthlyFeeCents: 0, setupFeeCents: 0, volumeFeeBps: 0, minMonthlyFeeCents: 0, perOrderFeeCents: 0, storeSetupCommissionBps: 0 }).where(eq(supplierContracts.supplierId, supplierId));
  await db.insert(activities).values({ id: newId("act"), scope: "PLATFORM", supplierId, type: "HIDDEN_CENTRAL_CREATED", message: `Conta simples criada para ${input.name}` });
  return { supplierId };
}

/** Fornecedor (Central) por trás de uma loja, quando ela é independente (conta simples). */
export async function independentSupplierOfStore(db: Database, storeId: string | null | undefined): Promise<string | null> {
  if (!storeId) return null;
  const r = await db.select({ supplierId: suppliers.id }).from(stores).innerJoin(networks, eq(networks.id, stores.networkId)).innerJoin(suppliers, eq(suppliers.id, networks.supplierId)).where(and(eq(stores.id, storeId), eq(suppliers.hidden, true))).limit(1);
  return r[0]?.supplierId ?? null;
}

/** Central a que o ator pode dar manutenção no catálogo: a do fornecedor, ou a oculta do lojista independente. */
export async function catalogSupplierId(db: Database, actor: Actor): Promise<string> {
  if (actor.role === "SUPPLIER_ADMIN" && actor.supplierId) return actor.supplierId;
  if (actor.role === "STORE_OWNER") {
    const id = await independentSupplierOfStore(db, actor.storeId);
    if (id) return id;
  }
  throw new ForbiddenError("Ação disponível apenas para o fornecedor ou para a conta simples da loja.");
}

export type { BrandCode };
