import { requireIndependent } from "@/lib/require-independent";
import { ImportBody } from "@/app/supplier/products/import/page";

export const dynamic = "force-dynamic";

export default async function ImportarProdutos() {
  await requireIndependent();
  return <ImportBody base="/merchant/catalogo" />;
}
