/**
 * NextLevel Commerce Engine — schema multi-tenant.
 *
 * Hierarquia conceitual:
 *   NEXTLEVEL (plataforma) → ORGANIZATION (tenant) → SUPPLIER | STORE
 *   SUPPLIER → NETWORK → STORE (lojista)
 *   USER pertence a uma organização; CUSTOMER é o consumidor final.
 *
 * Valores monetários são armazenados em centavos (integer).
 * Datas em timestamptz lidas como ISO string. Dialeto Postgres (Neon/Netlify DB em produção, PGlite localmente).
 */
import { pgTable, text, integer, boolean, jsonb, timestamp, primaryKey, uniqueIndex, index } from "drizzle-orm/pg-core";

/** Datas como ISO string (timestamptz no banco), para manter as regras de negócio agnósticas ao driver. */
const ts = (name: string) => timestamp(name, { mode: "string", withTimezone: true });
const id = () => text("id").primaryKey();
const createdAt = () => ts("created_at").notNull().defaultNow();
const updatedAt = () => ts("updated_at").notNull().defaultNow();

// ---------------------------------------------------------------------------
// Tenancy
// ---------------------------------------------------------------------------
export const organizations = pgTable("organizations", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  /** NEXTLEVEL | SUPPLIER | MERCHANT */
  type: text("type", { enum: ["NEXTLEVEL", "SUPPLIER", "MERCHANT"] }).notNull(),
  createdAt: createdAt(),
});

