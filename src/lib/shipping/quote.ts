import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { networks, stores, suppliers } from "@/db/schema";
import { DomainError } from "@/lib/domain/errors";
import { listStoreCatalog } from "@/lib/domain/catalog";
import { decryptSecret } from "@/lib/security/crypto";
import type { FetchLike } from "@/lib/payments/mercadopago";
import { ShippingError, type ShippingProviderKey } from "./providers";

/**
 * Cotação de frete (P1). O servidor sempre recalcula o frete: o valor enviado pelo navegador nunca vale.
 * Provedores (SuperFrete, Melhor Envio) ficam atrás da mesma interface; sem provedor conectado, ou se ele falhar,
 * vale a tabela da loja (`shippingConfig`), para o cliente nunca ficar sem opção de entrega.
 */
export type ShippingQuote = { serviceId: string; carrier: string; name: string; priceCents: number; days: number | null; kind: "CARRIER" | "TABLE" | "PICKUP" };
export type QuoteParcel = { weightG: number; lengthCm: number; widthCm: number; heightCm: number; insuranceCents: number };
export type QuoteRequest = { fromZip: string; toZip: string; parcel: QuoteParcel };
export interface ShippingProvider {
  key: ShippingProviderKey;
  quote(req: QuoteRequest): Promise<Omit<ShippingQuote, "kind">[]>;
}

export const shippingConfigSchema = z.object({
  /** Frete grátis no serviço mais barato a partir deste subtotal (centavos); nulo desliga. */
  freeFromCents: z.number().int().nonnegative().nullable().default(29900),
  /** Valor da entrega padrão quando não há cotação de transportadora. */
  flatCents: z.number().int().nonnegative().default(2490),
  flatDays: z.number().int().positive().default(7),
  /** Dias úteis de preparo somados ao prazo da transportadora. */
  handlingDays: z.number().int().nonnegative().default(1),
  /** Acréscimo fixo sobre a cotação (embalagem), em centavos. */
  markupCents: z.number().int().nonnegative().default(0),
  pickupEnabled: z.boolean().default(false),
  pickupAddress: z.string().max(200).default(""),
});
export type ShippingConfig = z.infer<typeof shippingConfigSchema>;
export const parseShippingConfig = (raw: unknown): ShippingConfig => shippingConfigSchema.parse(raw && typeof raw === "object" ? raw : {});

export const onlyDigits = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");
export const isZip = (s: string | null | undefined) => onlyDigits(s).length === 8;

const UA = "NextLevel Commerce (suporte@nextlevelgroup.com.br)";
const num = (v: unknown) => { const n = typeof v === "string" ? Number(v.replace(",", ".")) : typeof v === "number" ? v : NaN; return Number.isFinite(n) ? n : null; };

/**
 * ATENÇÃO (PRECISA VALIDAR com token real no teste controlado): formatos de pedido e resposta abaixo seguem a documentação
 * pública de cada plataforma na data da implementação; a base pode ser trocada por SHIPPING_*_BASE (sandbox).
 */
