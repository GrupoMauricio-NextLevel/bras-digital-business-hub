import { eq } from "drizzle-orm";
import type { Database } from "./client";
import * as s from "./schema";
import { DEMO_PASSWORD } from "./seed-constants";
import { actorFromUser } from "@/lib/domain/access";
import { catalogSupplierId } from "@/lib/domain/independent";
import { markInvoicePaid } from "@/lib/domain/finance";
import { createOrder } from "@/lib/domain/orders";
import { createProduct } from "@/lib/domain/products";
import { signupMember } from "@/lib/domain/store-access";

export const COMMERCE_DEMO_EMAIL = "lojista@commerce.demo";

const PRODUCTS = [
  { name: "Poncho de tricô cru", sku: "FL-01", price: 17990 }, { name: "Camiseta verde-musgo", sku: "FL-02", price: 7990 },
  { name: "Jaqueta de couro sintético", sku: "FL-03", price: 28990 }, { name: "Sandália salto bloco", sku: "FL-04", price: 21990 },
  { name: "Conjunto de moletom amarelo", sku: "FL-05", price: 24990 }, { name: "Terno azul xadrez", sku: "FL-06", price: 54990 },
] as const;

const BUYERS = ["Marina Souza", "Carlos Almeida", "Joana Pires", "Rafael Mota", "Bia Tavares", "Lucas Freitas", "Paula Nunes", "Diego Costa"];
const CHANNELS = ["ONLINE_STORE", "WHATSAPP", "ONLINE_STORE", "INSTAGRAM", "ONLINE_STORE", "ONLINE_STORE", "WHATSAPP", "ONLINE_STORE"] as const;

const daysAgo = (n: number, hour = 11) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(hour, 0, 0, 0); return d.toISOString(); };

/**
 * Conta de demonstração da NextLevel Commerce (conta simples, sem fornecedor): "Fio & Linha", com produtos e pedidos fictícios
 * em canais e situações variados. Serve para capturar telas reais do painel da Commerce. Só roda na demonstração; idempotente.
 * Login: lojista@commerce.demo (senha de demonstração).
 */
export async function seedCommerceDemo(db: Database): Promise<boolean> {
  if (await db.query.users.findFirst({ where: eq(s.users.email, COMMERCE_DEMO_EMAIL) })) return false;
  const r = await signupMember(db, { storeName: "Fio & Linha", ownerName: "Ana Ribeiro", email: COMMERCE_DEMO_EMAIL, password: DEMO_PASSWORD, taxId: "111.444.777-35", offer: "STORE_SUBDOMAIN", independent: true, brand: "NEXTLEVEL_COMMERCE" });
  for (const inv of await db.select().from(s.financeInvoices).where(eq(s.financeInvoices.storeId, r.storeId))) await markInvoicePaid(db, inv.id);
  const owner = actorFromUser((await db.query.users.findFirst({ where: eq(s.users.id, r.userId) }))!);
  const supplierId = await catalogSupplierId(db, owner);
  const made: { productId: string; variantId: string; price: number }[] = [];
  for (const p of PRODUCTS) {
    const { productId } = await createProduct(db, supplierId, { name: p.name, sku: p.sku, categoryName: "Moda", costCents: Math.round(p.price * 0.4), suggestedPriceCents: p.price, minimumPriceCents: Math.round(p.price * 0.6), sizes: [{ size: "M", initialStock: 40 }, { size: "G", initialStock: 40 }] });
    await db.insert(s.storeProducts).values({ storeId: r.storeId, productId, priceCents: p.price, packPriceCents: null, active: true, featured: made.length < 4 });
    const v = (await db.select().from(s.productVariants).where(eq(s.productVariants.productId, productId)))[0]!;
    made.push({ productId, variantId: v.id, price: p.price });
  }
  for (let i = 0; i < BUYERS.length; i++) {
    const it = made[i % made.length]!;
    const paid = i % 4 !== 1;
    const { orderId } = await createOrder(db, { storeId: r.storeId, customer: { name: BUYERS[i]!, email: `cliente${i + 1}@exemplo.com`, marketingOptIn: false }, shipping: { city: ["São Paulo", "Belo Horizonte", "Curitiba", "Recife"][i % 4]!, state: ["SP", "MG", "PR", "PE"][i % 4]!, costCents: 1990 }, items: [{ productId: it.productId, variantId: it.variantId, quantity: 1 + (i % 2) }], customerPaymentStatus: paid ? "PAID" : "PENDING" });
    const when = daysAgo(i * 2);
    await db.update(s.orders).set({ channel: CHANNELS[i], createdAt: when, updatedAt: when, ...(i >= 5 && paid ? { status: "SHIPPED" as const } : {}) }).where(eq(s.orders.id, orderId));
  }
  return true;
}
