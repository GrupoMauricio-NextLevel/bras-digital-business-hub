import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getSupplierStores } from "@/lib/queries/supplier";
import { getSupplierProducts } from "@/lib/queries/supplier";
import { getDb } from "@/db/client";
import { getMinActivationStock } from "@/lib/domain/catalog";
import { NewProductForm } from "./new-product-form";

export default async function NewProductPage() {
  const session = await requireRole("SUPPLIER_ADMIN");
  const [stores, { categories }] = await Promise.all([getSupplierStores(session.supplier!.id), getSupplierProducts(session.supplier!.id)]);
  return (
    <>
      <PageHeader backHref="/supplier/products" title="Novo produto" description="Cadastre uma vez: a rede inteira (ou lojas selecionadas) passa a poder vender, todas usando este estoque central." />
      <NewProductForm minStock={await getMinActivationStock(await getDb(), session.supplier!.id)} stores={stores.map((s) => ({ id: s.store.id, name: s.store.name }))} categories={categories.map((c) => c.name)} />
    </>
  );
}
