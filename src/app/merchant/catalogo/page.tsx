import { requireIndependent } from "@/lib/require-independent";
import { ProductsBody } from "@/app/supplier/products/page";

export const dynamic = "force-dynamic";

export default async function MeusProdutos() {
  const { supplierId } = await requireIndependent();
  return <ProductsBody supplierId={supplierId} base="/merchant/catalogo" independent />;
}
