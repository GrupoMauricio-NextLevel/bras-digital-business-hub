import { beforeEach, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import { signupMember } from "@/lib/domain/store-access";
import { createBrandLead } from "@/lib/domain/brand-leads";
import { getCommerceConsole } from "@/lib/domain/commerce-console";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

describe("console independente da NextLevel Commerce", () => {
  it("isola lojas e leads da Commerce e não mistura a holding NextLevel", async () => {
    await signupMember(ctx.db, {
      storeName: "Commerce One", ownerName: "Ana Commerce", email: "ana.commerce@example.com",
      password: "senha-segura-1", taxId: "111.444.777-35", brand: "NEXTLEVEL_COMMERCE", independent: true,
    } as never);
    await signupMember(ctx.db, {
      storeName: "Holding One", ownerName: "Bruno Holding", email: "bruno.holding@example.com",
      password: "senha-segura-1", taxId: "111.444.777-35", brand: "NEXTLEVEL", independent: true,
    } as never);
    await createBrandLead(ctx.db, { brand: "NEXTLEVEL_COMMERCE", name: "Lead Commerce", email: "commerce@lead.com", phone: "11999990000" } as never);
    await createBrandLead(ctx.db, { brand: "NEXTLEVEL", name: "Lead Holding", email: "holding@lead.com", phone: "11999990001" } as never);

    const result = await getCommerceConsole(ctx.db, ctx.actors.master);
    expect(result.kpis.stores).toBe(1);
    expect(result.stores.map((x) => x.store.name)).toEqual(["Commerce One"]);
    expect(result.kpis.leadsTotal).toBe(1);
    expect(result.leads.map((x) => x.name)).toEqual(["Lead Commerce"]);
  });

  it("continua restrito ao Master", async () => {
    await expect(getCommerceConsole(ctx.db, ctx.actors.supplier)).rejects.toThrow();
    await expect(getCommerceConsole(ctx.db, ctx.actors.mantos)).rejects.toThrow();
  });
});
