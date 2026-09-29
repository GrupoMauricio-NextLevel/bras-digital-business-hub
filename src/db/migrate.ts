import path from "node:path";
import { sql } from "drizzle-orm";
import type { Database } from "./client";

/**
 * Aplica as migrações SQL geradas pelo drizzle-kit (pasta ./drizzle).
 * Implementação própria e agnóstica ao driver: usa a mesma tabela de controle
 * do Drizzle (`__drizzle_migrations`) e lê o journal.
 */
export async function runMigrations(db: Database, folder = path.resolve(process.cwd(), "drizzle")) {
  const { readFileSync } = await import("node:fs");
  const journal = JSON.parse(readFileSync(path.join(folder, "meta", "_journal.json"), "utf8")) as { entries: { tag: string; when: number }[] };
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS drizzle`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id serial PRIMARY KEY, hash text NOT NULL, created_at bigint)`);
  const applied = (await db.execute(sql`SELECT created_at FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 1`)) as { rows: { created_at?: string | number }[] };
  const last = Number(applied.rows[0]?.created_at ?? 0);
  for (const entry of journal.entries) {
    if (entry.when <= last) continue;
    const content = readFileSync(path.join(folder, `${entry.tag}.sql`), "utf8");
    const statements = content.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
    await db.transaction(async (tx) => {
      for (const stmt of statements) await tx.execute(sql.raw(stmt));
      await tx.execute(sql`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${entry.tag}, ${entry.when})`);
    });
  }
}
