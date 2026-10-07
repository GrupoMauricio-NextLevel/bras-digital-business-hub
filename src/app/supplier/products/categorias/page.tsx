import type { OwnerRef } from "@/lib/domain/independent";
import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { listCategories } from "@/lib/domain/categories";
import { CategoriesManager } from "./categories-manager";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const session = await requireRole("SUPPLIER_ADMIN");
  return <CategoriasBody supplierId={session.supplier!.id} base="/supplier/products" />;
}

/** Corpo compartilhado com a conta simples (`/merchant/catalogo/categorias`). */
export async function CategoriasBody({ supplierId, base }: { supplierId: OwnerRef; base: string }) {
  const rows = await listCategories(await getDb(), supplierId);
  return (
    <>
      <PageHeader backHref={base} title="Categorias" description="Organize o catálogo. Excluir uma categoria não apaga produtos: eles apenas ficam sem categoria." />
      <CategoriesManager rows={rows} />
    </>
  );
}
