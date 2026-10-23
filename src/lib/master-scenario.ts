import { eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/client";
import {
  activities,
  brandLeads,
  categories,
  contentItems,
  customers,
  financeInvoices,
  inventory,
  networks,
  orderEvents,
  orderItems,
  orders,
  organizations,
  platformSettings,
  productVariants,
  products,
  storeCustomers,
  storeProducts,
  stores,
  suppliers,
  users,
  walletAccounts,
  walletEntries,
} from "@/db/schema";
import { newId } from "@/lib/ids";

const SCENARIO_KEY = "master_scenario_data_v2";

export const SCENARIO_LEVELS = ["LIGHT", "ACTIVE", "SCALE"] as const;
export type ScenarioLevel = (typeof SCENARIO_LEVELS)[number];
export const SCENARIO_SCOPES = ["ALL", "SUPERDROP", "COMMERCE"] as const;
export type ScenarioScope = (typeof SCENARIO_SCOPES)[number];

const PROFILE: Record<ScenarioLevel, {
  superdropStores: number;
  superdropProducts: number;
  superdropOrders: number;
  commerceStores: number;
  commerceProductsPerStore: number;
  commerceOrders: number;
  commerceLeads: number;
}> = {
  LIGHT: { superdropStores: 2, superdropProducts: 8, superdropOrders: 16, commerceStores: 2, commerceProductsPerStore: 6, commerceOrders: 12, commerceLeads: 6 },
  ACTIVE: { superdropStores: 5, superdropProducts: 16, superdropOrders: 60, commerceStores: 4, commerceProductsPerStore: 10, commerceOrders: 40, commerceLeads: 16 },
  SCALE: { superdropStores: 10, superdropProducts: 24, superdropOrders: 160, commerceStores: 8, commerceProductsPerStore: 14, commerceOrders: 120, commerceLeads: 40 },
};

export type MasterScenarioState = {
  version: 2;
  active: true;
  level: ScenarioLevel;
  scope: ScenarioScope;
  createdAt: string;
  supplierIds: string[];
  networkIds: string[];
  organizationIds: string[];
  storeIds: string[];
  superdropStoreIds: string[];
  commerceStoreIds: string[];
  userIds: string[];
  categoryIds: string[];
  productIds: string[];
  variantIds: string[];
  orderIds: string[];
  contentIds: string[];
  activityIds: string[];
  customerIds: string[];
  storeCustomerIds: string[];
  walletAccountIds: string[];
  walletEntryIds: string[];
  leadIds: string[];
  invoiceIds: string[];
};

export type MasterScenarioSummary = {
  active: boolean;
  createdAt?: string;
  level?: ScenarioLevel;
  scope?: ScenarioScope;
  suppliers: number;
  stores: number;
  superdropStores: number;
  commerceStores: number;
  users: number;
  products: number;
  orders: number;
  content: number;
  leads: number;
};

const STORE_NAMES = [
  "Manto Urbano", "Casa Nexo", "Viva Fit", "Arena Street", "Clube 21", "Orbe Store",
  "Norte Supply", "Distrito 9", "Move Lab", "Linha Base", "Ponto Alto", "Ativa Shop",
] as const;

const COMMERCE_NAMES = [
  "Fio & Forma", "Casa Aurora", "Ateliê Noma", "Studio Norte", "Lume Home", "Essenza",
  "Onda Urbana", "Ponto Casa", "Mínima", "Vértice", "Alma Fit", "Cubo Kids",
] as const;

const OWNER_NAMES = [
  "Marina Costa", "Carlos Nogueira", "Juliana Mendes", "Rafael Lima", "Bianca Alves", "Gustavo Rocha",
  "Fernanda Reis", "Leandro Melo", "Natália Souza", "Pedro Martins", "Renata Dias", "Vinícius Prado",
] as const;

const PRODUCT_DEFS = [
  { name: "Camiseta Performance", category: "Moda", cost: 5200, price: 12990, art: "#111827,#f97316,#f8fafc" },
  { name: "Jaqueta Urban Tech", category: "Moda", cost: 8900, price: 21990, art: "#18181b,#52525b,#f8fafc" },
  { name: "Mochila Compact Pro", category: "Acessórios", cost: 4800, price: 11990, art: "#1e293b,#2563eb,#e2e8f0" },
  { name: "Garrafa Térmica One", category: "Acessórios", cost: 3600, price: 8990, art: "#0f172a,#0891b2,#f8fafc" },
  { name: "Kit Organizador Flex", category: "Casa", cost: 4200, price: 9990, art: "#292524,#d59a16,#fafaf9" },
  { name: "Luminária Desk Mini", category: "Casa", cost: 6100, price: 14990, art: "#111827,#a855f7,#f8fafc" },
  { name: "Fone Pulse Air", category: "Tecnologia", cost: 7400, price: 17990, art: "#09090b,#d73737,#fafafa" },
  { name: "Suporte Magnético Drive", category: "Tecnologia", cost: 3100, price: 7990, art: "#0f172a,#64748b,#f8fafc" },
  { name: "Moletom Essential", category: "Moda", cost: 6900, price: 16990, art: "#1c1917,#78716c,#fafaf9" },
  { name: "Bolsa Daily Mini", category: "Acessórios", cost: 5700, price: 13990, art: "#27272a,#db2777,#fafafa" },
  { name: "Difusor Casa 01", category: "Casa", cost: 3900, price: 9490, art: "#292524,#a16207,#fefce8" },
  { name: "Carregador Duo 30W", category: "Tecnologia", cost: 6500, price: 15990, art: "#0f172a,#0284c7,#f8fafc" },
] as const;

const CUSTOMERS = [
  "Amanda Ribeiro", "Bruno Martins", "Camila Ferreira", "Diego Almeida", "Elisa Rocha", "Felipe Souza",
  "Gabriela Lima", "Henrique Moraes", "Isabela Costa", "João Vitor", "Karina Alves", "Lucas Prado",
  "Mariana Lopes", "Nicolas Ramos", "Olívia Duarte", "Paulo César", "Queila Nunes", "Rodrigo Freitas",
] as const;

const STATUSES = [
  "PENDING", "AWAITING_CENTRAL_PAYMENT", "AWAITING_LABEL", "READY_TO_PICK",
  "PICKING", "READY_TO_SHIP", "SHIPPED", "DELIVERED",
] as const;

type Tx = Database;
type ProductRef = { productId: string; variantId: string; price: number; cost: number; name: string };

function emptySummary(): MasterScenarioSummary {
  return { active: false, suppliers: 0, stores: 0, superdropStores: 0, commerceStores: 0, users: 0, products: 0, orders: 0, content: 0, leads: 0 };
}

function scenarioSummary(state: MasterScenarioState | null): MasterScenarioSummary {
  if (!state) return emptySummary();
  return {
    active: true,
    createdAt: state.createdAt,
    level: state.level,
    scope: state.scope,
    suppliers: state.supplierIds.length,
    stores: state.storeIds.length,
    superdropStores: state.superdropStoreIds.length,
    commerceStores: state.commerceStoreIds.length,
    users: state.userIds.length,
    products: state.productIds.length,
    orders: state.orderIds.length,
    content: state.contentIds.length,
    leads: state.leadIds.length,
  };
}

function newState(level: ScenarioLevel, scope: ScenarioScope): MasterScenarioState {
  return {
    version: 2,
    active: true,
    level,
    scope,
    createdAt: new Date().toISOString(),
    supplierIds: [], networkIds: [], organizationIds: [], storeIds: [], superdropStoreIds: [], commerceStoreIds: [],
    userIds: [], categoryIds: [], productIds: [], variantIds: [], orderIds: [], contentIds: [], activityIds: [],
    customerIds: [], storeCustomerIds: [], walletAccountIds: [], walletEntryIds: [], leadIds: [], invoiceIds: [],
  };
}

async function readState(db: Database): Promise<MasterScenarioState | null> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, SCENARIO_KEY) });
  if (!row || !row.value || typeof row.value !== "object") return null;
  const value = row.value as Partial<MasterScenarioState>;
  return value.version === 2 && value.active === true ? value as MasterScenarioState : null;
}