export const suppliers = pgTable("suppliers", {
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

export const networks = pgTable("networks", {
  id: id(),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: createdAt(),
});

export const stores = pgTable("stores", {
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
  publishedAt: ts("published_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("stores_network_idx").on(t.networkId)]);

export const users = pgTable("users", {
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
export const categories = pgTable("categories", {
  id: id(),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
});

export const products = pgTable("products", {
  id: id(),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  networkId: text("network_id").references(() => networks.id),
  categoryId: text("category_id").references(() => categories.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull().default(""),
  sku: text("sku").notNull(),
  /** JSON string[] */
  images: jsonb("images").$type<string[]>().notNull().default([]),
  costCents: integer("cost_cents").notNull(),
  suggestedPriceCents: integer("suggested_price_cents").notNull(),
  minimumPriceCents: integer("minimum_price_cents").notNull(),
  status: text("status", { enum: ["ACTIVE", "DRAFT", "ARCHIVED"] }).notNull().default("ACTIVE"),
  /** Preparado para catálogo compartilhado entre fornecedores */
  visibility: text("visibility", { enum: ["PRIVATE_NETWORK", "SHARED_NETWORK", "PUBLIC_NETWORK"] }).notNull().default("PRIVATE_NETWORK"),
  /** Quem pode vender: toda a rede ou lojas selecionadas (product_store_access) */
  distribution: text("distribution", { enum: ["ALL_NETWORK", "SELECTED_STORES"] }).notNull().default("ALL_NETWORK"),
  sellsUnit: boolean("sells_unit").notNull().default(true),
  sellsPack: boolean("sells_pack").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("products_supplier_slug").on(t.supplierId, t.slug), uniqueIndex("products_supplier_sku").on(t.supplierId, t.sku)]);

export const productVariants = pgTable("product_variants", {
  id: id(),
  productId: text("product_id").notNull().references(() => products.id),
  size: text("size").notNull(),
  sku: text("sku").notNull(),
  position: integer("position").notNull().default(0),
}, (t) => [index("variants_product_idx").on(t.productId)]);

/** Grade (pack) — ex.: "Grade 12 peças" com distribuição configurável por tamanho. */
export const productPacks = pgTable("product_packs", {
  id: id(),
  productId: text("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  totalQuantity: integer("total_quantity").notNull(),
  costCents: integer("cost_cents").notNull(),
  suggestedPriceCents: integer("suggested_price_cents").notNull(),
  minimumPriceCents: integer("minimum_price_cents").notNull(),
});

export const productPackItems = pgTable("product_pack_items", {
  packId: text("pack_id").notNull().references(() => productPacks.id),
  variantId: text("variant_id").notNull().references(() => productVariants.id),
  quantity: integer("quantity").notNull(),
}, (t) => [primaryKey({ columns: [t.packId, t.variantId] })]);

export const productStoreAccess = pgTable("product_store_access", {
  productId: text("product_id").notNull().references(() => products.id),
  storeId: text("store_id").notNull().references(() => stores.id),
}, (t) => [primaryKey({ columns: [t.productId, t.storeId] })]);

/** Preço/ativação do produto na loja (não duplica estoque). */
export const storeProducts = pgTable("store_products", {
  storeId: text("store_id").notNull().references(() => stores.id),
  productId: text("product_id").notNull().references(() => products.id),
  priceCents: integer("price_cents").notNull(),
  packPriceCents: integer("pack_price_cents"),
  active: boolean("active").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
}, (t) => [primaryKey({ columns: [t.storeId, t.productId] })]);

// ---------------------------------------------------------------------------
// Estoque central
// ---------------------------------------------------------------------------
export const inventory = pgTable("inventory", {
  variantId: text("variant_id").primaryKey().references(() => productVariants.id),
  onHand: integer("on_hand").notNull().default(0),
  reserved: integer("reserved").notNull().default(0),
  updatedAt: updatedAt(),
});

export const inventoryMovements = pgTable("inventory_movements", {
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
export const customers = pgTable("customers", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  createdAt: createdAt(),
});

export const storeCustomers = pgTable("store_customers", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  customerId: text("customer_id").notNull().references(() => customers.id),
  ordersCount: integer("orders_count").notNull().default(0),
  totalSpentCents: integer("total_spent_cents").notNull().default(0),
  lastOrderAt: ts("last_order_at"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("store_customers_unique").on(t.storeId, t.customerId)]);

export const marketingConsents = pgTable("marketing_consents", {
  id: id(),
  storeCustomerId: text("store_customer_id").notNull().references(() => storeCustomers.id),
  purpose: text("purpose", { enum: ["EMAIL_MARKETING", "WHATSAPP_MARKETING", "SMS_MARKETING", "PLATFORM_ANALYTICS"] }).notNull(),
  source: text("source").notNull(),
  grantedAt: ts("granted_at").notNull().defaultNow(),
  revokedAt: ts("revoked_at"),
});

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------
export const ORDER_STATUSES = ["PENDING", "AWAITING_CENTRAL_PAYMENT", "AWAITING_LABEL", "READY_TO_PICK", "PICKING", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "CANCELED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orders = pgTable("orders", {
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

export const orderItems = pgTable("order_items", {
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

export const orderEvents = pgTable("order_events", {
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
export const themes = pgTable("themes", {
  id: id(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  tier: text("tier", { enum: ["STARTER", "PRO", "ELITE"] }).notNull(),
  description: text("description").notNull(),
  priceCents: integer("price_cents").notNull().default(0),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  previewAccent: text("preview_accent").notNull(),
  available: boolean("available").notNull().default(false),
});

export const themeVersions = pgTable("theme_versions", {
  id: id(),
  themeId: text("theme_id").notNull().references(() => themes.id),
  version: text("version").notNull(),
  status: text("status", { enum: ["DRAFT", "PUBLISHED", "DEPRECATED"] }).notNull().default("PUBLISHED"),
  createdAt: createdAt(),
});

export const storeThemes = pgTable("store_themes", {
  storeId: text("store_id").primaryKey().references(() => stores.id),
  themeId: text("theme_id").notNull().references(() => themes.id),
  themeVersionId: text("theme_version_id").notNull().references(() => themeVersions.id),
  activatedAt: ts("activated_at").notNull().defaultNow(),
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

export const themeSettings = pgTable("theme_settings", {
  storeId: text("store_id").primaryKey().references(() => stores.id),
  settings: jsonb("settings").$type<ThemeSettingsData>().notNull(),
  updatedAt: updatedAt(),
});

// ---------------------------------------------------------------------------
// Planos / Assinaturas
// ---------------------------------------------------------------------------
export const plans = pgTable("plans", {
  id: id(),
  name: text("name").notNull(),
  priceCents: integer("price_cents").notNull(),
  features: jsonb("features").$type<string[]>().notNull().default([]),
});

export const subscriptions = pgTable("subscriptions", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  planId: text("plan_id").notNull().references(() => plans.id),
  status: text("status", { enum: ["ACTIVE", "PAST_DUE", "SUSPENDED", "CLOSED"] }).notNull().default("ACTIVE"),
  currentPeriodEnd: ts("current_period_end").notNull(),
  createdAt: createdAt(),
});

export const invoices = pgTable("invoices", {
  id: id(),
  subscriptionId: text("subscription_id").notNull().references(() => subscriptions.id),
  amountCents: integer("amount_cents").notNull(),
  dueDate: ts("due_date").notNull(),
  status: text("status", { enum: ["OPEN", "PAID", "OVERDUE"] }).notNull().default("OPEN"),
  paidAt: ts("paid_at"),
});

// ---------------------------------------------------------------------------
// Marketplace NextLevel (serviços) e Conteúdo
// ---------------------------------------------------------------------------
export const services = pgTable("services", {
  id: id(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  priceFromCents: integer("price_from_cents"),
  icon: text("icon").notNull(),
});

export const serviceLeads = pgTable("service_leads", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  serviceId: text("service_id").notNull().references(() => services.id),
  status: text("status", { enum: ["NEW", "CONTACTED", "WON", "LOST"] }).notNull().default("NEW"),
  createdAt: createdAt(),
});

export const contentItems = pgTable("content_items", {
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
export const activities = pgTable("activities", {
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
