import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { activities } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { addBrasVideo } from "@/lib/domain/bras/videos";
import { brasCommercialAccessFor, getBrasMemberByUser, setBrasMemberStatus, signupBrasMember } from "@/lib/domain/bras/membros";
import { addBrasImporter, brasShippingView, createBrasRequest, lastBrasShipping, listBrasFeed, listBrasRequestsForMaster, listMyBrasRequests, removeBrasOffer, setBrasImporterActive, setBrasOffer, setBrasRequestStatus } from "@/lib/domain/bras/catalogo";

/** D92: oferta por vídeo (só membro ativo vê), pedido de compra do membro e visão de envio da importadora. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let member: Actor; let memberId: string; let videoId: string; let importerId: string;
const envio = { carrier: "Braspress", shipName: "Ana Lojista", shipAddress: "Rua das Flores, 100, Centro", shipCity: "Curitiba", shipState: "PR" as const, shipZip: "80010-000" };

beforeEach(async () => {
  ctx = await freshDb();
  const r = await signupBrasMember(ctx.db, { name: "Ana Lojista", companyName: "Ana Utilidades LTDA", cnpj: "11222333000181", whatsapp: "11988887777", email: "ana@utilidades.teste", password: "senha-forte-1" });
  const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
  memberId = m.id;
  member = { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null };
  videoId = (await addBrasVideo(ctx.db, ctx.actors.master, { url: "aaaaaaaaaa1", title: "Garrafa térmica 1 L" })).id;
  importerId = (await addBrasImporter(ctx.db, ctx.actors.master, { name: "Importadora Piloto", notes: "comissão 5%" })).id;
});

describe("oferta do vídeo", () => {
  it("só o Master cadastra importadora e oferta", async () => {
    for (const a of [ctx.actors.supplier, ctx.actors.mantos, member]) {
      await expect(addBrasImporter(ctx.db, a, { name: "Outra" })).rejects.toThrow();
      await expect(setBrasOffer(ctx.db, a, videoId, { importerId, priceBoxCents: 48000, unitsPerBox: 24, boxesAvailable: 10 })).rejects.toThrow();
    }
    await expect(addBrasImporter(ctx.db, ctx.actors.master, { name: "importadora piloto" })).rejects.toMatchObject({ code: "IMPORTER_DUP" });
  });

  it("preço, caixas e importadora só chegam ao membro ativo; visitante, bloqueado e outros papéis recebem só o vídeo", async () => {
    await setBrasOffer(ctx.db, ctx.actors.master, videoId, { importerId, priceBoxCents: 48000, unitsPerBox: 24, boxesAvailable: 10 });
    const ativo = await listBrasFeed(ctx.db, await brasCommercialAccessFor(ctx.db, { user: { id: member.userId, role: "BRAS_MEMBER" } }));
    expect(ativo[0]!.offer).toEqual({ priceBoxCents: 48000, unitsPerBox: 24, boxesAvailable: 10, importerName: "Importadora Piloto" });
    for (const s of [null, { user: { id: ctx.actors.mantos.userId, role: "STORE_OWNER" } }]) {
      const feed = await listBrasFeed(ctx.db, await brasCommercialAccessFor(ctx.db, s));
      expect(feed[0]!.offer).toBeNull();
      expect(JSON.stringify(feed)).not.toMatch(/48000|Importadora Piloto/);
    }
    await setBrasMemberStatus(ctx.db, ctx.actors.master, memberId, "BLOCKED", "teste");
    expect((await listBrasFeed(ctx.db, await brasCommercialAccessFor(ctx.db, { user: { id: member.userId, role: "BRAS_MEMBER" } })))[0]!.offer).toBeNull();
  });

  it("importadora pausada tira a oferta do ar; oferta removida some", async () => {
    await setBrasOffer(ctx.db, ctx.actors.master, videoId, { importerId, priceBoxCents: 48000, unitsPerBox: 24, boxesAvailable: null });
    const acc = await brasCommercialAccessFor(ctx.db, { user: { id: member.userId, role: "BRAS_MEMBER" } });
    await setBrasImporterActive(ctx.db, ctx.actors.master, importerId, false);
    expect((await listBrasFeed(ctx.db, acc))[0]!.offer).toBeNull();
    await expect(createBrasRequest(ctx.db, member, { videoId, boxes: 1, ...envio })).rejects.toMatchObject({ code: "OFFER" });
    await setBrasImporterActive(ctx.db, ctx.actors.master, importerId, true);
    await removeBrasOffer(ctx.db, ctx.actors.master, videoId);
    expect((await listBrasFeed(ctx.db, acc))[0]!.offer).toBeNull();
  });
});

describe("pedido de compra", () => {
  beforeEach(async () => { await setBrasOffer(ctx.db, ctx.actors.master, videoId, { importerId, priceBoxCents: 48000, unitsPerBox: 24, boxesAvailable: 3 }); });

  it("membro ativo pede; preço vem do servidor; total, número e aviso ao Master", async () => {
    const r = await createBrasRequest(ctx.db, member, { videoId, boxes: 2, ...envio, notes: "Retirar à tarde" });
    expect(r.totalCents).toBe(96000);
    const [mine] = await listMyBrasRequests(ctx.db, member);
    expect(mine).toMatchObject({ number: 1001, status: "NEW", boxes: 2, priceBoxCents: 48000, totalCents: 96000, importerName: "Importadora Piloto", productTitle: "Garrafa térmica 1 L", shipZip: "80010000" });
    const avisos = await ctx.db.select().from(activities).where(eq(activities.type, "BRAS_REQUEST"));
    expect(avisos[0]!.message).toContain("2 caixa(s) de Garrafa térmica 1 L");
    expect(avisos[0]!.message).not.toMatch(/Ana|Curitiba|ana@/);
    expect(await lastBrasShipping(ctx.db, member)).toMatchObject({ carrier: "Braspress", shipCity: "Curitiba" });
    // Mudança de preço depois do pedido não altera o pedido já feito.
    await setBrasOffer(ctx.db, ctx.actors.master, videoId, { importerId, priceBoxCents: 50000, unitsPerBox: 24, boxesAvailable: 3 });
    expect((await listMyBrasRequests(ctx.db, member))[0]!.totalCents).toBe(96000);
  });

  it("valida caixas disponíveis, dados de envio e quem pode pedir", async () => {
    await expect(createBrasRequest(ctx.db, member, { videoId, boxes: 4, ...envio })).rejects.toMatchObject({ code: "BOXES" });
    await expect(createBrasRequest(ctx.db, member, { videoId, boxes: 0, ...envio })).rejects.toThrow(/Mínimo de 1 caixa/);
    await expect(createBrasRequest(ctx.db, member, { videoId, boxes: 1, ...envio, shipZip: "123" })).rejects.toThrow(/CEP/);
    await expect(createBrasRequest(ctx.db, ctx.actors.mantos, { videoId, boxes: 1, ...envio })).rejects.toThrow(/membros/);
    await expect(createBrasRequest(ctx.db, ctx.actors.master, { videoId, boxes: 1, ...envio })).rejects.toThrow(/membros/);
    await setBrasMemberStatus(ctx.db, ctx.actors.master, memberId, "BLOCKED", "teste");
    await expect(createBrasRequest(ctx.db, member, { videoId, boxes: 1, ...envio })).rejects.toMatchObject({ code: "MEMBER_BLOCKED" });
  });

  it("Master move o pedido pelo caminho certo; membro não mexe no status; cada membro vê só os seus", async () => {
    const { id } = await createBrasRequest(ctx.db, member, { videoId, boxes: 1, ...envio });
    await expect(setBrasRequestStatus(ctx.db, member, id, "CONFIRMED")).rejects.toThrow();
    await expect(setBrasRequestStatus(ctx.db, ctx.actors.master, id, "PICKED_UP")).rejects.toMatchObject({ code: "STATUS" });
    for (const s of ["CONFIRMED", "PAID", "PICKED_UP"] as const) await setBrasRequestStatus(ctx.db, ctx.actors.master, id, s);
    await expect(setBrasRequestStatus(ctx.db, ctx.actors.master, id, "CANCELED")).rejects.toMatchObject({ code: "STATUS" });
    const outro = await signupBrasMember(ctx.db, { name: "Beto", companyName: "Beto Distribuidora", cnpj: "11444777000161", whatsapp: "21977776666", email: "beto@dist.teste", password: "senha-forte-2" });
    const m2 = (await getBrasMemberByUser(ctx.db, outro.userId))!;
    expect(await listMyBrasRequests(ctx.db, { userId: outro.userId, role: "BRAS_MEMBER", organizationId: m2.organizationId, supplierId: null, storeId: null })).toEqual([]);
    await expect(listBrasRequestsForMaster(ctx.db, member)).rejects.toThrow();
    expect((await listBrasRequestsForMaster(ctx.db, ctx.actors.master))[0]).toMatchObject({ companyName: "Ana Utilidades LTDA", email: "ana@utilidades.teste" });
  });

  it("a importadora recebe só o envio: nada de CNPJ, empresa, contato, observação ou valores", async () => {
    await createBrasRequest(ctx.db, member, { videoId, boxes: 1, ...envio, notes: "segredo interno" });
    const { r } = (await listBrasRequestsForMaster(ctx.db, ctx.actors.master))[0]!;
    const view = brasShippingView(r);
    expect(Object.keys(view).sort()).toEqual(["boxes", "carrier", "number", "productTitle", "shipAddress", "shipCity", "shipName", "shipState", "shipZip", "status", "unitsPerBox"]);
    const txt = JSON.stringify(view);
    for (const proibido of ["11222333000181", "Ana Utilidades", "ana@utilidades.teste", "11988887777", "segredo interno", "48000"]) expect(txt).not.toContain(proibido);
  });
});
