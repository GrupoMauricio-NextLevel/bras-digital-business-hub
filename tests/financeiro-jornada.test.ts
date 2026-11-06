import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { brandLeads, partnerLeads, partners, stores, storeProducts } from "@/db/schema";
import { storeJourney } from "@/lib/domain/journey";
import { createPartnerLead, listPartnerLeads, partnerCatalog, requestDiagnostic, requestQuote, savePartnerDiagnosis, scoreDiagnosis, updateQuote, listQuotes } from "@/lib/domain/corporate-sales";
import { corporateOverview } from "@/lib/domain/corporate-metrics";
import { operationalExportCsv } from "@/lib/domain/operational-finance";
import { attributionFrom } from "@/proxy";
import { withAttribution } from "@/lib/attribution";
import { routeHost } from "@/lib/host-routing";
import { createCorporateCheckout } from "@/lib/domain/corporate-checkout";
import { signupMember } from "@/lib/domain/store-access";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

async function partner(code: string, taxId: string, email: string) {
  const { registerPartner } = await import("@/lib/domain/partners");
  const r = await registerPartner(ctx.db, { name: `Parceiro ${code}`, email, phone: "11988887777", taxId, password: "senha-parceiro-1", acceptTerms: true } as never);
  await ctx.db.update(partners).set({ code }).where(eq(partners.userId, r.userId));
  return { userId: r.userId, role: "AFFILIATE" as const, organizationId: "", supplierId: null, storeId: null };
}

describe("jornada da Loja NextLevel: estados reais, bloqueio educativo e elegibilidade", () => {
  it("loja SuperDrop: planos e Loja Pronta não elegíveis; marketing bloqueado até publicar; nada some", async () => {
    await ctx.db.update(storeProducts).set({ active: false }).where(eq(storeProducts.storeId, ctx.seed.stores.mantos.id));
    const j = await storeJourney(ctx.db, ctx.actors.mantos, ctx.seed.stores.mantos.id);
    const st = (k: string) => j.cards.find((c) => c.product.key === k)!;
    expect(st("COMMERCE_PRO").state).toBe("not_eligible");
    expect(st("LOJA_PRONTA_ESSENCIAL").state).toBe("not_eligible");
    // D164: produto de outra marca continua bloqueado no cálculo, mas não aparece na tela da loja SuperDrop.
    expect(j.visiveis.some((c) => c.product.key === "COMMERCE_PRO")).toBe(false);
    expect(st("COMMERCE_PRO").reason).not.toMatch(/E-commerce/);
    expect(st("MKT_META_ADS").state).toBe("quote_required"); // sob consulta sempre vira proposta
    expect(st("TEMA_ATELIER")).toBeTruthy();
    expect(j.phases).toHaveLength(5);
    await expect(storeJourney(ctx.db, ctx.actors.arena, ctx.seed.stores.mantos.id)).rejects.toThrow();
  });

  it("loja Commerce: plano em teste aparece como atual; bloqueio obrigatório impede o checkout", async () => {
    const r = await signupMember(ctx.db, { storeName: "Loja Jornada", ownerName: "Dona", email: "j@loja.com", password: "senha-segura-1", taxId: "529.982.247-25", brand: "NEXTLEVEL_COMMERCE", independent: true, plan: "COMMERCE_PRO" });
    const owner = (await ctx.db.query.users.findFirst({ where: (u, { eq: e }) => e(u.storeId, r.storeId) }))!;
    const actor = { userId: owner.id, role: "STORE_OWNER" as const, organizationId: owner.organizationId, supplierId: null, storeId: r.storeId };
    const j = await storeJourney(ctx.db, actor, r.storeId);
    expect(j.cards.find((c) => c.product.key === "COMMERCE_PRO")!.state).toBe("completed");
    expect(j.cards.find((c) => c.product.key === "LOJA_PRONTA_ESSENCIAL")!.state).toMatch(/available|recommended/);
    expect(j.phases[0]!.items.find((m) => m.key === "PLAN_ACTIVE")!.done).toBe(true);
    expect(j.phases[0]!.items.find((m) => m.key === "CHECKOUT_READY")!.done).toBe(false); // nada inventado
    // Checkout com regra de elegibilidade: produto bloqueado não é comprável mesmo por chamada direta.
    await expect(createCorporateCheckout(ctx.db, actor, { productKey: "LOJA_PRONTA_ESSENCIAL", method: "PIX", idempotencyKey: "k-jor-00001" }, { demo: true, returnPath: "/x", eligibility: async () => { throw new Error("bloqueado"); } })).rejects.toThrow(/bloqueado/);
    const store = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    expect(store.trialEndsAt).toBeTruthy();
  });
});

