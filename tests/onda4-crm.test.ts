import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { customers, marketingConsents, storeCustomers } from "@/db/schema";
import { exportConsentedContactsCsv, getStoreCustomer, revokeMarketingConsents, updateStoreCustomerProfile } from "@/lib/domain/crm";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

async function addCustomer(storeId: string, name: string, email: string, consent: boolean) {
  const [c] = await ctx.db.insert(customers).values({ id: `c_${email}`, name, email }).returning();
  const [sc] = await ctx.db.insert(storeCustomers).values({ id: `sc_${storeId}_${email}`, storeId, customerId: c!.id }).returning();
  if (consent) await ctx.db.insert(marketingConsents).values({ id: `mc_${sc!.id}`, storeCustomerId: sc!.id, purpose: "EMAIL_MARKETING", source: "teste" });
  return sc!;
}

describe("Onda 4 — CRM básico por loja", () => {
  it("etiquetas e anotação são da loja; outra loja não lê nem edita", async () => {
    const a = ctx.seed.stores.mantos.id, b = ctx.seed.stores.arena.id;
    const sc = await addCustomer(a, "Ana", "ana@x.com", true);
    await updateStoreCustomerProfile(ctx.db, a, sc.id, { notes: "  prefere atacado ", tags: ["VIP", "vip", " Atacado "] });
    const got = await getStoreCustomer(ctx.db, a, sc.id);
    expect(got.sc.tags).toEqual(["vip", "atacado"]);
    expect(got.sc.notes).toBe("prefere atacado");
    await expect(getStoreCustomer(ctx.db, b, sc.id)).rejects.toThrow(/não encontrado/);
    await expect(updateStoreCustomerProfile(ctx.db, b, sc.id, { notes: "x" })).rejects.toThrow(/não encontrado/);
    await expect(revokeMarketingConsents(ctx.db, b, sc.id)).rejects.toThrow(/não encontrado/);
  });

  it("exportação só traz quem consentiu, neutraliza fórmula e respeita a revogação", async () => {
    const a = ctx.seed.stores.mantos.id, b = ctx.seed.stores.arena.id;
    const ok = await addCustomer(a, "=HYPERLINK(\"x\")", "ok@x.com", true);
    await addCustomer(a, "Sem Consentimento", "nao@x.com", false);
    await addCustomer(b, "Outra Loja", "outra@x.com", true);
    const csv = await exportConsentedContactsCsv(ctx.db, a);
    expect(csv).toContain("ok@x.com");
    expect(csv).toContain("\"'=HYPERLINK");
    expect(csv).not.toContain("nao@x.com");
    expect(csv).not.toContain("outra@x.com");
    expect((await revokeMarketingConsents(ctx.db, a, ok.id)).revoked).toBe(1);
    expect(await exportConsentedContactsCsv(ctx.db, a)).not.toContain("ok@x.com");
    const rows = await ctx.db.select().from(marketingConsents).where(eq(marketingConsents.storeCustomerId, ok.id));
    expect(rows[0]!.revokedAt).toBeTruthy(); // histórico preservado
  });
});
