import { and, desc, eq, inArray, isNotNull, lte, lt, or, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { domainEvents, erpEnvios, inventory, orderItems, orders, productVariants, products, stores } from "@/db/schema";
import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import type { FetchLike } from "@/lib/payments/mercadopago";
import { newId } from "@/lib/ids";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { assertStoreAdmin, type Actor } from "./access";
import { storeModality } from "./order-policy";
import { adjustStock } from "./inventory";
import { tinyErp } from "@/lib/erp/tiny";
import { lerCredencialOmie, omieErp } from "@/lib/erp/omie";
import { ErpError, type ErpCliente, type ErpKey, type PedidoParaErp } from "@/lib/erp/tipos";

/**
 * ERP da loja (Rodada C, D191; fila I-16 Tiny e I-17 Omie). Três rotinas, todas no cron de 5 a 10 minutos:
 * 1. "envio de pedido pago para fora": cada PAYMENT_APPROVED da loja (evento interno, já idempotente) vira uma linha em
 *    erp_envios, uma só por pedido e ERP;
 * 2. a fila manda os pedidos com tentativas espaçadas (até 5) e guarda o número lá fora;
 * 3. o estoque volta do ERP a cada 15 minutos, por SKU: o disponível na loja passa a ser o saldo do ERP.
 * Credencial só criptografada; nunca em tela, log ou e-mail. Só na loja independente da E-commerce.
 */
export const ERPS: Record<ErpKey, { nome: string }> = { TINY: { nome: "Tiny (Olist ERP)" }, OMIE: { nome: "Omie" } };
const MAX_TENTATIVAS = 5;
const INTERVALO_ESTOQUE_MS = 15 * 60_000;

export function clienteErp(provider: ErpKey, credencial: string, fetchImpl: FetchLike = fetch): ErpCliente {
  return provider === "TINY" ? tinyErp(credencial, fetchImpl) : omieErp(credencial, fetchImpl);
}

async function lojaDoDono(db: Database, actor: Actor) {
  if (actor.role !== "STORE_OWNER" || !actor.storeId) throw new ForbiddenError("Só o dono da loja.");
  assertStoreAdmin(actor);
  if ((await storeModality(db, actor.storeId)) !== "INDEPENDENT") throw new DomainError("NOT_ALLOWED", "Disponível na loja da NextLevel E-commerce.");
  return actor.storeId;
}

export type EntradaErp = { provider: ErpKey; token?: string; appKey?: string; appSecret?: string };

/** Confere a conta no próprio ERP e guarda a credencial criptografada. Pedidos pagos a partir de agora seguem para lá. */
export async function conectarErp(db: Database, actor: Actor, e: EntradaErp, fetchImpl: FetchLike = fetch): Promise<{ conta: string }> {
  const storeId = await lojaDoDono(db, actor);
  const credencial = e.provider === "OMIE" ? JSON.stringify({ appKey: e.appKey?.trim() ?? "", appSecret: e.appSecret?.trim() ?? "" }) : (e.token ?? "").trim();
  if (e.provider === "OMIE" ? !lerCredencialOmie(credencial) : credencial.length < 20) throw new DomainError("INVALID", e.provider === "OMIE" ? "Informe a app key e o app secret do Omie." : "Cole o token completo do Tiny.");
  let conta: string;
  try { conta = (await clienteErp(e.provider, credencial, fetchImpl).verificar()).conta; }
  catch (err) { throw new DomainError("ERP_RECUSOU", err instanceof ErpError ? err.message : "Não foi possível conferir a conta no ERP."); }
  await db.update(stores).set({ erpProvider: e.provider, erpTokenEnc: encryptSecret(credencial), erpAccount: conta.slice(0, 120), erpConnectedAt: new Date().toISOString(), erpStockSyncedAt: null }).where(eq(stores.id, storeId));
  return { conta };
}

export async function desconectarErp(db: Database, actor: Actor) {
  const storeId = await lojaDoDono(db, actor);
  await db.update(stores).set({ erpProvider: null, erpTokenEnc: null, erpAccount: null, erpConnectedAt: null, erpStockSyncedAt: null }).where(eq(stores.id, storeId));
}

/** Manda de novo um pedido que deu erro (zera as tentativas). */
export async function tentarDeNovoErp(db: Database, actor: Actor, envioId: string) {
  const storeId = await lojaDoDono(db, actor);
  const r = await db.update(erpEnvios).set({ status: "PENDENTE", tentativas: 0, proximaTentativa: new Date().toISOString(), updatedAt: new Date().toISOString() }).where(and(eq(erpEnvios.id, envioId), eq(erpEnvios.storeId, storeId), eq(erpEnvios.status, "ERRO"))).returning({ id: erpEnvios.id });
  if (!r.length) throw new NotFoundError("Envio não encontrado.");
}

export async function painelErp(db: Database, actor: Actor) {
  const storeId = await lojaDoDono(db, actor);
  const s = (await db.select({ provider: stores.erpProvider, conta: stores.erpAccount, desde: stores.erpConnectedAt, estoque: stores.erpStockSyncedAt }).from(stores).where(eq(stores.id, storeId)))[0]!;
  const envios = await db.select({ id: erpEnvios.id, status: erpEnvios.status, tentativas: erpEnvios.tentativas, externoId: erpEnvios.externoId, erro: erpEnvios.erro, quando: erpEnvios.updatedAt, numero: orders.number })
    .from(erpEnvios).innerJoin(orders, eq(orders.id, erpEnvios.orderId)).where(eq(erpEnvios.storeId, storeId)).orderBy(desc(erpEnvios.createdAt)).limit(20);
  return { ...s, envios };
}

/** 1. Pedidos pagos (evento interno) das lojas com ERP, desde a conexão, entram na fila uma vez só. */
export async function enfileirarPedidosPagos(db: Database, agora = new Date()): Promise<number> {
  const evs = await db.select({ orderId: sql<string>`${domainEvents.payload}->>'orderId'`, storeId: stores.id, provider: stores.erpProvider })
    .from(domainEvents).innerJoin(stores, eq(stores.id, domainEvents.storeId))
    .where(and(eq(domainEvents.type, "PAYMENT_APPROVED"), isNotNull(stores.erpProvider), sql`${domainEvents.createdAt} >= ${stores.erpConnectedAt}`,
      sql`not exists (select 1 from ${erpEnvios} where ${erpEnvios.orderId} = ${domainEvents.payload}->>'orderId' and ${erpEnvios.provider} = ${stores.erpProvider})`))
    .limit(200);
  let n = 0;
  for (const e of evs) {
    if (!e.orderId || !e.provider) continue;
    const ok = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.id, e.orderId), eq(orders.storeId, e.storeId))).limit(1);
    if (!ok[0]) continue;
    const r = await db.insert(erpEnvios).values({ id: newId("erp"), storeId: e.storeId, orderId: e.orderId, provider: e.provider, proximaTentativa: agora.toISOString() }).onConflictDoNothing().returning({ id: erpEnvios.id });
    n += r.length;
  }
  return n;
}

