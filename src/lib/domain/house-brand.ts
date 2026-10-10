import { and, count, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { activities, networks, orders, organizationProducts, organizations, products, suppliers, userProductAccess, users } from "@/db/schema";
import { MEGATRON, isValidCnpj, type HouseBrand } from "@/lib/house-brand";
import type { ProductArea } from "@/lib/ecosystem";
import { newId } from "@/lib/ids";
import { generateTemporaryPassword, hashPassword } from "@/lib/security/password";
import { DomainError } from "./errors";
import { ensureContract, updateContract } from "./finance";
import type { Credentials } from "./provisioning";

/** A marca da casa opera como importadora no Brás Digital e como fornecedor no SuperDrop. */
export const HOUSE_BRAND_AREAS = ["BRAS_DIGITAL", "SUPERDROP"] as const satisfies readonly ProductArea[];

/** Empresa do próprio grupo: nenhuma taxa da plataforma (docs/PORTAL.md, item 2). */
const ZERO_FEES = { monthlyFeeCents: 0, setupFeeCents: 0, volumeFeeBps: 0, minMonthlyFeeCents: 0, perOrderFeeCents: 0, storeSetupCommissionBps: 0, notes: "Marca da casa: sem taxas da plataforma." };

export type HouseBrandRefs = { organizationId: string; supplierId: string; created: boolean };

/**
 * Garante a marca da casa no banco: organização com a ficha cadastral, fornecedor, rede,
 * contrato sem taxas e as áreas habilitadas. Idempotente; roda a cada deploy e no seed.
 * Se a organização já existe (pelo CNPJ ou pelo slug), só atualiza a ficha: taxas e status
 * já existentes são decisão do master e não são sobrescritos.
 */
export async function ensureHouseBrand(db: Database, brand: HouseBrand = MEGATRON): Promise<HouseBrandRefs> {
  if (!isValidCnpj(brand.taxId)) throw new DomainError("INVALID_TAX_ID", "CNPJ da marca da casa inválido.");
  const profile = {
    legalName: brand.legalName, tradeName: brand.tradeName, taxId: brand.taxId,
    stateRegistration: brand.stateRegistration, stateRegistrationUf: brand.stateRegistrationUf,
    foundedOn: brand.foundedOn, mainActivity: brand.mainActivity, registrationStatus: brand.registrationStatus,
    city: brand.city, state: brand.state, houseBrand: true,
  };

  return db.transaction(async (tx) => {
    let org = (await tx.query.organizations.findFirst({ where: eq(organizations.taxId, brand.taxId) }))
      ?? (await tx.query.organizations.findFirst({ where: eq(organizations.slug, brand.orgSlug) }));
    let created = false;
    if (org) {
      await tx.update(organizations).set(profile).where(eq(organizations.id, org.id));
    } else {
      const id = newId("org");
      await tx.insert(organizations).values({ id, name: brand.displayName, slug: brand.orgSlug, type: "SUPPLIER", ...profile });
      org = (await tx.query.organizations.findFirst({ where: eq(organizations.id, id) }))!;
      created = true;
    }

    let supplier = await tx.query.suppliers.findFirst({ where: eq(suppliers.organizationId, org.id) });
    if (!supplier) {
      const supplierId = newId("sup");
      await tx.insert(suppliers).values({ id: supplierId, organizationId: org.id, name: brand.displayName, slug: brand.supplierSlug, businessModel: "SUPERDROP", platformFeePercent: 0, setupFeeCents: 0, city: brand.city, state: brand.state });
      await tx.insert(networks).values({ id: newId("net"), supplierId, name: `Rede ${brand.displayName}`, slug: `rede-${brand.supplierSlug}` });
      await ensureContract(tx, supplierId);
      await updateContract(tx, supplierId, ZERO_FEES);
      await tx.insert(activities).values({ id: newId("act"), scope: "PLATFORM", supplierId, type: "SUPPLIER_CREATED", message: `Marca da casa ${brand.displayName} criada (${brand.legalName})` });
      supplier = (await tx.query.suppliers.findFirst({ where: eq(suppliers.id, supplierId) }))!;
      created = true;
    }

    for (const area of HOUSE_BRAND_AREAS) {
      await tx.insert(organizationProducts).values({ organizationId: org.id, area, status: "ACTIVE", config: { houseBrand: true } })
        .onConflictDoNothing();
    }
    return { organizationId: org.id, supplierId: supplier.id, created };
  });
}

export const houseBrandAdminSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  email: z.string().trim().email("E-mail inválido"),
});

/**
 * Cria um acesso de administrador da marca da casa com senha temporária (exibida uma vez).
 * O mesmo usuário opera a Mega Tron como importadora no Brás Digital e como fornecedor no SuperDrop.
 */
export async function createHouseBrandAdmin(db: Database, raw: z.input<typeof houseBrandAdminSchema>, brand: HouseBrand = MEGATRON): Promise<Credentials> {
  const input = houseBrandAdminSchema.parse(raw);
  const email = input.email.toLowerCase();
  if (await db.query.users.findFirst({ where: eq(users.email, email) })) throw new DomainError("EMAIL_TAKEN", "Já existe um usuário com este e-mail.");
  const refs = await ensureHouseBrand(db, brand);
  const temporaryPassword = generateTemporaryPassword();
  const userId = newId("usr");
  await db.transaction(async (tx) => {
    await tx.insert(users).values({ id: userId, name: input.name, email, role: "SUPPLIER_ADMIN", organizationId: refs.organizationId, supplierId: refs.supplierId, passwordHash: hashPassword(temporaryPassword), mustChangePassword: true });
    await tx.insert(userProductAccess).values(HOUSE_BRAND_AREAS.map((area) => ({ id: newId("upa"), userId, organizationId: refs.organizationId, area, role: "SUPPLIER_ADMIN" as const, supplierId: refs.supplierId, active: true })));
    await tx.insert(activities).values({ id: newId("act"), scope: "PLATFORM", supplierId: refs.supplierId, type: "USER_CREATED", message: `Acesso de ${input.name} criado na ${brand.displayName}` });
  });
  return { email, temporaryPassword };
}

/** Leitura do painel Mega Tron Master. */
export async function getHouseBrandOverview(db: Database, brand: HouseBrand = MEGATRON) {
  const org = await db.query.organizations.findFirst({ where: eq(organizations.taxId, brand.taxId) });
  if (!org) return null;
  const supplier = await db.query.suppliers.findFirst({ where: eq(suppliers.organizationId, org.id) });
  const areas = await db.select().from(organizationProducts).where(eq(organizationProducts.organizationId, org.id));
  const team = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, mustChangePassword: users.mustChangePassword, lastLoginAt: users.lastLoginAt })
    .from(users).where(eq(users.organizationId, org.id)).orderBy(users.createdAt);
  const grants = team.length
    ? await db.select({ userId: userProductAccess.userId, area: userProductAccess.area, role: userProductAccess.role })
      .from(userProductAccess).where(and(inArray(userProductAccess.userId, team.map((u) => u.id)), eq(userProductAccess.active, true)))
    : [];
  const productCount = supplier ? Number((await db.select({ n: count() }).from(products).where(eq(products.supplierId, supplier.id)))[0]?.n ?? 0) : 0;
  const orderCount = supplier ? Number((await db.select({ n: count() }).from(orders).where(eq(orders.supplierId, supplier.id)))[0]?.n ?? 0) : 0;
  return {
    org, supplier, areas, productCount, orderCount,
    team: team.map((u) => ({ ...u, areas: grants.filter((g) => g.userId === u.id).map((g) => g.area) })),
  };
}
