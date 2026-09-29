import { createClient, type Client, type ResultSet } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "./schema";

/**
 * Tipo genérico compartilhado por conexão e transações. Permite trocar o
 * driver (D1 / Turso / better-sqlite3) sem alterar as regras de negócio.
 */
export type Database = BaseSQLiteDatabase<"async", ResultSet, typeof schema>;

/**
 * DATABASE_URL aceita `file:./data/nextlevel.db` (SQLite local / volume) ou
 * `libsql://...` (Turso) com DATABASE_AUTH_TOKEN.
 */
export function createDatabase(url = process.env.DATABASE_URL ?? "file:./data/nextlevel.db"): { db: Database; client: Client } {
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
  return { db: drizzle(client, { schema }), client };
}

const globalForDb = globalThis as unknown as { __nlDb?: Database };

export function getDb(): Database {
  if (!globalForDb.__nlDb) globalForDb.__nlDb = createDatabase().db;
  return globalForDb.__nlDb;
}

export { schema };
