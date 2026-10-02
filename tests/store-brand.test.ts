import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { organizations, stores } from "@/db/schema";
import { brandCodeOfStore, isCommerceStore } from "@/lib/store-brand";

describe("identidade do painel do lojista", () => {
  it("resolve a marca pela organização da loja e não pelo hostname", async () => {
    const { db, actors } = await freshDb();
    const store = await db.query.stores.findFirst({ where: eq(stores.id, actors.mantos.storeId!) });
    expect(store).toBeTruthy();

    await db.update(organizations).set({ brand: "NEXTLEVEL_COMMERCE" }).where(eq(organizations.id, store!.organizationId));
    expect(await brandCodeOfStore(db, store!)).toBe("NEXTLEVEL_COMMERCE");
    expect(await isCommerceStore(db, store!)).toBe(true);

    await db.update(organizations).set({ brand: "SUPERDROP" }).where(eq(organizations.id, store!.organizationId));
    expect(await brandCodeOfStore(db, store!)).toBe("SUPERDROP");
    expect(await isCommerceStore(db, store!)).toBe(false);
  });
});
