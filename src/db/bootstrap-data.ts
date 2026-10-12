import { eq, sql } from "drizzle-orm";
import type { Database } from "./client";
import { organizations, platformSettings, themes, users } from "./schema";
import { seedDigitalProducts, seedReferenceData } from "./base-data";
import { seedDatabase } from "./seed";
import { seedShowcase } from "./showcase";
import { seedCommerceDemo } from "./commerce-demo";
import { seedCommerceRichDemo } from "./commerce-demo-rich";
import { applyLaunchBranding, seedDemoPartner, seedDemoSuppliers } from "./demo-suppliers";
import { syncThemeCatalog } from "@/lib/themes/catalog";
import { seedDemoCargas } from "./demo-cargas";
import { seedDemoBras } from "./demo-bras";
import { ensureShowcaseStores } from "@/lib/themes/showcase";
import { newId } from "@/lib/ids";
import { hashPassword } from "@/lib/security/password";

/** Chave da marca de banco de demonstração (D144). */
export const DEMO_MARKER_KEY = "demo.ambiente";

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
    if (orgCount === 0) {
      await seedDatabase(db); await seedShowcase(db); await seedDemoSuppliers(db);
      // Marca de banco de demonstração (D144): só um banco com esta marca pode ser apagado pelo "Recomeçar do zero".
      await db.insert(platformSettings).values({ key: DEMO_MARKER_KEY, value: { createdAt: new Date().toISOString() } }).onConflictDoNothing();
      log.push("seed de demonstração aplicado (inclui a vitrine Mega Tron / MRS Sports e as páginas Alpha Outfit e MantosShop)");
    }
    else log.push("banco já populado (demo não reaplicado)");
    if (await seedDigitalProducts(db)) log.push("vitrine da Loja NextLevel criada");
    if (await seedCommerceDemo(db)) log.push("conta de demonstração da Commerce criada (lojista@commerce.demo)");
    if (await seedCommerceRichDemo(db)) log.push("loja de teste completa da Commerce criada (completo@commerce.demo)");
    await seedDemoPartner(db);
    if (await seedDemoCargas(db)) log.push("transportadoras fictícias de demonstração (Ouro, Prata e Bronze) criadas");
    if (await seedDemoBras(db, (m) => log.push(m))) log.push("ambiente de gravação: Brás, transportadora, ônibus, Club, Meu Contador e equipe do Master");
    for (const l of await ensureShowcaseStores(db)) log.push(l);
    return log;
  }

  for (const l of await applyLaunchBranding(db)) log.push(l);
  const hasThemes = (await db.select({ id: themes.id }).from(themes).limit(1)).length > 0;
  if (!hasThemes) { await seedReferenceData(db); log.push("dados de referência criados (temas, planos, serviços)"); }
  else for (const l of await syncThemeCatalog(db)) log.push(l);

  if (await seedDigitalProducts(db)) log.push("vitrine da Loja NextLevel criada");
  for (const l of await ensureShowcaseStores(db)) log.push(l);

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
