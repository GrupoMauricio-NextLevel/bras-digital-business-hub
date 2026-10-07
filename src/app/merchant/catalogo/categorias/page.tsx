import { requireIndependent } from "@/lib/require-independent";
import { CategoriasBody } from "@/app/supplier/products/categorias/page";

export const dynamic = "force-dynamic";

export default async function Categorias() {
  const { owner } = await requireIndependent();
  return <CategoriasBody supplierId={owner} base="/merchant/catalogo" />;
}
