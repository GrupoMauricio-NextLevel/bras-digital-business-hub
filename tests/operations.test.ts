import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb, customer } from "./setup";
import { createOrder } from "@/lib/domain/orders";
import { addLabelFile } from "@/lib/domain/labels";
import { makeDemoLabelPdf } from "@/lib/labels-demo";
import { aggregatePickingList, claimOrder, createDispatchUser, createWave, dispatchAdvance, dispatchSeats, getOps, listWaves, loadEsteira, ordersVersion, releaseClaim, removeDispatchUser, saveOps, supplierOnboarding, waveLabelsPdf } from "@/lib/domain/operations";
import { grantEntitlement } from "@/lib/domain/entitlements";
import { orders, orderClaims } from "@/db/schema";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

const v = (i: number, size: string) => ctx.seed.variantsByProduct.get(ctx.seed.productIds[i]!)!.find((x) => x.size === size)!.id;
const dispatch = (n = 1) => ({ ...ctx.actors.supplier, role: "SUPPLIER_DISPATCH" as const, userId: `disp-${n}` });
/** Pedido pago, com custo debitado e etiqueta anexada: pronto para separar. */
async function readyOrder(size = "M") {
  const o = await createOrder(ctx.db, { storeId: ctx.seed.stores.mantos.id, customer, items: [{ productId: ctx.seed.productIds[11]!, variantId: v(11, size), quantity: 1 }], customerPaymentStatus: "PAID" });
  await addLabelFile(ctx.db, ctx.actors.mantos, o.orderId, { filename: "e.pdf", bytes: await makeDemoLabelPdf(o.number) });
  return o;
}
const MONEY = /cents|price|total|cost|margin|valor|preco|amount|balance|saldo/i;
const keysOf = (x: unknown, acc = new Set<string>()): Set<string> => { if (Array.isArray(x)) x.forEach((i) => keysOf(i, acc)); else if (x && typeof x === "object") for (const [k, val] of Object.entries(x)) { acc.add(k); keysOf(val, acc); } return acc; };

describe("esteira", () => {
  it("expedição não recebe nenhum campo monetário e não vê pedidos aguardando recarga", async () => {
    const d = await loadEsteira(ctx.db, dispatch());
    expect(d.orders.length).toBeGreaterThan(0);
    const bad = [...keysOf(d.orders)].filter((k) => MONEY.test(k));
    expect(bad).toEqual([]);
    expect(d.orders.every((o) => o.status !== "AWAITING_CENTRAL_PAYMENT" && o.status !== "AWAITING_LABEL")).toBe(true);
    const adm = await loadEsteira(ctx.db, ctx.actors.supplier);
    expect(adm.orders.some((o) => o.status === "AWAITING_CENTRAL_PAYMENT")).toBe(true); // o gestor vê a fila de recarga
  });
  it("lojista e master não acessam a esteira do fornecedor", async () => {
    await expect(loadEsteira(ctx.db, ctx.actors.mantos)).rejects.toThrow();
    await expect(loadEsteira(ctx.db, ctx.actors.master)).rejects.toThrow();
  });
  it("versão muda quando algo muda (base do modo ao vivo)", async () => {
    const before = await ordersVersion(ctx.db, ctx.seed.supplierId);
    const o = await readyOrder();
    const mid = await ordersVersion(ctx.db, ctx.seed.supplierId);
    expect(mid).not.toBe(before);
    await claimOrder(ctx.db, dispatch(), o.orderId);
    expect(await ordersVersion(ctx.db, ctx.seed.supplierId)).not.toBe(mid);
  });
});

