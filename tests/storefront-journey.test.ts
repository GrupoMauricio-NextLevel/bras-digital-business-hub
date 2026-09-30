import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb, customer } from "./setup";
import { orders, productVariants, storeAssets } from "@/db/schema";
import { createOrder, advanceOrder, registerShippingLabel } from "@/lib/domain/orders";
import { journeyStepOf, toTracked, trackOrder } from "@/lib/domain/tracking";
import { saveStoreAsset, setStoreLogo, sniffImage } from "@/lib/domain/assets";
import { normalizeTemplate } from "@/lib/themes/template";
import { SECTION_SCHEMAS } from "@/lib/themes/sections";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
const PNG = "data:image/png;base64," + Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0]).toString("base64");

async function place(storeKey: "mantos" | "arena" = "mantos", email = "cliente@teste.com") {
  const pid = ctx.seed.productIds[0]!;
  const v = (await ctx.db.select().from(productVariants).where(eq(productVariants.productId, pid)))[0]!;
  return createOrder(ctx.db, { storeId: ctx.seed.stores[storeKey].id, customer: { ...customer, email }, items: [{ productId: pid, variantId: v.id, quantity: 1 }], customerPaymentStatus: "PAID" });
}

describe("acompanhamento do pedido pelo cliente final", () => {
  it("exige número e e-mail da própria loja; e-mail errado ou outra loja não revela nada", async () => {
    const o = await place("mantos", "Maria@Teste.com");
    const ok = await trackOrder(ctx.db, ctx.seed.stores.mantos.id, { number: String(o.number), email: "maria@teste.com" });
    expect(ok?.number).toBe(o.number); expect(ok?.step).toBe("PAID");
    expect(await trackOrder(ctx.db, ctx.seed.stores.mantos.id, { number: String(o.number), email: "outra@teste.com" })).toBeNull();
    expect(await trackOrder(ctx.db, ctx.seed.stores.arena.id, { number: String(o.number), email: "maria@teste.com" })).toBeNull();
    expect(await trackOrder(ctx.db, ctx.seed.stores.mantos.id, { number: "abc", email: "maria@teste.com" })).toBeNull();
  });
  it("mostra a etapa certa, o rastreio só depois do envio e nunca custo ou fornecedor", async () => {
    const o = await place();
    const row = () => ctx.db.query.orders.findFirst({ where: eq(orders.id, o.orderId) }).then((r) => r!);
    expect(journeyStepOf(await row())).toBe("PAID");
    await registerShippingLabel(ctx.db, ctx.actors.mantos, o.orderId, { code: "BR123456789", carrier: "Correios" });
    await advanceOrder(ctx.db, ctx.actors.supplier, o.orderId, "PICKING");
    expect(journeyStepOf(await row())).toBe("PREPARING");
    expect((await toTracked(ctx.db, await row())).trackingCode).toBeNull();
    await advanceOrder(ctx.db, ctx.actors.supplier, o.orderId, "READY_TO_SHIP"); await advanceOrder(ctx.db, ctx.actors.supplier, o.orderId, "SHIPPED");
    const t = await toTracked(ctx.db, await row());
    expect(t.step).toBe("SHIPPED"); expect(t.trackingCode).toBe("BR123456789"); expect(t.carrier).toBe("Correios");
    const json = JSON.stringify(t);
    for (const banned of ["costTotalCents", "unitCostCents", "supplierId", "email"]) expect(json).not.toContain(banned);
  });
});

describe("imagens da loja", () => {
  it("reconhece o tipo pelos bytes e guarda só para o dono, com a oferta que libera", async () => {
    expect(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe("image/jpeg");
    expect(sniffImage(Buffer.from("<svg onload=alert(1)>"))).toBeNull();
    const url = await saveStoreAsset(ctx.db, ctx.actors.mantos, ctx.seed.stores.mantos.id, PNG);
    expect(url).toMatch(/^\/assets\/ast_/);
    expect((await ctx.db.select().from(storeAssets)).length).toBe(1);
    await expect(saveStoreAsset(ctx.db, ctx.actors.arena, ctx.seed.stores.mantos.id, PNG)).rejects.toThrow();
    await expect(saveStoreAsset(ctx.db, ctx.actors.supplier, ctx.seed.stores.mantos.id, PNG)).rejects.toThrow();
    await expect(saveStoreAsset(ctx.db, ctx.actors.mantos, ctx.seed.stores.mantos.id, "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).rejects.toThrow(/PNG, JPG ou WebP/);
    await expect(saveStoreAsset(ctx.db, ctx.actors.mantos, ctx.seed.stores.mantos.id, "data:image/png;base64," + Buffer.from("não é imagem").toString("base64"))).rejects.toThrow(/não é uma imagem/);
  });
  it("define a logo só com endereço de imagem da loja ou https", async () => {
    await setStoreLogo(ctx.db, ctx.actors.mantos, ctx.seed.stores.mantos.id, "https://exemplo.com/logo.png");
    await expect(setStoreLogo(ctx.db, ctx.actors.mantos, ctx.seed.stores.mantos.id, "javascript:alert(1)")).rejects.toThrow();
    await setStoreLogo(ctx.db, ctx.actors.mantos, ctx.seed.stores.mantos.id, null);
  });
});

describe("selos e credibilidade", () => {
  it("as novas seções existem, são válidas e as de rodapé/conteúdo entram nas regiões certas", () => {
    for (const type of ["security-seals", "store-about", "whatsapp-float"]) expect(SECTION_SCHEMAS.some((s) => s.type === type)).toBe(true);
    const t = normalizeTemplate({ v: 1, sections: { wa: { type: "whatsapp-float", settings: { position: "x" }, blocks: {}, blockOrder: [] } }, order: ["wa"] }, "footer", undefined).template;
    expect(t.sections.wa?.settings.position).toBe("right");
  });
});