export async function getMasterScenarioSummary(db: Database): Promise<MasterScenarioSummary> {
  return scenarioSummary(await readState(db));
}

function slug(input: string) {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function createSupplierCore(tx: Tx, state: MasterScenarioState, input: { name: string; key: string; hidden?: boolean; brand: "SUPERDROP" | "NEXTLEVEL_COMMERCE" }) {
  const orgId = newId("scn_org");
  const supplierId = newId("scn_sup");
  const networkId = newId("scn_net");
  state.organizationIds.push(orgId);
  state.supplierIds.push(supplierId);
  state.networkIds.push(networkId);
  await tx.insert(organizations).values({ id: orgId, name: input.name, slug: `cenario-${input.key}-central`, type: "SUPPLIER", brand: input.brand });
  await tx.insert(suppliers).values({
    id: supplierId,
    organizationId: orgId,
    name: input.name,
    slug: `cenario-${input.key}-central`,
    hidden: input.hidden ?? false,
    businessModel: input.hidden ? "WHITE_LABEL" : "SUPERDROP",
    platformFeePercent: input.hidden ? 0 : 6,
    setupFeeCents: 0,
    city: "São Paulo",
    state: "SP",
    shippingStatus: "DEMO",
  });
  await tx.insert(networks).values({ id: networkId, supplierId, name: `Rede ${input.name}`, slug: `cenario-${input.key}-rede` });
  return { orgId, supplierId, networkId };
}

async function createStoreCore(tx: Tx, state: MasterScenarioState, input: {
  name: string;
  key: string;
  owner: string;
  networkId: string;
  brand: "SUPERDROP" | "NEXTLEVEL_COMMERCE";
  kind?: "MEMBER" | "SUPPLIER_OWN";
  index: number;
}) {
  const orgId = newId("scn_org");
  const storeId = newId("scn_sto");
  const userId = newId("scn_usr");
  const paidUntil = new Date(Date.now() + 45 * 86_400_000).toISOString();
  const trialEndsAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
  state.organizationIds.push(orgId);
  state.storeIds.push(storeId);
  state.userIds.push(userId);
  if (input.brand === "SUPERDROP") state.superdropStoreIds.push(storeId);
  else state.commerceStoreIds.push(storeId);

  await tx.insert(organizations).values({ id: orgId, name: input.name, slug: `cenario-${input.key}`, type: "MERCHANT", brand: input.brand });
  await tx.insert(stores).values({
    id: storeId,
    organizationId: orgId,
    networkId: input.networkId,
    name: input.name,
    slug: `cenario-${input.key}`,
    status: input.index % 9 === 8 ? "SUSPENDED" : input.index % 7 === 6 ? "PENDING_PAYMENT" : "ACTIVE",
    kind: input.kind ?? "MEMBER",
    offer: input.brand === "NEXTLEVEL_COMMERCE" ? "STORE_OWN" : input.index % 3 === 0 ? "STORE_OWN" : input.index % 3 === 1 ? "STORE_SUBDOMAIN" : "DROP_MANUAL",
    tagline: "Operação fictícia para visualização do NextLevel OS",
    logoText: input.name.split(" ")[0]!.slice(0, 3).toUpperCase(),
    paymentStatus: "DEMO",
    shippingStatus: "DEMO",
    publishedAt: input.index % 5 === 4 ? null : state.createdAt,
    paidUntil: input.index % 4 <= 1 ? paidUntil : null,
    trialEndsAt: input.index % 4 === 2 ? trialEndsAt : null,
  });
  await tx.insert(users).values({
    id: userId,
    name: `${input.owner} · CENÁRIO`,
    email: `cenario.${input.key}@nextlevel.invalid`,
    role: "STORE_OWNER",
    organizationId: orgId,
    storeId,
    passwordHash: null,
    mustChangePassword: false,
  });
  return storeId;
}

async function createCatalog(tx: Tx, state: MasterScenarioState, input: {
  supplierId: string;
  networkId: string;
  storeIds: string[];
  count: number;
  prefix: string;
}) {
  const categoryMap = new Map<string, string>();
  const refs: ProductRef[] = [];
  const categoriesUsed = [...new Set(PRODUCT_DEFS.map((p) => p.category))];

  for (const name of categoriesUsed) {
    const id = newId("scn_cat");
    state.categoryIds.push(id);
    categoryMap.set(name, id);
    await tx.insert(categories).values({ id, supplierId: input.supplierId, name, slug: `cenario-${input.prefix}-${slug(name)}` });
  }

  for (let i = 0; i < input.count; i++) {
    const base = PRODUCT_DEFS[i % PRODUCT_DEFS.length]!;
    const cycle = Math.floor(i / PRODUCT_DEFS.length) + 1;
    const suffix = cycle > 1 ? ` ${cycle}` : "";
    const productId = newId("scn_prd");
    const sku = `SCN-${input.prefix.toUpperCase()}-${String(i + 1).padStart(3, "0")}`;
    state.productIds.push(productId);
    await tx.insert(products).values({
      id: productId,
      supplierId: input.supplierId,
      networkId: input.networkId,
      categoryId: categoryMap.get(base.category),
      name: `${base.name}${suffix} · CENÁRIO`,
      slug: `cenario-${input.prefix}-${i + 1}`,
      description: "Produto fictício criado para visualizar catálogo, estoque, vendas e operação.",
      sku,
      images: [`art:${base.art}`],
      costCents: base.cost + cycle * 100,
      suggestedPriceCents: base.price + cycle * 200,
      minimumPriceCents: Math.round((base.price + cycle * 200) * 0.8),
      distribution: "ALL_NETWORK",
    });
    let mainVariant = "";
    for (const [position, size] of ["P", "M", "G", "GG"].entries()) {
      const variantId = newId("scn_var");
      state.variantIds.push(variantId);
      await tx.insert(productVariants).values({ id: variantId, productId, size, sku: `${sku}-${size}`, position });
      await tx.insert(inventory).values({ variantId, onHand: 16 + (i % 7) * 4 + position, reserved: position % 2 });
      if (size === "M") mainVariant = variantId;
    }
    for (const [storeIndex, storeId] of input.storeIds.entries()) {
      if ((i + storeIndex) % 6 !== 5) {
        await tx.insert(storeProducts).values({
          storeId,
          productId,
          priceCents: base.price + cycle * 200 + storeIndex * 250,
          packPriceCents: null,
          active: true,
          featured: i < 4,
        });
      }
    }
    refs.push({ productId, variantId: mainVariant, price: base.price + cycle * 200, cost: base.cost + cycle * 100, name: base.name + suffix });
  }
  return refs;
}

async function createOrders(tx: Tx, state: MasterScenarioState, input: {
  storeIds: string[];
  supplierForStore: Map<string, string>;
  productsForStore: Map<string, ProductRef[]>;
  count: number;
  prefix: string;
  superdrop: boolean;
}) {
  const customerByStore = new Map<string, { id: string; storeCustomerId: string; name: string; email: string }[]>();

  for (const [storeIndex, storeId] of input.storeIds.entries()) {
    const customersForStore = [];
    const perStore = Math.max(4, Math.ceil(input.count / input.storeIds.length / 2));
    for (let i = 0; i < perStore; i++) {
      const customerId = newId("scn_cus");
      const storeCustomerId = newId("scn_scu");
      const name = CUSTOMERS[(storeIndex * perStore + i) % CUSTOMERS.length]!;
      const email = `cliente.${input.prefix}.${storeIndex + 1}.${i + 1}@example.invalid`;
      state.customerIds.push(customerId);
      state.storeCustomerIds.push(storeCustomerId);
      await tx.insert(customers).values({ id: customerId, name, email, phone: `1198${String(100000 + storeIndex * 100 + i).slice(-6)}` });
      await tx.insert(storeCustomers).values({
        id: storeCustomerId,
        storeId,
        customerId,
        ordersCount: 0,
        totalSpentCents: 0,
        tags: i % 3 === 0 ? ["recorrente"] : i % 3 === 1 ? ["novo"] : ["vip"],
      });
      customersForStore.push({ id: customerId, storeCustomerId, name, email });
    }
    customerByStore.set(storeId, customersForStore);

    if (input.superdrop) {
      const walletId = newId("scn_wal");
      const entryId = newId("scn_wen");
      const balance = 35_000 + storeIndex * 12_500;
      state.walletAccountIds.push(walletId);
      state.walletEntryIds.push(entryId);
      await tx.insert(walletAccounts).values({ id: walletId, storeId, balanceCents: balance });
      await tx.insert(walletEntries).values({ id: entryId, storeId, type: "MANUAL_CREDIT", amountCents: balance, balanceAfterCents: balance, note: "Saldo fictício do cenário NextLevel OS" });
    }
  }

  const stats = new Map<string, { orders: number; total: number; last: string }>();
  for (let i = 0; i < input.count; i++) {
    const storeId = input.storeIds[i % input.storeIds.length]!;
    const refs = input.productsForStore.get(storeId)!;
    const item = refs[(i * 3 + Math.floor(i / input.storeIds.length)) % refs.length]!;
    const people = customerByStore.get(storeId)!;
    const customer = people[i % people.length]!;
    const orderId = newId("scn_ord");
    const status = STATUSES[i % STATUSES.length]!;
    const quantity = 1 + (i % 3 === 0 ? 1 : 0);
    const subtotal = item.price * quantity;
    const shipping = i % 4 === 0 ? 0 : 1490 + (i % 3) * 300;
    const created = new Date(Date.now() - i * Math.max(2, Math.floor(360 / Math.max(1, input.count))) * 60 * 60 * 1000).toISOString();
    state.orderIds.push(orderId);

    const centralPaid = input.superdrop ? !["PENDING", "AWAITING_CENTRAL_PAYMENT"].includes(status) : true;
    const labelReady = !["PENDING", "AWAITING_CENTRAL_PAYMENT", "AWAITING_LABEL"].includes(status);
    await tx.insert(orders).values({
      id: orderId,
      number: 9100 + Math.floor(i / input.storeIds.length),
      storeId,
      supplierId: input.supplierForStore.get(storeId)!,
      storeCustomerId: customer.storeCustomerId,
      channel: (["ONLINE_STORE", "WHATSAPP", "INSTAGRAM", "MANUAL"] as const)[i % 4]!,
      saleType: i % 7 === 0 ? "WHOLESALE" : "RETAIL",
      status: input.superdrop ? status : status === "AWAITING_CENTRAL_PAYMENT" ? "AWAITING_LABEL" : status,
      customerPaymentStatus: status === "PENDING" ? "PENDING" : "PAID",
      centralPaymentStatus: centralPaid ? "PAID" : "PENDING",
      centralPaidAt: centralPaid ? created : null,
      awaitingFundsSince: input.superdrop && status === "AWAITING_CENTRAL_PAYMENT" ? created : null,
      shippingLabelStatus: labelReady ? "READY" : "PENDING",
      paymentProvider: "DEMO",
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: "11 98888-0000",
      shippingAddress: `Rua Cenário, ${100 + i}`,
      shippingCity: ["São Paulo", "Campinas", "Santos", "Sorocaba", "Belo Horizonte", "Curitiba"][i % 6]!,
      shippingState: ["SP", "SP", "SP", "SP", "MG", "PR"][i % 6]!,
      shippingZip: "01001000",
      subtotalCents: subtotal,
      shippingCents: shipping,
      totalCents: subtotal + shipping,
      costTotalCents: item.cost * quantity,
      notes: "DADO FICTÍCIO · Cenário NextLevel OS",
      createdAt: created,
      updatedAt: created,
    });
    await tx.insert(orderItems).values({
      id: newId("scn_oit"),
      orderId,
      productId: item.productId,
      variantId: item.variantId,
      productName: `${item.name} · CENÁRIO`,
      label: "M",
      quantity,
      unitPriceCents: item.price,
      unitCostCents: item.cost,
      lineTotalCents: subtotal,
    });
    await tx.insert(orderEvents).values({
      id: newId("scn_evt"),
      orderId,
      type: "SCENARIO_CREATED",
      message: "Pedido fictício criado pelo gerador de cenários do NextLevel OS.",
      actorRole: "NEXTLEVEL_MASTER",
      createdAt: created,
    });
    const s = stats.get(customer.storeCustomerId) ?? { orders: 0, total: 0, last: created };
    s.orders += 1;
    s.total += subtotal + shipping;
    if (created > s.last) s.last = created;
    stats.set(customer.storeCustomerId, s);
  }

  for (const [id, s] of stats) {
    await tx.update(storeCustomers).set({ ordersCount: s.orders, totalSpentCents: s.total, lastOrderAt: s.last }).where(eq(storeCustomers.id, id));
  }
}

async function seedSuperDrop(tx: Tx, state: MasterScenarioState, profile: (typeof PROFILE)[ScenarioLevel]) {
  const core = await createSupplierCore(tx, state, { name: "Atlas Distribuição · CENÁRIO", key: "sd-atlas", brand: "SUPERDROP" });
  const adminUsers = [
    { name: "Renato Silva · CENÁRIO", email: "cenario.sd.fornecedor@nextlevel.invalid", role: "SUPPLIER_ADMIN" as const },
    { name: "Paula Freitas · CENÁRIO", email: "cenario.sd.expedicao@nextlevel.invalid", role: "SUPPLIER_DISPATCH" as const },
  ];
  for (const u of adminUsers) {
    const id = newId("scn_usr");
    state.userIds.push(id);
    await tx.insert(users).values({ id, ...u, organizationId: core.orgId, supplierId: core.supplierId, passwordHash: null, mustChangePassword: false });
  }

  const storeIds: string[] = [];
  for (let i = 0; i < profile.superdropStores; i++) {
    storeIds.push(await createStoreCore(tx, state, {
      name: `${STORE_NAMES[i % STORE_NAMES.length]} · CENÁRIO`,
      key: `sd-loja-${i + 1}`,
      owner: OWNER_NAMES[i % OWNER_NAMES.length]!,
      networkId: core.networkId,
      brand: "SUPERDROP",
      index: i,
    }));
  }

  const refs = await createCatalog(tx, state, { supplierId: core.supplierId, networkId: core.networkId, storeIds, count: profile.superdropProducts, prefix: "sd" });
  const supplierForStore = new Map(storeIds.map((id) => [id, core.supplierId]));
  const productsForStore = new Map(storeIds.map((id) => [id, refs]));
  await createOrders(tx, state, { storeIds, supplierForStore, productsForStore, count: profile.superdropOrders, prefix: "sd", superdrop: true });

  const contentSeed = [
    ["PRODUTOS", "Fotos de produto", "Pack para catálogo.", "JPG · 2000px", "#2563eb"],
    ["STORIES", "Stories lançamento", "Sequência para redes sociais.", "PNG · 1080x1920", "#a855f7"],
    ["BANNERS", "Banner campanha", "Material para vitrine.", "PNG · 1600x600", "#f97316"],
    ["REELS", "Reels de produto", "Vídeo curto para divulgação.", "MP4 · 15s", "#0891b2"],
    ["CAMPANHAS", "Campanha de ativação", "Kit comercial para a rede.", "ZIP", "#d59a16"],
  ] as const;
  const repeats = state.level === "LIGHT" ? 1 : state.level === "ACTIVE" ? 2 : 4;
  for (let r = 0; r < repeats; r++) for (const [category, title, description, format, accent] of contentSeed) {
    const id = newId("scn_cnt");
    state.contentIds.push(id);
    await tx.insert(contentItems).values({ id, supplierId: core.supplierId, category, title: `${title} ${r + 1} · CENÁRIO`, description, format, accent });
  }

  const messages = ["Fornecedor ativado", "Nova loja publicada", "Pedido pago", "Pedido liberado para separação", "Conteúdo publicado", "Loja requer atenção"];
  for (let i = 0; i < Math.min(12, profile.superdropOrders); i++) {
    const id = newId("scn_act");
    state.activityIds.push(id);
    await tx.insert(activities).values({
      id,
      scope: i % 3 === 0 ? "PLATFORM" : "SUPPLIER",
      supplierId: core.supplierId,
      storeId: storeIds[i % storeIds.length],
      type: ["SUPPLIER_CREATED", "STORE_CREATED", "ORDER_PAID", "ORDER_READY", "CONTENT_ADDED", "STORE_WARNING"][i % 6]!,
      message: `${messages[i % messages.length]} · CENÁRIO`,
      createdAt: new Date(Date.now() - i * 2 * 60 * 60 * 1000).toISOString(),
    });
  }
}

async function seedCommerce(tx: Tx, state: MasterScenarioState, profile: (typeof PROFILE)[ScenarioLevel]) {
  const storeIds: string[] = [];
  const supplierForStore = new Map<string, string>();
  const productsForStore = new Map<string, ProductRef[]>();

  for (let i = 0; i < profile.commerceStores; i++) {
    const name = `${COMMERCE_NAMES[i % COMMERCE_NAMES.length]} · CENÁRIO`;
    const core = await createSupplierCore(tx, state, { name: `Central oculta · ${name}`, key: `commerce-${i + 1}`, hidden: true, brand: "NEXTLEVEL_COMMERCE" });
    const storeId = await createStoreCore(tx, state, {
      name,
      key: `commerce-loja-${i + 1}`,
      owner: OWNER_NAMES[(i + 4) % OWNER_NAMES.length]!,
      networkId: core.networkId,
      brand: "NEXTLEVEL_COMMERCE",
      kind: "SUPPLIER_OWN",
      index: i,
    });
    storeIds.push(storeId);
    supplierForStore.set(storeId, core.supplierId);
    const refs = await createCatalog(tx, state, {
      supplierId: core.supplierId,
      networkId: core.networkId,
      storeIds: [storeId],
      count: profile.commerceProductsPerStore,
      prefix: `com-${i + 1}`,
    });
    productsForStore.set(storeId, refs);

    if (i % 4 <= 1) {
      const invoiceId = newId("scn_fin");
      state.invoiceIds.push(invoiceId);
      const paidAt = new Date(Date.now() - (i + 1) * 3 * 86_400_000).toISOString();
      await tx.insert(financeInvoices).values({
        id: invoiceId,
        dedupeKey: `SCENARIO:COMMERCE:${state.createdAt}:${i}`,
        payerType: "STORE",
        storeId,
        kind: "STORE_PLAN",
        period: state.createdAt.slice(0, 7),
        description: `Plano NextLevel Commerce · ${name}`,
        amountCents: i % 2 === 0 ? 14900 : 24900,
        status: "PAID",
        dueDate: paidAt,
        paidAt,
        createdAt: paidAt,
      });
    }
  }

  await createOrders(tx, state, { storeIds, supplierForStore, productsForStore, count: profile.commerceOrders, prefix: "commerce", superdrop: false });

  const segments = ["Moda", "Casa e decoração", "Acessórios", "Tecnologia", "Beleza", "Infantil"];
  for (let i = 0; i < profile.commerceLeads; i++) {
    const id = newId("scn_lead");
    state.leadIds.push(id);
    await tx.insert(brandLeads).values({
      id,
      brand: "NEXTLEVEL_COMMERCE",
      name: CUSTOMERS[i % CUSTOMERS.length]!,
      email: `interessado.cenario.${i + 1}@example.invalid`,
      phone: `1197${String(100000 + i).slice(-6)}`,
      storeName: `${COMMERCE_NAMES[i % COMMERCE_NAMES.length]} ${Math.floor(i / COMMERCE_NAMES.length) + 1}`,
      segment: segments[i % segments.length],
      message: "Lead fictício para visualizar o funil comercial.",
      status: (["NEW", "NEW", "CONTACTED", "WON", "LOST"] as const)[i % 5]!,
      notes: "DADO FICTÍCIO · Cenário NextLevel OS",
      createdAt: new Date(Date.now() - i * 7 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - i * 7 * 60 * 60 * 1000).toISOString(),
    });
  }
}

export async function activateMasterScenario(
  db: Database,
  updatedBy: string,
  options: { level?: ScenarioLevel; scope?: ScenarioScope } = {},
): Promise<MasterScenarioSummary> {
  const level = options.level ?? "ACTIVE";
  const scope = options.scope ?? "ALL";
  const existing = await readState(db);
  if (existing?.level === level && existing.scope === scope) return scenarioSummary(existing);
  if (existing) await clearMasterScenario(db);

  const state = newState(level, scope);
  const profile = PROFILE[level];

  await db.transaction(async (tx) => {
    if (scope === "ALL" || scope === "SUPERDROP") await seedSuperDrop(tx, state, profile);
    if (scope === "ALL" || scope === "COMMERCE") await seedCommerce(tx, state, profile);
    await tx.insert(platformSettings).values({ key: SCENARIO_KEY, value: state, updatedBy, updatedAt: new Date().toISOString() });
  });
  return scenarioSummary(state);
}

/**
 * Remove somente os IDs gravados no manifesto do cenário. Não existe truncate/reset global.
 * A ordem abaixo respeita as FKs de todos os módulos preenchidos pelo gerador.
 */
export async function clearMasterScenario(db: Database): Promise<MasterScenarioSummary> {
  const state = await readState(db);
  if (!state) return emptySummary();

  await db.transaction(async (tx) => {
    if (state.walletEntryIds.length) await tx.delete(walletEntries).where(inArray(walletEntries.id, state.walletEntryIds));
    if (state.walletAccountIds.length) await tx.delete(walletAccounts).where(inArray(walletAccounts.id, state.walletAccountIds));
    if (state.orderIds.length) {
      await tx.delete(orderEvents).where(inArray(orderEvents.orderId, state.orderIds));
      await tx.delete(orderItems).where(inArray(orderItems.orderId, state.orderIds));
      await tx.delete(orders).where(inArray(orders.id, state.orderIds));
    }
    if (state.storeCustomerIds.length) await tx.delete(storeCustomers).where(inArray(storeCustomers.id, state.storeCustomerIds));
    if (state.customerIds.length) await tx.delete(customers).where(inArray(customers.id, state.customerIds));
    if (state.invoiceIds.length) await tx.delete(financeInvoices).where(inArray(financeInvoices.id, state.invoiceIds));
    if (state.leadIds.length) await tx.delete(brandLeads).where(inArray(brandLeads.id, state.leadIds));
    if (state.activityIds.length) await tx.delete(activities).where(inArray(activities.id, state.activityIds));
    if (state.contentIds.length) await tx.delete(contentItems).where(inArray(contentItems.id, state.contentIds));
    if (state.storeIds.length) await tx.delete(storeProducts).where(inArray(storeProducts.storeId, state.storeIds));
    if (state.variantIds.length) await tx.delete(inventory).where(inArray(inventory.variantId, state.variantIds));
    if (state.variantIds.length) await tx.delete(productVariants).where(inArray(productVariants.id, state.variantIds));
    if (state.productIds.length) await tx.delete(products).where(inArray(products.id, state.productIds));
    if (state.categoryIds.length) await tx.delete(categories).where(inArray(categories.id, state.categoryIds));
    if (state.userIds.length) await tx.delete(users).where(inArray(users.id, state.userIds));
    if (state.storeIds.length) await tx.delete(stores).where(inArray(stores.id, state.storeIds));
    if (state.networkIds.length) await tx.delete(networks).where(inArray(networks.id, state.networkIds));
    if (state.supplierIds.length) await tx.delete(suppliers).where(inArray(suppliers.id, state.supplierIds));
    if (state.organizationIds.length) await tx.delete(organizations).where(inArray(organizations.id, state.organizationIds));
    await tx.delete(platformSettings).where(eq(platformSettings.key, SCENARIO_KEY));
  });
  return emptySummary();
}
