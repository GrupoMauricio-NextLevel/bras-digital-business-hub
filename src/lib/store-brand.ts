import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { organizations, type Store } from "@/db/schema";
import { brandByCode, type Brand, type BrandCode } from "@/lib/brand";

export async function brandCodeOfStore(db: Database, store: Pick<Store, "organizationId">): Promise<BrandCode> {
  const row = await db.select({ brand: organizations.brand }).from(organizations).where(eq(organizations.id, store.organizationId)).limit(1);
  return row[0]?.brand ?? "SUPERDROP";
}

export async function brandOfStore(db: Database, store: Pick<Store, "organizationId">): Promise<Brand> {
  return brandByCode(await brandCodeOfStore(db, store));
}

export async function isCommerceStore(db: Database, store: Pick<Store, "organizationId">): Promise<boolean> {
  return (await brandCodeOfStore(db, store)) === "NEXTLEVEL_COMMERCE";
}
