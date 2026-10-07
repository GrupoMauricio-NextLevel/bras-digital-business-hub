import { and, eq } from "drizzle-orm";
import type { Database } from "./client";
import * as s from "./schema";
import { DEMO_PASSWORD } from "./seed-constants";
import { actorFromUser } from "@/lib/domain/access";
import { catalogOwner } from "@/lib/domain/independent";
import { markInvoicePaid } from "@/lib/domain/finance";
import { addOrderNote, advanceOrder, cancelOrder, confirmCustomerPayment, createOrder, registerShippingLabel } from "@/lib/domain/orders";
import { createProduct } from "@/lib/domain/products";
import { signupMember } from "@/lib/domain/store-access";
import { createDiscount, setDiscountActive } from "@/lib/domain/discounts";
import { setMinOrder, setPriceTiers } from "@/lib/domain/price-tiers";
import { createCampaign } from "@/lib/domain/campaigns";
import { acceptProposal, cancelProposal, createProposal, listProposals } from "@/lib/domain/proposals";
import { inviteStaff } from "@/lib/domain/store-team";
import { listReviewsForStore, moderateReview, submitReview } from "@/lib/domain/reviews";
import { subscribeStockAlert } from "@/lib/domain/stock-alerts";
import { updateStoreCustomerProfile } from "@/lib/domain/crm";
import { recordAudit } from "@/lib/domain/audit";
import { adjustStock } from "@/lib/domain/inventory";

/** Login da loja de teste com o máximo de dados. Senha: a da demonstração (DEMO_PASSWORD). */
export const COMMERCE_RICH_EMAIL = "completo@commerce.demo";

type Item = { name: string; sku: string; cat: string; price: number; photo: string; sizes: [string, number][]; status?: "DRAFT"; desc: string };
const SIZES_ROUPA = ["P", "M", "G", "GG"];
const mk = (stock: number[], sizes = SIZES_ROUPA): [string, number][] => sizes.map((sz, i) => [sz, stock[i % stock.length]!]);

