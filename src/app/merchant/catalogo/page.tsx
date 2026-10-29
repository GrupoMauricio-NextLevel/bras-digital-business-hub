import { requireIndependent } from "@/lib/require-independent";
import { ProductsBody } from "@/app/supplier/products/page";
import { perfilAtual } from "@/lib/perfil-loja-server";

export const dynamic = "force-dynamic";

export default async function MeusProdutos({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { session, owner } = await requireIndependent();
  const commerce = (await perfilAtual(session.store!.id)).ecommerce;
  return <ProductsBody supplierId={owner} base="/merchant/catalogo" independent commerce={commerce} ver={(await searchParams).ver} />;
}
