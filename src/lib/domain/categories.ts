import { and, eq, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { categories, products } from "@/db/schema";
import { slugify } from "@/lib/ids";
import { DomainError, NotFoundError } from "./errors";
import { ensureCategory } from "./products";
import { ownedBy, type OwnerRef } from "./independent";

/** Categorias do catálogo de uma Central (ou conta simples), com quantos produtos usam cada uma. */
export async function listCategories(db: Database, owner: OwnerRef) {
  return db
    .select({ id: categories.id, name: categories.name, slug: categories.slug, productCount: sql<number>`count(${products.id})::int` })
    .from(categories)
    .leftJoin(products, and(eq(products.categoryId, categories.id), ownedBy(products, owner)))
    .where(ownedBy(categories, owner))
    .groupBy(categories.id)
    .orderBy(categories.name);
}

export async function createCategory(db: Database, owner: OwnerRef, name: string) {
  const clean = name.trim();
  if (clean.length < 2) throw new DomainError("INVALID_CATEGORY", "Informe o nome da categoria (mínimo 2 letras).");
  return { id: await ensureCategory(db, owner, clean) };
}

async function owned(db: Database, owner: OwnerRef, id: string) {
  const row = await db.query.categories.findFirst({ where: and(eq(categories.id, id), ownedBy(categories, owner)) });
  if (!row) throw new NotFoundError("Categoria não encontrada.");
  return row;
}

export async function renameCategory(db: Database, owner: OwnerRef, id: string, name: string) {
  const clean = name.trim();
  if (clean.length < 2) throw new DomainError("INVALID_CATEGORY", "Informe o nome da categoria (mínimo 2 letras).");
  await owned(db, owner, id);
  const slug = slugify(clean);
  const clash = await db.query.categories.findFirst({ where: and(ownedBy(categories, owner), eq(categories.slug, slug)) });
  if (clash && clash.id !== id) throw new DomainError("CATEGORY_EXISTS", "Já existe uma categoria com esse nome.");
  await db.update(categories).set({ name: clean, slug }).where(eq(categories.id, id));
}

/** Exclui a categoria; os produtos dela ficam sem categoria (nada é apagado). */
export async function deleteCategory(db: Database, owner: OwnerRef, id: string): Promise<{ released: number }> {
  await owned(db, owner, id);
  return db.transaction(async (tx) => {
    const moved = await tx.update(products).set({ categoryId: null }).where(and(eq(products.categoryId, id), ownedBy(products, owner))).returning({ id: products.id });
    await tx.delete(categories).where(eq(categories.id, id));
    return { released: moved.length };
  });
}
