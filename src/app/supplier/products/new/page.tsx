import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getSupplierStores } from "@/lib/queries/supplier";
import { getSupplierProducts } from "@/lib/queries/supplier";
import { getDb } from "@/db/client";
import { getMinActivationStock } from "@/lib/domain/catalog";
import { NewProductForm } from "./new-product-form";

export default async function NewProductPage() {
  const session = await requireRole("SUPPLIER_ADMIN");
  return <NewProductBody supplierId={session.supplier!.id} />;
}

/** Corpo compartilhado com a conta simples do lojista (`/merchant/catalogo/new`). */
export async function NewProductBody({ supplierId, base = "/supplier/products", independent = false, commerce = false }: { supplierId: string; base?: string; independent?: boolean; commerce?: boolean }) {
  const [stores, { categories }] = await Promise.all([independent ? Promise.resolve([]) : getSupplierStores(supplierId), getSupplierProducts(supplierId)]);
  return (
    <>
      <PageHeader backHref={base} title="Novo produto" description={independent ? "Cadastre o produto com foto, preço e estoque. Depois é só publicar na sua loja." : "Cadastre uma vez: a rede inteira (ou lojas selecionadas) passa a poder vender, todas usando este estoque central."} />
      <NewProductForm base={base} minStock={independent ? 0 : await getMinActivationStock(await getDb(), supplierId)} stores={stores.map((s) => ({ id: s.store.id, name: s.store.name }))} categories={categories.map((c) => c.name)} independent={independent} commerce={commerce} />
    </>
  );
}
