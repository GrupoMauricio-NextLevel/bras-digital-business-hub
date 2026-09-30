import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { nlOrders } from "@/db/schema";
import { seedDigitalProducts } from "@/db/base-data";
import { connectNextLevelMp } from "@/lib/domain/nextlevel-billing";
import { addNlNote, advanceNlOrder, createNlOrder, getDigitalProduct, getNlOrder, getNlOrderByToken, listDigitalProducts, listNlOrders, nlSalesSummary, simulateNlPayment, syncNlOrder, updateDigitalProduct } from "@/lib/domain/nl-sales";
import { freshDb } from "./setup";

let ctx: Awaited<ReturnType<typeof freshDb>>;
const buyer = { name: "Maria da Silva", email: "MARIA@exemplo.com", phone: "(11) 95878-4061" };
const base = { baseUrl: "https://app.superdrop.com.br", publicHttps: true };
beforeAll(async () => { ctx = await freshDb(); await seedDigitalProducts(ctx.db); });

describe("vitrine pública da Loja NextLevel", () => {
  it("semente é idempotente e o Pix leva o desconto sobre o valor cheio do cartão", async () => {
    expect(await seedDigitalProducts(ctx.db)).toBe(false);
    const list = await listDigitalProducts(ctx.db);
    expect(list.length).toBeGreaterThanOrEqual(3);
    const p = list.find((x) => x.slug === "assessoria-de-lancamento")!;
    expect(p.quote.listCents).toBe(149700);
    expect(p.quote.pixCents).toBe(149700 - Math.round(149700 * 0.1));
    expect(p.quote.installments).toBe(6);
  });
  it("só o Master edita; produto oculto some da vitrine e não é vendável", async () => {
    const p = (await listDigitalProducts(ctx.db)).find((x) => x.slug === "pacote-de-criativos")!;
    await expect(updateDigitalProduct(ctx.db, ctx.actors.mantos, p.id, { active: false })).rejects.toThrow(/NextLevel/);
    await updateDigitalProduct(ctx.db, ctx.actors.master, p.id, { active: false });
    expect(await getDigitalProduct(ctx.db, "pacote-de-criativos")).toBeNull();
    await expect(createNlOrder(ctx.db, { slug: "pacote-de-criativos", method: "PIX", ...buyer }, { demo: true, ...base })).rejects.toThrow(/não encontrado/);
    await updateDigitalProduct(ctx.db, ctx.actors.master, p.id, { active: true });
  });
});

