import { requireIndependent } from "@/lib/require-independent";
import { isCommerceStore } from "@/lib/store-brand";
import { getDb } from "@/db/client";
import { NewProductBody } from "@/app/supplier/products/new/page";

export const dynamic = "force-dynamic";

export default async function NovoProduto() {
  const { session, supplierId } = await requireIndependent();
  const commerce = await isCommerceStore(await getDb(), session.store!);
  return <NewProductBody supplierId={supplierId} base="/merchant/catalogo" independent commerce={commerce} />;
}
