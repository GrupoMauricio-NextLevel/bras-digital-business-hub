import type { Metadata } from "next";
import { StorePage } from "@/components/storefront/store-page";

export const metadata: Metadata = { title: "Carrinho", robots: { index: false, follow: false } };

export default async function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StorePage slug={slug} page="cart" />;
}
