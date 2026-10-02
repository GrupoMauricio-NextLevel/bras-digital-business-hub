import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { organizations } from "@/db/schema";
import { brandByCode } from "@/lib/brand";
import { getDb } from "@/db/client";
import { getStorefront, getStorefrontCatalog, toPublicProduct } from "@/lib/queries/storefront";
import { isPreviewMode } from "@/lib/themes/preview";
import { THEME_BY_KEY } from "@/lib/themes/catalog";
import { resolveGlobals } from "@/lib/themes/store";
import { tryingTheme } from "@/lib/themes/try";
import { fontStack } from "@/lib/ds/fonts";
import { SectionList } from "@/components/storefront/sections";
import { PreviewBridge } from "@/components/storefront/preview-bridge";
import { exitThemePreviewAction, exitTryThemeAction } from "@/app/actions/theme";
import { CartProvider } from "@/components/storefront/cart-context";
import { getSession } from "@/lib/auth";
import { readableOn } from "@/lib/utils";
import Link from "next/link";
import { NextLevelSignature } from "@/components/brand/nextlevel-signature";
import { isBlocked } from "@/lib/domain/store-access";
import { currentCampaign, isSafeLink } from "@/lib/domain/campaigns";
import { ldJson, shortDescription, storeOrigin } from "@/lib/storefront-seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const sf = await getStorefront(slug);
  if (!sf) return { title: "Loja" };
  if (sf.store.showcaseTheme) return { title: { default: `Demonstração do tema ${THEME_BY_KEY[sf.store.showcaseTheme]?.name ?? ""}`.trim(), template: "%s · Demonstração" }, robots: { index: false, follow: false } };
  const origin = await storeOrigin(sf.store);
  const description = shortDescription(sf.settings.heroSubtitle || sf.store.tagline, `Loja virtual ${sf.store.name}.`);
  // Páginas internas definem "title" próprio e herdam o nome da loja pelo modelo.
  return { title: { default: `${sf.store.name} · ${sf.store.tagline ?? "Loja oficial"}`, template: `%s · ${sf.store.name}` }, description, alternates: { canonical: origin }, openGraph: { siteName: sf.store.name, locale: "pt_BR", type: "website", url: origin } };
}

export default async function StoreLayout({ params, children }: { params: Promise<{ slug: string }>; children: React.ReactNode }) {
  const { slug } = await params;
  const sf = await getStorefront(slug);
  if (!sf) notFound();
  const session = await getSession();
  const showcase = sf.store.showcaseTheme ? THEME_BY_KEY[sf.store.showcaseTheme] ?? null : null;
  const previewing = !showcase && (!sf.store.publishedAt || sf.store.status !== "ACTIVE" || isBlocked(sf.store));
  if (previewing && !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6 text-center">
        <div><div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: sf.store.primaryColor }}>{sf.store.logoText}</div><h1 className="text-lg font-semibold">{sf.store.name} está temporariamente indisponível</h1><p className="mt-1 text-sm text-neutral-500">Volte em breve.</p></div>
      </div>
    );
  }
  const preview = await isPreviewMode(sf.store.id);
  const db = await getDb();
  // A frase legal do rodapé cita a marca pela qual a loja entrou (SuperDrop, NextLevel Commerce…).
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, sf.store.organizationId) });
  const productName = brandByCode(org?.brand).name;
  const trial = await tryingTheme(db, sf.store);
  const globals = trial ? trial.preset.globals : (await resolveGlobals(db, sf.store, { draft: preview })).globals;
  const st = globals.style;
  const vars = { "--sf-primary": st.primary, "--sf-accent": st.accent, "--sf-on-primary": readableOn(st.primary), "--sf-on-accent": readableOn(st.accent), "--sf-radius": `${st.radius}px`, "--sf-font-heading": fontStack(st.headingFont), "--sf-font-body": fontStack(st.bodyFont) } as React.CSSProperties;
  const campaign = await currentCampaign(db, sf.store.id);
  const origin = await storeOrigin(sf.store);
  const orgLd = [
    { "@context": "https://schema.org", "@type": "Organization", name: sf.store.name, url: origin, ...(sf.store.logoUrl ? { logo: sf.store.logoUrl.startsWith("/") ? `${origin.replace(/\/store\/.*$/, "")}${sf.store.logoUrl}` : sf.store.logoUrl } : {}), ...(sf.store.instagram ? { sameAs: [`https://instagram.com/${sf.store.instagram.replace(/^@/, "")}`] } : {}) },
    { "@context": "https://schema.org", "@type": "WebSite", name: sf.store.name, url: origin, potentialAction: { "@type": "SearchAction", target: `${origin}/catalog?q={search_term_string}`, "query-input": "required name=search_term_string" } },
  ];
  const catName = new Map(sf.categories.map((c) => [c.id, c.name]));
  const products = (await getStorefrontCatalog(sf.store.id)).map((c) => toPublicProduct(c, c.product.categoryId ? catName.get(c.product.categoryId) : undefined));
  const ctx = { slug, base: `/store/${slug}`, store: sf.store, categories: sf.categories, products, planned: {}, hero: undefined, globals, page: "home" as const };
  return (
    <div style={vars} data-buttons={st.buttons} className="sf-root flex min-h-screen flex-col bg-white text-neutral-900">
      {showcase ? <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-neutral-900 px-4 py-2 text-center text-xs text-white" data-showcase-banner><span>Loja de demonstração do tema <b>{showcase.name}</b> · produtos de exemplo, nada aqui é vendido.</span><a href={`/temas/${showcase.key}`} target="_top" className="rounded bg-white px-2.5 py-1 font-semibold text-neutral-900">{showcase.released === false ? "Ver detalhes do tema" : "Quero este tema"}</a></div> : null}
      {previewing ? <div className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900">Pré-visualização: esta loja não está publicada. Apenas você a vê. <Link href="/merchant/storefront" className="underline">Publicar</Link></div> : null}
      {preview ? <div className="bg-indigo-100 px-4 py-1.5 text-center text-xs text-indigo-900" data-preview-banner>Prévia do rascunho: o público ainda vê a versão publicada. <form action={exitThemePreviewAction} className="inline"><button className="underline">Sair da prévia</button></form></div> : null}
      {trial ? <div className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900" data-try-banner>Testando o tema <b>{trial.name}</b> com os seus produtos. Nada foi instalado. <form action={exitTryThemeAction} className="inline"><button className="underline">Sair do teste</button></form></div> : null}
      {campaign ? (
        <div className="px-4 py-2 text-center text-sm font-medium" style={{ background: "var(--sf-accent)", color: "var(--sf-on-accent)" }} data-campaign>
          {campaign.linkUrl && isSafeLink(campaign.linkUrl) ? <Link href={campaign.linkUrl} className="underline-offset-2 hover:underline">{campaign.text}</Link> : campaign.text}
        </div>
      ) : null}
      {!previewing && !showcase ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(orgLd) }} /> : null}
      {preview ? <PreviewBridge /> : null}
      <CartProvider storeSlug={slug}>
        <SectionList template={globals.header} ctx={ctx} region="header" />
        <main className="flex-1">{children}</main>
      </CartProvider>
      <SectionList template={globals.footer} ctx={ctx} region="footer" />
      {/* Assinatura fixa da NextLevel em todas as lojas geradas pelo sistema (não é editável). */}
      <div className="border-t border-neutral-200 bg-neutral-50 py-4 text-neutral-500" data-nextlevel-footer>
        <div className="mx-auto flex max-w-6xl justify-center px-4"><NextLevelSignature compact product={productName} className="justify-center text-center" /></div>
      </div>
    </div>
  );
}
