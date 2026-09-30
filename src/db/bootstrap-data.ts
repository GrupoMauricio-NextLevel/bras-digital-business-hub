import { eq, sql } from "drizzle-orm";
import type { Database } from "./client";
import { organizations, themes, users } from "./schema";
import { seedReferenceData } from "./base-data";
import { seedDatabase } from "./seed";
import { seedShowcase } from "./showcase";
import { seedDemoSuppliers } from "./demo-suppliers";
import { syncThemeCatalog } from "@/lib/themes/catalog";
import { newId } from "@/lib/ids";
import { hashPassword } from "@/lib/security/password";

export type BootstrapOptions = { seedDemo: boolean; masterEmail?: string; masterPassword?: string; masterName?: string };

/**
 * Prepara um banco recém-migrado. Idempotente.
 *  - seedDemo=true  → dados de demonstração completos (apenas se o banco estiver vazio)
 *  - seedDemo=false → apenas dados de referência (temas, planos, serviços) + usuário master informado
 */
export async function bootstrapDatabase(db: Database, opts: BootstrapOptions): Promise<string[]> {
  const log: string[] = [];
  const orgCount = Number(((await db.execute(sql`select count(*)::int as n from organizations`)) as { rows: { n: number }[] }).rows[0]?.n ?? 0);

  if (opts.seedDemo) {
    if (orgCount === 0) { await seedDatabase(db); await seedShowcase(db); await seedDemoSuppliers(db); log.push("seed de demonstração aplicado (inclui a vitrine Mega Tron / MRS Sports e as páginas Alpha Outfit e MantosShop)"); }
    else log.push("banco já populado (demo não reaplicado)");
    return log;
  }

  const hasThemes = (await db.select({ id: themes.id }).from(themes).limit(1)).length > 0;
  if (!hasThemes) { await seedReferenceData(db); log.push("dados de referência criados (temas, planos, serviços)"); }
  else for (const l of await syncThemeCatalog(db)) log.push(l);

  if (opts.masterEmail && opts.masterPassword) {
    const email = opts.masterEmail.toLowerCase();
    if (opts.masterPassword.length < 10) throw new Error("MASTER_PASSWORD precisa ter pelo menos 10 caracteres.");
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!existing) {
      let org = await db.query.organizations.findFirst({ where: eq(organizations.slug, "nextlevel") });
      if (!org) {
        const id = newId("org");
        await db.insert(organizations).values({ id, name: "NextLevel Marketing Ltda.", slug: "nextlevel", type: "NEXTLEVEL" });
        org = await db.query.organizations.findFirst({ where: eq(organizations.id, id) });
      }
      await db.insert(users).values({ id: newId("usr"), name: opts.masterName ?? "Administrador NextLevel", email, role: "NEXTLEVEL_MASTER", organizationId: org!.id, passwordHash: hashPassword(opts.masterPassword), mustChangePassword: false });
      log.push(`usuário master criado: ${email}`);
    } else log.push("usuário master já existe");
  } else if (orgCount === 0) {
    log.push("AVISO: nenhum usuário master criado. Defina MASTER_EMAIL e MASTER_PASSWORD e rode o bootstrap novamente.");
  }
  return log;
}
