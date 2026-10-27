import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefront } from "@/lib/queries/storefront";
import { CheckoutForm } from "./checkout-form";
import { DemoCheckout } from "./demo-checkout";
import { THEME_BY_KEY } from "@/lib/themes/catalog";
import { getDb } from "@/db/client";
import { lojaAceitaCartao } from "@/lib/pagamento-loja";
import { brandCodeOfStore } from "@/lib/store-brand";
import { storeModality } from "@/lib/domain/order-policy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false, follow: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sf = await getStorefront(slug);
  if (!sf) notFound();
  // Loja de demonstração: fechamento simulado só no navegador (o servidor continua recusando pedido: createOrder → SHOWCASE_STORE).
  if (sf.store.showcaseTheme) return <DemoCheckout slug={slug} themeKey={sf.store.showcaseTheme} themeName={THEME_BY_KEY[sf.store.showcaseTheme]?.name ?? "do tema"} />;
  const db = await getDb();
  const aceitaCartao = lojaAceitaCartao(await brandCodeOfStore(db, sf.store));
  // Carrinho abandonado (D186): o pedido de lembrete só aparece na loja independente da E-commerce.
  const lembrete = (await storeModality(db, sf.store.id)) === "INDEPENDENT";
  return <CheckoutForm slug={slug} storeName={sf.store.name} minOrderCents={sf.store.minOrderCents} aceitaCartao={aceitaCartao} lembrete={lembrete} />;
}
