import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { getBrasMemberByUser, signupBrasMember } from "@/lib/domain/bras/membros";
import { addBrasVideo } from "@/lib/domain/bras/videos";
import { addBrasImporter, createBrasRequest, setBrasRequestStatus, setBrasOffer } from "@/lib/domain/bras/catalogo";
import { createImporterAccess, importerConfirmPickup } from "@/lib/domain/bras/importadora";
import { callCarrier, carrierCatalog, carrierLoads, carrierMarkDelivered, createCarrier, createCarrierAccess, importerLoads, loadableRequests, respondLoad } from "@/lib/domain/cargas/cargas";
import { answerPreferred, askPreferred, carrierFixedPickups, fixedPickupPlan, loadMessage, carrierRatings, demandMap, fixedToday, importerPreferences, importersForCarrier, markPreferred, rateLoad, ratedLoadIds, setFixedPickup } from "@/lib/domain/cargas/vias";

/** D118 (fase E6 do Club): importadoras e transportadoras nas duas vias. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let ana: Actor; let dono: Actor; let donoB: Actor; let t: Actor; let cid: string; let impA: string; let vA: string;
const loginComo = async (userId: string) => actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, userId) }))!);
const envio = (shipState: "PR" | "MG" | "BA", shipCity = "Curitiba") => ({ shipName: "Ana", shipAddress: "Rua das Flores, 100", shipCity, shipState, shipZip: "80010-000", carrier: "Braspress" });
const rapido = { name: "Rápido Brás Transportes", docType: "CNPJ" as const, document: "11.444.777/0001-61", contactName: "Antônio", phone: "11977776666", ufs: ["SP", "PR"] as ("SP" | "PR")[], vehicles: ["TRUCK"] as "TRUCK"[] };

beforeEach(async () => {
  ctx = await freshDb();
  const r = await signupBrasMember(ctx.db, { name: "Ana", companyName: "Ana LTDA", cnpj: "11222333000181", whatsapp: "11988887777", email: "ana@u.teste", password: "senha-forte-1", acceptTerms: true });
  const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
  ana = { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null } as Actor;
  impA = (await addBrasImporter(ctx.db, ctx.actors.master, { name: "XDX Importadora" })).id;
  const impB = (await addBrasImporter(ctx.db, ctx.actors.master, { name: "Yang Importadora" })).id;
  vA = (await addBrasVideo(ctx.db, ctx.actors.master, { url: "aaaaaaaaaa1", title: "Garrafa térmica" })).id;
  await setBrasOffer(ctx.db, ctx.actors.master, vA, { importerId: impA, priceBoxCents: 30_000, unitsPerBox: 24, boxesAvailable: 100 });
  dono = await loginComo((await createImporterAccess(ctx.db, ctx.actors.master, impA, { name: "Dono", email: "dono@xdx.teste", password: "senha-forte-1" })).userId);
  donoB = await loginComo((await createImporterAccess(ctx.db, ctx.actors.master, impB, { name: "Dona", email: "dona@yang.teste", password: "senha-forte-1" })).userId);
  cid = (await createCarrier(ctx.db, ctx.actors.master, rapido)).id;
  t = await loginComo((await createCarrierAccess(ctx.db, ctx.actors.master, cid, { name: "Antônio", email: "a@t.teste", password: "senha-forte-1" })).userId);
});

async function pedidos(uf: "PR" | "MG" | "BA", n: number, status: "CONFIRMED" | "PAID" = "CONFIRMED") {
  const ids: string[] = [];
  for (let i = 0; i < n; i++) {
    const { id } = await createBrasRequest(ctx.db, ana, { videoId: vA, boxes: 2, ...envio(uf, uf === "PR" ? "Curitiba" : uf === "MG" ? "Belo Horizonte" : "Salvador") });
    await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "CONFIRMED");
    if (status === "PAID") await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "PAID");
    ids.push(id);
  }
  return ids;
}

describe("transportadora → importadora", () => {
  it("vê a demanda agregada por estado (estado com poucos pedidos vira 'outros'), sem cliente nem valor", async () => {
    await pedidos("PR", 3);
    await pedidos("BA", 1);
    const list = await importersForCarrier(ctx.db, t);
    const xdx = list.find((i) => i.name === "XDX Importadora")!;
    expect(xdx.demand).toEqual([{ uf: "PR", requests: 3, boxes: 6, servesUf: true }]);
    expect(xdx.otherRequests).toBe(1);
    expect(JSON.stringify(list)).not.toMatch(/Ana|Curitiba|30000|priceBox/);
    await expect(importersForCarrier(ctx.db, dono)).rejects.toThrow();
  });

  it("pede para ser preferida; a importadora aceita; recusada pode pedir de novo; outra importadora não mexe", async () => {
    await askPreferred(ctx.db, t, impA, "Coleto toda quinta");
    await expect(askPreferred(ctx.db, t, impA)).rejects.toThrow(/já está com a importadora/);
    const [p] = await importerPreferences(ctx.db, dono);
    expect(p).toMatchObject({ status: "PEDIDO", name: "Rápido Brás Transportes", message: "Coleto toda quinta" });
    expect(await importerPreferences(ctx.db, donoB)).toEqual([]);
    await expect(answerPreferred(ctx.db, donoB, p!.id, true)).rejects.toThrow(/não encontrado/);
    await answerPreferred(ctx.db, dono, p!.id, false);
    await askPreferred(ctx.db, t, impA);
    await answerPreferred(ctx.db, dono, p!.id, true);
    await expect(askPreferred(ctx.db, t, impA)).rejects.toThrow(/já é preferida/);
    expect((await importersForCarrier(ctx.db, t)).find((i) => i.id === impA)!.preference!.status).toBe("ACEITA");
  });

  it("coleta fixa só com preferida, com hora; aparece no Hoje da transportadora no dia certo", async () => {
    await markPreferred(ctx.db, dono, cid);
    const [p] = await importerPreferences(ctx.db, dono);
    await expect(setFixedPickup(ctx.db, dono, p!.id, { weekdays: [4], time: "" })).rejects.toThrow(/hora/);
    await setFixedPickup(ctx.db, dono, p!.id, { weekdays: [4, 1, 4], time: "15:00" });
    const fixed = await carrierFixedPickups(ctx.db, t);
    expect(fixed).toMatchObject([{ importer: "XDX Importadora", weekdays: [1, 4], time: "15:00" }]);
    const quinta = new Date("2026-10-15T15:00:00Z"); // quinta-feira em Brasília
    expect(fixedToday(fixed, quinta)).toHaveLength(1);
    expect(fixedToday(fixed, new Date("2026-10-14T15:00:00Z"))).toHaveLength(0);
    await askPreferred(ctx.db, t, impA).catch(() => null);
    await answerPreferred(ctx.db, dono, p!.id, false);
    await expect(setFixedPickup(ctx.db, dono, p!.id, { weekdays: [2], time: "10:00" })).rejects.toThrow(/preferida/);
  });
});

describe("avaliação da coleta e mapa de demanda", () => {
  it("avalia depois da coleta, uma vez só; a nota entra no catálogo; o Master vê onde falta transportadora", async () => {
    const [rid] = await pedidos("PR", 1, "PAID");
    const req = (await ctx.db.query.bdRequests.findFirst({ where: (r, { eq: e }) => e(r.id, rid!) }))!;
    const load = await callCarrier(ctx.db, dono, { carrierId: cid, requestIds: [rid!], pickupDate: new Date(Date.now() + 86_400_000 - 3 * 3_600_000).toISOString().slice(0, 10), period: "MANHA" });
    await expect(rateLoad(ctx.db, dono, load.id, { punctuality: 5, care: 5 })).rejects.toThrow(/depois da coleta/);
    await respondLoad(ctx.db, t, load.id, { accept: true, freightCents: 20_000 });
    await importerConfirmPickup(ctx.db, dono, rid!, req.pickupCode!);
    await carrierMarkDelivered(ctx.db, t, load.id);
    await expect(rateLoad(ctx.db, donoB, load.id, { punctuality: 1, care: 1 })).rejects.toThrow(/não encontrada/);
    await expect(rateLoad(ctx.db, dono, load.id, { punctuality: 6, care: 5 })).rejects.toThrow();
    await rateLoad(ctx.db, dono, load.id, { punctuality: 4, care: 5, comment: "Chegou certinho" });
    await expect(rateLoad(ctx.db, dono, load.id, { punctuality: 5, care: 5 })).rejects.toThrow(/já foi avaliada/);
    expect((await ratedLoadIds(ctx.db, dono)).has(load.id)).toBe(true);
    expect((await carrierRatings(ctx.db)).get(cid)).toEqual({ count: 1, score: 4.5 });
    expect((await carrierCatalog(ctx.db)).find((c) => c.id === cid)!.rating).toEqual({ count: 1, score: 4.5 });

    await pedidos("BA", 2);
    const map = await demandMap(ctx.db, ctx.actors.master);
    expect(map.find((x) => x.uf === "BA")).toMatchObject({ city: "Salvador", requests: 2, boxes: 4, carriersInUf: 0, withoutCatalogCarrier: 2 });
    expect(map.find((x) => x.uf === "PR")).toMatchObject({ carriersInUf: 1 });
    await expect(demandMap(ctx.db, dono)).rejects.toThrow();
  });
});

describe("conversa presa à coleta e coleta fixa que junta os pedidos", () => {
  it("cada lado escreve e lê só a própria coleta; a importadora não vê o frete no histórico", async () => {
    const [rid] = await pedidos("PR", 1, "PAID");
    const load = await callCarrier(ctx.db, dono, { carrierId: cid, requestIds: [rid!], pickupDate: new Date(Date.now() + 86_400_000 - 3 * 3_600_000).toISOString().slice(0, 10), period: "TARDE" });
    await respondLoad(ctx.db, t, load.id, { accept: true, freightCents: 35_000 });
    await loadMessage(ctx.db, dono, load.id, "Carga pronta");
    await loadMessage(ctx.db, t, load.id, "Chego em 30 min");
    await expect(loadMessage(ctx.db, donoB, load.id, "oi")).rejects.toThrow(/não encontrada/);
    await expect(loadMessage(ctx.db, ana, load.id, "oi")).rejects.toThrow(/Só a importadora/);
    await expect(loadMessage(ctx.db, dono, load.id, " ")).rejects.toThrow();
    const [mine] = await importerLoads(ctx.db, dono);
    const msgs = mine!.events.filter((e) => e.kind === "MENSAGEM").map((e) => `${e.actor}: ${e.note}`);
    expect(msgs).toEqual(["Importadora XDX Importadora: Carga pronta", "Rápido Brás Transportes: Chego em 30 min"]);
    expect(JSON.stringify(mine)).not.toMatch(/350,00|35000/);
    expect(JSON.stringify((await carrierLoads(ctx.db, t)).loads[0]!.events)).toMatch(/350,00/);
  });

  it("coleta fixa de hoje junta os pedidos para os estados da preferida", async () => {
    await pedidos("PR", 2);
    await pedidos("MG", 1);
    await markPreferred(ctx.db, dono, cid);
    const [p] = await importerPreferences(ctx.db, dono);
    await setFixedPickup(ctx.db, dono, p!.id, { weekdays: [4], time: "15:00" });
    const prefs = await importerPreferences(ctx.db, dono);
    const reqs = await loadableRequests(ctx.db, dono);
    const quinta = new Date("2026-10-15T15:00:00Z");
    const [plan] = fixedPickupPlan(prefs, reqs, quinta);
    expect(plan).toMatchObject({ carrierId: cid, period: "TARDE", boxes: 4 });
    expect(plan!.requestIds).toHaveLength(2);
    expect(fixedPickupPlan(prefs, reqs, new Date("2026-10-14T15:00:00Z"))).toEqual([]);
  });
});
