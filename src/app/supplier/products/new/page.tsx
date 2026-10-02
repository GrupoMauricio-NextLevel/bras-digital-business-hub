import { PageHeader } from "@/components/app/page-header";
import { requireAreaRole } from "@/lib/require-session";
import { getSupplierStores } from "@/lib/queries/supplier";
import { getSupplierProducts } from "@/lib/queries/supplier";
import { NewProductForm } from "./new-product-form";

export default async function NewProductPage() {
  const session = await requireAreaRole("SUPERDROP", "SUPPLIER_ADMIN");
  const [stores, { categories }] = await Promise.all([getSupplierStores(session.supplier!.id), getSupplierProducts(session.supplier!.id)]);
  return (
    <>
      <PageHeader backHref="/supplier/products" title="Novo produto" description="Cadastre uma vez: a rede inteira (ou lojas selecionadas) passa a poder vender, todas usando este estoque central." />
      <NewProductForm stores={stores.map((s) => ({ id: s.store.id, name: s.store.name }))} categories={categories.map((c) => c.name)} />
    </>
  );
}