describe("diagnóstico, propostas e CRM do parceiro", () => {
  it("diagnóstico público vira interessado da NextLevel, com roteamento e lead do parceiro de origem", async () => {
    await partner("LUA", "52998224725", "lua@parceira.com");
    const r = await requestDiagnostic(ctx.db, { name: "Cliente Novo", email: "novo@empresa.com", phone: "11999998888", stage: "VENDENDO", needs: ["MIGRAR", "TRAFEGO"], consent: true }, { ref: "LUA", utm_source: "instagram", evil: "x" } as never);
    expect(r.routes.map((x) => x.href)).toEqual(["/solucoes/migracao-lite", "/solucoes/meta-ads"]);
    const lead = (await ctx.db.select().from(brandLeads).where(eq(brandLeads.kind, "DIAGNOSTIC")))[0]!;
    expect(lead).toMatchObject({ brand: "NEXTLEVEL", affiliateRef: "LUA" });
    expect(lead.attribution).toEqual({ ref: "LUA", utm_source: "instagram" });
    expect((await ctx.db.select().from(partnerLeads)).map((l) => l.email)).toEqual(["novo@empresa.com"]);
    await expect(requestDiagnostic(ctx.db, { name: "X", email: "x@y.com", phone: "1", stage: "IDEIA", needs: [], consent: true } as never)).rejects.toThrow();
  });

  it("parceiro vê só os próprios leads e propostas; lead de outro parceiro é recusado; catálogo traz regra e link", async () => {
    const a = await partner("ANA", "52998224725", "ana@parceira.com");
    const b = await partner("BRUNO", "11144477735", "bruno@parceiro.com");
    await createPartnerLead(ctx.db, a, { name: "Loja X", email: "loja@x.com" });
    await expect(createPartnerLead(ctx.db, b, { name: "Loja X", email: "loja@x.com" })).rejects.toThrow(/outro parceiro/);
    expect(await listPartnerLeads(ctx.db, b)).toHaveLength(0);
    const leads = await listPartnerLeads(ctx.db, a);
    const d = await savePartnerDiagnosis(ctx.db, a, leads[0]!.id, { hasStore: "sim_outra", monthlyOrders: "31-300", ads: "as_vezes", catalog: "ate_150", social: "irregular" });
    expect(d.recommendations).toEqual(expect.arrayContaining(["MIGRACAO_LITE", "MKT_META_ADS", "MKT_SOCIAL", "CONSULTORIA_CRESCIMENTO"]));
    await expect(savePartnerDiagnosis(ctx.db, b, leads[0]!.id, { hasStore: "nao", monthlyOrders: "0", ads: "nao", catalog: "ate_30", social: "nao" })).rejects.toThrow();
    const q = await requestQuote(ctx.db, a, { productKey: "WHITE_LABEL_PARCEIRO", briefing: "Agência quer revender com marca própria", contact: { name: "Loja X", email: "loja@x.com" } });
    expect((await listQuotes(ctx.db, a)).map((x) => x.id)).toEqual([q.id]);
    expect(await listQuotes(ctx.db, b)).toHaveLength(0);
    await expect(updateQuote(ctx.db, a, q.id, { status: "SENT" })).rejects.toThrow();
    await updateQuote(ctx.db, ctx.actors.master, q.id, { items: [{ description: "Setup White Label", amountCents: 2_500_000 }], status: "SENT" });
    expect((await listQuotes(ctx.db, ctx.actors.master))[0]!.totalCents).toBe(2_500_000);
    const cat = await partnerCatalog(ctx.db, a);
    const tema = cat.find((c) => c.key === "TEMA_ATELIER")!;
    expect(tema.rule).toMatchObject({ firstBps: 2000, holdDays: 14 });
    expect(tema.link).toBe("/solucoes/tema-atelier?ref=ANA");
    expect(cat.find((c) => c.key === "COMMERCE_START")!.annualRule).toMatchObject({ firstBps: 2000 }) // D260: o anual paga o mesmo percentual sobre o valor do ano;
    expect(scoreDiagnosis({ hasStore: "nao", monthlyOrders: "0", ads: "nao", catalog: "ate_30", social: "nao" }).score).toBe(5);
  });
});

