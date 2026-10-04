"use server";
import { assertStoreAdmin } from "@/lib/domain/access";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { activities, products, serviceLeads, services, storeProducts, storeThemes, stores, themeSettings, themeVersions, themes, type ThemeSettingsData } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { assertListingPrices, assertProductListable } from "@/lib/domain/catalog";
import { requireStoreId } from "@/lib/domain/access";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { newId } from "@/lib/ids";
import { recordAudit } from "@/lib/domain/audit";
import { requireFeature } from "@/lib/features";

async function storeCtx(opts: { allowStaff?: boolean } = {}) {
  const session = await getSession();
  if (!session) throw new ForbiddenError("Sessão expirada.");
  if (!opts.allowStaff) assertStoreAdmin(session.actor);
  const storeId = requireStoreId(session.actor);
  return { storeId, session, db: (await getDb()) };
}

function revalidateStore(slug?: string) {
  revalidatePath("/merchant", "layout");
  if (slug) revalidatePath(`/store/${slug}`, "layout");
}

const storeSchema = z.object({
  name: z.string().min(2, "Nome muito curto"), tagline: z.string().max(80).optional(), whatsapp: z.string().optional(), instagram: z.string().optional(),
  legalName: z.string().max(120).optional(), cnpj: z.string().max(20).optional(), contactEmail: z.union([z.string().email("E-mail de contato inválido"), z.literal("")]).optional(), address: z.string().max(200).optional(),
});

export async function updateStoreAction(input: z.input<typeof storeSchema>) {
  return runAction(async () => {
    const { storeId, db, session } = await storeCtx();
    const parsed = storeSchema.parse(input);
    const { normalizeTaxId } = await import("@/lib/domain/store-access");
    let cnpj: string | null | undefined = undefined;
    if (parsed.cnpj !== undefined) { const d = parsed.cnpj.replace(/\D/g, ""); if (d === "") cnpj = null; else { try { cnpj = normalizeTaxId(d); } catch { throw new DomainError("CNPJ", "CNPJ ou CPF inválido."); } } }
    const data = { ...parsed, cnpj, legalName: parsed.legalName?.trim() || null, contactEmail: parsed.contactEmail?.trim() || null, address: parsed.address?.trim() || null };
    if (data.cnpj === undefined) delete (data as { cnpj?: unknown }).cnpj;
    const beforeStore = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
    await db.update(stores).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(stores.id, storeId));
    const keys = Object.keys(data) as (keyof typeof data)[];
    await recordAudit(db, session.actor, { action: "STORE_DATA_UPDATED", entityType: "store", entityId: storeId, storeId, before: Object.fromEntries(keys.map((k) => [k, (beforeStore as Record<string, unknown> | undefined)?.[k] ?? null])), after: Object.fromEntries(keys.map((k) => [k, data[k] ?? null])) });
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
    requireFeature(session.store!.offer, "appearanceBasic");
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
    const { storeId, db, session } = await storeCtx({ allowStaff: true });
    const data = listingSchema.parse(input);
    const product = await db.query.products.findFirst({ where: eq(products.id, data.productId) });
    if (!product || product.status !== "ACTIVE") throw new NotFoundError("Produto indisponível.");
    await assertProductListable(db, storeId, product);
    await assertListingPrices(db, product, { priceCents: data.priceCents, packPriceCents: data.packPriceCents });
    const existing = await db.query.storeProducts.findFirst({ where: and(eq(storeProducts.storeId, storeId), eq(storeProducts.productId, product.id)) });
    if (data.active && !existing?.active && session.store?.kind !== "SUPPLIER_OWN") {
      const { checkProductActivation } = await import("@/lib/domain/catalog");
      const chk = await checkProductActivation(db, product.id);
      if (!chk.ok) throw new DomainError("LOW_STOCK", `Estoque insuficiente para ativar: o fornecedor exige ao menos ${chk.min} peças por tamanho${chk.short.length ? ` (faltam: ${chk.short.map((s) => s.size).join(", ")})` : ""}.`);
    }
    const values = { active: data.active, priceCents: data.priceCents, packPriceCents: data.packPriceCents ?? null };
    if (existing) await db.update(storeProducts).set(values).where(and(eq(storeProducts.storeId, storeId), eq(storeProducts.productId, product.id)));
    else await db.insert(storeProducts).values({ storeId, productId: product.id, ...values });
    await recordAudit(db, session.actor, { action: existing ? "LISTING_UPDATED" : "LISTING_CREATED", entityType: "store_product", entityId: product.id, storeId, before: existing ? { active: existing.active, priceCents: existing.priceCents, packPriceCents: existing.packPriceCents } : {}, after: values });
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
    requireFeature(session.store!.offer, theme.tier === "STARTER" ? "templatesStarter" : "templatesPremium");
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
    if (data.kind === "domain") requireFeature(session.store!.offer, "customDomain");
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
    if (publish) requireFeature(session.store!.offer, "storefront");
    if (publish && session.store?.status !== "ACTIVE") throw new DomainError("STORE_NOT_ACTIVE", "A loja só pode ser publicada depois da confirmação do pagamento do setup.");
    await db.update(stores).set({ publishedAt: publish ? new Date().toISOString() : null, updatedAt: new Date().toISOString() }).where(eq(stores.id, storeId));
    await recordAudit(db, session.actor, { action: publish ? "STORE_PUBLISHED" : "STORE_UNPUBLISHED", entityType: "store", entityId: storeId, storeId }, { force: true });
    revalidateStore(session.store?.slug);
    return undefined;
  });
}

