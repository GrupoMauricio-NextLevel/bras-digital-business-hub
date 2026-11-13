import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { customer, freshDb } from "./setup";
import { erpEnvios, financeInvoices, productVariants, storeProducts, stores, users } from "@/db/schema";
import { signupMember } from "@/lib/domain/store-access";
import { catalogOwner } from "@/lib/domain/independent";
import { createProduct } from "@/lib/domain/products";
import { createOrder } from "@/lib/domain/orders";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { markInvoicePaid } from "@/lib/domain/finance";
import { getLevel } from "@/lib/domain/inventory";
import { conectarErp, painelErp, rodarErp, tentarDeNovoErp } from "@/lib/domain/erp";
import { decryptSecret } from "@/lib/security/crypto";

/** Rodada C das integrações (D191): pedido pago vai para o ERP uma vez só, com novas tentativas; estoque volta por SKU. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

const TOKEN = "token-tiny-de-teste-1234567890";
async function loja() {
  const r = await signupMember(ctx.db, { storeName: "Ateliê ERP", ownerName: "Rui Teste", email: "rui@erp.com.br", password: "senha-segura-1", taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
  const owner: Actor = actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!);
  await markInvoicePaid(ctx.db, (await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId)))[0]!.id);
  const { productId } = await createProduct(ctx.db, await catalogOwner(ctx.db, owner), { name: "Vestido Azul", sku: "VA-1", categoryName: "Vestidos", costCents: 4000, suggestedPriceCents: 12990, minimumPriceCents: 9900, sizes: [{ size: "M", initialStock: 5 }] });
  await ctx.db.insert(storeProducts).values({ storeId: r.storeId, productId, priceCents: 12990, packPriceCents: null, active: true, featured: false })
    .onConflictDoUpdate({ target: [storeProducts.storeId, storeProducts.productId], set: { priceCents: 12990, active: true } });
  const v = (await ctx.db.select().from(productVariants).where(eq(productVariants.productId, productId)))[0]!;
  return { storeId: r.storeId, owner, productId, variantId: v.id, sku: v.sku };
}

/** Tiny falso: guarda as chamadas e responde por método. */
function tinyFalso(opc: { incluir?: () => unknown; saldo?: { codigo: string; saldo: number }[] } = {}) {
  const chamadas: { metodo: string; params: URLSearchParams }[] = [];
  const f = (async (url: string, init?: RequestInit) => {
    const metodo = String(url).split("/").pop()!; const params = new URLSearchParams(String(init?.body ?? ""));
    chamadas.push({ metodo, params });
    const r = metodo === "info.php" ? { status: "OK", conta: { razao_social: "Ateliê ERP Ltda", fantasia: "Ateliê" } }
      : metodo === "pedido.incluir.php" ? (opc.incluir?.() ?? { status: "OK", registros: [{ registro: { id: 991, numero: 77 } }] })
      : { status: "OK", numero_paginas: 1, produtos: (opc.saldo ?? []).map((p) => ({ produto: { codigo: p.codigo, saldo: p.saldo, saldoReservado: 0 } })) };
    return new Response(JSON.stringify({ retorno: r }), { status: 200 });
  }) as unknown as typeof fetch;
  return { chamadas, f };
}

