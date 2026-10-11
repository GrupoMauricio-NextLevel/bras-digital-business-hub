import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { clubCounters, clubLedger, clubVoucherFunding } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { getBrasMemberByUser, signupBrasMember } from "@/lib/domain/bras/membros";
import { clubBalance, creditPoints, redeemVoucher, reviewPoints } from "@/lib/domain/club/pontos";
import { getClubRules, saveClubRules } from "@/lib/domain/club/regras";
import { counterByToken, counterLookup, createCounter, markSettled, monthOf, myClubCard, registerPurchase, renewClubCard, revokeCounter, settlementReport } from "@/lib/domain/club/balcao";

/** D120 (fase E8a do Club): cartão no balcão, compra que vira ponto e acerto entre empresas. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let ana: Actor; let bia: Actor;
async function membro(nome: string, cnpj: string, email: string) {
  const r = await signupBrasMember(ctx.db, { name: `${nome} Souza`, companyName: `${nome} LTDA`, cnpj, whatsapp: "11988887777", email, password: "senha-forte-1", acceptTerms: true });
  const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
  return { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null } as Actor;
}

beforeEach(async () => {
  ctx = await freshDb();
  ana = await membro("Ana", "11222333000181", "ana@u.teste");
  bia = await membro("Bia", "11444777000161", "bia@u.teste");
});

describe("cartão e balcão", () => {
  it("cartão opaco por membro; trocar invalida o anterior; balcão vê só o primeiro nome e o saldo", async () => {
    const c1 = await myClubCard(ctx.db, ana.userId);
    expect(c1.token).toMatch(/^[A-Z0-9]{10}$/);
    expect((await myClubCard(ctx.db, ana.userId)).token).toBe(c1.token);
    const { token } = await createCounter(ctx.db, ctx.actors.master, { company: "MEGATRON", name: "Mega Tron · box 12" });
    await expect(createCounter(ctx.db, ana, { company: "MEGATRON", name: "x balcão" })).rejects.toThrow();
    await expect(createCounter(ctx.db, ctx.actors.master, { company: "OUTRA", name: "Balcão" })).rejects.toThrow(/não encontrada/);
    expect((await ctx.db.select().from(clubCounters))[0]!.tokenHash).not.toBe(token);
    const look = await counterLookup(ctx.db, token, `club:${c1.token.toLowerCase()}`);
    expect(look).toEqual({ name: "Ana", available: 0, vouchers: [] });
    expect(JSON.stringify(look)).not.toMatch(/11222333000181|ana@u\.teste|Souza/);
    const c2 = await renewClubCard(ctx.db, ana);
    expect(c2.token).not.toBe(c1.token);
    await expect(counterLookup(ctx.db, token, c1.token)).rejects.toThrow(/não encontrado/);
    await expect(counterLookup(ctx.db, "x".repeat(40), c2.token)).rejects.toThrow(/indisponível/);
  });

  it("compra vira pontos pagos pela empresa; cupom não pontua duas vezes; empresa fora da regra e compra alta vão para revisão", async () => {
    const card = (await myClubCard(ctx.db, ana.userId)).token;
    const { token } = await createCounter(ctx.db, ctx.actors.master, { company: "MEGATRON", name: "Mega Tron · box 12" });
    const r = await registerPurchase(ctx.db, token, { card, valueCents: 50_000, receipt: "CF-1001" });
    expect(r).toMatchObject({ name: "Ana", points: 1_000, inReview: false });
    expect((await clubBalance(ctx.db, ana.userId)).available).toBe(1_000);
    expect((await ctx.db.select().from(clubLedger).where(eq(clubLedger.userId, ana.userId)))[0]).toMatchObject({ source: "PURCHASE", funder: "MEGATRON" });
    await expect(registerPurchase(ctx.db, token, { card, valueCents: 50_000, receipt: "CF-1001" })).rejects.toThrow(/já foi registrado/);
    // Compra acima do valor de revisão nasce em revisão.
    const big = await registerPurchase(ctx.db, token, { card, valueCents: 600_000, receipt: "CF-1002" });
    expect(big.inReview).toBe(true);
    expect((await clubBalance(ctx.db, ana.userId)).inReview).toBe(12_000);
    const nl = await createCounter(ctx.db, ctx.actors.master, { company: "NEXTLEVEL", name: "Escritório" });
    await expect(registerPurchase(ctx.db, nl.token, { card, valueCents: 10_000 })).rejects.toThrow(/ainda não dá pontos/);
    await revokeCounter(ctx.db, ctx.actors.master, (await counterByToken(ctx.db, token))!.id);
    await expect(registerPurchase(ctx.db, token, { card, valueCents: 10_000 })).rejects.toThrow(/indisponível/);
  });

  it("vale no balcão: só do dono do cartão, até o teto da compra; pontos sobre o que foi pago", async () => {
    const rules = await getClubRules(ctx.db);
    await creditPoints(ctx.db, { userId: ana.userId, points: 2_000, source: "TEST", referenceId: "t1" }, rules);
    await creditPoints(ctx.db, { userId: bia.userId, points: 2_000, source: "TEST", referenceId: "t1" }, rules);
    const vAna = await redeemVoucher(ctx.db, ana, 1_000);
    const vBia = await redeemVoucher(ctx.db, bia, 1_000);
    const card = (await myClubCard(ctx.db, ana.userId)).token;
    const { token } = await createCounter(ctx.db, ctx.actors.master, { company: "MEGATRON", name: "Mega Tron · box 12" });
    expect((await counterLookup(ctx.db, token, card)).vouchers).toEqual([{ valueCents: 1_000, expiresAt: expect.any(String) }]);
    await expect(registerPurchase(ctx.db, token, { card, valueCents: 10_000, voucherCode: vBia.code })).rejects.toThrow(/outra pessoa/);
    await expect(registerPurchase(ctx.db, token, { card, valueCents: 3_000, voucherCode: vAna.code })).rejects.toThrow(/até 30%/);
    const r = await registerPurchase(ctx.db, token, { card, valueCents: 10_000, voucherCode: vAna.code, receipt: "CF-9" });
    expect(r).toMatchObject({ discountCents: 1_000, points: 180 });
    await expect(registerPurchase(ctx.db, token, { card, valueCents: 10_000, voucherCode: vAna.code })).rejects.toThrow(/já foi usado/);
  });
});

describe("acerto entre empresas", () => {
  it("vale pago com pontos da Mega Tron e usado na Starline: a Mega Tron deve à Starline; marcar o acerto fecha a linha", async () => {
    const card = (await myClubCard(ctx.db, ana.userId)).token;
    const mega = await createCounter(ctx.db, ctx.actors.master, { company: "MEGATRON", name: "Mega Tron · box 12" });
    const star = await createCounter(ctx.db, ctx.actors.master, { company: "STARLINE", name: "Starline · embarque" });
    // 1.000 pontos de compra na Mega Tron + 500 de indicação (caixa do Club, NextLevel).
    await registerPurchase(ctx.db, mega.token, { card, valueCents: 50_000, receipt: "CF-1" });
    await creditPoints(ctx.db, { userId: ana.userId, points: 500, source: "REFERRAL", referenceId: "r1" }, await getClubRules(ctx.db));
    // Vale de 1.200 pontos: 1.000 da Mega Tron (mais antigos) + 200 da NextLevel.
    const v = await redeemVoucher(ctx.db, ana, 1_200);
    const fund = await ctx.db.select().from(clubVoucherFunding).where(eq(clubVoucherFunding.voucherId, v.id));
    expect(Object.fromEntries(fund.map((f) => [f.funder, f.points]))).toEqual({ MEGATRON: 1_000, NEXTLEVEL: 200 });
    await registerPurchase(ctx.db, star.token, { card, valueCents: 10_000, voucherCode: v.code });
    const month = monthOf(new Date());
    const rep = await settlementReport(ctx.db, ctx.actors.master, month);
    expect(rep).toMatchObject({ vouchers: 1, totalCents: 1_200 });
    const byPair = Object.fromEntries(rep.lines.map((l) => [`${l.debtor}>${l.creditor}`, l.openCents]));
    expect(byPair).toEqual({ "MEGATRON>STARLINE": 1_000, "NEXTLEVEL>STARLINE": 200 });
    await markSettled(ctx.db, ctx.actors.master, month, "MEGATRON", "STARLINE", "Nota 55");
    const after = await settlementReport(ctx.db, ctx.actors.master, month);
    expect(after.lines.find((l) => l.debtor === "MEGATRON")).toMatchObject({ amountCents: 1_000, settledCents: 1_000, openCents: 0 });
    await expect(markSettled(ctx.db, ctx.actors.master, month, "MEGATRON", "STARLINE")).rejects.toThrow(/Nada em aberto/);
    await expect(settlementReport(ctx.db, ana, month)).rejects.toThrow();
  });

  it("vale usado na própria empresa que pagou os pontos não gera dívida; dívidas cruzadas se compensam", async () => {
    const card = (await myClubCard(ctx.db, ana.userId)).token;
    const mega = await createCounter(ctx.db, ctx.actors.master, { company: "MEGATRON", name: "Mega Tron" });
    const star = await createCounter(ctx.db, ctx.actors.master, { company: "STARLINE", name: "Starline" });
    await registerPurchase(ctx.db, mega.token, { card, valueCents: 100_000, receipt: "A" }); // 2.000 pts MEGATRON
    const v1 = await redeemVoucher(ctx.db, ana, 1_000);
    await registerPurchase(ctx.db, mega.token, { card, valueCents: 10_000, voucherCode: v1.code, receipt: "B" });
    expect((await settlementReport(ctx.db, ctx.actors.master, monthOf(new Date()))).lines).toEqual([]);
    // Pontos da Mega Tron usados na Starline e pontos da Starline usados na Mega Tron: as dívidas se compensam.
    await registerPurchase(ctx.db, star.token, { card, valueCents: 100_000, receipt: "C" }); // 2.000 pts STARLINE
    const v2 = await redeemVoucher(ctx.db, ana, 1_000); // 1.000 MEGATRON (restante da compra A)
    await registerPurchase(ctx.db, star.token, { card, valueCents: 10_000, voucherCode: v2.code, receipt: "D" });
    const v3 = await redeemVoucher(ctx.db, ana, 1_000); // 180 MEGATRON (compra B) + 820 STARLINE
    await registerPurchase(ctx.db, mega.token, { card, valueCents: 10_000, voucherCode: v3.code, receipt: "E" });
    const rep = await settlementReport(ctx.db, ctx.actors.master, monthOf(new Date()));
    expect(rep.lines).toEqual([expect.objectContaining({ debtor: "MEGATRON", creditor: "STARLINE", amountCents: 180 })]);
  });

  it("pontos em revisão não entram no vale até o Master liberar", async () => {
    const card = (await myClubCard(ctx.db, ana.userId)).token;
    const mega = await createCounter(ctx.db, ctx.actors.master, { company: "MEGATRON", name: "Mega Tron" });
    await registerPurchase(ctx.db, mega.token, { card, valueCents: 600_000, receipt: "X" });
    await expect(redeemVoucher(ctx.db, ana, 1_000)).rejects.toThrow(/0 pontos/);
    const l = (await ctx.db.select().from(clubLedger).where(eq(clubLedger.userId, ana.userId)))[0]!;
    await reviewPoints(ctx.db, ctx.actors.master, l.id, true);
    await saveClubRules(ctx.db, ctx.actors.master, {});
    expect((await redeemVoucher(ctx.db, ana, 1_000)).valueCents).toBe(1_000);
  });
});
