import type { Database } from "./client";
import { eq } from "drizzle-orm";
import * as s from "./schema";
import { newId, slugify } from "@/lib/ids";
import { receiveStock } from "@/lib/domain/inventory";
import { createOrder, advanceOrder, cancelOrder } from "@/lib/domain/orders";
import type { Actor } from "@/lib/domain/access";
import { addLabelFile } from "@/lib/domain/labels";
import { makeDemoLabelPdf } from "@/lib/labels-demo";
import { getBalanceCents, manualCredit, manualDebit } from "@/lib/domain/wallet";
import { hashPassword } from "@/lib/security/password";
import { DEMO_PASSWORD } from "./seed-constants";
import { seedReferenceData } from "./base-data";
import { ensureContract, issueSubscriptionInvoices, periodOf } from "@/lib/domain/finance";

export const DEMO = {
  masterEmail: "master@nextlevel.demo",
  supplierEmail: "central@centralsports.demo",
  dispatchEmail: "expedicao@centralsports.demo",
  mantosEmail: "dono@mantosshop.demo",
  arenaEmail: "dono@arena10.demo",
  classicsEmail: "dono@futclassics.demo",
  // Vitrine de demonstração (Mega Tron e um membro da rede dela)
  megatronEmail: "megatron@superdrop.demo",
  megatronDispatchEmail: "expedicao@megatron.demo",
  mrsEmail: "loja@mrssports.demo",
};

const SIZES = ["P", "M", "G", "GG"] as const;
const PACK_12 = { P: 2, M: 4, G: 4, GG: 2 } as const;

type ProductSeed = {
  name: string; category: string; sku: string; art: string; cost: number; suggested: number; minimum: number; pack?: boolean;
  distribution?: "ALL_NETWORK" | "SELECTED_STORES"; stock: number; description: string;
};

const PRODUCTS: ProductSeed[] = [
  { name: "Manto Tricolor Paulista 2025", category: "Times Brasileiros", sku: "CS-TRI-25", art: "#dc2626,#ffffff,#111827", cost: 5900, suggested: 14990, minimum: 11990, pack: true, stock: 48, description: "Camisa de torcedor com tecido dry-fit leve, escudo bordado e listras clássicas." },
  { name: "Manto Alvinegro Carioca Home", category: "Times Brasileiros", sku: "CS-ALV-25", art: "#111827,#ffffff,#9ca3af", cost: 5900, suggested: 14990, minimum: 11990, pack: true, stock: 40, description: "Modelo torcedor com corte moderno e gola redonda." },
  { name: "Manto Rubro-Negro 2025", category: "Times Brasileiros", sku: "CS-RUB-25", art: "#b91c1c,#111827,#f59e0b", cost: 6200, suggested: 15990, minimum: 12990, pack: true, stock: 60, description: "Listras horizontais, tecnologia de respiração e escudo em alto relevo." },
  { name: "Manto Colorado Gaúcho", category: "Times Brasileiros", sku: "CS-COL-25", art: "#dc2626,#fef2f2,#7f1d1d", cost: 5900, suggested: 14990, minimum: 11990, stock: 30, description: "Camisa vermelha clássica com detalhes brancos." },
  { name: "Seleção Brasileira Amarela Retrô 70", category: "Seleções", sku: "CS-BRA-70", art: "#facc15,#166534,#1d4ed8", cost: 6900, suggested: 17990, minimum: 14990, pack: true, stock: 52, description: "Edição retrô inspirada no tri: amarelo canarinho, gola verde e numeração clássica." },
  { name: "Seleção Argentina Albiceleste", category: "Seleções", sku: "CS-ARG-25", art: "#7dd3fc,#ffffff,#0ea5e9", cost: 6500, suggested: 16990, minimum: 13990, stock: 24, description: "Listras verticais celestes e brancas, tecido premium." },
  { name: "Seleção Francesa Away", category: "Seleções", sku: "CS-FRA-25", art: "#ffffff,#1e3a8a,#dc2626", cost: 6500, suggested: 16990, minimum: 13990, stock: 18, description: "Modelo branco com detalhes tricolores." },
  { name: "Manto Merengue Branco", category: "Europeus", sku: "CS-MER-25", art: "#ffffff,#facc15,#111827", cost: 6900, suggested: 17990, minimum: 14990, stock: 36, description: "Branco absoluto com detalhes dourados." },
  { name: "Manto Blaugrana Listrado", category: "Europeus", sku: "CS-BLA-25", art: "#1e3a8a,#b91c1c,#facc15", cost: 6900, suggested: 17990, minimum: 14990, distribution: "SELECTED_STORES", stock: 28, description: "Listras verticais azul e grená. Distribuição exclusiva para lojas selecionadas." },
  { name: "Manto Red Devils Home", category: "Europeus", sku: "CS-RED-25", art: "#b91c1c,#111827,#ffffff", cost: 6900, suggested: 17990, minimum: 14990, stock: 22, description: "Vermelho intenso com gola preta." },
  { name: "Camisa Retrô Preta e Branca 1994", category: "Retrô", sku: "CS-RET-94", art: "#111827,#f5f5f4,#71717a", cost: 5500, suggested: 13990, minimum: 10990, distribution: "SELECTED_STORES", stock: 16, description: "Reedição do modelo comemorativo de 1994." },
  { name: "Camisa de Treino Pro Dry", category: "Treino", sku: "CS-TRN-01", art: "#0f172a,#22c55e,#e2e8f0", cost: 3900, suggested: 9990, minimum: 7990, stock: 70, description: "Camisa de treino leve, ideal para kits de atacado." },
];