// ---------------------------------------------------------------------------
// Mercado Pago
// ---------------------------------------------------------------------------
import { encryptSecret } from "@/lib/security/crypto";
import { MercadoPagoError, verifyAccessToken } from "@/lib/payments/mercadopago";

const mpSchema = z.object({ accessToken: z.string().min(20, "Cole o Access Token completo"), publicKey: z.string().optional() });

/** Valida o token na API do Mercado Pago e o guarda criptografado. Aceita credenciais de teste (TEST-…) e de produção (APP_USR-…). */
export async function connectMercadoPagoAction(input: z.input<typeof mpSchema>) {
  return runAction(async () => {
    const { storeId, db, session } = await storeCtx();
    const data = mpSchema.parse(input);
    const token = data.accessToken.trim();
    if (!/^(TEST|APP_USR)-/.test(token)) throw new DomainError("MP_TOKEN", "O Access Token deve começar com APP_USR- (produção) ou TEST- (teste).");
    let account;
    try { account = await verifyAccessToken(token); } catch (e) { throw new DomainError("MP_TOKEN", e instanceof MercadoPagoError ? e.message : "Não foi possível validar o token."); }
    await db.update(stores).set({ paymentProvider: "Mercado Pago", paymentStatus: "CONNECTED", mpAccessTokenEnc: encryptSecret(token), mpPublicKey: data.publicKey?.trim() || null, updatedAt: new Date().toISOString() }).where(eq(stores.id, storeId));
    await recordAudit(db, session.actor, { action: "PAYMENT_CONNECTED", entityType: "store", entityId: storeId, storeId }, { force: true });
    revalidateStore(session.store?.slug);
    return { nickname: account.nickname, isTest: account.isTest };
  });
}

export async function disconnectMercadoPagoAction() {
  return runAction(async () => {
    const { storeId, db, session } = await storeCtx();
    await recordAudit(db, session.actor, { action: "PAYMENT_DISCONNECTED", entityType: "store", entityId: storeId, storeId }, { force: true });
    await db.update(stores).set({ paymentProvider: null, paymentStatus: "NOT_CONFIGURED", mpAccessTokenEnc: null, mpPublicKey: null, updatedAt: new Date().toISOString() }).where(eq(stores.id, storeId));
    revalidateStore(session.store?.slug);
    return undefined;
  });
}

/** Ativa na loja todos os produtos acessíveis ainda não ativados, com preço sugerido pelo fornecedor. */
export async function activateAllProductsAction() {
  return runAction(async () => {
    const { storeId, db, session } = await storeCtx({ allowStaff: true });
    const { listStoreCatalog } = await import("@/lib/domain/catalog");
    const items = await listStoreCatalog(db, storeId, { onlyActive: false });
    let activated = 0; let skipped = 0;
    const { getMinActivationStock } = await import("@/lib/domain/catalog");
    const { activationCheck } = await import("@/lib/domain/size-grids");
    const minStock = new Map<string, number>();
    for (const it of items) {
      if (it.storeProduct.active) continue;
      if (!minStock.has(it.product.supplierId)) minStock.set(it.product.supplierId, await getMinActivationStock(db, it.product.supplierId));
      const min = minStock.get(it.product.supplierId) ?? 4;
      if (session.store?.kind !== "SUPPLIER_OWN" && !activationCheck(it.variants.map((v) => ({ size: v.size, available: v.level.available })), min).ok) { skipped++; continue; }
      const values = { active: true, priceCents: it.storeProduct.priceCents || it.product.suggestedPriceCents, packPriceCents: it.storeProduct.packPriceCents ?? it.packs[0]?.suggestedPriceCents ?? null };
      const existing = await db.query.storeProducts.findFirst({ where: and(eq(storeProducts.storeId, storeId), eq(storeProducts.productId, it.product.id)) });
      if (existing) await db.update(storeProducts).set(values).where(and(eq(storeProducts.storeId, storeId), eq(storeProducts.productId, it.product.id)));
      else await db.insert(storeProducts).values({ storeId, productId: it.product.id, ...values });
      activated++;
    }
    revalidateStore(session.store?.slug);
    return { activated, skipped };
  });
}

// ---------------------------------------------------------------------------
// Regras de frete da loja (frete grátis, entrega padrão, retirada, prazo de preparo)
// ---------------------------------------------------------------------------
import { shippingConfigSchema } from "@/lib/shipping/quote";

export async function saveShippingConfigAction(input: z.input<typeof shippingConfigSchema>) {
  return runAction(async () => {
    const { storeId, db, session } = await storeCtx();
    const cfg = shippingConfigSchema.parse(input);
    const beforeCfg = (await db.query.stores.findFirst({ where: eq(stores.id, storeId) }))?.shippingConfig ?? {};
    await db.update(stores).set({ shippingConfig: cfg, updatedAt: new Date().toISOString() }).where(eq(stores.id, storeId));
    await recordAudit(db, session.actor, { action: "SHIPPING_RULES_UPDATED", entityType: "store", entityId: storeId, storeId, before: beforeCfg as Record<string, unknown>, after: cfg as Record<string, unknown> });
    await db.insert(activities).values({ id: newId("act"), scope: "STORE", storeId, type: "SHIPPING_RULES_SAVED", message: "Regras de frete atualizadas" });
    revalidateStore(session.store?.slug);
    return undefined;
  });
}
