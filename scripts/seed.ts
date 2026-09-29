import { createDatabase } from "../src/db/client";
import { seedDatabase, DEMO } from "../src/db/seed";
import { sql } from "drizzle-orm";

async function main() {
  const { db } = createDatabase();
  const existing = await db.get<{ n: number }>(sql`select count(*) as n from organizations`);
  if (existing && existing.n > 0) {
    console.log("Banco já possui dados. Use `npm run db:reset` para recriar.");
    return;
  }
  await seedDatabase(db);
  console.log("✔ seed concluído");
  console.log("Acessos demo:", DEMO);
}

main().catch((e) => { console.error(e); process.exit(1); });
