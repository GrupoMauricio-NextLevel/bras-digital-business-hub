import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { catalogPriceVersions, nlSubscriptions, orders, partnerCommissions, partnerTierHistory, partners, stores } from "@/db/schema";
import { newId } from "@/lib/ids";
import { closePartnerMonth, registerPartner } from "@/lib/domain/partners";
import { recordSaleCommission } from "@/lib/domain/corporate-commissions";
import { ensureCatalogSeed } from "@/lib/domain/nl-catalog";
import { bonusDosRepresentantes, fixarNivel, inativarSemClientes, nivelPorClientes, recalcularNivel, recorrenteDoNivel } from "@/lib/domain/niveis-parceiro";

/** Níveis dos parceiros (D249, refeitos na D260: 20%, 24% e 28%). */
describe("níveis dos parceiros", () => {
  let ctx: Awaited<ReturnType<typeof freshDb>>;
  let partnerId: string;
  beforeEach(async () => {
    ctx = await freshDb();
    const r = await registerPartner(ctx.db, { name: "Parceira Nível", email: "nivel@exemplo.com", password: "senha-forte-1", taxId: "52998224725", phone: "11999990000", acceptTerms: true });
    partnerId = (await ctx.db.query.partners.findFirst({ where: eq(partners.userId, r.userId) }))!.id;
  });
  const DEZ = new Date("2026-12-10T12:00:00Z"); // fora da Black

  /** Cria `n` lojas atribuídas ao parceiro com assinatura ativa. */
  async function clientes(n: number, opts: { desde?: string; publicada?: boolean; venda?: boolean } = {}) {
    const org = (await ctx.db.select({ o: stores.organizationId }).from(stores).limit(1))[0]!.o;
    await ensureCatalogSeed(ctx.db);
    const pv = (await ctx.db.select({ id: catalogPriceVersions.id }).from(catalogPriceVersions).limit(1))[0]!.id;
    const ids: string[] = [];
    for (let i = 0; i < n; i++) {
      const id = newId("sto");
      await ctx.db.insert(stores).values({ id, organizationId: org, name: `Cliente ${id}`, slug: `cli-${id.slice(-8).toLowerCase()}`, partnerId, publishedAt: opts.publicada ? "2026-10-01T00:00:00Z" : null });
      await ctx.db.insert(nlSubscriptions).values({ id: newId("nls"), storeId: id, productKey: "COMMERCE_PRO", cycle: "MONTHLY", status: "active", priceVersionId: pv, amountCents: 14_700, platformFeeBps: 0, createdAt: opts.desde ?? "2026-10-01T00:00:00Z" });
      if (opts.venda) await ctx.db.insert(orders).values({ id: newId("ord"), number: 1, storeId: id, customerName: "Cliente", customerEmail: "c@exemplo.com", subtotalCents: 1000, totalCents: 1000, costTotalCents: 500, customerPaymentStatus: "PAID" });
      ids.push(id);
    }
    return ids;
  }
  const tierDe = async () => (await ctx.db.query.partners.findFirst({ where: eq(partners.id, partnerId) }))!;

  it("D260: 20% até 9 clientes, 24% com 10, 28% com 25; igual para todos os tipos", () => {
    expect([0, 1, 9, 10, 24, 25, 100].map(nivelPorClientes)).toEqual(["INICIAL", "INICIAL", "INICIAL", "PRATA", "PRATA", "OURO", "OURO"]);
    for (const k of ["AFFILIATE", "REPRESENTATIVE", "AGENCY", "AGENCY_ELITE"]) {
      expect([recorrenteDoNivel(2000, "INICIAL", k), recorrenteDoNivel(2000, "PRATA", k), recorrenteDoNivel(2000, "OURO", k)]).toEqual([2000, 2400, 2800]);
    }
    expect(recorrenteDoNivel(2000, "DIAMANTE")).toBe(2800); // nível antigo vira o teto
    expect(recorrenteDoNivel(0, "OURO")).toBe(0); // sem regra, sem comissão
  });

  it("sobe na hora e desce só depois de 2 meses abaixo", async () => {
    const ids = await clientes(10);
    expect(await recalcularNivel(ctx.db, partnerId, DEZ)).toBe("PRATA");
    await ctx.db.update(nlSubscriptions).set({ status: "cancelled" }).where(eq(nlSubscriptions.storeId, ids[0]!));
    expect(await recalcularNivel(ctx.db, partnerId, DEZ)).toBe("PRATA");
    expect((await tierDe()).tierBelowSince).toBe("2026-12");
    expect(await recalcularNivel(ctx.db, partnerId, new Date("2027-01-15T12:00:00Z"))).toBe("PRATA");
    expect(await recalcularNivel(ctx.db, partnerId, new Date("2027-02-02T12:00:00Z"))).toBe("INICIAL");
    expect((await ctx.db.select().from(partnerTierHistory).where(eq(partnerTierHistory.partnerId, partnerId))).map((h) => h.toTier)).toEqual(["PRATA", "INICIAL"]);
  });

  it("voltou ao limite antes dos 2 meses: não desce", async () => {
    const ids = await clientes(10);
    await recalcularNivel(ctx.db, partnerId, DEZ);
    await ctx.db.update(nlSubscriptions).set({ status: "cancelled" }).where(eq(nlSubscriptions.storeId, ids[0]!));
    await recalcularNivel(ctx.db, partnerId, DEZ);
    await ctx.db.update(nlSubscriptions).set({ status: "active" }).where(eq(nlSubscriptions.storeId, ids[0]!));
    await recalcularNivel(ctx.db, partnerId, new Date("2027-01-15T12:00:00Z"));
    expect(await recalcularNivel(ctx.db, partnerId, new Date("2027-03-01T12:00:00Z"))).toBe("PRATA");
  });

  it("o Master fixa o nível com motivo; o cálculo não mexe até soltar", async () => {
    await expect(fixarNivel(ctx.db, ctx.actors.master, partnerId, "OURO", "")).rejects.toThrow(/motivo/);
    await fixarNivel(ctx.db, ctx.actors.master, partnerId, "OURO", "Parceira estratégica da Black", DEZ);
    expect(await recalcularNivel(ctx.db, partnerId, new Date("2027-05-01T12:00:00Z"))).toBe("OURO");
    expect(await fixarNivel(ctx.db, ctx.actors.master, partnerId, null, "", new Date("2027-05-01T12:00:00Z"))).toBe("OURO");
    expect((await tierDe()).tierLockedReason).toBeNull();
  });

  it("toda mensalidade (1ª e recorrente) paga o percentual do nível, que sobe com a carteira", async () => {
    await ctx.db.update(partners).set({ kind: "AFFILIATE" }).where(eq(partners.id, partnerId));
    await clientes(10);
    const lanca = (idx: number, k: string) => recordSaleCommission(ctx.db, { partnerId, family: "COMMERCE_PLAN", productKey: "COMMERCE_PRO", cycle: "MONTHLY", paymentIndex: idx, paidCents: 14_700, feeCents: null, dedupeKey: k, now: DEZ });
    expect((await lanca(2, "r"))!.bps).toBe(2400);
    expect((await lanca(1, "f"))!.bps).toBe(2400);
    await clientes(15);
    expect((await lanca(3, "o"))!.bps).toBe(2800);
    expect((await tierDe()).tier).toBe("OURO");
  });

  it("a rotina diária não paga bônus nem desafio (D260)", async () => {
    const { runDailyPartnerJobs } = await import("@/lib/domain/partners");
    await ctx.db.update(partners).set({ kind: "REPRESENTATIVE" }).where(eq(partners.id, partnerId));
    await clientes(12, { publicada: true, venda: true });
    const r = await runDailyPartnerJobs(ctx.db, DEZ);
    expect([r.niveis.bonus, r.desafios]).toEqual([0, 0]);
    expect((await ctx.db.select().from(partnerCommissions).where(eq(partnerCommissions.partnerId, partnerId))).filter((c) => c.kind === "BONUS")).toHaveLength(0);
  });

  it("histórico (D226, desligado na D260): a função do bônus do representante ainda calcula certo", async () => {
    await ctx.db.update(partners).set({ kind: "REPRESENTATIVE" }).where(eq(partners.id, partnerId));
    await clientes(9, { publicada: true, venda: true });
    await clientes(1, { publicada: true }); // sem venda paga: não conta
    await clientes(1, { publicada: false, venda: true }); // não publicada: não conta
    await clientes(1, { publicada: true, venda: true, desde: "2026-12-01T00:00:00Z" }); // menos de 30 dias
    expect(await bonusDosRepresentantes(ctx.db, DEZ)).toBe(9);
    expect(await bonusDosRepresentantes(ctx.db, DEZ)).toBe(0); // cada loja paga uma vez
    await clientes(1, { publicada: true, venda: true });
    expect(await bonusDosRepresentantes(ctx.db, DEZ)).toBe(2); // a 10ª loja + a meta
    const bonus = await ctx.db.select().from(partnerCommissions).where(eq(partnerCommissions.partnerId, partnerId));
    expect(bonus.reduce((t, b) => t + b.amountCents, 0)).toBe(10 * 3_000 + 10_000);
  });

  it("6 meses sem cliente ativo e sem comissão de venda: fica Inativo; com cliente ou cadastro novo, não", async () => {
    await ctx.db.update(partners).set({ createdAt: "2026-01-01T00:00:00Z" }).where(eq(partners.id, partnerId));
    expect(await inativarSemClientes(ctx.db, new Date("2026-05-01T12:00:00Z"))).toBe(0); // cadastro com menos de 6 meses
    const [loja] = await clientes(1);
    expect(await inativarSemClientes(ctx.db, DEZ)).toBe(0); // tem cliente ativo
    await ctx.db.update(nlSubscriptions).set({ status: "cancelled" }).where(eq(nlSubscriptions.storeId, loja!));
    await ctx.db.insert(partnerCommissions).values({ id: newId("pcm"), partnerId, kind: "RECURRING", amountCents: 100, period: "2026-09", dedupeKey: "rec-set", createdAt: "2026-09-01T00:00:00Z" });
    expect(await inativarSemClientes(ctx.db, DEZ)).toBe(0); // vendeu nos últimos 6 meses
    expect(await inativarSemClientes(ctx.db, new Date("2027-04-01T12:00:00Z"))).toBe(1);
    expect((await tierDe()).status).toBe("INACTIVE");
  });

  it("corte mensal (meta de ativação): vale para o SuperDrop, não para o parceiro da E-commerce (D252)", async () => {
    const r = await registerPartner(ctx.db, { name: "Parceira Commerce", email: "ec@exemplo.com", password: "senha-forte-1", taxId: "11144477735", phone: "11999990000", acceptTerms: true, brand: "NEXTLEVEL_COMMERCE" });
    const ec = (await ctx.db.query.partners.findFirst({ where: eq(partners.userId, r.userId) }))!.id;
    await ctx.db.update(partners).set({ createdAt: "2026-01-01T00:00:00Z" }).where(eq(partners.id, partnerId));
    await ctx.db.update(partners).set({ createdAt: "2026-01-01T00:00:00Z" }).where(eq(partners.id, ec));
    await closePartnerMonth(ctx.db, "2026-10", new Date("2026-11-01T03:00:00Z"));
    const st = async (id: string) => (await ctx.db.query.partners.findFirst({ where: eq(partners.id, id) }))!.status;
    expect(await st(ec)).toBe("ACTIVE");
    expect(await st(partnerId)).toBe("INACTIVE");
  });
});
