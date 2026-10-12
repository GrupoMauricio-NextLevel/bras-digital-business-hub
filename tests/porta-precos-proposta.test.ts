import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { financeInvoices, nlSubscriptions, stores } from "@/db/schema";
import { createCoupon, ensurePlanInvoice, signupMember, startTrial } from "@/lib/domain/store-access";
import { getPriceBook, storeOrderFeeFor } from "@/lib/domain/finance";
import { addDoorVersion, proposalPrices, type DoorBrand } from "@/lib/domain/precos/porta-entrada";
import { DEFAULT_PROPOSAL } from "@/lib/domain/precos/proposta";
import { saveSurveySettings } from "@/lib/domain/precos/questionario";
import { launchRoadmap } from "@/lib/domain/precos/roteiro";
import { DEMO_PASSWORD } from "@/db/seed-constants";

/** D140: experimento com os preços da Proposta (escada congelada na loja) e o roteiro "ligar em ordem". */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
const now = new Date(Date.now() + 3_600_000);
const CPF = "529.982.247-25";

const ligar = (brand: DoorBrand, useProposalPrices: boolean) => addDoorVersion(ctx.db, ctx.actors.master, brand, { status: "ACTIVE", mode: "REVERSE_TRIAL", trialDays: 14, freeTierFeeBps: 900, publishDays: 7, firstSaleDays: 7, milestoneCapDays: 30, annualPaidMonths: 8, cashbackBps: 500, useProposalPrices, reason: "Experimento de preço" }, DEMO_PASSWORD);

describe("escada da Proposta → planos de cada marca", () => {
  it("planos pagos por ordem de preço; o grátis vira a taxa do grátis; plano que falta fica com o preço de hoje", () => {
    const sd = proposalPrices(DEFAULT_PROPOSAL.brands.SUPERDROP.ladder, "SUPERDROP");
    expect(sd.freeTierFeeBps).toBe(700);
    expect(sd.planPrices).toEqual({ DROP_MANUAL: { monthlyCents: 7_900, feeBps: 400 }, STORE_SUBDOMAIN: { monthlyCents: 7_900, feeBps: 400 }, STORE_OWN: { monthlyCents: 17_900, feeBps: 250 } });
    const nc = proposalPrices([{ monthlyCents: 19_900, feeBps: 70 }, { monthlyCents: 8_900, feeBps: 100 }], "NEXTLEVEL_COMMERCE");
    expect(nc).toEqual({ freeTierFeeBps: null, planPrices: { COMMERCE_START: { monthlyCents: 8_900, feeBps: 100 }, COMMERCE_PRO: { monthlyCents: 19_900, feeBps: 70 } } });
  });
});

