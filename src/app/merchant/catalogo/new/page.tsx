import { requireIndependent } from "@/lib/require-independent";
import { isCommerceStore } from "@/lib/store-brand";
import { getDb } from "@/db/client";
import { NewProductBody } from "@/app/supplier/products/new/page";

export const dynamic = "force-dynamic";

export default async function NovoProduto() {
  const { session, owner } = await requireIndependent();
  const commerce = await isCommerceStore(await getDb(), session.store!);
  return <NewProductBody supplierId={owner} base="/merchant/catalogo" independent commerce={commerce} />;
}