function iso(daysAgo: number, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export async function seedDatabase(db: Database) {
  // --- Tenancy ---------------------------------------------------------------
  const nlOrg = { id: newId("org"), name: "NextLevel Marketing Ltda.", slug: "nextlevel", type: "NEXTLEVEL" as const };
  const supOrg = { id: newId("org"), name: "Central Sports", slug: "central-sports", type: "SUPPLIER" as const };
  const storeOrgs = [
    { id: newId("org"), name: "Mantos Shop", slug: "mantos-shop", type: "MERCHANT" as const },
    { id: newId("org"), name: "Arena 10", slug: "arena-10", type: "MERCHANT" as const },
    { id: newId("org"), name: "Fut Classics", slug: "fut-classics", type: "MERCHANT" as const },
  ];
  await db.insert(s.organizations).values([nlOrg, supOrg, ...storeOrgs]);

  const supplierId = newId("sup");
  await db.insert(s.suppliers).values({ id: supplierId, organizationId: supOrg.id, name: "Central Sports", slug: "central-sports", businessModel: "SUPERDROP", platformFeePercent: 6, setupFeeCents: 0, city: "São Paulo", state: "SP" });
  const networkId = newId("net");
  await db.insert(s.networks).values({ id: networkId, supplierId, name: "Rede Central Sports", slug: "rede-central-sports" });

  const stores = [
    { id: newId("sto"), organizationId: storeOrgs[0]!.id, networkId, offer: "STORE_OWN" as const, name: "Mantos Shop", slug: "mantos-shop", tagline: "Os mantos que a torcida ama", logoText: "MS", primaryColor: "#0f172a", accentColor: "#16a34a", whatsapp: "5511999990001", instagram: "mantosshop", paymentStatus: "DEMO" as const, shippingStatus: "NOT_CONFIGURED" as const, domainStatus: "NOT_CONFIGURED" as const, publishedAt: iso(20), createdAt: iso(45) },
    { id: newId("sto"), organizationId: storeOrgs[1]!.id, networkId, offer: "STORE_SUBDOMAIN" as const, name: "Arena 10", slug: "arena-10", tagline: "Camisa de craque, preço de torcedor", logoText: "A10", primaryColor: "#1d4ed8", accentColor: "#f59e0b", whatsapp: "5511999990002", instagram: "arena10oficial", paymentStatus: "DEMO" as const, shippingStatus: "DEMO" as const, domainStatus: "PENDING" as const, publishedAt: iso(12), createdAt: iso(30) },
    { id: newId("sto"), organizationId: storeOrgs[2]!.id, networkId, offer: "DROP_MANUAL" as const, name: "Fut Classics", slug: "fut-classics", tagline: "Clássicos que nunca saem de moda", logoText: "FC", primaryColor: "#7c2d12", accentColor: "#ca8a04", whatsapp: "5511999990003", status: "SUSPENDED" as const, paymentStatus: "NOT_CONFIGURED" as const, shippingStatus: "NOT_CONFIGURED" as const, domainStatus: "NOT_CONFIGURED" as const, publishedAt: null, createdAt: iso(60) },
  ];
  await db.insert(s.stores).values(stores);
  const [mantos, arena, classics] = stores as [typeof stores[0], typeof stores[0], typeof stores[0]];

  const passwordHash = hashPassword(DEMO_PASSWORD);
  const users = [
    { id: newId("usr"), name: "Equipe NextLevel", email: DEMO.masterEmail, role: "NEXTLEVEL_MASTER" as const, organizationId: nlOrg.id, passwordHash },
    { id: newId("usr"), name: "Ricardo Menezes", email: DEMO.supplierEmail, role: "SUPPLIER_ADMIN" as const, organizationId: supOrg.id, supplierId, passwordHash },
    { id: newId("usr"), name: "Ana Paula Ribeiro", email: DEMO.mantosEmail, role: "STORE_OWNER" as const, organizationId: storeOrgs[0]!.id, storeId: mantos.id, passwordHash },
    { id: newId("usr"), name: "Bruno Tavares", email: DEMO.arenaEmail, role: "STORE_OWNER" as const, organizationId: storeOrgs[1]!.id, storeId: arena.id, passwordHash },
    { id: newId("usr"), name: "Carla Moura", email: DEMO.classicsEmail, role: "STORE_OWNER" as const, organizationId: storeOrgs[2]!.id, storeId: classics.id, passwordHash },
    { id: newId("usr"), name: "Marcos Souza", email: DEMO.dispatchEmail, role: "SUPPLIER_DISPATCH" as const, organizationId: supOrg.id, supplierId, passwordHash },
  ];
  await db.insert(s.users).values(users);

  // --- Catálogo ---------------------------------------------------------------
  const categoryNames = [...new Set(PRODUCTS.map((p) => p.category))];
  const categories = categoryNames.map((name) => ({ id: newId("cat"), supplierId, name, slug: slugify(name) }));
  await db.insert(s.categories).values(categories);
  const catByName = new Map(categories.map((c) => [c.name, c.id]));

  const productIds: string[] = [];
  const variantsByProduct = new Map<string, { id: string; size: string }[]>();
  const packByProduct = new Map<string, string>();

  for (const [i, p] of PRODUCTS.entries()) {
    const productId = newId("prd");
    productIds.push(productId);
    await db.insert(s.products).values({
      id: productId, supplierId, networkId, categoryId: catByName.get(p.category), name: p.name, slug: slugify(p.name), description: p.description, sku: p.sku,
      images: [`art:${p.art}`], costCents: p.cost, suggestedPriceCents: p.suggested, minimumPriceCents: p.minimum, distribution: p.distribution ?? "ALL_NETWORK", sellsUnit: true, sellsPack: !!p.pack, createdAt: iso(40 - i),
    });
    const variants = SIZES.map((size, position) => ({ id: newId("var"), productId, size, sku: `${p.sku}-${size}`, position }));
    await db.insert(s.productVariants).values(variants);
    variantsByProduct.set(productId, variants);
    const perSize = { P: Math.round(p.stock * 0.2), M: Math.round(p.stock * 0.3), G: Math.round(p.stock * 0.3), GG: Math.round(p.stock * 0.2) };
    for (const v of variants) await receiveStock(db, v.id, perSize[v.size as keyof typeof perSize], { referenceType: "SEED", note: "Entrada inicial de estoque" });
    if (p.pack) {
      const packId = newId("pck");
      await db.insert(s.productPacks).values({ id: packId, productId, name: "Grade 12 peças", totalQuantity: 12, costCents: p.cost * 12 - 3600, suggestedPriceCents: p.minimum * 12 - 12000, minimumPriceCents: (p.cost * 12 - 3600) + 12000 });
      await db.insert(s.productPackItems).values(variants.map((v) => ({ packId, variantId: v.id, quantity: PACK_12[v.size as keyof typeof PACK_12] })));
      packByProduct.set(productId, packId);
    }
    if (p.distribution === "SELECTED_STORES") {
      await db.insert(s.productStoreAccess).values([{ productId, storeId: mantos.id }]);
    }
  }

  // store_products: cada loja escolhe o que vende e o preço
  const storeProductRows: (typeof s.storeProducts.$inferInsert)[] = [];
  PRODUCTS.forEach((p, i) => {
    const productId = productIds[i]!;
    storeProductRows.push({ storeId: mantos.id, productId, priceCents: p.suggested, packPriceCents: p.pack ? p.minimum * 12 - 12000 : null, active: true, featured: i < 4 });
    if (i < 9) storeProductRows.push({ storeId: arena.id, productId, priceCents: p.suggested + 1000, packPriceCents: p.pack ? p.minimum * 12 - 10000 : null, active: i !== 6, featured: i < 3 });
    if (i < 8) storeProductRows.push({ storeId: classics.id, productId, priceCents: p.suggested - 500, packPriceCents: null, active: true, featured: false });
  });
  await db.insert(s.storeProducts).values(storeProductRows);

  // --- Temas, planos e serviços (dados de referência) ---------------------------
  const { themeRows, versions, plans, services } = await seedReferenceData(db);
  const starter = themeRows.find((t) => t.key === "starter")!;
  const starterVersion = versions.find((v) => v.themeId === starter.id)!;
  await db.insert(s.storeThemes).values(stores.map((st) => ({ storeId: st.id, themeId: starter.id, themeVersionId: starterVersion.id })));
  await db.insert(s.themeSettings).values([
    { storeId: mantos.id, settings: { heroTitle: "Vista o manto do seu time", heroSubtitle: "Camisas oficiais de torcedor com envio rápido para todo o Brasil.", heroCta: "Ver catálogo", announcement: "Frete grátis acima de R$ 299 · Parcele em até 6x", banners: [{ title: "Lançamentos 2025", subtitle: "Os mantos da nova temporada", tone: "primary" }, { title: "Grade de 12 peças", subtitle: "Para revenda e times amadores", tone: "accent" }], showCategories: true, footerText: "Mantos Shop · Loja parceira Central Sports" } },
    { storeId: arena.id, settings: { heroTitle: "Camisa de craque, preço de torcedor", heroSubtitle: "Seleções e clubes com desconto para times e escolinhas.", heroCta: "Comprar agora", announcement: "Atacado: consulte nossa grade de 12 peças", banners: [{ title: "Seleções", subtitle: "Brasil, Argentina e França", tone: "primary" }], showCategories: true, footerText: "Arena 10 · Loja parceira Central Sports" } },
    { storeId: classics.id, settings: { heroTitle: "Clássicos que nunca saem de moda", heroSubtitle: "Camisas retrô e edições comemorativas.", heroCta: "Explorar", announcement: "", banners: [], showCategories: false, footerText: "Fut Classics" } },
  ]);

  const subs = [
    { id: newId("sub"), storeId: mantos.id, planId: plans[2]!.id, status: "ACTIVE" as const, currentPeriodEnd: iso(-18) },
    { id: newId("sub"), storeId: arena.id, planId: plans[1]!.id, status: "ACTIVE" as const, currentPeriodEnd: iso(-6) },
    { id: newId("sub"), storeId: classics.id, planId: plans[0]!.id, status: "SUSPENDED" as const, currentPeriodEnd: iso(22) },
  ];
  await db.insert(s.subscriptions).values(subs);
  await db.insert(s.invoices).values([
    { id: newId("inv"), subscriptionId: subs[0]!.id, amountCents: 19700, dueDate: iso(12), status: "PAID", paidAt: iso(13) },
    { id: newId("inv"), subscriptionId: subs[0]!.id, amountCents: 19700, dueDate: iso(-18), status: "OPEN" },
    { id: newId("inv"), subscriptionId: subs[1]!.id, amountCents: 9700, dueDate: iso(24), status: "PAID", paidAt: iso(25) },
    { id: newId("inv"), subscriptionId: subs[1]!.id, amountCents: 9700, dueDate: iso(-6), status: "OPEN" },
    { id: newId("inv"), subscriptionId: subs[2]!.id, amountCents: 4900, dueDate: iso(22), status: "OVERDUE" },
  ]);

  await db.insert(s.serviceLeads).values([
    { id: newId("lead"), storeId: arena.id, serviceId: services[4]!.id, status: "CONTACTED", createdAt: iso(3) },
    { id: newId("lead"), storeId: mantos.id, serviceId: services[2]!.id, status: "NEW", createdAt: iso(1) },
  ]);

  // --- Conteúdo ---------------------------------------------------------------
  const contentSeed: { category: "PRODUTOS" | "STORIES" | "BANNERS" | "REELS" | "CAMPANHAS"; title: string; description: string; format: string; accent: string }[] = [
    { category: "PRODUTOS", title: "Fotos Manto Tricolor 2025", description: "12 fotos em fundo neutro, frente/verso/detalhes.", format: "JPG · 2000px", accent: "#dc2626" },
    { category: "PRODUTOS", title: "Fotos Seleção Retrô 70", description: "Ensaio com modelo, 8 fotos.", format: "JPG · 2000px", accent: "#facc15" },
    { category: "STORIES", title: "Stories Lançamento 2025", description: "5 telas animadas para Instagram.", format: "MP4 · 1080x1920", accent: "#1d4ed8" },
    { category: "STORIES", title: "Stories Frete Grátis", description: "3 telas com CTA para WhatsApp.", format: "PNG · 1080x1920", accent: "#16a34a" },
    { category: "BANNERS", title: "Banner Home — Nova Temporada", description: "Desktop e mobile prontos para o tema Starter.", format: "PNG · 1600x600", accent: "#0f172a" },
    { category: "BANNERS", title: "Banner Grade 12 Peças", description: "Comunicação para atacado.", format: "PNG · 1600x600", accent: "#f59e0b" },
    { category: "REELS", title: "Reels Unboxing Manto", description: "Vídeo curto de 15s com música licenciada.", format: "MP4 · 15s", accent: "#7c3aed" },
    { category: "REELS", title: "Reels Detalhes do Tecido", description: "Close-ups em câmera lenta.", format: "MP4 · 12s", accent: "#0ea5e9" },
    { category: "CAMPANHAS", title: "Campanha Dia dos Pais", description: "Kit completo: banner, stories, texto para WhatsApp.", format: "ZIP", accent: "#b91c1c" },
    { category: "CAMPANHAS", title: "Campanha Black Friday", description: "Contagem regressiva + selos de oferta.", format: "ZIP", accent: "#111827" },
  ];
  await db.insert(s.contentItems).values(contentSeed.map((c) => ({ id: newId("cnt"), supplierId, ...c })));

  // --- Pedidos (via domínio, para manter estoque coerente) -------------------
  const mantosActor: Actor = { userId: users[2]!.id, role: "STORE_OWNER", organizationId: storeOrgs[0]!.id, supplierId: null, storeId: mantos.id };
  const arenaActor: Actor = { userId: users[3]!.id, role: "STORE_OWNER", organizationId: storeOrgs[1]!.id, supplierId: null, storeId: arena.id };
  const supplierActor: Actor = { userId: users[1]!.id, role: "SUPPLIER_ADMIN", organizationId: supOrg.id, supplierId, storeId: null };

  const v = (i: number, size: string) => variantsByProduct.get(productIds[i]!)!.find((x) => x.size === size)!.id;
  const customersList = [
    { name: "João Pedro Alves", email: "joao.alves@exemplo.com", phone: "11 98888-1001" },
    { name: "Mariana Costa", email: "mariana.costa@exemplo.com", phone: "11 98888-1002" },
    { name: "Lucas Ferreira", email: "lucas.ferreira@exemplo.com", phone: "21 98888-1003" },
    { name: "Fernanda Lima", email: "fernanda.lima@exemplo.com", phone: "31 98888-1004" },
    { name: "Rafael Souza", email: "rafael.souza@exemplo.com", phone: "41 98888-1005" },
    { name: "Escolinha Gol de Placa", email: "contato@goldeplaca.exemplo.com", phone: "11 97777-2001" },
    { name: "Thiago Martins", email: "thiago.martins@exemplo.com", phone: "51 98888-1006" },
    { name: "Beatriz Rocha", email: "beatriz.rocha@exemplo.com", phone: "11 98888-1007" },
  ];
  const c = (i: number) => ({ ...customersList[i]!, marketingOptIn: i % 2 === 0 });
  const addr = { address: "Rua das Palmeiras, 120", city: "São Paulo", state: "SP", zip: "01310-100", costCents: 2490 };

  type Step = "central" | "label" | "PICKING" | "READY_TO_SHIP" | "SHIPPED" | "DELIVERED" | "cancel";
  const run = async (actor: Actor, input: Parameters<typeof createOrder>[1], steps: Step[], daysAgo: number) => {
    const r = await createOrder(db, input);
    for (const st of steps) {
      if (st === "central") { /* custo debitado automaticamente do saldo da carteira */ }
      else if (st === "label") await addLabelFile(db, actor, r.orderId, { filename: `etiqueta-${r.number}.pdf`, bytes: await makeDemoLabelPdf(r.number, input.customer.name) });
      else if (st === "cancel") await cancelOrder(db, actor, r.orderId);
      else await advanceOrder(db, supplierActor, r.orderId, st);
    }
    await db.update(s.orders).set({ createdAt: iso(daysAgo, 9 + (daysAgo % 8)) }).where(eq(s.orders.id, r.orderId));
    return r;
  };

  // Carteiras: Mantos e Arena com saldo (custo debitado na criação do pedido pago); Fut Classics sem saldo.
  await manualCredit(db, supplierActor, mantos.id, { amountCents: 3_000_000, note: "Saldo inicial de demonstração" });
  await manualCredit(db, supplierActor, arena.id, { amountCents: 3_000_000, note: "Saldo inicial de demonstração" });
  const full: Step[] = ["central", "label", "PICKING", "READY_TO_SHIP", "SHIPPED", "DELIVERED"];
  // Mantos Shop
  await run(mantosActor, { storeId: mantos.id, customer: c(0), shipping: addr, items: [{ productId: productIds[0]!, variantId: v(0, "M"), quantity: 1 }, { productId: productIds[4]!, variantId: v(4, "G"), quantity: 1 }], customerPaymentStatus: "PAID" }, full, 14);
  await run(mantosActor, { storeId: mantos.id, customer: c(1), shipping: addr, items: [{ productId: productIds[2]!, variantId: v(2, "P"), quantity: 2 }], customerPaymentStatus: "PAID" }, ["central", "label", "PICKING", "READY_TO_SHIP", "SHIPPED"], 6);
  await run(mantosActor, { storeId: mantos.id, customer: c(5), channel: "WHATSAPP", saleType: "WHOLESALE", shipping: addr, items: [{ productId: productIds[0]!, packId: packByProduct.get(productIds[0]!)!, quantity: 1 }], customerPaymentStatus: "PAID" }, ["central", "label", "PICKING"], 4);
  await run(mantosActor, { storeId: mantos.id, customer: c(2), shipping: addr, items: [{ productId: productIds[7]!, variantId: v(7, "G"), quantity: 1 }], customerPaymentStatus: "PAID" }, ["central", "label"], 3);
  await run(mantosActor, { storeId: mantos.id, customer: c(3), shipping: addr, items: [{ productId: productIds[8]!, variantId: v(8, "M"), quantity: 1 }, { productId: productIds[11]!, variantId: v(11, "GG"), quantity: 2 }], customerPaymentStatus: "PAID" }, ["central"], 2);
  await run(mantosActor, { storeId: mantos.id, customer: c(4), channel: "INSTAGRAM", shipping: addr, items: [{ productId: productIds[1]!, variantId: v(1, "M"), quantity: 1 }], customerPaymentStatus: "PAID" }, [], 1);
  await run(mantosActor, { storeId: mantos.id, customer: c(6), channel: "MANUAL", shipping: { costCents: 0 }, items: [{ productId: productIds[3]!, variantId: v(3, "G"), quantity: 1 }], customerPaymentStatus: "PENDING" }, [], 0);
  await run(mantosActor, { storeId: mantos.id, customer: c(7), shipping: addr, items: [{ productId: productIds[5]!, variantId: v(5, "M"), quantity: 1 }], customerPaymentStatus: "PAID" }, ["cancel"], 9);
  // Arena 10
  await run(arenaActor, { storeId: arena.id, customer: c(7), shipping: addr, items: [{ productId: productIds[4]!, variantId: v(4, "M"), quantity: 1 }], customerPaymentStatus: "PAID" }, full, 11);
  await run(arenaActor, { storeId: arena.id, customer: c(5), channel: "WHATSAPP", saleType: "WHOLESALE", shipping: addr, items: [{ productId: productIds[4]!, packId: packByProduct.get(productIds[4]!)!, quantity: 2 }], customerPaymentStatus: "PAID" }, ["central", "label", "PICKING", "READY_TO_SHIP"], 5);
  await run(arenaActor, { storeId: arena.id, customer: c(2), shipping: addr, items: [{ productId: productIds[5]!, variantId: v(5, "G"), quantity: 1 }], customerPaymentStatus: "PAID" }, ["central", "label"], 2);
  await run(arenaActor, { storeId: arena.id, customer: c(0), shipping: addr, items: [{ productId: productIds[1]!, variantId: v(1, "GG"), quantity: 1 }], customerPaymentStatus: "PAID" }, [], 1);
  await run(arenaActor, { storeId: arena.id, customer: c(3), channel: "WHATSAPP", shipping: addr, items: [{ productId: productIds[7]!, variantId: v(7, "P"), quantity: 1 }], customerPaymentStatus: "PAID" }, ["central"], 0);

  // Arena fica com saldo baixo para demonstrar "Aguardando recarga" no último pedido.
  const arenaBalance = await getBalanceCents(db, arena.id);
  await manualDebit(db, supplierActor, arena.id, { amountCents: arenaBalance - 500, note: "Ajuste de demonstração" });
  await run(arenaActor, { storeId: arena.id, customer: c(6), shipping: addr, items: [{ productId: productIds[2]!, variantId: v(2, "M"), quantity: 2 }], customerPaymentStatus: "PAID" }, [], 0);

  // --- Atividades da plataforma ----------------------------------------------
  await db.insert(s.activities).values([
    { id: newId("act"), scope: "PLATFORM", type: "STORE_CREATED", message: "Loja Arena 10 publicada na Rede Central Sports", createdAt: iso(12) },
    { id: newId("act"), scope: "PLATFORM", type: "STORE_SUSPENDED", message: "Fut Classics suspensa por inadimplência (15 dias)", createdAt: iso(7) },
    { id: newId("act"), scope: "PLATFORM", type: "SERVICE_LEAD", message: "Arena 10 demonstrou interesse em Tráfego Pago", createdAt: iso(3) },
    { id: newId("act"), scope: "PLATFORM", type: "SERVICE_LEAD", message: "Mantos Shop demonstrou interesse em Banners", createdAt: iso(1) },
    { id: newId("act"), scope: "PLATFORM", type: "SUPPLIER_CREATED", message: "Fornecedor Central Sports ativado (SuperDrop · 6%)", createdAt: iso(45) },
  ]);

  // --- Financeiro: contrato do fornecedor fundador (isento por 90 dias), mensalidade do mês e lojas adquiridas ---
  await ensureContract(db, supplierId, { tier: "GROWTH", waiveMonthly: true, waiveSetup: true });
  await issueSubscriptionInvoices(db, periodOf(new Date()));
  const acq = [
    { store: mantos, offer: "STORE_OWN" as const, setup: 200000, paidDaysAgo: 18 },
    { store: arena, offer: "STORE_SUBDOMAIN" as const, setup: 20000, paidDaysAgo: 9 },
  ];
  for (const a of acq) {
    const invId = newId("fin");
    await db.insert(s.financeInvoices).values({ id: invId, dedupeKey: `STORESETUP:${a.store.id}`, payerType: "STORE", supplierId, storeId: a.store.id, kind: "STORE_SETUP", description: `Ativação da loja ${a.store.name}`, amountCents: a.setup + (a.offer === "STORE_OWN" ? 19700 : 9700), lines: [{ kind: "STORE_SETUP", description: "Setup", amountCents: a.setup }, { kind: "STORE_FIRST_MONTH", description: "Primeira mensalidade", amountCents: a.offer === "STORE_OWN" ? 19700 : 9700 }], status: "PAID", dueDate: iso(a.paidDaysAgo + 3), paidAt: iso(a.paidDaysAgo) });
    await db.insert(s.storeAcquisitions).values({ id: newId("acq"), storeId: a.store.id, supplierId, offer: a.offer, setupCents: a.setup, commissionBps: 2500, commissionCents: Math.round(a.setup * 0.25), status: "GUARANTEE", invoiceId: invId, paidAt: iso(a.paidDaysAgo), eligibleAt: iso(a.paidDaysAgo - 7) });
  }

  return { supplierId, networkId, stores: { mantos, arena, classics }, users, productIds, variantsByProduct, packByProduct };
}