async function montarPedido(db: Database, orderId: string): Promise<PedidoParaErp> {
  const o = (await db.select().from(orders).where(eq(orders.id, orderId)))[0]!;
  const itens = await db.select({ nome: orderItems.productName, rotulo: orderItems.label, quantidade: orderItems.quantity, valor: orderItems.unitPriceCents, sku: productVariants.sku, skuProduto: products.sku })
    .from(orderItems).innerJoin(products, eq(products.id, orderItems.productId)).leftJoin(productVariants, eq(productVariants.id, orderItems.variantId)).where(eq(orderItems.orderId, orderId));
  return {
    id: o.id, numero: o.number, dataIso: o.createdAt,
    cliente: { nome: o.customerName, email: o.customerEmail, telefone: o.customerPhone, endereco: o.shippingAddress, cidade: o.shippingCity, uf: o.shippingState, cep: o.shippingZip },
    itens: itens.map((i) => ({ sku: i.sku || i.skuProduto || i.nome, nome: i.rotulo && i.rotulo !== i.nome ? `${i.nome} (${i.rotulo})` : i.nome, quantidade: i.quantidade, valorCents: i.valor })),
    freteCents: o.shippingCents, descontoCents: o.discountCents, totalCents: o.totalCents, servicoFrete: o.shippingService,
  };
}

