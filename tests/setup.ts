import { createDatabase, type Database } from "@/db/client";
import { runMigrations } from "@/db/migrate";
import { seedDatabase } from "@/db/seed";
import type { Actor } from "@/lib/domain/access";

export async function freshDb() {
  const { db } = await createDatabase("pglite://memory");
  await runMigrations(db);
  const seed = await seedDatabase(db);
  const actors = {
    master: { userId: seed.users[0]!.id, role: "NEXTLEVEL_MASTER", organizationId: seed.users[0]!.organizationId, supplierId: null, storeId: null } satisfies Actor,
    supplier: { userId: seed.users[1]!.id, role: "SUPPLIER_ADMIN", organizationId: seed.users[1]!.organizationId, supplierId: seed.supplierId, storeId: null } satisfies Actor,
    mantos: { userId: seed.users[2]!.id, role: "STORE_OWNER", organizationId: seed.users[2]!.organizationId, supplierId: null, storeId: seed.stores.mantos.id } satisfies Actor,
    arena: { userId: seed.users[3]!.id, role: "STORE_OWNER", organizationId: seed.users[3]!.organizationId, supplierId: null, storeId: seed.stores.arena.id } satisfies Actor,
  };
  return { db: db as Database, seed, actors };
}

export const customer = { name: "Cliente Teste", email: "cliente@teste.com", marketingOptIn: false };
