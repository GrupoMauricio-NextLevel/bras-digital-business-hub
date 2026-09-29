import { mkdirSync } from "node:fs";
import { createDatabase } from "../src/db/client";
import { runMigrations } from "../src/db/migrate";
import type { LibSQLDatabase } from "drizzle-orm/libsql";

mkdirSync("data", { recursive: true });
const { db } = createDatabase();
runMigrations(db as unknown as LibSQLDatabase<Record<string, unknown>>)
  .then(() => console.log("✔ migrations aplicadas"))
  .catch((e) => { console.error(e); process.exit(1); });
