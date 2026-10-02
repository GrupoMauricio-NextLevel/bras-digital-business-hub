import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getSupplierProducts } from "@/lib/queries/supplier";
import { buttonVariants } from "@/components/ui/button";
import { ProductsList, type ProductRow } from "./products-list";

export default async function SupplierProducts() {
  const session = await requireRole("SUPPLIER_ADMIN");
  return <ProductsBody supplierId={session.supplier!.id} />;
}

/** Corpo compartilhado com a conta simples do lojista (`/merchant/catalogo`). */
export async function ProductsBody({ supplierId, base = "/supplier/products", independent = false }: { supplierId: string; base?: string; independent?: boolean }) {
  const { items, categories } = await getSupplierProducts(supplierId);
  const rows: ProductRow[] = items.map((r) => ({ id: r.product.id, name: r.product.name, sku: r.product.sku, category: r.categoryName, images: r.product.images, sellsUnit: r.product.sellsUnit, sellsPack: r.product.sellsPack, distribution: r.product.distribution, costCents: r.product.costCents, suggestedPriceCents: r.product.suggestedPriceCents, status: r.product.status, available: r.available, onHand: r.onHand }));
  return (
    <>
      <PageHeader title={independent ? "Meus produtos" : "Produtos"} description={independent ? "Cadastre o que você vende, com fotos, preço e estoque." : "Catálogo central. Cadastre uma vez e distribua para a rede."} actions={<><Link href={`${base}/categorias`} className={buttonVariants({ variant: "ghost" })}>Categorias</Link><Link href={`${base}/import`} className={buttonVariants({ variant: "secondary" })}><Upload /> Importar planilha</Link><Link href={`${base}/new`} className={buttonVariants()}><Plus /> Novo produto</Link></>} />
      <ProductsList rows={rows} categories={categories.map((c) => c.name)} base={base} />
    </>
  );
}
