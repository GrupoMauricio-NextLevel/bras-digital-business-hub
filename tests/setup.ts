import { createDatabase, type Database } from "@/db/client";
import { runMigrations } from "@/db/migrate";
import { seedDatabase } from "@/db/seed";
import type { Actor } from "@/lib/domain/access";
import { readFileSync } from "node:fs";
import { inject, onTestFinished } from "vitest";
import { desserializar } from "./molde";

type Seed = Awaited<ReturnType<typeof seedDatabase>>;

/** Banco novo por teste. Com o molde da execução (D171), só carrega a cópia pronta; sem ele, migra e semeia do zero. */
async function bancoDoMolde(): Promise<{ db: Database; seed: Seed } | null> {
  let molde: { dados: string; seed: string } | null = null;
  try { molde = inject("molde"); } catch { molde = null; }
  if (!molde) return null;
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const schema = await import("@/db/schema");
  const pg = new PGlite({ loadDataDir: new Blob([readFileSync(molde.dados)]) });
  // Fecha o banco quando o teste (ou o beforeEach dele) termina: sem isso cada arquivo acumulava dezenas de bancos abertos
  // e a bateria passava de 13 GB, com processos mortos por falta de memória. Banco criado em beforeAll segue aberto
  // (é compartilhado pelos testes do arquivo) e é liberado no fim do arquivo.
  try { onTestFinished(() => pg.close().catch(() => {})); } catch { /* fora de um teste (beforeAll): fica aberto */ }
  return { db: drizzle(pg, { schema }) as unknown as Database, seed: desserializar<Seed>(readFileSync(molde.seed, "utf8")) };
}

export async function freshDb() {
  const pronto = await bancoDoMolde();
  const db = pronto?.db ?? (await createDatabase("pglite://memory")).db;
  if (!pronto) await runMigrations(db);
  const seed = pronto?.seed ?? (await seedDatabase(db));
  const actors = {
    master: { userId: seed.users[0]!.id, role: "NEXTLEVEL_MASTER", organizationId: seed.users[0]!.organizationId, supplierId: null, storeId: null } satisfies Actor,
    supplier: { userId: seed.users[1]!.id, role: "SUPPLIER_ADMIN", organizationId: seed.users[1]!.organizationId, supplierId: seed.supplierId, storeId: null } satisfies Actor,
    mantos: { userId: seed.users[2]!.id, role: "STORE_OWNER", organizationId: seed.users[2]!.organizationId, supplierId: null, storeId: seed.stores.mantos.id } satisfies Actor,
    arena: { userId: seed.users[3]!.id, role: "STORE_OWNER", organizationId: seed.users[3]!.organizationId, supplierId: null, storeId: seed.stores.arena.id } satisfies Actor,
  };
  return { db: db as Database, seed, actors };
}

export const customer = { name: "Cliente Teste", email: "cliente@teste.com", marketingOptIn: false };
