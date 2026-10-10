import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { bdRequests, clubReferrals, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { getBrasMemberByUser, signupBrasMember } from "@/lib/domain/bras/membros";
import { addBrasVideo } from "@/lib/domain/bras/videos";
import { addBrasImporter, createBrasRequest, setBrasRequestStatus } from "@/lib/domain/bras/catalogo";
import { createImporterAccess, importerConfirmPickup, markRequestSeparated } from "@/lib/domain/bras/importadora";
import { setBrasOffer } from "@/lib/domain/bras/catalogo";
import { callCarrier, carrierMarkDelivered, createCarrier, createCarrierAccess, loadableRequests, respondLoad, updateCarrierProfile } from "@/lib/domain/cargas/cargas";
import { freightCatalogFor, myFreights } from "@/lib/domain/frete/painel";
import { listCarrierReferrals, myReferrals, referCarrier } from "@/lib/domain/club/indicacoes";
import { requestFreightStatus } from "@/lib/frete/situacao";

/** D113 (fase E1 do Club): catálogo de transportadoras no pedido, painel de frete único e indicação da transportadora. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let ana: Actor; let bia: Actor; let dono: Actor; let vA: string;
const loginComo = async (userId: string) => actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, userId) }))!);
const envio = { shipName: "Ana Recebimento", shipAddress: "Rua das Flores, 100", shipCity: "Curitiba", shipState: "PR" as const, shipZip: "80010-000" };
const rapido = { name: "Rápido Brás Transportes", docType: "CNPJ" as const, document: "11.444.777/0001-61", contactName: "Antônio", phone: "11977776666", ufs: ["SP", "PR"] as ("SP" | "PR")[], vehicles: ["TRUCK"] as "TRUCK"[] };
const onibus = { name: "Mauricio Turismo", docType: "CNPJ" as const, document: "47.173.173/0001-75", contactName: "Mauricio", phone: "11999990000", ufs: ["SP", "MG"] as ("SP" | "MG")[], vehicles: ["ONIBUS_EXCURSAO"] as "ONIBUS_EXCURSAO"[], operation: "EXCURSAO" as const };

async function membro(nome: string, cnpj: string, email: string) {
  const r = await signupBrasMember(ctx.db, { name: nome, companyName: `${nome} LTDA`, cnpj, whatsapp: "11988887777", email, password: "senha-forte-1", acceptTerms: true });
  const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
  return { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null } as Actor;
}

beforeEach(async () => {
  ctx = await freshDb();
  ana = await membro("Ana", "11222333000181", "ana@u.teste");
  bia = await membro("Bia", "11444777000161", "bia@u.teste");
  const imp = (await addBrasImporter(ctx.db, ctx.actors.master, { name: "XDX Importadora" })).id;
  vA = (await addBrasVideo(ctx.db, ctx.actors.master, { url: "aaaaaaaaaa1", title: "Garrafa térmica" })).id;
  await setBrasOffer(ctx.db, ctx.actors.master, vA, { importerId: imp, priceBoxCents: 30_000, unitsPerBox: 24, boxesAvailable: 50 });
  dono = await loginComo((await createImporterAccess(ctx.db, ctx.actors.master, imp, { name: "Dono", email: "dono@xdx.teste", password: "senha-forte-1" })).userId);
});

describe("catálogo de transportadoras no pedido", () => {
  it("o membro escolhe a transportadora do catálogo; o nome vai junto; pausada não pode", async () => {
    const { id: cid } = await createCarrier(ctx.db, ctx.actors.master, rapido);
    const { id } = await createBrasRequest(ctx.db, ana, { videoId: vA, boxes: 2, carrierId: cid, ...envio });
    const r = (await ctx.db.query.bdRequests.findFirst({ where: eq(bdRequests.id, id) }))!;
    expect(r.carrierId).toBe(cid);
    expect(r.carrier).toBe("Rápido Brás Transportes");
    await expect(createBrasRequest(ctx.db, ana, { videoId: vA, boxes: 1, ...envio })).rejects.toThrow(/transportadora ou o ônibus/);
    const outra = await createBrasRequest(ctx.db, ana, { videoId: vA, boxes: 1, carrier: "Braspress", ...envio });
    expect((await ctx.db.query.bdRequests.findFirst({ where: eq(bdRequests.id, outra.id) }))!.carrierId).toBeNull();
    await updateCarrierProfile(ctx.db, ctx.actors.master, cid, { status: "PAUSADA" });
    await expect(createBrasRequest(ctx.db, ana, { videoId: vA, boxes: 1, carrierId: cid, ...envio })).rejects.toThrow(/não está disponível/);
  });

  it("catálogo do cliente: quem atende a UF primeiro, sem documento; ônibus e transportadora juntos", async () => {
    await createCarrier(ctx.db, ctx.actors.master, onibus);
    await createCarrier(ctx.db, ctx.actors.master, rapido);
    const pr = await freightCatalogFor(ctx.db, "PR");
    expect(pr.map((c) => c.name)).toEqual(["Rápido Brás Transportes", "Mauricio Turismo"]);
    expect(pr[0]).not.toHaveProperty("document");
    expect((await freightCatalogFor(ctx.db, "MG"))[0]!.operation).toBe("EXCURSAO");
  });

  it("a importadora recebe a escolha do cliente para chamar a coleta", async () => {
    const { id: cid } = await createCarrier(ctx.db, ctx.actors.master, rapido);
    const { id } = await createBrasRequest(ctx.db, ana, { videoId: vA, boxes: 2, carrierId: cid, ...envio });
    await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "CONFIRMED");
    const [r] = await loadableRequests(ctx.db, dono);
    expect(r!.suggestedCarrierId).toBe(cid);
    expect(r!.carrier).toBe("Rápido Brás Transportes");
  });
});

describe("painel de frete único", () => {
  it("linha do tempo do pedido à entrega, com a coleta da transportadora; outro membro não vê", async () => {
    const { id: cid } = await createCarrier(ctx.db, ctx.actors.master, rapido);
    const t = await loginComo((await createCarrierAccess(ctx.db, ctx.actors.master, cid, { name: "Antônio", email: "a@t.teste", password: "senha-forte-1" })).userId);
    const { id } = await createBrasRequest(ctx.db, ana, { videoId: vA, boxes: 2, carrierId: cid, ...envio });
    let [f] = await myFreights(ctx.db, ana);
    expect(f).toMatchObject({ code: expect.stringMatching(/^BD-/), mode: "TRANSPORTADORA", status: "RESERVADO", destination: "Curitiba/PR", importerName: null });
    expect(f!.carrier).toMatchObject({ id: cid, inCatalog: true });
    await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "CONFIRMED");
    await markRequestSeparated(ctx.db, dono, id);
    expect((await myFreights(ctx.db, ana))[0]!.status).toBe("PRONTO");
    await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "PAID");
    f = (await myFreights(ctx.db, ana))[0];
    expect(f!.pickupCode).toMatch(/^BD-/);
    const load = await callCarrier(ctx.db, dono, { carrierId: cid, requestIds: [id], pickupDate: new Date(Date.now() + 86_400_000 - 3 * 3_600_000).toISOString().slice(0, 10), period: "MANHA" });
    await respondLoad(ctx.db, t, load.id, { accept: true, freightCents: 20_000 });
    await importerConfirmPickup(ctx.db, dono, id, f!.pickupCode!);
    f = (await myFreights(ctx.db, ana))[0];
    expect(f!.status).toBe("EM_VIAGEM");
    expect(f!.loadNumber).toBe(load.number);
    await carrierMarkDelivered(ctx.db, t, load.id);
    f = (await myFreights(ctx.db, ana))[0];
    expect(f!.status).toBe("ENTREGUE");
    expect(f!.steps.every((s) => s.done)).toBe(true);
    // Frete e comissão nunca aparecem para o cliente.
    expect(JSON.stringify(f)).not.toMatch(/freightCents|commission/);
    expect(await myFreights(ctx.db, bia)).toEqual([]);
    await expect(myFreights(ctx.db, dono)).rejects.toThrow();
  });

  it("situação pura: retirado sem coleta é 'coletado'; cancelado não tem linha do tempo", () => {
    const base = { createdAt: "2026-10-10T12:00:00Z", separatedAt: null, pickedUpAt: null };
    expect(requestFreightStatus({ ...base, status: "NEW" }, null).status).toBe("RESERVADO");
    expect(requestFreightStatus({ ...base, status: "PICKED_UP", pickedUpAt: "2026-10-11T12:00:00Z" }, null).status).toBe("COLETADO");
    expect(requestFreightStatus({ ...base, status: "CANCELED" }, null).status).toBe("CANCELADO");
    expect(requestFreightStatus({ ...base, status: "PAID" }, { status: "ENTREGUE", collectedAt: "x", deliveredAt: "y" }).steps.at(-1)!.at).toBe("y");
  });
});

describe("indicação da transportadora ou do ônibus", () => {
  it("indica, recebe o convite; o mesmo WhatsApp vale uma vez; já no catálogo não vira indicação", async () => {
    const r = await referCarrier(ctx.db, ana, { kind: "ONIBUS", name: "Excursão da Cida", contactName: "Cida", phone: "(31) 98888-7777", city: "Belo Horizonte", uf: "MG" });
    expect(r.status).toBe("CREATED");
    expect("whatsappUrl" in r && r.whatsappUrl).toMatch(/^https:\/\/wa\.me\/5531988887777\?text=/);
    expect((await referCarrier(ctx.db, ana, { kind: "ONIBUS", name: "Cida de novo", phone: "5531988887777" })).status).toBe("MINE");
    expect((await referCarrier(ctx.db, bia, { kind: "TRANSPORTADORA", name: "Outro nome", phone: "31988887777" })).status).toBe("ALREADY_REFERRED");
    expect(await myReferrals(ctx.db, bia)).toEqual([]);
    await createCarrier(ctx.db, ctx.actors.master, rapido);
    expect((await referCarrier(ctx.db, bia, { kind: "TRANSPORTADORA", name: "Rápido", phone: "11977776666" })).status).toBe("IN_CATALOG");
    expect((await listCarrierReferrals(ctx.db, ctx.actors.master))).toHaveLength(1);
    await expect(listCarrierReferrals(ctx.db, ana)).rejects.toThrow();
  });

  it("o indicado entra (mesmo WhatsApp) → cadastrou; primeira entrega → ativou", async () => {
    await referCarrier(ctx.db, ana, { kind: "TRANSPORTADORA", name: "Rápido", phone: "11977776666" });
    const { id: cid } = await createCarrier(ctx.db, ctx.actors.master, rapido);
    let ref = (await ctx.db.select().from(clubReferrals))[0]!;
    expect(ref).toMatchObject({ status: "CADASTROU", targetId: cid });
    const t = await loginComo((await createCarrierAccess(ctx.db, ctx.actors.master, cid, { name: "Antônio", email: "a@t.teste", password: "senha-forte-1" })).userId);
    const { id } = await createBrasRequest(ctx.db, ana, { videoId: vA, boxes: 1, carrierId: cid, ...envio });
    await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "CONFIRMED");
    await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "PAID");
    const load = await callCarrier(ctx.db, dono, { carrierId: cid, requestIds: [id], pickupDate: new Date(Date.now() + 86_400_000 - 3 * 3_600_000).toISOString().slice(0, 10), period: "TARDE" });
    await respondLoad(ctx.db, t, load.id, { accept: true, freightCents: 10_000 });
    const code = (await ctx.db.query.bdRequests.findFirst({ where: eq(bdRequests.id, id) }))!.pickupCode!;
    await importerConfirmPickup(ctx.db, dono, id, code);
    await carrierMarkDelivered(ctx.db, t, load.id);
    ref = (await ctx.db.select().from(clubReferrals))[0]!;
    expect(ref.status).toBe("ATIVOU");
    expect(ref.activatedAt).not.toBeNull();
    expect((await myReferrals(ctx.db, ana))[0]!.status).toBe("ATIVOU");
  });
});