describe("ERP da loja", () => {
  it("conecta conferindo a conta e guarda o token só criptografado", async () => {
    const l = await loja(); const t = tinyFalso();
    expect(await conectarErp(ctx.db, l.owner, { provider: "TINY", token: TOKEN }, t.f)).toEqual({ conta: "Ateliê" });
    const s = (await ctx.db.select().from(stores).where(eq(stores.id, l.storeId)))[0]!;
    expect(s.erpTokenEnc).not.toContain(TOKEN);
    expect(decryptSecret(s.erpTokenEnc)).toBe(TOKEN);
    await expect(conectarErp(ctx.db, ctx.actors.arena, { provider: "TINY", token: TOKEN }, t.f)).rejects.toThrow(/Commerce/);
  });

  it("pedido pago vai uma vez só, com SKU, valores em reais e o número do Tiny", async () => {
    const l = await loja(); const t = tinyFalso();
    await conectarErp(ctx.db, l.owner, { provider: "TINY", token: TOKEN }, t.f);
    const o = await createOrder(ctx.db, { storeId: l.storeId, customer, items: [{ productId: l.productId, variantId: l.variantId, quantity: 2 }], customerPaymentStatus: "PAID" }, { paymentProvider: "DEMO" });
    expect(await rodarErp(ctx.db, t.f)).toMatchObject({ novos: 1, enviados: 1, erros: 0 });
    const envio = t.chamadas.find((c) => c.metodo === "pedido.incluir.php")!;
    expect(envio.params.get("token")).toBe(TOKEN);
    const p = JSON.parse(envio.params.get("pedido")!).pedido;
    expect(p.itens[0].item).toMatchObject({ codigo: l.sku, quantidade: 2, valor_unitario: 129.9 });
    expect(p.cliente.email).toBe(customer.email);
    expect(await rodarErp(ctx.db, t.f)).toMatchObject({ novos: 0, enviados: 0 });
    expect(t.chamadas.filter((c) => c.metodo === "pedido.incluir.php")).toHaveLength(1);
    const painel = await painelErp(ctx.db, l.owner);
    expect(painel.envios[0]).toMatchObject({ status: "ENVIADO", externoId: "77", numero: (await ctx.db.query.orders.findFirst({ where: (x, { eq: e }) => e(x.id, o.orderId) }))!.number });
  });

  it("erro espera e tenta de novo; token recusado para; o lojista pode mandar de novo", async () => {
    const l = await loja(); let resposta: unknown = { status: "Erro", erros: [{ erro: "Serviço indisponível" }] };
    const t = tinyFalso({ incluir: () => resposta });
    await conectarErp(ctx.db, l.owner, { provider: "TINY", token: TOKEN }, t.f);
    await createOrder(ctx.db, { storeId: l.storeId, customer, items: [{ productId: l.productId, variantId: l.variantId, quantity: 1 }], customerPaymentStatus: "PAID" }, { paymentProvider: "DEMO" });
    const agora = new Date(Date.now() + 1000);
    expect(await rodarErp(ctx.db, t.f, agora)).toMatchObject({ enviados: 0, erros: 1 });
    expect(await rodarErp(ctx.db, t.f, new Date(agora.getTime() + 60_000))).toMatchObject({ erros: 0 }); // ainda esperando
    resposta = { status: "Erro", codigo_erro: 2, erros: [{ erro: "token inválido" }] };
    expect(await rodarErp(ctx.db, t.f, new Date(agora.getTime() + 6 * 60_000))).toMatchObject({ erros: 1 });
    const e = (await ctx.db.select().from(erpEnvios))[0]!;
    expect(e).toMatchObject({ status: "ERRO", tentativas: 5 });
    resposta = { status: "OK", registros: [{ registro: { id: 5, numero: 12 } }] };
    await tentarDeNovoErp(ctx.db, l.owner, e.id);
    expect(await rodarErp(ctx.db, t.f, new Date(agora.getTime() + 7 * 60_000))).toMatchObject({ enviados: 1 });
  });

  it("estoque do Tiny volta por SKU: o disponível na loja vira o saldo do ERP", async () => {
    const l = await loja(); const t = tinyFalso({ saldo: [{ codigo: l.sku, saldo: 12 }, { codigo: "SKU-QUE-NAO-EXISTE", saldo: 3 }] });
    await conectarErp(ctx.db, l.owner, { provider: "TINY", token: TOKEN }, t.f);
    await createOrder(ctx.db, { storeId: l.storeId, customer, items: [{ productId: l.productId, variantId: l.variantId, quantity: 1 }] }, { paymentProvider: "DEMO" });
    const r = await rodarErp(ctx.db, t.f);
    expect(r.ajustados).toBe(1);
    expect((await getLevel(ctx.db, l.variantId)).available).toBe(12);
    // Dentro de 15 minutos não lê de novo.
    expect((await rodarErp(ctx.db, t.f)).ajustados).toBe(0);
    expect(t.chamadas.filter((c) => c.metodo === "lista.atualizacoes.estoque.php")).toHaveLength(1);
  });
});
