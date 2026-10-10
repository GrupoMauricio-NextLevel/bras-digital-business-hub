import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { createDatabase, type Database } from "@/db/client";
import { runMigrations } from "@/db/migrate";
import { bootstrapDatabase } from "@/db/bootstrap-data";
import { organizationProducts, organizations, supplierContracts, suppliers, userProductAccess, users } from "@/db/schema";
import { createHouseBrandAdmin, ensureHouseBrand, getHouseBrandOverview } from "@/lib/domain/house-brand";
import { MEGATRON, formatCnpj, formatDateBr, isValidCnpj } from "@/lib/house-brand";
import { actorFromUser, canAccessArea, requireSupplierId } from "@/lib/domain/access";
import { verifyPassword } from "@/lib/security/password";

async function productionDb(): Promise<Database> {
  const { db } = await createDatabase("pglite://memory");
  await runMigrations(db);
  await bootstrapDatabase(db, { seedDemo: false });
  return db;
}

describe("ficha da Mega Tron", () => {
  it("tem CNPJ válido e formata como no cartão do CNPJ", () => {
    expect(isValidCnpj(MEGATRON.taxId)).toBe(true);
    expect(formatCnpj(MEGATRON.taxId)).toBe("50.922.728/0001-49");
    expect(formatDateBr(MEGATRON.foundedOn)).toBe("02/06/2023");
  });
  it("rejeita CNPJ com dígito errado ou repetido", () => {
    expect(isValidCnpj("50.922.728/0001-48")).toBe(false);
    expect(isValidCnpj("11111111111111")).toBe(false);
  });
});

describe("marca da casa no banco", () => {
  it("o bootstrap de produção cria a Mega Tron com a ficha completa, sem taxas e sem usuários; é idempotente", async () => {
    const db = await productionDb();
    const org = await db.query.organizations.findFirst({ where: eq(organizations.taxId, MEGATRON.taxId) });
    expect(org).toMatchObject({ legalName: "MEGA TRON COMERCIO ELETRONICO LTDA - ME", tradeName: "MEGA TRON BRASIL", stateRegistration: "121.681.071.11", stateRegistrationUf: "SP", foundedOn: "2023-06-02", city: "São Paulo", state: "SP", registrationStatus: "Ativa", houseBrand: true, type: "SUPPLIER" });
    const sup = await db.query.suppliers.findFirst({ where: eq(suppliers.organizationId, org!.id) });
    expect(sup).toMatchObject({ name: "Mega Tron", slug: "megatron", platformFeePercent: 0, setupFeeCents: 0 });
    const contract = await db.query.supplierContracts.findFirst({ where: eq(supplierContracts.supplierId, sup!.id) });
    expect(contract).toMatchObject({ monthlyFeeCents: 0, setupFeeCents: 0, volumeFeeBps: 0, minMonthlyFeeCents: 0, perOrderFeeCents: 0 });
    const areas = (await db.select().from(organizationProducts).where(eq(organizationProducts.organizationId, org!.id))).map((a) => a.area).sort();
    expect(areas).toEqual(["BRAS_DIGITAL", "SUPERDROP"]);
    expect(await db.select().from(users).where(eq(users.organizationId, org!.id))).toHaveLength(0);

    await bootstrapDatabase(db, { seedDemo: false });
    expect(await db.select().from(organizations).where(eq(organizations.taxId, MEGATRON.taxId))).toHaveLength(1);
    expect(await db.select().from(suppliers).where(eq(suppliers.organizationId, org!.id))).toHaveLength(1);
  });

  it("acesso da equipe nasce com senha temporária e opera a Mega Tron no Brás Digital e no SuperDrop", async () => {
    const db = await productionDb();
    const cred = await createHouseBrandAdmin(db, { name: "Equipe Mega Tron", email: "Operacao@MegaTron.com.br" });
    expect(cred.email).toBe("operacao@megatron.com.br");
    const user = (await db.query.users.findFirst({ where: eq(users.email, cred.email) }))!;
    expect(user.mustChangePassword).toBe(true);
    expect(verifyPassword(cred.temporaryPassword, user.passwordHash)).toBe(true);

    const grants = (await db.select().from(userProductAccess).where(eq(userProductAccess.userId, user.id)))
      .map((g) => ({ area: g.area, role: g.role, organizationId: g.organizationId, supplierId: g.supplierId, active: g.active }));
    const actor = actorFromUser(user, grants);
    expect(canAccessArea(actor, "BRAS_DIGITAL")).toBe(true);
    expect(canAccessArea(actor, "SUPERDROP")).toBe(true);
    expect(canAccessArea(actor, "CHINA_HUB")).toBe(false);
    expect(requireSupplierId(actor)).toBe(user.supplierId);

    await expect(createHouseBrandAdmin(db, { name: "Outro", email: "operacao@megatron.com.br" })).rejects.toThrow(/Já existe/);
    const overview = await getHouseBrandOverview(db);
    expect(overview?.team).toHaveLength(1);
    expect(overview?.team[0]?.areas.sort()).toEqual(["BRAS_DIGITAL", "SUPERDROP"]);
  });

  it("na demonstração, a Mega Tron da vitrine recebe a ficha real sem perder a operação nem as taxas", async () => {
    const { db } = await createDatabase("pglite://memory");
    await runMigrations(db);
    await bootstrapDatabase(db, { seedDemo: true });
    const orgs = await db.select().from(organizations).where(eq(organizations.slug, MEGATRON.orgSlug));
    expect(orgs).toHaveLength(1);
    expect(orgs[0]).toMatchObject({ taxId: MEGATRON.taxId, houseBrand: true });
    const sup = await db.query.suppliers.findFirst({ where: eq(suppliers.organizationId, orgs[0]!.id) });
    expect(sup?.platformFeePercent).toBe(5);
    expect((await ensureHouseBrand(db)).created).toBe(false);
    expect((await getHouseBrandOverview(db))?.productCount).toBe(5);
  }, 120_000);
});
