import { requireIndependent } from "@/lib/require-independent";
import { ProductsBody } from "@/app/supplier/products/page";
import { perfilAtual } from "@/lib/perfil-loja-server";
import { UsoDoPlano } from "@/components/app/uso-do-plano";

export const dynamic = "force-dynamic";

export default async function MeusProdutos({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { session, owner } = await requireIndependent();
  const commerce = (await perfilAtual(session.store!.id)).ecommerce;
  return <>{commerce ? <UsoDoPlano storeId={session.store!.id} recurso="produtos" /> : null}<ProductsBody supplierId={owner} base="/merchant/catalogo" independent commerce={commerce} ver={(await searchParams).ver} /></>;
}
