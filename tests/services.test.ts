import { beforeEach, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { services } from "@/db/schema";
import { advanceServiceOrder, getServiceOrder, listServiceOrders, postServiceMessage, recommendServices, requestService } from "@/lib/domain/services";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
const svc = async (key: string) => (await ctx.db.select().from(services)).find((s) => s.key === key)!;

describe("recomendação de serviços", () => {
  it("lojista Drop manual com volume vê o upgrade da vitrine em primeiro, com motivo", async () => {
    const cat = await ctx.db.select().from(services);
    const r = recommendServices({ audience: "lite", offer: "DROP_MANUAL", ordersLast30: 12, activeProducts: 30 }, cat);
    expect(r[0]!.key).toBe("upgrade-loja-superdrop");
    expect(r[0]!.reason).toMatch(/12 pedidos/);
  });
  it("Loja SuperDrop sem logo recebe identidade visual; sem Drop não recebe upgrade que já tem", async () => {
    const cat = await ctx.db.select().from(services);
    const r = recommendServices({ audience: "lite", offer: "STORE_SUBDOMAIN", ordersLast30: 3, activeProducts: 30, hasLogo: false }, cat);
    expect(r.map((x) => x.key)).toContain("identidade-visual");
    expect(r.map((x) => x.key)).not.toContain("upgrade-loja-superdrop");
  });
  it("fornecedor só vê serviços do seu público e não vê o que já pediu", async () => {
    const cat = await ctx.db.select().from(services);
    const r = recommendServices({ audience: "supplier", ordersLast30: 0, activeProducts: 12, networkStores: 2, requested: new Set(["captacao-lojistas"]) }, cat);
    const keys = r.map((x) => x.key);
    expect(keys).toContain("fotos-catalogo");
    expect(keys).not.toContain("captacao-lojistas");
    expect(keys).not.toContain("banners");
  });
});

describe("pedido de serviço", () => {
  it("lojista solicita, conversa e a NextLevel conduz até a entrega", async () => {
    const s = await svc("banners");
    const { id } = await requestService(ctx.db, ctx.actors.mantos, { serviceId: s.id, briefing: "Preciso de banners para o Dia dos Pais." });
    await expect(requestService(ctx.db, ctx.actors.mantos, { serviceId: s.id, briefing: "De novo, o mesmo serviço." })).rejects.toThrow(/em andamento/);
    await postServiceMessage(ctx.db, ctx.actors.mantos, id, "Segue o logo em breve.");
    await expect(advanceServiceOrder(ctx.db, ctx.actors.mantos, id, "IN_PROGRESS")).rejects.toThrow(/NextLevel/);
    await expect(advanceServiceOrder(ctx.db, ctx.actors.master, id, "QUOTED")).rejects.toThrow(/orçamento/);
    await advanceServiceOrder(ctx.db, ctx.actors.master, id, "QUOTED", { quotedCents: 29000 });
    await advanceServiceOrder(ctx.db, ctx.actors.master, id, "IN_PROGRESS");
    await advanceServiceOrder(ctx.db, ctx.actors.master, id, "DELIVERED");
    await expect(advanceServiceOrder(ctx.db, ctx.actors.master, id, "CANCELED")).rejects.toThrow(/não permitida/);
    const d = await getServiceOrder(ctx.db, ctx.actors.mantos, id);
    expect(d.order.status).toBe("DELIVERED");
    expect(d.messages.length).toBeGreaterThanOrEqual(4);
  });
  it("isolamento: outra loja não enxerga; fornecedor não contrata serviço de lojista", async () => {
    const s = await svc("banners");
    const { id } = await requestService(ctx.db, ctx.actors.mantos, { serviceId: s.id, briefing: "Banners para a campanha." });
    await expect(getServiceOrder(ctx.db, ctx.actors.arena, id)).rejects.toThrow(/não permitido/);
    expect(await listServiceOrders(ctx.db, ctx.actors.arena)).toHaveLength(0);
    expect((await listServiceOrders(ctx.db, ctx.actors.master)).length).toBe(1);
    await expect(requestService(ctx.db, ctx.actors.supplier, { serviceId: s.id, briefing: "Quero banners também." })).rejects.toThrow(/perfil/);
    const foto = await svc("fotos-catalogo");
    await expect(requestService(ctx.db, ctx.actors.supplier, { serviceId: foto.id, briefing: "Fotos dos novos modelos." })).resolves.toBeTruthy();
    await expect(requestService(ctx.db, ctx.actors.mantos, { serviceId: foto.id, briefing: "Quero fotos do fornecedor." })).rejects.toThrow(/perfil/);
  });
  it("briefing curto é recusado", async () => {
    await expect(requestService(ctx.db, ctx.actors.mantos, { serviceId: (await svc("banners")).id, briefing: "oi" })).rejects.toThrow();
  });
});

describe("vitrine da Loja NextLevel", () => {
  it("só o master edita preço, destaque e visibilidade", async () => {
    const { updateService } = await import("@/lib/domain/services");
    const s = await svc("banners");
    await expect(updateService(ctx.db, ctx.actors.mantos, s.id, { priceFromCents: 1 })).rejects.toThrow(/NextLevel/);
    await updateService(ctx.db, ctx.actors.master, s.id, { priceFromCents: 35000, featured: true, active: false });
    const after = await svc("banners");
    expect(after.priceFromCents).toBe(35000);
    expect(after.featured).toBe(true);
    expect(after.active).toBe(false);
    await expect(requestService(ctx.db, ctx.actors.mantos, { serviceId: s.id, briefing: "Quero banners mesmo assim." })).rejects.toThrow(/não encontrado/);
  });
});
