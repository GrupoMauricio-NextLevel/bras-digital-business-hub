import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { trCarriers, trFreightPayments, trParcels, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { getBrasMemberByUser, signupBrasMember } from "@/lib/domain/bras/membros";
import { createCarrier, createCarrierAccess } from "@/lib/domain/cargas/cargas";
import { busCollectParcel, cancelMyParcel, createTrip, reserveParcels, respondParcel, saveRoute, tripAction } from "@/lib/domain/cargas/excursao";
import { saveExcursionRules } from "@/lib/domain/cargas/regras-excursao";
import { carrierPaymentQueue, carrierPixStatus, checkMyFreightPayment, connectCarrierMp, createFreightPix, excursionFeeReport, registerParcelPayment, syncFreightPayment, trustClientOfParcel } from "@/lib/domain/cargas/frete-pix";
import { myFreights } from "@/lib/domain/frete/painel";

/** D119 (fase E7 do Club): frete do ônibus por Pix na conta do dono do ônibus. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let ana: Actor; let bia: Actor; let bus: Actor; let busId: string; let tripId: string;
const NFE = "35261047173173000175550010000000111000000018";
const loginComo = async (userId: string) => actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, userId) }))!);
const local = (d: Date) => new Date(d.getTime() - 3 * 3_600_000).toISOString().slice(0, 16);

async function membro(nome: string, cnpj: string, email: string) {
  const r = await signupBrasMember(ctx.db, { name: nome, companyName: `${nome} LTDA`, cnpj, whatsapp: "11988887777", email, password: "senha-forte-1", acceptTerms: true });
  const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
  return { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null } as Actor;
}

/** Mercado Pago simulado: guarda as cobranças Pix e responde à consulta com a situação que o teste definir. */
function fakeMp() {
  const pays = new Map<string, { id: number; status: string; external_reference: string; transaction_amount: number }>();
  let next = 500;
  const f = (async (url: string, init?: RequestInit) => {
    const u = String(url);
    const auth = String((init?.headers as Record<string, string> | undefined)?.Authorization ?? "");
    if (!auth.startsWith("Bearer TEST-")) return new Response(JSON.stringify({ message: "invalid" }), { status: 401 });
    if (u.endsWith("/users/me")) return new Response(JSON.stringify({ id: 99, nickname: "STARLINE" }), { status: 200 });
    if (init?.method === "POST" && u.endsWith("/v1/payments")) {
      const b = JSON.parse(String(init.body)); const id = next++;
      pays.set(String(id), { id, status: "pending", external_reference: b.external_reference, transaction_amount: b.transaction_amount });
      return new Response(JSON.stringify({ id, point_of_interaction: { transaction_data: { qr_code: `000201PIX${id}`, qr_code_base64: "" } } }), { status: 201 });
    }
    const m = /\/v1\/payments\/(\d+)$/.exec(u);
    if (m) { const p = pays.get(m[1]!); return p ? new Response(JSON.stringify(p), { status: 200 }) : new Response("{}", { status: 404 }); }
    if (u.includes("/v1/payments/search")) { const ref = new URL(u).searchParams.get("external_reference"); return new Response(JSON.stringify({ results: [...pays.values()].filter((p) => p.external_reference === ref) }), { status: 200 }); }
    return new Response("{}", { status: 404 });
  }) as never;
  return { f, pays, approve: (ref: string, amount?: number) => { const p = [...pays.values()].find((x) => x.external_reference === ref)!; p.status = "approved"; if (amount !== undefined) p.transaction_amount = amount; } };
}

beforeEach(async () => {
  ctx = await freshDb();
  ana = await membro("Ana", "11222333000181", "ana@u.teste");
  bia = await membro("Bia", "11444777000161", "bia@u.teste");
  busId = (await createCarrier(ctx.db, ctx.actors.master, { name: "Mauricio Turismo", docType: "CNPJ", document: "47.173.173/0001-75", contactName: "Mauricio", phone: "11999990000", ufs: ["MG"], vehicles: ["ONIBUS_EXCURSAO"], operation: "EXCURSAO" })).id;
  bus = await loginComo((await createCarrierAccess(ctx.db, ctx.actors.master, busId, { name: "Mauricio", email: "m@s.teste", password: "senha-forte-1" })).userId);
  const routeId = (await saveRoute(ctx.db, bus, null, null, { name: "Brás ↔ BH", originCity: "Belo Horizonte", originUf: "MG", brasPoint: "Rua Rodrigues dos Santos, 600", cityPoint: "Rodoviária de BH", travelHours: 9, prices: { P: 3_000, M: 5_000, G: 8_000 } })).id;
  tripId = (await createTrip(ctx.db, bus, null, { routeId, arriveBrasAt: local(new Date(Date.now() + 2 * 86_400_000)), departAt: local(new Date(Date.now() + 2 * 86_400_000 + 8 * 3_600_000)) })).id;
});

async function reservar(who: Actor, items = { P: 1, M: 1, G: 0 }) {
  const r = await reserveParcels(ctx.db, who, { tripId, items, storeName: "Loja do Zé", recipientName: who === ana ? "Ana" : "Bia", invoiceKey: NFE });
  for (const p of r.parcels) await respondParcel(ctx.db, bus, p.id, { accept: true });
  return r.parcels;
}

describe("Pix desligado (padrão)", () => {
  it("o fardo aceito fica 'combinar' e embarca como antes, mesmo com o Mercado Pago conectado", async () => {
    const mp = fakeMp();
    await connectCarrierMp(ctx.db, bus, null, { accessToken: "TEST-1234567890abcdefghij" }, mp.f);
    expect(await carrierPixStatus(ctx.db, bus)).toMatchObject({ connected: true, accountId: "99", pixOnline: false });
    const [p] = await reservar(ana);
    expect((await ctx.db.query.trParcels.findFirst({ where: eq(trParcels.id, p!.id) }))!.payStatus).toBe("COMBINAR");
    await busCollectParcel(ctx.db, bus, p!.label);
    await expect(createFreightPix(ctx.db, ana, tripId, { fetchImpl: mp.f })).rejects.toThrow(/Nenhum fardo/);
  });
});

describe("Pix ligado", () => {
  beforeEach(async () => { await saveExcursionRules(ctx.db, ctx.actors.master, { pixOnline: true }); });

  it("token guardado criptografado; token inválido recusado; ônibus sem Mercado Pago continua 'combinar'", async () => {
    const mp = fakeMp();
    await expect(connectCarrierMp(ctx.db, bus, null, { accessToken: "abc-1234567890abcdefghij" }, mp.f)).rejects.toThrow(/APP_USR-/);
    const [p] = await reservar(ana);
    expect((await ctx.db.query.trParcels.findFirst({ where: eq(trParcels.id, p!.id) }))!.payStatus).toBe("COMBINAR");
    await connectCarrierMp(ctx.db, bus, null, { accessToken: "TEST-1234567890abcdefghij" }, mp.f);
    const row = (await ctx.db.query.trCarriers.findFirst({ where: eq(trCarriers.id, busId) }))!;
    expect(row.mpAccessTokenEnc).toBeTruthy();
    expect(row.mpAccessTokenEnc).not.toContain("TEST-1234567890");
    expect(JSON.stringify(await carrierPixStatus(ctx.db, bus))).not.toMatch(/TEST-|Enc/);
  });

  it("aceito → a pagar; não embarca sem Pix; Pix na conta do ônibus, conferido na API, aplicado uma vez", async () => {
    const mp = fakeMp();
    await connectCarrierMp(ctx.db, bus, null, { accessToken: "TEST-1234567890abcdefghij" }, mp.f);
    const [p1, p2] = await reservar(ana);
    await expect(busCollectParcel(ctx.db, bus, p1!.label)).rejects.toThrow(/não pago/);
    const pix = await createFreightPix(ctx.db, ana, tripId, { fetchImpl: mp.f });
    expect(pix).toMatchObject({ amountCents: 8_000, parcels: 2, status: "PENDENTE" });
    expect(pix.pixCode).toMatch(/^000201PIX/);
    // De novo, com os mesmos fardos: a mesma cobrança (sem gerar outro Pix).
    expect((await createFreightPix(ctx.db, ana, tripId, { fetchImpl: mp.f })).id).toBe(pix.id);
    expect(mp.pays.size).toBe(1);
    await expect(createFreightPix(ctx.db, bia, tripId, { fetchImpl: mp.f })).rejects.toThrow(/Nenhum fardo/);
    await expect(checkMyFreightPayment(ctx.db, bia, pix.id, mp.f)).rejects.toThrow(/não encontrado/);
    // Pendente no Mercado Pago: nada muda.
    expect((await checkMyFreightPayment(ctx.db, ana, pix.id, mp.f)).paid).toBe(false);
    // Aprovado com valor menor: não vale.
    mp.approve(pix.id, 10);
    expect((await syncFreightPayment(ctx.db, pix.id, mp.f)).paid).toBe(false);
    mp.approve(pix.id, 80);
    expect((await syncFreightPayment(ctx.db, pix.id, mp.f)).paid).toBe(true);
    expect((await syncFreightPayment(ctx.db, pix.id, mp.f)).paid).toBe(true);
    const parcels = await ctx.db.select().from(trParcels).where(eq(trParcels.tripId, tripId));
    expect(parcels.map((x) => x.payStatus)).toEqual(["PAGO", "PAGO"]);
    expect((await ctx.db.query.trFreightPayments.findFirst({ where: eq(trFreightPayments.id, pix.id) }))!.status).toBe("PAGO");
    await busCollectParcel(ctx.db, bus, p1!.label);
    // Painel do cliente mostra a situação do pagamento.
    const f = (await myFreights(ctx.db, ana)).find((x) => x.parcel?.label === p2!.label)!;
    expect(f.parcel!.payStatus).toBe("PAGO");
  });

  it("fardos mudaram: a cobrança anterior expira e nasce outra com o valor certo", async () => {
    const mp = fakeMp();
    await connectCarrierMp(ctx.db, bus, null, { accessToken: "TEST-1234567890abcdefghij" }, mp.f);
    const [p1] = await reservar(ana);
    const a = await createFreightPix(ctx.db, ana, tripId, { fetchImpl: mp.f });
    await cancelMyParcel(ctx.db, ana, p1!.id);
    const b = await createFreightPix(ctx.db, ana, tripId, { fetchImpl: mp.f });
    expect(b.id).not.toBe(a.id);
    expect(b.amountCents).toBe(5_000);
    expect((await ctx.db.query.trFreightPayments.findFirst({ where: eq(trFreightPayments.id, a.id) }))!.status).toBe("EXPIRADO");
  });

  it("cliente de confiança paga na chegada; o ônibus registra o recebido; pago que não viajou vira 'devolver'", async () => {
    const mp = fakeMp();
    await connectCarrierMp(ctx.db, bus, null, { accessToken: "TEST-1234567890abcdefghij" }, mp.f);
    const [b1] = await reservar(bia, { P: 1, M: 0, G: 0 });
    await trustClientOfParcel(ctx.db, bus, b1!.id, true);
    expect((await ctx.db.query.trParcels.findFirst({ where: eq(trParcels.id, b1!.id) }))!.payStatus).toBe("NA_CHEGADA");
    const [b2] = await reservar(bia, { P: 1, M: 0, G: 0 });
    expect((await ctx.db.query.trParcels.findFirst({ where: eq(trParcels.id, b2!.id) }))!.payStatus).toBe("NA_CHEGADA");
    await busCollectParcel(ctx.db, bus, b1!.label);
    expect((await carrierPaymentQueue(ctx.db, bus)).onArrival.map((x) => x.label)).toEqual(expect.arrayContaining([b1!.label, b2!.label]));
    await registerParcelPayment(ctx.db, bus, b1!.id, "RECEBIDO");
    await expect(registerParcelPayment(ctx.db, bus, b1!.id, "RECEBIDO")).rejects.toThrow(/não está marcado/);

    // Ana paga e a viagem é cancelada: o Pix fica para o ônibus devolver.
    await reservar(ana, { P: 1, M: 0, G: 0 });
    const pix = await createFreightPix(ctx.db, ana, tripId, { fetchImpl: mp.f });
    mp.approve(pix.id);
    await syncFreightPayment(ctx.db, pix.id, mp.f);
    await tripAction(ctx.db, bus, tripId, "CANCELAR");
    const q = await carrierPaymentQueue(ctx.db, bus);
    expect(q.toRefund).toHaveLength(1);
    await registerParcelPayment(ctx.db, bus, q.toRefund[0]!.id, "DEVOLVIDO");
    expect((await carrierPaymentQueue(ctx.db, bus)).toRefund).toEqual([]);
    await expect(trustClientOfParcel(ctx.db, ana, b1!.id, true)).rejects.toThrow();
  });

  it("Master vê a taxa a faturar por ônibus e mês; só o Master", async () => {
    const mp = fakeMp();
    await connectCarrierMp(ctx.db, bus, null, { accessToken: "TEST-1234567890abcdefghij" }, mp.f);
    const [p1] = await reservar(ana, { P: 1, M: 0, G: 0 });
    const pix = await createFreightPix(ctx.db, ana, tripId, { fetchImpl: mp.f });
    mp.approve(pix.id);
    await syncFreightPayment(ctx.db, pix.id, mp.f);
    await busCollectParcel(ctx.db, bus, p1!.label);
    const [row] = await excursionFeeReport(ctx.db, ctx.actors.master);
    expect(row).toMatchObject({ carrier: "Mauricio Turismo", parcels: 1, freightCents: 3_000, pixCents: 3_000, feeCents: 150 });
    await expect(excursionFeeReport(ctx.db, bus)).rejects.toThrow();
  });
});