describe("compra em 1 clique", () => {
  it("demonstração: cria pedido com Pix no valor com desconto, reaproveita a cobrança e quita pelo link secreto", async () => {
    const a = await createNlOrder(ctx.db, { slug: "configuracao-profissional", method: "PIX", ...buyer }, { demo: true, ...base });
    expect(a.demo).toBe(true); expect(a.chargedCents).toBe(59700 - Math.round(59700 * 0.1)); expect(a.pixCode).toBeTruthy();
    const again = await createNlOrder(ctx.db, { slug: "configuracao-profissional", method: "PIX", ...buyer }, { demo: true, ...base });
    expect(again.orderId).toBe(a.orderId);
    const before = await getNlOrderByToken(ctx.db, a.token);
    expect(before!.order.status).toBe("AWAITING_PAYMENT"); expect(before!.order.buyerEmail).toBe("maria@exemplo.com"); expect(before!.order.buyerPhone).toBe("11958784061"); expect(before!.order.number).toBeGreaterThan(1000);
    await simulateNlPayment(ctx.db, a.token);
    const after = await getNlOrderByToken(ctx.db, a.token);
    expect(after!.order.status).toBe("PAID"); expect(after!.order.paidAt).toBeTruthy();
    await simulateNlPayment(ctx.db, a.token); // idempotente
    expect(await getNlOrderByToken(ctx.db, "token-inexistente")).toBeNull();
  });
  it("cartão cobra o valor cheio e devolve o checkout do Mercado Pago (real, com conta conectada)", async () => {
    await connectNextLevelMp(ctx.db, ctx.actors.master, "TEST-1234567890123456789012345", async () => new Response(JSON.stringify({ id: 1, nickname: "NL" }), { status: 200 }));
    let body: { items: { unit_price: number }[]; payment_methods: { installments: number } } | undefined;
    const fetchImpl = async (url: string, init?: RequestInit) => { if (url.includes("/checkout/preferences")) { body = JSON.parse(String(init?.body)); return new Response(JSON.stringify({ id: "p1", init_point: "https://mp.example/pay" }), { status: 200 }); } return new Response("{}", { status: 200 }); };
    const r = await createNlOrder(ctx.db, { slug: "trilha-vendas-esportivas", method: "CARD", ...buyer }, { ...base, fetchImpl });
    expect(r.checkoutUrl).toBe("https://mp.example/pay"); expect(r.chargedCents).toBe(19700);
    expect(body!.items[0]!.unit_price).toBe(197); expect(body!.payment_methods.installments).toBe(6);
  });
  it("Pix real: confirmação só vale com a API do Mercado Pago (referência e valor conferidos)", async () => {
    let paidStatus = "pending";
    const fetchImpl = async (url: string, init?: RequestInit) => {
      if (url.endsWith("/v1/payments") && init?.method === "POST") return new Response(JSON.stringify({ id: 777, point_of_interaction: { transaction_data: { qr_code: "PIXCODE", qr_code_base64: "QR" } } }), { status: 200 });
      if (url.includes("/v1/payments/777")) { const o = (await ctx.db.select().from(nlOrders).where(eq(nlOrders.mpPaymentId, "777")))[0]!; return new Response(JSON.stringify({ id: 777, status: paidStatus, external_reference: o.id, transaction_amount: o.chargedCents / 100 }), { status: 200 }); }
      return new Response("{}", { status: 200 });
    };
    const r = await createNlOrder(ctx.db, { slug: "assessoria-de-lancamento", method: "PIX", ...buyer, email: "joao@exemplo.com" }, { ...base, fetchImpl });
    expect(r.pixCode).toBe("PIXCODE");
    expect((await syncNlOrder(ctx.db, r.orderId, fetchImpl)).paid).toBe(false);
    paidStatus = "approved";
    expect((await syncNlOrder(ctx.db, r.orderId, fetchImpl)).paid).toBe(true);
    expect((await getNlOrderByToken(ctx.db, r.token))!.order.status).toBe("PAID");
  });
  it("valida os dados do comprador", async () => {
    await expect(createNlOrder(ctx.db, { slug: "assessoria-de-lancamento", method: "PIX", name: "Jo", email: "x", phone: "1" }, { demo: true, ...base })).rejects.toThrow();
  });
});

describe("CRM (Master)", () => {
  it("só o Master vê o funil; etapas seguem a ordem e cada mudança fica no histórico", async () => {
    await expect(listNlOrders(ctx.db, ctx.actors.mantos)).rejects.toThrow(/NextLevel/);
    const paid = (await listNlOrders(ctx.db, ctx.actors.master)).filter((o) => o.status === "PAID");
    expect(paid.length).toBeGreaterThan(0);
    const id = paid[0]!.id;
    await expect(advanceNlOrder(ctx.db, ctx.actors.master, id, "AWAITING_PAYMENT")).rejects.toThrow(/não é permitida/);
    await advanceNlOrder(ctx.db, ctx.actors.master, id, "CONTACTED");
    await addNlNote(ctx.db, ctx.actors.master, id, "Falei no WhatsApp, briefing na terça.");
    await advanceNlOrder(ctx.db, ctx.actors.master, id, "IN_PROGRESS");
    await advanceNlOrder(ctx.db, ctx.actors.master, id, "DELIVERED");
    await expect(advanceNlOrder(ctx.db, ctx.actors.master, id, "CANCELED")).rejects.toThrow(/não é permitida/);
    const d = await getNlOrder(ctx.db, ctx.actors.master, id);
    expect(d.order.status).toBe("DELIVERED");
    expect(d.notes.map((n) => n.kind)).toEqual(expect.arrayContaining(["SYSTEM", "STATUS", "NOTE"]));
    await expect(addNlNote(ctx.db, ctx.actors.arena, id, "x")).rejects.toThrow(/NextLevel/);
  });
  it("resumo: receita conta só pedidos pagos e o pedido aguardando pagamento pode ser cancelado", async () => {
    const s = await nlSalesSummary(ctx.db, ctx.actors.master);
    expect(s.revenueCents).toBeGreaterThan(0);
    const awaiting = (await listNlOrders(ctx.db, ctx.actors.master)).find((o) => o.status === "AWAITING_PAYMENT");
    if (awaiting) { await advanceNlOrder(ctx.db, ctx.actors.master, awaiting.id, "CANCELED"); expect((await nlSalesSummary(ctx.db, ctx.actors.master)).awaiting).toBe(s.awaiting - 1); }
  });
});
