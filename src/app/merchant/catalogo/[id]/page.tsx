import { requireIndependent } from "@/lib/require-independent";
import { isCommerceStore } from "@/lib/store-brand";
import { getDb } from "@/db/client";
import { ProductBody } from "@/app/supplier/products/[id]/page";

export const dynamic = "force-dynamic";

export default async function Produto({ params }: { params: Promise<{ id: string }> }) {
  const { session, supplierId } = await requireIndependent();
  const { id } = await params;
  const commerce = await isCommerceStore(await getDb(), session.store!);
  return <ProductBody supplierId={supplierId} id={id} base="/merchant/catalogo" independent commerce={commerce} />;
}
