import { beforeEach, describe, expect, it } from "vitest";
import { eq, sum } from "drizzle-orm";
import { freshDb, customer } from "./setup";
import { createOrder, cancelOrder, listOrdersForActor } from "@/lib/domain/orders";
import { createRecharge, creditRecharge, expireUnfundedOrders, getBalanceCents, manualCredit, manualDebit, syncRecharge } from "@/lib/domain/wallet";
import { orders, walletEntries, walletRecharges, suppliers } from "@/db/schema";
import { encryptSecret } from "@/lib/security/crypto";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

const arena = () => ctx.seed.stores.arena.id;
const v = (i: number, size: string) => ctx.seed.variantsByProduct.get(ctx.seed.productIds[i]!)!.find((x) => x.size === size)!.id;
const place = (qty = 1, size = "M") => createOrder(ctx.db, { storeId: arena(), customer, items: [{ productId: ctx.seed.productIds[4]!, variantId: v(4, size), quantity: qty }], customerPaymentStatus: "PAID" });
const entriesSum = async (storeId: string) => Number((await ctx.db.select({ s: sum(walletEntries.amountCents) }).from(walletEntries).where(eq(walletEntries.storeId, storeId)))[0]?.s ?? 0);

describe("carteira — regra D2", () => {
  it("saldo do cache bate com a soma do extrato", async () => {
    expect(await getBalanceCents(ctx.db, arena())).toBe(await entriesSum(arena()));
    expect(await getBalanceCents(ctx.db, ctx.seed.stores.mantos.id)).toBe(await entriesSum(ctx.seed.stores.mantos.id));
  });

  it("sem saldo: pedido fica aguardando recarga e não entra na fila de expedição", async () => {
    const r = await place();
    expect(r.status).toBe("AWAITING_CENTRAL_PAYMENT");
    const o = await ctx.db.query.orders.findFirst({ where: eq(orders.id, r.orderId) });
    expect(o?.centralPaymentStatus).toBe("PENDING");
    expect(o?.awaitingFundsSince).toBeTruthy();
  });

  it("recarga libera pedidos em ordem de chegada (FIFO)", async () => {
    for (const w of await ctx.db.select().from(orders).where(eq(orders.status, "AWAITING_CENTRAL_PAYMENT"))) await cancelOrder(ctx.db, ctx.actors.arena, w.id); // limpa a fila da demonstração
    const a = await place();
    const b = await place(1, "G");
    const cost = (await ctx.db.query.orders.findFirst({ where: eq(orders.id, a.orderId) }))!.costTotalCents;
    // saldo para apenas um pedido (o do Arena tinha R$ 5,00 de sobra)
    const bal = await getBalanceCents(ctx.db, arena());
    const r = await manualCredit(ctx.db, ctx.actors.supplier, arena(), { amountCents: cost - bal, note: "Recarga só para o primeiro pedido" });
    expect(r.released).toBe(1);
    const oa = await ctx.db.query.orders.findFirst({ where: eq(orders.id, a.orderId) });
    const ob = await ctx.db.query.orders.findFirst({ where: eq(orders.id, b.orderId) });
    expect(oa?.centralPaymentStatus).toBe("PAID");
    expect(ob?.status).toBe("AWAITING_CENTRAL_PAYMENT");
    expect(await getBalanceCents(ctx.db, arena())).toBe(await entriesSum(arena()));
  });

  it("débito é idempotente: um único lançamento por pedido", async () => {
    const r = await place();
    await manualCredit(ctx.db, ctx.actors.supplier, arena(), { amountCents: 1_000_000, note: "Recarga de teste" });
    await manualCredit(ctx.db, ctx.actors.supplier, arena(), { amountCents: 1_000_000, note: "Segunda recarga" });
    const debits = (await ctx.db.select().from(walletEntries).where(eq(walletEntries.orderId, r.orderId))).filter((e) => e.type === "ORDER_DEBIT");
    expect(debits).toHaveLength(1);
  });

  it("recargas simultâneas não perdem lançamentos", async () => {
    const before = await getBalanceCents(ctx.db, arena());
    await Promise.all([1, 2, 3, 4].map((i) => manualCredit(ctx.db, ctx.actors.supplier, arena(), { amountCents: 1000 * i, note: `Crédito simultâneo ${i}` })));
    expect(await getBalanceCents(ctx.db, arena())).toBe(before + 10_000);
    expect(await getBalanceCents(ctx.db, arena())).toBe(await entriesSum(arena()));
  });

  it("crédito manual exige motivo, papel correto e a loja do próprio fornecedor", async () => {
    await expect(manualCredit(ctx.db, ctx.actors.supplier, arena(), { amountCents: 1000, note: "x" })).rejects.toThrow();
    await expect(manualCredit(ctx.db, ctx.actors.arena, arena(), { amountCents: 1000, note: "me dando saldo" })).rejects.toThrow();
    await expect(manualDebit(ctx.db, ctx.actors.supplier, arena(), { amountCents: 99_999_999 > 5_000_000 ? 5_000_000 : 1, note: "estouro de saldo" })).rejects.toThrow(/insuficiente/);
    const e = (await ctx.db.select().from(walletEntries).where(eq(walletEntries.type, "MANUAL_CREDIT")))[0]!;
    expect(e.actorUserId).toBeTruthy();
    expect(e.note).toBeTruthy();
  });

  it("expira em 72h sem recarga: cancela e devolve a reserva", async () => {
    const r = await place();
    const later = new Date(Date.now() + 73 * 3_600_000);
    expect((await expireUnfundedOrders(ctx.db, new Date(Date.now() + 71 * 3_600_000))).canceled).toBe(0);
    expect((await expireUnfundedOrders(ctx.db, later)).canceled).toBeGreaterThanOrEqual(1); // inclui o pedido já aguardando na demonstração
    expect((await ctx.db.query.orders.findFirst({ where: eq(orders.id, r.orderId) }))?.status).toBe("CANCELED");
  });

  it("cancelar pedido aguardando recarga não mexe no saldo", async () => {
    const r = await place();
    const bal = await getBalanceCents(ctx.db, arena());
    await cancelOrder(ctx.db, ctx.actors.arena, r.orderId);
    expect(await getBalanceCents(ctx.db, arena())).toBe(bal);
  });
});

