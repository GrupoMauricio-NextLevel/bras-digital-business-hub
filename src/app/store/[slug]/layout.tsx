import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { getStorefront } from "@/lib/queries/storefront";
import { isPreviewMode } from "@/lib/themes/preview";
import { resolveGlobals } from "@/lib/themes/store";
import { fontStack } from "@/lib/ds/fonts";
import { SectionList } from "@/components/storefront/sections";
import { PreviewBridge } from "@/components/storefront/preview-bridge";
import { exitThemePreviewAction } from "@/app/actions/theme";
import { CartProvider } from "@/components/storefront/cart-context";
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
  const preview = await isPreviewMode(sf.store.id);
  const { globals } = await resolveGlobals(await getDb(), sf.store, { draft: preview });
  const st = globals.style;
  const vars = { "--sf-primary": st.primary, "--sf-accent": st.accent, "--sf-on-primary": readableOn(st.primary), "--sf-on-accent": readableOn(st.accent), "--sf-radius": `${st.radius}px`, "--sf-font-heading": fontStack(st.headingFont), "--sf-font-body": fontStack(st.bodyFont) } as React.CSSProperties;
  const ctx = { slug, base: `/store/${slug}`, store: sf.store, categories: sf.categories, products: [], planned: {}, hero: undefined, globals, page: "home" as const };
  return (
    <div style={vars} data-buttons={st.buttons} className="sf-root flex min-h-screen flex-col bg-white text-neutral-900">
      {previewing ? <div className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900">Pré-visualização: esta loja não está publicada. Apenas você a vê. <Link href="/merchant/storefront" className="underline">Publicar</Link></div> : null}
      {preview ? <div className="bg-indigo-100 px-4 py-1.5 text-center text-xs text-indigo-900" data-preview-banner>Prévia do rascunho: o público ainda vê a versão publicada. <form action={exitThemePreviewAction} className="inline"><button className="underline">Sair da prévia</button></form></div> : null}
      {preview ? <PreviewBridge /> : null}
      <CartProvider storeSlug={slug}>
        <SectionList template={globals.header} ctx={ctx} />
        <main className="flex-1">{children}</main>
      </CartProvider>
      <SectionList template={globals.footer} ctx={ctx} />
    </div>
  );
}
