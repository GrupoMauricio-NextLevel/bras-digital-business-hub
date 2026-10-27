import { requireIndependent } from "@/lib/require-independent";
import { ProductBody } from "@/app/supplier/products/[id]/page";
import { perfilAtual } from "@/lib/perfil-loja-server";
import { getDb } from "@/db/client";
import { listStoreCatalog } from "@/lib/domain/catalog";
import { VendaJuntoForm } from "@/components/catalogo/venda-junto-form";

export const dynamic = "force-dynamic";

export default async function Produto({ params }: { params: Promise<{ id: string }> }) {
  const { session, owner } = await requireIndependent();
  const { id } = await params;
  const commerce = (await perfilAtual(session.store!.id)).ecommerce;
  // "Compre junto" e prazo de produção (D186): só da loja independente, fora do editor compartilhado com o fornecedor.
  const cat = await listStoreCatalog(await getDb(), session.store!.id, { onlyActive: false });
  const este = cat.find((c) => c.product.id === id);
  return (
    <>
      <ProductBody supplierId={owner} id={id} base="/merchant/catalogo" independent commerce={commerce} />
      {este ? <VendaJuntoForm productId={id} opcoes={cat.filter((c) => c.product.id !== id).map((c) => ({ id: c.product.id, name: c.product.name }))} escolhidos={este.storeProduct.relatedIds} dias={este.storeProduct.productionDays} /> : null}
    </>
  );
}