/** 2. Manda a fila: até 20 por rodada; erro espera 5, 10, 20, 40 minutos; credencial recusada para na hora. */
export async function enviarFilaErp(db: Database, fetchImpl: FetchLike = fetch, agora = new Date()): Promise<{ enviados: number; erros: number }> {
  const fila = await db.select({ e: erpEnvios, cred: stores.erpTokenEnc, prov: stores.erpProvider }).from(erpEnvios).innerJoin(stores, eq(stores.id, erpEnvios.storeId))
    .where(and(or(eq(erpEnvios.status, "PENDENTE"), eq(erpEnvios.status, "ERRO")), lt(erpEnvios.tentativas, MAX_TENTATIVAS), lte(erpEnvios.proximaTentativa, agora.toISOString())))
    .orderBy(erpEnvios.createdAt).limit(20);
  let enviados = 0, erros = 0;
  for (const { e, cred, prov } of fila) {
    const credencial = decryptSecret(cred);
    if (!credencial || prov !== e.provider) continue; // ERP desligado ou trocado: fica parado, sem perder o registro.
    try {
      const { externoId } = await clienteErp(e.provider, credencial, fetchImpl).enviarPedido(await montarPedido(db, e.orderId));
      await db.update(erpEnvios).set({ status: "ENVIADO", externoId, erro: null, tentativas: e.tentativas + 1, updatedAt: agora.toISOString() }).where(eq(erpEnvios.id, e.id));
      enviados++;
    } catch (err) {
      const recusada = err instanceof ErpError && err.credencialRecusada;
      const t = recusada ? MAX_TENTATIVAS : e.tentativas + 1;
      await db.update(erpEnvios).set({ status: "ERRO", erro: (err instanceof ErpError ? err.message : "Falha inesperada ao enviar.").slice(0, 300), tentativas: t, proximaTentativa: new Date(agora.getTime() + 5 * 60_000 * 2 ** (t - 1)).toISOString(), updatedAt: agora.toISOString() }).where(eq(erpEnvios.id, e.id));
      erros++;
    }
  }
  return { enviados, erros };
}

/** 3. Estoque do ERP para a loja, por SKU, a cada 15 minutos: disponível na loja = saldo do ERP (o reservado fica como está). */
export async function sincronizarEstoqueErp(db: Database, fetchImpl: FetchLike = fetch, agora = new Date()): Promise<{ lojas: number; ajustados: number }> {
  const limite = new Date(agora.getTime() - INTERVALO_ESTOQUE_MS).toISOString();
  const lojas = await db.select({ id: stores.id, prov: stores.erpProvider, cred: stores.erpTokenEnc, desde: stores.erpStockSyncedAt }).from(stores)
    .where(and(isNotNull(stores.erpProvider), or(sql`${stores.erpStockSyncedAt} is null`, lte(stores.erpStockSyncedAt, limite)))).limit(20);
  let ajustados = 0;
  for (const l of lojas) {
    const credencial = decryptSecret(l.cred);
    if (!credencial || !l.prov) continue;
    try {
      const saldos = await clienteErp(l.prov, credencial, fetchImpl).estoque(l.desde ? new Date(new Date(l.desde).getTime() - 60_000) : null);
      if (saldos.length) {
        const porSku = new Map(saldos.map((s) => [s.sku.trim(), s.saldo]));
        const variantes = await db.select({ id: productVariants.id, sku: productVariants.sku, onHand: inventory.onHand, reserved: inventory.reserved })
          .from(productVariants).innerJoin(products, eq(products.id, productVariants.productId)).leftJoin(inventory, eq(inventory.variantId, productVariants.id))
          .where(and(eq(products.storeId, l.id), inArray(productVariants.sku, [...porSku.keys()])));
        for (const v of variantes) {
          const alvo = (v.reserved ?? 0) + Math.max(0, porSku.get(v.sku)!);
          const delta = alvo - (v.onHand ?? 0);
          if (delta !== 0) { await adjustStock(db, v.id, delta, { referenceType: "ERP", note: "Estoque do ERP" }); ajustados++; }
        }
      }
      await db.update(stores).set({ erpStockSyncedAt: agora.toISOString() }).where(eq(stores.id, l.id));
    } catch (err) {
      console.error("[erp estoque]", l.id, err instanceof ErpError ? err.message : "falha");
    }
  }
  return { lojas: lojas.length, ajustados };
}

export async function rodarErp(db: Database, fetchImpl: FetchLike = fetch, agora = new Date()) {
  const novos = await enfileirarPedidosPagos(db, agora);
  const fila = await enviarFilaErp(db, fetchImpl, agora);
  const estoque = await sincronizarEstoqueErp(db, fetchImpl, agora);
  return { novos, ...fila, ajustados: estoque.ajustados };
}
