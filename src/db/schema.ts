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
  type: text("type", { enum: ["NEXTLEVEL", "SUPPLIER", "MERCHANT", "PARTNER", "AGENCY"] }).notNull(),
  /** Marca por onde o cliente entrou (NextLevel Commerce, SuperDrop, Brás Digital). Organização e apresentação, não segurança. */
  brand: text("brand", { enum: ["NEXTLEVEL_COMMERCE", "SUPERDROP", "BRAS_DIGITAL", "CREATORS_HUB", "CHINA_HUB", "NEXTLEVEL", "NEXTLEVEL_CARGAS"] }).notNull().default("SUPERDROP"),
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
  attributedVia: text("attributed_via", { enum: ["LINK", "COUPON", "EXECUTIVO"] }),
  attributedAt: ts("attributed_at"),
  attributionFlag: text("attribution_flag", { enum: ["FRAUD_REVIEW"] }),
  kind: text("kind", { enum: ["MEMBER", "SUPPLIER_OWN"] }).notNull().default("MEMBER"),
  /** Oferta contratada pelo lojista junto à NextLevel. */
  offer: text("offer", { enum: ["DROP_MANUAL", "STORE_SUBDOMAIN", "STORE_OWN"] }).notNull().default("STORE_SUBDOMAIN"),
  /**
   * Caminho do negócio (NB1, D306/D306): LOJA = loja virtual (todas as contas antigas); SITE = site da empresa, sem
   * catálogo, carrinho e checkout na vitrine até ligar a loja. Fonte única de leitura: `src/lib/business/modulos.ts`.
   */
  formato: text("formato", { enum: ["LOJA", "SITE"] }).notNull().default("LOJA"),
  /** Fuso do negócio (NB1): horários de contatos, caixa e aulas do portal. */
  fuso: text("fuso").notNull().default("America/Sao_Paulo"),
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
  /** Pixel da Meta (W4, D187): o número do pixel é público; o token da API de conversões fica só criptografado. */
  metaPixelId: text("meta_pixel_id"),
  metaCapiTokenEnc: text("meta_capi_token_enc"),
  /** Loja em lançamento (W4, D187): o público vê "abrimos em breve" com lista de espera; o dono vê a loja normal. */
  launchMode: boolean("launch_mode").notNull().default(false),
  /**
   * Integrações só de configuração (Rodada A, D189): números públicos (Google Analytics, Tag Manager, Search Console,
   * Google Ads, TikTok, Pinterest, chat) e chaves (loja no celular, maioridade). Nada secreto aqui.
   */
  integrations: jsonb("integrations").$type<import("@/lib/domain/integracoes-tipos").IntegracoesLoja>().notNull().default({}),
  /** ERP da loja (Rodada C, D191): Tiny ou Omie; credencial só criptografada. */
  erpProvider: text("erp_provider", { enum: ["TINY", "OMIE"] }),
  erpTokenEnc: text("erp_token_enc"),
  erpAccount: text("erp_account"),
  erpConnectedAt: ts("erp_connected_at"),
  erpStockSyncedAt: ts("erp_stock_synced_at"),
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
  /** Porta de entrada com que a loja entrou (D126): cópia congelada da oferta; vazio = regra de hoje (teste e bloqueio). */
  entryOffer: jsonb("entry_offer").$type<Record<string, unknown> | null>(),
  trialStartedAt: ts("trial_started_at"),
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
  /** Cupom que deu o teste; vazio = teste da porta de entrada sem cupom (D126). */
  couponId: text("coupon_id").references(() => coupons.id),
  createdAt: createdAt(),
});

export const users = pgTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["NEXTLEVEL_MASTER", "SUPPLIER_ADMIN", "SUPPLIER_DISPATCH", "STORE_OWNER", "AFFILIATE", "BRAS_MEMBER", "BRAS_IMPORTER", "CARRIER", "AGENCY"] }).notNull(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  supplierId: text("supplier_id").references(() => suppliers.id),
  storeId: text("store_id").references(() => stores.id),
  /** Hash scrypt (salt:hash). Null = usuário ainda sem senha (apenas demo). */
  passwordHash: text("password_hash"),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  /** Papel dentro da loja: dono (tudo) ou equipe (operação, sem finanças/configurações). Contas existentes são donas. */
  storeRole: text("store_role", { enum: ["OWNER", "STAFF"] }).notNull().default("OWNER"),
  /** Equipe do Master (D138): vazio = dono (tudo); com função, só as telas e ações daquela função. */
  masterFunction: text("master_function", { enum: ["COMERCIAL", "SUPORTE", "FINANCEIRO", "CONTEUDO", "CONTADOR"] }),
  /** Acesso encerrado (ex.: pessoa saiu da equipe): não entra e sessões antigas deixam de valer. */
  disabledAt: ts("disabled_at"),
  lastLoginAt: ts("last_login_at"),
  /** IP da última entrada (W0, D183): só para o dono da loja e o Master verem; sem localização. */
  lastLoginIp: text("last_login_ip"),
  /** Versão das sessões (W0, D183): "sair dos outros aparelhos" soma 1 e as sessões com a versão antiga deixam de valer. */
  sessionVersion: integer("session_version").notNull().default(0),
  /** Verificação em duas etapas (TOTP, W0, D183): segredo só criptografado (`encryptSecret`) e códigos de recuperação em hash. */
  totpSecret: text("totp_secret"),
  totpEnabledAt: ts("totp_enabled_at"),
  totpRecovery: jsonb("totp_recovery").$type<string[]>(),
  /** Conta do grupo (D141): perfis da mesma pessoa em marcas diferentes, ligados com aceite. Vazio = perfil sozinho. */
  groupId: text("group_id"),
  groupLinkedAt: ts("group_linked_at"),
  createdAt: createdAt(),
}, (t) => [index("users_group_idx").on(t.groupId)]);

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
  /** Cor da variação (AT0, D257). Nula = "cor única" (todos os produtos antigos). */
  color: text("color"),
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
  /** Atacado (AT0, D257): grade fechada (composição por tamanho) ou pacote sortido (a loja escolhe modelos e cores). */
  kind: text("kind", { enum: ["GRADE_FECHADA", "PACOTE_SORTIDO"] }).notNull().default("GRADE_FECHADA"),
  /** Cor da grade: fixa (uma cor), sortida (a loja escolhe) ou por cor (o comprador escolhe a cor). */
  colorMode: text("color_mode", { enum: ["FIXA", "SORTIDA", "POR_COR"] }).notNull().default("FIXA"),
  color: text("color"),
  position: integer("position").notNull().default(0),
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
  /** Preço de atacado por peça (AT0, D257): vale quando o carrinho atinge uma regra de mix da loja. Nulo = sem atacado. */
  wholesalePriceCents: integer("wholesale_price_cents"),
  /** Mínimo de peças do modelo (grade livre) e múltiplo de venda (de 6 em 6). 0 e 1 = sem regra. */
  minQtyPerModel: integer("min_qty_per_model").notNull().default(0),
  multipleOf: integer("multiple_of").notNull().default(1),
  active: boolean("active").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  /** "Compre junto" (W3, D186): até 4 produtos que a loja escolheu para mostrar junto deste (vazio = mesma categoria). */
  relatedIds: jsonb("related_ids").$type<string[]>().notNull().default([]),
  /** Dias de produção somados à previsão de entrega (W3, D186): peça feita sob encomenda, bordado, personalização. */
  productionDays: integer("production_days").notNull().default(0),
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
  /** Pedido na mesa (W1, D184): estrela do lojista, quando foi impresso, suspeita de fraude (motivo; segura o envio) e previsão de entrega. */
  starred: boolean("starred").notNull().default(false),
  printedAt: ts("printed_at"),
  fraudFlag: text("fraud_flag"),
  expectedDeliveryAt: ts("expected_delivery_at"),
  /** Origem da venda (W2, D185): aparelho e campanha (UTM) lidos no checkout da loja; sem dado pessoal. */
  device: text("device", { enum: ["MOBILE", "DESKTOP", "TABLET"] }),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
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

/**
 * Visitas da loja por dia (W2, D185): contagem agregada, sem cookie, sem IP e sem dado pessoal. Uma linha por loja, dia
 * (fuso de Brasília), página de produto (vazio = outras páginas), origem e aparelho; robôs e prévias do editor não contam.
 */
export const storeVisitsDaily = pgTable("store_visits_daily", {
  storeId: text("store_id").notNull().references(() => stores.id),
  day: text("day").notNull(),
  productId: text("product_id").notNull().default(""),
  source: text("source").notNull().default("direto"),
  device: text("device").notNull().default("DESKTOP"),
  views: integer("views").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.storeId, t.day, t.productId, t.source, t.device] })]);

/**
 * Carrinho abandonado (W3, D186): só com o consentimento do cliente no checkout. Guarda o que estava no carrinho (sem
 * preço: ao voltar, vale o preço atual), os dois lembretes por e-mail e se virou pedido. Um carrinho aberto por e-mail e loja.
 */
export const abandonedCarts = pgTable("abandoned_carts", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  email: text("email").notNull(),
  name: text("name"),
  items: jsonb("items").$type<{ productId: string; variantId?: string; packId?: string; quantity: number }[]>().notNull().default([]),
  token: text("token").notNull().unique(),
  remindedAt1: ts("reminded_at_1"),
  remindedAt2: ts("reminded_at_2"),
  recoveredOrderId: text("recovered_order_id"),
  optedOutAt: ts("opted_out_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("abandoned_carts_store_idx").on(t.storeId, t.email)]);

/** Redirecionamentos de endereço antigo para novo (W4, D187): para quem vem de outra plataforma não perder o Google. */
export const storeRedirects = pgTable("store_redirects", {
  storeId: text("store_id").notNull().references(() => stores.id),
  fromPath: text("from_path").notNull(),
  toPath: text("to_path").notNull(),
  hits: integer("hits").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.storeId, t.fromPath] })]);

/** Lista de espera da loja em lançamento (W4, D187): só com o consentimento de quem deixa o e-mail. */
export const storeWaitlist = pgTable("store_waitlist", {
  storeId: text("store_id").notNull().references(() => stores.id),
  email: text("email").notNull(),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.storeId, t.email] })]);

/**
 * Pedidos pagos a enviar ao ERP da loja (Rodada C, D191). Uma linha por pedido e ERP (idempotência), com tentativas
 * e o número do pedido lá fora quando deu certo.
 */
export const erpEnvios = pgTable("erp_envios", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  orderId: text("order_id").notNull().references(() => orders.id),
  provider: text("provider", { enum: ["TINY", "OMIE"] }).notNull(),
  status: text("status", { enum: ["PENDENTE", "ENVIADO", "ERRO"] }).notNull().default("PENDENTE"),
  tentativas: integer("tentativas").notNull().default(0),
  proximaTentativa: ts("proxima_tentativa").notNull().defaultNow(),
  externoId: text("externo_id"),
  erro: text("erro"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("erp_envios_pedido").on(t.provider, t.orderId), index("erp_envios_loja_idx").on(t.storeId, t.status)]);

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

/**
 * Páginas livres do site do negócio (NextLevel Business, NB2, D307): Sobre, Serviços, Contato, campanha e página livre.
 * Mesmo formato de modelo das páginas da loja (`Template`), com rascunho, publicação e revisão; o histórico usa
 * `theme_template_versions` com `page = "pagina:<id>"`. O endereço público é `/<slug>` (domínio próprio) ou
 * `/store/<loja>/<slug>`; slugs das rotas da loja são reservados (`src/lib/business/paginas.ts`).
 */
export const PAGINA_TIPOS = ["INSTITUCIONAL", "SERVICO", "CONTATO", "CAMPANHA", "LIVRE"] as const;
export type PaginaTipo = (typeof PAGINA_TIPOS)[number];
export const paginasSite = pgTable("paginas_site", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  slug: text("slug").notNull(),
  tipo: text("tipo", { enum: PAGINA_TIPOS }).notNull().default("LIVRE"),
  titulo: text("titulo").notNull(),
  draft: jsonb("draft").$type<import("@/lib/themes/types").Template | null>(),
  published: jsonb("published").$type<import("@/lib/themes/types").Template | null>(),
  revision: integer("revision").notNull().default(0),
  seoTitulo: text("seo_titulo"),
  seoDescricao: text("seo_descricao"),
  /** Entra no sitemap e pode ser indexada (campanha nasce fora). */
  indexar: boolean("indexar").notNull().default(true),
  /** Aparece no menu do cabeçalho do site, na ordem abaixo. */
  noMenu: boolean("no_menu").notNull().default(true),
  ordem: integer("ordem").notNull().default(0),
  publicadaEm: ts("publicada_em"),
  arquivadaEm: ts("arquivada_em"),
  createdBy: text("created_by"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("paginas_site_slug_unique").on(t.storeId, t.slug)]);

/**
 * Serviços da empresa (NB2, D307): o que o negócio oferece, mostrado no site (seção "Serviços") e, na NB3, escolhido
 * no formulário de orçamento. Não usa `products` (estoque, frete, checkout) nem `services` (catálogo da NextLevel).
 * Sem preço = "sob orçamento". Na academia, cada modalidade é um serviço (a grade de aulas é da NB10).
 */
export const servicosNegocio = pgTable("servicos_negocio", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  nome: text("nome").notNull(),
  slug: text("slug").notNull(),
  resumo: text("resumo"),
  descricao: text("descricao"),
  imagemUrl: text("imagem_url"),
  /** Preço "a partir de", em centavos; vazio = sob orçamento. */
  precoAPartirCents: integer("preco_a_partir_cents"),
  ativo: boolean("ativo").notNull().default(true),
  ordem: integer("ordem").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("servicos_negocio_slug_unique").on(t.storeId, t.slug), index("servicos_negocio_store_idx").on(t.storeId, t.ativo)]);

/**
 * Pedidos de contato e orçamento do negócio (NextLevel Business, NB3, D309): o formulário do site, a conversa do WhatsApp
 * registrada pela equipe ou o contato lançado à mão. A origem fica aqui mesmo, a partir do que veio no envio (etiquetas da
 * página, clique do anúncio, site de origem): o site do lojista não grava cookie de medição da NextLevel (D185).
 * Repetição técnica do mesmo envio não duplica (`chave_envio`).
 */
