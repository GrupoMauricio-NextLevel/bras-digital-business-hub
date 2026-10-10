import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { clubLedger, clubReferrals, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { getBrasMemberByUser, signupBrasMember } from "@/lib/domain/bras/membros";
import { addBrasVideo } from "@/lib/domain/bras/videos";
import { addBrasImporter, createBrasRequest, setBrasOffer, setBrasRequestStatus } from "@/lib/domain/bras/catalogo";
import { createImporterAccess, importerConfirmPickup } from "@/lib/domain/bras/importadora";
import { callCarrier, carrierMarkDelivered, createCarrier, createCarrierAccess, respondLoad } from "@/lib/domain/cargas/cargas";
import { activateReferralManually, referCarrier } from "@/lib/domain/club/indicacoes";
import {
  applyVoucher, cancelVoucher, clubAdmin, clubBalance, clubLevel, clubPanel, creditPoints, myClubCode, redeemVoucher, referrerByCode, registerClientReferral, reviewPoints,
} from "@/lib/domain/club/pontos";
import { DEFAULT_CLUB_RULES, getClubRules, pointsToCents, saveClubRules } from "@/lib/domain/club/regras";

/** D115 (fase E4 do Club): pontos por indicação ativada, missões, nível, vales e antifraude. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let ana: Actor; let dono: Actor; let vA: string;
const loginComo = async (userId: string) => actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, userId) }))!);
const envio = { shipName: "Recebimento", shipAddress: "Rua das Flores, 100", shipCity: "Curitiba", shipState: "PR" as const, shipZip: "80010-000", carrier: "Braspress" };
const amanha = () => new Date(Date.now() + 86_400_000 - 3 * 3_600_000).toISOString().slice(0, 10);

async function membro(nome: string, cnpj: string, email: string, whatsapp = "11988887777") {
  const r = await signupBrasMember(ctx.db, { name: nome, companyName: `${nome} LTDA`, cnpj, whatsapp, email, password: "senha-forte-1", acceptTerms: true });
  const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
  return { actor: { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null } as Actor, memberId: r.memberId };
}

beforeEach(async () => {
  ctx = await freshDb();
  ana = (await membro("Ana", "11222333000181", "ana@u.teste")).actor;
  const imp = (await addBrasImporter(ctx.db, ctx.actors.master, { name: "XDX Importadora" })).id;
  vA = (await addBrasVideo(ctx.db, ctx.actors.master, { url: "aaaaaaaaaa1", title: "Garrafa" })).id;
  await setBrasOffer(ctx.db, ctx.actors.master, vA, { importerId: imp, priceBoxCents: 30_000, unitsPerBox: 24, boxesAvailable: 50 });
  dono = await loginComo((await createImporterAccess(ctx.db, ctx.actors.master, imp, { name: "Dono", email: "dono@xdx.teste", password: "senha-forte-1" })).userId);
});

describe("indicação → pontos", () => {
  it("cliente convidado pelo link: pontos só no primeiro pedido pago; estorno devolve; o mesmo WhatsApp vale uma vez", async () => {
    const code = await myClubCode(ctx.db, ana.userId);
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
    expect(await myClubCode(ctx.db, ana.userId)).toBe(code);
    expect(await referrerByCode(ctx.db, code)).toBe(ana.userId);
    const bia = await membro("Bia", "11444777000161", "bia@u.teste", "31977776666");
    expect(await registerClientReferral(ctx.db, { referrerUserId: ana.userId, newUserId: bia.actor.userId, name: "Bia", phone: "31977776666", memberId: bia.memberId, partnerAttributed: false })).not.toBeNull();
    // Mesmo WhatsApp de novo, parceiro ou a própria pessoa: não vira indicação.
    expect(await registerClientReferral(ctx.db, { referrerUserId: ana.userId, newUserId: bia.actor.userId, name: "Bia", phone: "5531977776666", memberId: bia.memberId, partnerAttributed: false })).toBeNull();
    expect(await registerClientReferral(ctx.db, { referrerUserId: ana.userId, newUserId: "x", name: "X", phone: "11900000000", memberId: "m", partnerAttributed: true })).toBeNull();
    expect(await registerClientReferral(ctx.db, { referrerUserId: ana.userId, newUserId: ana.userId, name: "Eu", phone: "11911111111", memberId: "m", partnerAttributed: false })).toBeNull();
    // Pontos a caminho aparecem no painel; disponíveis só no pedido pago.
    expect((await clubPanel(ctx.db, ana)).pending).toBe(500);
    const { id } = await createBrasRequest(ctx.db, bia.actor, { videoId: vA, boxes: 1, ...envio });
    await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "CONFIRMED");
    expect((await clubBalance(ctx.db, ana.userId)).available).toBe(0);
    await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "PAID");
    expect((await clubBalance(ctx.db, ana.userId)).available).toBe(500);
    expect((await ctx.db.select().from(clubReferrals))[0]!.status).toBe("ATIVOU");
    await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "CANCELED");
    expect((await clubBalance(ctx.db, ana.userId)).available).toBe(0);
    expect((await ctx.db.select().from(clubReferrals))[0]!.status).toBe("CADASTROU");
    // Comprou de novo: credita uma vez mais, nunca duas.
    const dois = await createBrasRequest(ctx.db, bia.actor, { videoId: vA, boxes: 1, ...envio });
    await setBrasRequestStatus(ctx.db, ctx.actors.master, dois.id, "CONFIRMED");
    await setBrasRequestStatus(ctx.db, ctx.actors.master, dois.id, "PAID");
    expect((await clubBalance(ctx.db, ana.userId)).available).toBe(500);
    const ledger = await ctx.db.select().from(clubLedger).where(eq(clubLedger.userId, ana.userId));
    expect(ledger.map((l) => l.points).sort((a, b) => a - b)).toEqual([-500, 500, 500]);
  });

  it("transportadora indicada: primeira entrega pelo sistema → pontos de transportadora (regra do momento)", async () => {
    await saveClubRules(ctx.db, ctx.actors.master, { referral: { ...DEFAULT_CLUB_RULES.referral, TRANSPORTADORA: 1_200 } });
    await referCarrier(ctx.db, ana, { kind: "TRANSPORTADORA", name: "Rápido", phone: "11977776666" });
    const cid = (await createCarrier(ctx.db, ctx.actors.master, { name: "Rápido", docType: "CNPJ", document: "11.444.777/0001-61", contactName: "Antônio", phone: "11977776666", ufs: ["PR"], vehicles: ["TRUCK"] })).id;
    const t = await loginComo((await createCarrierAccess(ctx.db, ctx.actors.master, cid, { name: "Antônio", email: "a@t.teste", password: "senha-forte-1" })).userId);
    const { id } = await createBrasRequest(ctx.db, ana, { videoId: vA, boxes: 1, ...envio, carrier: "", carrierId: cid });
    await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "CONFIRMED");
    await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "PAID");
    const load = await callCarrier(ctx.db, dono, { carrierId: cid, requestIds: [id], pickupDate: amanha(), period: "MANHA" });
    await respondLoad(ctx.db, t, load.id, { accept: true, freightCents: 10_000 });
    const code = (await ctx.db.query.bdRequests.findFirst({ where: (r, { eq: e }) => e(r.id, id) }))!.pickupCode!;
    await importerConfirmPickup(ctx.db, dono, id, code);
    expect((await clubBalance(ctx.db, ana.userId)).available).toBe(0);
    await carrierMarkDelivered(ctx.db, t, load.id);
    expect((await clubBalance(ctx.db, ana.userId)).available).toBe(1_200);
    // Missão "traga a sua transportadora" do mês credita uma vez.
    const p1 = await clubPanel(ctx.db, ana);
    expect(p1.missions.find((m) => m.key === "TRAGA_TRANSPORTADORA")!.done).toBe(true);
    expect(p1.balance.available).toBe(1_500);
    expect((await clubPanel(ctx.db, ana)).balance.available).toBe(1_500);
    expect(p1.badges.find((b) => b.key === "TRANSPORTE")!.earned).toBe(true);
  });

  it("importadora indicada: o Master confirma a ativação; teto do mês manda o excesso para revisão", async () => {
    await saveClubRules(ctx.db, ctx.actors.master, { monthlyCap: 2_500 });
    const a = await referCarrier(ctx.db, ana, { kind: "IMPORTADORA", name: "Importadora Nova", phone: "11955554444" });
    const b = await referCarrier(ctx.db, ana, { kind: "IMPORTADORA", name: "Outra Nova", phone: "11955553333" });
    await expect(activateReferralManually(ctx.db, ana, (a as { referralId: string }).referralId)).rejects.toThrow();
    await activateReferralManually(ctx.db, ctx.actors.master, (a as { referralId: string }).referralId);
    await activateReferralManually(ctx.db, ctx.actors.master, (b as { referralId: string }).referralId);
    const bal = await clubBalance(ctx.db, ana.userId);
    expect(bal).toMatchObject({ available: 2_000, inReview: 2_000 });
    const rev = (await clubAdmin(ctx.db, ctx.actors.master)).review;
    expect(rev).toHaveLength(1);
    await reviewPoints(ctx.db, ctx.actors.master, rev[0]!.id, true);
    expect((await clubBalance(ctx.db, ana.userId)).available).toBe(4_000);
    await expect(activateReferralManually(ctx.db, ctx.actors.master, (b as { referralId: string }).referralId)).rejects.toThrow(/já foi ativada/);
  });
});

describe("vales e vencimento", () => {
  it("gera vale com o valor do momento, não passa do saldo, cancela devolvendo; o Master baixa uma vez só", async () => {
    const rules = await getClubRules(ctx.db);
    await creditPoints(ctx.db, { userId: ana.userId, points: 3_000, source: "TESTE", referenceId: "1" }, rules);
    await expect(redeemVoucher(ctx.db, ana, 500)).rejects.toThrow(/mínimo/);
    await expect(redeemVoucher(ctx.db, ana, 5_000)).rejects.toThrow(/3000 pontos/);
    const v = await redeemVoucher(ctx.db, ana, 2_000);
    expect(v.valueCents).toBe(2_000);
    expect(v.code).toMatch(/^VALE-[0-9A-F]{6}$/);
    expect((await clubBalance(ctx.db, ana.userId)).available).toBe(1_000);
    await cancelVoucher(ctx.db, ana, v.id);
    expect((await clubBalance(ctx.db, ana.userId)).available).toBe(3_000);
    const v2 = await redeemVoucher(ctx.db, ana, 3_000);
    await expect(applyVoucher(ctx.db, ana, v2.code, "MEGATRON")).rejects.toThrow();
    await applyVoucher(ctx.db, ctx.actors.master, v2.code.toLowerCase(), "MEGATRON", "balcão");
    await expect(applyVoucher(ctx.db, ctx.actors.master, v2.code, "MEGATRON")).rejects.toThrow(/já foi usado/);
    await expect(cancelVoucher(ctx.db, ana, v2.id)).rejects.toThrow(/não pode/);
    // Crédito idempotente: a mesma origem não credita duas vezes.
    expect(await creditPoints(ctx.db, { userId: ana.userId, points: 3_000, source: "TESTE", referenceId: "1" }, rules)).toBeNull();
    expect(pointsToCents(150, { pointsPerReal: 100 })).toBe(150);
  });

  it("pontos vencem por ordem de chegada, com aviso dos que vencem em 30 dias", async () => {
    const rules = await getClubRules(ctx.db);
    const jan = new Date("2025-01-10T12:00:00Z");
    await creditPoints(ctx.db, { userId: ana.userId, points: 1_000, source: "TESTE", referenceId: "a" }, rules, jan);
    await creditPoints(ctx.db, { userId: ana.userId, points: 2_000, source: "TESTE", referenceId: "b" }, rules, new Date("2025-02-20T12:00:00Z"));
    await redeemVoucher(ctx.db, ana, 1_200, new Date("2025-03-01T12:00:00Z")); // consome os 1.000 de janeiro e 200 de fevereiro
    expect(await clubBalance(ctx.db, ana.userId, new Date("2026-02-01T12:00:00Z"))).toMatchObject({ available: 1_800, expiringSoon: 1_800 });
    const after = await clubBalance(ctx.db, ana.userId, new Date("2026-03-01T12:00:00Z"));
    expect(after.available).toBe(0);
    expect((await clubBalance(ctx.db, ana.userId, new Date("2026-03-02T12:00:00Z"))).available).toBe(0);
    expect((await ctx.db.select().from(clubLedger).where(eq(clubLedger.kind, "EXPIRE")))).toHaveLength(1);
  });
});

describe("nível", () => {
  it("Membro → Frequente → VIP pela atividade", () => {
    expect(clubLevel({ freights90: 0, activated: 0 }).level).toBe("MEMBRO");
    expect(clubLevel({ freights90: 3, activated: 0 }).level).toBe("FREQUENTE");
    expect(clubLevel({ freights90: 0, activated: 1 }).level).toBe("FREQUENTE");
    expect(clubLevel({ freights90: 10, activated: 0 })).toEqual({ level: "VIP", next: null });
    expect(clubLevel({ freights90: 1, activated: 0 }).next!.missing).toMatch(/2 frete/);
  });
});