describe("claims (quem está separando)", () => {
  it("dois funcionários não separam o mesmo pedido; expira em 30 min; gestor libera", async () => {
    const o = await readyOrder();
    const t0 = new Date();
    await claimOrder(ctx.db, dispatch(1), o.orderId, t0);
    await expect(claimOrder(ctx.db, dispatch(2), o.orderId, new Date(t0.getTime() + 60_000))).rejects.toThrow(/já está separando/);
    await claimOrder(ctx.db, dispatch(1), o.orderId, new Date(t0.getTime() + 120_000)); // renova o próprio
    await expect(claimOrder(ctx.db, dispatch(2), o.orderId, new Date(t0.getTime() + 10 * 60_000))).rejects.toThrow();
    await claimOrder(ctx.db, dispatch(2), o.orderId, new Date(t0.getTime() + 40 * 60_000)); // expirou
    await expect(releaseClaim(ctx.db, dispatch(1), o.orderId)).rejects.toThrow();
    await releaseClaim(ctx.db, ctx.actors.supplier, o.orderId);
    expect(await ctx.db.select().from(orderClaims).where(eq(orderClaims.orderId, o.orderId))).toHaveLength(0);
  });
  it("corrida: só um de vários simultâneos assume", async () => {
    const o = await readyOrder();
    const res = await Promise.allSettled([1, 2, 3, 4].map((n) => claimOrder(ctx.db, dispatch(n), o.orderId)));
    expect(res.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  });
  it("separar → conferir → enviar libera o claim e baixa o estoque", async () => {
    const o = await readyOrder();
    await dispatchAdvance(ctx.db, dispatch(1), o.orderId, "PICKING");
    await expect(dispatchAdvance(ctx.db, dispatch(2), o.orderId, "READY_TO_SHIP")).rejects.toThrow(/está separando/);
    await dispatchAdvance(ctx.db, dispatch(1), o.orderId, "READY_TO_SHIP");
    await dispatchAdvance(ctx.db, dispatch(1), o.orderId, "SHIPPED");
    expect((await ctx.db.query.orders.findFirst({ where: eq(orders.id, o.orderId) }))?.status).toBe("SHIPPED");
    expect(await ctx.db.select().from(orderClaims).where(eq(orderClaims.orderId, o.orderId))).toHaveLength(0);
  });
});

describe("ondas", () => {
  it("cria onda só com pedidos prontos e com etiqueta; um pedido não entra em duas ondas", async () => {
    const all = { mon: "23:59", tue: "23:59", wed: "23:59", thu: "23:59", fri: "23:59", sat: "23:59", sun: "23:59" };
    await saveOps(ctx.db, ctx.actors.supplier, { ...(await getOps(ctx.db, ctx.seed.supplierId)), cutoffs: all }); // corte no fim do dia: independe da hora em que o teste roda
    const a = await readyOrder("M"); const b = await readyOrder("G");
    const noLabel = await createOrder(ctx.db, { storeId: ctx.seed.stores.mantos.id, customer, items: [{ productId: ctx.seed.productIds[11]!, variantId: v(11, "P"), quantity: 1 }], customerPaymentStatus: "PAID" });
    const w = await createWave(ctx.db, dispatch(), { orderIds: [a.orderId, noLabel.orderId] });
    expect(w.orderIds).toEqual([a.orderId]);
    await expect(createWave(ctx.db, dispatch(), { orderIds: [a.orderId] })).rejects.toThrow(/Nenhum pedido elegível/);
    const w2 = await createWave(ctx.db, dispatch(), { untilCutoff: true });
    expect(w2.number).toBe(w.number + 1);
    expect(w2.orderIds).toContain(b.orderId);
    expect((await listWaves(ctx.db, dispatch())).length).toBeGreaterThanOrEqual(2);
  });
  it("PDF da onda junta as etiquetas e registra a impressão", async () => {
    const a = await readyOrder("M"); const b = await readyOrder("G");
    const w = await createWave(ctx.db, dispatch(), { orderIds: [a.orderId, b.orderId] });
    const pdf = await waveLabelsPdf(ctx.db, dispatch(), w.id);
    expect(pdf.pages).toBe(2);
    const e = await loadEsteira(ctx.db, dispatch());
    expect(e.orders.find((o) => o.id === a.orderId)?.labelPrinted).toBe(true);
    expect(e.orders.find((o) => o.id === a.orderId)?.wave?.number).toBe(w.number);
  });
  it("lista de separação soma por produto/variação e cita os pedidos", () => {
    const lines = aggregatePickingList([
      { orderId: "1", productName: "Manto A", label: "Tam. M", quantity: 2 },
      { orderId: "2", productName: "Manto A", label: "Tam. M", quantity: 1 },
      { orderId: "2", productName: "Manto A", label: "Tam. G", quantity: 1 },
      { orderId: "3", productName: "Camisa B", label: "Grade 12 (P:2 M:4)", quantity: 1 },
    ], new Map([["1", 1001], ["2", 1002], ["3", 1003]]));
    expect(lines.map((l) => [l.productName, l.label, l.quantity])).toEqual([["Camisa B", "Grade 12", 1], ["Manto A", "Tam. G", 1], ["Manto A", "Tam. M", 3]]);
    expect(lines[2]!.orders).toEqual([1001, 1002]);
  });
});

describe("configuração, equipe e onboarding", () => {
  it("só o gestor salva o corte e valida horários", async () => {
    const ops = await getOps(ctx.db, ctx.seed.supplierId);
    expect(ops.configured).toBe(false);
    await expect(saveOps(ctx.db, dispatch(), ops)).rejects.toThrow();
    await expect(saveOps(ctx.db, ctx.actors.supplier, { ...ops, cutoffs: { ...ops.cutoffs, mon: "99:99" } })).rejects.toThrow(/inválido/);
    await saveOps(ctx.db, ctx.actors.supplier, { ...ops, cutoffs: { ...ops.cutoffs, fri: "12:00" }, holidays: ["2026-12-25", "2026-12-25"] });
    const saved = await getOps(ctx.db, ctx.seed.supplierId);
    expect(saved.configured).toBe(true); expect(saved.cutoffs.fri).toBe("12:00"); expect(saved.holidays).toEqual(["2026-12-25"]);
  });
  it("assentos: 2 de base + add-on; passar do limite pede o add-on", async () => {
    const seats0 = await dispatchSeats(ctx.db, ctx.seed.supplierId);
    const free = seats0.total - seats0.used;
    for (let i = 0; i < free; i++) await createDispatchUser(ctx.db, ctx.actors.supplier, { name: `Func ${i}`, email: `f${i}@teste.com` });
    await expect(createDispatchUser(ctx.db, ctx.actors.supplier, { name: "Extra", email: "extra@teste.com" })).rejects.toThrow(/assento extra/);
    await grantEntitlement(ctx.db, { type: "SUPPLIER", supplierId: ctx.seed.supplierId }, { key: "EXTRA_DISPATCH_SEAT", source: "ADD_ON", months: 1 });
    const r = await createDispatchUser(ctx.db, ctx.actors.supplier, { name: "Extra", email: "extra@teste.com" });
    expect(r.temporaryPassword.length).toBeGreaterThanOrEqual(10);
    await expect(createDispatchUser(ctx.db, ctx.actors.supplier, { name: "Dup", email: "EXTRA@teste.com" })).rejects.toThrow(/Já existe/);
    await expect(createDispatchUser(ctx.db, ctx.actors.mantos, { name: "Hack", email: "h@teste.com" })).rejects.toThrow();
  });
  it("remover só usuários de expedição do próprio fornecedor", async () => {
    await expect(removeDispatchUser(ctx.db, ctx.actors.supplier, ctx.actors.supplier.userId)).rejects.toThrow(/não encontrado/);
  });
  it("onboarding reflete os quatro passos", async () => {
    const before = await supplierOnboarding(ctx.db, ctx.seed.supplierId);
    expect(before.steps.map((s) => s.key)).toEqual(["wallet", "cutoff", "team", "catalog"]);
    expect(before.steps.find((s) => s.key === "cutoff")!.done).toBe(false);
    const ops = await getOps(ctx.db, ctx.seed.supplierId);
    await saveOps(ctx.db, ctx.actors.supplier, ops);
    expect((await supplierOnboarding(ctx.db, ctx.seed.supplierId)).steps.find((s) => s.key === "cutoff")!.done).toBe(true);
  });
});