export const CONTATO_SITUACOES = ["NOVO", "EM_ATENDIMENTO", "ORCAMENTO_ENVIADO", "GANHO", "PERDIDO"] as const;
export type ContatoSituacao = (typeof CONTATO_SITUACOES)[number];
export const contatosNegocio = pgTable("contatos_negocio", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  nome: text("nome").notNull(),
  whatsapp: text("whatsapp"),
  email: text("email"),
  servicoId: text("servico_id"),
  mensagem: text("mensagem"),
  /** Página do site em que o formulário foi enviado (endereço, sem domínio). */
  pagina: text("pagina"),
  via: text("via", { enum: ["FORMULARIO", "WHATSAPP_CONFIRMADO", "MANUAL"] }).notNull().default("FORMULARIO"),
  situacao: text("situacao", { enum: CONTATO_SITUACOES }).notNull().default("NOVO"),
  responsavelId: text("responsavel_id"),
  responsavelNome: text("responsavel_nome"),
  /** Primeira vez que alguém do negócio tirou o contato de "novo" (base do tempo até a primeira resposta). */
  primeiraRespostaEm: ts("primeira_resposta_em"),
  valorCents: integer("valor_cents"),
  motivoPerda: text("motivo_perda"),
  notas: text("notas"),
  canal: text("canal").notNull().default("direto"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  utmTerm: text("utm_term"),
  clickIds: jsonb("click_ids").$type<Record<string, string>>().notNull().default({}),
  origemSite: text("origem_site"),
  chaveEnvio: text("chave_envio"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("contatos_negocio_envio_unique").on(t.storeId, t.chaveEnvio), index("contatos_negocio_situacao_idx").on(t.storeId, t.situacao, t.createdAt)]);

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
/** Tipos de parceiro (D90). AFFILIATE é o influenciador/afiliado original. O tipo só é definido pelo Master. */
export const PARTNER_TIERS = ["INICIAL", "PRATA", "OURO", "DIAMANTE"] as const;
export type PartnerTier = (typeof PARTNER_TIERS)[number];
export const PARTNER_KINDS = ["AFFILIATE", "REPRESENTATIVE", "AGENCY", "AGENCY_ELITE", "WHITE_LABEL"] as const;
export type PartnerKind = (typeof PARTNER_KINDS)[number];

export const partners = pgTable("partners", {
  id: id(),
  userId: text("user_id").notNull().unique().references(() => users.id),
  /** Influenciador (AFFILIATE), Representante, Agência, Agência Elite ou White Label. Só o Master muda. */
  kind: text("kind", { enum: PARTNER_KINDS }).notNull().default("AFFILIATE"),
  code: text("code").notNull().unique(),
  displayName: text("display_name").notNull(),
  taxId: text("tax_id").notNull().unique(),
  phone: text("phone").notNull(),
  /** Chave Pix criptografada (a mesma proteção dos tokens); o saque é para o mesmo CPF/CNPJ. */
  pixKeyEnc: text("pix_key_enc"),
  status: text("status", { enum: PARTNER_STATUSES }).notNull().default("ACTIVE"),
  /** Executivo de venda da NextLevel (equipe de rua, CX0/D269): cadastrado pelo dono, vende e presta contas do dinheiro. */
  executivo: boolean("executivo").notNull().default(false),
  /** Meta semanal de lojas pagas do executivo (CX4, D274); vazia = a 1ª faixa da campanha da rua. */
  metaSemanal: integer("meta_semanal"),
  /** Última competência (YYYY-MM) coberta pela taxa de manutenção do cadastro inativo. */
  feePaidPeriod: text("fee_paid_period"),
  termsVersion: text("terms_version").notNull(),
  termsAcceptedAt: ts("terms_accepted_at").notNull(),
  /** Pedido para ser agência parceira (D220): 30% + 15%. O Master aprova mudando o `kind` para AGENCY. */
  agencyRequestedAt: ts("agency_requested_at"),
  /** Site ou Instagram da agência e quantos clientes atende (texto livre do pedido). */
  agencyInfo: text("agency_info"),
  /** Nível por desempenho (D249): INICIAL, PRATA (3+), OURO (10+), DIAMANTE (20+ clientes pagantes ativos). */
  tier: text("tier", { enum: PARTNER_TIERS }).notNull().default("INICIAL"),
  /** Competência (YYYY-MM) em que o parceiro ficou abaixo do nível; desce após 2 meses seguidos. */
  tierBelowSince: text("tier_below_since"),
  /** Motivo quando o Master fixou o nível à mão (o cálculo mensal não mexe). */
  tierLockedReason: text("tier_locked_reason"),
  tierUpdatedAt: ts("tier_updated_at"),
  createdAt: createdAt(),
});

/** Etapas do funil de parceiros no Master (D251, PV3). Sem etapa manual, o sistema calcula. */
export const PARTNER_STAGES = ["CANDIDATO", "EM_ANALISE", "APROVADO", "ATIVANDO", "PRODUTIVO", "EM_RISCO", "INATIVO", "DESLIGADO"] as const;
export type PartnerStage = (typeof PARTNER_STAGES)[number];

/** Perfil e funil do parceiro no CRM do Master (D251): região, dono interno, etapa manual e próxima ação. */
export const partnerProfiles = pgTable("partner_profiles", {
  partnerId: text("partner_id").primaryKey().references(() => partners.id),
  region: text("region"),
  channels: text("channels"),
  followers: integer("followers"),
  ownerUserId: text("owner_user_id"),
  manualStage: text("manual_stage", { enum: PARTNER_STAGES }),
  nextAction: text("next_action"),
  nextActionAt: ts("next_action_at"),
  updatedAt: updatedAt(),
});

/** Linha do tempo interna do parceiro (D251): notas, ligações, tarefas e mensagens. O parceiro não vê. */
export const partnerActivities = pgTable("partner_activities", {
  id: id(),
  partnerId: text("partner_id").notNull().references(() => partners.id),
  kind: text("kind", { enum: ["NOTA", "LIGACAO", "TAREFA", "MENSAGEM"] }).notNull(),
  text: text("text").notNull(),
  dueAt: ts("due_at"),
  doneAt: ts("done_at"),
  authorUserId: text("author_user_id"),
  createdAt: createdAt(),
}, (t) => [index("partner_activities_partner_idx").on(t.partnerId)]);

/** Desafio do mês (D251): meta de ativações no mês para um grupo de parceiros, com bônus pago uma vez. */
export const partnerChallenges = pgTable("partner_challenges", {
  id: id(),
  title: text("title").notNull(),
  period: text("period").notNull(),
  target: integer("target").notNull(),
  bonusCents: integer("bonus_cents").notNull(),
  /** Tipos de parceiro que participam (vazio = todos). */
  kinds: jsonb("kinds").$type<string[]>().notNull().default([]),
  active: boolean("active").notNull().default(true),
  createdBy: text("created_by"),
  createdAt: createdAt(),
});

/** Aviso do Master para um segmento de parceiros (D251): aparece no painel de cada parceiro escolhido. */
export const partnerNotices = pgTable("partner_notices", {
  id: id(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  partnerIds: jsonb("partner_ids").$type<string[]>().notNull().default([]),
  segment: text("segment"),
  createdBy: text("created_by"),
  createdAt: createdAt(),
});

/** Histórico de níveis do parceiro (D249): toda subida, descida e fixação manual. */
export const partnerTierHistory = pgTable("partner_tier_history", {
  id: id(),
  partnerId: text("partner_id").notNull().references(() => partners.id),
  fromTier: text("from_tier", { enum: PARTNER_TIERS }).notNull(),
  toTier: text("to_tier", { enum: PARTNER_TIERS }).notNull(),
  activeClients: integer("active_clients").notNull(),
  /** AUTO (cálculo) ou MASTER (fixado à mão, com motivo). */
  source: text("source", { enum: ["AUTO", "MASTER"] }).notNull(),
  reason: text("reason"),
  actorUserId: text("actor_user_id"),
  at: ts("at").notNull().defaultNow(),
}, (t) => [index("partner_tier_history_partner_idx").on(t.partnerId)]);

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

export const PARTNER_COMMISSION_KINDS = ["SETUP", "MAINTENANCE", "ADJUSTMENT", "CLAWBACK", "PAYOUT", "PAYOUT_REVERSAL", "FEE", "MANUAL", "SALE", "RECURRING", "BONUS"] as const;
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
  /** Venda do catálogo Master que gerou a comissão (D90) e a regra versionada aplicada. */
  orderId: text("order_id"),
  ruleId: text("rule_id"),
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
/**
 * Conversas do Maurício nas páginas públicas (D197): CRM ao vivo do Master. O visitante é identificado só pelo token da
 * conversa (sem cookie de rastreio); nome e WhatsApp entram quando ele informa. Equipe pode assumir e responder.
 */
export const iaConversas = pgTable("ia_conversas", {
  id: id(),
  brand: text("brand").notNull(),
  canal: text("canal", { enum: ["HOME", "PAINEL", "LOJA", "EMAIL"] }).notNull().default("HOME"),
  /** Ajuda do lojista (D201): a conversa pertence a esta loja (canal PAINEL). */
  storeId: text("store_id").references(() => stores.id),
  tokenHash: text("token_hash").notNull(),
  status: text("status", { enum: ["NOVA", "IA", "HUMANO", "GANHA", "PERDIDA"] }).notNull().default("NOVA"),
  nome: text("nome"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  interesse: text("interesse"),
  faturamento: text("faturamento"),
  pagina: text("pagina"),
  origem: jsonb("origem").$type<Record<string, string>>().notNull().default({}),
  responsavelId: text("responsavel_id"),
  responsavelNome: text("responsavel_nome"),
  notas: text("notas"),
  leadId: text("lead_id"),
  mensagens: integer("mensagens").notNull().default(0),
  naoLidas: integer("nao_lidas").notNull().default(0),
  ultimaMensagem: text("ultima_mensagem"),
  ultimaEm: ts("ultima_em").notNull().defaultNow(),
  createdAt: createdAt(),
}, (t) => [index("ia_conversas_status_idx").on(t.status, t.ultimaEm), index("ia_conversas_store_idx").on(t.storeId)]);

export const iaMensagens = pgTable("ia_mensagens", {
  id: id(),
  conversaId: text("conversa_id").notNull().references(() => iaConversas.id),
  autor: text("autor", { enum: ["CLIENTE", "MAURICIO", "HUMANO", "SISTEMA"] }).notNull(),
  autorNome: text("autor_nome"),
  texto: text("texto").notNull(),
  /** Atalhos e botões da resposta guiada (sem dado pessoal). */
  extra: jsonb("extra").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: createdAt(),
}, (t) => [index("ia_mensagens_conversa_idx").on(t.conversaId, t.createdAt)]);

/**
 * Acompanhamento comercial (D202): responsável, próxima ação e prazo de cada pessoa do funil da Commerce.
 * `chave` = "loja:<id>" | "interessado:<id>" | "conversa:<id>" (a mesma pessoa vista no funil único).
 */
export const crmAcompanhamento = pgTable("crm_acompanhamento", {
  chave: text("chave").primaryKey(),
  brand: text("brand").notNull().default("NEXTLEVEL_COMMERCE"),
  responsavelId: text("responsavel_id"),
  responsavelNome: text("responsavel_nome"),
  proximaAcao: text("proxima_acao"),
  prazo: ts("prazo"),
  notas: text("notas"),
  perdido: boolean("perdido").notNull().default(false),
  /** Motivo da perda (TR3, D294). */
  motivoPerda: text("motivo_perda"),
  /** Venda fechada à mão (contrato, serviço, plano combinado): quando, quanto (centavos) e o quê (TR3, D294). */
  fechouEm: ts("fechou_em"),
  valorFechadoCents: integer("valor_fechado_cents"),
  fechouDescricao: text("fechou_descricao"),
  updatedAt: updatedAt(),
});

/**
 * Origem de cada contato do Comercial (TR3, D294): de onde veio a pessoa no momento em que deixou o contato, criou a loja
 * ou mandou o código da visita no WhatsApp. Chave = a mesma do Comercial ("interessado:…", "loja:…", "conversa:…").
 * A primeira origem fica; o código da visita, digitado pela equipe, pode corrigir. Base para devolver o resultado à
 * Meta e ao Google (TR5): guarda os cliques do anúncio, nunca o IP.
 */
export const origensContato = pgTable("origens_contato", {
  chave: text("chave").primaryKey(),
  brand: text("brand").notNull(),
  via: text("via", { enum: ["FORMULARIO", "SAIDA", "DIAGNOSTICO", "CADASTRO", "CODIGO_WHATSAPP"] }).notNull(),
  canal: text("canal").notNull(),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  utmTerm: text("utm_term"),
  clickIds: jsonb("click_ids").$type<Record<string, string>>().notNull().default({}),
  /** Primeiro canal pelo qual a pessoa conheceu o site (cookie de primeiro toque, D290). */
  primeiroCanal: text("primeiro_canal"),
  primeiraPagina: text("primeira_pagina"),
  sessaoId: text("sessao_id"),
  codigoVisita: text("codigo_visita"),
  cidade: text("cidade"),
  uf: text("uf"),
  pais: text("pais"),
  aparelho: text("aparelho"),
  /** Navegador informado (para a API de conversões da Meta, que exige em evento do site) e o aviso de cookies na hora (TR5, D298). */
  ua: text("ua"),
  consentimento: text("consentimento", { enum: ["SIM", "NAO", "SEM_ESCOLHA"] }),
  /** Resposta da pessoa a "Como você conheceu a NextLevel?" (D303; chaves em `src/lib/trafego/conheceu.ts`). */
  conheceuPor: text("conheceu_por"),
  capturadaEm: ts("capturada_em").notNull().defaultNow(),
});

/**
 * Visitas de robôs de busca e de IA às páginas públicas (plano de busca v3, seção 16.3): só a contagem por dia, marca,
 * robô e caminho. O proxy soma em memória e grava em lote (nunca uma escrita por visita); nada de IP nem navegador.
 */
export const robosVisitasDiarias = pgTable("robos_visitas_diarias", {
  dia: text("dia").notNull(),
  brand: text("brand").notNull(),
  robo: text("robo").notNull(),
  caminho: text("caminho").notNull(),
  visitas: integer("visitas").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.dia, t.brand, t.robo, t.caminho] })]);

/**
 * Fila de retorno às plataformas (TR5, D298): cada linha é um resultado (contato, conta criada, pagante, venda fechada)
 * a avisar à Meta ou ao Google. Uma vez por plataforma, evento e contato (dedupe). A rotina manda, tenta de novo e guarda
 * o resultado em português; nunca guarda e-mail, telefone ou token.
 */
export const conversoesEnvio = pgTable("conversoes_envio", {
  id: id(),
  plataforma: text("plataforma", { enum: ["META", "GOOGLE"] }).notNull(),
  evento: text("evento", { enum: ["LEAD", "CONTA", "PAGANTE", "VENDA"] }).notNull(),
  chave: text("chave").notNull(),
  eventoId: text("evento_id").notNull(),
  valorCents: integer("valor_cents"),
  ocorreuEm: ts("ocorreu_em").notNull(),
  status: text("status", { enum: ["PENDENTE", "ENVIADO", "FALHOU", "IGNORADO", "BLOQUEADO"] }).notNull().default("PENDENTE"),
  motivo: text("motivo"),
  tentativas: integer("tentativas").notNull().default(0),
  proximaTentativaEm: ts("proxima_tentativa_em"),
  dedupeKey: text("dedupe_key").notNull().unique(),
  criadoEm: createdAt(),
  enviadoEm: ts("enviado_em"),
}, (t) => [index("conversoes_envio_status_idx").on(t.status, t.proximaTentativaEm)]);

/**
 * Links rastreados (TR1, D290): encurtador próprio `/l/<codigo>` para anúncio, bio, story, direct, WhatsApp, e-mail e
 * parceiro. O destino é sempre um caminho da própria marca (nunca um site externo: evita redirecionamento aberto).
 */
export const linksRastreados = pgTable("links_rastreados", {
  id: id(),
  codigo: text("codigo").notNull().unique(),
  brand: text("brand", { enum: ["NEXTLEVEL_COMMERCE", "SUPERDROP", "BRAS_DIGITAL", "CREATORS_HUB", "CHINA_HUB", "NEXTLEVEL", "NEXTLEVEL_CARGAS"] }).notNull(),
  /** Caminho de destino na marca, com busca e âncora opcionais (ex.: "/planos?x=1#teste"). */
  destino: text("destino").notNull(),
  utmSource: text("utm_source").notNull(),
  utmMedium: text("utm_medium").notNull(),
  utmCampaign: text("utm_campaign").notNull(),
  utmContent: text("utm_content"),
  utmTerm: text("utm_term"),
  /** Nota interna (onde o link foi usado). */
  nota: text("nota"),
  ativo: boolean("ativo").notNull().default(true),
  criadoPor: text("criado_por"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Cliques por dia de cada link rastreado: só contagem, sem IP nem navegador (LGPD). Robôs contados à parte. */
export const linksCliquesDiarios = pgTable("links_cliques_diarios", {
  linkId: text("link_id").notNull().references(() => linksRastreados.id),
  dia: text("dia").notNull(),
  cliques: integer("cliques").notNull().default(0),
  robos: integer("robos").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.linkId, t.dia] })]);

/**
 * Medição própria do site (TR2, D291): uma sessão por visita (30 min sem sinal encerra), com canal e origem calculados na
 * entrada. Sem IP, sem nome: o visitante é um código aleatório em cookie próprio. Só páginas públicas das marcas (nunca as
 * lojas dos lojistas, D185) e só com a medição permitida no aviso de cookies (D290). Detalhe por 90 dias; depois, resumo.
 */
const BRAND_ENUM = ["NEXTLEVEL_COMMERCE", "SUPERDROP", "BRAS_DIGITAL", "CREATORS_HUB", "CHINA_HUB", "NEXTLEVEL", "NEXTLEVEL_CARGAS"] as const;
export const trafegoSessoes = pgTable("trafego_sessoes", {
  id: id(),
  visitanteId: text("visitante_id").notNull(),
  brand: text("brand", { enum: BRAND_ENUM }).notNull(),
  iniciadaEm: ts("iniciada_em").notNull().defaultNow(),
  ultimoSinalEm: ts("ultimo_sinal_em").notNull().defaultNow(),
  paginaEntrada: text("pagina_entrada").notNull(),
  paginaAtual: text("pagina_atual").notNull(),
  canal: text("canal").notNull(),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  utmTerm: text("utm_term"),
  refHost: text("ref_host"),
  /** Identificadores de clique do anúncio (fbclid, gclid, gbraid, wbraid, ttclid). */
  clickIds: jsonb("click_ids").$type<Record<string, string>>().notNull().default({}),
  aparelho: text("aparelho", { enum: ["MOBILE", "DESKTOP", "TABLET"] }).notNull(),
  /** Local aproximado pelo IP (D292): o IP em si nunca é gravado. */
  cidade: text("cidade"),
  uf: text("uf"),
  pais: text("pais"),
  /** Aparelho em detalhe (D292): sistema e versão, navegador (ou app de onde veio), modelo, tela, idioma e rede. */
  sistema: text("sistema"),
  navegador: text("navegador"),
  modelo: text("modelo"),
  tela: text("tela"),
  idioma: text("idioma"),
  rede: text("rede"),
  /** Código curto da visita (TR3, D294): vai na mensagem do WhatsApp para a equipe ligar a conversa à origem. */
  codigo: text("codigo"),
  paginas: integer("paginas").notNull().default(1),
  whatsapp: boolean("whatsapp").notNull().default(false),
  cadastro: boolean("cadastro").notNull().default(false),
  lead: boolean("lead").notNull().default(false),
}, (t) => [index("trafego_sessoes_codigo_idx").on(t.codigo), index("trafego_sessoes_sinal_idx").on(t.ultimoSinalEm), index("trafego_sessoes_inicio_idx").on(t.iniciadaEm), index("trafego_sessoes_visitante_idx").on(t.visitanteId)]);

/** Marcos da sessão: página aberta, clique no WhatsApp, início de cadastro, lead. O sinal "ainda aqui" não vira linha. */
export const trafegoEventos = pgTable("trafego_eventos", {
  id: id(),
  sessaoId: text("sessao_id").notNull().references(() => trafegoSessoes.id, { onDelete: "cascade" }),
  tipo: text("tipo", { enum: ["PAGE_VIEW", "CLIQUE_WHATSAPP", "INICIO_CADASTRO", "LEAD"] }).notNull(),
  caminho: text("caminho").notNull(),
  criadoEm: ts("criado_em").notNull().defaultNow(),
}, (t) => [index("trafego_eventos_sessao_idx").on(t.sessaoId), index("trafego_eventos_criado_idx").on(t.criadoEm)]);

/** Resumo por dia (13 meses), gerado antes de apagar o detalhe de 90 dias. */
export const trafegoDiario = pgTable("trafego_diario", {
  dia: text("dia").notNull(),
  brand: text("brand", { enum: BRAND_ENUM }).notNull(),
  canal: text("canal").notNull(),
  campanha: text("campanha").notNull().default(""),
  aparelho: text("aparelho").notNull(),
  sessoes: integer("sessoes").notNull().default(0),
  paginas: integer("paginas").notNull().default(0),
  whatsapp: integer("whatsapp").notNull().default(0),
  cadastros: integer("cadastros").notNull().default(0),
  leads: integer("leads").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.dia, t.brand, t.canal, t.campanha, t.aparelho] })]);

/**
 * Anúncios da loja na Meta (D299): o lojista faz o diagnóstico no painel, a equipe da NextLevel analisa, manda a proposta,
 * configura no Gerenciador de Anúncios (na conta de anúncios DO LOJISTA, verba no cartão dele) e acompanha. Manual por
 * enquanto (a API vem depois), mas o lojista acompanha tudo numa "sala da campanha": etapas, pendências, conversa e números.
 */
export const ANUNCIO_STATUS = ["RASCUNHO", "ENVIADA", "ANALISE", "PROPOSTA", "PREPARACAO", "CONFIGURACAO", "REVISAO_META", "NO_AR", "PAUSADA", "ENCERRADA", "CANCELADA"] as const;
export type AnuncioStatus = (typeof ANUNCIO_STATUS)[number];
export const anunciosLoja = pgTable("anuncios_loja", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  status: text("status", { enum: ANUNCIO_STATUS }).notNull().default("RASCUNHO"),
  nome: text("nome").notNull(),
  /** Respostas do diagnóstico (objetivo, produtos, público, verba, materiais, oferta). */
  diagnostico: jsonb("diagnostico").$type<Record<string, unknown>>().notNull().default({}),
  /** Pendências do lojista e da equipe (acesso à conta, forma de pagamento na Meta, materiais, aceite da proposta). */
  pendencias: jsonb("pendencias").$type<{ chave: string; rotulo: string; dica: string; quem: "LOJISTA" | "EQUIPE"; feitoEm: string | null }[]>().notNull().default([]),
  /** Proposta (pedido de orçamento do serviço "Gestão de Meta Ads"). */
  quoteId: text("quote_id"),
  /** Etiqueta da campanha nos links do anúncio: as vendas da loja com ela aparecem sozinhas na sala. */
  utmCampaign: text("utm_campaign").notNull(),
  responsavelId: text("responsavel_id"),
  responsavelNome: text("responsavel_nome"),
  /** Conta de anúncios do lojista (act_…) e campanhas da Meta desta sala: os números passam a vir sozinhos (TR6, D302). */
  metaContaId: text("meta_conta_id"),
  metaCampanhas: jsonb("meta_campanhas").$type<string[]>().notNull().default([]),
  enviadaEm: ts("enviada_em"),
  noArEm: ts("no_ar_em"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("anuncios_loja_store_idx").on(t.storeId), index("anuncios_loja_status_idx").on(t.status)]);

