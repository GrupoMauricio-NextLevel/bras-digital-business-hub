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
import { sql } from "drizzle-orm";
import { pgTable, text, integer, boolean, jsonb, timestamp, primaryKey, uniqueIndex, index, check, type AnyPgColumn } from "drizzle-orm/pg-core";

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
  type: text("type", { enum: ["NEXTLEVEL", "SUPPLIER", "MERCHANT", "PARTNER"] }).notNull(),
  /** Marca por onde o cliente entrou (NextLevel Commerce, SuperDrop, Brás Digital). Organização e apresentação, não segurança. */
  brand: text("brand", { enum: ["NEXTLEVEL_COMMERCE", "SUPERDROP", "BRAS_DIGITAL", "CREATORS_HUB", "CHINA_HUB", "NEXTLEVEL"] }).notNull().default("SUPERDROP"),
  createdAt: createdAt(),
});

export const suppliers = pgTable("suppliers", {
  id: id(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status", { enum: ["ACTIVE", "WARNING", "PARTIAL_BLOCK", "SUSPENDED", "CLOSED"] }).notNull().default("ACTIVE"),
  /** Modelo comercial SuperDrop (0 setup + 6%) ou White Label (R$6.000 + 3%) */
  businessModel: text("business_model", { enum: ["SUPERDROP", "WHITE_LABEL"] }).notNull().default("SUPERDROP"),
  platformFeePercent: integer("platform_fee_percent").notNull().default(6),
  setupFeeCents: integer("setup_fee_cents").notNull().default(0),
  /** Token do Mercado Pago do fornecedor usado nas recargas Pix dos lojistas (criptografado). */
  walletMpTokenEnc: text("wallet_mp_token_enc"),
  walletMpAccountId: text("wallet_mp_account_id"),
  /** Legado (D89): marcava a antiga "Central oculta" das lojas da Commerce, removida pela migração 0041. Sempre falso. */
  hidden: boolean("hidden").notNull().default(false),
  /** Plataforma de envio conectada (SuperFrete, Melhor Envio ou Onlog): token criptografado e conta. */
  shippingProvider: text("shipping_provider"),
  shippingTokenEnc: text("shipping_token_enc"),
  shippingAccount: text("shipping_account"),
  /** CEP de onde saem os pedidos (só dígitos): origem das cotações de frete. */
  shippingOriginZip: text("shipping_origin_zip"),
  shippingStatus: text("shipping_status", { enum: ["NOT_CONFIGURED", "DEMO", "CONNECTED"] }).notNull().default("NOT_CONFIGURED"),
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
  /** Rede do fornecedor (SuperDrop). Vazio = loja independente da NextLevel Commerce, dona do próprio catálogo (D89). */
  networkId: text("network_id").references(() => networks.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status", { enum: ["PENDING_PAYMENT", "ACTIVE", "SUSPENDED", "CLOSED"] }).notNull().default("ACTIVE"),
  /** MEMBER = loja de membro; SUPPLIER_OWN = loja do próprio fornecedor para vender direto ao público. */
  /** Parceiro que indicou a loja (definido no cadastro e nunca mais alterado) e por qual caminho. */
  partnerId: text("partner_id"),
  attributedVia: text("attributed_via", { enum: ["LINK", "COUPON"] }),
  attributedAt: ts("attributed_at"),
  attributionFlag: text("attribution_flag", { enum: ["FRAUD_REVIEW"] }),
  kind: text("kind", { enum: ["MEMBER", "SUPPLIER_OWN"] }).notNull().default("MEMBER"),
  /** Oferta contratada pelo lojista junto à NextLevel. */
  offer: text("offer", { enum: ["DROP_MANUAL", "STORE_SUBDOMAIN", "STORE_OWN"] }).notNull().default("STORE_SUBDOMAIN"),
  tagline: text("tagline"),
  /** Loja de demonstração pública de um tema (chave do tema). Nunca recebe pedido real e não é indexada. */
  showcaseTheme: text("showcase_theme"),
  /** Pedido mínimo (centavos) para compras pela loja virtual; 0 = sem mínimo. Só conta simples/loja própria. */
  minOrderCents: integer("min_order_cents").notNull().default(0),
  logoUrl: text("logo_url"),
  logoText: text("logo_text"),
  primaryColor: text("primary_color").notNull().default("#0f172a"),
  accentColor: text("accent_color").notNull().default("#16a34a"),
  whatsapp: text("whatsapp"),
  instagram: text("instagram"),
  /** Dados que dão credibilidade à loja (rodapé e "Sobre"). */
  legalName: text("legal_name"),
  cnpj: text("cnpj"),
  contactEmail: text("contact_email"),
  address: text("address"),
  customDomain: text("custom_domain"),
  paymentProvider: text("payment_provider"),
  paymentStatus: text("payment_status", { enum: ["NOT_CONFIGURED", "DEMO", "CONNECTED"] }).notNull().default("NOT_CONFIGURED"),
  /** Access token do Mercado Pago da loja, criptografado (AES-256-GCM). */
  mpAccessTokenEnc: text("mp_access_token_enc"),
  mpPublicKey: text("mp_public_key"),
  /** Plataforma de envio da loja independente (D89; na loja do SuperDrop vale a do fornecedor). Token só criptografado. */
  shippingProvider: text("shipping_provider"),
  shippingStatus: text("shipping_status", { enum: ["NOT_CONFIGURED", "DEMO", "CONNECTED"] }).notNull().default("NOT_CONFIGURED"),
  shippingTokenEnc: text("shipping_token_enc"),
  shippingAccount: text("shipping_account"),
  shippingOriginZip: text("shipping_origin_zip"),
  /** Regras de frete da loja (frete grátis, taxa fixa, retirada, prazo de preparo). */
  shippingConfig: jsonb("shipping_config").$type<Record<string, unknown>>(),
  domainStatus: text("domain_status", { enum: ["NOT_CONFIGURED", "PENDING", "CONNECTED"] }).notNull().default("NOT_CONFIGURED"),
  publishedAt: ts("published_at"),
  /** Teste e assinatura: sem nenhuma das duas datas a loja não tem regra de acesso (contas antigas e demonstração). */
  trialEndsAt: ts("trial_ends_at"),
  paidUntil: ts("paid_until"),
  couponId: text("coupon_id"),
  /** CPF/CNPJ só com dígitos: um teste por documento. */
  taxId: text("tax_id"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("stores_network_idx").on(t.networkId)]);

/** Cupons de teste. Cada cupom pertence a um fornecedor (atribuição da loja à rede dele). */
export const coupons = pgTable("coupons", {
  id: id(),
  code: text("code").notNull().unique(),
  /** Cupom de fornecedor ou de parceiro (um dos dois). Cupom de parceiro não fixa o fornecedor da loja. */
  supplierId: text("supplier_id").references(() => suppliers.id),
  partnerId: text("partner_id"),
  trialDays: integer("trial_days").notNull().default(7),
  maxRedemptions: integer("max_redemptions"),
  redemptions: integer("redemptions").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

/** Um teste por CPF/CNPJ: o documento (só dígitos) é único. */
export const trialClaims = pgTable("trial_claims", {
  taxId: text("tax_id").primaryKey(),
  storeId: text("store_id").notNull().references(() => stores.id),
  couponId: text("coupon_id").notNull().references(() => coupons.id),
  createdAt: createdAt(),
});

export const users = pgTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["NEXTLEVEL_MASTER", "SUPPLIER_ADMIN", "SUPPLIER_DISPATCH", "STORE_OWNER", "AFFILIATE", "BRAS_MEMBER"] }).notNull(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  supplierId: text("supplier_id").references(() => suppliers.id),
  storeId: text("store_id").references(() => stores.id),
  /** Hash scrypt (salt:hash). Null = usuário ainda sem senha (apenas demo). */
  passwordHash: text("password_hash"),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  /** Papel dentro da loja: dono (tudo) ou equipe (operação, sem finanças/configurações). Contas existentes são donas. */
  storeRole: text("store_role", { enum: ["OWNER", "STAFF"] }).notNull().default("OWNER"),
  /** Acesso encerrado (ex.: pessoa saiu da equipe): não entra e sessões antigas deixam de valer. */
  disabledAt: ts("disabled_at"),
  lastLoginAt: ts("last_login_at"),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Catálogo central
// ---------------------------------------------------------------------------
/** Dono do catálogo (D89): um fornecedor do SuperDrop OU uma loja independente da Commerce, nunca os dois. */
export const categories = pgTable("categories", {
  id: id(),
  supplierId: text("supplier_id").references(() => suppliers.id),
  storeId: text("store_id").references((): AnyPgColumn => stores.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
}, (t) => [check("categories_one_owner", sql`(${t.supplierId} is null) <> (${t.storeId} is null)`), index("categories_store_idx").on(t.storeId)]);

export const products = pgTable("products", {
  id: id(),
  /** Dono do catálogo (D89): fornecedor do SuperDrop OU loja independente da Commerce (`store_id`), nunca os dois. */
  supplierId: text("supplier_id").references(() => suppliers.id),
  storeId: text("store_id").references((): AnyPgColumn => stores.id),
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
  /** SEO da página do produto nas lojas (vazio = usa o nome e a descrição). */
  /** Grade de tamanhos do produto: define os tamanhos padrão e a tabela exibida na loja. */
  sizeGrid: text("size_grid", { enum: ["ADULT_MALE", "ADULT_FEMALE", "KIDS", "CUSTOM"] }).notNull().default("CUSTOM"),
  /** Peso e dimensões da embalagem para cotação de frete. */
  weightG: integer("weight_g").notNull().default(300),
  lengthCm: integer("length_cm").notNull().default(30),
  widthCm: integer("width_cm").notNull().default(25),
  heightCm: integer("height_cm").notNull().default(3),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("products_supplier_slug").on(t.supplierId, t.slug), uniqueIndex("products_supplier_sku").on(t.supplierId, t.sku), uniqueIndex("products_store_slug").on(t.storeId, t.slug), uniqueIndex("products_store_sku").on(t.storeId, t.sku), check("products_one_owner", sql`(${t.supplierId} is null) <> (${t.storeId} is null)`)]);

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
  /** Saldos logo antes e logo depois do movimento (trilha auditável). Movimentos antigos ficam sem estes valores. */
  onHandBefore: integer("on_hand_before"),
  onHandAfter: integer("on_hand_after"),
  reservedBefore: integer("reserved_before"),
  reservedAfter: integer("reserved_after"),
  /** Quem fez, quando houver usuário (pedido público e rotinas não têm). */
  actorUserId: text("actor_user_id"),
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
  /** Anotação e etiquetas só desta loja: a mesma pessoa em outra loja tem o seu próprio perfil. */
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
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
  /** Fornecedor que atende o pedido (SuperDrop). Vazio = pedido de loja independente da Commerce (D89). */
  supplierId: text("supplier_id").references(() => suppliers.id),
  storeCustomerId: text("store_customer_id").references(() => storeCustomers.id),
  channel: text("channel", { enum: ["ONLINE_STORE", "WHATSAPP", "INSTAGRAM", "MANUAL"] }).notNull().default("ONLINE_STORE"),
  saleType: text("sale_type", { enum: ["RETAIL", "WHOLESALE"] }).notNull().default("RETAIL"),
  status: text("status", { enum: ORDER_STATUSES }).notNull().default("PENDING"),
  customerPaymentStatus: text("customer_payment_status", { enum: ["PENDING", "PAID", "REFUNDED"] }).notNull().default("PENDING"),
  centralPaymentStatus: text("central_payment_status", { enum: ["PENDING", "PAID"] }).notNull().default("PENDING"),
  /** Momento em que o pagamento à Central foi confirmado (base da taxa de volume). */
  centralPaidAt: ts("central_paid_at"),
  /** Desde quando o pedido (já pago pelo cliente) espera saldo do lojista; expira em 72h. */
  awaitingFundsSince: ts("awaiting_funds_since"),
  shippingLabelStatus: text("shipping_label_status", { enum: ["PENDING", "READY"] }).notNull().default("PENDING"),
  shippingLabelCode: text("shipping_label_code"),
  shippingCarrier: text("shipping_carrier"),
  /** Pagamento do cliente: provedor e referência externa (id do pagamento no Mercado Pago). */
  paymentProvider: text("payment_provider", { enum: ["DEMO", "MERCADO_PAGO", "MANUAL"] }).notNull().default("MANUAL"),
  paymentReference: text("payment_reference"),
  /** Chave enviada pelo checkout para que reenviar a mesma compra devolva o mesmo pedido (documento 02 §46). */
  idempotencyKey: text("idempotency_key"),
  paymentCheckoutUrl: text("payment_checkout_url"),
  /** Reserva de estoque expira se o cliente não pagar até aqui. */
  reservationExpiresAt: ts("reservation_expires_at"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  shippingAddress: text("shipping_address"),
  shippingCity: text("shipping_city"),
  shippingState: text("shipping_state"),
  shippingZip: text("shipping_zip"),
  subtotalCents: integer("subtotal_cents").notNull(),
  /** Desconto do cupom do consumidor (subtotal acima é bruto; venda líquida = subtotal − desconto). */
  discountCents: integer("discount_cents").notNull().default(0),
  discountId: text("discount_id"),
  discountCode: text("discount_code"),
  shippingCents: integer("shipping_cents").notNull().default(0),
  /** Serviço de frete escolhido na compra (nome para exibir) e prazo estimado em dias úteis. */
  shippingService: text("shipping_service"),
  shippingDays: integer("shipping_days"),
  totalCents: integer("total_cents").notNull(),
  costTotalCents: integer("cost_total_cents").notNull(),
  notes: text("notes"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("orders_store_idx").on(t.storeId), index("orders_supplier_idx").on(t.supplierId), uniqueIndex("orders_store_number").on(t.storeId, t.number), uniqueIndex("orders_store_idempotency").on(t.storeId, t.idempotencyKey)]);

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
// Operação do fornecedor: horário de corte, separação (claims) e ondas
// ---------------------------------------------------------------------------
export type Cutoffs = { mon: string | null; tue: string | null; wed: string | null; thu: string | null; fri: string | null; sat: string | null; sun: string | null };

/** Configuração operacional: fuso, horário de corte por dia da semana ("HH:MM" ou null = sem expedição) e feriados (YYYY-MM-DD). */
export const supplierOps = pgTable("supplier_ops", {
  supplierId: text("supplier_id").primaryKey().references(() => suppliers.id),
  timezone: text("timezone").notNull().default("America/Sao_Paulo"),
  cutoffs: jsonb("cutoffs").$type<Cutoffs>().notNull(),
  holidays: jsonb("holidays").$type<string[]>().notNull().default([]),
  /** Peças disponíveis por tamanho para as lojas poderem ativar o produto (ex.: 4). */
  minActivationStock: integer("min_activation_stock").notNull().default(4),
  updatedAt: updatedAt(),
});

/** Página de vendas pública do fornecedor (/f/[slug]). Sem linha, a página usa textos padrão gerados a partir do nome. */
export type SupplierPageFaq = { q: string; a: string };
export type SupplierPageTestimonial = { name: string; role: string; text: string };
export const supplierPages = pgTable("supplier_pages", {
  supplierId: text("supplier_id").primaryKey().references(() => suppliers.id),
  headline: text("headline").notNull(),
  subheadline: text("subheadline").notNull(),
  logoText: text("logo_text"),
  primaryColor: text("primary_color").notNull().default("#0f172a"),
  accentColor: text("accent_color").notNull().default("#16a34a"),
  whatsapp: text("whatsapp"),
  benefits: jsonb("benefits").$type<string[]>().notNull().default([]),
  faq: jsonb("faq").$type<SupplierPageFaq[]>().notNull().default([]),
  published: boolean("published").notNull().default(true),
  /** Logo e imagem de destaque enviados pelo fornecedor (endereço em /brand/... ou https). */
  logoUrl: text("logo_url"),
  heroUrl: text("hero_url"),
  testimonials: jsonb("testimonials").$type<SupplierPageTestimonial[]>().notNull().default([]),
  /** Conteúdo ainda demonstrativo: a página mostra o aviso "conteúdo a fornecer". */
  demoContent: boolean("demo_content").notNull().default(false),
  updatedAt: updatedAt(),
});

/** Quem está separando o pedido (uma linha por pedido; expira sozinha). */
export const orderClaims = pgTable("order_claims", {
  orderId: text("order_id").primaryKey().references(() => orders.id),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  claimedAt: ts("claimed_at").notNull().defaultNow(),
});

/** Onda de separação: conjunto de pedidos impresso e separado junto. */
export const pickWaves = pgTable("pick_waves", {
  id: id(),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  number: integer("number").notNull(),
  /** Dia (YYYY-MM-DD, no fuso do fornecedor) a que a onda pertence. */
  waveDate: text("wave_date").notNull(),
  createdBy: text("created_by"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("pick_waves_number").on(t.supplierId, t.number)]);

export const pickWaveOrders = pgTable("pick_wave_orders", {
  orderId: text("order_id").primaryKey().references(() => orders.id),
  waveId: text("wave_id").notNull().references(() => pickWaves.id),
}, (t) => [index("pick_wave_orders_wave_idx").on(t.waveId)]);

// ---------------------------------------------------------------------------
// Etiquetas de envio (arquivo PDF do SuperFrete) e histórico de impressão
// ---------------------------------------------------------------------------
export const orderLabelFiles = pgTable("order_label_files", {
  id: id(),
  orderId: text("order_id").notNull().references(() => orders.id),
  filename: text("filename").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  sha256: text("sha256").notNull(),
  /** Conteúdo em base64 (armazenamento do MVP, atrás da interface LabelStorage). Nunca listado em consultas comuns. */
  dataBase64: text("data_base64").notNull(),
  uploadedBy: text("uploaded_by"),
  createdAt: createdAt(),
}, (t) => [index("order_label_files_order_idx").on(t.orderId), uniqueIndex("order_label_files_unique").on(t.orderId, t.sha256)]);

export const labelPrints = pgTable("label_prints", {
  id: id(),
  orderId: text("order_id").notNull().references(() => orders.id),
  kind: text("kind", { enum: ["LABEL", "PICKING_LIST"] }).notNull(),
  printedBy: text("printed_by"),
  createdAt: createdAt(),
}, (t) => [index("label_prints_order_idx").on(t.orderId)]);

// ---------------------------------------------------------------------------
// Carteira do lojista (recarga Pix; custo dos pedidos é debitado do saldo)
// ---------------------------------------------------------------------------
export const WALLET_ENTRY_TYPES = ["RECHARGE", "ORDER_DEBIT", "ORDER_REFUND", "MANUAL_CREDIT", "MANUAL_DEBIT"] as const;
export type WalletEntryType = (typeof WALLET_ENTRY_TYPES)[number];

export const walletAccounts = pgTable("wallet_accounts", {
  id: id(),
  storeId: text("store_id").notNull().unique().references(() => stores.id),
  /** Saldo em cache; a verdade é a soma de wallet_entries (conferida nos testes). */
  balanceCents: integer("balance_cents").notNull().default(0),
  createdAt: createdAt(),
});

export const walletRecharges = pgTable("wallet_recharges", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  amountCents: integer("amount_cents").notNull(),
  status: text("status", { enum: ["PENDING", "PAID", "EXPIRED", "FAILED"] }).notNull().default("PENDING"),
  mpPaymentId: text("mp_payment_id"),
  pixCode: text("pix_code"),
  pixQrBase64: text("pix_qr_base64"),
  expiresAt: ts("expires_at"),
  paidAt: ts("paid_at"),
  createdAt: createdAt(),
}, (t) => [index("wallet_recharges_store_idx").on(t.storeId)]);

export const walletEntries = pgTable("wallet_entries", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  type: text("type", { enum: WALLET_ENTRY_TYPES }).notNull(),
  /** Com sinal: crédito positivo, débito negativo. */
  amountCents: integer("amount_cents").notNull(),
  balanceAfterCents: integer("balance_after_cents").notNull(),
  orderId: text("order_id").references(() => orders.id),
  rechargeId: text("recharge_id").references(() => walletRecharges.id),
  note: text("note"),
  actorUserId: text("actor_user_id"),
  createdAt: createdAt(),
}, (t) => [
  index("wallet_entries_store_idx").on(t.storeId),
  uniqueIndex("wallet_debit_once").on(t.orderId).where(sql`type = 'ORDER_DEBIT'`),
  uniqueIndex("wallet_recharge_once").on(t.rechargeId).where(sql`type = 'RECHARGE'`),
]);

// ---------------------------------------------------------------------------
// Template Engine / Theme Store
// ---------------------------------------------------------------------------
export const themes = pgTable("themes", {
  id: id(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  tier: text("tier", { enum: ["STARTER", "PRO", "ELITE", "SIGNATURE"] }).notNull(),
  description: text("description").notNull(),
  priceCents: integer("price_cents").notNull().default(0),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  previewAccent: text("preview_accent").notNull(),
  available: boolean("available").notNull().default(false),
  /** Espelho do catálogo (src/lib/themes/catalog.ts): família, nível N1–N4 e estado de liberação. */
  family: text("family").notNull().default("base"),
  level: integer("level").notNull().default(1),
  release: text("release", { enum: ["released", "review", "draft"] }).notNull().default("released"),
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
// Motor de temas: modelos de página em JSON (rascunho e publicado) e histórico
// ---------------------------------------------------------------------------
/** Modelo de uma página da loja. `draft` nulo significa "sem alterações pendentes". */
export const themeTemplates = pgTable("theme_templates", {
  storeId: text("store_id").notNull().references(() => stores.id),
  page: text("page", { enum: ["home", "product", "collection", "cart"] }).notNull(),
  draft: jsonb("draft").$type<import("@/lib/themes/types").Template | null>(),
  published: jsonb("published").$type<import("@/lib/themes/types").Template | null>(),
  /** Sobe a cada gravação do rascunho: duas abas com a mesma base não se sobrescrevem em silêncio. */
  revision: integer("revision").notNull().default(0),
  updatedAt: updatedAt(),
}, (t) => [primaryKey({ columns: [t.storeId, t.page] })]);

/** Estilo do tema e grupos globais (cabeçalho e rodapé) da loja. */
export const themeGlobals = pgTable("theme_globals", {
  storeId: text("store_id").primaryKey().references(() => stores.id),
  draft: jsonb("draft").$type<import("@/lib/themes/types").ThemeGlobals | null>(),
  published: jsonb("published").$type<import("@/lib/themes/types").ThemeGlobals | null>(),
  revision: integer("revision").notNull().default(0),
  updatedAt: updatedAt(),
});

/** Histórico das publicações (as últimas 20 por página) para restaurar versões. */
export const themeTemplateVersions = pgTable("theme_template_versions", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  /** Uma página ou "globals". */
  page: text("page").notNull(),
  snapshot: jsonb("snapshot").$type<unknown>().notNull(),
  label: text("label").notNull(),
  createdBy: text("created_by"),
  /** Tema ativo quando a versão foi guardada (restaurar volta a ele, se a loja tiver direito). */
  themeKey: text("theme_key"),
  /** "draft" quando a versão guarda um rascunho (ex.: antes de instalar outro tema). */
  kind: text("kind", { enum: ["published", "draft"] }).notNull().default("published"),
  createdAt: createdAt(),
}, (t) => [index("theme_template_versions_idx").on(t.storeId, t.page)]);

/** Modelos salvos pelo lojista: seção (N3) ou página/campanha (N4). Só da própria loja. */
export const themeSavedTemplates = pgTable("theme_saved_templates", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  kind: text("kind", { enum: ["section", "page"] }).notNull(),
  name: text("name").notNull(),
  page: text("page"),
  data: jsonb("data").$type<unknown>().notNull(),
  createdBy: text("created_by"),
  createdAt: createdAt(),
}, (t) => [index("theme_saved_templates_store_idx").on(t.storeId)]);

// ---------------------------------------------------------------------------
// Planos / Assinaturas
// ---------------------------------------------------------------------------
export const plans = pgTable("plans", {
  id: id(),
  /** Chave da oferta (DROP_MANUAL, STORE_SUBDOMAIN, STORE_OWN). */
  key: text("key"),
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
// Financeiro da plataforma
// ---------------------------------------------------------------------------
/** Configurações globais editáveis (ex.: tabela de preços). Valor validado por zod na leitura. */
export const platformSettings = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: updatedAt(),
  updatedBy: text("updated_by"),
});

/** Contrato comercial de cada fornecedor com a NextLevel. Valores nascem da tabela de preços e podem ser negociados. */
export const supplierContracts = pgTable("supplier_contracts", {
  supplierId: text("supplier_id").primaryKey().references(() => suppliers.id),
  tier: text("tier", { enum: ["START", "GROWTH", "SCALE"] }).notNull().default("GROWTH"),
  monthlyFeeCents: integer("monthly_fee_cents").notNull(),
  setupFeeCents: integer("setup_fee_cents").notNull().default(0),
  /** Taxa sobre o custo dos pedidos com pagamento à Central confirmado, em pontos-base (300 = 3%). */
  volumeFeeBps: integer("volume_fee_bps").notNull(),
  minMonthlyFeeCents: integer("min_monthly_fee_cents").notNull().default(0),
  perOrderFeeCents: integer("per_order_fee_cents").notNull().default(0),
  /** Comissão do fornecedor sobre o setup de cada loja nova (2500 = 25%). */
  storeSetupCommissionBps: integer("store_setup_commission_bps").notNull().default(2500),
  monthlyWaivedUntil: ts("monthly_waived_until"),
  setupWaivedUntil: ts("setup_waived_until"),
  priceLockUntil: ts("price_lock_until"),
  /** Saldo a favor (+) ou em débito (−) do fornecedor, compensado no próximo fechamento. */
  creditBalanceCents: integer("credit_balance_cents").notNull().default(0),
  notes: text("notes"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type InvoiceLine = { kind: string; description: string; amountCents: number };

/** Cobranças da NextLevel a fornecedores e a lojas (setup, mensalidade do fornecedor, fechamento mensal de taxas). */
export const financeInvoices = pgTable("finance_invoices", {
  id: id(),
  dedupeKey: text("dedupe_key").notNull().unique(),
  payerType: text("payer_type", { enum: ["SUPPLIER", "STORE", "PARTNER"] }).notNull(),
  supplierId: text("supplier_id").references(() => suppliers.id),
  storeId: text("store_id").references(() => stores.id),
  partnerId: text("partner_id"),
  kind: text("kind", { enum: ["SUPPLIER_SETUP", "SUPPLIER_SUBSCRIPTION", "SUPPLIER_CLOSING", "STORE_SETUP", "STORE_PLAN", "ADDON", "SERVICE", "PARTNER_FEE", "STORE_ORDER_FEES"] }).notNull(),
  /** Competência YYYY-MM (mensalidade e fechamento). */
  period: text("period"),
  description: text("description").notNull(),
  amountCents: integer("amount_cents").notNull(),
  lines: jsonb("lines").$type<InvoiceLine[]>().notNull().default([]),
  status: text("status", { enum: ["OPEN", "PAID", "OVERDUE", "WAIVED", "CANCELED"] }).notNull().default("OPEN"),
  dueDate: ts("due_date").notNull(),
  paidAt: ts("paid_at"),
  createdAt: createdAt(),
}, (t) => [index("finance_invoices_supplier_idx").on(t.supplierId), index("finance_invoices_status_idx").on(t.status)]);

/** Direitos de acesso comprados ou concedidos (add-ons). Valem enquanto endsAt for nulo ou futuro. */
export const entitlements = pgTable("entitlements", {
  id: id(),
  tenantType: text("tenant_type", { enum: ["STORE", "SUPPLIER"] }).notNull(),
  storeId: text("store_id").references(() => stores.id),
  supplierId: text("supplier_id").references(() => suppliers.id),
  /** Chave do add-on (ADDON_KEYS) ou de um módulo de conteúdo. */
  key: text("key").notNull(),
  source: text("source", { enum: ["ADD_ON", "COURTESY", "PLAN"] }).notNull(),
  startsAt: ts("starts_at").notNull().defaultNow(),
  endsAt: ts("ends_at"),
  invoiceId: text("invoice_id").references(() => financeInvoices.id),
  note: text("note"),
  createdAt: createdAt(),
}, (t) => [index("entitlements_store_idx").on(t.storeId), index("entitlements_supplier_idx").on(t.supplierId)]);

/** Cobranças de faturas da NextLevel na conta Mercado Pago da NextLevel (Pix). */
export const nextlevelPayments = pgTable("nextlevel_payments", {
  id: id(),
  invoiceId: text("invoice_id").notNull().references(() => financeInvoices.id),
  mpPaymentId: text("mp_payment_id").unique(),
  status: text("status", { enum: ["PENDING", "PAID", "EXPIRED", "FAILED"] }).notNull().default("PENDING"),
  /** PIX (código copia e cola) ou CARD (Checkout Pro do Mercado Pago, em até 6x). */
  method: text("method", { enum: ["PIX", "CARD"] }).notNull().default("PIX"),
  checkoutUrl: text("checkout_url"),
  amountCents: integer("amount_cents").notNull(),
  pixCode: text("pix_code"),
  pixQrBase64: text("pix_qr_base64"),
  expiresAt: ts("expires_at"),
  paidAt: ts("paid_at"),
  createdAt: createdAt(),
}, (t) => [index("nextlevel_payments_invoice_idx").on(t.invoiceId)]);

/** Eventos de domínio: alimentam automações, fila do dia e saúde (dedupeKey torna a emissão idempotente). */
export const domainEvents = pgTable("domain_events", {
  id: id(),
  type: text("type").notNull(),
  supplierId: text("supplier_id"),
  storeId: text("store_id"),
  actorRole: text("actor_role"),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  dedupeKey: text("dedupe_key").unique(),
  createdAt: createdAt(),
}, (t) => [index("domain_events_type_idx").on(t.type), index("domain_events_store_idx").on(t.storeId)]);

/**
 * Trilha de auditoria geral (documento 03 §43 a §45): quem mudou o quê e quando. Só campos não sensíveis
 * (preço, equipe, dados legais, publicação); segredos e senhas nunca entram. Complementa `activities` (linha do tempo visível).
 */
export const auditLog = pgTable("audit_log", {
  id: id(),
  storeId: text("store_id"),
  supplierId: text("supplier_id"),
  actorUserId: text("actor_user_id"),
  actorRole: text("actor_role"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  changes: jsonb("changes").$type<Record<string, { from?: unknown; to?: unknown }>>().notNull().default({}),
  createdAt: createdAt(),
}, (t) => [index("audit_log_store_idx").on(t.storeId, t.createdAt), index("audit_log_entity_idx").on(t.entityType, t.entityId)]);

/** Loja adquirida por um fornecedor: origem da comissão de canal sobre o setup. */
export const storeAcquisitions = pgTable("store_acquisitions", {
  id: id(),
  storeId: text("store_id").notNull().unique().references(() => stores.id),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  offer: text("offer", { enum: ["DROP_MANUAL", "STORE_SUBDOMAIN", "STORE_OWN"] }).notNull(),
  setupCents: integer("setup_cents").notNull(),
  commissionBps: integer("commission_bps").notNull(),
  commissionCents: integer("commission_cents").notNull(),
  /** PENDING_PAYMENT → GUARANTEE (pago, aguardando prazo de arrependimento) → CREDITED (abatida no fechamento). */
  status: text("status", { enum: ["PENDING_PAYMENT", "GUARANTEE", "CREDITED", "CANCELED"] }).notNull().default("PENDING_PAYMENT"),
  invoiceId: text("invoice_id").references(() => financeInvoices.id),
  paidAt: ts("paid_at"),
  eligibleAt: ts("eligible_at"),
  creditedInvoiceId: text("credited_invoice_id").references(() => financeInvoices.id),
  createdAt: createdAt(),
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
  /** Painéis para os quais o serviço é oferecido. */
  audience: jsonb("audience").$type<("lite" | "pro" | "supplier")[]>().notNull().default(["lite", "pro"]),
  /** SERVICE = serviço prestado pela equipe; UPGRADE = troca de oferta (libera recursos). */
  kind: text("kind", { enum: ["SERVICE", "UPGRADE"] }).notNull().default("SERVICE"),
  upgradeOffer: text("upgrade_offer", { enum: ["DROP_MANUAL", "STORE_SUBDOMAIN", "STORE_OWN"] }),
  deliveryDays: integer("delivery_days"),
  highlights: jsonb("highlights").$type<string[]>().notNull().default([]),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
});

export const SERVICE_ORDER_STATUSES = ["REQUESTED", "IN_ANALYSIS", "QUOTED", "IN_PROGRESS", "DELIVERED", "CANCELED"] as const;
export type ServiceOrderStatus = (typeof SERVICE_ORDER_STATUSES)[number];

/** Pedido de serviço da Loja NextLevel (lojista ou fornecedor contratante). */
export const serviceOrders = pgTable("service_orders", {
  id: id(),
  serviceId: text("service_id").notNull().references(() => services.id),
  requesterType: text("requester_type", { enum: ["STORE", "SUPPLIER"] }).notNull(),
  storeId: text("store_id").references(() => stores.id),
  supplierId: text("supplier_id").references(() => suppliers.id),
  requesterUserId: text("requester_user_id").notNull(),
  status: text("status", { enum: SERVICE_ORDER_STATUSES }).notNull().default("REQUESTED"),
  briefing: text("briefing").notNull(),
  quotedCents: integer("quoted_cents"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("service_orders_store_idx").on(t.storeId), index("service_orders_supplier_idx").on(t.supplierId)]);

export const serviceMessages = pgTable("service_messages", {
  id: id(),
  serviceOrderId: text("service_order_id").notNull().references(() => serviceOrders.id),
  authorRole: text("author_role").notNull(),
  authorUserId: text("author_user_id").notNull(),
  body: text("body").notNull(),
  createdAt: createdAt(),
}, (t) => [index("service_messages_order_idx").on(t.serviceOrderId)]);

export const serviceLeads = pgTable("service_leads", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  serviceId: text("service_id").notNull().references(() => services.id),
  status: text("status", { enum: ["NEW", "CONTACTED", "WON", "LOST"] }).notNull().default("NEW"),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Programa de Parceiros (afiliados): vendem planos NextLevel e comissionam
// ---------------------------------------------------------------------------
export const PARTNER_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

export const partners = pgTable("partners", {
  id: id(),
  userId: text("user_id").notNull().unique().references(() => users.id),
  /** Extensível: hoje só AFFILIATE. */
  kind: text("kind", { enum: ["AFFILIATE"] }).notNull().default("AFFILIATE"),
  code: text("code").notNull().unique(),
  displayName: text("display_name").notNull(),
  taxId: text("tax_id").notNull().unique(),
  phone: text("phone").notNull(),
  /** Chave Pix criptografada (a mesma proteção dos tokens); o saque é para o mesmo CPF/CNPJ. */
  pixKeyEnc: text("pix_key_enc"),
  status: text("status", { enum: PARTNER_STATUSES }).notNull().default("ACTIVE"),
  /** Última competência (YYYY-MM) coberta pela taxa de manutenção do cadastro inativo. */
  feePaidPeriod: text("fee_paid_period"),
  termsVersion: text("terms_version").notNull(),
  termsAcceptedAt: ts("terms_accepted_at").notNull(),
  createdAt: createdAt(),
});

export const partnerLinks = pgTable("partner_links", {
  id: id(),
  partnerId: text("partner_id").notNull().references(() => partners.id),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  campaign: text("campaign"),
  planKey: text("plan_key", { enum: ["DROP_MANUAL", "STORE_SUBDOMAIN", "STORE_OWN"] }),
  clicks: integer("clicks").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [index("partner_links_partner_idx").on(t.partnerId)]);

export const partnerClicks = pgTable("partner_clicks", {
  id: id(),
  linkId: text("link_id").notNull().references(() => partnerLinks.id),
  at: ts("at").notNull().defaultNow(),
  /** Hashes com sal: nunca o IP ou o agente de usuário puros (LGPD). */
  ipHash: text("ip_hash").notNull(),
  uaHash: text("ua_hash").notNull(),
});

export const PARTNER_COMMISSION_KINDS = ["SETUP", "MAINTENANCE", "ADJUSTMENT", "CLAWBACK", "PAYOUT", "PAYOUT_REVERSAL", "FEE", "MANUAL"] as const;
export type PartnerCommissionKind = (typeof PARTNER_COMMISSION_KINDS)[number];

/** Livro-razão do parceiro: imutável; correções entram como lançamentos novos. Saldo disponível = soma dos lançamentos AVAILABLE. */
export const partnerCommissions = pgTable("partner_commissions", {
  id: id(),
  partnerId: text("partner_id").notNull().references(() => partners.id),
  storeId: text("store_id").references(() => stores.id),
  invoiceId: text("invoice_id").references(() => financeInvoices.id),
  /** Lançamento que este corrige (ajuste do fechamento). */
  refId: text("ref_id"),
  payoutId: text("payout_id"),
  kind: text("kind", { enum: PARTNER_COMMISSION_KINDS }).notNull(),
  baseCents: integer("base_cents").notNull().default(0),
  rateBps: integer("rate_bps").notNull().default(0),
  amountCents: integer("amount_cents").notNull(),
  period: text("period").notNull(),
  status: text("status", { enum: ["PENDING", "AVAILABLE", "PAID", "VOID"] }).notNull().default("PENDING"),
  availableAt: ts("available_at"),
  note: text("note"),
  dedupeKey: text("dedupe_key").notNull().unique(),
  createdAt: createdAt(),
}, (t) => [index("partner_commissions_partner_idx").on(t.partnerId), index("partner_commissions_period_idx").on(t.period)]);

export const partnerMonthStatus = pgTable("partner_month_status", {
  partnerId: text("partner_id").notNull().references(() => partners.id),
  period: text("period").notNull(),
  activations: integer("activations").notNull(),
  tierBps: integer("tier_bps").notNull(),
  metGoal: boolean("met_goal").notNull(),
  closedAt: ts("closed_at").notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.partnerId, t.period] })]);

export const partnerPayouts = pgTable("partner_payouts", {
  id: id(),
  partnerId: text("partner_id").notNull().references(() => partners.id),
  amountCents: integer("amount_cents").notNull(),
  pixKeySnapshot: text("pix_key_snapshot").notNull(),
  status: text("status", { enum: ["REQUESTED", "APPROVED", "PAID", "REJECTED"] }).notNull().default("REQUESTED"),
  requestedAt: ts("requested_at").notNull().defaultNow(),
  decidedBy: text("decided_by"),
  decidedAt: ts("decided_at"),
  paidAt: ts("paid_at"),
  receiptNote: text("receipt_note"),
}, (t) => [index("partner_payouts_partner_idx").on(t.partnerId)]);

// ---------------------------------------------------------------------------
// E-mail transacional e recuperação de senha
// ---------------------------------------------------------------------------
/** Tudo o que o sistema envia por e-mail fica registrado (auditoria e reenvio). Sem provedor configurado, o status é LOGGED. */
export const emailOutbox = pgTable("email_outbox", {
  id: id(),
  kind: text("kind").notNull(),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status", { enum: ["LOGGED", "SENT", "FAILED"] }).notNull(),
  error: text("error"),
  /** Trava de envio único (ex.: um aviso de vencimento por fatura e dia). */
  dedupeKey: text("dedupe_key").unique(),
  createdAt: createdAt(),
}, (t) => [index("email_outbox_created_idx").on(t.createdAt)]);

export const passwordResets = pgTable("password_resets", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id),
  /** Só o hash do token é guardado; o token vai apenas no link enviado por e-mail. */
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: ts("expires_at").notNull(),
  usedAt: ts("used_at"),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Interessados por marca (lista de espera e implantação assistida)
// ---------------------------------------------------------------------------
export const brandLeads = pgTable("brand_leads", {
  id: id(),
  brand: text("brand", { enum: ["NEXTLEVEL_COMMERCE", "SUPERDROP", "BRAS_DIGITAL", "CREATORS_HUB", "CHINA_HUB", "NEXTLEVEL"] }).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  storeName: text("store_name"),
  segment: text("segment"),
  message: text("message"),
  affiliateRef: text("affiliate_ref"),
  status: text("status", { enum: ["NEW", "CONTACTED", "WON", "LOST"] }).notNull().default("NEW"),
  notes: text("notes"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("brand_leads_brand_idx").on(t.brand, t.status)]);

// ---------------------------------------------------------------------------
// Vendas digitais da NextLevel (LP/loja pública) e CRM de pedidos
// ---------------------------------------------------------------------------
export const DIGITAL_CATEGORIES = ["ASSESSORIA", "CURSO", "TEMA", "SERVICO", "PLANO"] as const;
export type DigitalCategory = (typeof DIGITAL_CATEGORIES)[number];

/** Produto digital ou serviço vendido em `/loja-nextlevel` com compra em 1 clique. `priceCents` é o valor cheio (cartão, até 6x). */
export const digitalProducts = pgTable("digital_products", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  category: text("category", { enum: DIGITAL_CATEGORIES }).notNull(),
  priceCents: integer("price_cents").notNull(),
  highlights: jsonb("highlights").$type<string[]>().notNull().default([]),
  /** O que o comprador recebe e como será entregue. */
  deliverable: text("deliverable").notNull(),
  badge: text("badge"),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(100),
  createdAt: createdAt(),
});

export const NL_ORDER_STATUSES = ["AWAITING_PAYMENT", "PAID", "CONTACTED", "IN_PROGRESS", "DELIVERED", "CANCELED"] as const;
export type NlOrderStatus = (typeof NL_ORDER_STATUSES)[number];

/** Pedido da Loja NextLevel pública: é também o cartão do CRM. `token` dá acesso ao acompanhamento sem login. */
export const nlOrders = pgTable("nl_orders", {
  id: id(),
  number: integer("number").notNull().unique(),
  token: text("token").notNull().unique(),
  productId: text("product_id").notNull().references(() => digitalProducts.id),
  productName: text("product_name").notNull(),
  listCents: integer("list_cents").notNull(),
  chargedCents: integer("charged_cents").notNull(),
  method: text("method", { enum: ["PIX", "CARD"] }).notNull(),
  status: text("status", { enum: NL_ORDER_STATUSES }).notNull().default("AWAITING_PAYMENT"),
  buyerName: text("buyer_name").notNull(),
  buyerEmail: text("buyer_email").notNull(),
  buyerPhone: text("buyer_phone").notNull(),
  buyerTaxId: text("buyer_tax_id"),
  /** Código do parceiro que indicou a venda (programa de parceiros). */
  affiliateRef: text("affiliate_ref"),
  mpPaymentId: text("mp_payment_id"),
  pixCode: text("pix_code"),
  pixQrBase64: text("pix_qr_base64"),
  checkoutUrl: text("checkout_url"),
  expiresAt: ts("expires_at"),
  paidAt: ts("paid_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("nl_orders_status_idx").on(t.status)]);

export const nlOrderNotes = pgTable("nl_order_notes", {
  id: id(),
  orderId: text("order_id").notNull().references(() => nlOrders.id),
  kind: text("kind", { enum: ["NOTE", "STATUS", "SYSTEM"] }).notNull().default("NOTE"),
  authorUserId: text("author_user_id"),
  body: text("body").notNull(),
  createdAt: createdAt(),
}, (t) => [index("nl_order_notes_order_idx").on(t.orderId)]);

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

export type ThemeTemplateRow = typeof themeTemplates.$inferSelect;
export type ThemeTemplateVersion = typeof themeTemplateVersions.$inferSelect;
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
export type SupplierContract = typeof supplierContracts.$inferSelect;
export type FinanceInvoice = typeof financeInvoices.$inferSelect;
export type StoreAcquisition = typeof storeAcquisitions.$inferSelect;

/** Imagens enviadas pelo lojista (logo, banners, fotos do tema). Servidas em /assets/[id] com cache longo. */
export const storeAssets = pgTable("store_assets", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  mime: text("mime").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  dataBase64: text("data_base64").notNull(),
  /** Dimensões conferidas na decodificação (nulas em imagens antigas, preenchidas ao serem lidas). */
  width: integer("width"),
  height: integer("height"),
  /** Nome amigável e descrição padrão para leitores de tela (cada uso pode trocar). */
  name: text("name"),
  alt: text("alt"),
  /** Arquivada: some da biblioteca, mas continua servida enquanto houver uso publicado ou versão restaurável. */
  archivedAt: ts("archived_at"),
  createdAt: createdAt(),
}, (t) => [index("store_assets_store_idx").on(t.storeId)]);

// ---------------------------------------------------------------------------
// Propostas comerciais (venda assistida): link com validade que vira pedido uma única vez
// ---------------------------------------------------------------------------
export const PROPOSAL_STATUSES = ["OPEN", "CONVERTED", "CANCELED"] as const;
export type ProposalLine = { productId: string; variantId?: string; packId?: string; quantity: number; label: string; unitPriceCents: number };
export const proposals = pgTable("proposals", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  /** Código longo e aleatório do link público. */
  token: text("token").notNull().unique(),
  status: text("status", { enum: PROPOSAL_STATUSES }).notNull().default("OPEN"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  items: jsonb("items").$type<ProposalLine[]>().notNull(),
  /** Soma dos itens no momento da proposta (sem frete). Ao aceitar, o pedido só nasce se o catálogo ainda tiver o mesmo valor. */
  subtotalCents: integer("subtotal_cents").notNull(),
  expiresAt: ts("expires_at").notNull(),
  orderId: text("order_id").references(() => orders.id),
  createdAt: createdAt(),
}, (t) => [index("proposals_store_idx").on(t.storeId)]);

// ---------------------------------------------------------------------------
// Campanhas da loja: faixa de aviso no topo da vitrine com agenda (início e fim)
// ---------------------------------------------------------------------------
export const storeCampaigns = pgTable("store_campaigns", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  text: text("text").notNull(),
  /** Link seguro: caminho da própria loja (começa com /) ou https://. */
  linkUrl: text("link_url"),
  startsAt: ts("starts_at").notNull(),
  endsAt: ts("ends_at").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
}, (t) => [index("store_campaigns_store_idx").on(t.storeId)]);

// ---------------------------------------------------------------------------
// Cupons de desconto do consumidor (por loja). Separados de `coupons`, que são cupons de teste grátis (código global).
// ---------------------------------------------------------------------------
export const storeDiscounts = pgTable("store_discounts", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  code: text("code").notNull(),
  kind: text("kind", { enum: ["PERCENT", "FIXED"] }).notNull(),
  /** PERCENT: 1 a 90. FIXED: centavos. */
  value: integer("value").notNull(),
  minSubtotalCents: integer("min_subtotal_cents").notNull().default(0),
  maxRedemptions: integer("max_redemptions"),
  redemptions: integer("redemptions").notNull().default(0),
  startsAt: ts("starts_at"),
  expiresAt: ts("expires_at"),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("store_discounts_code_unique").on(t.storeId, t.code)]);

// ---------------------------------------------------------------------------
// Preço de atacado por quantidade (a partir de N peças do mesmo produto, preço unitário menor). Só conta simples/loja própria.
// ---------------------------------------------------------------------------
export const storePriceTiers = pgTable("store_price_tiers", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  productId: text("product_id").notNull().references(() => products.id),
  minQty: integer("min_qty").notNull(),
  priceCents: integer("price_cents").notNull(),
}, (t) => [uniqueIndex("store_price_tiers_unique").on(t.storeId, t.productId, t.minQty)]);

// ---------------------------------------------------------------------------
// Avaliações de produto: só de quem comprou (pedido pago e enviado), com moderação do lojista
// ---------------------------------------------------------------------------
export const REVIEW_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export const productReviews = pgTable("product_reviews", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  productId: text("product_id").notNull().references(() => products.id),
  orderId: text("order_id").notNull().references(() => orders.id),
  /** Só o primeiro nome aparece publicamente. */
  authorName: text("author_name").notNull(),
  rating: integer("rating").notNull(),
  body: text("body"),
  status: text("status", { enum: REVIEW_STATUSES }).notNull().default("PENDING"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("product_reviews_order_product").on(t.orderId, t.productId), index("product_reviews_product_idx").on(t.storeId, t.productId)]);

// ---------------------------------------------------------------------------
// Avise-me: cliente deixa o contato num tamanho esgotado; o lojista vê a demanda e avisa por conta própria (nada é enviado automaticamente)
// ---------------------------------------------------------------------------
export const stockAlerts = pgTable("stock_alerts", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  productId: text("product_id").notNull().references(() => products.id),
  variantId: text("variant_id").notNull().references(() => productVariants.id),
  contactKind: text("contact_kind", { enum: ["EMAIL", "WHATSAPP"] }).notNull(),
  contact: text("contact").notNull(),
  notifiedAt: ts("notified_at"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("stock_alerts_unique").on(t.storeId, t.variantId, t.contact), index("stock_alerts_store_idx").on(t.storeId)]);

// ---------------------------------------------------------------------------
// Rotinas agendadas: último resultado de cada uma (o Master vê se pararam de rodar)
// ---------------------------------------------------------------------------
export const jobRuns = pgTable("job_runs", {
  id: id(),
  job: text("job").notNull(),
  ok: boolean("ok").notNull(),
  /** Resumo curto e sem dado pessoal (contagens, mensagem de erro resumida). */
  detail: text("detail"),
  durationMs: integer("duration_ms").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [index("job_runs_job_idx").on(t.job, t.createdAt)]);

// ---------------------------------------------------------------------------
// Painel de erros: exceções do servidor e do navegador, agrupadas (mensagens já mascaradas)
// ---------------------------------------------------------------------------
export const errorEvents = pgTable("error_events", {
  id: id(),
  /** Hash da origem + rota + mensagem sem números: o mesmo erro repetido soma na mesma linha. */
  fingerprint: text("fingerprint").notNull().unique(),
  origin: text("origin", { enum: ["SERVER", "BROWSER"] }).notNull(),
  route: text("route").notNull(),
  message: text("message").notNull(),
  stack: text("stack"),
  count: integer("count").notNull().default(1),
  firstAt: ts("first_at").notNull().defaultNow(),
  lastAt: ts("last_at").notNull().defaultNow(),
  resolvedAt: ts("resolved_at"),
  /** De onde veio (ação do painel, provedor de pagamento...), e a última loja e código de referência afetados. Só o slug público, nunca dado pessoal. */
  context: text("context"),
  lastStoreSlug: text("last_store_slug"),
  lastRef: text("last_ref"),
}, (t) => [index("error_events_last_idx").on(t.lastAt)]);

// ---------------------------------------------------------------------------
// Brás Digital (D91): membro comprador com CNPJ e vídeos de análise da página pública
// ---------------------------------------------------------------------------
/** Membro comprador da Brás (lojista B2B). Cadastro grátis com CNPJ libera na hora; o Master pode bloquear. Um cadastro por CNPJ. */
export const bdMembers = pgTable("bd_members", {
  id: id(),
  userId: text("user_id").notNull().unique().references(() => users.id),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  /** CNPJ só com dígitos (14), dígitos verificadores conferidos no cadastro. */
  cnpj: text("cnpj").notNull().unique(),
  companyName: text("company_name").notNull(),
  whatsapp: text("whatsapp").notNull(),
  status: text("status", { enum: ["ACTIVE", "BLOCKED"] }).notNull().default("ACTIVE"),
  blockedAt: ts("blocked_at"),
  /** Motivo interno do bloqueio (só o Master vê). */
  blockedReason: text("blocked_reason"),
  createdAt: createdAt(),
}, (t) => [index("bd_members_status_idx").on(t.status, t.createdAt)]);

/** Vídeo de análise de produto no YouTube, mostrado na página pública e no Meu Brás. Sem preço e sem importadora. */
export const bdVideos = pgTable("bd_videos", {
  id: id(),
  youtubeId: text("youtube_id").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary"),
  position: integer("position").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdBy: text("created_by"),
  createdAt: createdAt(),
}, (t) => [index("bd_videos_order_idx").on(t.active, t.position)]);
