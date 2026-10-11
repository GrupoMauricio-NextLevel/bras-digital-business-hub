import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { clubLedger, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { getBrasMemberByUser, signupBrasMember } from "@/lib/domain/bras/membros";
import { grantBrasAccess } from "@/lib/domain/bras/descobertas";
import { createCarrier, createCarrierAccess } from "@/lib/domain/cargas/cargas";
import { busCollectParcel, busDeliverParcel, createTrip, myParcels, reserveParcels, respondParcel, saveRoute, tripAction } from "@/lib/domain/cargas/excursao";
import { clubBalance, clubPanel } from "@/lib/domain/club/pontos";
import { createCounter, myClubCard, registerPurchase } from "@/lib/domain/club/balcao";

/** D121 (fase E8b do Club): benefícios cruzados do grupo. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let ana: Actor; let gui: Actor; let anaMember: string;
const NFE = "35261047173173000175550010000000111000000018";
const loginComo = async (userId: string) => actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, userId) }))!);
const local = (d: Date) => new Date(d.getTime() - 3 * 3_600_000).toISOString().slice(0, 16);
async function membro(nome: string, cnpj: string, email: string) {
  const r = await signupBrasMember(ctx.db, { name: nome, companyName: `${nome} LTDA`, cnpj, whatsapp: "11988887777", email, password: "senha-forte-1", acceptTerms: true });
  const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
  return { actor: { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null } as Actor, memberId: m.id };
}

beforeEach(async () => {
  ctx = await freshDb();
  const a = await membro("Ana", "11222333000181", "ana@u.teste"); ana = a.actor; anaMember = a.memberId;
  gui = (await membro("Guilherme Guia", "11444777000161", "gui@u.teste")).actor;
});

async function viagemEntregue(document: string, name: string, email: string) {
  const id = (await createCarrier(ctx.db, ctx.actors.master, { name, docType: "CNPJ", document, contactName: "Dono", phone: "11999990000", ufs: ["MG"], vehicles: ["ONIBUS_EXCURSAO"], operation: "EXCURSAO" })).id;
  const bus = await loginComo((await createCarrierAccess(ctx.db, ctx.actors.master, id, { name: "Dono", email, password: "senha-forte-1" })).userId);
  const routeId = (await saveRoute(ctx.db, bus, null, null, { name: "Brás ↔ BH", originCity: "Belo Horizonte", originUf: "MG", brasPoint: "Rua Rodrigues dos Santos, 600", cityPoint: "Rodoviária de BH", travelHours: 9, prices: { P: 3_000, M: 5_000, G: 8_000 } })).id;
  const tripId = (await createTrip(ctx.db, bus, null, { routeId, arriveBrasAt: local(new Date(Date.now() + 2 * 86_400_000)), departAt: local(new Date(Date.now() + 2 * 86_400_000 + 8 * 3_600_000)) })).id;
  const r = await reserveParcels(ctx.db, ana, { tripId, items: { P: 2, M: 0, G: 0 }, storeName: "Loja do Zé", recipientName: "Ana", invoiceKey: NFE });
  for (const p of r.parcels) { await respondParcel(ctx.db, bus, p.id, { accept: true }); await busCollectParcel(ctx.db, bus, p.label); }
  await tripAction(ctx.db, bus, tripId, "SAIR"); await tripAction(ctx.db, bus, tripId, "CHEGAR");
  const mine = await myParcels(ctx.db, ana);
  for (const p of r.parcels) await busDeliverParcel(ctx.db, bus, p.id, mine.find((x) => x.id === p.id)!.deliveryCode);
  return { bus, parcels: r.parcels };
}

describe("fardo entregue por ônibus do grupo", () => {
  it("Starline (empresa do grupo): pontos por fardo, pagos pela Starline, uma vez por fardo", async () => {
    await viagemEntregue("47.173.173/0001-75", "Mauricio Turismo", "m@s.teste");
    const rows = await ctx.db.select().from(clubLedger).where(eq(clubLedger.source, "PARCEL_DELIVERED"));
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.funder === "STARLINE" && r.points === 100 && r.userId === ana.userId)).toBe(true);
    expect((await clubBalance(ctx.db, ana.userId)).available).toBeGreaterThanOrEqual(200);
  });

  it("ônibus de fora do grupo não dá os pontos do grupo", async () => {
    await viagemEntregue("11.444.777/0001-61", "Excursão da Cida", "c@c.teste");
    expect(await ctx.db.select().from(clubLedger).where(eq(clubLedger.source, "PARCEL_DELIVERED"))).toEqual([]);
  });
});

describe("plano da Brás dá impulso de nível", () => {
  it("Ouro é no mínimo Frequente; Platinum é VIP", async () => {
    expect((await clubPanel(ctx.db, ana)).level.level).toBe("MEMBRO");
    await grantBrasAccess(ctx.db, ctx.actors.master, { memberId: anaMember, kind: "COURTESY", plan: "OURO", days: 30 });
    expect((await clubPanel(ctx.db, ana)).level.level).toBe("FREQUENTE");
    await grantBrasAccess(ctx.db, ctx.actors.master, { memberId: anaMember, kind: "COURTESY", plan: "PLATINUM", days: 30 });
    expect((await clubPanel(ctx.db, ana)).level.level).toBe("VIP");
  });
});

describe("guia de excursão no balcão", () => {
  it("o guia ganha o percentual do que o passageiro pagou, pago pela empresa da compra; o guia não pode ser o próprio cliente", async () => {
    const card = (await myClubCard(ctx.db, ana.userId)).token;
    const guideCard = (await myClubCard(ctx.db, gui.userId)).token;
    const { token } = await createCounter(ctx.db, ctx.actors.master, { company: "MEGATRON", name: "Mega Tron · box 12" });
    const r = await registerPurchase(ctx.db, token, { card, valueCents: 50_000, receipt: "G1", guideCard });
    expect(r).toMatchObject({ points: 1_000, guideName: "Guilherme", guidePoints: 1_000 });
    const g = (await ctx.db.select().from(clubLedger).where(eq(clubLedger.userId, gui.userId)))[0]!;
    expect(g).toMatchObject({ source: "GUIDE", funder: "MEGATRON", points: 1_000 });
    await expect(registerPurchase(ctx.db, token, { card, valueCents: 10_000, receipt: "G2", guideCard: card })).rejects.toThrow(/próprio cliente/);
  });
});
