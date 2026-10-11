import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { clubReferrals, trParcels, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { getBrasMemberByUser, signupBrasMember } from "@/lib/domain/bras/membros";
import { createCarrier, createCarrierAccess } from "@/lib/domain/cargas/cargas";
import { busCollectParcel, createTrip, reserveParcels, respondParcel, saveRoute } from "@/lib/domain/cargas/excursao";
import { referCarrier } from "@/lib/domain/club/indicacoes";
import { cancelTicket, closeTicket, getMeuContadorSettings, myTickets, openTicket, saveMeuContadorSettings, takeTicket, ticketMessage, ticketQueue } from "@/lib/domain/fiscal/meu-contador";
import { requestOrigin } from "@/lib/base-url";

/** D117 (fase E5 do Club): Meu Contador e convite à loja para a nota. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let ana: Actor; let bia: Actor; let bus: Actor; let parcelId: string; let departIso: string;
const NFE = "35261047173173000175550010000000111000000018";
const loginComo = async (userId: string) => actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, userId) }))!);
const local = (d: Date) => new Date(d.getTime() - 3 * 3_600_000).toISOString().slice(0, 16);

async function membro(nome: string, cnpj: string, email: string) {
  const r = await signupBrasMember(ctx.db, { name: nome, companyName: `${nome} LTDA`, cnpj, whatsapp: "11988887777", email, password: "senha-forte-1", acceptTerms: true });
  const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
  return { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null } as Actor;
}

beforeEach(async () => {
  ctx = await freshDb();
  ana = await membro("Ana", "11222333000181", "ana@u.teste");
  bia = await membro("Bia", "11444777000161", "bia@u.teste");
  const busId = (await createCarrier(ctx.db, ctx.actors.master, { name: "Mauricio Turismo", docType: "CNPJ", document: "47.173.173/0001-75", contactName: "Mauricio", phone: "11999990000", ufs: ["MG"], vehicles: ["ONIBUS_EXCURSAO"], operation: "EXCURSAO" })).id;
  bus = await loginComo((await createCarrierAccess(ctx.db, ctx.actors.master, busId, { name: "Mauricio", email: "m@s.teste", password: "senha-forte-1" })).userId);
  const routeId = (await saveRoute(ctx.db, bus, null, null, { name: "Brás ↔ BH", originCity: "Belo Horizonte", originUf: "MG", brasPoint: "Rua Rodrigues dos Santos, 600", cityPoint: "Rodoviária de BH", travelHours: 9, prices: { P: 3_000, M: 5_000, G: 8_000 } })).id;
  const depart = new Date(Date.now() + 2 * 86_400_000 + 8 * 3_600_000);
  departIso = new Date(local(depart) + ":00-03:00").toISOString();
  const { id: tripId } = await createTrip(ctx.db, bus, null, { routeId, arriveBrasAt: local(new Date(Date.now() + 2 * 86_400_000)), departAt: local(depart) });
  parcelId = (await reserveParcels(ctx.db, ana, { tripId, items: { P: 1, M: 0, G: 0 }, storeName: "Loja do Zé", recipientName: "Ana" })).parcels[0]!.id;
  await respondParcel(ctx.db, bus, parcelId, { accept: true });
});

describe("Meu Contador", () => {
  it("chamado do fardo sem nota: prazo = saída do ônibus; contador resolve e a nota vai para o fardo, que embarca", async () => {
    await expect(busCollectParcel(ctx.db, bus, "8001-01")).rejects.toThrow(/sem nota/i);
    await saveMeuContadorSettings(ctx.db, ctx.actors.master, { priceCents: 9_900, slaHours: 4, hours: "Seg a sáb", charging: false });
    const t = await openTicket(ctx.db, ana, { parcelId, storeName: "Loja do Zé", storePhone: "(11) 95555-4444", description: "10 kits de potes", approxValueCents: 50_000 });
    expect(t).toMatchObject({ number: 3001, priceCents: 9_900, charging: false, deadlineAt: departIso });
    await expect(openTicket(ctx.db, ana, { parcelId, storeName: "Loja", description: "de novo aqui" })).rejects.toThrow(/Já existe o chamado 3001/);
    await expect(openTicket(ctx.db, bia, { parcelId, storeName: "Loja", description: "não é meu" })).rejects.toThrow(/não encontrado/);
    const q = await ticketQueue(ctx.db, ctx.actors.master);
    expect(q.open[0]!.minutesLeft).toBeGreaterThan(60);
    await expect(ticketQueue(ctx.db, ana)).rejects.toThrow();
    await ticketMessage(ctx.db, ana, t.id, "A loja não emite nota");
    await takeTicket(ctx.db, ctx.actors.master, t.id);
    await ticketMessage(ctx.db, ctx.actors.master, t.id, "Vou falar com a loja agora");
    await expect(closeTicket(ctx.db, ctx.actors.master, t.id, { resolved: true, invoiceKey: "123" })).rejects.toThrow(/inválida/);
    await closeTicket(ctx.db, ctx.actors.master, t.id, { resolved: true, invoiceKey: NFE, note: "Loja emitiu com ajuda" });
    const [mine] = await myTickets(ctx.db, ana);
    expect(mine).toMatchObject({ status: "RESOLVIDO", invoiceKey: NFE });
    expect(mine!.messages.map((m) => m.author)).toEqual(["CLIENTE", "CONTADOR"]);
    expect((await ctx.db.query.trParcels.findFirst({ where: eq(trParcels.id, parcelId) }))!.invoiceKey).toBe(NFE);
    await busCollectParcel(ctx.db, bus, "8001-01");
    await expect(ticketMessage(ctx.db, ana, t.id, "obrigada")).rejects.toThrow(/encerrado/);
    expect((await ticketQueue(ctx.db, ctx.actors.master)).stats).toMatchObject({ resolved: 1, onTimePct: 100 });
    expect(await myTickets(ctx.db, bia)).toEqual([]);
  });

  it("sem solução exige motivo; chamado sem fardo usa o prazo padrão; cancelar só antes do atendimento", async () => {
    const t = await openTicket(ctx.db, ana, { storeName: "Outra loja", description: "Compra avulsa de 3 fardos" });
    expect(new Date(t.deadlineAt).getTime() - Date.now()).toBeGreaterThan(3.9 * 3_600_000);
    await expect(closeTicket(ctx.db, ctx.actors.master, t.id, { resolved: false, note: " " })).rejects.toThrow(/motivo/);
    await closeTicket(ctx.db, ctx.actors.master, t.id, { resolved: false, note: "Loja fechada hoje; vai na próxima viagem" });
    expect((await myTickets(ctx.db, ana))[0]!.status).toBe("SEM_SOLUCAO");
    const t2 = await openTicket(ctx.db, ana, { storeName: "Mais uma", description: "Outra compra aqui" });
    await cancelTicket(ctx.db, ana, t2.id);
    const t3 = await openTicket(ctx.db, ana, { storeName: "Mais uma", description: "Mais outra compra" });
    await takeTicket(ctx.db, ctx.actors.master, t3.id);
    await expect(cancelTicket(ctx.db, ana, t3.id)).rejects.toThrow(/não atendido/);
    expect((await getMeuContadorSettings(ctx.db)).charging).toBe(false);
  });
});

describe("convite à loja (Nota Fácil)", () => {
  it("indicação do tipo loja com a mensagem do Nota Fácil; o mesmo WhatsApp vale uma vez", async () => {
    const r = await referCarrier(ctx.db, ana, { kind: "LOJA", name: "Loja do Zé", phone: "11955554444", contextType: "fardo", contextId: parcelId });
    expect(r.status).toBe("CREATED");
    expect(decodeURIComponent((r as { whatsappUrl: string }).whatsappUrl)).toMatch(/Nota Fácil/);
    expect((await referCarrier(ctx.db, bia, { kind: "LOJA", name: "Zé", phone: "11955554444" })).status).toBe("ALREADY_REFERRED");
    expect((await ctx.db.select().from(clubReferrals))[0]).toMatchObject({ kind: "LOJA", contextId: parcelId });
  });
});

describe("endereço público dos links", () => {
  it("usa o domínio do proxy, não o endereço interno do servidor", () => {
    expect(requestOrigin(new Request("http://localhost:10000/r/abc", { headers: { "x-forwarded-host": "superdrop.com.br", "x-forwarded-proto": "https" } }))).toBe("https://superdrop.com.br");
    expect(requestOrigin(new Request("http://localhost:3300/c/ABC123", { headers: { host: "127.0.0.1:3300" } }))).toBe("http://127.0.0.1:3300");
  });
});
