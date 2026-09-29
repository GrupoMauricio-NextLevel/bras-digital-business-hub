import { migrate } from "drizzle-orm/libsql/migrator";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import path from "node:path";

export async function runMigrations(db: LibSQLDatabase<Record<string, unknown>>) {
  await migrate(db, { migrationsFolder: path.resolve(process.cwd(), "drizzle") });
}
