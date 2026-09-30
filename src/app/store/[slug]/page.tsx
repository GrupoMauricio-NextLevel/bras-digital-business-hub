import { StorePage } from "@/components/storefront/store-page";

export default async function StoreHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StorePage slug={slug} page="home" />;
}
