import { mkdirSync } from "node:fs";
import { createDatabase, resolveDatabaseUrl } from "../src/db/client";
import { runMigrations } from "../src/db/migrate";

async function main() {
  if (resolveDatabaseUrl().startsWith("pglite://")) mkdirSync("data", { recursive: true });
  const handle = await createDatabase();
  await runMigrations(handle.db);
  await handle.close();
  console.log("✔ migrations aplicadas");
}
main().catch((e) => { console.error(e); process.exit(1); });
