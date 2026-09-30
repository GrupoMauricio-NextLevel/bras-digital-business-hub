import type { Metadata } from "next";
import { StorePage } from "@/components/storefront/store-page";
import { getStorefront, getStorefrontCatalog, toPublicProduct } from "@/lib/queries/storefront";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; productSlug: string }> }): Promise<Metadata> {
  const { slug, productSlug } = await params;
  const sf = await getStorefront(slug);
  if (!sf) return {};
  const item = (await getStorefrontCatalog(sf.store.id)).find((i) => i.product.slug === productSlug);
  if (!item) return {};
  const p = toPublicProduct(item);
  return { title: { absolute: `${p.seoTitle || p.name} · ${sf.store.name}` }, description: p.seoDescription || p.description.slice(0, 160) };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string; productSlug: string }> }) {
  const { slug, productSlug } = await params;
  return <StorePage slug={slug} page="product" productSlug={productSlug} />;
}
