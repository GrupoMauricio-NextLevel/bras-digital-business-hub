/**
 * Boot de produção/build: aplica migrações e, se o banco estiver vazio, roda o seed.
 * Idempotente — pode rodar a cada deploy (Netlify build, Docker start).
 */
import { mkdirSync } from "node:fs";
import { sql } from "drizzle-orm";
import { createDatabase, resolveDatabaseUrl } from "../src/db/client";
import { runMigrations } from "../src/db/migrate";
import { seedDatabase } from "../src/db/seed";

async function main() {
  const url = resolveDatabaseUrl();
  if (url.startsWith("pglite://")) mkdirSync("data", { recursive: true });
  console.log(`→ banco: ${url.replace(/:\/\/[^@]+@/, "://***@")}`);
  const handle = await createDatabase(url);
  await runMigrations(handle.db);
  const r = (await handle.db.execute(sql`select count(*)::int as n from organizations`)) as { rows: { n: number }[] };
  if (Number(r.rows[0]?.n ?? 0) === 0) {
    await seedDatabase(handle.db);
    console.log("✔ seed de demonstração aplicado");
  } else {
    console.log("✔ banco já populado");
  }
  await handle.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
