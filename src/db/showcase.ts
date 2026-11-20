import { and, asc, eq, sql } from "drizzle-orm";
import type { Database } from "./client";
import * as s from "./schema";
import { newId, slugify } from "@/lib/ids";
import { hashPassword } from "@/lib/security/password";
import { DEMO_PASSWORD } from "./seed-constants";
import { DEMO } from "./seed";
import { receiveStock } from "@/lib/domain/inventory";
import { advanceOrder, cancelOrder, createOrder } from "@/lib/domain/orders";
import { addLabelFile } from "@/lib/domain/labels";
import { makeDemoLabelPdf } from "@/lib/labels-demo";
import { creditRecharge, manualDebit } from "@/lib/domain/wallet";
import { createWave, waveLabelsPdf } from "@/lib/domain/operations";
import { requestService, advanceServiceOrder } from "@/lib/domain/services";
import { ensureContract, markInvoicePaid, registerStoreAcquisition } from "@/lib/domain/finance";
import type { Actor } from "@/lib/domain/access";

/**
 * Vitrine de demonstração: fornecedor "Mega Tron" com 5 camisas genéricas (sem marcas), uma loja de membro
 * ("MRS Sports") e 30 dias de atividade simulada em todos os estados. Só roda no ambiente de demonstração.
 * Custo de R$ 80 e preço de venda de R$ 120 por camisa.
 */
export const SHOWCASE_COST_CENTS = 8000;
export const SHOWCASE_PRICE_CENTS = 12000;

const SIZES = ["P", "M", "G", "GG"] as const;
export const SHOWCASE_PRODUCTS = [
  { name: "Camisa Tailandesa Grená e Verde Listrada", sku: "MT-TH-01", art: "#7f1d1d,#166534,#ffffff" },
  { name: "Camisa Tailandesa Branca Clássica", sku: "MT-TH-02", art: "#f8fafc,#7f1d1d,#166534" },
  { name: "Camisa Tailandesa Preta e Branca", sku: "MT-TH-03", art: "#111827,#ffffff,#9ca3af" },
  { name: "Camisa Tailandesa Azul Royal", sku: "MT-TH-04", art: "#1d4ed8,#ffffff,#93c5fd" },
  { name: "Camisa Tailandesa Azul Celeste e Preta", sku: "MT-TH-05", art: "#38bdf8,#111827,#ffffff" },
] as const;

const CUSTOMERS = [
  ["Rafael Monteiro", "SP", "Campinas"], ["Juliana Alves", "RJ", "Niterói"], ["Diego Ferraz", "MG", "Belo Horizonte"], ["Camila Duarte", "SP", "São Paulo"],
  ["Lucas Barreto", "BA", "Salvador"], ["Patrícia Nogueira", "PR", "Curitiba"], ["Thiago Bastos", "RS", "Porto Alegre"], ["Fernanda Lopes", "GO", "Goiânia"],
  ["Vinícius Prado", "SP", "Santos"], ["Aline Cardoso", "PE", "Recife"], ["Bruno Teixeira", "SC", "Joinville"], ["Larissa Moura", "CE", "Fortaleza"],
  ["Gustavo Reis", "MG", "Uberlândia"], ["Mariana Pires", "ES", "Vitória"],
] as const;

const daysAgo = (n: number, hour = 10) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(hour, 0, 0, 0); return d.toISOString(); };

type Step = "label" | "PICKING" | "READY_TO_SHIP" | "SHIPPED" | "DELIVERED" | "cancel";

