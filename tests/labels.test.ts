import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { PDFDocument } from "pdf-lib";
import { freshDb, customer } from "./setup";
import { createOrder } from "@/lib/domain/orders";
import { addLabelFile, getLabelBytes, listLabelFiles, mergeLabels, removeLabelFile, MAX_LABEL_BYTES } from "@/lib/domain/labels";
import { makeDemoLabelPdf } from "@/lib/labels-demo";
import { orders } from "@/db/schema";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

const v = (i: number, size: string) => ctx.seed.variantsByProduct.get(ctx.seed.productIds[i]!)!.find((x) => x.size === size)!.id;
const place = (store: "mantos" | "arena" = "mantos") => createOrder(ctx.db, { storeId: ctx.seed.stores[store].id, customer, items: [{ productId: ctx.seed.productIds[store === "mantos" ? 11 : 4]!, variantId: v(store === "mantos" ? 11 : 4, "M"), quantity: 1 }], customerPaymentStatus: "PAID" });
const pdf = (n: number) => makeDemoLabelPdf(n);
const dispatch = () => ({ ...ctx.actors.supplier, role: "SUPPLIER_DISPATCH" as const });

describe("etiqueta como arquivo", () => {
  it("anexar PDF deixa o pedido pronto para separação (saldo já debitado)", async () => {
    const o = await place();
    expect(o.status).toBe("AWAITING_LABEL");
    const r = await addLabelFile(ctx.db, ctx.actors.mantos, o.orderId, { filename: "etiqueta.pdf", bytes: await pdf(1) });
    expect(r.status).toBe("READY_TO_PICK");
    expect((await listLabelFiles(ctx.db, ctx.actors.mantos, o.orderId))).toHaveLength(1);
  });

  it("recusa arquivo que não é PDF, vazio, grande demais e duplicado", async () => {
    const o = await place();
    await expect(addLabelFile(ctx.db, ctx.actors.mantos, o.orderId, { filename: "x.pdf", bytes: new TextEncoder().encode("<html>não sou pdf</html>") })).rejects.toThrow(/PDF/);
    await expect(addLabelFile(ctx.db, ctx.actors.mantos, o.orderId, { filename: "x.pdf", bytes: new Uint8Array() })).rejects.toThrow(/vazio/);
    const big = new Uint8Array(MAX_LABEL_BYTES + 1); big.set(new TextEncoder().encode("%PDF-1.4"));
    await expect(addLabelFile(ctx.db, ctx.actors.mantos, o.orderId, { filename: "x.pdf", bytes: big })).rejects.toThrow(/3 MB/);
    const ok = await pdf(2);
    await addLabelFile(ctx.db, ctx.actors.mantos, o.orderId, { filename: "a.pdf", bytes: ok });
    await expect(addLabelFile(ctx.db, ctx.actors.mantos, o.orderId, { filename: "b.pdf", bytes: ok })).rejects.toThrow(/já foi anexado/);
  });

  it("limita a 5 arquivos por pedido", async () => {
    const o = await place();
    for (let i = 0; i < 5; i++) await addLabelFile(ctx.db, ctx.actors.mantos, o.orderId, { filename: `e${i}.pdf`, bytes: await pdf(100 + i) });
    await expect(addLabelFile(ctx.db, ctx.actors.mantos, o.orderId, { filename: "e6.pdf", bytes: await pdf(200) })).rejects.toThrow(/No máximo 5/);
  });

  it("só o lojista dono anexa; outro lojista, fornecedor e expedição não", async () => {
    const o = await place();
    const bytes = await pdf(3);
    await expect(addLabelFile(ctx.db, ctx.actors.arena, o.orderId, { filename: "a.pdf", bytes })).rejects.toThrow(/não permitido/);
    await expect(addLabelFile(ctx.db, ctx.actors.supplier, o.orderId, { filename: "a.pdf", bytes })).rejects.toThrow();
    await expect(addLabelFile(ctx.db, dispatch(), o.orderId, { filename: "a.pdf", bytes })).rejects.toThrow();
  });

  it("download respeita o isolamento: dono, Central e master podem; outra loja não", async () => {
    const o = await place();
    const { id } = await addLabelFile(ctx.db, ctx.actors.mantos, o.orderId, { filename: "a.pdf", bytes: await pdf(4) });
    for (const a of [ctx.actors.mantos, ctx.actors.supplier, dispatch(), ctx.actors.master]) expect((await getLabelBytes(ctx.db, a, o.orderId, id)).bytes.length).toBeGreaterThan(100);
    await expect(getLabelBytes(ctx.db, ctx.actors.arena, o.orderId, id)).rejects.toThrow(/não permitido/);
  });

  it("remover o último arquivo devolve o pedido a 'Aguardando etiqueta'", async () => {
    const o = await place();
    const { id } = await addLabelFile(ctx.db, ctx.actors.mantos, o.orderId, { filename: "a.pdf", bytes: await pdf(5) });
    await removeLabelFile(ctx.db, ctx.actors.mantos, o.orderId, id);
    const row = await ctx.db.query.orders.findFirst({ where: eq(orders.id, o.orderId) });
    expect(row?.status).toBe("AWAITING_LABEL");
    expect(row?.shippingLabelStatus).toBe("PENDING");
  });

  it("lote junta as páginas de vários pedidos, só para a Central", async () => {
    const a = await place(); const b = await place();
    await addLabelFile(ctx.db, ctx.actors.mantos, a.orderId, { filename: "a.pdf", bytes: await pdf(10) });
    await addLabelFile(ctx.db, ctx.actors.mantos, b.orderId, { filename: "b.pdf", bytes: await pdf(11) });
    const merged = await mergeLabels(ctx.db, dispatch(), [a.orderId, b.orderId]);
    expect(merged.pages).toBe(2);
    expect((await PDFDocument.load(merged.bytes)).getPageCount()).toBe(2);
    await expect(mergeLabels(ctx.db, ctx.actors.mantos, [a.orderId])).rejects.toThrow();
    await expect(mergeLabels(ctx.db, ctx.actors.supplier, [])).rejects.toThrow(/ao menos um/);
  });
});
