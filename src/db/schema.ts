/**
 * NextLevel Commerce Engine — schema multi-tenant.
 *
 * Hierarquia conceitual:
 *   NEXTLEVEL (plataforma) → ORGANIZATION (tenant) → SUPPLIER | STORE
 *   SUPPLIER → NETWORK → STORE (lojista)
 *   USER pertence a uma organização; CUSTOMER é o consumidor final.
 *
 * Valores monetários são armazenados em centavos (integer).
 * Datas em ISO-8601 (text) para portabilidade SQLite → D1 → Postgres.
 */
import { sqliteTable, text, integer, primaryKey, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const now = () => sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;
const id = () => text("id").primaryKey();
const createdAt = () => text("created_at").notNull().default(now());
const updatedAt = () => text("updated_at").notNull().default(now());

// ---------------------------------------------------------------------------
// Tenancy
// ---------------------------------------------------------------------------
export const organizations = sqliteTable("organizations", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  /** NEXTLEVEL | SUPPLIER | MERCHANT */
  type: text("type", { enum: ["NEXTLEVEL", "SUPPLIER", "MERCHANT"] }).notNull(),
  createdAt: createdAt(),
});

export const suppliers = sqliteTable("suppliers", {
  id: id(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status", { enum: ["ACTIVE", "SUSPENDED"] }).notNull().default("ACTIVE"),
  /** Modelo comercial SuperDrop (0 setup + 6%) ou White Label (R$6.000 + 3%) */
  businessModel: text("business_model", { enum: ["SUPERDROP", "WHITE_LABEL"] }).notNull().default("SUPERDROP"),
  platformFeePercent: integer("platform_fee_percent").notNull().default(6),
  setupFeeCents: integer("setup_fee_cents").notNull().default(0),
  city: text("city"),
  state: text("state"),
  createdAt: createdAt(),
});

export const networks = sqliteTable("networks", {
  id: id(),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: createdAt(),
});

export const stores = sqliteTable("stores", {
  id: id(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  networkId: text("network_id").notNull().references(() => networks.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status", { enum: ["ACTIVE", "SUSPENDED", "CLOSED"] }).notNull().default("ACTIVE"),
  tagline: text("tagline"),
  logoUrl: text("logo_url"),
  logoText: text("logo_text"),
  primaryColor: text("primary_color").notNull().default("#0f172a"),
  accentColor: text("accent_color").notNull().default("#16a34a"),
  whatsapp: text("whatsapp"),
  instagram: text("instagram"),
  customDomain: text("custom_domain"),
  paymentProvider: text("payment_provider"),
  paymentStatus: text("payment_status", { enum: ["NOT_CONFIGURED", "DEMO", "CONNECTED"] }).notNull().default("NOT_CONFIGURED"),
  shippingProvider: text("shipping_provider"),
  shippingStatus: text("shipping_status", { enum: ["NOT_CONFIGURED", "DEMO", "CONNECTED"] }).notNull().default("NOT_CONFIGURED"),
  domainStatus: text("domain_status", { enum: ["NOT_CONFIGURED", "PENDING", "CONNECTED"] }).notNull().default("NOT_CONFIGURED"),
  publishedAt: text("published_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("stores_network_idx").on(t.networkId)]);

export const users = sqliteTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["NEXTLEVEL_MASTER", "SUPPLIER_ADMIN", "STORE_OWNER"] }).notNull(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  supplierId: text("supplier_id").references(() => suppliers.id),
  storeId: text("store_id").references(() => stores.id),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Catálogo central
// ---------------------------------------------------------------------------
export const categories = sqliteTable("categories", {
  id: id(),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
});

export const products = sqliteTable("products", {
  id: id(),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  networkId: text("network_id").references(() => networks.id),
  categoryId: text("category_id").references(() => categories.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull().default(""),
  sku: text("sku").notNull(),
  /** JSON string[] */
  images: text("images", { mode: "json" }).$type<string[]>().notNull().default([]),
  costCents: integer("cost_cents").notNull(),
  suggestedPriceCents: integer("suggested_price_cents").notNull(),
  minimumPriceCents: integer("minimum_price_cents").notNull(),
  status: text("status", { enum: ["ACTIVE", "DRAFT", "ARCHIVED"] }).notNull().default("ACTIVE"),
  /** Preparado para catálogo compartilhado entre fornecedores */
  visibility: text("visibility", { enum: ["PRIVATE_NETWORK", "SHARED_NETWORK", "PUBLIC_NETWORK"] }).notNull().default("PRIVATE_NETWORK"),
  /** Quem pode vender: toda a rede ou lojas selecionadas (product_store_access) */
  distribution: text("distribution", { enum: ["ALL_NETWORK", "SELECTED_STORES"] }).notNull().default("ALL_NETWORK"),
  sellsUnit: integer("sells_unit", { mode: "boolean" }).notNull().default(true),
  sellsPack: integer("sells_pack", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("products_supplier_slug").on(t.supplierId, t.slug), uniqueIndex("products_supplier_sku").on(t.supplierId, t.sku)]);

export const productVariants = sqliteTable("product_variants", {
  id: id(),
  productId: text("product_id").notNull().references(() => products.id),
  size: text("size").notNull(),
  sku: text("sku").notNull(),
  position: integer("position").notNull().default(0),
}, (t) => [index("variants_product_idx").on(t.productId)]);

/** Grade (pack) — ex.: "Grade 12 peças" com distribuição configurável por tamanho. */
export const productPacks = sqliteTable("product_packs", {
  id: id(),
  productId: text("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  totalQuantity: integer("total_quantity").notNull(),
  costCents: integer("cost_cents").notNull(),
  suggestedPriceCents: integer("suggested_price_cents").notNull(),
  minimumPriceCents: integer("minimum_price_cents").notNull(),
});

export const productPackItems = sqliteTable("product_pack_items", {
  packId: text("pack_id").notNull().references(() => productPacks.id),
  variantId: text("variant_id").notNull().references(() => productVariants.id),
  quantity: integer("quantity").notNull(),
}, (t) => [primaryKey({ columns: [t.packId, t.variantId] })]);

export const productStoreAccess = sqliteTable("product_store_access", {
  productId: text("product_id").notNull().references(() => products.id),
  storeId: text("store_id").notNull().references(() => stores.id),
}, (t) => [primaryKey({ columns: [t.productId, t.storeId] })]);

/** Preço/ativação do produto na loja (não duplica estoque). */
export const storeProducts = sqliteTable("store_products", {
  storeId: text("store_id").notNull().references(() => stores.id),
  productId: text("product_id").notNull().references(() => products.id),
  priceCents: integer("price_cents").notNull(),
  packPriceCents: integer("pack_price_cents"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
}, (t) => [primaryKey({ columns: [t.storeId, t.productId] })]);

// ---------------------------------------------------------------------------
// Estoque central
// ---------------------------------------------------------------------------
export const inventory = sqliteTable("inventory", {
  variantId: text("variant_id").primaryKey().references(() => productVariants.id),
  onHand: integer("on_hand").notNull().default(0),
  reserved: integer("reserved").notNull().default(0),
  updatedAt: updatedAt(),
});

export const inventoryMovements = sqliteTable("inventory_movements", {
  id: id(),
  variantId: text("variant_id").notNull().references(() => productVariants.id),
  type: text("type", { enum: ["IN", "RESERVE", "RELEASE", "SALE", "ADJUSTMENT"] }).notNull(),
  quantity: integer("quantity").notNull(),
  referenceType: text("reference_type"),
  referenceId: text("reference_id"),
  note: text("note"),
  createdAt: createdAt(),
}, (t) => [index("movements_variant_idx").on(t.variantId)]);

// ---------------------------------------------------------------------------
// Clientes e consentimento (LGPD-ready)
// ---------------------------------------------------------------------------
export const customers = sqliteTable("customers", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  createdAt: createdAt(),
});

export const storeCustomers = sqliteTable("store_customers", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  customerId: text("customer_id").notNull().references(() => customers.id),
  ordersCount: integer("orders_count").notNull().default(0),
  totalSpentCents: integer("total_spent_cents").notNull().default(0),
  lastOrderAt: text("last_order_at"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("store_customers_unique").on(t.storeId, t.customerId)]);

export const marketingConsents = sqliteTable("marketing_consents", {
  id: id(),
  storeCustomerId: text("store_customer_id").notNull().references(() => storeCustomers.id),
  purpose: text("purpose", { enum: ["EMAIL_MARKETING", "WHATSAPP_MARKETING", "SMS_MARKETING", "PLATFORM_ANALYTICS"] }).notNull(),
  source: text("source").notNull(),
  grantedAt: text("granted_at").notNull().default(now()),
  revokedAt: text("revoked_at"),
});

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------
export const ORDER_STATUSES = ["PENDING", "AWAITING_CENTRAL_PAYMENT", "AWAITING_LABEL", "READY_TO_PICK", "PICKING", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "CANCELED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orders = sqliteTable("orders", {
  id: id(),
  number: integer("number").notNull(),
  storeId: text("store_id").notNull().references(() => stores.id),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  storeCustomerId: text("store_customer_id").references(() => storeCustomers.id),
  channel: text("channel", { enum: ["ONLINE_STORE", "WHATSAPP", "INSTAGRAM", "MANUAL"] }).notNull().default("ONLINE_STORE"),
  saleType: text("sale_type", { enum: ["RETAIL", "WHOLESALE"] }).notNull().default("RETAIL"),
  status: text("status", { enum: ORDER_STATUSES }).notNull().default("PENDING"),
  customerPaymentStatus: text("customer_payment_status", { enum: ["PENDING", "PAID", "REFUNDED"] }).notNull().default("PENDING"),
  centralPaymentStatus: text("central_payment_status", { enum: ["PENDING", "PAID"] }).notNull().default("PENDING"),
  shippingLabelStatus: text("shipping_label_status", { enum: ["PENDING", "READY"] }).notNull().default("PENDING"),
  shippingLabelCode: text("shipping_label_code"),
  shippingCarrier: text("shipping_carrier"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  shippingAddress: text("shipping_address"),
  shippingCity: text("shipping_city"),
  shippingState: text("shipping_state"),
  shippingZip: text("shipping_zip"),
  subtotalCents: integer("subtotal_cents").notNull(),
  shippingCents: integer("shipping_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  costTotalCents: integer("cost_total_cents").notNull(),
  notes: text("notes"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("orders_store_idx").on(t.storeId), index("orders_supplier_idx").on(t.supplierId), uniqueIndex("orders_store_number").on(t.storeId, t.number)]);

export const orderItems = sqliteTable("order_items", {
  id: id(),
  orderId: text("order_id").notNull().references(() => orders.id),
  productId: text("product_id").notNull().references(() => products.id),
  variantId: text("variant_id").references(() => productVariants.id),
  packId: text("pack_id").references(() => productPacks.id),
  productName: text("product_name").notNull(),
  label: text("label").notNull(),
  quantity: integer("quantity").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  unitCostCents: integer("unit_cost_cents").notNull(),
  lineTotalCents: integer("line_total_cents").notNull(),
}, (t) => [index("order_items_order_idx").on(t.orderId)]);

export const orderEvents = sqliteTable("order_events", {
  id: id(),
  orderId: text("order_id").notNull().references(() => orders.id),
  type: text("type").notNull(),
  message: text("message").notNull(),
  actorRole: text("actor_role"),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Template Engine / Theme Store
// ---------------------------------------------------------------------------
export const themes = sqliteTable("themes", {
  id: id(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  tier: text("tier", { enum: ["STARTER", "PRO", "ELITE"] }).notNull(),
  description: text("description").notNull(),
  priceCents: integer("price_cents").notNull().default(0),
  features: text("features", { mode: "json" }).$type<string[]>().notNull().default([]),
  previewAccent: text("preview_accent").notNull(),
  available: integer("available", { mode: "boolean" }).notNull().default(false),
});

export const themeVersions = sqliteTable("theme_versions", {
  id: id(),
  themeId: text("theme_id").notNull().references(() => themes.id),
  version: text("version").notNull(),
  status: text("status", { enum: ["DRAFT", "PUBLISHED", "DEPRECATED"] }).notNull().default("PUBLISHED"),
  createdAt: createdAt(),
});

export const storeThemes = sqliteTable("store_themes", {
  storeId: text("store_id").primaryKey().references(() => stores.id),
  themeId: text("theme_id").notNull().references(() => themes.id),
  themeVersionId: text("theme_version_id").notNull().references(() => themeVersions.id),
  activatedAt: text("activated_at").notNull().default(now()),
});

export type ThemeSettingsData = {
  heroTitle: string;
  heroSubtitle: string;
  heroCta: string;
  announcement: string;
  banners: { title: string; subtitle: string; tone: "primary" | "accent" | "neutral" }[];
  showCategories: boolean;
  footerText: string;
};

export const themeSettings = sqliteTable("theme_settings", {
  storeId: text("store_id").primaryKey().references(() => stores.id),
  settings: text("settings", { mode: "json" }).$type<ThemeSettingsData>().notNull(),
  updatedAt: updatedAt(),
});

// ---------------------------------------------------------------------------
// Planos / Assinaturas
// ---------------------------------------------------------------------------
export const plans = sqliteTable("plans", {
  id: id(),
  name: text("name").notNull(),
  priceCents: integer("price_cents").notNull(),
  features: text("features", { mode: "json" }).$type<string[]>().notNull().default([]),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  planId: text("plan_id").notNull().references(() => plans.id),
  status: text("status", { enum: ["ACTIVE", "PAST_DUE", "SUSPENDED", "CLOSED"] }).notNull().default("ACTIVE"),
  currentPeriodEnd: text("current_period_end").notNull(),
  createdAt: createdAt(),
});

export const invoices = sqliteTable("invoices", {
  id: id(),
  subscriptionId: text("subscription_id").notNull().references(() => subscriptions.id),
  amountCents: integer("amount_cents").notNull(),
  dueDate: text("due_date").notNull(),
  status: text("status", { enum: ["OPEN", "PAID", "OVERDUE"] }).notNull().default("OPEN"),
  paidAt: text("paid_at"),
});

// ---------------------------------------------------------------------------
// Marketplace NextLevel (serviços) e Conteúdo
// ---------------------------------------------------------------------------
export const services = sqliteTable("services", {
  id: id(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  priceFromCents: integer("price_from_cents"),
  icon: text("icon").notNull(),
});

export const serviceLeads = sqliteTable("service_leads", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  serviceId: text("service_id").notNull().references(() => services.id),
  status: text("status", { enum: ["NEW", "CONTACTED", "WON", "LOST"] }).notNull().default("NEW"),
  createdAt: createdAt(),
});

export const contentItems = sqliteTable("content_items", {
  id: id(),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  category: text("category", { enum: ["PRODUTOS", "STORIES", "BANNERS", "REELS", "CAMPANHAS"] }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  format: text("format").notNull(),
  accent: text("accent").notNull(),
});

// ---------------------------------------------------------------------------
// Atividades (feed)
// ---------------------------------------------------------------------------
export const activities = sqliteTable("activities", {
  id: id(),
  /** Escopo: PLATFORM | SUPPLIER | STORE */
  scope: text("scope", { enum: ["PLATFORM", "SUPPLIER", "STORE"] }).notNull(),
  supplierId: text("supplier_id").references(() => suppliers.id),
  storeId: text("store_id").references(() => stores.id),
  type: text("type").notNull(),
  message: text("message").notNull(),
  createdAt: createdAt(),
}, (t) => [index("activities_scope_idx").on(t.scope, t.supplierId, t.storeId)]);

export type Store = typeof stores.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type ProductPack = typeof productPacks.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type User = typeof users.$inferSelect;
export type Theme = typeof themes.$inferSelect;
export type Service = typeof services.$inferSelect;