export async function seedShowcase(db: Database) {
  const hash = hashPassword(DEMO_PASSWORD);
  const master = await db.query.users.findFirst({ where: eq(s.users.email, DEMO.masterEmail) });
  if (!master) throw new Error("seedShowcase precisa do seed de demonstração base (usuário master ausente).");
  const masterActor: Actor = { userId: master.id, role: "NEXTLEVEL_MASTER", organizationId: master.organizationId, supplierId: null, storeId: null };

  // --- Tenancy ---------------------------------------------------------------
  const supOrg = { id: newId("org"), name: "Mega Tron Comércio Eletrônico", slug: "mega-tron", type: "SUPPLIER" as const, brand: "NEXTLEVEL_COMMERCE" as const };
  const memOrg = { id: newId("org"), name: "MRS Sports", slug: "mrs-sports", type: "MERCHANT" as const, brand: "NEXTLEVEL_COMMERCE" as const };
  await db.insert(s.organizations).values([supOrg, memOrg]);
  const supplierId = newId("sup");
  await db.insert(s.suppliers).values({ id: supplierId, organizationId: supOrg.id, name: "Mega Tron", slug: "megatron", businessModel: "SUPERDROP", platformFeePercent: 5, setupFeeCents: 0, city: "São Paulo", state: "SP", walletMpTokenEnc: null });
  const networkId = newId("net");
  await db.insert(s.networks).values({ id: networkId, supplierId, name: "Rede Mega Tron", slug: "rede-mega-tron" });
  const storeId = newId("sto");
  await db.insert(s.stores).values({ id: storeId, organizationId: memOrg.id, networkId, offer: "STORE_SUBDOMAIN", name: "MRS Sports", slug: "mrs-sports", tagline: "Camisas premium com envio rápido", logoText: "MS", primaryColor: "#0f172a", accentColor: "#f59e0b", whatsapp: "5511999990000", status: "ACTIVE", paymentStatus: "DEMO", paymentProvider: "Mercado Pago (simulado)", publishedAt: daysAgo(40) });
  const ownerId = newId("usr");
  await db.insert(s.users).values([
    { id: newId("usr"), name: "Equipe Mega Tron", email: DEMO.megatronEmail, role: "SUPPLIER_ADMIN", organizationId: supOrg.id, supplierId, passwordHash: hash },
    { id: newId("usr"), name: "Carlos Expedição", email: DEMO.megatronDispatchEmail, role: "SUPPLIER_DISPATCH", organizationId: supOrg.id, supplierId, passwordHash: hash },
    { id: ownerId, name: "Marcelo R. Santos", email: DEMO.mrsEmail, role: "STORE_OWNER", organizationId: memOrg.id, storeId, passwordHash: hash },
  ]);
  const supplier: Actor = { userId: (await db.query.users.findFirst({ where: eq(s.users.email, DEMO.megatronEmail) }))!.id, role: "SUPPLIER_ADMIN", organizationId: supOrg.id, supplierId, storeId: null };
  const dispatchUser = (await db.query.users.findFirst({ where: eq(s.users.email, DEMO.megatronDispatchEmail) }))!;
  const dispatch: Actor = { userId: dispatchUser.id, role: "SUPPLIER_DISPATCH", organizationId: supOrg.id, supplierId, storeId: null };
  const owner: Actor = { userId: ownerId, role: "STORE_OWNER", organizationId: memOrg.id, supplierId: null, storeId };

  // --- Catálogo (5 camisas genéricas, custo R$ 80, venda R$ 120) -----------------
  const cat = { id: newId("cat"), supplierId, name: "Camisas Tailandesas", slug: slugify("Camisas Tailandesas") };
  await db.insert(s.categories).values(cat);
  const productIds: string[] = [];
  const variants = new Map<string, { id: string; size: string }[]>();
  for (const p of SHOWCASE_PRODUCTS) {
    const id = newId("prd");
    productIds.push(id);
    await db.insert(s.products).values({ id, supplierId, networkId, categoryId: cat.id, name: p.name, slug: slugify(p.name), description: "Camisa de tecido leve e respirável, acabamento premium e modelagem confortável. Produto genérico, sem marca de clube.", sku: p.sku, images: [`art:${p.art}`], costCents: SHOWCASE_COST_CENTS, suggestedPriceCents: SHOWCASE_PRICE_CENTS, minimumPriceCents: 10000, distribution: "ALL_NETWORK", sellsUnit: true, sellsPack: false });
    const vs = SIZES.map((size, position) => ({ id: newId("var"), productId: id, size, sku: `${p.sku}-${size}`, position }));
    await db.insert(s.productVariants).values(vs);
    variants.set(id, vs);
    const qty = { P: 12, M: 20, G: 20, GG: 12 };
    for (const v of vs) await receiveStock(db, v.id, qty[v.size as keyof typeof qty], { referenceType: "SEED", note: "Entrada inicial de estoque" });
  }
  await db.insert(s.storeProducts).values(productIds.map((productId, i) => ({ storeId, productId, priceCents: SHOWCASE_PRICE_CENTS, packPriceCents: null, active: true, featured: i < 3 })))
      // O produto da própria loja já entra nela ao ser criado (D176): aqui só ajusta preço e destaque.
      .onConflictDoUpdate({ target: [s.storeProducts.storeId, s.storeProducts.productId], set: { priceCents: sql`excluded.price_cents`, active: sql`excluded.active`, featured: sql`excluded.featured` } });
  const starter = await db.query.themes.findFirst({ where: eq(s.themes.key, "starter") });
  const version = starter ? await db.query.themeVersions.findFirst({ where: eq(s.themeVersions.themeId, starter.id) }) : null;
  if (starter && version) await db.insert(s.storeThemes).values({ storeId, themeId: starter.id, themeVersionId: version.id });
  await db.insert(s.themeSettings).values({ storeId, settings: { heroTitle: "Camisas premium com envio rápido", heroSubtitle: "Escolha seu modelo e receba em casa. Pagamento por Pix.", heroCta: "Ver catálogo", announcement: "Pague no Pix e receba o código de rastreio no WhatsApp", banners: [{ title: "Camisas Tailandesas", subtitle: "Tecido leve e acabamento premium", tone: "primary" }], showCategories: false, footerText: "MRS Sports · Loja parceira Mega Tron" } });

  // --- Operação e financeiro do fornecedor ------------------------------------------
  await db.insert(s.supplierOps).values({ supplierId, timezone: "America/Sao_Paulo", cutoffs: { mon: "14:00", tue: "14:00", wed: "14:00", thu: "14:00", fri: "14:00", sat: null, sun: null }, holidays: [] });
  await ensureContract(db, supplierId, { tier: "START", waiveMonthly: true, waiveSetup: true });
  const acq = await registerStoreAcquisition(db, { storeId, supplierId, offer: "STORE_SUBDOMAIN", storeName: "MRS Sports" });
  if (acq.invoiceId) await markInvoicePaid(db, acq.invoiceId, new Date(Date.now() - 12 * 86_400_000));
  await db.insert(s.supplierPages).values({
    supplierId, headline: "Sua loja de camisas pronta para vender", subheadline: "Catálogo, estoque, etiquetas e expedição prontos. Você vende, a Mega Tron separa e envia.", logoText: "MT", primaryColor: "#111827", accentColor: "#f59e0b", whatsapp: "5511999990000",
    benefits: ["Catálogo pronto com fotos e tamanhos", "Envio direto da Central, você só anexa a etiqueta", "Loja online em minutos, com Pix", "Recarga de saldo por Pix, sem burocracia", "Academy para ir do zero à primeira venda"],
    faq: [
      { q: "Preciso de estoque?", a: "Não. O estoque fica na Central e você vende do catálogo. O custo de cada pedido é debitado do seu saldo." },
      { q: "Como recebo dos meus clientes?", a: "Por Pix, direto na sua conta do Mercado Pago. A plataforma não segura o seu dinheiro." },
      { q: "Quanto tempo leva para começar?", a: "No mesmo dia: escolha os produtos, recarregue o saldo e publique a loja." },
      { q: "Posso testar antes de assinar?", a: "Sim. Peça o seu cupom ao time Mega Tron e teste por 7 dias sem cartão." },
    ],
  });

  // --- Carteira: recargas Pix (simuladas) ------------------------------------------------
  const recharge = async (cents: number, dAgo: number) => {
    const id = newId("rch");
    await db.insert(s.walletRecharges).values({ id, storeId, supplierId, amountCents: cents, mpPaymentId: `demo_${id}`, pixCode: `00020126DEMO${id}`, pixQrBase64: "", expiresAt: daysAgo(dAgo, 12) });
    await creditRecharge(db, id, { mpPaymentId: `demo_${id}`, amountCents: cents });
    await db.update(s.walletRecharges).set({ createdAt: daysAgo(dAgo, 9), paidAt: daysAgo(dAgo, 9) }).where(eq(s.walletRecharges.id, id));
    await db.update(s.walletEntries).set({ createdAt: daysAgo(dAgo, 9) }).where(and(eq(s.walletEntries.rechargeId, id)));
  };
  await recharge(150_000, 29);

  // --- Pedidos simulados (30 dias, todos os estados) ---------------------------------------------
  const catalogIdx = (i: number) => productIds[i % productIds.length]!;
  const variantOf = (pi: string, size: string) => variants.get(pi)!.find((v) => v.size === size)!.id;
  let counter = 0;
  const placed: { orderId: string; base: string }[] = [];
  const order = async (dAgo: number, steps: Step[], opts: { qty?: number; channel?: "ONLINE_STORE" | "WHATSAPP" | "INSTAGRAM" | "MANUAL"; paid?: boolean } = {}) => {
    const c = CUSTOMERS[counter % CUSTOMERS.length]!;
    const pi = catalogIdx(counter);
    const size = SIZES[(counter * 3) % 4]!;
    counter++;
    const r = await createOrder(db, {
      storeId, channel: opts.channel ?? (["ONLINE_STORE", "ONLINE_STORE", "WHATSAPP", "INSTAGRAM"] as const)[counter % 4]!, saleType: "RETAIL",
      customer: { name: c[0], email: `${slugify(c[0])}@exemplo.com`, phone: `11 9${String(70000000 + counter * 137).slice(0, 4)}-${String(1000 + counter * 37).slice(0, 4)}`, marketingOptIn: counter % 2 === 0 },
      shipping: { address: `Rua das Acácias, ${100 + counter * 7}`, city: c[2], state: c[1], zip: "01310-100", costCents: 1890 },
      items: [{ productId: pi, variantId: variantOf(pi, size), quantity: opts.qty ?? 1 }], customerPaymentStatus: opts.paid === false ? "PENDING" : "PAID",
    }, { paymentProvider: opts.paid === false ? "MANUAL" : "DEMO" });
    for (const st of steps) {
      if (st === "label") await addLabelFile(db, owner, r.orderId, { filename: `etiqueta-${r.number}.pdf`, bytes: await makeDemoLabelPdf(r.number, c[0]) });
      else if (st === "cancel") await cancelOrder(db, owner, r.orderId);
      else await advanceOrder(db, supplier, r.orderId, st);
    }
    if (steps.includes("SHIPPED") || steps.includes("DELIVERED")) await db.update(s.orders).set({ shippingCarrier: "SuperFrete", shippingLabelCode: `SF${String(900000000 + r.number * 31)}BR` }).where(eq(s.orders.id, r.orderId));
    placed.push({ orderId: r.orderId, base: daysAgo(dAgo, 8 + (counter % 9)) });
    return r;
  };
  const full: Step[] = ["label", "PICKING", "READY_TO_SHIP", "SHIPPED", "DELIVERED"];
  await recharge(200_000, 20);
  for (const d of [28, 26, 24, 22, 20, 18, 16, 13, 11]) await order(d, full, { qty: d % 3 === 0 ? 2 : 1 });
  await recharge(120_000, 9);
  for (const d of [7, 5, 4, 3]) await order(d, ["label", "PICKING", "READY_TO_SHIP", "SHIPPED"]);
  await order(2, ["label", "PICKING", "READY_TO_SHIP"]);
  await order(1, ["label", "PICKING", "READY_TO_SHIP"], { qty: 2 });
  await order(1, ["label", "PICKING"]);
  await order(0, ["label", "PICKING"]);
  for (const d of [1, 0, 0]) await order(d, ["label"], { channel: "ONLINE_STORE" });
  for (const d of [2, 1, 0]) await order(d, [], { channel: d === 2 ? "WHATSAPP" : "INSTAGRAM" });
  await order(15, ["cancel"]);
  await order(8, ["cancel"]);
  await order(0, [], { channel: "MANUAL", paid: false });
  // Saldo baixo: os dois últimos pedidos pagos ficam aguardando recarga
  const bal = (await db.query.walletAccounts.findFirst({ where: eq(s.walletAccounts.storeId, storeId) }))?.balanceCents ?? 0;
  if (bal > 2000) await manualDebit(db, supplier, storeId, { amountCents: bal - 2000, note: "Ajuste de demonstração" });
  await order(0, [], { qty: 2, channel: "ONLINE_STORE" });
  await order(0, [], { channel: "WHATSAPP" });

  // Datas realistas: pedidos, histórico, extrato e liberação
  for (const { orderId, base } of placed) {
    const o = await db.query.orders.findFirst({ where: eq(s.orders.id, orderId) });
    if (!o) continue;
    const baseMs = new Date(base).getTime();
    const events = await db.select().from(s.orderEvents).where(eq(s.orderEvents.orderId, orderId)).orderBy(asc(s.orderEvents.createdAt));
    for (const [i, e] of events.entries()) await db.update(s.orderEvents).set({ createdAt: new Date(baseMs + i * 35 * 60_000).toISOString() }).where(eq(s.orderEvents.id, e.id));
    const last = new Date(baseMs + Math.max(events.length - 1, 0) * 35 * 60_000).toISOString();
    await db.update(s.orders).set({ createdAt: base, updatedAt: last, centralPaidAt: o.centralPaymentStatus === "PAID" ? new Date(baseMs + 4 * 60_000).toISOString() : null, awaitingFundsSince: o.status === "AWAITING_CENTRAL_PAYMENT" ? base : null, reservationExpiresAt: null }).where(eq(s.orders.id, orderId));
    await db.update(s.walletEntries).set({ createdAt: new Date(baseMs + 4 * 60_000).toISOString() }).where(and(eq(s.walletEntries.orderId, orderId), eq(s.walletEntries.type, "ORDER_DEBIT")));
  }

  // Onda de separação com impressão de etiquetas
  try {
    const wave = await createWave(db, dispatch, { untilCutoff: true });
    await waveLabelsPdf(db, dispatch, wave.id);
  } catch { /* sem pedidos elegíveis no horário: a demonstração segue sem onda */ }

  // Loja NextLevel: dois pedidos de serviço em estágios diferentes
  const banners = await db.query.services.findFirst({ where: eq(s.services.key, "banners") });
  const traffic = await db.query.services.findFirst({ where: eq(s.services.key, "trafego-pago") });
  if (banners) { const r = await requestService(db, owner, { serviceId: banners.id, briefing: "Preciso de banners para a campanha de fim de mês." }); await advanceServiceOrder(db, masterActor, r.id, "QUOTED", { quotedCents: 29000 }); }
  if (traffic) await requestService(db, owner, { serviceId: traffic.id, briefing: "Quero começar com anúncios no Instagram para camisas." });

  // Ajusta o fuso das ordens de serviço e mantém o cliente da vitrine sem cobranças pendentes de teste
  await db.update(s.serviceOrders).set({ createdAt: daysAgo(2, 15) }).where(sql`${s.serviceOrders.storeId} = ${storeId}`);
  return { supplierId, storeId, productIds };
}
