"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { activities, productStoreAccess, products, serviceLeads, services, storeProducts, storeThemes, stores, themeSettings, themeVersions, themes, type ThemeSettingsData } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireStoreId } from "@/lib/domain/access";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { newId } from "@/lib/ids";

async function storeCtx() {
  const session = await getSession();
  if (!session) throw new ForbiddenError("Sessão expirada.");
  const storeId = requireStoreId(session.actor);
  return { storeId, session, db: (await getDb()) };
}

function revalidateStore(slug?: string) {
  revalidatePath("/merchant", "layout");
  if (slug) revalidatePath(`/store/${slug}`, "layout");
}

const storeSchema = z.object({ name: z.string().min(2, "Nome muito curto"), tagline: z.string().max(80).optional(), whatsapp: z.string().optional(), instagram: z.string().optional() });

export async function updateStoreAction(input: z.input<typeof storeSchema>) {
  return runAction(async () => {
    const { storeId, db, session } = await storeCtx();
    const data = storeSchema.parse(input);
    await db.update(stores).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(stores.id, storeId));
    revalidateStore(session.store?.slug);
    return undefined;
  });
}

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida");
const appearanceSchema = z.object({
  logoText: z.string().min(1).max(4),
  primaryColor: hex,
  accentColor: hex,
  settings: z.object({
    heroTitle: z.string().min(2),
    heroSubtitle: z.string(),
    heroCta: z.string().min(1),
    announcement: z.string(),
    banners: z.array(z.object({ title: z.string(), subtitle: z.string(), tone: z.enum(["primary", "accent", "neutral"]) })),
    showCategories: z.boolean(),
    footerText: z.string(),
  }),
});

export async function updateAppearanceAction(input: z.input<typeof appearanceSchema>) {
  return runAction(async () => {
    const { storeId, db, session } = await storeCtx();
    const data = appearanceSchema.parse(input);
    await db.transaction(async (tx) => {
      await tx.update(stores).set({ logoText: data.logoText, primaryColor: data.primaryColor, accentColor: data.accentColor, updatedAt: new Date().toISOString() }).where(eq(stores.id, storeId));
      const existing = await tx.query.themeSettings.findFirst({ where: eq(themeSettings.storeId, storeId) });
      const settings: ThemeSettingsData = data.settings;
      if (existing) await tx.update(themeSettings).set({ settings, updatedAt: new Date().toISOString() }).where(eq(themeSettings.storeId, storeId));
      else await tx.insert(themeSettings).values({ storeId, settings });
    });
    revalidateStore(session.store?.slug);
    return undefined;
  });
}

const listingSchema = z.object({ productId: z.string().min(1), active: z.boolean(), priceCents: z.coerce.number().int().nonnegative(), packPriceCents: z.coerce.number().int().nonnegative().nullable().optional() });

/** Lojista ativa/desativa produto e define preço (respeitando preço mínimo do fornecedor). */
export async function upsertStoreProductAction(input: z.input<typeof listingSchema>) {
  return runAction(async () => {
    const { storeId, db, session } = await storeCtx();
    const data = listingSchema.parse(input);
    const product = await db.query.products.findFirst({ where: eq(products.id, data.productId) });
    if (!product || product.status !== "ACTIVE") throw new NotFoundError("Produto indisponível.");
    if (product.distribution === "SELECTED_STORES") {
      const access = await db.query.productStoreAccess.findFirst({ where: and(eq(productStoreAccess.productId, product.id), eq(productStoreAccess.storeId, storeId)) });
      if (!access) throw new ForbiddenError("Este produto não está distribuído para sua loja.");
    }
    if (data.priceCents < product.minimumPriceCents) throw new DomainError("BELOW_MINIMUM", "Preço abaixo do mínimo definido pelo fornecedor.");
    const existing = await db.query.storeProducts.findFirst({ where: and(eq(storeProducts.storeId, storeId), eq(storeProducts.productId, product.id)) });
    const values = { active: data.active, priceCents: data.priceCents, packPriceCents: data.packPriceCents ?? null };
    if (existing) await db.update(storeProducts).set(values).where(and(eq(storeProducts.storeId, storeId), eq(storeProducts.productId, product.id)));
    else await db.insert(storeProducts).values({ storeId, productId: product.id, ...values });
    revalidateStore(session.store?.slug);
    return undefined;
  });
}

export async function activateThemeAction(themeId: string) {
  return runAction(async () => {
    const { storeId, db, session } = await storeCtx();
    const theme = await db.query.themes.findFirst({ where: eq(themes.id, themeId) });
    if (!theme) throw new NotFoundError("Tema não encontrado.");
    if (!theme.available) throw new DomainError("THEME_LOCKED", "Este tema ainda não está disponível para compra.");
    const version = await db.query.themeVersions.findFirst({ where: and(eq(themeVersions.themeId, themeId), eq(themeVersions.status, "PUBLISHED")) });
    if (!version) throw new NotFoundError("Versão publicada não encontrada.");
    const existing = await db.query.storeThemes.findFirst({ where: eq(storeThemes.storeId, storeId) });
    if (existing) await db.update(storeThemes).set({ themeId, themeVersionId: version.id, activatedAt: new Date().toISOString() }).where(eq(storeThemes.storeId, storeId));
    else await db.insert(storeThemes).values({ storeId, themeId, themeVersionId: version.id });
    revalidateStore(session.store?.slug);
    return undefined;
  });
}

export async function createServiceLeadAction(serviceId: string) {
  return runAction(async () => {
    const { storeId, db, session } = await storeCtx();
    const service = await db.query.services.findFirst({ where: eq(services.id, serviceId) });
    if (!service) throw new NotFoundError("Serviço não encontrado.");
    const existing = await db.query.serviceLeads.findFirst({ where: and(eq(serviceLeads.storeId, storeId), eq(serviceLeads.serviceId, serviceId)) });
    if (existing) return { already: true };
    await db.insert(serviceLeads).values({ id: newId("lead"), storeId, serviceId });
    await db.insert(activities).values({ id: newId("act"), scope: "PLATFORM", storeId, type: "SERVICE_LEAD", message: `${session.store?.name} demonstrou interesse em ${service.name}` });
    revalidatePath("/merchant", "layout");
    revalidatePath("/master", "layout");
    return { already: false };
  });
}

const integrationSchema = z.object({ kind: z.enum(["payments", "shipping", "domain"]), provider: z.string().optional() });

/** Configuração demonstrativa das integrações (sem conexão real). */
export async function configureIntegrationAction(input: z.input<typeof integrationSchema>) {
  return runAction(async () => {
    const { storeId, db, session } = await storeCtx();
    const data = integrationSchema.parse(input);
    const patch =
      data.kind === "payments" ? { paymentProvider: data.provider ?? "Mercado Pago", paymentStatus: "DEMO" as const }
      : data.kind === "shipping" ? { shippingProvider: data.provider ?? "Melhor Envio", shippingStatus: "DEMO" as const }
      : { customDomain: data.provider ?? null, domainStatus: "PENDING" as const };
    await db.update(stores).set({ ...patch, updatedAt: new Date().toISOString() }).where(eq(stores.id, storeId));
    revalidateStore(session.store?.slug);
    return undefined;
  });
}

export async function publishStoreAction(publish: boolean) {
  return runAction(async () => {
    const { storeId, db, session } = await storeCtx();
    await db.update(stores).set({ publishedAt: publish ? new Date().toISOString() : null, updatedAt: new Date().toISOString() }).where(eq(stores.id, storeId));
    revalidateStore(session.store?.slug);
    return undefined;
  });
}
