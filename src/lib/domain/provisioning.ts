import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { activities, networks, organizations, plans, stores, storeThemes, subscriptions, suppliers, themeSettings, themeVersions, themes, users } from "@/db/schema";
import { newId, slugify } from "@/lib/ids";
import { generateTemporaryPassword, hashPassword } from "@/lib/security/password";
import { DomainError } from "./errors";
import { defaultThemeSettings } from "@/lib/queries/merchant";

export const createSupplierSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  businessModel: z.enum(["SUPERDROP", "WHITE_LABEL"]).default("SUPERDROP"),
  adminName: z.string().min(2, "Informe o nome do responsável"),
  adminEmail: z.string().email("E-mail inválido"),
});

export const createStoreSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens").optional(),
  tagline: z.string().max(80).optional(),
  whatsapp: z.string().optional(),
  ownerName: z.string().min(2, "Informe o nome do lojista"),
  ownerEmail: z.string().email("E-mail inválido"),
});

export type Credentials = { email: string; temporaryPassword: string };

async function ensureEmailFree(db: Database, email: string) {
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) throw new DomainError("EMAIL_TAKEN", "Já existe um usuário com este e-mail.");
}

async function uniqueSlug(db: Database, base: string, table: "stores" | "suppliers" | "organizations") {
  let slug = slugify(base) || "loja";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`;
    const hit =
      table === "stores" ? await db.query.stores.findFirst({ where: eq(stores.slug, candidate) })
      : table === "suppliers" ? await db.query.suppliers.findFirst({ where: eq(suppliers.slug, candidate) })
      : await db.query.organizations.findFirst({ where: eq(organizations.slug, candidate) });
    if (!hit) return candidate;
  }
  slug = `${slug}-${newId().slice(0, 4)}`;
  return slug;
}

/** NextLevel cria um fornecedor: organização + fornecedor + rede + usuário admin. */
export async function createSupplier(db: Database, raw: z.input<typeof createSupplierSchema>): Promise<{ supplierId: string; credentials: Credentials }> {
  const input = createSupplierSchema.parse(raw);
  const email = input.adminEmail.toLowerCase();
  await ensureEmailFree(db, email);
  const temporaryPassword = generateTemporaryPassword();
  const orgId = newId("org");
  const supplierId = newId("sup");
  const fee = input.businessModel === "WHITE_LABEL" ? { platformFeePercent: 3, setupFeeCents: 600000 } : { platformFeePercent: 6, setupFeeCents: 0 };
  await db.transaction(async (tx) => {
    const orgSlug = await uniqueSlug(tx, input.name, "organizations");
    const supSlug = await uniqueSlug(tx, input.name, "suppliers");
    await tx.insert(organizations).values({ id: orgId, name: input.name, slug: orgSlug, type: "SUPPLIER" });
    await tx.insert(suppliers).values({ id: supplierId, organizationId: orgId, name: input.name, slug: supSlug, businessModel: input.businessModel, city: input.city, state: input.state, ...fee });
    await tx.insert(networks).values({ id: newId("net"), supplierId, name: `Rede ${input.name}`, slug: `rede-${supSlug}` });
    await tx.insert(users).values({ id: newId("usr"), name: input.adminName, email, role: "SUPPLIER_ADMIN", organizationId: orgId, supplierId, passwordHash: hashPassword(temporaryPassword), mustChangePassword: true });
    await tx.insert(activities).values({ id: newId("act"), scope: "PLATFORM", supplierId, type: "SUPPLIER_CREATED", message: `Fornecedor ${input.name} criado (${input.businessModel === "WHITE_LABEL" ? "White Label · 3%" : "SuperDrop · 6%"})` });
  });
  return { supplierId, credentials: { email, temporaryPassword } };
}

/** Fornecedor cria uma loja na sua rede e convida o lojista. */
export async function createStore(db: Database, supplierId: string, raw: z.input<typeof createStoreSchema>): Promise<{ storeId: string; slug: string; credentials: Credentials }> {
  const input = createStoreSchema.parse(raw);
  const email = input.ownerEmail.toLowerCase();
  await ensureEmailFree(db, email);
  const network = await db.query.networks.findFirst({ where: eq(networks.supplierId, supplierId) });
  if (!network) throw new DomainError("NETWORK_NOT_FOUND", "Fornecedor sem rede configurada.");
  const temporaryPassword = generateTemporaryPassword();
  const storeId = newId("sto");
  let slug = "";
  await db.transaction(async (tx) => {
    slug = await uniqueSlug(tx, input.slug ?? input.name, "stores");
    const orgId = newId("org");
    await tx.insert(organizations).values({ id: orgId, name: input.name, slug: await uniqueSlug(tx, input.name, "organizations"), type: "MERCHANT" });
    await tx.insert(stores).values({ id: storeId, organizationId: orgId, networkId: network.id, name: input.name, slug, tagline: input.tagline, whatsapp: input.whatsapp, logoText: input.name.split(" ").map((p) => p[0]).join("").slice(0, 3).toUpperCase() });
    await tx.insert(users).values({ id: newId("usr"), name: input.ownerName, email, role: "STORE_OWNER", organizationId: orgId, storeId, passwordHash: hashPassword(temporaryPassword), mustChangePassword: true });
    const plan = (await tx.select().from(plans).orderBy(plans.priceCents).limit(1))[0];
    if (plan) {
      const periodEnd = new Date(); periodEnd.setDate(periodEnd.getDate() + 30);
      await tx.insert(subscriptions).values({ id: newId("sub"), storeId, planId: plan.id, status: "ACTIVE", currentPeriodEnd: periodEnd.toISOString() });
    }
    const starter = await tx.query.themes.findFirst({ where: eq(themes.key, "starter") });
    const version = starter ? await tx.query.themeVersions.findFirst({ where: eq(themeVersions.themeId, starter.id) }) : null;
    if (starter && version) await tx.insert(storeThemes).values({ storeId, themeId: starter.id, themeVersionId: version.id });
    await tx.insert(themeSettings).values({ storeId, settings: { ...defaultThemeSettings(), heroTitle: `Bem-vindo à ${input.name}`, footerText: input.name } });
    await tx.insert(activities).values([
      { id: newId("act"), scope: "SUPPLIER", supplierId, storeId, type: "STORE_CREATED", message: `Loja ${input.name} criada e lojista convidado` },
      { id: newId("act"), scope: "PLATFORM", supplierId, storeId, type: "STORE_CREATED", message: `Loja ${input.name} criada na rede ${network.name}` },
    ]);
  });
  return { storeId, slug, credentials: { email, temporaryPassword } };
}

/** Redefine a senha de um usuário do tenant (gera temporária). */
export async function resetUserPassword(db: Database, userId: string): Promise<string> {
  const temporaryPassword = generateTemporaryPassword();
  await db.update(users).set({ passwordHash: hashPassword(temporaryPassword), mustChangePassword: true }).where(eq(users.id, userId));
  return temporaryPassword;
}
