import { PageHeader } from "@/components/app/page-header";
import { requireAreaRole } from "@/lib/require-session";
import { requireStoreId } from "@/lib/domain/access";
import { getMerchantProducts } from "@/lib/queries/merchant";
import { MerchantProductList } from "./product-list";

export default async function MerchantProductsPage() {
  const session = await requireAreaRole("SUPERDROP", "MERCHANT_OWNER");
  const storeId = requireStoreId(session.actor);
  const catalog = await getMerchantProducts(storeId);
  const items = catalog.map((c) => ({
    productId: c.product.id, name: c.product.name, sku: c.product.sku, images: c.product.images, description: c.product.description,
    costCents: c.product.costCents, suggestedPriceCents: c.product.suggestedPriceCents, minimumPriceCents: c.product.minimumPriceCents,
    sellsPack: c.product.sellsPack, packSuggested: c.packs[0]?.suggestedPriceCents ?? null, packMinimum: c.packs[0]?.minimumPriceCents ?? null,
    active: c.storeProduct.active, priceCents: c.storeProduct.priceCents, packPriceCents: c.storeProduct.packPriceCents,
    available: c.variants.reduce((s, v) => s + v.level.available, 0), sizes: c.variants.map((v) => `${v.size}:${v.level.available}`).join(" "),
  }));
  return (
    <>
      <PageHeader title="Produtos" description="Catálogo da Central disponível para sua loja. Defina seu preço (acima do mínimo) e ative para vender. O estoque é central." />
      <MerchantProductList items={items} />
    </>
  );
}
