import { eq, sql } from "drizzle-orm";
import type { Database } from "./client";
import * as s from "./schema";
import { DEMO_PASSWORD } from "./seed-constants";
import { actorFromUser } from "@/lib/domain/access";
import { catalogOwner } from "@/lib/domain/independent";
import { markInvoicePaid } from "@/lib/domain/finance";
import { createOrder } from "@/lib/domain/orders";
import { createProduct } from "@/lib/domain/products";
import { signupMember } from "@/lib/domain/store-access";
import { createDiscount } from "@/lib/domain/discounts";
import { setPriceTiers } from "@/lib/domain/price-tiers";
import { createCampaign } from "@/lib/domain/campaigns";
import { createProposal } from "@/lib/domain/proposals";
import { inviteStaff } from "@/lib/domain/store-team";
import { submitReview } from "@/lib/domain/reviews";

export const COMMERCE_DEMO_EMAIL = "lojista@commerce.demo";

const PRODUCTS = [
  { name: "Poncho de tricô cru", sku: "FL-01", price: 17990, photo: "moda-1" }, { name: "Camiseta verde-musgo", sku: "FL-02", price: 7990, photo: "moda-2" },
  { name: "Jaqueta de couro sintético", sku: "FL-03", price: 28990, photo: "moda-3" }, { name: "Sandália salto bloco", sku: "FL-04", price: 21990, photo: "moda-4" },
  { name: "Conjunto de moletom amarelo", sku: "FL-05", price: 24990, photo: "moda-hero" }, { name: "Terno azul xadrez", sku: "FL-06", price: 54990, photo: "moda-5" },
] as const;

const BUYERS = ["Marina Souza", "Carlos Almeida", "Joana Pires", "Rafael Mota", "Bia Tavares", "Lucas Freitas", "Paula Nunes", "Diego Costa"];
const CHANNELS = ["ONLINE_STORE", "WHATSAPP", "ONLINE_STORE", "INSTAGRAM", "ONLINE_STORE", "ONLINE_STORE", "WHATSAPP", "ONLINE_STORE"] as const;

const daysAgo = (n: number, hour = 11) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(hour, 0, 0, 0); return d.toISOString(); };

/**
 * Conta de demonstração da NextLevel E-commerce (conta simples, sem fornecedor): "Fio & Linha", com produtos e pedidos fictícios
 * em canais e situações variados. Serve para capturar telas reais do painel da Commerce. Só roda na demonstração; idempotente.
 * Login: lojista@commerce.demo (senha de demonstração).
 */
export async function seedCommerceDemo(db: Database): Promise<boolean> {
  if (await db.query.users.findFirst({ where: eq(s.users.email, COMMERCE_DEMO_EMAIL) })) return false;
  const r = await signupMember(db, { storeName: "Fio & Linha", ownerName: "Ana Ribeiro", email: COMMERCE_DEMO_EMAIL, password: DEMO_PASSWORD, taxId: "111.444.777-35", offer: "STORE_SUBDOMAIN", independent: true, brand: "NEXTLEVEL_COMMERCE" });
  for (const inv of await db.select().from(s.financeInvoices).where(eq(s.financeInvoices.storeId, r.storeId))) await markInvoicePaid(db, inv.id);
  const owner = actorFromUser((await db.query.users.findFirst({ where: eq(s.users.id, r.userId) }))!);
  const supplierId = await catalogOwner(db, owner);
  const made: { productId: string; variantId: string; price: number }[] = [];
  for (const p of PRODUCTS) {
    const { productId } = await createProduct(db, supplierId, { name: p.name, sku: p.sku, categoryName: "Moda", images: [`/portal/commerce/${p.photo}.webp`], costCents: Math.round(p.price * 0.4), suggestedPriceCents: p.price, minimumPriceCents: Math.round(p.price * 0.6), sizes: [{ size: "M", initialStock: 40 }, { size: "G", initialStock: 40 }] });
    await db.insert(s.storeProducts).values({ storeId: r.storeId, productId, priceCents: p.price, packPriceCents: null, active: true, featured: made.length < 4 })
      // O produto da própria loja já entra nela ao ser criado (D176): aqui só ajusta preço e destaque.
      .onConflictDoUpdate({ target: [s.storeProducts.storeId, s.storeProducts.productId], set: { priceCents: sql`excluded.price_cents`, active: sql`excluded.active`, featured: sql`excluded.featured` } });
    const v = (await db.select().from(s.productVariants).where(eq(s.productVariants.productId, productId)))[0]!;
    made.push({ productId, variantId: v.id, price: p.price });
  }
  for (let i = 0; i < BUYERS.length; i++) {
    const it = made[i % made.length]!;
    const paid = i % 4 !== 1;
    const { orderId } = await createOrder(db, { storeId: r.storeId, customer: { name: BUYERS[i]!, email: `cliente${i + 1}@exemplo.com`, marketingOptIn: false }, shipping: { address: `Rua Exemplo, ${100 + i}`, zip: "01310-100", city: ["São Paulo", "Belo Horizonte", "Curitiba", "Recife"][i % 4]!, state: ["SP", "MG", "PR", "PE"][i % 4]!, costCents: 1990 }, items: [{ productId: it.productId, variantId: it.variantId, quantity: 1 + (i % 2) }], customerPaymentStatus: paid ? "PAID" : "PENDING" });
    const when = daysAgo(i * 2);
    await db.update(s.orders).set({ channel: CHANNELS[i], createdAt: when, updatedAt: when, ...(i >= 5 && paid ? { status: "SHIPPED" as const } : {}) }).where(eq(s.orders.id, orderId));
  }

  // Loja já publicada: na demonstração o cliente consegue comprar sem o dono precisar publicar antes.
  await db.update(s.stores).set({ publishedAt: new Date().toISOString() }).where(eq(s.stores.id, r.storeId));
  // Funções novas, prontas para você testar na demonstração (nada disso vai para produção: a conta só existe no modo de demonstração).
  const first = made[0]!;
  await createDiscount(db, r.storeId, { code: "BEMVINDO10", kind: "PERCENT", value: 10, maxRedemptions: 50 });
  await setPriceTiers(db, r.storeId, first.productId, [{ minQty: 6, priceCents: Math.round(first.price * 0.9) }, { minQty: 12, priceCents: Math.round(first.price * 0.8) }]);
  await createCampaign(db, r.storeId, { text: "Frete grátis acima de R$ 299 neste fim de semana", startsAt: daysAgo(1), endsAt: new Date(Date.now() + 30 * 86_400_000).toISOString() });
  await createProposal(db, r.storeId, { customer: { name: "Loja da Marta", email: "marta@exemplo.com" }, items: [{ productId: first.productId, variantId: first.variantId, quantity: 6 }] });
  await inviteStaff(db, owner, { name: "Paulo (equipe)", email: "equipe@commerce.demo", password: DEMO_PASSWORD });
  await db.update(s.users).set({ mustChangePassword: false }).where(eq(s.users.email, "equipe@commerce.demo")); // só na demonstração: sem troca obrigatória
  const shipped = (await db.select().from(s.orders).where(eq(s.orders.storeId, r.storeId))).find((o) => o.status === "SHIPPED" && o.customerPaymentStatus === "PAID");
  if (shipped) await submitReview(db, r.storeId, { number: String(shipped.number), email: shipped.customerEmail, productId: (await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, shipped.id)))[0]!.productId, rating: 5, body: "Peça linda e chegou rápido. Recomendo!" });
  return true;
}
