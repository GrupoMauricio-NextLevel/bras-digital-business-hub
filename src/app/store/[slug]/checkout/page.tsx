import { notFound } from "next/navigation";
import { getStorefront } from "@/lib/queries/storefront";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sf = await getStorefront(slug);
  if (!sf) notFound();
  return <CheckoutForm slug={slug} storeName={sf.store.name} />;
}
