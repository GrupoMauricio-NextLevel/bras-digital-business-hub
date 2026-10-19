import { requireIndependent } from "@/lib/require-independent";
import { ProductBody } from "@/app/supplier/products/[id]/page";
import { perfilAtual } from "@/lib/perfil-loja-server";

export const dynamic = "force-dynamic";

export default async function Produto({ params }: { params: Promise<{ id: string }> }) {
  const { session, owner } = await requireIndependent();
  const { id } = await params;
  const commerce = (await perfilAtual(session.store!.id)).ecommerce;
  return <ProductBody supplierId={owner} id={id} base="/merchant/catalogo" independent commerce={commerce} />;
}
