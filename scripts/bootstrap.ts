/**
 * Boot de produção: aplica migrações e, se o banco estiver vazio, roda o seed.
 * Idempotente — pode rodar a cada deploy.
 */
import { mkdirSync } from "node:fs";
import { sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { createDatabase } from "../src/db/client";
import { runMigrations } from "../src/db/migrate";
import { seedDatabase } from "../src/db/seed";

async function main() {
  if ((process.env.DATABASE_URL ?? "file:").startsWith("file:")) mkdirSync("data", { recursive: true });
  const { db } = createDatabase();
  await runMigrations(db as unknown as LibSQLDatabase<Record<string, unknown>>);
  const row = await db.get<{ n: number }>(sql`select count(*) as n from organizations`);
  if (!row || Number(row.n) === 0) {
    await seedDatabase(db);
    console.log("✔ seed de demonstração aplicado");
  } else {
    console.log("✔ banco já populado");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