/** Catálogo fictício: 5 categorias, 34 produtos, com estoque farto, baixo, zerado e rascunhos. */
const CATALOG: Item[] = [
  // Moda feminina
  { name: "Vestido midi linho areia", sku: "AU-F01", cat: "Moda feminina", price: 28990, photo: "moda-1", sizes: mk([60, 80, 70, 40]), desc: "Linho leve, caimento solto, bolsos laterais." },
  { name: "Blusa de seda lavanda", sku: "AU-F02", cat: "Moda feminina", price: 19990, photo: "moda-2", sizes: mk([50, 60, 40, 30]), desc: "Seda lavada com toque fosco." },
  { name: "Calça pantalona off-white", sku: "AU-F03", cat: "Moda feminina", price: 24990, photo: "moda-3", sizes: mk([4, 3, 2, 0]), desc: "Cintura alta, tecido fluido." },
  { name: "Saia plissada champagne", sku: "AU-F04", cat: "Moda feminina", price: 21990, photo: "moda-4", sizes: mk([70, 70, 60, 50]), desc: "Plissado permanente, forro leve." },
  { name: "Cardigan tricô cru", sku: "AU-F05", cat: "Moda feminina", price: 26990, photo: "moda-5", sizes: mk([40, 50, 30, 20]), desc: "Tricô macio, botões de madeira." },
  { name: "Macacão utilitário oliva", sku: "AU-F06", cat: "Moda feminina", price: 33990, photo: "moda-hero", sizes: mk([2, 1, 0, 0]), desc: "Sarja lavada, cinto removível." },
  { name: "Jaqueta jeans clara", sku: "AU-F07", cat: "Moda feminina", price: 31990, photo: "moda-1", sizes: mk([45, 55, 40, 30]), desc: "Jeans de algodão, lavagem clara." },
  { name: "Vestido longo estampado", sku: "AU-F08", cat: "Moda feminina", price: 36990, photo: "moda-2", sizes: mk([30, 30, 20, 10]), status: "DRAFT", desc: "Coleção nova, ainda em rascunho." },
  // Moda masculina
  { name: "Camisa social oxford azul", sku: "AU-M01", cat: "Moda masculina", price: 21990, photo: "moda-3", sizes: mk([80, 90, 70, 50]), desc: "Algodão oxford, corte regular." },
  { name: "Polo piquet verde-musgo", sku: "AU-M02", cat: "Moda masculina", price: 15990, photo: "moda-4", sizes: mk([100, 120, 90, 60]), desc: "Piquet de algodão, gola firme." },
  { name: "Bermuda sarja caramelo", sku: "AU-M03", cat: "Moda masculina", price: 17990, photo: "moda-5", sizes: mk([60, 60, 50, 40]), desc: "Sarja com elastano." },
  { name: "Jaqueta bomber grafite", sku: "AU-M04", cat: "Moda masculina", price: 38990, photo: "moda-hero", sizes: mk([3, 5, 2, 1]), desc: "Forro acolchoado, zíper metálico." },
  { name: "Calça chino areia", sku: "AU-M05", cat: "Moda masculina", price: 22990, photo: "moda-1", sizes: mk([70, 80, 60, 40]), desc: "Corte slim, tecido confortável." },
  { name: "Camiseta básica branca", sku: "AU-M06", cat: "Moda masculina", price: 6990, photo: "moda-2", sizes: mk([200, 220, 180, 120]), desc: "Algodão penteado, 180 g/m²." },
  { name: "Terno azul-marinho", sku: "AU-M07", cat: "Moda masculina", price: 79990, photo: "moda-3", sizes: mk([8, 10, 8, 4]), desc: "Lã fria, forro completo." },
  // Calçados
  { name: "Tênis couro branco", sku: "AU-C01", cat: "Calçados", price: 39990, photo: "ace-1", sizes: mk([20, 25, 30, 25, 15], ["37", "38", "39", "40", "41"]), desc: "Couro legítimo, solado de borracha." },
  { name: "Sandália rasteira nude", sku: "AU-C02", cat: "Calçados", price: 15990, photo: "ace-2", sizes: mk([30, 30, 25, 20], ["35", "36", "37", "38"]), desc: "Palmilha anatômica." },
  { name: "Bota chelsea caramelo", sku: "AU-C03", cat: "Calçados", price: 52990, photo: "ace-3", sizes: mk([2, 3, 1, 0], ["37", "38", "39", "40"]), desc: "Couro com elástico lateral." },
  { name: "Mocassim couro preto", sku: "AU-C04", cat: "Calçados", price: 34990, photo: "ace-4", sizes: mk([15, 20, 20, 15], ["39", "40", "41", "42"]), desc: "Forro em couro, sola flexível." },
  { name: "Sapatilha bico fino prata", sku: "AU-C05", cat: "Calçados", price: 18990, photo: "ace-5", sizes: mk([25, 30, 25, 20], ["35", "36", "37", "38"]), desc: "Brilho sutil, sola antiderrapante." },
  { name: "Chinelo slide grafite", sku: "AU-C06", cat: "Calçados", price: 8990, photo: "ace-6", sizes: mk([60, 70, 60], ["38", "40", "42"]), desc: "EVA macio, secagem rápida." },
  // Acessórios
  { name: "Bolsa tote couro caramelo", sku: "AU-A01", cat: "Acessórios", price: 45990, photo: "ace-hero", sizes: [["Único", 25]], desc: "Couro, divisória interna e zíper." },
  { name: "Cinto couro trançado", sku: "AU-A02", cat: "Acessórios", price: 12990, photo: "ace-1", sizes: mk([40, 40, 30], ["90", "100", "110"]), desc: "Fivela em metal envelhecido." },
  { name: "Óculos de sol retrô", sku: "AU-A03", cat: "Acessórios", price: 18990, photo: "ace-2", sizes: [["Único", 60]], desc: "Proteção UV400, estojo incluso." },
  { name: "Carteira slim couro", sku: "AU-A04", cat: "Acessórios", price: 14990, photo: "ace-3", sizes: [["Único", 0]], desc: "Esgotada: serve para testar o aviso de volta ao estoque." },
  { name: "Lenço de seda estampado", sku: "AU-A05", cat: "Acessórios", price: 9990, photo: "ace-4", sizes: [["Único", 80]], desc: "Seda pura, 70 x 70 cm." },
  { name: "Boné algodão cru", sku: "AU-A06", cat: "Acessórios", price: 7990, photo: "ace-5", sizes: [["Único", 120]], desc: "Aba curva, ajuste traseiro." },
  // Casa
  { name: "Manta de algodão trançada", sku: "AU-H01", cat: "Casa", price: 32990, photo: "casa-1", sizes: [["Único", 35]], desc: "Algodão orgânico, 1,5 x 2 m." },
  { name: "Jogo de cama percal 400 fios", sku: "AU-H02", cat: "Casa", price: 59990, photo: "casa-2", sizes: [["Casal", 22], ["Queen", 18], ["King", 10]], desc: "Percal egípcio, toque de hotel." },
  { name: "Vela aromática figo", sku: "AU-H03", cat: "Casa", price: 8990, photo: "casa-3", sizes: [["Único", 150]], desc: "Cera vegetal, 45 horas." },
  { name: "Cesto de palha com alça", sku: "AU-H04", cat: "Casa", price: 12990, photo: "casa-4", sizes: [["P", 40], ["G", 30]], desc: "Fibra natural, feito à mão." },
  { name: "Almofada linho cinza", sku: "AU-H05", cat: "Casa", price: 11990, photo: "casa-5", sizes: [["Único", 90]], desc: "Capa removível, enchimento antialérgico." },
  { name: "Tapete de juta redondo", sku: "AU-H06", cat: "Casa", price: 41990, photo: "casa-hero", sizes: [["120 cm", 12], ["160 cm", 6]], status: "DRAFT", desc: "Em rascunho: aguardando fotos finais." },
  { name: "Difusor de ambiente bambu", sku: "AU-H07", cat: "Casa", price: 14990, photo: "casa-1", sizes: [["Único", 4]], desc: "Estoque baixo de propósito." },
];

