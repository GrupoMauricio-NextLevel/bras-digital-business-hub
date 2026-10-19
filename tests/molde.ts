/**
 * Molde do banco de teste (D171): migrar as 69 migrações e semear a cada teste custava a maior parte da bateria. O molde é
 * gerado UMA vez por execução (globalSetup), salvo como cópia do diretório do PGlite, e cada `freshDb()` só carrega a cópia.
 * O resultado do seed (ids, mapas) vai junto, serializado, para os testes receberem exatamente os mesmos objetos.
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type Tagged = { __map: [unknown, unknown][] } | { __date: string };
/** JSON que preserva `Map` e `Date` (o seed devolve mapas de variantes e de pacotes). */
export const serializar = (v: unknown) => JSON.stringify(v, function (this: Record<string, unknown>, k, val) {
  const raw = this[k];
  if (raw instanceof Map) return { __map: [...raw.entries()] };
  if (raw instanceof Date) return { __date: raw.toISOString() };
  return val;
});
export const desserializar = <T>(s: string): T => JSON.parse(s, (_k, val: unknown) => {
  if (val && typeof val === "object" && "__map" in (val as Tagged)) return new Map((val as { __map: [unknown, unknown][] }).__map);
  if (val && typeof val === "object" && "__date" in (val as Tagged)) return new Date((val as { __date: string }).__date);
  return val;
}) as T;

export type Molde = { dados: string; seed: string };

/** Gera o molde num diretório temporário e devolve os caminhos. */
export async function gerarMolde(): Promise<Molde> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const schema = await import("@/db/schema");
  const { runMigrations } = await import("@/db/migrate");
  const { seedDatabase } = await import("@/db/seed");
  const pg = new PGlite();
  const db = drizzle(pg, { schema }) as unknown as import("@/db/client").Database;
  await runMigrations(db);
  const seed = await seedDatabase(db);
  const dump = await pg.dumpDataDir("none");
  await pg.close();
  const dir = mkdtempSync(join(tmpdir(), "nl-molde-"));
  const dados = join(dir, "pgdata.tar");
  const seedPath = join(dir, "seed.json");
  writeFileSync(dados, Buffer.from(await dump.arrayBuffer()));
  writeFileSync(seedPath, serializar(seed));
  return { dados, seed: seedPath };
}
