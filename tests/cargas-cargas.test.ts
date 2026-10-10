import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { bdRequests, brandLeads, trCarriers, trLoads, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { getBrasMemberByUser, signupBrasMember } from "@/lib/domain/bras/membros";
import { addBrasVideo } from "@/lib/domain/bras/videos";
import { addBrasImporter, createBrasRequest, setBrasOffer, setBrasRequestStatus } from "@/lib/domain/bras/catalogo";
import { createImporterAccess, importerConfirmPickup, saveImporterProduct } from "@/lib/domain/bras/importadora";
import { getBrasRules, saveBrasRules } from "@/lib/domain/bras/regras";
import { registerCargasInterest } from "@/lib/domain/cargas/interesse";
import {
  callCarrier, cancelLoad, carrierByDriverToken, carrierFromLead, carrierLoads, carrierMarkDelivered, carrierStatement, cargasCommissionReport, createCarrier,
  createCarrierAccess, createDriverLink, driverMarkDelivered, driverQueue, importerLoads, listCarriers, loadableRequests, myCarrier, respondLoad,
  revokeDriverLink, updateCarrierProfile,
} from "@/lib/domain/cargas/cargas";

/** D111: NextLevel Cargas v1. Importadora chama, transportadora aceita com frete, coleta com código, motorista entrega. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let ana: Actor; let impA: string; let impB: string; let vA: string; let vB: string;
let donoA: Actor; let donoB: Actor;
const envio = { carrier: "A combinar", shipName: "Ana Recebimento", shipAddress: "Rua das Flores, 100", shipCity: "Curitiba", shipState: "PR" as const, shipZip: "80010-000" };
const transp = { name: "Rápido Brás Transportes", docType: "CNPJ" as const, document: "11.444.777/0001-61", contactName: "Antônio", phone: "(11) 97777-6666", ufs: ["SP", "PR"] as ("SP" | "PR")[], vehicles: ["TRUCK"] as "TRUCK"[] };
const amanha = () => new Date(Date.now() + 86_400_000 - 3 * 3_600_000).toISOString().slice(0, 10);
const loginComo = async (userId: string) => actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, userId) }))!);

async function pedidoPago(video = vA, status: "CONFIRMED" | "PAID" = "PAID") {
  const { id } = await createBrasRequest(ctx.db, ana, { videoId: video, boxes: 2, ...envio });
  await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "CONFIRMED");
  if (status === "PAID") await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "PAID");
  return id;
}
async function transportadoraComLogin(doc = transp) {
  const { id } = await createCarrier(ctx.db, ctx.actors.master, doc);
  const { userId } = await createCarrierAccess(ctx.db, ctx.actors.master, id, { name: "Antônio", email: `t${doc.document.replace(/\D/g, "")}@transp.teste`, password: "senha-forte-1" });
  return { id, actor: await loginComo(userId) };
}

beforeEach(async () => {
  ctx = await freshDb();
  const r = await signupBrasMember(ctx.db, { name: "Ana", companyName: "Ana Utilidades LTDA", cnpj: "11222333000181", whatsapp: "11988887777", email: "ana@u.teste", password: "senha-forte-1", acceptTerms: true });
  const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
  ana = { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null };
  impA = (await addBrasImporter(ctx.db, ctx.actors.master, { name: "XDX Importadora" })).id;
  impB = (await addBrasImporter(ctx.db, ctx.actors.master, { name: "Outra Importadora" })).id;
  vA = (await addBrasVideo(ctx.db, ctx.actors.master, { url: "aaaaaaaaaa1", title: "Garrafa" })).id;
  vB = (await addBrasVideo(ctx.db, ctx.actors.master, { url: "bbbbbbbbbb1", title: "Copo" })).id;
  await setBrasOffer(ctx.db, ctx.actors.master, vA, { importerId: impA, priceBoxCents: 30_000, unitsPerBox: 24, boxesAvailable: 50 });
  await setBrasOffer(ctx.db, ctx.actors.master, vB, { importerId: impB, priceBoxCents: 20_000, unitsPerBox: 12, boxesAvailable: 50 });
  donoA = await loginComo((await createImporterAccess(ctx.db, ctx.actors.master, impA, { name: "Dono A", email: "a@xdx.teste", password: "senha-forte-1" })).userId);
  donoB = await loginComo((await createImporterAccess(ctx.db, ctx.actors.master, impB, { name: "Dono B", email: "b@outra.teste", password: "senha-forte-1" })).userId);
});

describe("transportadoras", () => {
  it("importadora cadastra (documento validado); o mesmo documento reaproveita a existente; financeiro não cadastra", async () => {
    await expect(createCarrier(ctx.db, donoA, { ...transp, document: "11.444.777/0001-00" })).rejects.toThrow(/CNPJ inválido/);
    const a = await createCarrier(ctx.db, donoA, transp);
    expect(a.existed).toBe(false);
    expect((await createCarrier(ctx.db, donoB, transp))).toEqual({ id: a.id, existed: true });
    const fin = await loginComo((await createImporterAccess(ctx.db, donoA, null, { name: "Fábio", email: "fin@xdx.teste", password: "senha-forte-1", staffRole: "FINANCEIRO" })).userId);
    await expect(createCarrier(ctx.db, fin, { ...transp, document: "52998224725", docType: "CPF" })).rejects.toThrow(/balcão, do estoque/);
    await expect(createCarrier(ctx.db, ana, transp)).rejects.toThrow();
    // Importadora vê o contato para chamar, mas não o documento; o Master vê tudo.
    const lista = await listCarriers(ctx.db, donoA);
    expect(lista[0]).not.toHaveProperty("document");
    expect((await listCarriers(ctx.db, ctx.actors.master))[0]!.document).toBe("11444777000161");
    expect(await listCarriers(ctx.db, donoA, { uf: "BA" })).toEqual([]);
  });

  it("login da transportadora: só o Master cria; ela edita o perfil, mas plano e situação só o Master", async () => {
    const { id } = await createCarrier(ctx.db, ctx.actors.master, transp);
    await expect(createCarrierAccess(ctx.db, donoA, id, { name: "X", email: "x@t.teste", password: "senha-forte-1" })).rejects.toThrow();
    const { userId } = await createCarrierAccess(ctx.db, ctx.actors.master, id, { name: "Antônio", email: "ant@t.teste", password: "senha-forte-1" });
    const u = (await ctx.db.query.users.findFirst({ where: eq(users.id, userId) }))!;
    expect(u.role).toBe("CARRIER");
    expect(u.mustChangePassword).toBe(true);
    const t = await loginComo(userId);
    expect((await myCarrier(ctx.db, t)).id).toBe(id);
    await updateCarrierProfile(ctx.db, t, null, { ufs: ["SP", "RJ"], plan: "PREMIUM", status: "PAUSADA", rateNotes: "Mínimo R$ 150" });
    const c = (await ctx.db.query.trCarriers.findFirst({ where: eq(trCarriers.id, id) }))!;
    expect(c.ufs).toEqual(["SP", "RJ"]);
    expect(c.plan).toBe("GRATIS");
    expect(c.status).toBe("ATIVA");
    expect(c.rateNotes).toBe("Mínimo R$ 150");
    await updateCarrierProfile(ctx.db, ctx.actors.master, id, { plan: "PRO", status: "PAUSADA" });
    await expect(myCarrier(ctx.db, t)).rejects.toThrow(/pausada/);
    await expect(updateCarrierProfile(ctx.db, t, "outro", {})).rejects.toThrow();
  });

  it("interessado da página da Cargas vira transportadora (UF, veículos e documento do formulário)", async () => {
    const lead = await registerCargasInterest(ctx.db, { kind: "AUTONOMO", name: "João Motorista", email: "joao@t.teste", phone: "11966665555", document: "529.982.247-25", ufs: ["SP", "MG"], vehicles: ["VAN"], rntrc: true, insurance: false });
    const r = await carrierFromLead(ctx.db, ctx.actors.master, lead.id);
    const c = (await ctx.db.query.trCarriers.findFirst({ where: eq(trCarriers.id, r.id) }))!;
    expect(c).toMatchObject({ docType: "CPF", document: "52998224725", ufs: ["SP", "MG"], vehicles: ["VAN"], insurance: false });
    expect((await ctx.db.query.brandLeads.findFirst({ where: eq(brandLeads.id, lead.id) }))!.status).toBe("WON");
    await expect(carrierFromLead(ctx.db, donoA, lead.id)).rejects.toThrow();
  });
});

describe("coletas", () => {
  it("fluxo completo: chamar → aceitar com frete (comissão congelada) → coleta com códigos → entregue", async () => {
    const { id: carrierId, actor: t } = await transportadoraComLogin();
    const r1 = await pedidoPago();
    const r2 = await pedidoPago(vA, "CONFIRMED");
    expect((await loadableRequests(ctx.db, donoA)).map((x) => x.id).sort()).toEqual([r1, r2].sort());
    const call = await callCarrier(ctx.db, donoA, { carrierId, requestIds: [r1, r2], pickupDate: amanha(), period: "MANHA" });
    expect(call.number).toBe(5001);
    expect(call.whatsappUrl).toMatch(/^https:\/\/wa\.me\/5511977776666\?text=/);
    expect(await loadableRequests(ctx.db, donoA)).toEqual([]);
    // Pedido já numa coleta ativa não entra em outra.
    await expect(callCarrier(ctx.db, donoA, { carrierId, requestIds: [r1], pickupDate: amanha(), period: "TARDE" })).rejects.toThrow(/já está na coleta 5001/);

    // Antes do aceite: a transportadora vê a carga, mas sem os códigos de retirada.
    let view = (await carrierLoads(ctx.db, t)).loads[0]!;
    expect(view.status).toBe("CHAMADA");
    expect(view.boxes).toBe(4);
    expect(view.requests.every((r) => r.pickupCode === null)).toBe(true);
    await expect(respondLoad(ctx.db, t, view.id, { accept: true, freightCents: 50 })).rejects.toThrow(/frete/);
    const res = await respondLoad(ctx.db, t, view.id, { accept: true, freightCents: 80_000 });
    expect(res.commissionBps).toBe(800);
    view = (await carrierLoads(ctx.db, t)).loads[0]!;
    expect(view.status).toBe("ACEITA");
    expect(view.commissionCents).toBe(6_400);
    const codigos = view.requests.find((r) => r.id === r1)!.pickupCode;
    expect(codigos).toMatch(/^BD-/);
    // Mudar a regra depois não mexe na comissão da carga aceita.
    const rules = await getBrasRules(ctx.db);
    await saveBrasRules(ctx.db, ctx.actors.master, { ...rules, carriers: { ...rules.carriers, commissionBps: { ...rules.carriers.commissionBps, GRATIS: 1_500 } } });
    expect((await ctx.db.query.trLoads.findFirst({ where: eq(trLoads.id, view.id) }))!.commissionCents).toBe(6_400);
    await expect(carrierMarkDelivered(ctx.db, t, view.id)).rejects.toThrow(/código/);

    // Coleta no balcão: só vira "coletada" quando o último pedido sai com o código.
    await importerConfirmPickup(ctx.db, donoA, r1, codigos!);
    expect((await ctx.db.query.trLoads.findFirst({ where: eq(trLoads.id, view.id) }))!.status).toBe("ACEITA");
    await setBrasRequestStatus(ctx.db, ctx.actors.master, r2, "PAID");
    const code2 = (await ctx.db.query.bdRequests.findFirst({ where: eq(bdRequests.id, r2) }))!.pickupCode!;
    await importerConfirmPickup(ctx.db, donoA, r2, code2);
    expect((await ctx.db.query.trLoads.findFirst({ where: eq(trLoads.id, view.id) }))!.status).toBe("COLETADA");
    await carrierMarkDelivered(ctx.db, t, view.id, "Entregue na portaria");
    const fim = (await carrierLoads(ctx.db, t)).loads[0]!;
    expect(fim.status).toBe("ENTREGUE");
    expect(fim.events.map((e) => e.kind)).toEqual(["CHAMADA", "ACEITA", "COLETADA", "ENTREGUE"]);
    expect(fim.requests.every((r) => r.pickupCode === null)).toBe(true); // entregue: código some
    expect((await carrierStatement(ctx.db, t))[0]).toMatchObject({ loads: 1, freightCents: 80_000, commissionCents: 6_400 });
    expect((await cargasCommissionReport(ctx.db, ctx.actors.master))[0]!.months[0]!.commissionCents).toBe(6_400);
  });

  it("a importadora nunca vê frete, comissão nem código; nem as coletas de outra importadora", async () => {
    const { id: carrierId, actor: t } = await transportadoraComLogin();
    const r1 = await pedidoPago();
    const { id } = await callCarrier(ctx.db, donoA, { carrierId, requestIds: [r1], pickupDate: amanha(), period: "MANHA" });
    await respondLoad(ctx.db, t, id, { accept: true, freightCents: 30_000 });
    const minhas = await importerLoads(ctx.db, donoA);
    expect(minhas).toHaveLength(1);
    expect(minhas[0]).toMatchObject({ freightCents: null, commissionCents: null });
    expect(minhas[0]!.requests[0]!.pickupCode).toBeNull();
    expect(await importerLoads(ctx.db, donoB)).toEqual([]);
    await expect(cancelLoad(ctx.db, donoB, id)).rejects.toThrow();
    // A transportadora não vê nada do comprador além do envio.
    const txt = JSON.stringify((await carrierLoads(ctx.db, t)).loads);
    for (const segredo of ["11222333000181", "ana@u.teste", "11988887777", "Ana Utilidades", "totalCents", "priceBoxCents"]) expect(txt).not.toContain(segredo);
  });

  it("só pedidos próprios, confirmados ou pagos; data de hoje até 30 dias; transportadora pausada não é chamada", async () => {
    const { id: carrierId } = await transportadoraComLogin();
    const deB = await pedidoPago(vB);
    await expect(callCarrier(ctx.db, donoA, { carrierId, requestIds: [deB], pickupDate: amanha(), period: "MANHA" })).rejects.toThrow(/não encontrado/);
    const { id: novo } = await createBrasRequest(ctx.db, ana, { videoId: vA, boxes: 1, ...envio });
    await expect(callCarrier(ctx.db, donoA, { carrierId, requestIds: [novo], pickupDate: amanha(), period: "MANHA" })).rejects.toThrow(/confirmados ou pagos/);
    const r1 = await pedidoPago();
    await expect(callCarrier(ctx.db, donoA, { carrierId, requestIds: [r1], pickupDate: "2020-01-01", period: "MANHA" })).rejects.toThrow(/hoje ou depois/);
    await expect(callCarrier(ctx.db, donoA, { carrierId, requestIds: [r1], pickupDate: "2099-01-01", period: "MANHA" })).rejects.toThrow(/30 dias/);
    await updateCarrierProfile(ctx.db, ctx.actors.master, carrierId, { status: "PAUSADA" });
    await expect(callCarrier(ctx.db, donoA, { carrierId, requestIds: [r1], pickupDate: amanha(), period: "MANHA" })).rejects.toThrow(/indisponível/);
  });

  it("recusa exige motivo e libera os pedidos; cancelada também libera", async () => {
    const { id: carrierId, actor: t } = await transportadoraComLogin();
    const r1 = await pedidoPago();
    const { id } = await callCarrier(ctx.db, donoA, { carrierId, requestIds: [r1], pickupDate: amanha(), period: "TARDE" });
    await expect(respondLoad(ctx.db, t, id, { accept: false, reason: "  " })).rejects.toThrow(/motivo/);
    await respondLoad(ctx.db, t, id, { accept: false, reason: "Sem veículo" });
    await expect(respondLoad(ctx.db, t, id, { accept: true, freightCents: 10_000 })).rejects.toThrow(/aguardando/);
    expect((await loadableRequests(ctx.db, donoA)).map((x) => x.id)).toEqual([r1]);
    const dois = await callCarrier(ctx.db, donoA, { carrierId, requestIds: [r1], pickupDate: amanha(), period: "TARDE" });
    expect(dois.number).toBe(5002);
    await cancelLoad(ctx.db, donoA, dois.id, "Comprador pediu outra data");
    expect((await loadableRequests(ctx.db, donoA)).map((x) => x.id)).toEqual([r1]);
    await expect(cancelLoad(ctx.db, donoA, dois.id)).rejects.toThrow(/canceladas/);
  });

  it("plano grátis: limite de cargas aceitas no mês (regra editável); comissão pelo plano", async () => {
    const rules = await getBrasRules(ctx.db);
    await saveBrasRules(ctx.db, ctx.actors.master, { ...rules, carriers: { ...rules.carriers, freeLoadsPerMonth: 1 } });
    const { id: carrierId, actor: t } = await transportadoraComLogin();
    const a = await callCarrier(ctx.db, donoA, { carrierId, requestIds: [await pedidoPago()], pickupDate: amanha(), period: "MANHA" });
    const b = await callCarrier(ctx.db, donoA, { carrierId, requestIds: [await pedidoPago()], pickupDate: amanha(), period: "MANHA" });
    await respondLoad(ctx.db, t, a.id, { accept: true, freightCents: 10_000 });
    await expect(respondLoad(ctx.db, t, b.id, { accept: true, freightCents: 10_000 })).rejects.toThrow(/plano grátis vale até 1/);
    await updateCarrierProfile(ctx.db, ctx.actors.master, carrierId, { plan: "PRO" });
    expect((await respondLoad(ctx.db, t, b.id, { accept: true, freightCents: 10_000 })).commissionBps).toBe(600);
    expect((await carrierLoads(ctx.db, t)).usage).toMatchObject({ commissionBps: 600, freeLimit: null, acceptedThisMonth: 2 });
  });

  it("uma transportadora não vê nem responde carga de outra", async () => {
    const { id: carrierId } = await transportadoraComLogin();
    const { actor: outra } = await transportadoraComLogin({ ...transp, document: "52998224725", docType: "CPF" as never, name: "Autônomo João" });
    const { id } = await callCarrier(ctx.db, donoA, { carrierId, requestIds: [await pedidoPago()], pickupDate: amanha(), period: "MANHA" });
    expect((await carrierLoads(ctx.db, outra)).loads).toEqual([]);
    await expect(respondLoad(ctx.db, outra, id, { accept: true, freightCents: 10_000 })).rejects.toThrow(/não encontrada/);
    await expect(callCarrier(ctx.db, outra, { carrierId, requestIds: [], pickupDate: amanha(), period: "MANHA" })).rejects.toThrow();
  });
});

describe("link do motorista", () => {
  it("guarda só o hash; mostra coletas aceitas com código e marca a entrega; link novo desliga o anterior", async () => {
    const { id: carrierId, actor: t } = await transportadoraComLogin();
    const { token, path } = await createDriverLink(ctx.db, t, null);
    expect(path).toBe(`/motorista/${token}`);
    const c = (await ctx.db.query.trCarriers.findFirst({ where: eq(trCarriers.id, carrierId) }))!;
    expect(c.driverTokenHash).not.toContain(token);
    expect((await carrierByDriverToken(ctx.db, token))!.id).toBe(carrierId);
    expect(await carrierByDriverToken(ctx.db, "curto")).toBeNull();

    const r1 = await pedidoPago();
    const { id } = await callCarrier(ctx.db, donoA, { carrierId, requestIds: [r1], pickupDate: amanha(), period: "MANHA" });
    expect((await driverQueue(ctx.db, token))!.coletar).toEqual([]); // não aceita ainda
    await respondLoad(ctx.db, t, id, { accept: true, freightCents: 20_000 });
    const q = (await driverQueue(ctx.db, token))!;
    expect(q.coletar).toHaveLength(1);
    expect(q.coletar[0]!.freightCents).toBeNull();
    const code = q.coletar[0]!.requests[0]!.pickupCode!;
    await expect(driverMarkDelivered(ctx.db, token, id)).rejects.toThrow(/código/);
    await importerConfirmPickup(ctx.db, donoA, r1, code);
    expect((await driverQueue(ctx.db, token))!.entregar).toHaveLength(1);
    await driverMarkDelivered(ctx.db, token, id);
    expect((await ctx.db.query.trLoads.findFirst({ where: eq(trLoads.id, id) }))!.status).toBe("ENTREGUE");

    const novo = await createDriverLink(ctx.db, ctx.actors.master, carrierId);
    expect(await driverQueue(ctx.db, token)).toBeNull();
    expect(await driverQueue(ctx.db, novo.token)).not.toBeNull();
    await revokeDriverLink(ctx.db, t, null);
    expect(await driverQueue(ctx.db, novo.token)).toBeNull();
    await expect(createDriverLink(ctx.db, donoA, carrierId)).rejects.toThrow();
  });
});

describe("produtos ligados", () => {
  it("volume e peso da coleta vêm das medidas das caixas", async () => {
    const { id: pid } = await saveImporterProduct(ctx.db, donoA, null, null, { sku: "gt-48", title: "Garrafa", unitsPerBox: 24, boxLengthMm: 500, boxWidthMm: 400, boxHeightMm: 300, grossWeightG: 12_000, priceTiers: [{ minBoxes: 1, priceBoxCents: 30_000 }], minBoxes: 1, status: "ATIVO" });
    const { moveImporterStock } = await import("@/lib/domain/bras/importadora");
    await moveImporterStock(ctx.db, donoA, null, { productId: pid, kind: "ENTRADA", boxes: 20 });
    await setBrasOffer(ctx.db, ctx.actors.master, vA, { importerId: impA, priceBoxCents: 30_000, unitsPerBox: 24, boxesAvailable: 50, productId: pid });
    const { id: carrierId } = await transportadoraComLogin();
    const r1 = await pedidoPago();
    const { id } = await callCarrier(ctx.db, donoA, { carrierId, requestIds: [r1], pickupDate: amanha(), period: "MANHA" });
    const l = (await ctx.db.query.trLoads.findFirst({ where: eq(trLoads.id, id) }))!;
    expect(l.volumeLiters).toBe(120); // 60 L por caixa × 2
    expect(l.weightKg).toBe(24);
  });
});
