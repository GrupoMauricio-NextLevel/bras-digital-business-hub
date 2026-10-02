import { and, eq, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { categories, products } from "@/db/schema";
import { slugify } from "@/lib/ids";
import { DomainError, NotFoundError } from "./errors";
import { ensureCategory } from "./products";

/** Categorias do catálogo de uma Central (ou conta simples), com quantos produtos usam cada uma. */
export async function listCategories(db: Database, supplierId: string) {
  return db
    .select({ id: categories.id, name: categories.name, slug: categories.slug, productCount: sql<number>`count(${products.id})::int` })
    .from(categories)
    .leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.supplierId, supplierId)))
    .where(eq(categories.supplierId, supplierId))
    .groupBy(categories.id)
    .orderBy(categories.name);
}

export async function createCategory(db: Database, supplierId: string, name: string) {
  const clean = name.trim();
  if (clean.length < 2) throw new DomainError("INVALID_CATEGORY", "Informe o nome da categoria (mínimo 2 letras).");
  return { id: await ensureCategory(db, supplierId, clean) };
}

async function owned(db: Database, supplierId: string, id: string) {
  const row = await db.query.categories.findFirst({ where: and(eq(categories.id, id), eq(categories.supplierId, supplierId)) });
  if (!row) throw new NotFoundError("Categoria não encontrada.");
  return row;
}

export async function renameCategory(db: Database, supplierId: string, id: string, name: string) {
  const clean = name.trim();
  if (clean.length < 2) throw new DomainError("INVALID_CATEGORY", "Informe o nome da categoria (mínimo 2 letras).");
  await owned(db, supplierId, id);
  const slug = slugify(clean);
  const clash = await db.query.categories.findFirst({ where: and(eq(categories.supplierId, supplierId), eq(categories.slug, slug)) });
  if (clash && clash.id !== id) throw new DomainError("CATEGORY_EXISTS", "Já existe uma categoria com esse nome.");
  await db.update(categories).set({ name: clean, slug }).where(eq(categories.id, id));
}

/** Exclui a categoria; os produtos dela ficam sem categoria (nada é apagado). */
export async function deleteCategory(db: Database, supplierId: string, id: string): Promise<{ released: number }> {
  await owned(db, supplierId, id);
  return db.transaction(async (tx) => {
    const moved = await tx.update(products).set({ categoryId: null }).where(and(eq(products.categoryId, id), eq(products.supplierId, supplierId))).returning({ id: products.id });
    await tx.delete(categories).where(eq(categories.id, id));
    return { released: moved.length };
  });
}
