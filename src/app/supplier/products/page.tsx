import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { requireAreaRole } from "@/lib/require-session";
import { getSupplierProducts } from "@/lib/queries/supplier";
import { buttonVariants } from "@/components/ui/button";
import { ProductsList, type ProductRow } from "./products-list";

export default async function SupplierProducts() {
  const session = await requireAreaRole("SUPERDROP", "SUPPLIER_ADMIN");
  const { items, categories } = await getSupplierProducts(session.supplier!.id);
  const rows: ProductRow[] = items.map((r) => ({ id: r.product.id, name: r.product.name, sku: r.product.sku, category: r.categoryName, images: r.product.images, sellsUnit: r.product.sellsUnit, sellsPack: r.product.sellsPack, distribution: r.product.distribution, costCents: r.product.costCents, suggestedPriceCents: r.product.suggestedPriceCents, status: r.product.status, available: r.available, onHand: r.onHand }));
  return (
    <>
      <PageHeader title="Produtos" description="Catálogo central. Cadastre uma vez e distribua para a rede." actions={<><Link href="/supplier/products/import" className={buttonVariants({ variant: "secondary" })}><Upload /> Importar CSV</Link><Link href="/supplier/products/new" className={buttonVariants()}><Plus /> Novo produto</Link></>} />
      <ProductsList rows={rows} categories={categories.map((c) => c.name)} />
    </>
  );
}
