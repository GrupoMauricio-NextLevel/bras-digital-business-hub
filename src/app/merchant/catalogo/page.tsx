import { requireIndependent } from "@/lib/require-independent";
import { isCommerceStore } from "@/lib/store-brand";
import { getDb } from "@/db/client";
import { ProductsBody } from "@/app/supplier/products/page";

export const dynamic = "force-dynamic";

export default async function MeusProdutos() {
  const { session, supplierId } = await requireIndependent();
  const commerce = await isCommerceStore(await getDb(), session.store!);
  return <ProductsBody supplierId={supplierId} base="/merchant/catalogo" independent commerce={commerce} />;
}