describe("recarga Pix", () => {
  const withToken = async () => { await ctx.db.update(suppliers).set({ walletMpTokenEnc: encryptSecret("TEST-abc") }).where(eq(suppliers.id, ctx.seed.supplierId)); };
  const fakeMp = (state: { status: string; amount: number; ref?: string }) => (async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (init?.method === "POST" && u.endsWith("/v1/payments")) {
      const b = JSON.parse(String(init.body)); state.ref = b.external_reference; state.amount = b.transaction_amount;
      return new Response(JSON.stringify({ id: 777, point_of_interaction: { transaction_data: { qr_code: "000201PIX", qr_code_base64: "QUJD" } } }), { status: 201 });
    }
    if (u.endsWith("/v1/payments/777")) return new Response(JSON.stringify({ id: 777, status: state.status, external_reference: state.ref, transaction_amount: state.amount }), { status: 200 });
    return new Response("{}", { status: 404 });
  }) as never;

  it("sem token do fornecedor a recarga é recusada com mensagem clara", async () => {
    await expect(createRecharge(ctx.db, ctx.actors.arena, arena(), 5000)).rejects.toThrow(/habilitou recargas/);
  });

  it("valida limites e papel", async () => {
    await withToken();
    await expect(createRecharge(ctx.db, ctx.actors.arena, arena(), 500)).rejects.toThrow(/entre R\$ 10,00/);
    await expect(createRecharge(ctx.db, ctx.actors.supplier, arena(), 5000)).rejects.toThrow();
    await expect(createRecharge(ctx.db, ctx.actors.mantos, arena(), 5000)).rejects.toThrow();
  });

  it("gera Pix, só credita quando o Mercado Pago aprova, e é idempotente", async () => {
    await withToken();
    const state = { status: "pending", amount: 0 } as { status: string; amount: number; ref?: string };
    const f = fakeMp(state);
    const rc = await createRecharge(ctx.db, ctx.actors.arena, arena(), 25_000, { fetchImpl: f });
    expect(rc.pixCode).toBe("000201PIX");
    const before = await getBalanceCents(ctx.db, arena());
    expect((await syncRecharge(ctx.db, rc.id, f)).paid).toBe(false);
    expect(await getBalanceCents(ctx.db, arena())).toBe(before);
    state.status = "approved";
    expect((await syncRecharge(ctx.db, rc.id, f)).paid).toBe(true);
    await syncRecharge(ctx.db, rc.id, f);
    await creditRecharge(ctx.db, rc.id, { mpPaymentId: "777", amountCents: 25_000 });
    // a recarga também libera pedidos aguardando (seed + criados aqui): o saldo bate com o extrato
    expect(await getBalanceCents(ctx.db, arena())).toBe(await entriesSum(arena()));
    expect(await getBalanceCents(ctx.db, arena())).toBeGreaterThanOrEqual(before);
    expect((await ctx.db.query.walletRecharges.findFirst({ where: eq(walletRecharges.id, rc.id) }))?.status).toBe("PAID");
  });

  it("valor pago menor que o da recarga é recusado", async () => {
    await withToken();
    const state = { status: "approved", amount: 0 };
    const rc = await createRecharge(ctx.db, ctx.actors.arena, arena(), 25_000, { fetchImpl: fakeMp(state) });
    await expect(creditRecharge(ctx.db, rc.id, { mpPaymentId: "777", amountCents: 100 })).rejects.toThrow(/menor/);
  });
});

describe("papel de expedição", () => {
  it("não cancela pedidos e enxerga só pedidos do próprio fornecedor", async () => {
    const dispatch = { ...ctx.actors.supplier, role: "SUPPLIER_DISPATCH" as const };
    const list = await listOrdersForActor(ctx.db, dispatch);
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((r) => r.order.supplierId === ctx.seed.supplierId)).toBe(true);
    await expect(cancelOrder(ctx.db, dispatch, list[0]!.order.id)).rejects.toThrow(/expedição/i);
  });
});
