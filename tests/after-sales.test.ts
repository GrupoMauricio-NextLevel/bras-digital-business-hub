import { describe, expect, it, beforeAll } from "vitest";
import { createDatabase, type Database } from "@/db/client";
import { runMigrations } from "@/db/migrate";
import { seedDatabase } from "@/db/seed";
import { seedShowcase } from "@/db/showcase";
import { eq } from "drizzle-orm";
import { stores, users, orders, orderEvents } from "@/db/schema";
import { actorFromUser } from "@/lib/domain/access";
import { addOrderNote, attentionFor, labelQueue, loadAfterSales, messageFor, stageOf, whatsappUrl } from "@/lib/domain/after-sales";

let db: Database;
beforeAll(async () => { ({ db } = (await createDatabase("pglite://memory")) as { db: Database }); await runMigrations(db); await seedDatabase(db); await seedShowcase(db); }, 120_000);
const actorOf = async (email: string) => actorFromUser((await db.query.users.findFirst({ where: eq(users.email, email) }))!);

describe("pós-venda: regras puras", () => {
  it("mapeia status do pedido para estágios de atendimento", () => {
    expect(stageOf({ status: "PENDING", customerPaymentStatus: "PENDING" })).toBe("AWAITING_CUSTOMER");
    expect(stageOf({ status: "AWAITING_CENTRAL_PAYMENT", customerPaymentStatus: "PAID" })).toBe("AWAITING_FUNDS");
    expect(stageOf({ status: "PICKING", customerPaymentStatus: "PAID" })).toBe("IN_DISPATCH");
    expect(stageOf({ status: "SHIPPED", customerPaymentStatus: "PAID" })).toBe("IN_TRANSIT");
    expect(stageOf({ status: "CANCELED", customerPaymentStatus: "PAID" })).toBeNull();
  });
  it("alerta só quando o pedido passa do prazo do estágio", () => {
    expect(attentionFor("AWAITING_LABEL", 5)).toBeNull();
    expect(attentionFor("AWAITING_LABEL", 13)).toMatch(/12h/);
    expect(attentionFor("IN_TRANSIT", 24 * 8)).toMatch(/7 dias/);
    expect(attentionFor("DELIVERED", 9999)).toBeNull();
  });
  it("monta o link de WhatsApp com DDI do Brasil e mensagem pronta", () => {
    const msg = messageFor("IN_TRANSIT", { number: 1010, customerName: "Rafael Monteiro", trackingCode: "SF123BR" }, "MRS Sports");
    expect(msg).toContain("SF123BR");
    expect(whatsappUrl("(11) 97777-1234", msg)).toMatch(/^https:\/\/wa\.me\/5511977771234\?text=/);
    expect(whatsappUrl("123", msg)).toBeNull();
    expect(whatsappUrl(null, msg)).toBeNull();
  });
});

describe("pós-venda: dados da vitrine", () => {
  it("agrupa os pedidos da loja por estágio e destaca os que precisam de atenção", async () => {
    const d = await loadAfterSales(db, await actorOf("loja@mrssports.demo"));
    expect(d.summary.inProgress).toBeGreaterThan(5);
    expect(d.byStage.IN_TRANSIT.length).toBeGreaterThan(0);
    expect(d.byStage.AWAITING_FUNDS.length).toBeGreaterThan(0);
    expect(d.byStage.IN_TRANSIT[0]!.tracking?.code).toMatch(/^SF\d+BR$/);
    expect(d.orders.every((o) => o.stage !== null)).toBe(true);
  });
  it("outro lojista e o fornecedor não usam a área; anotação respeita o dono do pedido", async () => {
    await expect(loadAfterSales(db, await actorOf("megatron@superdrop.demo"))).rejects.toThrow();
    const mrs = await actorOf("loja@mrssports.demo");
    const store = await db.query.stores.findFirst({ where: eq(stores.slug, "mrs-sports") });
    const order = (await db.select().from(orders).where(eq(orders.storeId, store!.id)))[0]!;
    await addOrderNote(db, mrs, order.id, "Cliente pediu para trocar de tamanho.");
    expect((await db.select().from(orderEvents).where(eq(orderEvents.orderId, order.id))).some((e) => e.type === "NOTE")).toBe(true);
    await expect(addOrderNote(db, mrs, order.id, "x")).rejects.toThrow();
    await expect(addOrderNote(db, await actorOf("dono@arena10.demo"), order.id, "Não é meu pedido.")).rejects.toThrow(/não permitido/);
    await expect(addOrderNote(db, await actorOf("megatron@superdrop.demo"), order.id, "Fornecedor não anota.")).rejects.toThrow();
  });
  it("fila de etiquetas traz pedidos que esperam o PDF", async () => {
    const q = await labelQueue(db, await actorOf("loja@mrssports.demo"));
    expect(q.some((r) => r.order.status === "AWAITING_LABEL" && r.labelCount === 0)).toBe(true);
  });
});
