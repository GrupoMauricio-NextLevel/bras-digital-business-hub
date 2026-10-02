import { requireIndependent } from "@/lib/require-independent";
import { CategoriasBody } from "@/app/supplier/products/categorias/page";

export const dynamic = "force-dynamic";

export default async function Categorias() {
  const { supplierId } = await requireIndependent();
  return <CategoriasBody supplierId={supplierId} base="/merchant/catalogo" />;
}
