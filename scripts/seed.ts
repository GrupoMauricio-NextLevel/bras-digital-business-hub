import { sql } from "drizzle-orm";
import { createDatabase } from "../src/db/client";
import { seedDatabase, DEMO } from "../src/db/seed";

async function main() {
  const handle = await createDatabase();
  const r = (await handle.db.execute(sql`select count(*)::int as n from organizations`)) as { rows: { n: number }[] };
  if (Number(r.rows[0]?.n ?? 0) > 0) {
    console.log("Banco já possui dados. Use `npm run db:reset` para recriar.");
  } else {
    await seedDatabase(handle.db);
    console.log("✔ seed concluído");
    console.log("Acessos demo:", DEMO);
  }
  await handle.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