const FIRST = ["Marina", "Carlos", "Joana", "Rafael", "Bia", "Lucas", "Paula", "Diego", "Fernanda", "Thiago", "Camila", "Gustavo", "Larissa", "Rodrigo", "Patrícia", "Felipe", "Juliana", "André", "Mariana", "Bruno", "Aline", "Vinícius", "Renata", "Eduardo", "Tatiane", "Leandro", "Priscila", "Matheus", "Cláudia", "Henrique", "Isabela", "Ricardo", "Débora", "Fábio", "Natália", "Alexandre", "Vanessa", "Márcio", "Simone", "Otávio", "Letícia", "Murilo", "Carolina", "Sérgio", "Beatriz", "Caio", "Helena", "Davi", "Luana", "Samuel"];
const LAST = ["Souza", "Almeida", "Pires", "Mota", "Tavares", "Freitas", "Nunes", "Costa", "Oliveira", "Santos", "Lima", "Ribeiro", "Carvalho", "Ferreira", "Rocha", "Barbosa", "Araújo", "Cardoso", "Teixeira", "Moreira", "Castro", "Dias", "Monteiro", "Cavalcanti", "Fonseca"];
const CITIES: [string, string, string][] = [["São Paulo", "SP", "01310-100"], ["Rio de Janeiro", "RJ", "20040-020"], ["Belo Horizonte", "MG", "30130-000"], ["Curitiba", "PR", "80010-000"], ["Porto Alegre", "RS", "90010-000"], ["Recife", "PE", "50010-000"], ["Salvador", "BA", "40010-000"], ["Fortaleza", "CE", "60010-000"], ["Brasília", "DF", "70040-010"], ["Goiânia", "GO", "74003-010"], ["Florianópolis", "SC", "88010-000"], ["Campinas", "SP", "13010-000"]];
const CHANNELS = ["ONLINE_STORE", "ONLINE_STORE", "ONLINE_STORE", "ONLINE_STORE", "WHATSAPP", "INSTAGRAM", "MANUAL"] as const;
const CARRIERS = ["Correios PAC", "Correios SEDEX", "Jadlog", "Loggi"];

const daysAgo = (n: number, hour = 11) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(hour, (n * 7) % 60, 0, 0); return d.toISOString(); };
/** Gerador pseudoaleatório fixo: a mesma loja de teste sai igual a cada reinício. */
const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

/**
 * Loja de teste com o máximo de dados e movimento ("Casa Aurora"): 34 produtos em 5 categorias, ~50 clientes, ~170 pedidos em
 * 90 dias em todas as situações, cupons, campanhas, preços por quantidade, propostas, avaliações, avisos de estoque, equipe,
 * trilha de auditoria. Tudo fictício. Só roda na demonstração; idempotente. Login: completo@commerce.demo (senha de demonstração).
 */