/** Linha do tempo da sala da campanha: mudanças de etapa, mensagens entre lojista e equipe, pendências, resultados. */
export const anunciosEventos = pgTable("anuncios_eventos", {
  id: id(),
  anuncioId: text("anuncio_id").notNull().references(() => anunciosLoja.id),
  autor: text("autor", { enum: ["LOJISTA", "EQUIPE", "SISTEMA"] }).notNull(),
  autorNome: text("autor_nome"),
  tipo: text("tipo", { enum: ["ETAPA", "MENSAGEM", "PENDENCIA", "RESULTADO", "PROPOSTA"] }).notNull(),
  texto: text("texto").notNull(),
  criadoEm: createdAt(),
}, (t) => [index("anuncios_eventos_anuncio_idx").on(t.anuncioId)]);

/** Números de um período lançados pela equipe (do Gerenciador de Anúncios), em centavos e contagens. */
export const anunciosResultados = pgTable("anuncios_resultados", {
  id: id(),
  anuncioId: text("anuncio_id").notNull().references(() => anunciosLoja.id),
  de: text("de").notNull(),
  ate: text("ate").notNull(),
  gastoCents: integer("gasto_cents").notNull().default(0),
  alcance: integer("alcance").notNull().default(0),
  cliques: integer("cliques").notNull().default(0),
  conversas: integer("conversas").notNull().default(0),
  comentario: text("comentario"),
  criadoPor: text("criado_por"),
  criadoEm: createdAt(),
}, (t) => [index("anuncios_resultados_anuncio_idx").on(t.anuncioId)]);

/**
 * Números por dia de cada campanha, lidos da API de Marketing da Meta (TR6, D302): da conta de anúncios da NextLevel e
 * das contas dos lojistas que deram acesso de parceiro. Valores em centavos; reescritos a cada leitura (a Meta ajusta os
 * últimos dias).
 */
export const adsMetricasDiarias = pgTable("ads_metricas_diarias", {
  plataforma: text("plataforma", { enum: ["META", "GOOGLE"] }).notNull(),
  contaId: text("conta_id").notNull(),
  campanhaId: text("campanha_id").notNull(),
  dia: text("dia").notNull(),
  campanhaNome: text("campanha_nome").notNull(),
  gastoCents: integer("gasto_cents").notNull().default(0),
  impressoes: integer("impressoes").notNull().default(0),
  alcance: integer("alcance").notNull().default(0),
  cliques: integer("cliques").notNull().default(0),
  conversas: integer("conversas").notNull().default(0),
  leads: integer("leads").notNull().default(0),
  atualizadoEm: updatedAt(),
}, (t) => [primaryKey({ columns: [t.plataforma, t.contaId, t.campanhaId, t.dia] }), index("ads_metricas_conta_dia_idx").on(t.contaId, t.dia)]);

