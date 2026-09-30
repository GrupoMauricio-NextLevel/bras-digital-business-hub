"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession, isDemoMode } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireStoreId } from "@/lib/domain/access";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { listStoreCatalog } from "@/lib/domain/catalog";
import { createOrder } from "@/lib/domain/orders";
import { addLabelFile } from "@/lib/domain/labels";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { makeDemoLabelPdf } from "@/lib/labels-demo";

/** Funções de simulação: existem só no ambiente de demonstração e nunca tocam serviços externos. */
async function ctx() {
  if (!isDemoMode()) throw new ForbiddenError("Disponível apenas no ambiente de demonstração.");
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { session: s, db: await getDb() };
}
const refresh = () => { revalidatePath("/merchant", "layout"); revalidatePath("/supplier", "layout"); };

const NAMES = ["Rodrigo Azevedo", "Beatriz Campos", "Felipe Andrade", "Natália Freitas", "Henrique Sales", "Isabela Coutinho", "Matheus Ribeiro", "Débora Guimarães"];
const CITIES: [string, string][] = [["São Paulo", "SP"], ["Rio de Janeiro", "RJ"], ["Belo Horizonte", "MG"], ["Curitiba", "PR"], ["Recife", "PE"], ["Porto Alegre", "RS"]];
const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)]!;

/** Simula uma venda de cliente final na loja do membro (pago, com custo debitado do saldo se houver). */
export async function simulateCustomerOrderAction() {
  return runAction(async () => {
    const { session, db } = await ctx();
    const storeId = requireStoreId(session.actor);
    const catalog = (await listStoreCatalog(db, storeId, { onlyActive: true })).filter((c) => c.variants.some((v) => v.level.available > 0));
    if (catalog.length === 0) throw new DomainError("NO_STOCK", "Ative produtos com estoque no catálogo para simular uma venda.");
    const item = pick(catalog);
    const variant = pick(item.variants.filter((v) => v.level.available > 0));
    const name = pick(NAMES);
    const [city, state] = pick(CITIES);
    const r = await createOrder(db, {
      storeId, channel: pick(["ONLINE_STORE", "WHATSAPP", "INSTAGRAM"] as const), saleType: "RETAIL",
      customer: { name, email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@exemplo.com`, phone: `11 9${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`, marketingOptIn: Math.random() > 0.5 },
      shipping: { address: `Rua das Flores, ${Math.floor(10 + Math.random() * 900)}`, city, state, zip: "01310-100", costCents: 1890 },
      items: [{ productId: item.product.id, variantId: variant.id, quantity: 1 }], customerPaymentStatus: "PAID",
    }, { paymentProvider: "DEMO" });
    refresh();
    return { number: r.number, status: r.status, customer: name };
  });
}

/** Gera uma etiqueta fictícia (PDF 10x15 cm) para o pedido do membro. */
export async function attachDemoLabelAction(orderId: string) {
  return runAction(async () => {
    const { session, db } = await ctx();
    const o = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!o) throw new DomainError("NOT_FOUND", "Pedido não encontrado.");
    const r = await addLabelFile(db, session.actor, orderId, { filename: `etiqueta-demonstracao-${o.number}.pdf`, bytes: await makeDemoLabelPdf(o.number, o.customerName) });
    refresh();
    return r;
  });
}
