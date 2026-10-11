import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { clubLedger, financeInvoices, stores, users } from "@/db/schema";
import { createCoupon, ensurePlanInvoice, fulfillPlanInvoice, isBlocked, signupMember, startTrial, storeAccess } from "@/lib/domain/store-access";
import { storeOrderFeeFor } from "@/lib/domain/finance";
import { invoiceMethod } from "@/lib/domain/nextlevel-billing";
import { activeDoor, addDoorVersion, applyTrialMilestone, reversePlanCashback, type DoorBrand } from "@/lib/domain/precos/porta-entrada";
import { DEMO_PASSWORD } from "@/db/seed-constants";

/** D126 (fase P5): porta de entrada "grátis para começar, paga quando cresce" — desligada por padrão. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
// Uma hora à frente: a versão da porta criada no teste já está em vigor.
const now = new Date(Date.now() + 3_600_000);
const DAY = 86_400_000;
const CPF = "529.982.247-25";
const later = (d: number) => new Date(now.getTime() + d * DAY);

async function ligar(brand: DoorBrand, extra: Partial<Parameters<typeof addDoorVersion>[3]> = {}) {
  return addDoorVersion(ctx.db, ctx.actors.master, brand, { status: "ACTIVE", mode: "REVERSE_TRIAL", trialDays: 14, freeTierFeeBps: 700, publishDays: 7, firstSaleDays: 7, milestoneCapDays: 30, annualPaidMonths: 8, cashbackBps: 500, reason: "Teste da porta de entrada", ...extra }, DEMO_PASSWORD);
}
async function lojaSuperDropEmTeste() {
  const storeId = ctx.seed.stores.mantos.id;
  await createCoupon(ctx.db, ctx.actors.supplier, { code: "MANTOS7" });
  await ctx.db.update(stores).set({ trialEndsAt: null, paidUntil: null }).where(eq(stores.id, storeId));
  await startTrial(ctx.db, { storeId, code: "MANTOS7", taxId: CPF, now });
  return (await ctx.db.query.stores.findFirst({ where: eq(stores.id, storeId) }))!;
}

describe("desligada por padrão: tudo como hoje (regressão do SuperDrop)", () => {
  it("as portas nascem pausadas; teste de 7 dias com cupom e bloqueio no fim", async () => {
    expect(await activeDoor(ctx.db, "SUPERDROP", now)).toBeNull();
    expect(await activeDoor(ctx.db, "NEXTLEVEL_COMMERCE", now)).toBeNull();
    const s = await lojaSuperDropEmTeste();
    expect(new Date(s.trialEndsAt!).getTime() - now.getTime()).toBe(7 * DAY);
    expect(s.entryOffer).toBeNull();
    expect(storeAccess(s, later(8)).state).toBe("BLOCKED");
    expect(isBlocked(s, later(8))).toBe(true);
    expect(await applyTrialMilestone(ctx.db, s.id, "STORE_PUBLISHED", later(1))).toBeNull();
  });
});

describe("porta do SuperDrop ligada", () => {
  it("teste reverso de 14 dias; no fim cai no grátis (não bloqueia) e paga a taxa do grátis", async () => {
    await ligar("SUPERDROP");
    const s = await lojaSuperDropEmTeste();
    expect(new Date(s.trialEndsAt!).getTime() - now.getTime()).toBe(14 * DAY);
    expect(s.entryOffer).toMatchObject({ mode: "REVERSE_TRIAL", freeTierFeeBps: 700, cashbackBps: 500 });
    expect(storeAccess(s, later(3)).state).toBe("TRIAL");
    expect(storeAccess(s, later(15))).toMatchObject({ state: "GRATIS" });
    expect(isBlocked(s, later(15))).toBe(false);
    const fee = await storeOrderFeeFor(ctx.db, s.id, later(15).toISOString().slice(0, 7));
    expect(fee.bps).toBe(700);
  });

  it("quem já entrou mantém a condição: pausar depois não muda a loja", async () => {
    await ligar("SUPERDROP");
    const s = await lojaSuperDropEmTeste();
    await ligar("SUPERDROP", { status: "PAUSED" });
    expect(storeAccess((await ctx.db.query.stores.findFirst({ where: eq(stores.id, s.id) }))!, later(20)).state).toBe("GRATIS");
  });

  it("dias por conquista: +7 ao publicar, +7 na 1ª venda, uma vez cada e até o teto", async () => {
    await ligar("SUPERDROP", { publishDays: 7, firstSaleDays: 20, milestoneCapDays: 25 });
    const s = await lojaSuperDropEmTeste();
    const a = await applyTrialMilestone(ctx.db, s.id, "STORE_PUBLISHED", later(1));
    expect(a?.addedDays).toBe(7);
    expect(await applyTrialMilestone(ctx.db, s.id, "STORE_PUBLISHED", later(2))).toBeNull(); // uma vez
    const b = await applyTrialMilestone(ctx.db, s.id, "FIRST_SALE", later(3));
    expect(b?.addedDays).toBe(4); // 14 + 7 = 21; teto 25
    const fim = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, s.id) }))!;
    expect(new Date(fim.trialEndsAt!).getTime() - now.getTime()).toBe(25 * DAY);
  });

  it("anual 'pague 8, leve 12' só por Pix; cashback em pontos uma vez por fatura; estorno devolve", async () => {
    await ligar("SUPERDROP");
    const s = await lojaSuperDropEmTeste();
    const monthly = (await import("@/lib/domain/finance").then((m) => m.getPriceBook(ctx.db))).offers[s.offer].monthlyCents;
    const inv = await ensurePlanInvoice(ctx.db, s, 12, later(1));
    expect(inv.amountCents).toBe(monthly * 8);
    const row = (await ctx.db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, inv.invoiceId) }))!;
    expect(invoiceMethod(row.lines)).toBe("PIX");
    await ctx.db.update(financeInvoices).set({ status: "PAID", paidAt: later(1).toISOString() }).where(eq(financeInvoices.id, inv.invoiceId));
    const paid = (await ctx.db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, inv.invoiceId) }))!;
    await fulfillPlanInvoice(ctx.db, paid, later(1));
    await fulfillPlanInvoice(ctx.db, paid, later(1));
    const owner = (await ctx.db.query.users.findFirst({ where: and(eq(users.storeId, s.id), eq(users.role, "STORE_OWNER")) }))!;
    const earned = await ctx.db.select().from(clubLedger).where(and(eq(clubLedger.userId, owner.id), eq(clubLedger.source, "PLAN_CASHBACK")));
    expect(earned).toHaveLength(1);
    expect(earned[0]!.points).toBe(Math.floor((Math.floor((monthly * 8 * 500) / 10_000) * 100) / 100));
    expect(await reversePlanCashback(ctx.db, inv.invoiceId)).toEqual({ points: earned[0]!.points });
    expect(await reversePlanCashback(ctx.db, inv.invoiceId)).toBeNull();
  });

  it("cadastro sem cupom também entra pela porta; o mesmo CPF não ganha outro teste", async () => {
    await ligar("SUPERDROP");
    const supplier = await ctx.db.query.suppliers.findFirst();
    const r = await signupMember(ctx.db, { storeName: "Loja Nova", ownerName: "Carla", email: "carla@x.teste", password: "senha-segura-1", taxId: CPF, supplierSlug: supplier!.slug }, now);
    const s = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    expect(storeAccess(s, later(1)).state).toBe("TRIAL");
    const r2 = await signupMember(ctx.db, { storeName: "Loja Dois", ownerName: "Carla", email: "carla2@x.teste", password: "senha-segura-1", taxId: CPF, supplierSlug: supplier!.slug }, now);
    const s2 = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r2.storeId) }))!;
    expect(storeAccess(s2, later(1)).state).toBe("BLOCKED"); // sem teste: paga para entrar, como hoje
  });

  it("só o Master liga, com senha", async () => {
    await expect(addDoorVersion(ctx.db, ctx.actors.arena, "SUPERDROP", { status: "ACTIVE", mode: "REVERSE_TRIAL", trialDays: 14, freeTierFeeBps: 700, publishDays: 7, firstSaleDays: 7, milestoneCapDays: 30, annualPaidMonths: 8, cashbackBps: 500, reason: "tentativa" }, DEMO_PASSWORD)).rejects.toThrow();
    await expect(addDoorVersion(ctx.db, ctx.actors.master, "SUPERDROP", { status: "ACTIVE", mode: "REVERSE_TRIAL", trialDays: 14, freeTierFeeBps: 700, publishDays: 7, firstSaleDays: 7, milestoneCapDays: 30, annualPaidMonths: 8, cashbackBps: 500, reason: "sem senha" }, "errada")).rejects.toThrow();
  });
});

describe("porta da Commerce ligada", () => {
  it("cadastro da loja Commerce entra no teste reverso e cai no grátis com a taxa do grátis", async () => {
    await ligar("NEXTLEVEL_COMMERCE", { freeTierFeeBps: 250 });
    const r = await signupMember(ctx.db, { storeName: "Loja Ju", ownerName: "Juliana", email: "ju@x.teste", password: "senha-segura-1", taxId: CPF, brand: "NEXTLEVEL_COMMERCE", independent: true, plan: "COMMERCE_PRO", cycle: "MONTHLY" }, now);
    const s = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    expect(s.entryOffer).toMatchObject({ offerKey: "PORTA_COMMERCE", freeTierFeeBps: 250 });
    expect(storeAccess(s, later(13)).state).toBe("TRIAL");
    expect(storeAccess(s, later(15)).state).toBe("GRATIS");
    expect((await storeOrderFeeFor(ctx.db, s.id, later(15).toISOString().slice(0, 7))).bps).toBe(250);
  });
});