export function melhorEnvioProvider(token: string, fetchImpl: FetchLike = fetch, base = process.env.SHIPPING_MELHOR_ENVIO_BASE ?? "https://melhorenvio.com.br/api/v2"): ShippingProvider {
  return {
    key: "MELHOR_ENVIO",
    async quote(req) {
      const res = await fetchImpl(`${base}/me/shipment/calculate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json", "User-Agent": UA },
        body: JSON.stringify({
          from: { postal_code: req.fromZip }, to: { postal_code: req.toZip },
          products: [{ id: "pedido", width: req.parcel.widthCm, height: req.parcel.heightCm, length: req.parcel.lengthCm, weight: Math.max(0.01, req.parcel.weightG / 1000), insurance_value: req.parcel.insuranceCents / 100, quantity: 1 }],
        }),
      });
      if (!res.ok) throw new ShippingError(`Melhor Envio respondeu ${res.status}`);
      const rows = (await res.json()) as { id?: number | string; name?: string; price?: unknown; custom_price?: unknown; delivery_time?: unknown; custom_delivery_time?: unknown; error?: string; company?: { name?: string } }[];
      return (Array.isArray(rows) ? rows : []).filter((r) => !r.error && num(r.custom_price ?? r.price) !== null).map((r) => ({
        serviceId: `ME:${r.id}`, carrier: r.company?.name ?? "Melhor Envio", name: `${r.company?.name ?? ""} ${r.name ?? ""}`.trim(),
        priceCents: Math.round(num(r.custom_price ?? r.price)! * 100), days: num(r.custom_delivery_time ?? r.delivery_time),
      }));
    },
  };
}

export function superFreteProvider(token: string, fetchImpl: FetchLike = fetch, base = process.env.SHIPPING_SUPERFRETE_BASE ?? "https://api.superfrete.com/api/v0"): ShippingProvider {
  return {
    key: "SUPERFRETE",
    async quote(req) {
      const res = await fetchImpl(`${base}/calculator`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json", "User-Agent": UA },
        body: JSON.stringify({
          from: { postal_code: req.fromZip }, to: { postal_code: req.toZip }, services: "1,2,17",
          options: { own_hand: false, receipt: false, insurance_value: req.parcel.insuranceCents / 100, use_insurance_value: false },
          package: { height: req.parcel.heightCm, width: req.parcel.widthCm, length: req.parcel.lengthCm, weight: Math.max(0.01, req.parcel.weightG / 1000) },
        }),
      });
      if (!res.ok) throw new ShippingError(`SuperFrete respondeu ${res.status}`);
      const rows = (await res.json()) as { id?: number | string; name?: string; price?: unknown; delivery_time?: unknown; has_error?: boolean; error?: string }[];
      return (Array.isArray(rows) ? rows : []).filter((r) => !r.has_error && !r.error && num(r.price) !== null).map((r) => ({
        serviceId: `SF:${r.id}`, carrier: "SuperFrete", name: `SuperFrete ${r.name ?? ""}`.trim(), priceCents: Math.round(num(r.price)! * 100), days: num(r.delivery_time),
      }));
    },
  };
}

/** Uma embalagem por pedido: soma pesos, empilha alturas e usa a maior largura e comprimento (simples e conservador). */
export function parcelFor(items: { quantity: number; weightG: number; lengthCm: number; widthCm: number; heightCm: number; valueCents: number }[]): QuoteParcel {
  let weightG = 0, lengthCm = 1, widthCm = 1, heightCm = 0, insuranceCents = 0;
  for (const i of items) {
    weightG += i.weightG * i.quantity; heightCm += i.heightCm * i.quantity;
    lengthCm = Math.max(lengthCm, i.lengthCm); widthCm = Math.max(widthCm, i.widthCm); insuranceCents += i.valueCents * i.quantity;
  }
  return { weightG: Math.max(1, weightG), lengthCm: Math.min(200, lengthCm), widthCm: Math.min(200, widthCm), heightCm: Math.min(200, Math.max(1, heightCm)), insuranceCents };
}

export type QuoteItem = { productId: string; variantId?: string; packId?: string; quantity: number };

/** Itens do carrinho → peso, medidas e valor, lidos do catálogo da própria loja (nunca do navegador). */
async function itemsForParcel(db: Database, storeId: string, items: QuoteItem[]) {
  const catalog = await listStoreCatalog(db, storeId);
  const byProduct = new Map(catalog.map((c) => [c.product.id, c]));
  const out: Parameters<typeof parcelFor>[0] = [];
  let subtotalCents = 0;
  for (const it of items) {
    const c = byProduct.get(it.productId);
    if (!c) throw new DomainError("PRODUCT_NOT_AVAILABLE", "Produto não disponível para esta loja.");
    const pack = it.packId ? c.packs.find((p) => p.id === it.packId) : null;
    const pieces = pack ? pack.items.reduce((s, x) => s + x.quantity, 0) : 1;
    const unit = pack ? (c.storeProduct.packPriceCents ?? pack.suggestedPriceCents) : c.storeProduct.priceCents;
    subtotalCents += unit * it.quantity;
    out.push({ quantity: it.quantity * pieces, weightG: c.product.weightG, lengthCm: c.product.lengthCm, widthCm: c.product.widthCm, heightCm: c.product.heightCm, valueCents: Math.round(unit / pieces) });
  }
  return { parcelItems: out, subtotalCents };
}

async function originZipOf(db: Database, storeId: string): Promise<string> {
  const r = await db.select({ z: suppliers.shippingOriginZip }).from(stores).innerJoin(networks, eq(networks.id, stores.networkId)).innerJoin(suppliers, eq(suppliers.id, networks.supplierId)).where(eq(stores.id, storeId)).limit(1);
  return onlyDigits(r[0]?.z);
}

async function providerFor(db: Database, storeId: string, fetchImpl: FetchLike): Promise<ShippingProvider | null> {
  const row = await db.select({ p: suppliers.shippingProvider, t: suppliers.shippingTokenEnc, s: suppliers.shippingStatus }).from(stores).innerJoin(networks, eq(networks.id, stores.networkId)).innerJoin(suppliers, eq(suppliers.id, networks.supplierId)).where(eq(stores.id, storeId)).limit(1);
  const r = row[0];
  if (!r || r.s !== "CONNECTED" || !r.t) return null;
  const token = decryptSecret(r.t);
  if (!token) return null;
  return r.p === "MELHOR_ENVIO" ? melhorEnvioProvider(token, fetchImpl) : r.p === "SUPERFRETE" ? superFreteProvider(token, fetchImpl) : null;
}

export type QuoteResult = { options: ShippingQuote[]; degraded: boolean; subtotalCents: number; freeApplied: boolean };

export async function quoteShipping(db: Database, input: { storeId: string; toZip: string; items: QuoteItem[] }, fetchImpl: FetchLike = fetch): Promise<QuoteResult> {
  const toZip = onlyDigits(input.toZip);
  if (!isZip(toZip)) throw new DomainError("ZIP_INVALID", "Informe um CEP válido (8 números).");
  const store = await db.query.stores.findFirst({ where: eq(stores.id, input.storeId) });
  if (!store) throw new DomainError("STORE_NOT_FOUND", "Loja não encontrada.");
  const cfg = parseShippingConfig(store.shippingConfig);
  const { parcelItems, subtotalCents } = await itemsForParcel(db, store.id, input.items);
  const handling = cfg.handlingDays;
  let options: ShippingQuote[] = [];
  let degraded = false;
  const provider = await providerFor(db, store.id, fetchImpl);
  const fromZip = await originZipOf(db, store.id);
  if (provider && isZip(fromZip)) {
    try {
      const raw = await Promise.race([
        provider.quote({ fromZip, toZip, parcel: parcelFor(parcelItems) }),
        new Promise<never>((_, rej) => setTimeout(() => rej(new ShippingError("tempo esgotado")), 8000)),
      ]);
      options = raw.map((o) => ({ ...o, priceCents: o.priceCents + cfg.markupCents, days: o.days === null ? null : o.days + handling, kind: "CARRIER" as const }));
    } catch { degraded = true; }
  }
  if (options.length === 0) options = [{ serviceId: "TABLE", carrier: "Loja", name: "Entrega padrão", priceCents: cfg.flatCents, days: cfg.flatDays + handling, kind: "TABLE" }];
  options.sort((a, b) => a.priceCents - b.priceCents);
  let freeApplied = false;
  if (cfg.freeFromCents !== null && subtotalCents >= cfg.freeFromCents) { options[0] = { ...options[0]!, priceCents: 0, name: `${options[0]!.name} (frete grátis)` }; freeApplied = true; }
  if (cfg.pickupEnabled) options.push({ serviceId: "PICKUP", carrier: "Loja", name: cfg.pickupAddress ? `Retirar na loja (${cfg.pickupAddress})` : "Retirar na loja", priceCents: 0, days: handling, kind: "PICKUP" });
  return { options, degraded, subtotalCents, freeApplied };
}

/** Confere a opção escolhida contra uma cotação nova e devolve o valor que vale. Usado ao criar o pedido. */
export async function resolveShipping(db: Database, input: { storeId: string; toZip: string; serviceId: string; items: QuoteItem[] }, fetchImpl: FetchLike = fetch): Promise<ShippingQuote> {
  const q = await quoteShipping(db, input, fetchImpl);
  const pick = q.options.find((o) => o.serviceId === input.serviceId);
  if (!pick) throw new DomainError("SHIPPING_CHANGED", "A opção de entrega escolhida mudou. Escolha o frete de novo.");
  return pick;
}