export async function seedCommerceRichDemo(db: Database): Promise<boolean> {
  if (await db.query.users.findFirst({ where: eq(s.users.email, COMMERCE_RICH_EMAIL) })) return false;
  const rand = rng(20261004);
  const pick = <T,>(a: readonly T[]) => a[Math.floor(rand() * a.length)]!;
  const r = await signupMember(db, { storeName: "Casa Aurora", ownerName: "Helena Duarte", email: COMMERCE_RICH_EMAIL, password: DEMO_PASSWORD, taxId: "529.982.247-25", offer: "STORE_OWN", independent: true, brand: "NEXTLEVEL_COMMERCE" } as Parameters<typeof signupMember>[1]);
  for (const inv of await db.select().from(s.financeInvoices).where(eq(s.financeInvoices.storeId, r.storeId))) await markInvoicePaid(db, inv.id);
  const owner = actorFromUser((await db.query.users.findFirst({ where: eq(s.users.id, r.userId) }))!);
  const supplierId = await catalogOwner(db, owner);

  // ---- Dados públicos e regras da loja ----
  await db.update(s.stores).set({
    tagline: "Moda, casa e acessórios com curadoria", whatsapp: "5511987654321", instagram: "@casaaurora.oficial", legalName: "Aurora Comércio de Moda e Casa Ltda",
    cnpj: "12.345.678/0001-95", contactEmail: "contato@casaaurora.exemplo", address: "Rua das Palmeiras, 450, Pinheiros, São Paulo/SP",
    shippingConfig: { freeFromCents: 29900, flatCents: 2490, flatDays: 6, handlingDays: 1, markupCents: 0, pickupEnabled: true, pickupAddress: "Rua das Palmeiras, 450, Pinheiros, São Paulo/SP" },
    publishedAt: new Date().toISOString(),
  }).where(eq(s.stores.id, r.storeId));
  await setMinOrder(db, r.storeId, 5000);

  // ---- Catálogo ----
  const made: { productId: string; variants: { id: string; size: string }[]; price: number; draft: boolean; name: string }[] = [];
  for (const [i, p] of CATALOG.entries()) {
    const draft = p.status === "DRAFT";
    const { productId } = await createProduct(db, supplierId, {
      name: p.name, sku: p.sku, description: p.desc, categoryName: p.cat, images: [`/portal/commerce/${p.photo}.webp`], costCents: Math.round(p.price * 0.42), suggestedPriceCents: p.price,
      minimumPriceCents: Math.round(p.price * 0.55), status: draft ? "DRAFT" : "ACTIVE", sellsUnit: true, sellsPack: false, seoTitle: `${p.name} | Casa Aurora`, seoDescription: p.desc,
      weightG: 250 + (i % 7) * 120, lengthCm: 30, widthCm: 24, heightCm: 6,
      sizes: p.sizes.map(([size, initialStock]) => ({ size, initialStock, packQuantity: 0 })),
    });
    await db.insert(s.storeProducts).values({ storeId: r.storeId, productId, priceCents: p.price, packPriceCents: null, active: !draft, featured: i % 5 === 0 && !draft });
    const vs = await db.select().from(s.productVariants).where(eq(s.productVariants.productId, productId));
    made.push({ productId, variants: vs.map((v) => ({ id: v.id, size: v.size })), price: p.price, draft, name: p.name });
  }
  const sellable = made.filter((m) => !m.draft);
  // Preço por quantidade (atacado) em alguns produtos de giro alto.
  for (const m of sellable.filter((x, i) => i % 6 === 0)) await setPriceTiers(db, r.storeId, m.productId, [{ minQty: 6, priceCents: Math.round(m.price * 0.9) }, { minQty: 12, priceCents: Math.round(m.price * 0.82) }, { minQty: 24, priceCents: Math.round(m.price * 0.75) }]);

  // ---- Cupons: ativo, ilimitado, limitado quase no fim, com mínimo, expirado, futuro, pausado ----
  await createDiscount(db, r.storeId, { code: "BEMVINDO10", kind: "PERCENT", value: 10, maxRedemptions: 200 });
  await createDiscount(db, r.storeId, { code: "FRETE20", kind: "FIXED", value: 2000, minSubtotalCents: 15000 });
  await createDiscount(db, r.storeId, { code: "VIP15", kind: "PERCENT", value: 15, minSubtotalCents: 30000, maxRedemptions: 25 });
  await createDiscount(db, r.storeId, { code: "ULTIMAS5", kind: "PERCENT", value: 5, maxRedemptions: 8 });
  await createDiscount(db, r.storeId, { code: "VERAO24", kind: "PERCENT", value: 20, startsAt: daysAgo(120), expiresAt: daysAgo(60) });
  await createDiscount(db, r.storeId, { code: "BLACKWEEK", kind: "PERCENT", value: 25, minSubtotalCents: 20000, startsAt: new Date(Date.now() + 40 * 86_400_000).toISOString(), expiresAt: new Date(Date.now() + 47 * 86_400_000).toISOString() });
  const paused = await createDiscount(db, r.storeId, { code: "PAUSADO7", kind: "PERCENT", value: 7 });
  await setDiscountActive(db, r.storeId, paused.id, false);

  // ---- Campanhas: no ar, agendada, encerrada ----
  await createCampaign(db, r.storeId, { text: "Frete grátis acima de R$ 299 em todo o site", startsAt: daysAgo(3), endsAt: new Date(Date.now() + 25 * 86_400_000).toISOString() });
  await createCampaign(db, r.storeId, { text: "Coleção de inverno chega na próxima semana", linkUrl: "/", startsAt: new Date(Date.now() + 6 * 86_400_000).toISOString(), endsAt: new Date(Date.now() + 20 * 86_400_000).toISOString() });
  await createCampaign(db, r.storeId, { text: "Liquidação de verão: até 30% de desconto", startsAt: daysAgo(80), endsAt: daysAgo(50) });

  // ---- Equipe ----
  for (const [name, email] of [["Paulo Mendes (atendimento)", "paulo@casaaurora.demo"], ["Sofia Lima (expedição)", "sofia@casaaurora.demo"]] as const) {
    await inviteStaff(db, owner, { name, email, password: DEMO_PASSWORD });
    await db.update(s.users).set({ mustChangePassword: false }).where(eq(s.users.email, email));
  }

  // ---- Clientes e pedidos: 90 dias, curva de crescimento, todas as situações ----
  const customers = Array.from({ length: 52 }, (_, i) => {
    const city = CITIES[i % CITIES.length]!;
    const first = FIRST[i % FIRST.length]!;
    return { name: `${first} ${LAST[(i * 7) % LAST.length]!}${i % 9 === 0 ? ` de Albuquerque Menezes Filho ${i}` : ""}`, email: `${first.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}.${i + 1}@exemplo.com`, phone: `119${String(80000000 + i * 137).slice(0, 8)}`, optIn: i % 3 !== 0, city };
  });
  const orderIds: { id: string; number: number; email: string; customer: number; day: number; fate: string }[] = [];
  const TOTAL = 170;
  for (let n = 0; n < TOTAL; n++) {
    // mais pedidos nos dias recentes (crescimento): dia = 89 * (1 - sqrt(u))
    const day = Math.floor(89 * (1 - Math.sqrt(rand())));
    const ci = Math.floor(rand() * customers.length);
    const c = customers[ci]!;
    const lineCount = rand() < 0.25 ? 3 : rand() < 0.5 ? 2 : 1;
    const items = Array.from({ length: lineCount }, () => { const m = pick(sellable); const v = pick(m.variants); return { productId: m.productId, variantId: v.id, quantity: rand() < 0.15 ? 3 : rand() < 0.4 ? 2 : 1 }; });
    // mesma variante duas vezes na mesma compra confunde estoque: junta
    const merged = [...new Map(items.map((it) => [it.variantId, it])).values()];
    const channel = pick(CHANNELS);
    const fate = day < 3 ? pick(["PENDING", "PAID", "LABEL", "PICKING", "PENDING"]) : day < 10 ? pick(["PAID", "LABEL", "PICKING", "SHIPPED", "SHIPPED", "CANCELED", "PENDING"]) : pick(["DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED", "SHIPPED", "CANCELED", "DELIVERED", "PENDING"]);
    const code = rand() < 0.14 ? pick(["BEMVINDO10", "FRETE20", "VIP15", "ULTIMAS5"]) : undefined;
    let created: Awaited<ReturnType<typeof createOrder>> | null = null;
    try {
      created = await createOrder(db, {
        storeId: r.storeId, channel, saleType: merged.reduce((q, i) => q + i.quantity, 0) >= 6 ? "WHOLESALE" : "RETAIL",
        customer: { name: c.name, email: c.email, phone: c.phone, marketingOptIn: c.optIn },
        shipping: { address: `Rua ${pick(["das Flores", "do Comércio", "Augusta", "XV de Novembro", "Sete de Setembro"])}, ${10 + Math.floor(rand() * 900)}`, city: c.city[0], state: c.city[1], zip: c.city[2], costCents: rand() < 0.3 ? 0 : 2490, serviceName: pick(CARRIERS), days: 3 + Math.floor(rand() * 6) },
        items: merged, customerPaymentStatus: fate === "PENDING" ? "PENDING" : "PAID", discountCode: code, notes: rand() < 0.1 ? "Presente: embalagem para presente, por favor." : undefined,
      });
    } catch { continue; } // cupom inválido para o pedido, estoque insuficiente etc.: apenas segue
    const when = daysAgo(day, 8 + Math.floor(rand() * 12));
    await db.update(s.orders).set({ channel, createdAt: when, updatedAt: when }).where(eq(s.orders.id, created.orderId));
    await db.update(s.orderEvents).set({ createdAt: when }).where(eq(s.orderEvents.orderId, created.orderId));
    orderIds.push({ id: created.orderId, number: created.number, email: c.email, customer: ci, day, fate });
    try {
      if (fate === "CANCELED") { await cancelOrder(db, owner, created.orderId); }
      else if (fate === "LABEL" || fate === "PICKING" || fate === "SHIPPED" || fate === "DELIVERED") {
        await registerShippingLabel(db, owner, created.orderId, { code: `BR${String(100000000 + created.number * 7919).slice(0, 9)}BR`, carrier: pick(CARRIERS) });
        if (fate !== "LABEL") await advanceOrder(db, owner, created.orderId, "PICKING");
        if (fate === "SHIPPED" || fate === "DELIVERED") { await advanceOrder(db, owner, created.orderId, "READY_TO_SHIP"); await advanceOrder(db, owner, created.orderId, "SHIPPED"); }
        if (fate === "DELIVERED") await advanceOrder(db, owner, created.orderId, "DELIVERED");
      }
      if (rand() < 0.07) await addOrderNote(db, owner, created.orderId, pick(["Cliente pediu para ligar antes da entrega.", "Troca de tamanho combinada por WhatsApp.", "Pagamento conferido manualmente.", "Endereço comercial: entregar até 18h."]));
    } catch { /* transição não permitida para o estado: mantém o pedido como está */ }
    // movimentos: data dos eventos e do pedido acompanham o dia escolhido
    await db.update(s.orders).set({ createdAt: when, updatedAt: daysAgo(Math.max(0, day - 2), 15) }).where(eq(s.orders.id, created.orderId));
  }
  // Pedido aguardando pagamento antigo e pagamento confirmado manualmente (para o fluxo "confirmar pagamento").
  const stalePending = orderIds.find((o) => o.fate === "PENDING" && o.day > 10);
  if (stalePending) { try { await confirmCustomerPayment(db, owner, stalePending.id); } catch { /* ok */ } }

  // ---- Perfil dos clientes (etiquetas e anotações) ----
  const storeCustomers = await db.select().from(s.storeCustomers).where(eq(s.storeCustomers.storeId, r.storeId));
  const TAGS = [["vip"], ["atacado"], ["recorrente"], ["instagram"], ["troca"], ["vip", "recorrente"], ["presente"]];
  for (const [i, sc] of storeCustomers.entries()) {
    if (i % 3 === 0) await updateStoreCustomerProfile(db, r.storeId, sc.id, { tags: TAGS[i % TAGS.length]!, notes: i % 6 === 0 ? "Prefere contato por WhatsApp. Costuma comprar em coleções novas." : null });
  }

  // ---- Avaliações: pendentes, aprovadas, rejeitadas ----
  const BODIES = ["Chegou antes do prazo e o tecido é lindo.", "Caimento perfeito, recomendo!", "Boa qualidade, mas a cor é um pouco diferente da foto.", "Atendimento excelente e embalagem caprichada.", "Tamanho veio justo, vale pedir um maior.", "Produto igual ao anunciado.", "Amei! Já comprei outro.", "Demorou um pouco, mas valeu a espera.", "Material de ótima qualidade.", "Não gostei do acabamento."];
  let revCount = 0;
  for (const o of orderIds.filter((x) => x.fate === "DELIVERED" || x.fate === "SHIPPED")) {
    if (revCount >= 40 || rand() > 0.35) continue;
    const items = await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, o.id));
    if (!items[0]) continue;
    const rating = rand() < 0.1 ? 2 : rand() < 0.25 ? 3 : rand() < 0.5 ? 4 : 5;
    try { await submitReview(db, r.storeId, { number: String(o.number), email: o.email, productId: items[0].productId, rating, body: pick(BODIES) }); revCount++; } catch { /* já avaliado */ }
  }
  const reviews = await listReviewsForStore(db, r.storeId);
  for (const [i, { r: rev }] of reviews.entries()) {
    if (rev.status !== "PENDING") continue;
    if (i % 7 === 6) await moderateReview(db, r.storeId, rev.id, "REJECTED");
    else if (i % 4 !== 3) await moderateReview(db, r.storeId, rev.id, "APPROVED"); // 1 em 4 fica pendente para testar moderação
  }

  // ---- Estoque: avisos de "avise-me" nos esgotados e movimentos de entrada/saída ----
  for (const m of made) {
    for (const v of m.variants) {
      const lvl = (await db.select().from(s.inventory).where(eq(s.inventory.variantId, v.id)))[0];
      if (lvl && lvl.onHand - lvl.reserved <= 0) {
        for (let k = 0; k < 1 + Math.floor(rand() * 5); k++) await subscribeStockAlert(db, r.storeId, { productId: m.productId, variantId: v.id, contact: rand() < 0.6 ? `interessada${k}.${v.size.toLowerCase()}@exemplo.com` : `1198${String(1000000 + k * 31 + m.price % 97).slice(0, 7)}` }).catch(() => undefined);
      }
    }
  }
  for (const m of sellable.slice(0, 10)) await adjustStock(db, m.variants[0]!.id, rand() < 0.5 ? 12 : -2, { referenceType: "MANUAL", actorUserId: owner.userId }).catch(() => undefined);

  // ---- Propostas: aberta, aceita (vira pedido), cancelada ----
  const big = sellable[1]!, mid = sellable[8]!;
  await createProposal(db, r.storeId, { customer: { name: "Loja da Marta Presentes", email: "marta@lojadamarta.exemplo", phone: "11977776666" }, items: [{ productId: big.productId, variantId: big.variants[1]!.id, quantity: 12 }, { productId: mid.productId, variantId: mid.variants[1]!.id, quantity: 6 }], validDays: 7 });
  await createProposal(db, r.storeId, { customer: { name: "Hotel Vila Verde", email: "compras@vilaverde.exemplo" }, items: [{ productId: sellable[9]!.productId, variantId: sellable[9]!.variants[0]!.id, quantity: 24 }], validDays: 10 });
  await createProposal(db, r.storeId, { customer: { name: "Escritório Prisma", email: "financeiro@prisma.exemplo" }, items: [{ productId: sellable[3]!.productId, variantId: sellable[3]!.variants[0]!.id, quantity: 8 }] });
  const props = await listProposals(db, r.storeId);
  const accept = props.find((p) => p.customerEmail === "financeiro@prisma.exemplo") as { token?: string; id: string } | undefined;
  if (accept?.token) await acceptProposal(db, accept.token).catch(() => undefined);
  const toCancel = props.find((p) => p.customerEmail === "compras@vilaverde.exemplo");
  if (toCancel) await cancelProposal(db, r.storeId, toCancel.id).catch(() => undefined);

  // ---- Trilha de auditoria ----
  const trail: [string, string, Record<string, unknown>, Record<string, unknown>][] = [
    ["store.update", "store", { name: "Casa Aurora", tagline: "" }, { name: "Casa Aurora", tagline: "Moda, casa e acessórios com curadoria" }],
    ["shipping.config", "store", { freeFromCents: 19900 }, { freeFromCents: 29900 }],
    ["discount.create", "discount", {}, { code: "VIP15", percent: 15 }],
    ["product.price", "product", { priceCents: 26990 }, { priceCents: 28990 }],
    ["team.invite", "user", {}, { email: "paulo@casaaurora.demo", role: "STAFF" }],
    ["min-order.set", "store", { minOrderCents: 0 }, { minOrderCents: 5000 }],
  ];
  for (const [action, entityType, before, after] of trail) await recordAudit(db, owner, { action, entityType, storeId: r.storeId, before, after }, { force: true });
  void and;
  return true;
}
