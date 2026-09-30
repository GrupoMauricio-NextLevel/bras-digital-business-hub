import { StorePage } from "@/components/storefront/store-page";

export default async function ProductPage({ params }: { params: Promise<{ slug: string; productSlug: string }> }) {
  const { slug, productSlug } = await params;
  return <StorePage slug={slug} page="product" productSlug={productSlug} />;
}
