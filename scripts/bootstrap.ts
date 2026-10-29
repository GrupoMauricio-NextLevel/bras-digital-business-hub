/**
 * Boot de produção/build: aplica migrações e prepara o banco. Idempotente — roda a cada deploy.
 *
 * Variáveis:
 *   SEED_DEMO=true                       dados de demonstração (só em banco vazio)
 *   MASTER_EMAIL / MASTER_PASSWORD       cria o usuário master (mín. 10 caracteres) se não existir
 *   MASTER_NAME                          (opcional)
 *   RECOMECAR_DO_ZERO=<código>           apaga contas, lojas e vendas fictícias uma vez (D199)
 */
import { mkdirSync } from "node:fs";
import { createDatabase, resolveDatabaseUrl } from "../src/db/client";
import { runMigrations } from "../src/db/migrate";
import { bootstrapDatabase } from "../src/db/bootstrap-data";
import { recomecarDoZero } from "../src/db/recomecar";

async function main() {
  const url = resolveDatabaseUrl();
  if (url.startsWith("pglite://")) mkdirSync("data", { recursive: true });
  console.log(`→ banco: ${url.replace(/:\/\/[^@]+@/, "://***@")}`);
  // Banco em memória (demonstração): tudo o que se preparasse aqui sumiria ao fim deste processo; o servidor prepara o
  // dele ao subir (DEMO_AUTOSEED). Pular economiza memória no plano pequeno (D144).
  if (url === "pglite://memory") { console.log("✔ banco em memória: o servidor prepara ao subir"); return; }
  const handle = await createDatabase(url);
  await runMigrations(handle.db);
  // Começar do zero (D199): RECOMECAR_DO_ZERO=<código> apaga os dados fictícios uma vez por código, antes do preparo.
  // Uma falha aqui nunca derruba o site: registra e segue com o boot normal.
  if (process.env.RECOMECAR_DO_ZERO) {
    try { for (const l of await recomecarDoZero(handle.db, process.env.RECOMECAR_DO_ZERO)) console.log(`✔ ${l}`); }
    catch (e) { console.error(`✘ recomeço não aplicado: ${e instanceof Error ? e.message : String(e)}`); }
  }
  const log = await bootstrapDatabase(handle.db, { seedDemo: process.env.SEED_DEMO === "true", masterEmail: process.env.MASTER_EMAIL, masterPassword: process.env.MASTER_PASSWORD, masterName: process.env.MASTER_NAME });
  for (const l of log) console.log(`✔ ${l}`);
  await handle.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
