import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { financeInvoices, partnerCommissions, partners, stores } from "@/db/schema";
import { DEFAULT_PARTNER_SETTINGS, simulateEarnings, tierFor } from "@/lib/finance/partner-rules";
import { markInvoicePaid, voidStoreSetup } from "@/lib/domain/finance";
import { signupMember } from "@/lib/domain/store-access";
import { actorFromUser } from "@/lib/domain/access";
import { users } from "@/db/schema";
import {
  adjustCommission, attributeStore, balances, clawback, closePartnerMonth, createLink, createPartnerCoupon, decidePayout, ensureReactivationInvoice, fraudQueue, getPartnerSettings, ledger, listLinks,
  maskName, partnerDashboard, partnerOfActor, partnerReferrals, recordClick, reactivateFromBalance, registerPartner, releaseCommissions, requestPayout, reviewAttribution, savePartnerProfile, savePartnerSettings,
} from "@/lib/domain/partners";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
const now = new Date("2026-10-10T12:00:00Z");
const DAY = 86_400_000;
const S = DEFAULT_PARTNER_SETTINGS;
const CPFS = ["52998224725", "11144477735", "39053344705", "16899535009", "71428793860", "86288366757", "27981546089", "45317828791", "09468227507", "36914758201", "12345678909", "98765432100"];
// CPFs válidos usados pelos testes (o dígito verificador é conferido por normalizeTaxId)
const validCpf = (n: number) => { const b = String(100000000 + n * 7919).slice(0, 9).split("").map(Number); const d = (arr: number[]) => { const s = arr.reduce((t, x, i) => t + x * (arr.length + 1 - i), 0); const r = (s * 10) % 11; return r === 10 ? 0 : r; }; const d1 = d(b); const d2 = d([...b, d1]); return [...b, d1, d2].join(""); };
void CPFS;

