import { eq } from "drizzle-orm";
import { toOwner, type OwnerRef } from "@/lib/domain/independent";
import { stores as storesTable } from "@/db/schema";
import { storeUrl } from "@/lib/store-url";
import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getSupplierStores } from "@/lib/queries/supplier";
import { getSupplierProducts } from "@/lib/queries/supplier";
import { getDb } from "@/db/client";
import { getMinActivationStock } from "@/lib/domain/catalog";
import { NewProductForm } from "./new-product-form";

export default async function NewProductPage() {
  const session = await requireRole("SUPPLIER_ADMIN");
  return <NewProductBody supplierId={session.supplier!.id} />;
}

/** Corpo compartilhado com a conta simples do lojista (`/merchant/catalogo/new`). */
export async function NewProductBody({ supplierId, base = "/supplier/products", independent = false, commerce = false }: { supplierId: OwnerRef; base?: string; independent?: boolean; commerce?: boolean }) {
  const [stores, { categories }] = await Promise.all([typeof supplierId !== "string" && !supplierId.supplierId ? Promise.resolve([]) : getSupplierStores(typeof supplierId === "string" ? supplierId : supplierId.supplierId!), getSupplierProducts(supplierId)]);
  const own = toOwner(supplierId);
  const loja = own.storeId ? await (await getDb()).query.stores.findFirst({ where: eq(storesTable.id, own.storeId) }) : null;
  const hostDaLoja = loja ? storeUrl(loja.slug, loja.offer, loja.customDomain, loja.domainStatus).replace(/^https?:\/\//, "").replace(/^\//, "") : "loja-da-rede.com.br";
  return (
    <>
      <PageHeader backHref={base} title="Novo produto" description={independent ? "Cadastre o produto com foto, preço e estoque. Depois é só publicar na sua loja." : "Cadastre uma vez: a rede inteira (ou lojas selecionadas) passa a poder vender, todas usando este estoque central."} />
      <NewProductForm base={base} minStock={independent ? 0 : await getMinActivationStock(await getDb(), supplierId)} stores={stores.map((s) => ({ id: s.store.id, name: s.store.name }))} categories={categories.map((c) => c.name)} independent={independent} commerce={commerce} hostDaLoja={hostDaLoja} />
    </>
  );
}
