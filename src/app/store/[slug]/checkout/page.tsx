import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefront } from "@/lib/queries/storefront";
import { CheckoutForm } from "./checkout-form";
import { DemoCheckout } from "./demo-checkout";
import { THEME_BY_KEY } from "@/lib/themes/catalog";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false, follow: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sf = await getStorefront(slug);
  if (!sf) notFound();
  // Loja de demonstração: fechamento simulado só no navegador (o servidor continua recusando pedido: createOrder → SHOWCASE_STORE).
  if (sf.store.showcaseTheme) return <DemoCheckout slug={slug} themeKey={sf.store.showcaseTheme} themeName={THEME_BY_KEY[sf.store.showcaseTheme]?.name ?? "do tema"} />;
  return <CheckoutForm slug={slug} storeName={sf.store.name} minOrderCents={sf.store.minOrderCents} />;
}
