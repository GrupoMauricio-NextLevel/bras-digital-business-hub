import { Logo } from "@/components/brand/logo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefront } from "@/lib/queries/storefront";
import { CartProvider } from "@/components/storefront/cart-context";
import { StoreHeader } from "@/components/storefront/header";
import { getSession } from "@/lib/auth";
import { readableOn } from "@/lib/utils";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const sf = await getStorefront(slug);
  return { title: sf ? { absolute: `${sf.store.name} · ${sf.store.tagline ?? "Loja oficial"}` } : "Loja", description: sf?.settings.heroSubtitle };
}

export default async function StoreLayout({ params, children }: { params: Promise<{ slug: string }>; children: React.ReactNode }) {
  const { slug } = await params;
  const sf = await getStorefront(slug);
  if (!sf) notFound();
  const session = await getSession();
  const previewing = !sf.store.publishedAt || sf.store.status !== "ACTIVE";
  if (previewing && !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6 text-center">
        <div><div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: sf.store.primaryColor }}>{sf.store.logoText}</div><h1 className="text-lg font-semibold">{sf.store.name} está temporariamente indisponível</h1><p className="mt-1 text-sm text-neutral-500">Volte em breve.</p></div>
      </div>
    );
  }
  const vars = { "--sf-primary": sf.store.primaryColor, "--sf-accent": sf.store.accentColor, "--sf-on-primary": readableOn(sf.store.primaryColor), "--sf-on-accent": readableOn(sf.store.accentColor) } as React.CSSProperties;
  return (
    <div style={vars} className="flex min-h-screen flex-col bg-white text-neutral-900">
      {previewing ? <div className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900">Pré-visualização: esta loja não está publicada. Apenas você a vê. <Link href="/merchant/storefront" className="underline">Publicar</Link></div> : null}
      {sf.settings.announcement ? <div className="px-4 py-2 text-center text-xs font-medium" style={{ background: "var(--sf-primary)", color: "var(--sf-on-primary)" }}>{sf.settings.announcement}</div> : null}
      <CartProvider storeSlug={slug}>
        <StoreHeader slug={slug} name={sf.store.name} logoText={sf.store.logoText} whatsapp={sf.store.whatsapp} />
        <main className="flex-1">{children}</main>
      </CartProvider>
      <footer className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>{sf.settings.footerText || sf.store.name}</div>
          <div className="flex gap-4 text-xs">{sf.store.instagram ? <span>@{sf.store.instagram.replace("@", "")}</span> : null}<span>Pagamento seguro</span><span>Envio para todo o Brasil</span>{sf.store.offer !== "STORE_OWN" ? <span className="flex items-center gap-1.5 text-neutral-400">Tecnologia <Logo tone="on-light" className="h-4" /></span> : null}</div>
        </div>
      </footer>
    </div>
  );
}
