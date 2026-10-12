import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

/**
 * Tipo genérico compartilhado por conexão e transações. As regras de negócio
 * em src/lib/domain dependem apenas deste tipo, não do driver.
 */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export type DatabaseHandle = { db: Database; close: () => Promise<void> };

/**
 * DATABASE_URL (ou NETLIFY_DATABASE_URL, injetada pelo Netlify DB):
 *  - `postgres://…`  → Postgres real via node-postgres (Neon/Netlify DB, Supabase, RDS…)
 *  - `pglite://./data/pg` ou ausente → PGlite embutido (arquivo local; `pglite://memory` em testes)
 */
export function resolveDatabaseUrl(): string {
  return process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || "pglite://./data/pg";
}

export async function createDatabase(url = resolveDatabaseUrl()): Promise<DatabaseHandle> {
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const pool = new Pool({ connectionString: url, max: 5, ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false } });
    return { db: drizzle(pool, { schema }) as unknown as Database, close: () => pool.end() };
  }
  const serverless = !!(process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (serverless && process.env.NODE_ENV === "production") {
    throw new Error("Nenhum banco Postgres configurado (DATABASE_URL ou NETLIFY_DATABASE_URL). Em ambiente serverless o PGlite local não está disponível.");
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const path = url.replace(/^pglite:\/\//, "");
  const client = path === "memory" || path === "" ? new PGlite() : new PGlite(path);
  return { db: drizzle(client, { schema }) as unknown as Database, close: () => client.close() };
}

const globalForDb = globalThis as unknown as { __nlDb?: Promise<DatabaseHandle> };

/** Instância única por processo (reaproveitada entre requisições). */
export async function getDb(): Promise<Database> {
  if (!globalForDb.__nlDb) {
    globalForDb.__nlDb = createDatabase().then(async (h) => {
      // Publicação de demonstração: com DEMO_AUTOSEED=true o banco (ex.: pglite://memory) nasce migrado e populado.
      if (process.env.DEMO_AUTOSEED === "true" && !resolveDatabaseUrl().startsWith("postgres")) {
        const { runMigrations } = await import("./migrate");
        const { bootstrapDatabase } = await import("./bootstrap-data");
        await runMigrations(h.db);
        await bootstrapDatabase(h.db, { seedDemo: true });
      }
      return h;
    }).catch((e) => {
      globalForDb.__nlDb = undefined;
      throw e;
    });
  }
  return (await globalForDb.__nlDb).db;
}

/**
 * Recomeça a demonstração (D144). Só com o modo demonstração ligado e, no Postgres, só num banco que tenha a marca de
 * demonstração (gravada quando o banco nasceu com os dados fictícios): a produção nunca tem essa marca, então nunca é
 * apagada. Em memória: troca por um banco novo. No Postgres: apaga as tabelas, migra e popula de novo.
 */
export async function resetDemoDatabase() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") throw new Error("Recomeçar só existe no ambiente de demonstração.");
  const url = resolveDatabaseUrl();
  if (url === "pglite://memory" && process.env.DEMO_AUTOSEED === "true") {
    const old = globalForDb.__nlDb;
    globalForDb.__nlDb = undefined;
    await getDb();
    try { await (await old)?.close(); } catch { /* o banco antigo já estava fechado */ }
    return;
  }
  if (!url.startsWith("postgres")) throw new Error("Recomeçar não está disponível neste banco.");
  const db = await getDb();
  const { DEMO_MARKER_KEY, bootstrapDatabase } = await import("./bootstrap-data");
  const marked = (await db.execute(sql`select 1 from platform_settings where key = ${DEMO_MARKER_KEY} limit 1`)) as { rows: unknown[] };
  if (!marked.rows.length) throw new Error("Este banco não é de demonstração: nada foi apagado.");
  await db.execute(sql`drop schema if exists drizzle cascade`);
  await db.execute(sql`drop schema public cascade`);
  await db.execute(sql`create schema public`);
  const { runMigrations } = await import("./migrate");
  await runMigrations(db);
  await bootstrapDatabase(db, { seedDemo: true });
}

export { schema };
