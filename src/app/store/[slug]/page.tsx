import { StorePage } from "@/components/storefront/store-page";

export default async function StoreHome({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ theme?: string }> }) {
  const { slug } = await params;
  const { theme } = await searchParams;
  return <StorePage slug={slug} page="home" themeParam={theme} />;
}
