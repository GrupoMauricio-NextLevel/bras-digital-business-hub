import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { catalogPriceVersions, nlSubscriptions, orders, partnerCommissions, partnerTierHistory, partners, stores } from "@/db/schema";
import { newId } from "@/lib/ids";
import { registerPartner } from "@/lib/domain/partners";
import { recordSaleCommission } from "@/lib/domain/corporate-commissions";
import { ensureCatalogSeed } from "@/lib/domain/nl-catalog";
import { bonusDosRepresentantes, fixarNivel, nivelPorClientes, recalcularNivel, recorrenteDoNivel } from "@/lib/domain/niveis-parceiro";

/** Níveis dos parceiros (D249, PV2) e bônus do representante (D226). */
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

  it("limites e bônus: Prata +2, Ouro +4, Diamante = Elite (agência 32%, demais 26%), nunca acima do teto", () => {
    expect([0, 2, 3, 9, 10, 19, 20].map(nivelPorClientes)).toEqual(["INICIAL", "INICIAL", "PRATA", "PRATA", "OURO", "OURO", "DIAMANTE"]);
    expect(recorrenteDoNivel(2000, "PRATA", "AFFILIATE")).toBe(2200);
    expect(recorrenteDoNivel(2000, "OURO", "REPRESENTATIVE")).toBe(2400);
    expect(recorrenteDoNivel(2000, "DIAMANTE", "AFFILIATE")).toBe(2600);
    expect(recorrenteDoNivel(2500, "DIAMANTE", "AGENCY")).toBe(3200);
    expect(recorrenteDoNivel(3200, "OURO", "AGENCY_ELITE")).toBe(3200);
  });

  it("sobe na hora e desce só depois de 2 meses abaixo", async () => {
    const ids = await clientes(3);
    expect(await recalcularNivel(ctx.db, partnerId, DEZ)).toBe("PRATA");
    await ctx.db.update(nlSubscriptions).set({ status: "cancelled" }).where(eq(nlSubscriptions.storeId, ids[0]!));
    expect(await recalcularNivel(ctx.db, partnerId, DEZ)).toBe("PRATA");
    expect((await tierDe()).tierBelowSince).toBe("2026-12");
    expect(await recalcularNivel(ctx.db, partnerId, new Date("2027-01-15T12:00:00Z"))).toBe("PRATA");
    expect(await recalcularNivel(ctx.db, partnerId, new Date("2027-02-02T12:00:00Z"))).toBe("INICIAL");
    expect((await ctx.db.select().from(partnerTierHistory).where(eq(partnerTierHistory.partnerId, partnerId))).map((h) => h.toTier)).toEqual(["PRATA", "INICIAL"]);
  });

  it("voltou ao limite antes dos 2 meses: não desce", async () => {
    const ids = await clientes(3);
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

  it("a recorrência paga o percentual do nível; a 1ª continua 50%", async () => {
    await ctx.db.update(partners).set({ kind: "AFFILIATE" }).where(eq(partners.id, partnerId));
    await clientes(10);
    const lanca = (idx: number, k: string) => recordSaleCommission(ctx.db, { partnerId, family: "COMMERCE_PLAN", productKey: "COMMERCE_PRO", cycle: "MONTHLY", paymentIndex: idx, paidCents: 14_700, feeCents: null, dedupeKey: k, now: DEZ });
    expect((await lanca(2, "r"))!.bps).toBe(2400);
    expect((await lanca(1, "f"))!.bps).toBe(5000);
    expect((await tierDe()).tier).toBe("OURO");
  });

  it("bônus do representante: R$ 30 por loja ativada (uma vez) e +R$ 100 na meta de 10", async () => {
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
});
