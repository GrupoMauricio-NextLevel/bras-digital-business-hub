import { requireIndependent } from "@/lib/require-independent";
import { NewProductBody } from "@/app/supplier/products/new/page";
import { perfilAtual } from "@/lib/perfil-loja-server";

export const dynamic = "force-dynamic";

export default async function NovoProduto() {
  const { session, owner } = await requireIndependent();
  const commerce = (await perfilAtual(session.store!.id)).ecommerce;
  return <NewProductBody supplierId={owner} base="/merchant/catalogo" independent commerce={commerce} />;
}
