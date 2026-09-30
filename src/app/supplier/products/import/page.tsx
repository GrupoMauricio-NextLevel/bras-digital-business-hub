import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { CSV_TEMPLATE } from "@/lib/domain/products";
import { ImportForm } from "./import-form";

export default async function ImportProductsPage() {
  await requireRole("SUPPLIER_ADMIN");
  return <ImportBody />;
}

/** Corpo compartilhado com a conta simples do lojista (`/merchant/catalogo/import`). */
export function ImportBody({ base = "/supplier/products" }: { base?: string }) {
  return (
    <>
      <PageHeader backHref={base} title="Importar produtos por planilha" description="Cadastre ou atualize vários modelos de uma vez por Excel ou CSV, com conferência antes de importar. Fotos podem ser adicionadas depois em cada produto." />
      <ImportForm template={CSV_TEMPLATE} base={base} />
    </>
  );
}
