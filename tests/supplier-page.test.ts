import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createDatabase, type Database } from "@/db/client";
import { runMigrations } from "@/db/migrate";
import { seedDatabase } from "@/db/seed";
import { seedShowcase } from "@/db/showcase";
import { suppliers } from "@/db/schema";
import { getPublicSupplierPage } from "@/lib/domain/supplier-page";

let db: Database;
beforeAll(async () => { ({ db } = (await createDatabase("pglite://memory")) as { db: Database }); await runMigrations(db); await seedDatabase(db); await seedShowcase(db); }, 120_000);

describe("página de vendas do fornecedor", () => {
  it("mostra conteúdo próprio, catálogo e planos sem nenhum dado de custo, estoque ou cliente", async () => {
    const p = await getPublicSupplierPage(db, "megatron");
    expect(p?.name).toBe("Mega Tron");
    expect(p?.products).toHaveLength(5);
    expect(p?.plans).toHaveLength(3);
    const keys = JSON.stringify(p);
    for (const banned of ["costCents", "minimumPriceCents", "stock", "onHand", "email", "passwordHash", "walletMpTokenEnc"]) expect(keys).not.toContain(banned);
  });
  it("usa textos padrão quando o fornecedor não personalizou a página", async () => {
    const p = await getPublicSupplierPage(db, "central-sports");
    expect(p?.headline).toContain("Central Sports");
    expect(p?.faq.length).toBeGreaterThan(0);
  });
  it("não existe para fornecedor inexistente, suspenso ou encerrado", async () => {
    expect(await getPublicSupplierPage(db, "nao-existe")).toBeNull();
    await db.update(suppliers).set({ status: "SUSPENDED" }).where(eq(suppliers.slug, "megatron"));
    expect(await getPublicSupplierPage(db, "megatron")).toBeNull();
  });
});
