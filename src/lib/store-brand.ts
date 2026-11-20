import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { organizations, type Store } from "@/db/schema";
import { brandByCode, defaultBrandCode, type Brand, type BrandCode } from "@/lib/brand";

export async function brandCodeOfStore(db: Database, store: Pick<Store, "organizationId">): Promise<BrandCode> {
  const row = await db.select({ brand: organizations.brand }).from(organizations).where(eq(organizations.id, store.organizationId)).limit(1);
  // O banco ainda guarda códigos de marcas descontinuadas (o enum não foi migrado). Devolve o que está gravado,
  // para a loja não trocar de marca sozinha; só cai no padrão quando não há nada.
  const code = row[0]?.brand;
  return (typeof code === "string" && code ? code : defaultBrandCode()) as BrandCode;
}

export async function brandOfStore(db: Database, store: Pick<Store, "organizationId">): Promise<Brand> {
  return brandByCode(await brandCodeOfStore(db, store));
}

export async function isCommerceStore(db: Database, store: Pick<Store, "organizationId">): Promise<boolean> {
  return (await brandCodeOfStore(db, store)) === "NEXTLEVEL_COMMERCE";
}
