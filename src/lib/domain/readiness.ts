import { and, eq, gt, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { inventory, orders, productVariants, products, storeProducts, storeThemes, stores } from "@/db/schema";
import { NotFoundError } from "./errors";
import { storeAccess } from "./store-access";

/**
 * "Esta loja está pronta para vender?" (Constituição art. 30). A regra mora aqui, nunca no componente.
 * `blocking` = sem isso o cliente não consegue comprar de verdade; os demais são recomendados.
 */
export type ReadinessItem = { key: string; ok: boolean; blocking: boolean; label: string; detail: string; fixHref: string };
export type StoreReadiness = { ready: boolean; items: ReadinessItem[]; missingBlocking: ReadinessItem[]; /** Marco de primeira venda: já existe pedido pago na loja. */ hasFirstSale: boolean; percent: number };

export async function getStoreReadiness(db: Database, storeId: string, now = new Date()): Promise<StoreReadiness> {
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  if (!store) throw new NotFoundError("Loja não encontrada.");

  // produtos ativos na loja, ativos no catálogo e com saldo disponível em ao menos um tamanho
  const sellable = await db
    .selectDistinct({ productId: storeProducts.productId })
    .from(storeProducts)
    .innerJoin(products, and(eq(products.id, storeProducts.productId), eq(products.status, "ACTIVE")))
    .innerJoin(productVariants, eq(productVariants.productId, products.id))
    .innerJoin(inventory, and(eq(inventory.variantId, productVariants.id), gt(sql`${inventory.onHand} - ${inventory.reserved}`, 0)))
    .where(and(eq(storeProducts.storeId, storeId), eq(storeProducts.active, true), sql`${storeProducts.priceCents} >= ${products.minimumPriceCents}`));
  const theme = await db.query.storeThemes.findFirst({ where: eq(storeThemes.storeId, storeId) });
  const access = storeAccess(store, now);
  const hasLegal = !!store.legalName && !!(store.cnpj || store.taxId) && !!store.contactEmail;
  const shippingSet = store.shippingStatus !== "NOT_CONFIGURED" || store.shippingConfig != null;

  const items: ReadinessItem[] = [
    { key: "products", ok: sellable.length > 0, blocking: true, label: "Produto à venda com estoque", detail: sellable.length ? `${sellable.length} produto(s) prontos para vender.` : "Nenhum produto ativo, com estoque e preço dentro do mínimo.", fixHref: "/merchant/catalogo" },
    { key: "payment", ok: store.paymentStatus === "CONNECTED", blocking: true, label: "Forma de pagamento real", detail: store.paymentStatus === "CONNECTED" ? "Mercado Pago conectado." : store.paymentStatus === "DEMO" ? "Pagamento em modo demonstração: nenhum dinheiro real entra." : "Mercado Pago ainda não conectado.", fixHref: "/merchant/settings#payments" },
    { key: "published", ok: !!store.publishedAt && store.status === "ACTIVE", blocking: true, label: "Loja publicada", detail: store.publishedAt ? (store.status === "ACTIVE" ? "Publicada." : "A loja não está ativa.") : "Ainda em rascunho: clientes não veem a loja.", fixHref: "/merchant/storefront" },
    { key: "plan", ok: access.state !== "BLOCKED", blocking: true, label: "Plano em dia", detail: access.state === "BLOCKED" ? "Teste ou assinatura vencidos: a loja está bloqueada." : "Acesso liberado.", fixHref: "/merchant/settings" },
    { key: "theme", ok: !!theme, blocking: false, label: "Tema escolhido e publicado", detail: theme ? "Tema ativo." : "Sem tema ativo: a vitrine usa o visual padrão.", fixHref: "/merchant/templates" },
    { key: "shipping", ok: shippingSet, blocking: false, label: "Frete configurado", detail: shippingSet ? "Regras de frete definidas." : "Sem regras próprias: vale a taxa padrão da plataforma.", fixHref: "/merchant/settings#shipping" },
    { key: "legal", ok: hasLegal, blocking: false, label: "Dados legais da loja", detail: hasLegal ? "Razão social, documento e e-mail de contato preenchidos." : "Faltam razão social, CNPJ/CPF ou e-mail de contato (dão confiança ao cliente).", fixHref: "/merchant/settings" },
  ];
  const missingBlocking = items.filter((i) => i.blocking && !i.ok);
  const paid = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.storeId, storeId), eq(orders.customerPaymentStatus, "PAID"))).limit(1);
  const percent = Math.round((items.filter((i) => i.ok).length / items.length) * 100);
  return { ready: missingBlocking.length === 0, items, missingBlocking, hasFirstSale: paid.length > 0, percent };
}
