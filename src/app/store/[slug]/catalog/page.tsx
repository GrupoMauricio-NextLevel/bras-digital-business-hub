import { StorePage } from "@/components/storefront/store-page";

export default async function CatalogPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ category?: string; q?: string; sort?: string }> }) {
  const { slug } = await params;
  const query = await searchParams;
  return <StorePage slug={slug} page="collection" query={{ category: query.category, q: query.q, sort: query.sort }} />;
}