export const brandLeads = pgTable("brand_leads", {
  id: id(),
  brand: text("brand", { enum: ["NEXTLEVEL_COMMERCE", "SUPERDROP", "BRAS_DIGITAL", "CREATORS_HUB", "CHINA_HUB", "NEXTLEVEL", "NEXTLEVEL_CARGAS"] }).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  storeName: text("store_name"),
  segment: text("segment"),
  message: text("message"),
  affiliateRef: text("affiliate_ref"),
  /** LEAD (lista de espera/implantação), DIAGNOSTIC (diagnóstico gratuito da Nextlevel Soluções, D90) ou SAIDA (janela de resgate na saída da página, só e-mail, D280). */
  kind: text("kind", { enum: ["LEAD", "DIAGNOSTIC", "SAIDA"] }).notNull().default("LEAD"),
  /** Necessidades marcadas no diagnóstico e origem (utm, página, intenção). Sem dado sensível. */
  needs: jsonb("needs").$type<string[]>().notNull().default([]),
  attribution: jsonb("attribution").$type<Record<string, string>>().notNull().default({}),
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

/** Regras de atacado da loja (AT0, D257): quando o carrinho passa ao preço de atacado (mix da loja toda, por valor ou por categoria). */
export const WHOLESALE_RULE_KINDS = ["MIX_PECAS", "MIX_VALOR", "MIX_CATEGORIA"] as const;
export const storeWholesaleRules = pgTable("store_wholesale_rules", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  kind: text("kind", { enum: WHOLESALE_RULE_KINDS }).notNull(),
  minPieces: integer("min_pieces"),
  minCents: integer("min_cents"),
  categoryId: text("category_id").references(() => categories.id),
  active: boolean("active").notNull().default(true),
  position: integer("position").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [index("store_wholesale_rules_store_idx").on(t.storeId)]);

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

// ====================================================================
// Financeiro corporativo da NextLevel (D90): `nextlevel_corporate_finance`.
// Só o Master escreve aqui. Os painéis de fornecedor, membro, loja e parceiro apenas leem o que foi publicado
// (preço autorizado, checkout, proposta). Valores em centavos; preços versionados e imutáveis.
// ===========================================================================
export const CATALOG_FAMILIES = ["COMMERCE_PLAN", "LOJA_PRONTA", "MIGRACAO", "TEMA", "MARKETING", "CONSULTORIA", "WHITE_LABEL", "SUPERDROP", "ADDON", "BRAS_MEMBER_PLAN", "BRAS_IMPORTER_PLAN", "CARRIER_PLAN", "BRAS_SERVICE", "ADS", "CLUB_PLAN"] as const;
/** Quem pode contratar um produto do catálogo. BRAS_MEMBER, IMPORTER e CARRIER: lados da Brás e da NextLevel Cargas (D108). */
export const CATALOG_AUDIENCES = ["STORE", "SUPPLIER", "PARTNER", "PUBLIC", "BRAS_MEMBER", "IMPORTER", "CARRIER"] as const;
export type CatalogAudience = (typeof CATALOG_AUDIENCES)[number];
export type CatalogFamily = (typeof CATALOG_FAMILIES)[number];
export const CATALOG_KINDS = ["subscription", "one_time", "quote_required", "usage_fee"] as const;
export type CatalogKind = (typeof CATALOG_KINDS)[number];
export const CATALOG_STATUSES = ["DRAFT", "PUBLISHED", "PAUSED", "ARCHIVED"] as const;
export type CatalogStatus = (typeof CATALOG_STATUSES)[number];
export const JOURNEY_PHASES = ["FUNDACAO", "LANCAMENTO", "AQUISICAO", "OTIMIZACAO", "ESCALA"] as const;
export type JourneyPhase = (typeof JOURNEY_PHASES)[number];
export const GATEWAYS = ["MERCADOPAGO", "PAGARME"] as const;
export type GatewayCode = (typeof GATEWAYS)[number];
export const PRICE_CYCLES = ["MONTHLY", "ANNUAL", "ONE_TIME", "QUOTE"] as const;
export type PriceCycle = (typeof PRICE_CYCLES)[number];

/** Conteúdo editorial da landing canônica do produto (versionado junto do produto). */
export type CatalogContent = {
  forWho: string[]; notFor: string[]; problem: string; outcome: string;
  scope: string[]; deliverables: string[]; timeline?: string; limits: string[];
  faq: { q: string; a: string }[]; policy?: string;
  /** Benefício não monetário do parceiro no anual (crédito de setup, auditoria, tema), controlado pelo catálogo. */
  partnerPerk?: string;
};

export const catalogProducts = pgTable("catalog_products", {
  id: id(),
  key: text("key").notNull().unique(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  family: text("family", { enum: CATALOG_FAMILIES }).notNull(),
  kind: text("kind", { enum: CATALOG_KINDS }).notNull(),
  status: text("status", { enum: CATALOG_STATUSES }).notNull().default("DRAFT"),
  /** Fase da jornada em que o produto aparece. */
  phase: text("phase", { enum: JOURNEY_PHASES }).notNull().default("FUNDACAO"),
  /** Quem pode contratar: STORE (lojista/Commerce), SUPPLIER, PARTNER e PUBLIC (visitante). */
  audience: jsonb("audience").$type<CatalogAudience[]>().notNull().default(["STORE", "PUBLIC"]),
  tagline: text("tagline").notNull(),
  summary: text("summary").notNull(),
  content: jsonb("content").$type<CatalogContent>().notNull(),
  /** Pré-requisitos observáveis (chaves de critério da jornada ou PRODUCT:<key>). */
  prerequisites: jsonb("prerequisites").$type<string[]>().notNull().default([]),
  /** HARD bloqueia a compra até cumprir; RECOMMENDED só recomenda a ordem. */
  lockMode: text("lock_mode", { enum: ["HARD", "RECOMMENDED"] }).notNull().default("RECOMMENDED"),
  /** Produtos que esta solução prepara ou libera. */
  unlocks: jsonb("unlocks").$type<string[]>().notNull().default([]),
  deliveryDays: integer("delivery_days"),
  /** Direito concedido ao pagar (entitlement), quando houver. */
  grantsKey: text("grants_key"),
  /** Gateway preferido do produto; vazio = regra global do Master (padrão Mercado Pago). */
  gateway: text("gateway", { enum: GATEWAYS }),
  /** Desconto em dinheiro que o parceiro pode dar (bps, teto do Master). */
  partnerDiscountMaxBps: integer("partner_discount_max_bps").notNull().default(0),
  /** Carência da comissão (dias): 14 digital/assinatura, 30 serviço/projeto. */
  commissionHoldDays: integer("commission_hold_days").notNull().default(14),
  /** Dados específicos da família: recursos/limites do plano, origens de migração, escopo do marketing etc. */
  meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
  sortOrder: integer("sort_order").notNull().default(100),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("catalog_products_family_idx").on(t.family, t.status)]);

/** Versão de preço: IMUTÁVEL (trigger no banco). Nova regra = nova versão; pedidos guardam o id da versão aplicada. */
export const catalogPriceVersions = pgTable("catalog_price_versions", {
  id: id(),
  productId: text("product_id").notNull().references(() => catalogProducts.id),
  cycle: text("cycle", { enum: PRICE_CYCLES }).notNull(),
  version: integer("version").notNull(),
  /** Preço-base em centavos; nulo = sob consulta. */
  amountCents: integer("amount_cents"),
  /** Taxa de plataforma sobre vendas (planos Commerce), em bps. */
  platformFeeBps: integer("platform_fee_bps"),
  methods: jsonb("methods").$type<("PIX" | "CARD")[]>().notNull().default(["PIX", "CARD"]),
  pixDiscountBps: integer("pix_discount_bps").notNull().default(0),
  cardMaxInstallments: integer("card_max_installments").notNull().default(1),
  /** Acréscimo total do cartão sobre o preço-base (1600 = ×1,16). */
  cardMarkupBps: integer("card_markup_bps").notNull().default(0),
  /** Desconto exibido do anual em relação a 12 mensalidades (só informativo; o valor é amountCents). */
  annualDiscountBps: integer("annual_discount_bps"),
  effectiveFrom: ts("effective_from").notNull().defaultNow(),
  authorUserId: text("author_user_id"),
  reason: text("reason").notNull(),
  approvalRef: text("approval_ref"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("catalog_price_versions_unique").on(t.productId, t.cycle, t.version), check("catalog_price_amount_nonneg", sql`${t.amountCents} is null or ${t.amountCents} >= 0`)]);

/** Oferta/promoção versionada (teste, primeiro mês, carência de taxa, benefício não monetário). */
export type OfferRules = {
  trialDays: number; firstPeriodCents: number | null; feeHolidayMonths: number; appliesToFamilies: CatalogFamily[]; appliesToCycles: PriceCycle[]; oncePer: "TAX_ID"; perk?: string;
  /** Porta de entrada (D126): teste do plano pago que cai no grátis, ou direto no grátis. Sem `mode` = oferta clássica. */
  mode?: "TRIAL" | "REVERSE_TRIAL" | "FREE_TIER";
  fallbackPlanKey?: string;
  /** Taxa sobre a venda do plano grátis (bps). */
  freeTierFeeBps?: number;
  /** Dias ganhos por conquista, com teto contado do início do teste. */
  milestoneDays?: { event: "STORE_PUBLISHED" | "FIRST_SALE"; days: number }[];
  milestoneCapDays?: number;
  /** Anual "pague N, leve 12", só no Pix. */
  annualPromo?: { paidMonths: number; getMonths: number } | null;
  /** Parte da mensalidade paga que volta em pontos do Club (bps). */
  cashbackBps?: number;
  /** Passe do Grupo (fase P5A): acessos concedidos em outras marcas. */
  bundleGrants?: { grantKey: string; months: number }[];
  /** Experimento de preço (D140): quem entra por esta porta recebe a escada da Proposta de preço, congelada na loja. */
  priceSource?: "PROPOSTA";
};
export const catalogOffers = pgTable("catalog_offers", {
  id: id(),
  key: text("key").notNull(),
  version: integer("version").notNull(),
  name: text("name").notNull(),
  status: text("status", { enum: ["ACTIVE", "PAUSED"] }).notNull().default("ACTIVE"),
  rules: jsonb("rules").$type<OfferRules>().notNull(),
  effectiveFrom: ts("effective_from").notNull().defaultNow(),
  authorUserId: text("author_user_id"),
  reason: text("reason").notNull(),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("catalog_offers_key_version").on(t.key, t.version)]);

/** Uso da oferta: uma vez por CPF/CNPJ (antiabuso). */
export const offerRedemptions = pgTable("offer_redemptions", {
  id: id(),
  offerKey: text("offer_key").notNull(),
  offerVersion: integer("offer_version").notNull(),
  taxId: text("tax_id").notNull(),
  storeId: text("store_id").references(() => stores.id),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("offer_redemptions_once").on(t.offerKey, t.taxId)]);

/** Regra de comissão versionada (por família/produto, ciclo, tipo de parceiro). */
export const commissionRules = pgTable("commission_rules", {
  id: id(),
  key: text("key").notNull(),
  version: integer("version").notNull(),
  family: text("family", { enum: CATALOG_FAMILIES }).notNull(),
  /** Produto específico (vazio = toda a família). */
  productKey: text("product_key"),
  cycle: text("cycle", { enum: PRICE_CYCLES }),
  partnerKind: text("partner_kind", { enum: PARTNER_KINDS }),
  firstBps: integer("first_bps").notNull(),
  recurringBps: integer("recurring_bps").notNull().default(0),
  recurringMonths: integer("recurring_months").notNull().default(0),
  holdDays: integer("hold_days").notNull().default(14),
  benefit: text("benefit").notNull().default(""),
  active: boolean("active").notNull().default(true),
  effectiveFrom: ts("effective_from").notNull().defaultNow(),
  authorUserId: text("author_user_id"),
  reason: text("reason").notNull(),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("commission_rules_key_version").on(t.key, t.version)]);

export const CORPORATE_ORDER_STATUSES = ["PENDING_PAYMENT", "PAID", "FAILED", "EXPIRED", "CANCELED", "REFUNDED", "CHARGEBACK"] as const;
export type CorporateOrderStatus = (typeof CORPORATE_ORDER_STATUSES)[number];

/** Snapshot imutável do preço e da regra aplicados no pedido. */
export type PriceSnapshot = { productKey: string; productName: string; cycle: PriceCycle; priceVersionId: string; priceVersion: number; baseCents: number; method: "PIX" | "CARD"; installments: number; installmentCents: number; pixDiscountCents: number; cardMarkupCents: number; partnerDiscountCents: number; offerKey?: string; offerVersion?: number; offerDiscountCents: number; totalCents: number; rule: string };

/** Pedido corporativo (checkout rápido da Loja NextLevel, interno ou público). Idempotente por `idempotency_key`. */
export const corporateOrders = pgTable("corporate_orders", {
  id: id(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  /** Código curto para o cliente (não sequencial, evita corrida). */
  code: text("code").notNull().unique(),
  buyerType: text("buyer_type", { enum: ["STORE", "SUPPLIER", "PARTNER", "GUEST"] }).notNull(),
  storeId: text("store_id").references(() => stores.id),
  supplierId: text("supplier_id").references(() => suppliers.id),
  buyerUserId: text("buyer_user_id"),
  buyerName: text("buyer_name").notNull(),
  buyerEmail: text("buyer_email").notNull(),
  buyerTaxId: text("buyer_tax_id"),
  productId: text("product_id").notNull().references(() => catalogProducts.id),
  priceVersionId: text("price_version_id").notNull().references(() => catalogPriceVersions.id),
  cycle: text("cycle", { enum: PRICE_CYCLES }).notNull(),
  method: text("method", { enum: ["PIX", "CARD"] }).notNull(),
  installments: integer("installments").notNull().default(1),
  baseCents: integer("base_cents").notNull(),
  discountCents: integer("discount_cents").notNull().default(0),
  markupCents: integer("markup_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  snapshot: jsonb("snapshot").$type<PriceSnapshot>().notNull(),
  gateway: text("gateway", { enum: GATEWAYS }).notNull(),
  partnerId: text("partner_id"),
  attribution: jsonb("attribution").$type<Record<string, string>>().notNull().default({}),
  status: text("status", { enum: CORPORATE_ORDER_STATUSES }).notNull().default("PENDING_PAYMENT"),
  /** Fatura de assinatura, quando o pedido nasceu de uma (plano Commerce). */
  invoiceId: text("invoice_id").references(() => financeInvoices.id),
  paidAt: ts("paid_at"),
  fulfilledAt: ts("fulfilled_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("corporate_orders_store_idx").on(t.storeId), index("corporate_orders_status_idx").on(t.status), check("corporate_orders_total_nonneg", sql`${t.totalCents} >= 0`)]);

export const GATEWAY_TX_STATUSES = ["PENDING", "PAID", "FAILED", "CANCELED", "EXPIRED", "REFUNDED", "CHARGEBACK"] as const;
export type GatewayTxStatus = (typeof GATEWAY_TX_STATUSES)[number];

/** Tentativa de cobrança num gateway (Pix ou cartão). Nunca muda de gateway depois de criada. */
export const gatewayTransactions = pgTable("gateway_transactions", {
  id: id(),
  gateway: text("gateway", { enum: GATEWAYS }).notNull(),
  orderId: text("order_id").references(() => corporateOrders.id),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  externalId: text("external_id"),
  method: text("method", { enum: ["PIX", "CARD"] }).notNull(),
  installments: integer("installments").notNull().default(1),
  status: text("status", { enum: GATEWAY_TX_STATUSES }).notNull().default("PENDING"),
  providerStatus: text("provider_status"),
  grossCents: integer("gross_cents").notNull(),
  feeCents: integer("fee_cents"),
  netCents: integer("net_cents"),
  refundedCents: integer("refunded_cents").notNull().default(0),
  pixCode: text("pix_code"),
  pixQrBase64: text("pix_qr_base64"),
  checkoutUrl: text("checkout_url"),
  expiresAt: ts("expires_at"),
  paidAt: ts("paid_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("gateway_transactions_external").on(t.gateway, t.externalId), index("gateway_transactions_order_idx").on(t.orderId)]);

/** Notificações recebidas dos gateways: chave única por evento (webhook duplicado não processa duas vezes). */
export const paymentEvents = pgTable("payment_events", {
  id: id(),
  gateway: text("gateway", { enum: GATEWAYS }).notNull(),
  eventKey: text("event_key").notNull().unique(),
  type: text("type").notNull(),
  externalId: text("external_id"),
  transactionId: text("transaction_id"),
  result: text("result", { enum: ["PROCESSED", "IGNORED", "REJECTED", "FAILED"] }).notNull(),
  detail: text("detail"),
  receivedAt: ts("received_at").notNull().defaultNow(),
}, (t) => [index("payment_events_received_idx").on(t.receivedAt)]);

/** Trilha financeira SÓ-INSERÇÃO (trigger impede alterar ou apagar). Nunca guarda segredo, cartão ou PII completa. */
export const financialAuditLog = pgTable("financial_audit_log", {
  id: id(),
  domain: text("domain", { enum: ["nextlevel_corporate_finance", "tenant_operational_finance"] }).notNull(),
  actorUserId: text("actor_user_id"),
  actorRole: text("actor_role"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  storeId: text("store_id"),
  supplierId: text("supplier_id"),
  partnerId: text("partner_id"),
  before: jsonb("before").$type<Record<string, unknown>>(),
  after: jsonb("after").$type<Record<string, unknown>>(),
  reason: text("reason"),
  createdAt: createdAt(),
}, (t) => [index("financial_audit_entity_idx").on(t.entityType, t.entityId), index("financial_audit_created_idx").on(t.createdAt)]);

export const NL_SUBSCRIPTION_STATUSES = ["trial", "pending_payment", "active", "past_due", "suspended", "cancelled", "expired"] as const;
export type NlSubscriptionStatus = (typeof NL_SUBSCRIPTION_STATUSES)[number];

/** Assinatura do plano Commerce da loja (o acesso continua travado por stores.trial_ends_at / paid_until). */
export const nlSubscriptions = pgTable("nl_subscriptions", {
  id: id(),
  storeId: text("store_id").notNull().references(() => stores.id),
  productKey: text("product_key").notNull(),
  cycle: text("cycle", { enum: ["MONTHLY", "ANNUAL"] }).notNull(),
  status: text("status", { enum: NL_SUBSCRIPTION_STATUSES }).notNull(),
  priceVersionId: text("price_version_id").notNull().references(() => catalogPriceVersions.id),
  /** Valor do ciclo congelado na contratação (mudança de preço não afeta quem já assinou). */
  amountCents: integer("amount_cents").notNull(),
  platformFeeBps: integer("platform_fee_bps").notNull(),
  offerKey: text("offer_key"),
  offerVersion: integer("offer_version"),
  firstPeriodCents: integer("first_period_cents"),
  trialEndsAt: ts("trial_ends_at"),
  /** Pedidos criados antes desta data não pagam taxa de plataforma. */
  feeHolidayUntil: ts("fee_holiday_until"),
  currentPeriodStart: ts("current_period_start"),
  currentPeriodEnd: ts("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  canceledAt: ts("canceled_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("nl_subscriptions_store_unique").on(t.storeId)]);

export const QUOTE_STATUSES = ["REQUESTED", "DRAFTING", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CONVERTED"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

/** Proposta para produto sob consulta (Enterprise, Premium, Scale, White Label, pacotes de marketing). */
export const corporateQuotes = pgTable("corporate_quotes", {
  id: id(),
  productId: text("product_id").notNull().references(() => catalogProducts.id),
  status: text("status", { enum: QUOTE_STATUSES }).notNull().default("REQUESTED"),
  requesterType: text("requester_type", { enum: ["STORE", "SUPPLIER", "PARTNER", "GUEST"] }).notNull(),
  storeId: text("store_id").references(() => stores.id),
  supplierId: text("supplier_id").references(() => suppliers.id),
  partnerId: text("partner_id"),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  briefing: text("briefing").notNull(),
  items: jsonb("items").$type<{ description: string; amountCents: number }[]>().notNull().default([]),
  discountCents: integer("discount_cents").notNull().default(0),
  totalCents: integer("total_cents"),
  terms: text("terms"),
  validUntil: ts("valid_until"),
  acceptedAt: ts("accepted_at"),
  attribution: jsonb("attribution").$type<Record<string, string>>().notNull().default({}),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("corporate_quotes_status_idx").on(t.status)]);

/** Entrega de serviço/projeto vendido (Loja Pronta, Migração, Marketing): prazo, responsável, checklist e aceite. */
export const serviceDeliveries = pgTable("service_deliveries", {
  id: id(),
  orderId: text("order_id").references(() => corporateOrders.id),
  quoteId: text("quote_id").references(() => corporateQuotes.id),
  productKey: text("product_key").notNull(),
  storeId: text("store_id").references(() => stores.id),
  supplierId: text("supplier_id").references(() => suppliers.id),
  status: text("status", { enum: ["WAITING_BRIEFING", "IN_PROGRESS", "REVIEW", "DELIVERED", "ACCEPTED", "CANCELED"] }).notNull().default("WAITING_BRIEFING"),
  ownerUserId: text("owner_user_id"),
  dueAt: ts("due_at"),
  checklist: jsonb("checklist").$type<{ label: string; done: boolean }[]>().notNull().default([]),
  /** Migração: origem, escopo, volume prometido. Marketing: canais, verba recomendada (paga pelo cliente direto à plataforma). */
  details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
  acceptedAt: ts("accepted_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("service_deliveries_order_unique").on(t.orderId), index("service_deliveries_store_idx").on(t.storeId)]);

/** Conciliação: o que o sistema registrou × o que o gateway informa. */
export const reconciliationRecords = pgTable("reconciliation_records", {
  id: id(),
  gateway: text("gateway", { enum: GATEWAYS }).notNull(),
  transactionId: text("transaction_id").notNull().references(() => gatewayTransactions.id),
  externalId: text("external_id"),
  expectedCents: integer("expected_cents").notNull(),
  gatewayCents: integer("gateway_cents"),
  status: text("status", { enum: ["MATCHED", "MISMATCH", "MISSING_GATEWAY", "PENDING"] }).notNull(),
  note: text("note"),
  checkedAt: ts("checked_at").notNull().defaultNow(),
}, (t) => [index("reconciliation_tx_idx").on(t.transactionId)]);

/** CRM do parceiro: leads próprios, com proteção contra disputa (lead já registrado por outro parceiro). */
export const PARTNER_LEAD_STAGES = ["NEW", "DIAG_SCHEDULED", "DIAG_DELIVERED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST", "ONBOARDING", "REACTIVATION"] as const;
export type PartnerLeadStage = (typeof PARTNER_LEAD_STAGES)[number];
export const partnerLeads = pgTable("partner_leads", {
  id: id(),
  partnerId: text("partner_id").notNull().references(() => partners.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  stage: text("stage", { enum: PARTNER_LEAD_STAGES }).notNull().default("NEW"),
  /** Diagnóstico padronizado: nota de maturidade, respostas, recomendações e validade. */
  diagnosis: jsonb("diagnosis").$type<{ score: number; answers: Record<string, string>; recommendations: string[]; validUntil: string } | null>(),
  notes: text("notes"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("partner_leads_email_unique").on(t.email), index("partner_leads_partner_idx").on(t.partnerId, t.stage)]);

// ---------------------------------------------------------------------------
// Brás Digital (D92): membro comprador com CNPJ e vídeos de análise da página pública
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
  /** Aceite dos termos de uso e da política de privacidade da Brás (D99): data e versão aceita. Vazio = cadastro anterior aos termos. */
  termsAcceptedAt: ts("terms_accepted_at"),
  termsVersion: text("terms_version"),
  /** Origem do cadastro (D99): de onde veio (descoberta, home, direto ou utm saneado) e a descoberta que trouxe o membro. */
  source: text("source"),
  sourceVideoId: text("source_video_id"),
  /** Última visita ao Meu Brás, para mostrar as descobertas novas desde então. */
  lastSeenAt: ts("last_seen_at"),
  /** Perfil do cadastro (D108): respostas das perguntas, pontuação e nível declarado. Vazio = cadastro anterior às perguntas. */
  profile: jsonb("profile").$type<BrasMemberProfile | null>(),
  profileScore: integer("profile_score"),
  declaredLevel: text("declared_level"),
  profileAnsweredAt: ts("profile_answered_at"),
  /** Ajuste manual do nível pelo Master (com motivo); vazio = automático (maior entre declarado e comprovado). */
  levelOverride: text("level_override"),
  levelOverrideReason: text("level_override_reason"),
  createdAt: createdAt(),
}, (t) => [index("bd_members_status_idx").on(t.status, t.createdAt), index("bd_members_source_video_idx").on(t.sourceVideoId)]);

/** Respostas do perfil do membro (D108). As opções vivem em `src/lib/domain/bras/perfil.ts`. */
export type BrasMemberProfile = { stage: string; channels: string[]; monthlyPurchase: string; revenue: string; importExperience: string; team: string; goals: string[] };

/** Dados da análise de mercado de uma descoberta (D95). Só para quem tem acesso à análise; nunca promessa de ganho. */
export type BrasAnalysis = {
  /** Tendência: por que o produto está em alta (buscas, sazonalidade). */
  trend?: string;
  /** Concorrência: quantos vendem, como vendem. */
  competition?: string;
  /** Faixa de preço de venda praticada no Mercado Livre, por unidade (centavos). */
  salePriceMinCents?: number;
  salePriceMaxCents?: number;
  /** Riscos e cuidados. */
  risks?: string;
  /** Como anunciar: título, fotos, preço de entrada. */
  howToSell?: string;
};

/**
 * Descoberta da Brás (D92/D95; nome técnico `bd_videos` mantido): o Shorts público (`youtube_id`, vertical) convida para a
 * análise de mercado. Público: título, gancho (`summary`) e sinal de tendência em palavras. Membro: veredito, nota e trecho.
 * Acesso à análise: vídeo completo (`analysis_youtube_id`, horizontal) e os dados (`analysis`). Sem preço nem importadora aqui.
 */
export const bdVideos = pgTable("bd_videos", {
  id: id(),
  youtubeId: text("youtube_id").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary"),
  position: integer("position").notNull().default(0),
  active: boolean("active").notNull().default(true),
  /** Sinal de tendência só em palavras, público (ex.: "Buscas subindo"). Nunca números. */
  trendSignal: text("trend_signal"),
  /** Veredito e nota (0 a 10): o membro grátis vê. */
  verdict: text("verdict"),
  score: integer("score"),
  /** Trecho da análise (vídeo curto separado, não listado): o membro grátis vê. */
  teaserYoutubeId: text("teaser_youtube_id"),
  /** Análise completa (YouTube não listado na fase grátis; vídeo privado quando passar a cobrar, D95). */
  analysisYoutubeId: text("analysis_youtube_id"),
  analysis: jsonb("analysis").$type<BrasAnalysis>(),
  analysisUpdatedAt: ts("analysis_updated_at"),
  /** Agenda (D101): vazio = publicada ao ativar; no futuro = só aparece a partir dessa hora (regra de leitura, sem agendador). */
  publishAt: ts("publish_at"),
  createdBy: text("created_by"),
  createdAt: createdAt(),
}, (t) => [index("bd_videos_order_idx").on(t.active, t.position)]);

// ---------------------------------------------------------------------------
// Brás Digital (D93): importadoras sem login, oferta por vídeo e pedido de compra do membro (primeira etapa, manual)
// ---------------------------------------------------------------------------
/** Importadora da Brás, cadastrada pelo Master só para organizar ofertas. Sem login nem acesso a membros (o Balcão vem depois). */
export const bdImporters = pgTable("bd_importers", {
  id: id(),
  name: text("name").notNull(),
  /** Anotações internas do Master (comissão combinada, contato). Nunca saem para o membro. */
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  /** Link privado do Balcão (D106): só o hash SHA-256 do código fica guardado; trocar o link invalida o anterior. */
  balcaoTokenHash: text("balcao_token_hash").unique(),
  balcaoTokenCreatedAt: ts("balcao_token_created_at"),
  /** Endereço de retirada no Brás (D103): o membro vê a partir do pedido confirmado, no comprovante de retirada. */
  pickupAddress: text("pickup_address"),
  /** Comissão combinada com a importadora, em pontos-base (500 = 5%). Vazio = padrão `bras.default_commission_bps` (D102). */
  commissionBps: integer("commission_bps"),
  /** Importadora 360 (D110): identidade, condições comerciais, modo de estoque e plano. Nada disso vai ao membro, salvo o nome fantasia na retirada. */
  legalName: text("legal_name"),
  cnpj: text("cnpj"),
  stateRegistration: text("state_registration"),
  description: text("description"),
  categories: jsonb("categories").$type<string[]>().notNull().default([]),
  origin: text("origin"),
  contacts: jsonb("contacts").$type<{ name: string; role: string; phone?: string; email?: string; channel?: string }[]>().notNull().default([]),
  minBoxes: integer("min_boxes"),
  minOrderCents: integer("min_order_cents"),
  paymentMethods: jsonb("payment_methods").$type<string[]>().notNull().default([]),
  prepDays: integer("prep_days"),
  exchangePolicy: text("exchange_policy"),
  stockMode: text("stock_mode", { enum: ["MANUAL", "PLANILHA", "BLING"] }).notNull().default("MANUAL"),
  plan: text("plan", { enum: ["GRATIS", "PRO", "PREMIUM"] }).notNull().default("GRATIS"),
  organizationId: text("organization_id").references(() => organizations.id),
  /**
   * Rede aberta (D159/D160): fornecedor de qualquer tipo, em um polo, que se cadastra sozinho e passa pela aprovação no
   * Estúdio. Os já cadastrados pelo Master ficam como importadora do Brás, aprovados.
   */
  supplierType: text("supplier_type", { enum: ["IMPORTADORA", "DISTRIBUIDOR", "ATACADISTA"] }).notNull().default("IMPORTADORA"),
  polo: text("polo", { enum: ["CANINDE", "BRAS", "BOM_RETIRO", "VINTE_CINCO", "OUTRO"] }).notNull().default("BRAS"),
  approvalStatus: text("approval_status", { enum: ["PENDENTE", "APROVADO", "RECUSADO"] }).notNull().default("APROVADO"),
  signupSource: text("signup_source", { enum: ["MASTER", "AUTOCADASTRO"] }).notNull().default("MASTER"),
  submittedAt: ts("submitted_at"),
  reviewedAt: ts("reviewed_at"),
  reviewedBy: text("reviewed_by"),
  /** Motivo da recusa ou observação da aprovação (o fornecedor vê o motivo da recusa). */
  reviewNote: text("review_note"),
  createdAt: createdAt(),
}, (t) => [index("bd_importers_approval_idx").on(t.approvalStatus, t.submittedAt), index("bd_importers_polo_idx").on(t.polo, t.supplierType)]);

/** Pessoas com login no painel da importadora (D110). Função de equipe decide o que cada uma faz. Um usuário, uma importadora. */
export const BRAS_IMPORTER_STAFF_ROLES = ["DONO", "COMERCIAL", "ESTOQUE", "BALCAO", "FINANCEIRO"] as const;
export const bdImporterUsers = pgTable("bd_importer_users", {
  id: id(),
  importerId: text("importer_id").notNull().references(() => bdImporters.id),
  userId: text("user_id").notNull().unique().references(() => users.id),
  staffRole: text("staff_role", { enum: BRAS_IMPORTER_STAFF_ROLES }).notNull().default("DONO"),
  createdBy: text("created_by"),
  createdAt: createdAt(),
}, (t) => [index("bd_importer_users_importer_idx").on(t.importerId)]);

/** Galpões e pontos de retirada da importadora (D110). Um é o padrão. */
export const bdWarehouses = pgTable("bd_warehouses", {
  id: id(),
  importerId: text("importer_id").notNull().references(() => bdImporters.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  hours: text("hours"),
  rules: text("rules"),
  contact: text("contact"),
  isDefault: boolean("is_default").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
}, (t) => [index("bd_warehouses_importer_idx").on(t.importerId)]);

/**
 * Produto de caixa fechada da importadora (D110, seção 6.2 do prompt v2). Estoque contado EM CAIXAS, com saldo
 * guardado (`stockBoxes`, nunca negativo, baixa condicional) e movimentos em `bd_stock_movements`. Dimensões em mm,
 * peso em gramas (inteiros); cubagem calculada.
 */
export const bdProducts = pgTable("bd_products", {
  id: id(),
  importerId: text("importer_id").notNull().references(() => bdImporters.id),
  sku: text("sku").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  unitsPerBox: integer("units_per_box").notNull(),
  boxLengthMm: integer("box_length_mm"),
  boxWidthMm: integer("box_width_mm"),
  boxHeightMm: integer("box_height_mm"),
  grossWeightG: integer("gross_weight_g"),
  /** Faixas de preço por quantidade de caixas, em ordem crescente de mínimo (a primeira começa em 1). */
  priceTiers: jsonb("price_tiers").$type<{ minBoxes: number; priceBoxCents: number }[]>().notNull(),
  minBoxes: integer("min_boxes").notNull().default(1),
  warehouseId: text("warehouse_id").references(() => bdWarehouses.id),
  ncm: text("ncm"),
  barcode: text("barcode"),
  status: text("status", { enum: ["RASCUNHO", "ATIVO", "ESGOTADO", "ALTO_MAR"] }).notNull().default("RASCUNHO"),
  stockBoxes: integer("stock_boxes").notNull().default(0),
  stockUpdatedAt: ts("stock_updated_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("bd_products_importer_sku_unique").on(t.importerId, t.sku), index("bd_products_importer_status_idx").on(t.importerId, t.status), check("bd_products_stock_non_negative", sql`${t.stockBoxes} >= 0`)]);

/** Movimentos de estoque em caixas (D110): entrada, saída, ajuste, contagem e vendas. `balanceAfter` é o saldo depois do movimento. */
export const bdStockMovements = pgTable("bd_stock_movements", {
  id: id(),
  productId: text("product_id").notNull().references(() => bdProducts.id),
  importerId: text("importer_id").notNull().references(() => bdImporters.id),
  kind: text("kind", { enum: ["ENTRADA", "SAIDA", "AJUSTE", "CONTAGEM", "VENDA", "ESTORNO"] }).notNull(),
  boxes: integer("boxes").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  source: text("source", { enum: ["MANUAL", "PLANILHA", "BLING", "PEDIDO"] }).notNull(),
  note: text("note"),
  actorUserId: text("actor_user_id"),
  requestId: text("request_id"),
  createdAt: createdAt(),
}, (t) => [index("bd_stock_movements_product_idx").on(t.productId, t.createdAt), index("bd_stock_movements_importer_idx").on(t.importerId, t.createdAt)]);

/** Oferta do vídeo: preço da caixa, unidades e caixas disponíveis (informativo, sem baixa automática). Só membro ativo vê. */
export const bdOffers = pgTable("bd_offers", {
  id: id(),
  videoId: text("video_id").notNull().unique().references(() => bdVideos.id, { onDelete: "cascade" }),
  importerId: text("importer_id").notNull().references(() => bdImporters.id),
  priceBoxCents: integer("price_box_cents").notNull(),
  unitsPerBox: integer("units_per_box").notNull(),
  /** Null = "consultar a equipe". */
  boxesAvailable: integer("boxes_available"),
  /** Produto de caixa fechada da importadora (D110): ligado, o estoque mostrado ao membro vem do produto. */
  productId: text("product_id").references(() => bdProducts.id),
  updatedAt: updatedAt(),
  updatedBy: text("updated_by"),
});

/**
 * Pedido de compra do membro (D93). Preço, produto e importadora copiados no momento do pedido.
 * Dados de envio ficam aqui porque a importadora (quando tiver o Balcão) vê só eles (`brasShippingView`).
 */
export const bdRequests = pgTable("bd_requests", {
  id: id(),
  number: integer("number").notNull().unique(),
  memberId: text("member_id").notNull().references(() => bdMembers.id),
  videoId: text("video_id").references(() => bdVideos.id, { onDelete: "set null" }),
  importerId: text("importer_id").notNull().references(() => bdImporters.id),
  productTitle: text("product_title").notNull(),
  importerName: text("importer_name").notNull(),
  boxes: integer("boxes").notNull(),
  unitsPerBox: integer("units_per_box").notNull(),
  priceBoxCents: integer("price_box_cents").notNull(),
  totalCents: integer("total_cents").notNull(),
  status: text("status", { enum: ["NEW", "CONFIRMED", "PAID", "PICKED_UP", "CANCELED"] }).notNull().default("NEW"),
  carrier: text("carrier").notNull(),
  /** Transportadora escolhida pelo membro no catálogo (D113); null = texto livre ("outra transportadora"). */
  carrierId: text("carrier_id").references((): AnyPgColumn => trCarriers.id),
  shipName: text("ship_name").notNull(),
  shipAddress: text("ship_address").notNull(),
  shipCity: text("ship_city").notNull(),
  shipState: text("ship_state").notNull(),
  shipZip: text("ship_zip").notNull(),
  /** Observação do membro para a equipe (não vai para a importadora). */
  notes: text("notes"),
  /** Quando virou Pago (mês da comissão) e a comissão congelada nessa hora, em pontos-base (D102). */
  paidAt: ts("paid_at"),
  commissionBps: integer("commission_bps"),
  /** Código de retirada (D103), gerado na confirmação: o motorista apresenta na importadora. */
  pickupCode: text("pickup_code").unique(),
  /** Painel da importadora (D110): disponibilidade conferida e caixas separadas. */
  availabilityConfirmedAt: ts("availability_confirmed_at"),
  separatedAt: ts("separated_at"),
  pickedUpAt: ts("picked_up_at"),
  /** Produto de caixa fechada da oferta no momento do pedido (D110): a confirmação baixa o estoque dele. */
  productId: text("product_id"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("bd_requests_member_idx").on(t.memberId, t.createdAt), index("bd_requests_status_idx").on(t.status, t.createdAt), index("bd_requests_importer_paid_idx").on(t.importerId, t.paidAt)]);

/**
 * Fechamento manual da comissão de uma importadora num mês (D102): o sistema calcula, o dono cobra e marca como recebida.
 * Desfazer não apaga: marca UNDONE com motivo (trilha). Um fechamento ativo por importadora e mês.
 */
export const bdCommissionSettlements = pgTable("bd_commission_settlements", {
  id: id(),
  importerId: text("importer_id").notNull().references(() => bdImporters.id),
  /** Mês no horário de Brasília, "AAAA-MM". */
  month: text("month").notNull(),
  amountCents: integer("amount_cents").notNull(),
  requestsCount: integer("requests_count").notNull(),
  status: text("status", { enum: ["ACTIVE", "UNDONE"] }).notNull().default("ACTIVE"),
  note: text("note"),
  receivedAt: ts("received_at").notNull(),
  createdBy: text("created_by").notNull(),
  undoneAt: ts("undone_at"),
  undoReason: text("undo_reason"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("bd_commission_settlements_active_unique").on(t.importerId, t.month).where(sql`status = 'ACTIVE'`)]);

/**
 * Acesso à análise completa liberado a um membro (D95): assinatura paga (por enquanto confirmada à mão pelo Master, até a
 * cobrança entrar pelo Financeiro Master) ou cortesia. Vale até `valid_until`; revogado não vale.
 */
export const bdAccessGrants = pgTable("bd_access_grants", {
  id: id(),
  memberId: text("member_id").notNull().references(() => bdMembers.id),
  kind: text("kind", { enum: ["SUBSCRIPTION", "COURTESY"] }).notNull(),
  /** Plano concedido (D108): Prata, Ouro ou Platinum. Liberações anteriores aos planos valem como Prata. */
  plan: text("plan", { enum: ["PRATA", "OURO", "PLATINUM"] }).notNull().default("PRATA"),
  validUntil: ts("valid_until").notNull(),
  note: text("note"),
  revokedAt: ts("revoked_at"),
  createdBy: text("created_by"),
  createdAt: createdAt(),
}, (t) => [index("bd_access_grants_member_idx").on(t.memberId, t.validUntil)]);

/** Conversa do membro com a equipe da Brás (D108): chat assíncrono, liberado pelo plano. A importadora nunca lê. */
export const bdSupportMessages = pgTable("bd_support_messages", {
  id: id(),
  memberId: text("member_id").notNull().references(() => bdMembers.id),
  author: text("author", { enum: ["MEMBER", "TEAM"] }).notNull(),
  authorUserId: text("author_user_id").notNull(),
  body: text("body").notNull(),
  /** Lida pelo outro lado (equipe lê a do membro; membro lê a da equipe). */
  readAt: ts("read_at"),
  createdAt: createdAt(),
}, (t) => [index("bd_support_messages_member_idx").on(t.memberId, t.createdAt), index("bd_support_messages_unread_idx").on(t.author, t.readAt)]);

/** Agenda pessoal na importadora (D108): o membro pede um horário; a equipe confirma dia e hora. Limite por mês no plano. */
export const bdAppointments = pgTable("bd_appointments", {
  id: id(),
  memberId: text("member_id").notNull().references(() => bdMembers.id),
  importerId: text("importer_id").references(() => bdImporters.id),
  /** Dia preferido (AAAA-MM-DD) e período. */
  preferredDate: text("preferred_date").notNull(),
  period: text("period", { enum: ["MANHA", "TARDE"] }).notNull(),
  topic: text("topic").notNull(),
  status: text("status", { enum: ["REQUESTED", "CONFIRMED", "DONE", "CANCELED"] }).notNull().default("REQUESTED"),
  scheduledAt: ts("scheduled_at"),
  /** Recado da equipe ao membro (endereço, quem recebe). */
  teamNote: text("team_note"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("bd_appointments_member_idx").on(t.memberId, t.createdAt), index("bd_appointments_status_idx").on(t.status, t.preferredDate)]);

/** Pauta da máquina de conteúdo (D108): cada gravação planejada, do roteiro à publicação, ligada à importadora e à descoberta. */
export const BRAS_CONTENT_FORMATS = ["SHORTS", "TRECHO", "ANALISE", "TOUR", "CAIXA_ABERTA", "BRAS_X_ML", "CONTEINER", "RANKING", "TRES_JEITOS"] as const;
export const BRAS_CONTENT_STATUSES = ["IDEIA", "GRAVAR", "GRAVADO", "EDICAO", "PUBLICADO"] as const;
export const bdContentItems = pgTable("bd_content_items", {
  id: id(),
  title: text("title").notNull(),
  format: text("format", { enum: BRAS_CONTENT_FORMATS }).notNull(),
  status: text("status", { enum: BRAS_CONTENT_STATUSES }).notNull().default("IDEIA"),
  importerId: text("importer_id").references(() => bdImporters.id),
  videoId: text("video_id").references(() => bdVideos.id),
  /** Dia da gravação (AAAA-MM-DD) e quem grava. */
  recordDate: text("record_date"),
  owner: text("owner"),
  hook: text("hook"),
  notes: text("notes"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("bd_content_items_status_idx").on(t.status, t.recordDate)]);

// ---------------------------------------------------------------------------
// NextLevel Cargas (D111): transportadoras, cargas (coletas) e o link do motorista
// ---------------------------------------------------------------------------
/** Transportadora cadastrada (pelo Master, pela importadora ou vinda da lista de interesse). Plano define a comissão por carga. */
export const trCarriers = pgTable("tr_carriers", {
  id: id(),
  name: text("name").notNull(),
  docType: text("doc_type", { enum: ["CNPJ", "CPF"] }).notNull(),
  /** Só dígitos, conferidos no cadastro. */
  document: text("document").notNull().unique(),
  contactName: text("contact_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  ufs: jsonb("ufs").$type<string[]>().notNull().default([]),
  vehicles: jsonb("vehicles").$type<string[]>().notNull().default([]),
  rntrc: text("rntrc"),
  insurance: boolean("insurance").notNull().default(false),
  /** Tabela simples em texto ou "cotar caso a caso". */
  rateNotes: text("rate_notes"),
  plan: text("plan", { enum: ["GRATIS", "PRO", "PREMIUM"] }).notNull().default("GRATIS"),
  status: text("status", { enum: ["ATIVA", "PAUSADA"] }).notNull().default("ATIVA"),
  /** CARGA: transportadora de carga fechada (D111). EXCURSAO: ônibus de excursão que leva fardos (D112). */
  operation: text("operation", { enum: ["CARGA", "EXCURSAO"] }).notNull().default("CARGA"),
  organizationId: text("organization_id").references(() => organizations.id),
  /** Quem cadastrou: importadora (cadastro rápido) ou null (Master). */
  createdByImporterId: text("created_by_importer_id").references(() => bdImporters.id),
  /** Link do motorista (sem login, padrão D106): só o hash. */
  driverTokenHash: text("driver_token_hash").unique(),
  driverTokenCreatedAt: ts("driver_token_created_at"),
  /** Mercado Pago do dono do ônibus (D119): o frete pago por Pix cai direto na conta dele. Token só criptografado. */
  mpAccessTokenEnc: text("mp_access_token_enc"),
  mpAccountId: text("mp_account_id"),
  mpConnectedAt: ts("mp_connected_at"),
  createdBy: text("created_by"),
  createdAt: createdAt(),
}, (t) => [index("tr_carriers_status_idx").on(t.status)]);

/** Autorizações da transportadora (D112): número, órgão e validade; o Master confere. Selo "documentação em dia". */
export const trCarrierDocuments = pgTable("tr_carrier_documents", {
  id: id(),
  carrierId: text("carrier_id").notNull().references(() => trCarriers.id),
  kind: text("kind", { enum: ["FRETAMENTO", "RNTRC", "ESTADUAL", "SEGURO", "OUTRO"] }).notNull(),
  number: text("number").notNull(),
  issuer: text("issuer"),
  /** AAAA-MM-DD; null = sem validade. */
  validUntil: text("valid_until"),
  notes: text("notes"),
  status: text("status", { enum: ["PENDENTE", "VERIFICADA", "RECUSADA"] }).notNull().default("PENDENTE"),
  verifiedBy: text("verified_by"),
  verifiedAt: ts("verified_at"),
  createdBy: text("created_by"),
  createdAt: createdAt(),
}, (t) => [index("tr_carrier_documents_carrier_idx").on(t.carrierId)]);

// ---------------------------------------------------------------------------
// Cargas Excursão (D114): rota fixa, viagem com bagageiro em fardinhos equivalentes e fardos com preço congelado.
// ---------------------------------------------------------------------------
export const trRoutes = pgTable("tr_routes", {
  id: id(),
  carrierId: text("carrier_id").notNull().references(() => trCarriers.id),
  name: text("name").notNull(),
  originCity: text("origin_city").notNull(),
  originUf: text("origin_uf").notNull(),
  citiesServed: jsonb("cities_served").$type<{ city: string; uf: string }[]>().notNull().default([]),
  brasPoint: text("bras_point").notNull(),
  cityPoint: text("city_point").notNull(),
  /** 0 = domingo. Dias em que o ônibus chega ao Brás (informativo para o cliente). */
  arrivalWeekdays: jsonb("arrival_weekdays").$type<number[]>().notNull().default([]),
  travelHours: integer("travel_hours").notNull(),
  /** Preço por fardo em centavos (P, M, G); congelado em cada fardo na reserva. */
  prices: jsonb("prices").$type<{ P: number; M: number; G: number }>().notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
}, (t) => [index("tr_routes_carrier_idx").on(t.carrierId)]);

export const trTrips = pgTable("tr_trips", {
  id: id(),
  number: integer("number").notNull().unique(),
  routeId: text("route_id").notNull().references(() => trRoutes.id),
  carrierId: text("carrier_id").notNull().references(() => trCarriers.id),
  arriveBrasAt: ts("arrive_bras_at").notNull(),
  departAt: ts("depart_at").notNull(),
  arriveCityAt: ts("arrive_city_at"),
  capacityUnits: integer("capacity_units").notNull(),
  status: text("status", { enum: ["ABERTA", "LOTADA", "EM_VIAGEM", "CHEGOU", "ENCERRADA", "CANCELADA"] }).notNull().default("ABERTA"),
  departedAt: ts("departed_at"),
  arrivedAt: ts("arrived_at"),
  createdAt: createdAt(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
}, (t) => [index("tr_trips_carrier_idx").on(t.carrierId, t.status), index("tr_trips_depart_idx").on(t.status, t.departAt)]);

export const TR_PARCEL_PAY_STATUSES = ["COMBINAR", "A_PAGAR", "PAGO", "NA_CHEGADA", "RECEBIDO", "DEVOLVER", "DEVOLVIDO"] as const;
export const trParcels = pgTable("tr_parcels", {
  id: id(),
  tripId: text("trip_id").notNull().references(() => trTrips.id),
  carrierId: text("carrier_id").notNull().references(() => trCarriers.id),
  clientUserId: text("client_user_id").notNull().references(() => users.id),
  memberId: text("member_id").references(() => bdMembers.id),
  requestId: text("request_id").references(() => bdRequests.id),
  /** Número do fardo na viagem: a etiqueta é "viagem-seq" (ex.: 8001-07). */
  seq: integer("seq").notNull(),
  size: text("size", { enum: ["P", "M", "G"] }).notNull(),
  units: integer("units").notNull(),
  priceCents: integer("price_cents").notNull(),
  /** Taxa da plataforma congelada no aceite. */
  feeCents: integer("fee_cents"),
  storeName: text("store_name").notNull(),
  storeAddress: text("store_address"),
  recipientName: text("recipient_name").notNull(),
  /** Código que o cliente mostra para retirar na cidade (como o código de retirada da Brás, D103). */
  deliveryCode: text("delivery_code").notNull().unique(),
  /** Chave da NF-e (44 dígitos, dígito conferido). Regra: sem nota não embarca. */
  invoiceKey: text("invoice_key"),
  status: text("status", { enum: ["SOLICITADO", "ESPERA", "ACEITO", "RECUSADO", "PRONTO", "COLETADO", "EM_VIAGEM", "CHEGOU", "ENTREGUE", "NAO_EMBARCOU", "CANCELADO"] }).notNull().default("SOLICITADO"),
  /**
   * Pagamento do frete (D119). COMBINAR: Pix online desligado, cliente e ônibus combinam. A_PAGAR: Pix na conta do
   * ônibus antes da coleta. PAGO: conferido na API do Mercado Pago. NA_CHEGADA: cliente de confiança paga na chegada;
   * RECEBIDO: o dono do ônibus registrou. DEVOLVER/DEVOLVIDO: pago e não viajou.
   */
  payStatus: text("pay_status", { enum: TR_PARCEL_PAY_STATUSES }).notNull().default("COMBINAR"),
  refuseReason: text("refuse_reason"),
  acceptedAt: ts("accepted_at"),
  collectedAt: ts("collected_at"),
  deliveredAt: ts("delivered_at"),
  createdAt: createdAt(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("tr_parcels_trip_seq").on(t.tripId, t.seq), index("tr_parcels_client_idx").on(t.clientUserId, t.createdAt), index("tr_parcels_carrier_idx").on(t.carrierId, t.status)]);

export const trParcelEvents = pgTable("tr_parcel_events", {
  id: id(),
  parcelId: text("parcel_id").notNull().references(() => trParcels.id),
  kind: text("kind").notNull(),
  actor: text("actor").notNull(),
  note: text("note"),
  createdAt: createdAt(),
}, (t) => [index("tr_parcel_events_parcel_idx").on(t.parcelId, t.createdAt)]);

/** Pessoas com login no painel da transportadora. */
export const trCarrierUsers = pgTable("tr_carrier_users", {
  id: id(),
  carrierId: text("carrier_id").notNull().references(() => trCarriers.id),
  userId: text("user_id").notNull().unique().references(() => users.id),
  createdAt: createdAt(),
});

/**
 * Carga (coleta) chamada pela importadora para uma transportadora: um ou mais pedidos da Brás, mesma retirada.
 * Frete informado pela transportadora ao aceitar; comissão da NextLevel congelada no aceite pelo plano da transportadora.
 */
export const TR_LOAD_STATUSES = ["CHAMADA", "ACEITA", "RECUSADA", "COLETADA", "ENTREGUE", "CANCELADA"] as const;
export const trLoads = pgTable("tr_loads", {
  id: id(),
  number: integer("number").notNull().unique(),
  importerId: text("importer_id").notNull().references(() => bdImporters.id),
  carrierId: text("carrier_id").notNull().references(() => trCarriers.id),
  warehouseId: text("warehouse_id").references(() => bdWarehouses.id),
  status: text("status", { enum: TR_LOAD_STATUSES }).notNull().default("CHAMADA"),
  pickupDate: text("pickup_date").notNull(),
  period: text("period", { enum: ["MANHA", "TARDE"] }).notNull(),
  boxes: integer("boxes").notNull(),
  /** Volume e peso somados dos produtos ligados (quando há medidas). */
  volumeLiters: integer("volume_liters"),
  weightKg: integer("weight_kg"),
  destinations: text("destinations").notNull(),
  notes: text("notes"),
  freightCents: integer("freight_cents"),
  commissionBps: integer("commission_bps"),
  commissionCents: integer("commission_cents"),
  refuseReason: text("refuse_reason"),
  createdBy: text("created_by").notNull(),
  acceptedAt: ts("accepted_at"),
  collectedAt: ts("collected_at"),
  deliveredAt: ts("delivered_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("tr_loads_carrier_idx").on(t.carrierId, t.status), index("tr_loads_importer_idx").on(t.importerId, t.status)]);

export const trLoadRequests = pgTable("tr_load_requests", {
  id: id(),
  loadId: text("load_id").notNull().references(() => trLoads.id),
  requestId: text("request_id").notNull().references(() => bdRequests.id),
}, (t) => [uniqueIndex("tr_load_requests_unique").on(t.loadId, t.requestId), index("tr_load_requests_request_idx").on(t.requestId)]);

/** Linha do tempo da carga (chamada, aceite, coleta, entrega, ocorrência). */
export const trLoadEvents = pgTable("tr_load_events", {
  id: id(),
  loadId: text("load_id").notNull().references(() => trLoads.id),
  kind: text("kind").notNull(),
  note: text("note"),
  actor: text("actor").notNull(),
  createdAt: createdAt(),
}, (t) => [index("tr_load_events_load_idx").on(t.loadId, t.createdAt)]);

// ---------------------------------------------------------------------------
// Brás Digital Club: indicações em rede (D113). Um motor só para todo convite (cliente, importadora, transportadora,
// ônibus, loja, guia). Os pontos entram na fase E4 (razão próprio); aqui fica quem indicou quem e em que etapa está.
// ---------------------------------------------------------------------------
export const CLUB_REFERRAL_KINDS = ["CLIENTE", "IMPORTADORA", "TRANSPORTADORA", "ONIBUS", "LOJA", "GUIA"] as const;
export const CLUB_REFERRAL_STATUSES = ["CONVIDADO", "CADASTROU", "ATIVOU", "RECORRENTE", "RECUSADA", "EXPIRADA"] as const;
export const clubReferrals = pgTable("club_referrals", {
  id: id(),
  referrerUserId: text("referrer_user_id").notNull().references(() => users.id),
  kind: text("kind", { enum: CLUB_REFERRAL_KINDS }).notNull(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  /** Só dígitos; com o tipo, identifica o indicado (a primeira indicação válida é a que vale). */
  phone: text("phone").notNull(),
  document: text("document"),
  city: text("city"),
  uf: text("uf"),
  /** Onde nasceu o convite (ex.: pedido da Brás) e em que virou (ex.: tr_carrier). */
  contextType: text("context_type"),
  contextId: text("context_id"),
  targetType: text("target_type"),
  targetId: text("target_id"),
  status: text("status", { enum: CLUB_REFERRAL_STATUSES }).notNull().default("CONVIDADO"),
  activatedAt: ts("activated_at"),
  createdAt: createdAt(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("club_referrals_kind_phone").on(t.kind, t.phone), index("club_referrals_referrer_idx").on(t.referrerUserId, t.createdAt), index("club_referrals_status_idx").on(t.status)]);

/** Pontos do Club (D115): razão append-only. Saldo = soma dos lançamentos DISPONIVEL; REVISAO não conta até o Master liberar. */
export const clubLedger = pgTable("club_ledger", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id),
  /** Com sinal: ganho positivo; vale, vencimento e estorno negativos; vale cancelado volta positivo. */
  points: integer("points").notNull(),
  kind: text("kind", { enum: ["EARN", "REDEEM", "EXPIRE", "REVERSE", "ADJUST"] }).notNull(),
  status: text("status", { enum: ["DISPONIVEL", "REVISAO", "RECUSADO"] }).notNull().default("DISPONIVEL"),
  source: text("source").notNull(),
  referenceId: text("reference_id"),
  /** Quem paga o desconto destes pontos (D120): chave da empresa do grupo. Indicação e missão = NEXTLEVEL (caixa do Club). */
  funder: text("funder").notNull().default("NEXTLEVEL"),
  expiresAt: ts("expires_at"),
  note: text("note"),
  actorUserId: text("actor_user_id"),
  createdAt: createdAt(),
}, (t) => [index("club_ledger_user_idx").on(t.userId, t.createdAt), uniqueIndex("club_ledger_once").on(t.userId, t.source, t.referenceId)]);

/** Vale do Club: pontos viram desconto com código, usado no balcão de uma empresa participante. */
export const clubVouchers = pgTable("club_vouchers", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id),
  code: text("code").notNull().unique(),
  points: integer("points").notNull(),
  valueCents: integer("value_cents").notNull(),
  status: text("status", { enum: ["ATIVO", "USADO", "CANCELADO"] }).notNull().default("ATIVO"),
  expiresAt: ts("expires_at").notNull(),
  usedAt: ts("used_at"),
  usedBy: text("used_by"),
  usedNote: text("used_note"),
  createdAt: createdAt(),
}, (t) => [index("club_vouchers_user_idx").on(t.userId, t.createdAt)]);

/** Código de convite do membro do Club (link /c/<código>). */
export const clubCodes = pgTable("club_codes", {
  userId: text("user_id").primaryKey().references(() => users.id),
  code: text("code").notNull().unique(),
  createdAt: createdAt(),
});

// ---------------------------------------------------------------------------
// Nota em dia (D117): função emergencial "Meu Contador". Chamado urgente ligado ao fardo, com prazo até a saída do
// ônibus; o contador resolve pelo caminho correto e a chave da nota volta para o fardo. Conversa própria do chamado
// (quem abre pode ser cliente, importadora ou ônibus; o suporte da Brás é só do membro).
// ---------------------------------------------------------------------------
export const accountingTickets = pgTable("accounting_tickets", {
  id: id(),
  number: integer("number").notNull().unique(),
  requesterUserId: text("requester_user_id").notNull().references(() => users.id),
  parcelId: text("parcel_id").references(() => trParcels.id),
  storeName: text("store_name").notNull(),
  storePhone: text("store_phone"),
  description: text("description").notNull(),
  approxValueCents: integer("approx_value_cents"),
  deadlineAt: ts("deadline_at"),
  /** Preço do serviço congelado na abertura; cobrado só com a cobrança ligada pelo dono. */
  priceCents: integer("price_cents").notNull().default(0),
  status: text("status", { enum: ["ABERTO", "EM_ATENDIMENTO", "RESOLVIDO", "SEM_SOLUCAO", "CANCELADO"] }).notNull().default("ABERTO"),
  assignedTo: text("assigned_to"),
  invoiceKey: text("invoice_key"),
  resolutionNote: text("resolution_note"),
  resolvedAt: ts("resolved_at"),
  createdAt: createdAt(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
}, (t) => [index("accounting_tickets_status_idx").on(t.status, t.deadlineAt), index("accounting_tickets_requester_idx").on(t.requesterUserId, t.createdAt)]);

export const accountingTicketMessages = pgTable("accounting_ticket_messages", {
  id: id(),
  ticketId: text("ticket_id").notNull().references(() => accountingTickets.id),
  author: text("author", { enum: ["CLIENTE", "CONTADOR"] }).notNull(),
  authorUserId: text("author_user_id").notNull(),
  body: text("body").notNull(),
  createdAt: createdAt(),
}, (t) => [index("accounting_ticket_messages_ticket_idx").on(t.ticketId, t.createdAt)]);

// ---------------------------------------------------------------------------
// Duas vias (D118): transportadora pede para ser preferida da importadora; coleta fixa; avaliação da coleta.
// ---------------------------------------------------------------------------
export const trCarrierPreferences = pgTable("tr_carrier_preferences", {
  id: id(),
  importerId: text("importer_id").notNull().references(() => bdImporters.id),
  carrierId: text("carrier_id").notNull().references(() => trCarriers.id),
  /** PEDIDO: a transportadora pediu; ACEITA: preferida (aparece primeiro ao chamar coleta); RECUSADA: pode pedir de novo. */
  status: text("status", { enum: ["PEDIDO", "ACEITA", "RECUSADA"] }).notNull().default("PEDIDO"),
  message: text("message"),
  /** Coleta fixa: dias da semana (0 = domingo) e hora "HH:MM" no horário de Brasília. */
  fixedWeekdays: jsonb("fixed_weekdays").$type<number[]>().notNull().default([]),
  fixedTime: text("fixed_time"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("tr_carrier_preferences_unique").on(t.importerId, t.carrierId), index("tr_carrier_preferences_carrier_idx").on(t.carrierId)]);

/** Avaliação da coleta pela importadora (uma por coleta): pontualidade e cuidado de 1 a 5. A média é pública. */
export const trLoadRatings = pgTable("tr_load_ratings", {
  id: id(),
  loadId: text("load_id").notNull().unique().references(() => trLoads.id),
  carrierId: text("carrier_id").notNull().references(() => trCarriers.id),
  importerId: text("importer_id").notNull().references(() => bdImporters.id),
  punctuality: integer("punctuality").notNull(),
  care: integer("care").notNull(),
  comment: text("comment"),
  createdAt: createdAt(),
}, (t) => [index("tr_load_ratings_carrier_idx").on(t.carrierId)]);

/** Pix do frete (D119): cobrança na conta Mercado Pago do dono do ônibus, cobrindo os fardos a pagar do cliente numa viagem. */
export const trFreightPayments = pgTable("tr_freight_payments", {
  id: id(),
  carrierId: text("carrier_id").notNull().references(() => trCarriers.id),
  tripId: text("trip_id").notNull().references(() => trTrips.id),
  payerUserId: text("payer_user_id").notNull().references(() => users.id),
  parcelIds: jsonb("parcel_ids").$type<string[]>().notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status", { enum: ["PENDENTE", "PAGO", "EXPIRADO"] }).notNull().default("PENDENTE"),
  mpPaymentId: text("mp_payment_id"),
  pixCode: text("pix_code"),
  expiresAt: ts("expires_at").notNull(),
  paidAt: ts("paid_at"),
  createdAt: createdAt(),
}, (t) => [index("tr_freight_payments_payer_idx").on(t.payerUserId, t.tripId), index("tr_freight_payments_carrier_idx").on(t.carrierId, t.status)]);

/** Clientes de confiança do ônibus (D119): pagam o frete na chegada. */
export const trTrustedClients = pgTable("tr_trusted_clients", {
  id: id(),
  carrierId: text("carrier_id").notNull().references(() => trCarriers.id),
  clientUserId: text("client_user_id").notNull().references(() => users.id),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("tr_trusted_clients_unique").on(t.carrierId, t.clientUserId)]);

// ---------------------------------------------------------------------------
// Club E8a (D120): cartão com QR, balcão das empresas do grupo, compra que vira ponto e acerto entre empresas.
// ---------------------------------------------------------------------------
/** Cartão do Club: identificador opaco do QR (nunca o documento). Trocar o cartão invalida o anterior. */
export const clubCards = pgTable("club_cards", {
  userId: text("user_id").primaryKey().references(() => users.id),
  token: text("token").notNull().unique(),
  createdAt: createdAt(),
});

/** Balcão de uma empresa do grupo (link sem login, padrão D106): só o hash do código fica guardado. */
export const clubCounters = pgTable("club_counters", {
  id: id(),
  company: text("company").notNull(),
  name: text("name").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  active: boolean("active").notNull().default(true),
  createdBy: text("created_by"),
  lastUsedAt: ts("last_used_at"),
  createdAt: createdAt(),
}, (t) => [index("club_counters_company_idx").on(t.company)]);

/** Compra registrada no balcão: vira pontos pagos pela empresa onde a compra aconteceu. */
export const clubPurchases = pgTable("club_purchases", {
  id: id(),
  counterId: text("counter_id").notNull().references(() => clubCounters.id),
  company: text("company").notNull(),
  userId: text("user_id").notNull().references(() => users.id),
  valueCents: integer("value_cents").notNull(),
  points: integer("points").notNull(),
  /** Número do cupom ou da nota da compra: a mesma compra não pontua duas vezes. */
  receipt: text("receipt"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("club_purchases_receipt").on(t.company, t.receipt), index("club_purchases_user_idx").on(t.userId, t.createdAt)]);

/** De quem eram os pontos de cada vale (ordem de chegada): base do acerto entre empresas. */
export const clubVoucherFunding = pgTable("club_voucher_funding", {
  id: id(),
  voucherId: text("voucher_id").notNull().references(() => clubVouchers.id),
  funder: text("funder").notNull(),
  points: integer("points").notNull(),
}, (t) => [index("club_voucher_funding_voucher_idx").on(t.voucherId)]);

/** Acerto entre empresas marcado como feito (fora do sistema, por nota ou transferência). O sistema só registra. */
export const clubSettlements = pgTable("club_settlements", {
  id: id(),
  month: text("month").notNull(),
  debtor: text("debtor").notNull(),
  creditor: text("creditor").notNull(),
  amountCents: integer("amount_cents").notNull(),
  note: text("note"),
  settledBy: text("settled_by").notNull(),
  createdAt: createdAt(),
}, (t) => [index("club_settlements_month_idx").on(t.month)]);

/** Perfil público do Club (D122): só quem aceitar aparece no ranking da cidade, com o primeiro nome e a cidade. */
export const clubProfiles = pgTable("club_profiles", {
  userId: text("user_id").primaryKey().references(() => users.id),
  showInRanking: boolean("show_in_ranking").notNull().default(false),
  displayName: text("display_name").notNull(),
  city: text("city").notNull(),
  uf: text("uf").notNull(),
  updatedAt: updatedAt(),
}, (t) => [index("club_profiles_city_idx").on(t.uf, t.city)]);

/**
 * Questionário de preço dentro do painel (D124, fase P2): as respostas ficam **sem ligação com a pessoa** (só marca e mês);
 * quem já respondeu (ou pediu para não ver) fica em `price_survey_status`, separado, para não perguntar de novo.
 */
export const PRICE_SURVEY_BRANDS = ["NEXTLEVEL_COMMERCE", "SUPERDROP", "BRAS_DIGITAL", "NEXTLEVEL_CARGAS"] as const;
export const priceSurveyResponses = pgTable("price_survey_responses", {
  id: id(),
  brand: text("brand", { enum: PRICE_SURVEY_BRANDS }).notNull(),
  /** AAAA-MM: só o mês, para a resposta não poder ser ligada a quem respondeu pela hora. */
  month: text("month").notNull(),
  tooCheapCents: integer("too_cheap_cents").notNull(),
  bargainCents: integer("bargain_cents").notNull(),
  expensiveCents: integer("expensive_cents").notNull(),
  tooExpensiveCents: integer("too_expensive_cents").notNull(),
  /** "Como você se sentiria se não pudesse mais usar?" */
  disappointment: text("disappointment", { enum: ["MUITO", "POUCO", "NADA"] }).notNull(),
}, (t) => [index("price_survey_responses_brand_idx").on(t.brand, t.month)]);

export const priceSurveyStatus = pgTable("price_survey_status", {
  userId: text("user_id").notNull().references(() => users.id),
  brand: text("brand", { enum: PRICE_SURVEY_BRANDS }).notNull(),
  status: text("status", { enum: ["RESPONDEU", "DISPENSOU"] }).notNull(),
  month: text("month").notNull(),
}, (t) => [primaryKey({ columns: [t.userId, t.brand] })]);

/**
 * Fila de oportunidades cruzadas do Master (D135, fase P5M): cada oportunidade nasce de uma regra (ex.: lojista que
 * vende bem e ainda não compra na Brás) e ganha dono, situação e anotação. A chave (regra + cliente) não repete.
 */
export const CROSS_OPP_STATUSES = ["NOVA", "EM_CONTATO", "ATIVOU", "DESCARTADA"] as const;
export const crossOpportunities = pgTable("cross_opportunities", {
  id: id(),
  key: text("key").notNull().unique(),
  rule: text("rule").notNull(),
  fromBrand: text("from_brand").notNull(),
  toBrand: text("to_brand").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  status: text("status", { enum: CROSS_OPP_STATUSES }).notNull().default("NOVA"),
  ownerUserId: text("owner_user_id").references(() => users.id),
  note: text("note"),
  activatedAt: ts("activated_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("cross_opportunities_status_idx").on(t.status)]);

/**
 * Experimentos (D136, fase P6): cada peça da porta de entrada e do ecossistema pode rodar como experimento, com grupo de
 * controle × grupo novo sorteado por cliente (fixo), métrica principal, métrica de guarda, tamanho mínimo e data de
 * leitura combinados antes. Nada vira padrão sem leitura escrita e decisão do dono.
 */
export const EXPERIMENT_PIECES = ["PORTA_SUPERDROP", "PORTA_COMMERCE", "BENEFICIOS"] as const;
export const EXPERIMENT_STATUSES = ["RASCUNHO", "RODANDO", "ENCERRADO"] as const;
export const experiments = pgTable("experiments", {
  id: id(),
  piece: text("piece", { enum: EXPERIMENT_PIECES }).notNull(),
  name: text("name").notNull(),
  status: text("status", { enum: EXPERIMENT_STATUSES }).notNull().default("RASCUNHO"),
  /** % dos clientes novos que vão para o grupo novo (o resto fica no controle, como hoje). */
  treatmentPct: integer("treatment_pct").notNull().default(50),
  primaryMetric: text("primary_metric", { enum: ["ATIVACAO_30", "PAGANTE_30"] }).notNull(),
  guardMetric: text("guard_metric", { enum: ["RECEITA_POR_CLIENTE", "SAIDA_30"] }).notNull(),
  minPerGroup: integer("min_per_group").notNull().default(100),
  readAt: ts("read_at").notNull(),
  startedAt: ts("started_at"),
  endedAt: ts("ended_at"),
  /** Leitura escrita e decisão do dono (texto livre), obrigatórias para encerrar. */
  reading: text("reading"),
  decision: text("decision"),
  createdBy: text("created_by").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("experiments_piece_idx").on(t.piece, t.status)]);

/**
 * Passagem entre marcas da conta do grupo (D141): código de uso único e curto (2 minutos) que abre o perfil da mesma
 * pessoa no endereço de outra marca, sem novo login. Guarda só o hash do código.
 */
export const groupPassCodes = pgTable("group_pass_codes", {
  id: id(),
  codeHash: text("code_hash").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id),
  fromUserId: text("from_user_id").notNull().references(() => users.id),
  expiresAt: ts("expires_at").notNull(),
  usedAt: ts("used_at"),
  createdAt: createdAt(),
});

/**
 * Central de qualidade (D142): situação de cada tela do sistema, marcada pelo dono (testada, aprovada, com problema) com
 * anotação e o valor de exemplo para telas com parte variável no endereço (ex.: `/store/[slug]` → `mantos-shop`).
 */
export const qaScreens = pgTable("qa_screens", {
  route: text("route").primaryKey(),
  tested: boolean("tested").notNull().default(false),
  approved: boolean("approved").notNull().default(false),
  problem: boolean("problem").notNull().default(false),
  note: text("note"),
  sample: text("sample"),
  /** O que falta na tela (D143): IMAGEM, TEXTO, VIDEO, FUNCAO, DADOS. */
  needs: jsonb("needs").$type<string[]>().notNull().default([]),
  /** O que a imagem que falta deve mostrar (vira o pedido para o GPT). */
  imageBrief: text("image_brief"),
  updatedBy: text("updated_by").references(() => users.id),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export type QaCheckResult = { key: string; url: string; status: number | null; ms: number; ok: boolean; expected: string; detail: string | null };
/** Checagens automáticas da central de qualidade (domínios no ar e páginas respondendo), com o resultado de cada item. */
export const qaRuns = pgTable("qa_runs", {
  id: id(),
  /** MAPA (D147): página × endereço do Mapa vivo; a chave de cada resultado é "rota@marca". */
  kind: text("kind", { enum: ["DOMINIOS", "PAGINAS", "MAPA"] }).notNull(),
  results: jsonb("results").$type<QaCheckResult[]>().notNull(),
  ok: integer("ok").notNull(),
  failed: integer("failed").notNull(),
  startedBy: text("started_by").references(() => users.id),
  createdAt: createdAt(),
}, (t) => [index("qa_runs_kind_idx").on(t.kind, t.createdAt)]);

/**
 * Progresso na base de conhecimento (BC2, D267): uma linha por pessoa da equipe do Master e aula. A aula fica concluída
 * quando a pessoa acerta todas as perguntas (conferidas no servidor com os números do sistema de agora).
 */
export const aprenderProgresso = pgTable("aprender_progresso", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id),
  aulaId: text("aula_id").notNull(),
  trilha: text("trilha").notNull(),
  acertos: integer("acertos").notNull().default(0),
  total: integer("total").notNull().default(0),
  tentativas: integer("tentativas").notNull().default(0),
  concluidaAt: ts("concluida_at"),
  createdAt: createdAt(),
  updatedAt: ts("updated_at"),
}, (t) => [uniqueIndex("aprender_progresso_usuario_aula").on(t.userId, t.aulaId), index("aprender_progresso_usuario_idx").on(t.userId)]);

// ---------------------------------------------------------------------------------------------------------------------
// Caixa do Master (CX0, D269): abre e fecha por dia, lançamentos com meio e origem, histórico de toda edição.
// ---------------------------------------------------------------------------------------------------------------------
export const CAIXA_MEIOS = ["DINHEIRO", "PIX", "MAQUININHA", "MAQUININHA_VENDEDOR", "MERCADO_PAGO", "CARTAO", "TRANSFERENCIA", "BOLETO", "OUTRO"] as const;
/** Para onde o dinheiro foi (D270, dono 07/11): dinheiro com o Mauricio, Mercado Pago (CNPJ Mega Tron), Pix Itaú (CNPJ NextLevel), Pix Nubank (CPF Mauricio). */
export const CAIXA_DESTINOS = ["DINHEIRO_MAURICIO", "MP_MEGATRON", "PIX_ITAU_NEXTLEVEL", "PIX_NUBANK_MAURICIO"] as const;
export const CAIXA_ORIGENS = ["ASSINATURA", "TEMPLATE", "SERVICO", "PRESTACAO_EXECUTIVO", "SANGRIA", "REFORCO", "COMISSAO_PAGA", "AJUSTE", "OUTRO"] as const;

/** Um dia de caixa (data no fuso de São Paulo). Fechado, fica travado; só o dono reabre. */
export const caixaDias = pgTable("caixa_dias", {
  id: id(),
  data: text("data").notNull(),
  status: text("status", { enum: ["ABERTO", "FECHADO"] }).notNull().default("ABERTO"),
  saldoInicialCents: integer("saldo_inicial_cents").notNull().default(0),
  abertoEm: ts("aberto_em").notNull(),
  abertoPor: text("aberto_por").notNull().references(() => users.id),
  fechadoEm: ts("fechado_em"),
  fechadoPor: text("fechado_por").references(() => users.id),
  /** Dinheiro contado na gaveta no fechamento. */
  contadoCents: integer("contado_cents"),
  esperadoCents: integer("esperado_cents"),
  diferencaCents: integer("diferenca_cents"),
  motivoDiferenca: text("motivo_diferenca"),
  createdAt: createdAt(),
  updatedAt: ts("updated_at"),
}, (t) => [uniqueIndex("caixa_dias_data").on(t.data)]);

/** Entrada ou saída do caixa. Nunca se apaga: errou, estorna ou edita com motivo. */
export const caixaLancamentos = pgTable("caixa_lancamentos", {
  id: id(),
  data: text("data").notNull(),
  ocorridoEm: ts("ocorrido_em").notNull(),
  tipo: text("tipo", { enum: ["ENTRADA", "SAIDA"] }).notNull(),
  meio: text("meio", { enum: CAIXA_MEIOS }).notNull(),
  origem: text("origem", { enum: CAIXA_ORIGENS }).notNull(),
  valorCents: integer("valor_cents").notNull(),
  storeId: text("store_id").references(() => stores.id),
  partnerId: text("partner_id").references(() => partners.id),
  invoiceId: text("invoice_id").references(() => financeInvoices.id),
  /** Conta onde o dinheiro entrou ou de onde saiu (D270). Nulo só nos lançamentos antigos. */
  destino: text("destino", { enum: CAIXA_DESTINOS }),
  /** Template ou serviço do catálogo pago neste lançamento (D270). */
  produtoKey: text("produto_key"),
  descricao: text("descricao").notNull().default(""),
  criadoPor: text("criado_por").notNull().references(() => users.id),
  estornadoEm: ts("estornado_em"),
  estornoMotivo: text("estorno_motivo"),
  createdAt: createdAt(),
  updatedAt: ts("updated_at"),
}, (t) => [index("caixa_lancamentos_data_idx").on(t.data), index("caixa_lancamentos_partner_idx").on(t.partnerId), check("caixa_lancamentos_valor_pos", sql`${t.valorCents} > 0`)]);

/** Histórico do caixa: abrir, fechar, reabrir, lançar, editar e estornar, com o antes, o depois e o motivo. */
export const caixaHistorico = pgTable("caixa_historico", {
  id: id(),
  diaId: text("dia_id").references(() => caixaDias.id),
  lancamentoId: text("lancamento_id").references(() => caixaLancamentos.id),
  acao: text("acao", { enum: ["ABRIR", "FECHAR", "REABRIR", "LANCAR", "EDITAR", "ESTORNAR"] }).notNull(),
  antes: jsonb("antes").$type<Record<string, unknown>>(),
  depois: jsonb("depois").$type<Record<string, unknown>>(),
  motivo: text("motivo"),
  userId: text("user_id").notNull().references(() => users.id),
  createdAt: createdAt(),
}, (t) => [index("caixa_historico_lancamento_idx").on(t.lancamentoId), index("caixa_historico_dia_idx").on(t.diaId)]);

// ---------------------------------------------------------------------------------------------------------------------
// Bônus gamificado (BG1, D271): campanhas ligadas pelo dono, por público (online × rua) e período (semana × mês).
// ---------------------------------------------------------------------------------------------------------------------
export type FaixaDeBonus = { pontos: number; valorCents: number };
export const bonusCampanhas = pgTable("bonus_campanhas", {
  id: id(),
  chave: text("chave").notNull(),
  nome: text("nome").notNull(),
  publico: text("publico", { enum: ["ONLINE", "RUA"] }).notNull(),
  periodo: text("periodo", { enum: ["SEMANA", "MES"] }).notNull(),
  faixas: jsonb("faixas").$type<FaixaDeBonus[]>().notNull(),
  orcamentoCents: integer("orcamento_cents").notNull(),
  ativa: boolean("ativa").notNull().default(false),
  versao: integer("versao").notNull().default(1),
  atualizadoPor: text("atualizado_por").references(() => users.id),
  createdAt: createdAt(),
  updatedAt: ts("updated_at"),
}, (t) => [uniqueIndex("bonus_campanhas_chave").on(t.chave)]);

/** Prêmio apurado (um por campanha, parceiro e período). Valor 0 com motivo quando o orçamento acabou. */
export const bonusPremios = pgTable("bonus_premios", {
  id: id(),
  campanhaId: text("campanha_id").notNull().references(() => bonusCampanhas.id),
  partnerId: text("partner_id").notNull().references(() => partners.id),
  periodo: text("periodo").notNull(),
  pontos: integer("pontos_centesimos").notNull(),
  faixaPontos: integer("faixa_pontos").notNull(),
  valorCents: integer("valor_cents").notNull(),
  status: text("status", { enum: ["PAGO", "SEM_ORCAMENTO"] }).notNull(),
  comissaoId: text("comissao_id"),
  versaoCampanha: integer("versao_campanha").notNull(),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("bonus_premios_unico").on(t.campanhaId, t.partnerId, t.periodo), index("bonus_premios_partner_idx").on(t.partnerId)]);

// ---------------------------------------------------------------------------------------------------------------------
// Executivos de venda (CX3, D273): venda na rua. Dinheiro fica com o executivo até a prestação de contas; maquininha do
// vendedor cai na conta do Mercado Pago e o Master só confere. Entregue/conferido, entra no caixa do dia.
// ---------------------------------------------------------------------------------------------------------------------
export const executivoRecebimentos = pgTable("executivo_recebimentos", {
  id: id(),
  codigo: text("codigo").notNull(),
  partnerId: text("partner_id").notNull().references(() => partners.id),
  storeId: text("store_id").notNull().references(() => stores.id),
  invoiceId: text("invoice_id").notNull().references(() => financeInvoices.id),
  meio: text("meio", { enum: ["DINHEIRO", "MAQUININHA_VENDEDOR"] }).notNull(),
  valorCents: integer("valor_cents").notNull(),
  status: text("status", { enum: ["COM_EXECUTIVO", "ENTREGUE", "ESTORNADO"] }).notNull().default("COM_EXECUTIVO"),
  recebidoEm: ts("recebido_em").notNull(),
  prazoAte: ts("prazo_ate").notNull(),
  entregueEm: ts("entregue_em"),
  recebidoPor: text("recebido_por").references(() => users.id),
  lancamentoId: text("lancamento_id").references(() => caixaLancamentos.id),
  observacao: text("observacao"),
  motivoEstorno: text("motivo_estorno"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("executivo_recebimentos_codigo").on(t.codigo), index("executivo_recebimentos_partner_idx").on(t.partnerId, t.status)]);

/**
 * Visitas e demonstrações do executivo na rua (CX4 + BG3, D274): alimentam as missões, o ranking de esforço e a agenda
 * de retornos. Nada aqui paga nada.
 */
export const executivoVisitas = pgTable("executivo_visitas", {
  id: id(),
  partnerId: text("partner_id").notNull().references(() => partners.id),
  storeId: text("store_id").references(() => stores.id),
  loja: text("loja").notNull(),
  contato: text("contato"),
  whatsapp: text("whatsapp"),
  tipo: text("tipo", { enum: ["VISITA", "DEMONSTRACAO"] }).notNull(),
  resultado: text("resultado", { enum: ["INTERESSADO", "PENSAR", "NAO_QUIS", "CADASTROU", "VENDEU"] }).notNull(),
  retornoEm: text("retorno_em"),
  retornoFeitoEm: ts("retorno_feito_em"),
  observacao: text("observacao"),
  createdAt: createdAt(),
}, (t) => [index("executivo_visitas_partner_idx").on(t.partnerId, t.createdAt)]);

/**
 * Contratos com aceite no painel (CT1+CT2, D276). O Master cria a partir de um modelo, a NextLevel assina ao enviar e o
 * dono da loja dá o aceite no próprio painel. O conteúdo fica congelado (JSON) com impressão digital SHA-256; o aceite
 * guarda a prova (usuário, data do servidor, IP e aparelho). Mudança depois de aceito só por aditivo (contrato novo).
 */
export const CONTRATO_STATUS = ["ENVIADO", "ACEITO", "CANCELADO"] as const;
export const contratos = pgTable("contratos", {
  id: id(),
  /** Número legível, ex.: LPX-20261110-01. */
  numero: text("numero").notNull().unique(),
  modelo: text("modelo").notNull(),
  versaoModelo: integer("versao_modelo").notNull(),
  storeId: text("store_id").notNull().references(() => stores.id),
  titulo: text("titulo").notNull(),
  /** Campos preenchidos (cliente, valores, datas) e o texto final congelado. */
  dados: jsonb("dados").$type<Record<string, unknown>>().notNull(),
  conteudo: jsonb("conteudo").$type<{ secoes: { titulo: string; resumo?: string; paragrafos?: string[]; itens?: string[] }[] }>().notNull(),
  hash: text("hash").notNull(),
  status: text("status", { enum: CONTRATO_STATUS }).notNull().default("ENVIADO"),
  /** Assinatura da contratada: quem enviou pelo Master. */
  enviadoPor: text("enviado_por").notNull(),
  enviadoEm: ts("enviado_em").notNull(),
  aceitoPor: text("aceito_por"),
  aceitoNome: text("aceito_nome"),
  aceitoEm: ts("aceito_em"),
  aceitoIp: text("aceito_ip"),
  aceitoAparelho: text("aceito_aparelho"),
  /** Impressão digital do texto que o cliente viu ao aceitar (tem de ser igual a `hash`). */
  aceitoHash: text("aceito_hash"),
  canceladoEm: ts("cancelado_em"),
  createdAt: createdAt(),
}, (t) => [index("contratos_store_idx").on(t.storeId, t.status)]);

/** Parcelas do contrato (CT3, D277): o cliente avisa "Já fiz o Pix"; só o Master confirma, depois de conferir no banco. */
export const PARCELA_STATUS = ["ABERTA", "AVISADA", "PAGA"] as const;
export const contratoParcelas = pgTable("contrato_parcelas", {
  id: id(),
  contratoId: text("contrato_id").notNull().references(() => contratos.id),
  storeId: text("store_id").notNull().references(() => stores.id),
  /** 1 = sinal, 2 = restante. */
  ordem: integer("ordem").notNull(),
  descricao: text("descricao").notNull(),
  valorCents: integer("valor_cents").notNull(),
  vencimento: text("vencimento").notNull(),
  status: text("status", { enum: PARCELA_STATUS }).notNull().default("ABERTA"),
  avisadoEm: ts("avisado_em"),
  avisadoPor: text("avisado_por"),
  avisoNota: text("aviso_nota"),
  confirmadoEm: ts("confirmado_em"),
  confirmadoPor: text("confirmado_por"),
  /** Última vez que o Master não achou o Pix no extrato (a parcela volta a ficar aberta). */
  naoEncontradoEm: ts("nao_encontrado_em"),
  /** Lançamento do caixa feito com a confirmação (vazio se o caixa do dia estava fechado). */
  caixaLancamentoId: text("caixa_lancamento_id"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("contrato_parcelas_ordem_uq").on(t.contratoId, t.ordem), index("contrato_parcelas_store_idx").on(t.storeId, t.status)]);

/** Aceite dos termos de uso da plataforma (D279): um por dono de loja e por versão, com a prova do aceite. */
export const aceitesTermos = pgTable("aceites_termos", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id),
  storeId: text("store_id").references(() => stores.id),
  versao: text("versao").notNull(),
  /** Impressão digital do texto aceito (SHA-256). */
  hash: text("hash").notNull(),
  nome: text("nome").notNull(),
  aceitoEm: ts("aceito_em").notNull(),
  ip: text("ip"),
  aparelho: text("aparelho"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("aceites_termos_user_versao_uq").on(t.userId, t.versao), index("aceites_termos_store_idx").on(t.storeId)]);

// ---------------------------------------------------------------------------
// Painel da Agência (D313): a agência toca a operação dela dentro da NextLevel (carteira, contratos, equipe; depois
// cobrança, produção e portal do cliente). Atrás da chave AGENCIAS_V1. Uma agência nunca lê dados de outra.
// ---------------------------------------------------------------------------
export const AGENCIA_SITUACOES = ["PILOTO", "ATIVA", "PAUSADA"] as const;
/** Funções da equipe da agência: ADMIN vê e faz tudo; FINANCEIRO vê valores; as outras veem a operação dos clientes delas. */
export const AGENCIA_FUNCOES = ["ADMIN", "GESTOR", "ATENDIMENTO", "ROTEIRO", "GRAVACAO", "EDICAO", "SOCIAL_MEDIA", "TRAFEGO", "FINANCEIRO"] as const;
export type AgenciaFuncao = (typeof AGENCIA_FUNCOES)[number];
export const AGENCIA_CLIENTE_SITUACOES = ["ATIVO", "PAUSADO", "ENCERRADO"] as const;
export type AgenciaClienteSituacao = (typeof AGENCIA_CLIENTE_SITUACOES)[number];
/** O que entra no mês do cliente (o "combinado"): quantidades por tipo de entrega. */
export type AgenciaIncluso = { videos?: number; fotos?: number; posts?: number; criativos?: number; gravacoes?: number };

export const agencias = pgTable("agencias", {
  id: id(),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  nome: text("nome").notNull(),
  slug: text("slug").notNull().unique(),
  /** Registro de parceiro (comissão dos adicionais, D260), quando a agência também indica. */
  partnerId: text("partner_id").references(() => partners.id),
  situacao: text("situacao", { enum: AGENCIA_SITUACOES }).notNull().default("PILOTO"),
  /** Agência Fundadora (D313): a primeira de cada etapa, com condições próprias combinadas com o dono. */
  fundadora: boolean("fundadora").notNull().default(false),
  /** Prazo padrão de cada etapa da produção, em dias (D314). Vazio = padrão do sistema. */
  prazosEtapas: jsonb("prazos_etapas").$type<Record<string, number>>().notNull().default({}),
  /** Mercado Pago da própria agência (D318): o cliente da agência paga direto nela. Token só criptografado. */
  mpTokenEnc: text("mp_token_enc"),
  mpConta: text("mp_conta"),
  mpTeste: boolean("mp_teste").notNull().default(false),
  /** Dados jurídicos da agência para os contratos com os clientes dela (D321). */
  razaoSocial: text("razao_social"),
  documento: text("documento"),
  cidadeForo: text("cidade_foro"),
  /** Página de captação (D322): texto e serviços do formulário público de orçamento da agência. */
  /** Conta NextLevel Business da própria agência (D323), criada pela janela "Soluções NextLevel". */
  negocioStoreId: text("negocio_store_id").references(() => stores.id),
  captacao: jsonb("captacao").$type<{ ligada: boolean; titulo: string; texto: string; servicos: string[]; whatsapp: string | null }>(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Pessoa da agência (login próprio, papel AGENCY) e a função dela. Uma pessoa pertence a uma agência só. */
export const agenciaMembros = pgTable("agencia_membros", {
  id: id(),
  agenciaId: text("agencia_id").notNull().references(() => agencias.id),
  userId: text("user_id").notNull().unique().references(() => users.id),
  funcao: text("funcao", { enum: AGENCIA_FUNCOES }).notNull(),
  /** Vê todos os clientes da carteira (sem isso, só os que tem como responsável ou na equipe do cliente). */
  todosClientes: boolean("todos_clientes").notNull().default(false),
  createdAt: createdAt(),
}, (t) => [index("agencia_membros_agencia_idx").on(t.agenciaId)]);

/** Cliente da agência com o contrato do mês (valor, vencimento, o que está incluso) e quem cuida dele. */
export const agenciaClientes = pgTable("agencia_clientes", {
  id: id(),
  agenciaId: text("agencia_id").notNull().references(() => agencias.id),
  nome: text("nome").notNull(),
  segmento: text("segmento"),
  contatoNome: text("contato_nome"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  /** CPF ou CNPJ do cliente, só dígitos (para a cobrança). */
  documento: text("documento"),
  situacao: text("situacao", { enum: AGENCIA_CLIENTE_SITUACOES }).notNull().default("ATIVO"),
  /** Nome do pacote vendido (ex.: "Mensal 8 vídeos"). */
  pacote: text("pacote"),
  incluso: jsonb("incluso").$type<AgenciaIncluso>().notNull().default({}),
  valorMensalCents: integer("valor_mensal_cents"),
  /** Dia do mês do vencimento (1 a 28). */
  diaVencimento: integer("dia_vencimento"),
  /** Início do contrato (AAAA-MM-DD). */
  inicioEm: text("inicio_em"),
  responsavelId: text("responsavel_id").references(() => users.id),
  /** Conta NextLevel Business do cliente, quando ligada com o aceite dele (fase seguinte). */
  storeId: text("store_id").references(() => stores.id),
  observacoes: text("observacoes"),
  /** O cliente aprova cada peça antes de publicar (D314). Desligado, a peça vai da revisão interna direto ao agendamento. */
  exigeAprovacao: boolean("exige_aprovacao").notNull().default(true),
  /** Onboarding (D317): item → data em que foi feito (null = pendente). Começa quando o cliente entra pelo funil comercial. */
  onboarding: jsonb("onboarding").$type<Record<string, string | null>>(),
  motivoEncerramento: text("motivo_encerramento"),
  encerradoEm: ts("encerrado_em"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("agencia_clientes_agencia_idx").on(t.agenciaId, t.situacao), check("agencia_clientes_dia_ck", sql`${t.diaVencimento} is null or (${t.diaVencimento} between 1 and 28)`), check("agencia_clientes_valor_ck", sql`${t.valorMensalCents} is null or ${t.valorMensalCents} >= 0`)]);

/** Equipe de cada cliente: quem da agência trabalha nele (roteiro, edição, social media, tráfego...). */
export const agenciaClienteEquipe = pgTable("agencia_cliente_equipe", {
  clienteId: text("cliente_id").notNull().references(() => agenciaClientes.id),
  userId: text("user_id").notNull().references(() => users.id),
}, (t) => [primaryKey({ columns: [t.clienteId, t.userId] }), index("agencia_cliente_equipe_user_idx").on(t.userId)]);

// ---------------------------------------------------------------------------
// Produção da agência (D314, Fase 1A): a peça de conteúdo atravessa os departamentos (planejamento → roteiro → captação →
// edição → revisão → aprovação → agendamento → publicado → métricas) dentro do ciclo do mês de cada cliente.
// ---------------------------------------------------------------------------
export const PECA_ETAPAS = ["PLANEJAMENTO", "ROTEIRO", "CAPTACAO", "EDICAO", "REVISAO", "APROVACAO", "AGENDAMENTO", "PUBLICADO", "CONCLUIDO"] as const;
export type PecaEtapa = (typeof PECA_ETAPAS)[number];
export const PECA_TIPOS = ["VIDEO", "FOTO", "CARROSSEL", "ARTE", "CRIATIVO", "STORIES"] as const;
export type PecaTipo = (typeof PECA_TIPOS)[number];
export const PECA_PRIORIDADES = ["NORMAL", "ALTA", "URGENTE"] as const;

/** Ciclo do mês de um cliente: o contratado é copiado do contrato quando o ciclo abre (mudança de contrato não reescreve o passado). */
export const agenciaCiclos = pgTable("agencia_ciclos", {
  id: id(),
  agenciaId: text("agencia_id").notNull().references(() => agencias.id),
  clienteId: text("cliente_id").notNull().references(() => agenciaClientes.id),
  /** AAAA-MM */
  mes: text("mes").notNull(),
  contratado: jsonb("contratado").$type<AgenciaIncluso>().notNull().default({}),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("agencia_ciclos_cliente_mes_uq").on(t.clienteId, t.mes), index("agencia_ciclos_agencia_idx").on(t.agenciaId, t.mes)]);

/** Peça de conteúdo: registro único de cada entrega, com etapa, responsável, prazo e links (nada de vídeo no banco). */
export const agenciaPecas = pgTable("agencia_pecas", {
  id: id(),
  agenciaId: text("agencia_id").notNull().references(() => agencias.id),
  clienteId: text("cliente_id").notNull().references(() => agenciaClientes.id),
  cicloId: text("ciclo_id").notNull().references(() => agenciaCiclos.id),
  tipo: text("tipo", { enum: PECA_TIPOS }).notNull().default("VIDEO"),
  titulo: text("titulo").notNull(),
  objetivo: text("objetivo"),
  roteiro: text("roteiro"),
  referencias: text("referencias"),
  etapa: text("etapa", { enum: PECA_ETAPAS }).notNull().default("PLANEJAMENTO"),
  /** Situação dentro da etapa (ex.: EM_DESENVOLVIMENTO no roteiro, EDITANDO na edição). */
  situacao: text("situacao").notNull().default("NAO_INICIADO"),
  responsavelId: text("responsavel_id").references(() => users.id),
  /** Prazo da etapa atual (AAAA-MM-DD). */
  prazo: text("prazo"),
  prioridade: text("prioridade", { enum: PECA_PRIORIDADES }).notNull().default("NORMAL"),
  /** Fora do pacote contratado: conta à parte. */
  extra: boolean("extra").notNull().default(false),
  linkBrutos: text("link_brutos"),
  linkVersao: text("link_versao"),
  linkPublicacao: text("link_publicacao"),
  legenda: text("legenda"),
  publicarEm: ts("publicar_em"),
  versao: integer("versao").notNull().default(0),
  publicadoEm: ts("publicado_em"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("agencia_pecas_agencia_idx").on(t.agenciaId, t.etapa), index("agencia_pecas_ciclo_idx").on(t.cicloId), index("agencia_pecas_resp_idx").on(t.responsavelId, t.etapa)]);

/** Histórico imutável da peça: mudança de etapa, situação, responsável, prazo, versões e ajustes pedidos. */
export const agenciaPecaEventos = pgTable("agencia_peca_eventos", {
  id: id(),
  pecaId: text("peca_id").notNull().references(() => agenciaPecas.id),
  agenciaId: text("agencia_id").notNull().references(() => agencias.id),
  tipo: text("tipo").notNull(),
  mensagem: text("mensagem").notNull(),
  link: text("link"),
  autorId: text("autor_id"),
  autorNome: text("autor_nome"),
  /** Para quem a peça foi (passagem de etapa, ajuste, transferência): base dos avisos da pessoa (D316). */
  destinoId: text("destino_id"),
  createdAt: createdAt(),
}, (t) => [index("agencia_peca_eventos_peca_idx").on(t.pecaId, t.createdAt), index("agencia_peca_eventos_destino_idx").on(t.destinoId, t.createdAt)]);

/** Comentários na peça; `interno` nunca aparece para o cliente. Menções avisam a pessoa citada. */
export const agenciaPecaComentarios = pgTable("agencia_peca_comentarios", {
  id: id(),
  pecaId: text("peca_id").notNull().references(() => agenciaPecas.id),
  agenciaId: text("agencia_id").notNull().references(() => agencias.id),
  autorId: text("autor_id"),
  autorNome: text("autor_nome").notNull(),
  texto: text("texto").notNull(),
  interno: boolean("interno").notNull().default(true),
  mencoes: jsonb("mencoes").$type<string[]>().notNull().default([]),
  link: text("link"),
  createdAt: createdAt(),
}, (t) => [index("agencia_peca_comentarios_peca_idx").on(t.pecaId, t.createdAt)]);

// ---------------------------------------------------------------------------
// Comercial da agência (D317): o funil do briefing, da prospecção ao contrato fechado; "virar cliente" leva à carteira.
// ---------------------------------------------------------------------------
export const OPORTUNIDADE_ETAPAS = ["PROSPECCAO", "CONTATO", "REUNIAO", "PROPOSTA", "NEGOCIACAO", "FECHADO", "PERDIDO"] as const;
export type OportunidadeEtapa = (typeof OPORTUNIDADE_ETAPAS)[number];
export const OPORTUNIDADE_ORIGENS = ["INDICACAO", "INSTAGRAM", "SITE", "ANUNCIO", "WHATSAPP", "EVENTO", "PROSPECCAO_ATIVA", "OUTRO"] as const;

export const agenciaOportunidades = pgTable("agencia_oportunidades", {
  id: id(),
  agenciaId: text("agencia_id").notNull().references(() => agencias.id),
  empresa: text("empresa").notNull(),
  contatoNome: text("contato_nome"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  segmento: text("segmento"),
  origem: text("origem", { enum: OPORTUNIDADE_ORIGENS }).notNull().default("OUTRO"),
  servicos: text("servicos"),
  valorPropostoCents: integer("valor_proposto_cents"),
  etapa: text("etapa", { enum: OPORTUNIDADE_ETAPAS }).notNull().default("PROSPECCAO"),
  motivoPerda: text("motivo_perda"),
  responsavelId: text("responsavel_id").references(() => users.id),
  ultimoContatoEm: ts("ultimo_contato_em"),
  proximaAtividade: text("proxima_atividade"),
  /** AAAA-MM-DD */
  proximaAtividadeEm: text("proxima_atividade_em"),
  observacoes: text("observacoes"),
  /** Cliente criado ao fechar ("virar cliente"). */
  clienteId: text("cliente_id").references(() => agenciaClientes.id),
  /** Pedido que chegou pela página de captação (D322): canal (regra única de canal, D290), etiquetas e página. */
  canal: text("canal"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  clickIds: jsonb("click_ids").$type<Record<string, string>>(),
  origemSite: text("origem_site"),
  pagina: text("pagina"),
  mensagem: text("mensagem"),
  chaveEnvio: text("chave_envio"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("agencia_oportunidades_envio_unique").on(t.agenciaId, t.chaveEnvio), index("agencia_oportunidades_agencia_idx").on(t.agenciaId, t.etapa), check("agencia_oportunidades_valor_ck", sql`${t.valorPropostoCents} is null or ${t.valorPropostoCents} >= 0`)]);

// ---------------------------------------------------------------------------
// Cobrança da agência (D318): uma cobrança por cliente por mês, gerada pelo contrato, paga direto na conta da agência.
// ---------------------------------------------------------------------------
export const FATURA_SITUACOES = ["ABERTA", "PAGA", "CANCELADA"] as const;
export const agenciaFaturas = pgTable("agencia_faturas", {
  id: id(),
  agenciaId: text("agencia_id").notNull().references(() => agencias.id),
  clienteId: text("cliente_id").notNull().references(() => agenciaClientes.id),
  /** AAAA-MM (mensalidade) */
  competencia: text("competencia").notNull(),
  descricao: text("descricao").notNull(),
  valorCents: integer("valor_cents").notNull(),
  /** AAAA-MM-DD */
  vencimento: text("vencimento").notNull(),
  situacao: text("situacao", { enum: FATURA_SITUACOES }).notNull().default("ABERTA"),
  /** Cobrança fora do pacote (gravação extra, diária): não ocupa a vaga da mensalidade do mês. */
  avulsa: boolean("avulsa").notNull().default(false),
  checkoutUrl: text("checkout_url"),
  preferenciaId: text("preferencia_id"),
  mpPaymentId: text("mp_payment_id"),
  pagoEm: ts("pago_em"),
  pagoComo: text("pago_como", { enum: ["SISTEMA", "MANUAL"] }),
  observacao: text("observacao"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  uniqueIndex("agencia_faturas_mensal_uq").on(t.clienteId, t.competencia).where(sql`${t.avulsa} = false`),
  index("agencia_faturas_agencia_idx").on(t.agenciaId, t.situacao, t.vencimento),
  check("agencia_faturas_valor_ck", sql`${t.valorCents} > 0`),
]);

// ---------------------------------------------------------------------------
// Despesas da agência (D319): custos fixos, variáveis, freelancers e ferramentas; ligados a um cliente quando são dele.
// O investimento em mídia que o cliente paga direto às plataformas NÃO entra aqui (não é custo nem receita da agência).
// ---------------------------------------------------------------------------
export const DESPESA_CATEGORIAS = ["FIXO", "FREELANCER", "VARIAVEL", "FERRAMENTA", "IMPOSTO", "OUTRO"] as const;
export const agenciaDespesas = pgTable("agencia_despesas", {
  id: id(),
  agenciaId: text("agencia_id").notNull().references(() => agencias.id),
  /** AAAA-MM */
  competencia: text("competencia").notNull(),
  descricao: text("descricao").notNull(),
  categoria: text("categoria", { enum: DESPESA_CATEGORIAS }).notNull(),
  valorCents: integer("valor_cents").notNull(),
  /** Cliente a que o custo pertence (gravação de um cliente, freelancer de um job). Vazio = custo geral da agência. */
  clienteId: text("cliente_id").references(() => agenciaClientes.id),
  /** Quem recebe (freelancer, fornecedor). */
  favorecido: text("favorecido"),
  pago: boolean("pago").notNull().default(false),
  pagoEm: ts("pago_em"),
  /** Repete todo mês (aluguel, ferramentas): "copiar fixas do mês anterior" traz para o mês novo. */
  recorrente: boolean("recorrente").notNull().default(false),
  origemId: text("origem_id"),
  createdAt: createdAt(),
}, (t) => [index("agencia_despesas_agencia_idx").on(t.agenciaId, t.competencia), uniqueIndex("agencia_despesas_origem_uq").on(t.origemId, t.competencia), check("agencia_despesas_valor_ck", sql`${t.valorCents} > 0`)]);

// ---------------------------------------------------------------------------
// Portal do cliente da agência (D320): pedidos, ideias e dúvidas que o cliente manda pelo portal, com resposta da agência.
// ---------------------------------------------------------------------------
export const SOLICITACAO_TIPOS = ["PEDIDO", "IDEIA", "DUVIDA"] as const;
export const agenciaSolicitacoes = pgTable("agencia_solicitacoes", {
  id: id(),
  agenciaId: text("agencia_id").notNull().references(() => agencias.id),
  clienteId: text("cliente_id").notNull().references(() => agenciaClientes.id),
  tipo: text("tipo", { enum: SOLICITACAO_TIPOS }).notNull(),
  texto: text("texto").notNull(),
  autorEmail: text("autor_email").notNull(),
  situacao: text("situacao", { enum: ["ABERTA", "EM_ANDAMENTO", "RESPONDIDA"] }).notNull().default("ABERTA"),
  resposta: text("resposta"),
  respondidaEm: ts("respondida_em"),
  createdAt: createdAt(),
}, (t) => [index("agencia_solicitacoes_agencia_idx").on(t.agenciaId, t.situacao), index("agencia_solicitacoes_cliente_idx").on(t.clienteId, t.createdAt)]);

/**
 * Contrato entre a agência e o cliente dela (D321), com o mesmo motor dos contratos do Master (D276): texto congelado,
 * impressão digital, aceite pelo portal do cliente com prova (nome, data, endereço de rede, aparelho) e PDF.
 */
export const AGENCIA_CONTRATO_STATUS = ["ENVIADO", "ACEITO", "CANCELADO"] as const;
export const agenciaContratos = pgTable("agencia_contratos", {
  id: id(),
  agenciaId: text("agencia_id").notNull().references(() => agencias.id),
  clienteId: text("cliente_id").notNull().references(() => agenciaClientes.id),
  numero: text("numero").notNull().unique(),
  titulo: text("titulo").notNull(),
  dados: jsonb("dados").$type<Record<string, unknown>>().notNull(),
  conteudo: jsonb("conteudo").$type<{ secoes: { titulo: string; resumo?: string; paragrafos?: string[]; itens?: string[] }[] }>().notNull(),
  hash: text("hash").notNull(),
  status: text("status", { enum: AGENCIA_CONTRATO_STATUS }).notNull().default("ENVIADO"),
  enviadoPor: text("enviado_por").notNull(),
  enviadoEm: ts("enviado_em").notNull(),
  aceitoEmail: text("aceito_email"),
  aceitoNome: text("aceito_nome"),
  aceitoEm: ts("aceito_em"),
  aceitoIp: text("aceito_ip"),
  aceitoAparelho: text("aceito_aparelho"),
  canceladoEm: ts("cancelado_em"),
  createdAt: createdAt(),
}, (t) => [index("agencia_contratos_cliente_idx").on(t.clienteId, t.status), index("agencia_contratos_agencia_idx").on(t.agenciaId)]);

