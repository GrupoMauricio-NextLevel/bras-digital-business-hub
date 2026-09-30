import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { financeInvoices, stores } from "@/db/schema";
import { createCoupon, ensurePlanInvoice, extendTrial, normalizeTaxId, signupMember, startTrial, storeAccess } from "@/lib/domain/store-access";
import { getPriceBook, markInvoicePaid } from "@/lib/domain/finance";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
const now = new Date("2026-10-01T12:00:00Z");
const DAY = 86_400_000;
const CPF = "529.982.247-25";

describe("regra de acesso da loja", () => {
  it("sem datas não há regra (contas antigas)", () => expect(storeAccess({ trialEndsAt: null, paidUntil: null }, now).state).toBe("FREE"));
  it("teste, assinatura e bloqueio", () => {
    expect(storeAccess({ trialEndsAt: new Date(+now + 3 * DAY).toISOString(), paidUntil: null }, now)).toMatchObject({ state: "TRIAL", daysLeft: 3 });
    expect(storeAccess({ trialEndsAt: new Date(+now - DAY).toISOString(), paidUntil: null }, now).state).toBe("BLOCKED");
    expect(storeAccess({ trialEndsAt: new Date(+now - DAY).toISOString(), paidUntil: new Date(+now + 20 * DAY).toISOString() }, now).state).toBe("PAID");
    expect(storeAccess({ trialEndsAt: null, paidUntil: new Date(+now - DAY).toISOString() }, now).state).toBe("BLOCKED");
  });
  it("valida CPF e CNPJ", () => {
    expect(normalizeTaxId(CPF)).toBe("52998224725");
    expect(normalizeTaxId("11.222.333/0001-81")).toBe("11222333000181");
    expect(() => normalizeTaxId("111.111.111-11")).toThrow();
    expect(() => normalizeTaxId("123")).toThrow();
  });
});

describe("cupom e teste de 7 dias", () => {
  const storeId = () => ctx.seed.stores.mantos.id;
  it("fornecedor cria cupom; loja inicia o teste por CPF; segundo uso do mesmo CPF é recusado", async () => {
    const { code } = await createCoupon(ctx.db, ctx.actors.supplier, { code: "mantos7" });
    expect(code).toBe("MANTOS7");
    await ctx.db.update(stores).set({ trialEndsAt: null, paidUntil: null }).where(eq(stores.id, storeId()));
    const r = await startTrial(ctx.db, { storeId: storeId(), code: "mantos7", taxId: CPF, now });
    expect(+r.trialEndsAt - +now).toBe(7 * DAY);
    const other = ctx.seed.stores.arena.id;
    await expect(startTrial(ctx.db, { storeId: other, code: "MANTOS7", taxId: CPF, now })).rejects.toThrow();
  });
  it("cupom inválido, esgotado ou de outro fornecedor não inicia o teste", async () => {
    await expect(startTrial(ctx.db, { storeId: storeId(), code: "NAOEXISTE", taxId: CPF })).rejects.toThrow(/inválido/);
    await createCoupon(ctx.db, ctx.actors.supplier, { code: "UNICO", maxRedemptions: 0 });
    await expect(startTrial(ctx.db, { storeId: storeId(), code: "UNICO", taxId: CPF })).rejects.toThrow(/limite/);
  });
  it("prorrogar soma dias e só o Master ou o fornecedor da loja podem", async () => {
    const { code } = await createCoupon(ctx.db, ctx.actors.supplier, { code: "PRORROGA" });
    await ctx.db.update(stores).set({ trialEndsAt: null, paidUntil: null }).where(eq(stores.id, storeId()));
    await startTrial(ctx.db, { storeId: storeId(), code, taxId: CPF, now });
    const r = await extendTrial(ctx.db, ctx.actors.master, storeId(), 3, now);
    expect(+r.trialEndsAt - +now).toBe(10 * DAY);
    await expect(extendTrial(ctx.db, ctx.actors.mantos, storeId(), 3, now)).rejects.toThrow();
  });
});

describe("fatura do plano e liberação automática", () => {
  it("gera fatura idempotente e, paga, libera o acesso pelos meses contratados", async () => {
    const id = ctx.seed.stores.mantos.id;
    await ctx.db.update(stores).set({ trialEndsAt: new Date(+now - DAY).toISOString(), paidUntil: null }).where(eq(stores.id, id));
    const store = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, id) }))!;
    expect(storeAccess(store, now).state).toBe("BLOCKED");
    const a = await ensurePlanInvoice(ctx.db, store, 1, now); const b = await ensurePlanInvoice(ctx.db, store, 1, now);
    expect(a.invoiceId).toBe(b.invoiceId);
    await markInvoicePaid(ctx.db, a.invoiceId, now);
    const paid = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, id) }))!;
    expect(storeAccess(paid, now).state).toBe("PAID");
    expect(new Date(paid.paidUntil!).getUTCMonth()).toBe(10);
    expect((await ctx.db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, a.invoiceId) }))?.status).toBe("PAID");
  });
});

describe("cadastro público", () => {
  const base = { storeName: "Loja Nova", ownerName: "Maria", email: "maria@nova.com", password: "senha-segura-1", taxId: CPF, offer: "STORE_SUBDOMAIN" as const };
  it("sem cupom: cria a loja já pendente de pagamento, com setup e plano em uma única cobrança; pagar libera o plano", async () => {
    const slug = (await ctx.db.query.suppliers.findFirst())!.slug;
    const r = await signupMember(ctx.db, { ...base, supplierSlug: slug }, now);
    expect(r.trial).toBe(false);
    const store = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    expect(storeAccess(store, now).state).toBe("BLOCKED");
    const inv = await ensurePlanInvoice(ctx.db, store, 1, now);
    expect(inv.includesSetup).toBe(true);
    const offer = (await getPriceBook(ctx.db)).offers.STORE_SUBDOMAIN;
    expect(inv.amountCents).toBe(offer.monthlyCents + offer.setupCents); // ativação = setup + primeira mensalidade, uma só cobrança
    await markInvoicePaid(ctx.db, inv.invoiceId, now);
    const after = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    expect(storeAccess(after, now).state).toBe("PAID");
    const open = await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId));
    expect(open.filter((i) => i.status === "OPEN")).toHaveLength(0);
  });
  it("com cupom: inicia o teste; sem cupom nem fornecedor é recusado; CPF do teste não repete", async () => {
    const { code } = await createCoupon(ctx.db, ctx.actors.supplier, { code: "CADASTRO7" });
    const r = await signupMember(ctx.db, { ...base, code }, now);
    expect(r.trial).toBe(true);
    expect(storeAccess((await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!, now).state).toBe("TRIAL");
    await expect(signupMember(ctx.db, { ...base, email: "outra@nova.com", code }, now)).rejects.toThrow(/já usou/);
    await expect(signupMember(ctx.db, { ...base, email: "x@nova.com" }, now)).rejects.toThrow(/fornecedor/);
  });
});