describe("porta do SuperDrop com os preços da Proposta", () => {
  it("a loja recebe a escada congelada: mensalidade e taxa da Proposta; desmarcado, tudo como hoje", async () => {
    await ligar("SUPERDROP", true);
    const storeId = ctx.seed.stores.mantos.id;
    await createCoupon(ctx.db, ctx.actors.supplier, { code: "MANTOS7" });
    await ctx.db.update(stores).set({ trialEndsAt: null, paidUntil: null }).where(eq(stores.id, storeId));
    await startTrial(ctx.db, { storeId, code: "MANTOS7", taxId: CPF, now });
    let s = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, storeId) }))!;
    const expected = proposalPrices(DEFAULT_PROPOSAL.brands.SUPERDROP.ladder, "SUPERDROP").planPrices[s.offer]!;
    expect(s.entryOffer).toMatchObject({ priceSource: "PROPOSTA", freeTierFeeBps: 700 });
    expect((await ensurePlanInvoice(ctx.db, s, 1, now)).amountCents).toBe(expected.monthlyCents);
    expect((await ensurePlanInvoice(ctx.db, s, 12, now)).amountCents).toBe(expected.monthlyCents * 8);
    // Plano pago e em dia: a taxa por pedido é a da Proposta.
    await ctx.db.update(stores).set({ paidUntil: new Date(now.getTime() + 400 * 86_400_000).toISOString() }).where(eq(stores.id, storeId));
    s = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, storeId) }))!;
    expect((await storeOrderFeeFor(ctx.db, s.id, now.toISOString().slice(0, 7))).bps).toBe(expected.feeBps);
    // Nova versão sem a Proposta: quem já entrou mantém; a tabela de hoje não mudou.
    await ligar("SUPERDROP", false);
    const book = await getPriceBook(ctx.db);
    expect(book.offers[s.offer].monthlyCents).not.toBe(0);
    expect((await ctx.db.query.stores.findFirst({ where: eq(stores.id, storeId) }))!.entryOffer).toMatchObject({ priceSource: "PROPOSTA" });
  });

  it("porta sem a opção: a loja não recebe preços da Proposta", async () => {
    await ligar("SUPERDROP", false);
    const supplier = await ctx.db.query.suppliers.findFirst();
    const r = await signupMember(ctx.db, { storeName: "Loja Nova", ownerName: "Carla", email: "carla@x.teste", password: "senha-segura-1", taxId: CPF, supplierSlug: supplier!.slug }, now);
    const s = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    expect(s.entryOffer).toMatchObject({ freeTierFeeBps: 900 });
    expect((s.entryOffer as { planPrices?: unknown }).planPrices).toBeUndefined();
    const setup = (await ctx.db.query.financeInvoices.findFirst({ where: eq(financeInvoices.dedupeKey, `STORESETUP:${s.id}`) }))!;
    expect(setup.lines.find((l) => l.kind === "STORE_FIRST_MONTH")?.amountCents).toBe((await getPriceBook(ctx.db)).offers[s.offer].monthlyCents);
  });

  it("cadastro pela porta com a Proposta: o 1º mês da fatura de ativação sai pelo preço da Proposta", async () => {
    await ligar("SUPERDROP", true);
    const supplier = await ctx.db.query.suppliers.findFirst();
    const r = await signupMember(ctx.db, { storeName: "Loja Nova", ownerName: "Carla", email: "carla@x.teste", password: "senha-segura-1", taxId: CPF, supplierSlug: supplier!.slug }, now);
    const s = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    const setup = (await ctx.db.query.financeInvoices.findFirst({ where: eq(financeInvoices.dedupeKey, `STORESETUP:${s.id}`) }))!;
    const first = setup.lines.find((l) => l.kind === "STORE_FIRST_MONTH")!;
    expect(first.amountCents).toBe(proposalPrices(DEFAULT_PROPOSAL.brands.SUPERDROP.ladder, "SUPERDROP").planPrices[s.offer]!.monthlyCents);
    expect(setup.amountCents).toBe(setup.lines.reduce((t, l) => t + l.amountCents, 0));
  });
});

describe("porta da Commerce com os preços da Proposta", () => {
  it("a assinatura congela a mensalidade e a taxa do plano da Proposta", async () => {
    await ligar("NEXTLEVEL_COMMERCE", true);
    const r = await signupMember(ctx.db, { storeName: "Loja Ju", ownerName: "Juliana", email: "ju@x.teste", password: "senha-segura-1", taxId: CPF, brand: "NEXTLEVEL_COMMERCE", independent: true, plan: "COMMERCE_PRO", cycle: "MONTHLY" }, now);
    const sub = (await ctx.db.query.nlSubscriptions.findFirst({ where: eq(nlSubscriptions.storeId, r.storeId) }))!;
    expect(sub).toMatchObject({ amountCents: 19_900, platformFeeBps: 70 });
    const s = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    expect(s.entryOffer).toMatchObject({ freeTierFeeBps: 250 });
  });
});

describe("roteiro ligar em ordem", () => {
  it("começa todo desligado com o questionário como próximo passo; ligar avança", async () => {
    let steps = await launchRoadmap(ctx.db, ctx.actors.master, now);
    expect(steps.map((s) => s.state)).toEqual(["DESLIGADO", "DESLIGADO", "DESLIGADO", "DESLIGADO", "DESLIGADO"]);
    expect(steps.find((s) => s.next)?.n).toBe(1);
    await saveSurveySettings(ctx.db, ctx.actors.master, { enabled: true, brands: ["SUPERDROP"], minDaysSinceSignup: 7, minResponsesToShow: 5 });
    await ligar("SUPERDROP", true);
    steps = await launchRoadmap(ctx.db, ctx.actors.master, now);
    expect(steps[0]!.state).toBe("LIGADO");
    expect(steps[2]!.state).toBe("PARCIAL");
    expect(steps[2]!.detail).toContain("sem experimento");
    expect(steps.find((s) => s.next)?.n).toBe(2);
    await expect(launchRoadmap(ctx.db, ctx.actors.arena, now)).rejects.toThrow();
  });
});
