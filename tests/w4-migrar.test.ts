import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { customer, freshDb } from "./setup";
import { financeInvoices, orders, productVariants, storeProducts, stores, storeWaitlist, users } from "@/db/schema";
import { signupMember } from "@/lib/domain/store-access";
import { catalogOwner } from "@/lib/domain/independent";
import { createProduct } from "@/lib/domain/products";
import { createOrder } from "@/lib/domain/orders";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { markInvoicePaid } from "@/lib/domain/finance";
import { listStoreCatalog } from "@/lib/domain/catalog";
import {
  definirLancamento, destinoDoRedirecionamento, entrarNaListaDeEspera, importarRedirecionamentos, lerRedirecionamentos, normalizarCaminho, salvarPixel,
} from "@/lib/domain/migrar";
import { feedGoogle } from "@/lib/domain/feed-google";
import { enviarCompraMeta } from "@/lib/payments/meta-capi";

/** W4 das melhorias (D187): endereços antigos, Google Shopping, Pixel da Meta e loja em lançamento. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

async function lojaEcommerce() {
  const r = await signupMember(ctx.db, { storeName: "Ateliê Migra", ownerName: "Rui Teste", email: "rui@atelie.com.br", password: "senha-segura-1", taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
  const owner: Actor = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!);
  const plan = (await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId)))[0]!;
  await markInvoicePaid(ctx.db, plan.id);
  const { productId } = await createProduct(ctx.db, await catalogOwner(ctx.db, owner), { name: "Vestido <Azul> & Branco", sku: "VA-1", categoryName: "Vestidos", costCents: 4000, suggestedPriceCents: 12990, minimumPriceCents: 9900, sizes: [{ size: "M", initialStock: 3 }] });
  await ctx.db.insert(storeProducts).values({ storeId: r.storeId, productId, priceCents: 12990, packPriceCents: null, active: true, featured: false })
    .onConflictDoUpdate({ target: [storeProducts.storeId, storeProducts.productId], set: { priceCents: 12990, active: true } });
  const variantId = (await ctx.db.select().from(productVariants).where(eq(productVariants.productId, productId)))[0]!.id;
  return { storeId: r.storeId, owner, productId, variantId };
}

describe("endereços antigos (redirecionamento)", () => {
  it("lê a planilha, limpa os caminhos e recusa destino fora, laço e página da loja", () => {
    expect(normalizarCaminho("https://lojaantiga.com.br/Produto/X/?id=9#topo")).toBe("/produto/x");
    expect(normalizarCaminho("produto//y")).toBe("/produto/y");
    expect(normalizarCaminho("//malicioso.com")).toBe("");
    const r = lerRedirecionamentos([
      "de;para",
      "/produto/vestido-azul;/product/vestido-azul",
      "/a;/b", "/b;/a",
      "/c;https://outro-site.com/c",
      "/checkout;/product/x",
      "/sem-destino",
      "/categoria/vestidos\t/catalog",
    ].join("\n"));
    expect(r.linhas).toEqual([{ de: "/produto/vestido-azul", para: "/product/vestido-azul" }, { de: "/categoria/vestidos", para: "/catalog" }]);
    expect(r.erros.join(" ")).toMatch(/Laço/);
    expect(r.erros.join(" ")).toMatch(/caminho da própria loja/);
    expect(r.erros.join(" ")).toMatch(/página da loja/);
    expect(r.erros.join(" ")).toMatch(/faltou o endereço novo/);
  });

  it("salva, encontra e conta o uso; loja do SuperDrop não usa", async () => {
    const l = await lojaEcommerce();
    const r = await importarRedirecionamentos(ctx.db, l.owner, "/produto/vestido-azul;/product/vestido-azul");
    expect(r.salvos).toBe(1);
    expect(await destinoDoRedirecionamento(ctx.db, l.storeId, "/Produto/Vestido-Azul?utm_source=google")).toBe("/product/vestido-azul");
    expect(await destinoDoRedirecionamento(ctx.db, l.storeId, "/nao-existe")).toBeNull();
    expect(await destinoDoRedirecionamento(ctx.db, ctx.seed.stores.arena.id, "/produto/vestido-azul")).toBeNull();
    await expect(importarRedirecionamentos(ctx.db, ctx.actors.arena, "/a;/b")).rejects.toThrow(/E-commerce/);
  });
});

describe("Google Shopping", () => {
  it("lista só os ativos, com preço em reais, disponibilidade e texto escapado", async () => {
    const l = await lojaEcommerce();
    const xml = feedGoogle({ nome: "Ateliê Migra", origem: "https://atelie.com.br/store/atelie", descricao: "" }, await listStoreCatalog(ctx.db, l.storeId));
    expect(xml).toContain('xmlns:g="http://base.google.com/ns/1.0"');
    expect(xml).toContain("<g:price>129.90 BRL</g:price>");
    expect(xml).toContain("<g:availability>in_stock</g:availability>");
    expect(xml).toContain("Vestido &lt;Azul&gt; &amp; Branco");
    expect(xml).toContain("https://atelie.com.br/store/atelie/product/");
  });
});

describe("Pixel da Meta", () => {
  it("número só com algarismos; token só criptografado; apagar o número desliga tudo", async () => {
    const l = await lojaEcommerce();
    await expect(salvarPixel(ctx.db, l.owner, { pixelId: "abc" })).rejects.toThrow(/algarismos/);
    await salvarPixel(ctx.db, l.owner, { pixelId: "123456789012345", token: "EAAB-segredo-da-meta" });
    let st = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, l.storeId) }))!;
    expect(st.metaPixelId).toBe("123456789012345");
    expect(st.metaCapiTokenEnc).toBeTruthy();
    expect(st.metaCapiTokenEnc).not.toContain("EAAB-segredo");
    await salvarPixel(ctx.db, l.owner, { pixelId: "123456789012345" });
    expect((await ctx.db.query.stores.findFirst({ where: eq(stores.id, l.storeId) }))!.metaCapiTokenEnc).toBe(st.metaCapiTokenEnc);
    await salvarPixel(ctx.db, l.owner, { pixelId: "" });
    st = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, l.storeId) }))!;
    expect(st.metaPixelId).toBeNull();
    expect(st.metaCapiTokenEnc).toBeNull();
  });

  it("a compra vai para a Meta só paga no Mercado Pago, com o número do pedido e o e-mail em resumo", async () => {
    const l = await lojaEcommerce();
    await salvarPixel(ctx.db, l.owner, { pixelId: "123456789012345", token: "EAAB-segredo-da-meta" });
    const o = await createOrder(ctx.db, { storeId: l.storeId, customer, items: [{ productId: l.productId, variantId: l.variantId, quantity: 1 }], customerPaymentStatus: "PAID" }, { paymentProvider: "DEMO" });
    const chamadas: { url: string; corpo: string }[] = [];
    const falso = (async (url: string, init?: RequestInit) => { chamadas.push({ url, corpo: String(init?.body) }); return new Response("{}", { status: 200 }); }) as unknown as typeof fetch;
    expect(await enviarCompraMeta(ctx.db, o.orderId, falso)).toBe("SEM_PIXEL");
    await ctx.db.update(orders).set({ paymentProvider: "MERCADO_PAGO" }).where(eq(orders.id, o.orderId));
    expect(await enviarCompraMeta(ctx.db, o.orderId, falso)).toBe("ENVIADO");
    expect(chamadas).toHaveLength(1);
    expect(chamadas[0]!.url).toContain("/123456789012345/events");
    const corpo = JSON.parse(chamadas[0]!.corpo);
    expect(corpo.data[0]).toMatchObject({ event_name: "Purchase", event_id: o.orderId, custom_data: { currency: "BRL" } });
    expect(chamadas[0]!.corpo).not.toContain(customer.email);
    expect(chamadas[0]!.corpo).not.toContain("EAAB");
  });
});

describe("loja em lançamento", () => {
  it("lista de espera só com o sim, sem repetir e só enquanto a loja não abriu", async () => {
    const l = await lojaEcommerce();
    await expect(entrarNaListaDeEspera(ctx.db, l.storeId, { email: "ana@x.com", consent: true })).rejects.toThrow(/já está aberta/);
    await definirLancamento(ctx.db, l.owner, true);
    await expect(entrarNaListaDeEspera(ctx.db, l.storeId, { email: "ana@x.com", consent: false })).rejects.toThrow();
    await entrarNaListaDeEspera(ctx.db, l.storeId, { email: "Ana@X.com", consent: true });
    await entrarNaListaDeEspera(ctx.db, l.storeId, { email: "ana@x.com", consent: true });
    expect(await ctx.db.select().from(storeWaitlist).where(eq(storeWaitlist.storeId, l.storeId))).toHaveLength(1);
    await expect(definirLancamento(ctx.db, ctx.actors.arena, true)).rejects.toThrow(/E-commerce/);
  });
});
