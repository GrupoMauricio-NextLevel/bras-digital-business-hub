/**
 * Boot de produção/build: aplica migrações e prepara o banco. Idempotente — roda a cada deploy.
 *
 * Variáveis:
 *   SEED_DEMO=true                       dados de demonstração (só em banco vazio)
 *   MASTER_EMAIL / MASTER_PASSWORD       cria o usuário master (mín. 10 caracteres) se não existir
 *   MASTER_NAME                          (opcional)
 */
import { mkdirSync } from "node:fs";
import { createDatabase, resolveDatabaseUrl } from "../src/db/client";
import { runMigrations } from "../src/db/migrate";
import { bootstrapDatabase } from "../src/db/bootstrap-data";

async function main() {
  const url = resolveDatabaseUrl();
  if (url.startsWith("pglite://")) mkdirSync("data", { recursive: true });
  console.log(`→ banco: ${url.replace(/:\/\/[^@]+@/, "://***@")}`);
  const handle = await createDatabase(url);
  await runMigrations(handle.db);
  const log = await bootstrapDatabase(handle.db, { seedDemo: process.env.SEED_DEMO === "true", masterEmail: process.env.MASTER_EMAIL, masterPassword: process.env.MASTER_PASSWORD, masterName: process.env.MASTER_NAME });
  for (const l of log) console.log(`✔ ${l}`);
  await handle.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
