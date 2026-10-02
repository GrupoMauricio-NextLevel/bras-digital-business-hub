import { PageHeader } from "@/components/app/page-header";
import { requireAreaRole } from "@/lib/require-session";
import { CSV_TEMPLATE } from "@/lib/domain/products";
import { ImportForm } from "./import-form";

export default async function ImportProductsPage() {
  await requireAreaRole("SUPERDROP", "SUPPLIER_ADMIN");
  return (
    <>
      <PageHeader backHref="/supplier/products" title="Importar produtos por planilha" description="Cadastre vários modelos de uma vez. Fotos podem ser adicionadas depois em cada produto." />
      <ImportForm template={CSV_TEMPLATE} />
    </>
  );
}
