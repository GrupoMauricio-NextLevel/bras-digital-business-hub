import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getMerchantProducts } from "@/lib/queries/merchant";
import { isIndependentStore } from "@/lib/domain/order-policy";
import { getDb } from "@/db/client";
import { NewOrderForm } from "./new-order-form";

export default async function NewOrderPage() {
  const session = await requireRole("STORE_OWNER");
  const catalog = (await getMerchantProducts(session.store!.id)).filter((c) => c.storeProduct.active);
  const items = catalog.map((c) => ({
    productId: c.product.id,
    name: c.product.name,
    images: c.product.images,
    priceCents: c.storeProduct.priceCents,
    packPriceCents: c.storeProduct.packPriceCents,
    sellsUnit: c.product.sellsUnit,
    sellsPack: c.product.sellsPack,
    variants: c.variants.map((v) => ({ id: v.id, size: v.size, available: v.level.available })),
    packs: c.packs.map((p) => ({ id: p.id, name: p.name, available: p.available, priceCents: c.storeProduct.packPriceCents ?? p.suggestedPriceCents })),
  }));
  const independent = await isIndependentStore(await getDb(), session.store!.id);
  return (
    <>
      <PageHeader backHref="/merchant/orders" title="Novo pedido" description={independent ? "Venda manual: WhatsApp, Instagram ou balcão. O estoque é reservado no momento da criação." : "Venda manual: WhatsApp, Instagram ou balcão. O estoque é reservado na Central no momento da criação."} />
      <NewOrderForm items={items} independent={independent} />
    </>
  );
}