describe("isolamento entre domínios financeiros", () => {
  it("visão executiva só do Master; extrato operacional só do próprio negócio", async () => {
    await expect(corporateOverview(ctx.db, ctx.actors.mantos)).rejects.toThrow();
    await expect(corporateOverview(ctx.db, ctx.actors.supplier)).rejects.toThrow();
    const o = await corporateOverview(ctx.db, ctx.actors.master);
    expect(o.arrCents).toBe(o.mrrCents * 12);
    const csv = await operationalExportCsv(ctx.db, ctx.actors.mantos, "vendas");
    expect(csv.split("\n")[0]).toContain("Destino");
    await expect(operationalExportCsv(ctx.db, ctx.actors.mantos, "recargas")).rejects.toThrow();
    await expect(operationalExportCsv(ctx.db, ctx.actors.supplier, "vendas")).rejects.toThrow();
    const rec = await operationalExportCsv(ctx.db, ctx.actors.supplier, "recargas");
    expect(rec.split("\n")[0]).toContain("Loja");
  });
});

describe("atribuição entre superfícies", () => {
  it("guarda último toque não direto e leva ref/utm para outro domínio", () => {
    expect(attributionFrom(new URL("https://superdrop.com.br/solucoes"))).toBeNull();
    const a = attributionFrom(new URL("https://superdrop.com.br/solucoes?ref=ana&utm_source=insta<script>&utm_campaign=out"))!;
    expect(a).toMatchObject({ ref: "ANA", utm_source: "instascript", utm_campaign: "out", page: "/solucoes" });
    expect(attributionFrom(new URL("https://x.com/?ref=a b")) ).toBeNull();
    expect(withAttribution("https://lojas.nextlevelgroup.com.br/planos#x", { ref: "ANA", utm_source: "insta", page: "/" })).toBe("https://lojas.nextlevelgroup.com.br/planos?ref=ANA&utm_source=insta#x");
    expect(withAttribution("/cadastro?plano=COMMERCE_PRO", {})).toBe("/cadastro?plano=COMMERCE_PRO");
  });
  it("endereço do Master serve a super landing e continua mandando o resto para o login", () => {
    const env = { BRAND_DOMAINS_NEXTLEVEL: "master.nextlevelgroup.com.br" };
    expect(routeHost({ host: "master.nextlevelgroup.com.br", pathname: "/solucoes" }, env)).toEqual({ kind: "next" });
    expect(routeHost({ host: "master.nextlevelgroup.com.br", pathname: "/solucoes/white-label" }, env)).toEqual({ kind: "next" });
    expect(routeHost({ host: "master.nextlevelgroup.com.br", pathname: "/planos" }, env)).toEqual({ kind: "redirect", url: "/login" });
  });
});
