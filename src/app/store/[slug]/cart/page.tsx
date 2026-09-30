import { StorePage } from "@/components/storefront/store-page";

export default async function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StorePage slug={slug} page="cart" />;
}
