import { requireIndependent } from "@/lib/require-independent";
import { ProductBody } from "@/app/supplier/products/[id]/page";

export const dynamic = "force-dynamic";

export default async function Produto({ params }: { params: Promise<{ id: string }> }) {
  const { supplierId } = await requireIndependent();
  const { id } = await params;
  return <ProductBody supplierId={supplierId} id={id} base="/merchant/catalogo" independent />;
}