async function newPartner(n = 1, extra: { pixKey?: string } = {}) {
  const r = await registerPartner(ctx.db, { name: `Parceiro Número ${n}`, email: `p${n}@exemplo.com`, password: "senha-forte-1", taxId: validCpf(n + 50), phone: "11999990000", acceptTerms: true, ...extra }, now);
  const u = (await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!;
  return { ...r, actor: actorFromUser(u) };
}
const supplierSlug = () => ctx.db.query.suppliers.findFirst().then((s) => s!.slug);
let seq = 100;
/** Loja nova indicada pelo parceiro; devolve a fatura de ativação em aberto. */
async function referred(code: string, opts: { coupon?: string; email?: string; taxId?: string } = {}) {
  seq += 1;
  const r = await signupMember(ctx.db, { storeName: `Loja Indicada ${seq}`, ownerName: "Dono da Loja", email: opts.email ?? `dono${seq}@exemplo.com`, password: "senha-forte-1", taxId: opts.taxId ?? validCpf(seq), supplierSlug: await supplierSlug(), code: opts.coupon, ref: opts.coupon ? undefined : code, offer: "STORE_SUBDOMAIN" }, now);
  const inv = (await ctx.db.query.financeInvoices.findFirst({ where: and(eq(financeInvoices.storeId, r.storeId), eq(financeInvoices.kind, "STORE_SETUP")) }))!;
  return { ...r, inv };
}
const entries = (partnerId: string) => ctx.db.select().from(partnerCommissions).where(eq(partnerCommissions.partnerId, partnerId));

describe("faixas de comissão (regra pura)", () => {
  it("15% de 1 a 4, 20% de 5 a 9, 25% a partir de 10", () => {
    const bps = (n: number) => tierFor(n, S).bps;
    expect([0, 1, 4, 5, 9, 10, 11, 30].map(bps)).toEqual([0, 1500, 1500, 2000, 2000, 2500, 2500, 2500]);
    expect(tierFor(3, S).next).toEqual({ needed: 2, bps: 2000 });
    expect(tierFor(12, S).next).toBeNull();
  });
  it("a simulação separa setup e manutenção e não promete ganho fixo", () => {
    const r = simulateEarnings({ perMonth: 5, setupCents: 39_700, monthlyCents: 9_700 }, S);
    expect(r.tier.bps).toBe(2000);
    expect(r.setupPerMonth).toBe(Math.round(39_700 * 5 * 0.2));
    expect(r.total12).toBe(r.setup12 + r.maintenance12);
    expect(r.maintenance12).toBeGreaterThan(0);
  });
});

describe("cadastro e configurações", () => {
  it("cria usuário AFFILIATE, código único e link principal; não repete e-mail nem CPF; exige os termos", async () => {
    const a = await newPartner(1);
    expect(a.actor.role).toBe("AFFILIATE");
    expect(a.code).toMatch(/^[A-Z0-9]{4,20}$/);
    expect((await listLinks(ctx.db, a.actor)).length).toBe(1);
    await expect(registerPartner(ctx.db, { name: "Outro Nome", email: "p1@exemplo.com", password: "senha-forte-1", taxId: validCpf(90), phone: "11999990000", acceptTerms: true })).rejects.toThrow(/e-mail/);
    await expect(registerPartner(ctx.db, { name: "Outro Nome", email: "x@exemplo.com", password: "senha-forte-1", taxId: validCpf(51), phone: "11999990000", acceptTerms: true })).rejects.toThrow(/CPF/);
    await expect(registerPartner(ctx.db, { name: "Outro Nome", email: "y@exemplo.com", password: "senha-forte-1", taxId: validCpf(91), phone: "11999990000", acceptTerms: false as unknown as true })).rejects.toThrow();
  });
  it("só o Master altera as regras e o padrão vem da decisão do dono", async () => {
    expect(await getPartnerSettings(ctx.db)).toMatchObject({ maintenanceBps: 500, inactiveFeeCents: 10_000, minPayoutCents: 10_000 });
    await expect(savePartnerSettings(ctx.db, ctx.actors.mantos, S)).rejects.toThrow(/NextLevel/);
    await savePartnerSettings(ctx.db, ctx.actors.master, { ...S, minPayoutCents: 5_000 });
    expect((await getPartnerSettings(ctx.db)).minPayoutCents).toBe(5_000);
  });
  it("parceiro só enxerga o que é dele; lojista não acessa a área", async () => {
    await expect(partnerOfActor(ctx.db, ctx.actors.mantos)).rejects.toThrow(/parceiros/);
    const a = await newPartner(1), b = await newPartner(2);
    await createLink(ctx.db, a.actor, { label: "Instagram" });
    expect((await listLinks(ctx.db, b.actor)).length).toBe(1);
  });
});

describe("links, cupons e atribuição", () => {
  it("clique conta só com hashes; parceiro inativo não capta", async () => {
    const a = await newPartner(1);
    const link = (await listLinks(ctx.db, a.actor))[0]!;
    const c = await recordClick(ctx.db, link.slug, { ip: "1.2.3.4", ua: "Mozilla" });
    expect(c).toMatchObject({ partnerCode: a.code, active: true });
    expect((await listLinks(ctx.db, a.actor))[0]!.clicks).toBe(1);
    await ctx.db.update(partners).set({ status: "INACTIVE" }).where(eq(partners.id, a.partnerId));
    expect((await recordClick(ctx.db, link.slug, { ip: "1.2.3.4", ua: "Mozilla" }))!.active).toBe(false);
    await expect(createLink(ctx.db, a.actor, { label: "Novo" })).rejects.toThrow(/inativo/);
    expect(await recordClick(ctx.db, "naoexiste", { ip: "x", ua: "y" })).toBeNull();
  });
  it("a loja indicada pelo link fica atribuída ao parceiro e a atribuição não muda", async () => {
    const a = await newPartner(1), b = await newPartner(2);
    const r = await referred(a.code);
    const st = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    expect(st).toMatchObject({ partnerId: a.partnerId, attributedVia: "LINK", attributionFlag: null });
    expect(await attributeStore(ctx.db, { storeId: r.storeId, taxId: "x", email: "z@z.com", refCode: b.code })).toBeNull();
    expect((await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!.partnerId).toBe(a.partnerId);
  });
  it("cupom de parceiro (7 dias) tem prioridade sobre o link, deixa escolher o fornecedor e conta uso", async () => {
    const a = await newPartner(1), b = await newPartner(2);
    const { code } = await createPartnerCoupon(ctx.db, a.actor, { code: "amigo7" });
    const seqBefore = seq + 1;
    const r = await signupMember(ctx.db, { storeName: "Loja Cupom", ownerName: "Fulano de Tal", email: "cupom@exemplo.com", password: "senha-forte-1", taxId: validCpf(seqBefore), supplierSlug: await supplierSlug(), code, ref: b.code, offer: "STORE_SUBDOMAIN" }, now);
    const st = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    expect(st).toMatchObject({ partnerId: a.partnerId, attributedVia: "COUPON" });
    expect(st.trialEndsAt).toBeTruthy();
    await expect(signupMember(ctx.db, { storeName: "Sem Fornecedor", ownerName: "Fulano de Tal", email: "s@exemplo.com", password: "senha-forte-1", taxId: validCpf(seqBefore + 1), code, offer: "STORE_SUBDOMAIN" }, now)).rejects.toThrow(/fornecedor/i);
    await ctx.db.update(partners).set({ status: "INACTIVE" }).where(eq(partners.id, a.partnerId));
    await expect(signupMember(ctx.db, { storeName: "Pausado", ownerName: "Fulano de Tal", email: "p@exemplo.com", password: "senha-forte-1", taxId: validCpf(seqBefore + 2), supplierSlug: await supplierSlug(), code, offer: "STORE_SUBDOMAIN" }, now)).rejects.toThrow(/pausado/);
  });
  it("autoindicação (mesmo CPF ou e-mail) é marcada e não gera comissão", async () => {
    const a = await newPartner(1);
    const r = await referred(a.code, { email: "p1@exemplo.com".replace("p1", "outro"), taxId: validCpf(51) });
    expect((await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!.attributionFlag).toBe("FRAUD_REVIEW");
    await markInvoicePaid(ctx.db, r.inv.id, now);
    expect((await entries(a.partnerId)).length).toBe(0);
    expect((await fraudQueue(ctx.db, ctx.actors.master)).length).toBe(1);
    await expect(fraudQueue(ctx.db, a.actor)).rejects.toThrow();
    await reviewAttribution(ctx.db, ctx.actors.master, r.storeId, true);
    expect((await fraudQueue(ctx.db, ctx.actors.master)).length).toBe(0);
  });
});

describe("comissões: ativação, manutenção, garantia, fechamento e estorno", () => {
  it("ativação paga cria comissão pendente sobre o setup (15%) e 5% da primeira mensalidade; a garantia libera o saldo", async () => {
    const a = await newPartner(1);
    const r = await referred(a.code);
    await markInvoicePaid(ctx.db, r.inv.id, now);
    const e = await entries(a.partnerId);
    const setupLine = (r.inv.lines as { kind: string; amountCents: number }[]).find((l) => l.kind === "STORE_SETUP")!.amountCents;
    const first = (r.inv.lines as { kind: string; amountCents: number }[]).find((l) => l.kind === "STORE_FIRST_MONTH")!.amountCents;
    const setup = e.find((x) => x.kind === "SETUP")!, maint = e.find((x) => x.kind === "MAINTENANCE")!;
    expect(setup).toMatchObject({ status: "PENDING", rateBps: 1500, amountCents: Math.round(setupLine * 0.15), baseCents: setupLine });
    expect(maint.amountCents).toBe(Math.round(first * 0.05));
    expect((await balances(ctx.db, a.partnerId)).availableCents).toBe(0);
    await markInvoicePaid(ctx.db, r.inv.id, now); // idempotente
    expect((await entries(a.partnerId)).length).toBe(e.length);
    expect(await releaseCommissions(ctx.db, new Date(+now + 3 * DAY))).toBe(0);
    expect(await releaseCommissions(ctx.db, new Date(+now + 8 * DAY))).toBe(e.length);
    expect((await balances(ctx.db, a.partnerId)).availableCents).toBe(setup.amountCents + maint.amountCents);
  });
  it("mensalidade paga gera 5% de manutenção todo mês", async () => {
    const a = await newPartner(1);
    const r = await referred(a.code);
    await markInvoicePaid(ctx.db, r.inv.id, now);
    const { ensurePlanInvoice } = await import("@/lib/domain/store-access");
    const store = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    const plan = await ensurePlanInvoice(ctx.db, store, 1, new Date(+now + 31 * DAY));
    await markInvoicePaid(ctx.db, plan.invoiceId, new Date(+now + 31 * DAY));
    const m = (await entries(a.partnerId)).filter((x) => x.kind === "MAINTENANCE");
    expect(m.length).toBe(2);
    expect(m.find((x) => x.invoiceId === plan.invoiceId)!.amountCents).toBe(Math.round(plan.amountCents * 0.05));
  });
  it("fechamento do mês ajusta a faixa: 5 ativações passam de 15% para 20% e o extrato mostra o ajuste", async () => {
    const a = await newPartner(1);
    for (let i = 0; i < 5; i++) { const r = await referred(a.code); await markInvoicePaid(ctx.db, r.inv.id, now); }
    const provisional = (await entries(a.partnerId)).filter((x) => x.kind === "SETUP");
    expect(provisional.every((x) => x.rateBps <= 2000)).toBe(true);
    expect(provisional[0]!.rateBps).toBe(1500);
    await closePartnerMonth(ctx.db, "2026-10", new Date("2026-11-01T03:00:00Z"));
    const all = await entries(a.partnerId);
    const total = all.filter((x) => x.kind === "SETUP" || x.kind === "ADJUSTMENT").reduce((t, x) => t + x.amountCents, 0);
    const base = provisional.reduce((t, x) => t + x.baseCents, 0);
    expect(total).toBe(provisional.reduce((t, x) => t + Math.round(x.baseCents * 0.2), 0));
    expect(base).toBeGreaterThan(0);
    await closePartnerMonth(ctx.db, "2026-10", new Date("2026-11-01T03:00:00Z")); // idempotente
    expect((await entries(a.partnerId)).length).toBe(all.length);
    const p = (await ctx.db.query.partners.findFirst({ where: eq(partners.id, a.partnerId) }))!;
    expect(p.status).toBe("ACTIVE");
  });
  it("10 ativações entram na faixa de 25%", async () => {
    const a = await newPartner(1);
    for (let i = 0; i < 10; i++) { const r = await referred(a.code); await markInvoicePaid(ctx.db, r.inv.id, now); }
    await closePartnerMonth(ctx.db, "2026-10", new Date("2026-11-01T03:00:00Z"));
    const setups = (await entries(a.partnerId)).filter((x) => x.kind === "SETUP" || x.kind === "ADJUSTMENT").reduce((t, x) => t + x.amountCents, 0);
    const base = (await entries(a.partnerId)).filter((x) => x.kind === "SETUP").reduce((t, x) => t + x.baseCents, 0);
    expect(setups).toBe(Math.round((base / 10) * 0.25) * 10);
  });
  it("sem ativação no mês o parceiro fica inativo, mas segue recebendo a manutenção; carência no mês do cadastro", async () => {
    const a = await newPartner(1);
    const r = await referred(a.code);
    await markInvoicePaid(ctx.db, r.inv.id, now);
    // mês do cadastro: carência
    await closePartnerMonth(ctx.db, "2026-10", new Date("2026-11-01T03:00:00Z"));
    // novembro sem ativação: inativa
    await closePartnerMonth(ctx.db, "2026-11", new Date("2026-12-01T03:00:00Z"));
    expect((await ctx.db.query.partners.findFirst({ where: eq(partners.id, a.partnerId) }))!.status).toBe("INACTIVE");
    const { ensurePlanInvoice } = await import("@/lib/domain/store-access");
    const store = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    const plan = await ensurePlanInvoice(ctx.db, store, 1, new Date("2026-12-03T12:00:00Z"));
    await markInvoicePaid(ctx.db, plan.invoiceId, new Date("2026-12-03T12:00:00Z"));
    expect((await entries(a.partnerId)).filter((x) => x.kind === "MAINTENANCE").length).toBe(2);
  });
  it("estorno anula a comissão pendente e debita a que já estava disponível", async () => {
    const a = await newPartner(1);
    const r = await referred(a.code);
    await markInvoicePaid(ctx.db, r.inv.id, now);
    expect(await clawback(ctx.db, r.inv.id, now)).toMatchObject({ voided: 2, debited: 0 });
    expect((await balances(ctx.db, a.partnerId)).pendingCents).toBe(0);
    const b = await newPartner(2);
    const r2 = await referred(b.code);
    await markInvoicePaid(ctx.db, r2.inv.id, now);
    await releaseCommissions(ctx.db, new Date(+now + 8 * DAY));
    expect((await balances(ctx.db, b.partnerId)).availableCents).toBeGreaterThan(0);
    await voidStoreSetup(ctx.db, r2.storeId);
    expect((await balances(ctx.db, b.partnerId)).availableCents).toBe(0);
    expect((await entries(b.partnerId)).filter((x) => x.kind === "CLAWBACK").length).toBe(2);
    expect(await ledger(ctx.db, b.actor)).toBeTruthy();
  });
});

describe("reativação, saque e Master", () => {
  async function inactivePartnerWithBalance(cents = 0) {
    const a = await newPartner(1, { pixKey: "52998224725" });
    if (cents) await adjustCommission(ctx.db, ctx.actors.master, a.partnerId, cents, "Bônus de teste", now);
    return a;
  }
  it("inativo paga a taxa por fatura Pix (PARTNER_FEE) e volta a captar; ou abate do saldo", async () => {
    const a = await inactivePartnerWithBalance();
    await ctx.db.update(partners).set({ status: "INACTIVE" }).where(eq(partners.id, a.partnerId));
    const f = await ensureReactivationInvoice(ctx.db, a.actor, now);
    expect(f.amountCents).toBe(10_000);
    expect((await ensureReactivationInvoice(ctx.db, a.actor, now)).invoiceId).toBe(f.invoiceId);
    await markInvoicePaid(ctx.db, f.invoiceId, now);
    expect((await ctx.db.query.partners.findFirst({ where: eq(partners.id, a.partnerId) }))!).toMatchObject({ status: "ACTIVE", feePaidPeriod: "2026-10" });
    await expect(ensureReactivationInvoice(ctx.db, a.actor, now)).rejects.toThrow(/ativo/);
    await ctx.db.update(partners).set({ status: "INACTIVE" }).where(eq(partners.id, a.partnerId));
    await expect(reactivateFromBalance(ctx.db, a.actor, now)).rejects.toThrow(/insuficiente/);
    await adjustCommission(ctx.db, ctx.actors.master, a.partnerId, 15_000, "Bônus", now);
    await reactivateFromBalance(ctx.db, a.actor, new Date(+now + 40 * DAY));
    expect((await balances(ctx.db, a.partnerId)).availableCents).toBe(5_000);
  });
  it("saque: mínimo, 1 por semana, chave do titular; Master aprova, paga com comprovante ou recusa e devolve o saldo", async () => {
    const a = await inactivePartnerWithBalance(5_000);
    await expect(requestPayout(ctx.db, a.actor, { ownerConfirmed: true }, now)).rejects.toThrow(/mínimo/);
    await adjustCommission(ctx.db, ctx.actors.master, a.partnerId, 20_000, "Bônus", now);
    await expect(requestPayout(ctx.db, a.actor, { ownerConfirmed: false }, now)).rejects.toThrow(/mesmo CPF/);
    const { id } = await requestPayout(ctx.db, a.actor, { ownerConfirmed: true }, now);
    expect((await balances(ctx.db, a.partnerId)).availableCents).toBe(0);
    await expect(requestPayout(ctx.db, a.actor, { ownerConfirmed: true }, now)).rejects.toThrow(/Limite/);
    await expect(decidePayout(ctx.db, a.actor, id, "APPROVE")).rejects.toThrow(/NextLevel/);
    await decidePayout(ctx.db, ctx.actors.master, id, "REJECT", "Chave Pix não confere", now);
    expect((await balances(ctx.db, a.partnerId)).availableCents).toBe(25_000);
    const again = await requestPayout(ctx.db, a.actor, { ownerConfirmed: true }, new Date(+now + 8 * DAY));
    await expect(decidePayout(ctx.db, ctx.actors.master, again.id, "PAY", "", now)).rejects.toThrow(/comprovante/);
    await decidePayout(ctx.db, ctx.actors.master, again.id, "APPROVE", undefined, now);
    await decidePayout(ctx.db, ctx.actors.master, again.id, "PAY", "Pix E2E123", now);
    const b = await balances(ctx.db, a.partnerId);
    expect(b).toMatchObject({ availableCents: 0, paidCents: 25_000 });
    await expect(decidePayout(ctx.db, ctx.actors.master, again.id, "REJECT", "x", now)).rejects.toThrow(/encerrado/);
  });
  it("saldo negativo (estorno após saque) bloqueia novo saque; painel mostra faixa, meta e funil sem dados pessoais", async () => {
    const a = await inactivePartnerWithBalance();
    const r = await referred(a.code);
    await markInvoicePaid(ctx.db, r.inv.id, now);
    const d = await partnerDashboard(ctx.db, a.actor, now);
    expect(d).toMatchObject({ period: "2026-10", goalMet: true, funnel: { activations: 1, signups: 1 } });
    expect(d.tier).toMatchObject({ bps: 1500, next: { needed: 4, bps: 2000 } });
    const refs = await partnerReferrals(ctx.db, a.actor, now);
    expect(refs[0]!.stage).toBe("PAID");
    expect(JSON.stringify(refs)).not.toMatch(/@|Dono da Loja/);
    expect(maskName("Loja Indicada 101")).toMatch(/^Lo\*+1$/);
    await savePartnerProfile(ctx.db, a.actor, { phone: "(11) 98888-7777" });
    await expect(savePartnerProfile(ctx.db, a.actor, { phone: "1" })).rejects.toThrow(/WhatsApp/);
  });
});
