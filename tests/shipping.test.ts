import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { stores, suppliers } from "@/db/schema";
import { listStoreCatalog } from "@/lib/domain/catalog";
import { encryptSecret } from "@/lib/security/crypto";
import { melhorEnvioProvider, parcelFor, parseShippingConfig, quoteShipping, resolveShipping, superFreteProvider } from "@/lib/shipping/quote";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));
async function cart() {
  const item = (await listStoreCatalog(ctx.db, ctx.seed.stores.mantos.id)).find((i) => i.variants.length && i.variants[0]!.level.available > 2)!;
  return { item, items: [{ productId: item.product.id, variantId: item.variants[0]!.id, quantity: 1 }] };
}
async function connect(provider: "MELHOR_ENVIO" | "SUPERFRETE" = "SUPERFRETE") {
  await ctx.db.update(suppliers).set({ shippingProvider: provider, shippingStatus: "CONNECTED", shippingTokenEnc: encryptSecret("token-de-teste-1234567890"), shippingOriginZip: "01001000" }).where(eq(suppliers.id, ctx.seed.supplierId));
}
const setCfg = (cfg: Record<string, unknown>) => ctx.db.update(stores).set({ shippingConfig: cfg }).where(eq(stores.id, ctx.seed.stores.mantos.id));

describe("cotação de frete", () => {
  it("sem transportadora conectada usa a entrega padrão da loja, com prazo de preparo", async () => {
    await setCfg({ freeFromCents: null, flatCents: 1990, flatDays: 6, handlingDays: 2 });
    const { items } = await cart();
    const q = await quoteShipping(ctx.db, { storeId: ctx.seed.stores.mantos.id, toZip: "20040-020", items });
    expect(q.options).toHaveLength(1);
    expect(q.options[0]).toMatchObject({ kind: "TABLE", priceCents: 1990, days: 8 });
    expect(q.degraded).toBe(false);
  });
  it("CEP inválido é recusado", async () => {
    const { items } = await cart();
    await expect(quoteShipping(ctx.db, { storeId: ctx.seed.stores.mantos.id, toZip: "123", items })).rejects.toThrow(/CEP/);
  });
  it("frete grátis no serviço mais barato a partir do valor, e retirada na loja", async () => {
    await setCfg({ freeFromCents: 1, flatCents: 2500, pickupEnabled: true, pickupAddress: "Rua do Brás, 10" });
    const { items } = await cart();
    const q = await quoteShipping(ctx.db, { storeId: ctx.seed.stores.mantos.id, toZip: "20040020", items });
    expect(q.freeApplied).toBe(true);
    expect(q.options[0]!.priceCents).toBe(0);
    expect(q.options.find((o) => o.kind === "PICKUP")).toMatchObject({ priceCents: 0 });
  });
  it("SuperFrete: lê a resposta, soma acréscimo e preparo e ordena por preço", async () => {
    await connect("SUPERFRETE"); await setCfg({ freeFromCents: null, markupCents: 100, handlingDays: 1 });
    const { items } = await cart();
    const calls: { url: string; body: string }[] = [];
    const fetchImpl = (async (url: string, init: RequestInit) => { calls.push({ url: String(url), body: String(init.body) }); return json([{ id: 2, name: "SEDEX", price: 41.5, delivery_time: 2 }, { id: 1, name: "PAC", price: 22.9, delivery_time: 6 }, { id: 17, name: "Mini", has_error: true }]); }) as typeof fetch;
    const q = await quoteShipping(ctx.db, { storeId: ctx.seed.stores.mantos.id, toZip: "20040-020", items }, fetchImpl);
    expect(q.options.map((o) => [o.name, o.priceCents, o.days])).toEqual([["SuperFrete PAC", 2390, 7], ["SuperFrete SEDEX", 4250, 3]]);
    const sent = JSON.parse(calls[0]!.body);
    expect(sent.from.postal_code).toBe("01001000"); expect(sent.to.postal_code).toBe("20040020"); expect(sent.package.weight).toBeGreaterThan(0);
  });
  it("Melhor Envio: usa o preço da conta e ignora serviços com erro", async () => {
    const p = melhorEnvioProvider("tk", (async () => json([{ id: 1, name: "PAC", price: "30.00", custom_price: "25.50", delivery_time: 5, company: { name: "Correios" } }, { id: 3, name: ".Package", error: "indisponível", company: { name: "Jadlog" } }])) as typeof fetch);
    const r = await p.quote({ fromZip: "01001000", toZip: "20040020", parcel: parcelFor([{ quantity: 1, weightG: 300, lengthCm: 30, widthCm: 25, heightCm: 3, valueCents: 5000 }]) });
    expect(r).toHaveLength(1); expect(r[0]).toMatchObject({ priceCents: 2550, days: 5, carrier: "Correios" });
  });
  it("se a transportadora cair, cai para a entrega padrão e avisa", async () => {
    await connect("MELHOR_ENVIO"); await setCfg({ freeFromCents: null, flatCents: 2000 });
    const { items } = await cart();
    const q = await quoteShipping(ctx.db, { storeId: ctx.seed.stores.mantos.id, toZip: "20040020", items }, (async () => json({ message: "erro" }, 500)) as typeof fetch);
    expect(q.degraded).toBe(true); expect(q.options[0]).toMatchObject({ kind: "TABLE", priceCents: 2000 });
  });
  it("sem CEP de origem a cotação da transportadora não roda", async () => {
    await connect("SUPERFRETE"); await ctx.db.update(suppliers).set({ shippingOriginZip: null }).where(eq(suppliers.id, ctx.seed.supplierId));
    const { items } = await cart(); let called = false;
    const q = await quoteShipping(ctx.db, { storeId: ctx.seed.stores.mantos.id, toZip: "20040020", items }, (async () => { called = true; return json([]); }) as typeof fetch);
    expect(called).toBe(false); expect(q.options[0]!.kind).toBe("TABLE");
  });
  it("o valor do frete vale o da cotação do servidor, não o do cliente; opção velha é recusada", async () => {
    await setCfg({ freeFromCents: null, flatCents: 3000 });
    const { items } = await cart();
    const pick = await resolveShipping(ctx.db, { storeId: ctx.seed.stores.mantos.id, toZip: "20040020", serviceId: "TABLE", items });
    expect(pick.priceCents).toBe(3000);
    await expect(resolveShipping(ctx.db, { storeId: ctx.seed.stores.mantos.id, toZip: "20040020", serviceId: "SF:99", items })).rejects.toThrow(/mudou/);
  });
  it("superFreteProvider e parcelFor: medidas somam altura e respeitam limites", () => {
    const p = parcelFor([{ quantity: 3, weightG: 200, lengthCm: 30, widthCm: 20, heightCm: 4, valueCents: 1000 }, { quantity: 1, weightG: 500, lengthCm: 40, widthCm: 10, heightCm: 2, valueCents: 2000 }]);
    expect(p).toMatchObject({ weightG: 1100, lengthCm: 40, widthCm: 20, heightCm: 14, insuranceCents: 5000 });
    expect(superFreteProvider("x").key).toBe("SUPERFRETE");
  });
  it("configuração padrão vem completa e valida valores", () => {
    expect(parseShippingConfig(null)).toMatchObject({ pickupEnabled: false, handlingDays: 1 });
    expect(() => parseShippingConfig({ flatCents: -1 })).toThrow();
  });
});
