import { requireIndependent } from "@/lib/require-independent";
import { NewProductBody } from "@/app/supplier/products/new/page";

export const dynamic = "force-dynamic";

export default async function NovoProduto() {
  const { supplierId } = await requireIndependent();
  return <NewProductBody supplierId={supplierId} base="/merchant/catalogo" independent />;
}
