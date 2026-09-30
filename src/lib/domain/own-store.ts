import { and, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { activities, networks, products, storeProducts, storeThemes, stores, supplierPages, suppliers, themeSettings, themeVersions, themes, users } from "@/db/schema";
import { newId, slugify } from "@/lib/ids";
import { hashPassword, generateTemporaryPassword } from "@/lib/security/password";
import { isMaster, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { capabilitiesForSupplier } from "./finance";
import { defaultThemeSettings } from "@/lib/queries/merchant";

/**
 * Loja própria do fornecedor: vende o mesmo catálogo direto ao público, no subdomínio (SuperDrop) ou com tema e marca
 * próprios (White Label). É uma loja normal (kind SUPPLIER_OWN) com um usuário interno de "dono" que o gestor acessa
 * pelo botão "Abrir painel da loja". O custo dos pedidos é interno (não passa pela carteira) e o estoque é o central.
 */
export const OWN_STORE_EMAIL = (supplierSlug: string) => `loja.${supplierSlug}@interno.superdrop.com.br`;

export async function getOwnStore(db: Database, supplierId: string) {
  const net = await db.query.networks.findFirst({ where: eq(networks.supplierId, supplierId) });
  if (!net) return null;
  return (await db.query.stores.findFirst({ where: and(eq(stores.networkId, net.id), eq(stores.kind, "SUPPLIER_OWN")) })) ?? null;
}

async function uniqueStoreSlug(db: Database, base: string) {
  const b = slugify(base) || "loja";
  for (let i = 0; i < 50; i++) {
    const c = i === 0 ? b : `${b}-${i + 1}`;
    if (!(await db.query.stores.findFirst({ where: eq(stores.slug, c) }))) return c;
  }
  return `${b}-${newId().slice(0, 4)}`;
}

export async function createOwnStore(db: Database, actor: Actor, supplierIdArg?: string) {
  const supplierId = isMaster(actor) ? supplierIdArg : actor.role === "SUPPLIER_ADMIN" ? actor.supplierId : null;
  if (!supplierId) throw new ForbiddenError("Só o gestor do fornecedor cria a loja própria.");
  const supplier = await db.query.suppliers.findFirst({ where: eq(suppliers.id, supplierId) });
  if (!supplier) throw new NotFoundError("Fornecedor não encontrado.");
  if (!(await capabilitiesForSupplier(db, supplierId)).caps.canCreateStores) throw new DomainError("SUPPLIER_BLOCKED", "Nova loja indisponível por pendência de fatura.");
  const existing = await getOwnStore(db, supplierId);
  if (existing) return { storeId: existing.id, slug: existing.slug, created: false };
  const net = await db.query.networks.findFirst({ where: eq(networks.supplierId, supplierId) });
  if (!net) throw new DomainError("NETWORK_NOT_FOUND", "Fornecedor sem rede configurada.");
  const page = await db.query.supplierPages.findFirst({ where: eq(supplierPages.supplierId, supplierId) });
  const offer = supplier.businessModel === "WHITE_LABEL" ? "STORE_OWN" : "STORE_SUBDOMAIN";
  const storeId = newId("sto");
  const slug = await uniqueStoreSlug(db, supplier.slug);
  const now = new Date().toISOString();
  await db.transaction(async (tx) => {
    await tx.insert(stores).values({
      id: storeId, organizationId: supplier.organizationId, networkId: net.id, kind: "SUPPLIER_OWN", name: supplier.name, slug, offer, status: "ACTIVE",
      tagline: "Compre direto do fornecedor", logoUrl: page?.logoUrl ?? null, logoText: page?.logoText ?? supplier.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      primaryColor: page?.primaryColor ?? "#0f172a", accentColor: page?.accentColor ?? "#16a34a", whatsapp: page?.whatsapp ?? null,
      // Mesmo Mercado Pago da carteira: as recargas e os pedidos da loja caem na mesma conta.
      ...(supplier.walletMpTokenEnc ? { paymentProvider: "Mercado Pago", paymentStatus: "CONNECTED" as const, mpAccessTokenEnc: supplier.walletMpTokenEnc } : {}),
    });
    await tx.insert(users).values({ id: newId("usr"), name: `Loja ${supplier.name}`, email: OWN_STORE_EMAIL(supplier.slug), role: "STORE_OWNER", organizationId: supplier.organizationId, storeId, passwordHash: hashPassword(generateTemporaryPassword(24)), mustChangePassword: false });
    const starter = await tx.query.themes.findFirst({ where: eq(themes.key, "starter") });
    const version = starter ? await tx.query.themeVersions.findFirst({ where: eq(themeVersions.themeId, starter.id) }) : null;
    if (starter && version) await tx.insert(storeThemes).values({ storeId, themeId: starter.id, themeVersionId: version.id });
    await tx.insert(themeSettings).values({ storeId, settings: { ...defaultThemeSettings(), heroTitle: `Bem-vindo à ${supplier.name}`, footerText: supplier.name } });
    const catalog = await tx.select().from(products).where(and(eq(products.supplierId, supplierId), eq(products.status, "ACTIVE")));
    if (catalog.length) await tx.insert(storeProducts).values(catalog.map((p) => ({ storeId, productId: p.id, priceCents: p.suggestedPriceCents, packPriceCents: null, active: false, featured: false })));
    await tx.insert(activities).values({ id: newId("act"), scope: "SUPPLIER", supplierId, storeId, type: "OWN_STORE_CREATED", message: `Loja própria criada (${offer === "STORE_OWN" ? "White Label" : "subdomínio SuperDrop"})`, createdAt: now });
  });
  return { storeId, slug, created: true };
}

/** Mantém o Mercado Pago da loja própria igual ao da carteira do fornecedor (conectar, trocar ou desconectar). */
export async function syncOwnStoreMp(db: Database, supplierId: string) {
  const own = await getOwnStore(db, supplierId);
  if (!own) return;
  const s = await db.query.suppliers.findFirst({ where: eq(suppliers.id, supplierId) });
  await db.update(stores).set(s?.walletMpTokenEnc ? { paymentProvider: "Mercado Pago", paymentStatus: "CONNECTED", mpAccessTokenEnc: s.walletMpTokenEnc } : { paymentProvider: null, paymentStatus: "NOT_CONFIGURED", mpAccessTokenEnc: null }).where(eq(stores.id, own.id));
}

/** Usuário interno da loja própria a partir do gestor (para trocar de painel). */
export async function ownStoreUserFor(db: Database, actor: Actor) {
  if (actor.role !== "SUPPLIER_ADMIN" || !actor.supplierId) throw new ForbiddenError();
  const own = await getOwnStore(db, actor.supplierId);
  if (!own) throw new NotFoundError("Crie a loja própria primeiro.");
  const u = await db.query.users.findFirst({ where: and(eq(users.storeId, own.id), eq(users.role, "STORE_OWNER")) });
  if (!u) throw new NotFoundError("Usuário da loja não encontrado.");
  return u;
}

/** Gestor do fornecedor dono de uma loja própria, a partir do usuário interno da loja. */
export async function supplierAdminForOwnStore(db: Database, ownerUserId: string) {
  const owner = await db.query.users.findFirst({ where: eq(users.id, ownerUserId) });
  if (!owner?.storeId) throw new ForbiddenError();
  const store = await db.query.stores.findFirst({ where: eq(stores.id, owner.storeId) });
  if (!store || store.kind !== "SUPPLIER_OWN") throw new ForbiddenError();
  const admin = await db.query.users.findFirst({ where: and(eq(users.organizationId, store.organizationId), eq(users.role, "SUPPLIER_ADMIN")) });
  if (!admin) throw new NotFoundError("Gestor do fornecedor não encontrado.");
  return admin;
}
