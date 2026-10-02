import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefront } from "@/lib/queries/storefront";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false, follow: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sf = await getStorefront(slug);
  if (!sf) notFound();
  if (sf.store.showcaseTheme) return <div className="mx-auto max-w-lg px-4 py-16 text-center"><h1 className="text-2xl font-semibold">Esta é uma loja de demonstração</h1><p className="mt-3 text-neutral-600">Os produtos são de exemplo e não existe compra aqui. Gostou do visual? Veja os detalhes do tema.</p><a href={`/temas/${sf.store.showcaseTheme}`} target="_top" className="mt-6 inline-flex h-11 items-center rounded-lg bg-neutral-900 px-5 font-semibold text-white">Ver o tema</a></div>;
  return <CheckoutForm slug={slug} storeName={sf.store.name} minOrderCents={sf.store.minOrderCents} />;
}
