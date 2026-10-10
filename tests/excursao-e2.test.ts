import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { trParcels, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { getBrasMemberByUser, signupBrasMember } from "@/lib/domain/bras/membros";
import { createCarrier, createCarrierAccess, createDriverLink } from "@/lib/domain/cargas/cargas";
import {
  busBoard, busCollectParcel, busDeliverParcel, busStatement, cancelMyParcel, createTrip, excursionOptions, helperBoard, helperCollectParcel, myParcels, reserveParcels,
  respondParcel, saveRoute, setParcelInvoice, tripAction,
} from "@/lib/domain/cargas/excursao";
import { saveExcursionRules, DEFAULT_EXCURSION_RULES } from "@/lib/domain/cargas/regras-excursao";
import { myFreights } from "@/lib/domain/frete/painel";
import { addBrasImporter, createBrasRequest, setBrasOffer, setBrasRequestStatus } from "@/lib/domain/bras/catalogo";
import { addBrasVideo } from "@/lib/domain/bras/videos";
import { createImporterAccess } from "@/lib/domain/bras/importadora";
import { importerParcels, markParcelReady } from "@/lib/domain/cargas/excursao";
import { isValidNfeKey } from "@/lib/fiscal/nfe";
import { parcelFreightStatus } from "@/lib/frete/situacao";

/** D114 (fase E2 do Club): rotas, viagens e fardos dos ônibus de excursão. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let ana: Actor; let bia: Actor; let bus: Actor; let busId: string; let routeId: string;
const NFE = "35261047173173000175550010000000111000000018";
const loginComo = async (userId: string) => actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, userId) }))!);
const local = (d: Date) => new Date(d.getTime() - 3 * 3_600_000).toISOString().slice(0, 16);
const inDays = (n: number, h = 0) => local(new Date(Date.now() + n * 86_400_000 + h * 3_600_000));
const rota = { name: "Brás ↔ Belo Horizonte", originCity: "Belo Horizonte", originUf: "MG" as const, citiesServed: [{ city: "Contagem", uf: "MG" as const }], brasPoint: "Rua Rodrigues dos Santos, 600", cityPoint: "Rodoviária de BH, plataforma 3", arrivalWeekdays: [3], travelHours: 9, prices: { P: 3_000, M: 5_000, G: 8_000 } };

async function membro(nome: string, cnpj: string, email: string) {
  const r = await signupBrasMember(ctx.db, { name: nome, companyName: `${nome} LTDA`, cnpj, whatsapp: "11988887777", email, password: "senha-forte-1", acceptTerms: true });
  const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
  return { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null } as Actor;
}

beforeEach(async () => {
  ctx = await freshDb();
  ana = await membro("Ana", "11222333000181", "ana@u.teste");
  bia = await membro("Bia", "11444777000161", "bia@u.teste");
  busId = (await createCarrier(ctx.db, ctx.actors.master, { name: "Mauricio Turismo", docType: "CNPJ", document: "47.173.173/0001-75", contactName: "Mauricio", phone: "11999990000", ufs: ["SP", "MG"], vehicles: ["ONIBUS_EXCURSAO"], operation: "EXCURSAO" })).id;
  bus = await loginComo((await createCarrierAccess(ctx.db, ctx.actors.master, busId, { name: "Mauricio", email: "m@starline.teste", password: "senha-forte-1" })).userId);
  routeId = (await saveRoute(ctx.db, bus, null, null, rota)).id;
});

describe("rotas e viagens", () => {
  it("rota valida a tabela; viagem abre com a capacidade das regras; transportadora de carga não tem viagens", async () => {
    await expect(saveRoute(ctx.db, bus, null, null, { ...rota, prices: { P: 5_000, M: 3_000, G: 8_000 } })).rejects.toThrow(/mais barato/);
    const t = await createTrip(ctx.db, bus, null, { routeId, arriveBrasAt: inDays(2), departAt: inDays(2, 8) });
    expect(t.number).toBe(8001);
    expect((await busBoard(ctx.db, bus))[0]).toMatchObject({ number: 8001, capacityUnits: 120, usedUnits: 0, status: "ABERTA" });
    await expect(createTrip(ctx.db, bus, null, { routeId, arriveBrasAt: inDays(2, 8), departAt: inDays(2) })).rejects.toThrow(/depois da chegada/);
    const carga = (await createCarrier(ctx.db, ctx.actors.master, { name: "Rápido", docType: "CNPJ", document: "11.444.777/0001-61", contactName: "Antônio", phone: "11977776666", ufs: ["SP"], vehicles: ["TRUCK"] })).id;
    const t2 = await loginComo((await createCarrierAccess(ctx.db, ctx.actors.master, carga, { name: "Antônio", email: "a@t.teste", password: "senha-forte-1" })).userId);
    await expect(saveRoute(ctx.db, t2, null, null, rota)).rejects.toThrow(/ônibus de excursão/);
  });

  it("o cliente acha o ônibus pela cidade atendida (sem acento e maiúscula não importam) e não vê viagem que já saiu", async () => {
    await createTrip(ctx.db, bus, null, { routeId, arriveBrasAt: inDays(2), departAt: inDays(2, 8) });
    expect(await excursionOptions(ctx.db, { uf: "MG", city: "contagem" })).toHaveLength(1);
    expect((await excursionOptions(ctx.db, { uf: "MG", city: "belo horizonte" }))[0]!.prices.P).toBe(3_000);
    expect(await excursionOptions(ctx.db, { uf: "MG", city: "Uberlândia" })).toEqual([]);
    expect(await excursionOptions(ctx.db, { uf: "PR" })).toEqual([]);
  });
});

describe("fardos: reserva, aceite, coleta, viagem e entrega", () => {
  it("fluxo completo com bagageiro, preço e taxa congelados, nota obrigatória e código do cliente", async () => {
    const { id: tripId } = await createTrip(ctx.db, bus, null, { routeId, arriveBrasAt: inDays(2), departAt: inDays(2, 8), capacityUnits: 10 });
    const r = await reserveParcels(ctx.db, ana, { tripId, items: { P: 2, M: 1, G: 0 }, storeName: "Mega Tron, box 12", recipientName: "Ana Recebimento" });
    expect(r.waitlist).toBe(false);
    expect(r.parcels.map((p) => p.label)).toEqual(["8001-01", "8001-02", "8001-03"]);
    expect(r.totalCents).toBe(11_000);
    expect(r.storeMessage).toMatch(/8001-01, 8001-02, 8001-03/);
    // O preço da rota muda; o do fardo fica.
    await saveRoute(ctx.db, bus, null, routeId, { ...rota, prices: { P: 9_000, M: 9_000, G: 9_000 } });
    const board = (await busBoard(ctx.db, bus))[0]!;
    expect(board.parcels.map((p) => p.priceCents)).toEqual([3_000, 3_000, 5_000]);
    // Aceite congela a taxa (regra: R$ 1,50 por fardo).
    const [p1, p2, p3] = board.parcels;
    expect((await respondParcel(ctx.db, bus, p1!.id, { accept: true })).feeCents).toBe(150);
    await respondParcel(ctx.db, bus, p2!.id, { accept: true });
    await respondParcel(ctx.db, bus, p3!.id, { accept: false, reason: "Sem espaço" });
    expect((await busBoard(ctx.db, bus))[0]!.usedUnits).toBe(2);
    // Sem nota não embarca; com a chave conferida, embarca.
    await expect(busCollectParcel(ctx.db, bus, "8001-01")).rejects.toThrow(/sem nota/i);
    await expect(setParcelInvoice(ctx.db, ana, p1!.id, "123")).rejects.toThrow(/inválida/);
    await expect(setParcelInvoice(ctx.db, bia, p1!.id, NFE)).rejects.toThrow(/não encontrado/);
    await setParcelInvoice(ctx.db, ana, p1!.id, NFE);
    await busCollectParcel(ctx.db, bus, "8001-01");
    await expect(busCollectParcel(ctx.db, bus, "8001-01")).rejects.toThrow(/já foi coletado/);
    // Saída: coletado vira "em viagem"; aceito e não coletado vira "não embarcou".
    await tripAction(ctx.db, bus, tripId, "SAIR");
    const after = await ctx.db.select().from(trParcels);
    expect(after.find((x) => x.id === p1!.id)!.status).toBe("EM_VIAGEM");
    expect(after.find((x) => x.id === p2!.id)!.status).toBe("NAO_EMBARCOU");
    await expect(busDeliverParcel(ctx.db, bus, p1!.id, "EX-000000")).rejects.toThrow(/chegada/);
    await tripAction(ctx.db, bus, tripId, "CHEGAR");
    await expect(busDeliverParcel(ctx.db, bus, p1!.id, "EX-000000")).rejects.toThrow(/não confere/);
    const code = (await myParcels(ctx.db, ana)).find((x) => x.id === p1!.id)!.deliveryCode;
    await busDeliverParcel(ctx.db, bus, p1!.id, code.toLowerCase());
    // O painel de frete único mostra o fardo como ônibus, entregue, sem a taxa.
    const fr = (await myFreights(ctx.db, ana)).find((f) => f.id === `trp-${p1!.id}`)!;
    expect(fr).toMatchObject({ mode: "ONIBUS", status: "ENTREGUE" });
    expect(fr.parcel!.priceCents).toBe(3_000);
    expect(JSON.stringify(fr)).not.toMatch(/feeCents":\d/);
    expect(await busStatement(ctx.db, bus)).toEqual([expect.objectContaining({ number: 8001, parcels: 1, freightCents: 3_000, feeCents: 150 })]);
    expect(await myParcels(ctx.db, bia)).toEqual([]);
  });

  it("lotou: nova reserva vai para a lista de espera; aceitar além da capacidade é recusado", async () => {
    const { id: tripId } = await createTrip(ctx.db, bus, null, { routeId, arriveBrasAt: inDays(2), departAt: inDays(2, 8), capacityUnits: 10 });
    const a = await reserveParcels(ctx.db, ana, { tripId, items: { P: 0, M: 0, G: 2 }, storeName: "Loja A", recipientName: "Ana" });
    for (const p of a.parcels) await respondParcel(ctx.db, bus, p.id, { accept: true });
    const b = await reserveParcels(ctx.db, bia, { tripId, items: { P: 0, M: 0, G: 1 }, storeName: "Loja B", recipientName: "Bia" });
    expect(b.waitlist).toBe(true);
    await expect(respondParcel(ctx.db, bus, b.parcels[0]!.id, { accept: true })).rejects.toThrow(/Não cabe/);
    // Um sai, o da espera cabe.
    await cancelMyParcel(ctx.db, ana, a.parcels[0]!.id);
    await respondParcel(ctx.db, bus, b.parcels[0]!.id, { accept: true });
    expect((await busBoard(ctx.db, bus))[0]!.usedUnits).toBe(8);
  });

  it("cancelamento do cliente respeita o prazo; viagem cancelada cancela os fardos", async () => {
    await saveExcursionRules(ctx.db, ctx.actors.master, { cancelHours: 48 });
    const { id: tripId } = await createTrip(ctx.db, bus, null, { routeId, arriveBrasAt: inDays(1), departAt: inDays(1, 2) });
    const r = await reserveParcels(ctx.db, ana, { tripId, items: { P: 2, M: 0, G: 0 }, storeName: "Loja", recipientName: "Ana" });
    await respondParcel(ctx.db, bus, r.parcels[0]!.id, { accept: true });
    await expect(cancelMyParcel(ctx.db, ana, r.parcels[0]!.id)).rejects.toThrow(/48 h/);
    await cancelMyParcel(ctx.db, ana, r.parcels[1]!.id); // ainda não aceito: pode
    await tripAction(ctx.db, bus, tripId, "CANCELAR");
    expect((await ctx.db.select().from(trParcels)).every((p) => p.status === "CANCELADO")).toBe(true);
    await saveExcursionRules(ctx.db, ctx.actors.master, { cancelHours: DEFAULT_EXCURSION_RULES.cancelHours });
  });

  it("ajudante pelo link: coleta pela etiqueta, sem valores; link de transportadora de carga não serve", async () => {
    const { id: tripId } = await createTrip(ctx.db, bus, null, { routeId, arriveBrasAt: inDays(2), departAt: inDays(2, 8) });
    const r = await reserveParcels(ctx.db, ana, { tripId, items: { P: 1, M: 0, G: 0 }, storeName: "Loja", recipientName: "Ana", invoiceKey: NFE });
    await respondParcel(ctx.db, bus, r.parcels[0]!.id, { accept: true });
    const { token } = await createDriverLink(ctx.db, bus, null);
    const h = (await helperBoard(ctx.db, token))!;
    expect(h.trips[0]!.parcels[0]!.priceCents).toBeNull();
    expect(h.trips[0]!.freightCents).toBeNull();
    await helperCollectParcel(ctx.db, token, "8001-01");
    expect((await ctx.db.select().from(trParcels))[0]!.status).toBe("COLETADO");
    await expect(helperCollectParcel(ctx.db, "x".repeat(32), "8001-01")).rejects.toThrow(/inválido/);
  });

  it("fronteiras: só membro ativo reserva; outro ônibus não responde; reserva em viagem que saiu é recusada", async () => {
    const { id: tripId } = await createTrip(ctx.db, bus, null, { routeId, arriveBrasAt: inDays(2), departAt: inDays(2, 8) });
    await expect(reserveParcels(ctx.db, bus, { tripId, items: { P: 1, M: 0, G: 0 }, storeName: "Loja", recipientName: "Ana" })).rejects.toThrow(/membros/);
    const r = await reserveParcels(ctx.db, ana, { tripId, items: { P: 1, M: 0, G: 0 }, storeName: "Loja", recipientName: "Ana" });
    const outro = (await createCarrier(ctx.db, ctx.actors.master, { name: "Outra Excursão", docType: "CPF", document: "529.982.247-25", contactName: "Zé", phone: "31977776666", ufs: ["MG"], vehicles: ["ONIBUS_EXCURSAO"], operation: "EXCURSAO" })).id;
    const zé = await loginComo((await createCarrierAccess(ctx.db, ctx.actors.master, outro, { name: "Zé", email: "ze@t.teste", password: "senha-forte-1" })).userId);
    await expect(respondParcel(ctx.db, zé, r.parcels[0]!.id, { accept: true })).rejects.toThrow(/não encontrado/);
    await expect(busCollectParcel(ctx.db, zé, "8001-01")).rejects.toThrow(/não encontrada/);
    await tripAction(ctx.db, bus, tripId, "SAIR");
    await expect(reserveParcels(ctx.db, ana, { tripId, items: { P: 1, M: 0, G: 0 }, storeName: "Loja", recipientName: "Ana" })).rejects.toThrow(/não está recebendo/);
  });
});

describe("importadora: fardos dos pedidos dela", () => {
  it("vê os fardos ligados aos pedidos, informa a nota e marca pronto; outra importadora não vê", async () => {
    const imp = (await addBrasImporter(ctx.db, ctx.actors.master, { name: "XDX Importadora" })).id;
    const outra = (await addBrasImporter(ctx.db, ctx.actors.master, { name: "Outra" })).id;
    const v = (await addBrasVideo(ctx.db, ctx.actors.master, { url: "aaaaaaaaaa1", title: "Garrafa" })).id;
    await setBrasOffer(ctx.db, ctx.actors.master, v, { importerId: imp, priceBoxCents: 30_000, unitsPerBox: 24, boxesAvailable: 50 });
    const dono = await loginComo((await createImporterAccess(ctx.db, ctx.actors.master, imp, { name: "Dono", email: "d@xdx.teste", password: "senha-forte-1" })).userId);
    const donoOutra = await loginComo((await createImporterAccess(ctx.db, ctx.actors.master, outra, { name: "Outro", email: "o@o.teste", password: "senha-forte-1" })).userId);
    const { id: req } = await createBrasRequest(ctx.db, ana, { videoId: v, boxes: 1, carrier: "Ônibus", shipName: "Ana", shipAddress: "Rua A, 10", shipCity: "Belo Horizonte", shipState: "MG", shipZip: "30110-000" });
    await setBrasRequestStatus(ctx.db, ctx.actors.master, req, "CONFIRMED");
    const { id: tripId } = await createTrip(ctx.db, bus, null, { routeId, arriveBrasAt: inDays(2), departAt: inDays(2, 8) });
    const r = await reserveParcels(ctx.db, ana, { tripId, items: { P: 0, M: 1, G: 0 }, storeName: "XDX Importadora", recipientName: "Ana", requestId: req });
    const pid = r.parcels[0]!.id;
    expect((await importerParcels(ctx.db, dono)).map((p) => p.label)).toEqual(["8001-01"]);
    expect(await importerParcels(ctx.db, donoOutra)).toEqual([]);
    await expect(markParcelReady(ctx.db, dono, pid)).rejects.toThrow(/aceito pelo ônibus/);
    await respondParcel(ctx.db, bus, pid, { accept: true });
    await expect(markParcelReady(ctx.db, donoOutra, pid)).rejects.toThrow(/não encontrado/);
    await expect(setParcelInvoice(ctx.db, donoOutra, pid, NFE)).rejects.toThrow(/não encontrado/);
    await setParcelInvoice(ctx.db, dono, pid, NFE);
    await markParcelReady(ctx.db, dono, pid);
    expect((await myFreights(ctx.db, ana)).find((f) => f.id === `trp-${pid}`)!.status).toBe("PRONTO");
    await busCollectParcel(ctx.db, bus, "8001-01");
    expect((await importerParcels(ctx.db, dono))[0]!.status).toBe("COLETADO");
    // Reserva com pedido de outro membro é recusada.
    await expect(reserveParcels(ctx.db, bia, { tripId, items: { P: 1, M: 0, G: 0 }, storeName: "Loja", recipientName: "Bia", requestId: req })).rejects.toThrow(/não encontrado/);
  });
});

describe("puros", () => {
  it("chave da NF-e confere o dígito; situação do fardo no painel único", () => {
    expect(isValidNfeKey(NFE)).toBe(true);
    expect(isValidNfeKey(NFE.slice(0, 43) + "9")).toBe(false);
    expect(isValidNfeKey("3526")).toBe(false);
    const ev = [{ kind: "COLETADO", at: "2026-10-11T10:00:00Z" }];
    expect(parcelFreightStatus({ status: "ESPERA", createdAt: "x", events: [] }).status).toBe("RESERVADO");
    expect(parcelFreightStatus({ status: "CHEGOU", createdAt: "x", events: ev }).status).toBe("EM_VIAGEM");
    expect(parcelFreightStatus({ status: "COLETADO", createdAt: "x", events: ev }).steps[2]!.at).toBe("2026-10-11T10:00:00Z");
    const dead = parcelFreightStatus({ status: "NAO_EMBARCOU", createdAt: "x", events: [] });
    expect(dead.status).toBe("CANCELADO");
    expect(dead.steps.some((s) => s.done)).toBe(false);
  });
});
