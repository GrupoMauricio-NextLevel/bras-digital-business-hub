import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { organizations } from "@/db/schema";
import { brandByCode, brandOfHostStrict } from "@/lib/brand";
import { storeOwnerBase } from "@/lib/host-routing";
import { getDb } from "@/db/client";
import { getStorefront, getStorefrontCatalog, getStorefrontGlobals, toPublicProduct } from "@/lib/queries/storefront";
import { isPreviewMode } from "@/lib/themes/preview";
import { THEME_BY_KEY } from "@/lib/themes/catalog";
import { tryingTheme } from "@/lib/themes/try";
import { fontStack } from "@/lib/ds/fonts";
import { SectionList } from "@/components/storefront/sections";
import { PreviewBridge } from "@/components/storefront/preview-bridge";
import { exitThemePreviewAction, exitTryThemeAction } from "@/app/actions/theme";
import { CartProvider, type AtacadoDaLoja } from "@/components/storefront/cart-context";
import { regrasDeAtacado } from "@/lib/domain/atacado";
import { ContadorDeVisitas } from "@/components/storefront/contador-de-visitas";
import { PixelMeta } from "@/components/storefront/pixel-meta";
import { ListaDeEspera } from "@/components/storefront/lista-de-espera";
import { IntegracoesNaLoja } from "@/components/storefront/integracoes-loja";
import { Maioridade } from "@/components/storefront/maioridade";
import { ChatDaLoja } from "@/components/storefront/chat-da-loja";
import { BarraDeNavegacao, EntradaDaLoja } from "@/components/transicao-de-pagina";
import { getSession } from "@/lib/auth";
import { readableOn } from "@/lib/utils";
import Link from "next/link";
import { NextLevelSignature } from "@/components/brand/nextlevel-signature";
import { isBlocked } from "@/lib/domain/store-access";
import { currentCampaign, isSafeLink } from "@/lib/domain/campaigns";
import { kitBlackDaLoja } from "@/lib/domain/kit-black-loja";
import { FaixaBlackLoja } from "@/components/storefront/faixa-black-loja";
import { ldJson, shortDescription, storeOrigin } from "@/lib/storefront-seo";
import { socialImage } from "@/lib/themes/pacotes";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const sf = await getStorefront(slug);
  if (!sf) return { title: "Loja" };
  if (sf.store.showcaseTheme) {
    // Demonstração: imagem de compartilhamento do pacote visual da loja, quando existe (continua fora dos buscadores).
    const info = THEME_BY_KEY[sf.store.showcaseTheme]; const og = info ? socialImage(info.family) : null;
    return { title: { default: `Demonstração do tema ${info?.name ?? ""}`.trim(), template: "%s · Demonstração" }, robots: { index: false, follow: false }, ...(og ? { openGraph: { siteName: sf.store.name, locale: "pt_BR", type: "website", images: [{ url: og.url, width: og.width, height: og.height, alt: sf.store.name }] } } : {}) };
  }
  const origin = await storeOrigin(sf.store);
  const description = shortDescription(sf.settings.heroSubtitle || sf.store.tagline, `Loja virtual ${sf.store.name}.`);
  // Páginas internas definem "title" próprio e herdam o nome da loja pelo modelo.
  // Integrações (D189): verificação do Search Console (só o código, nunca HTML colado) e o manifesto da loja instalável.
  const integ = sf.store.integrations ?? {};
  return {
    title: { default: `${sf.store.name} · ${sf.store.tagline ?? "Loja oficial"}`, template: `%s · ${sf.store.name}` }, description, alternates: { canonical: origin }, openGraph: { siteName: sf.store.name, locale: "pt_BR", type: "website", url: origin },
    ...(integ.googleVerificacao ? { verification: { google: integ.googleVerificacao } } : {}),
    ...(integ.pwa ? { manifest: `/store/${slug}/manifest.webmanifest`, appleWebApp: { capable: true, title: sf.store.name } } : {}),
  };
}

export default async function StoreLayout({ params, children }: { params: Promise<{ slug: string }>; children: React.ReactNode }) {
  const { slug } = await params;
  const sf = await getStorefront(slug);
  if (!sf) notFound();
  const db = await getDb();
  // A frase legal do rodapé cita a marca pela qual a loja entrou (SuperDrop, NextLevel E-commerce…).
  const [org, session] = await Promise.all([db.query.organizations.findFirst({ where: eq(organizations.id, sf.store.organizationId) }), getSession()]);
  // Loja do SuperDrop aberta no endereço da Commerce (ou o contrário): vai para o endereço da marca dona, mesmo caminho (D149).
  const h = await headers();
  const path = h.get("x-nl-path");
  const owner = path ? storeOwnerBase(brandOfHostStrict(h.get("x-forwarded-host") ?? h.get("host"))?.code, org?.brand ?? "SUPERDROP", !!sf.store.showcaseTheme) : null;
  if (owner) redirect(`${owner}${path}${h.get("x-nl-search") ?? ""}`);
  const showcase = sf.store.showcaseTheme ? THEME_BY_KEY[sf.store.showcaseTheme] ?? null : null;
  const previewing = !showcase && (!sf.store.publishedAt || sf.store.status !== "ACTIVE" || isBlocked(sf.store));
  if (previewing && !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6 text-center">
        <div><div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: sf.store.primaryColor }}>{sf.store.logoText}</div><h1 className="text-lg font-semibold">{sf.store.name} está temporariamente indisponível</h1><p className="mt-1 text-sm text-neutral-500">Volte em breve.</p></div>
      </div>
    );
  }
  // L5 (D246): as leituras independentes saem juntas (cada uma é uma ida ao banco; em sequência somavam ~200 ms em produção).
  const [preview, trial, campaign, kitBlack, origin, catalogo, regrasMix] = await Promise.all([
    isPreviewMode(sf.store.id), tryingTheme(db, sf.store), currentCampaign(db, sf.store.id), kitBlackDaLoja(db, sf.store.id), storeOrigin(sf.store), getStorefrontCatalog(sf.store.id), regrasDeAtacado(db, sf.store.id),
  ]);
  // Loja em lançamento (D187): o público vê a página de espera; o dono (e a equipe NextLevel) veem a loja normal.
  const donoVendo = session?.store?.id === sf.store.id || session?.user.role === "NEXTLEVEL_MASTER";
  const lancando = sf.store.launchMode && !showcase && !previewing;
  const publico = !previewing && !preview && !showcase && !(lancando && !donoVendo);
  const productName = brandByCode(org?.brand).name;
  const globals = trial ? trial.preset.globals : await getStorefrontGlobals(sf.store, preview);
  const st = globals.style;
  const vars = { "--sf-primary": st.primary, "--sf-accent": st.accent, "--sf-on-primary": readableOn(st.primary), "--sf-on-accent": readableOn(st.accent), "--sf-radius": `${st.radius}px`, "--sf-font-heading": fontStack(st.headingFont), "--sf-font-body": fontStack(st.bodyFont) } as React.CSSProperties;
  // Kit Black da loja (D242): faixa com cupom e contagem, e selo nos produtos (CSS por `data-black`).
  const black = kitBlack?.noAr ? kitBlack : null;
  const orgLd = [
    { "@context": "https://schema.org", "@type": "Organization", name: sf.store.name, url: origin, ...(sf.store.logoUrl ? { logo: sf.store.logoUrl.startsWith("/") ? `${origin.replace(/\/store\/.*$/, "")}${sf.store.logoUrl}` : sf.store.logoUrl } : {}), ...(sf.store.instagram ? { sameAs: [`https://instagram.com/${sf.store.instagram.replace(/^@/, "")}`] } : {}) },
    { "@context": "https://schema.org", "@type": "WebSite", name: sf.store.name, url: origin, potentialAction: { "@type": "SearchAction", target: `${origin}/catalog?q={search_term_string}`, "query-input": "required name=search_term_string" } },
  ];
  const catName = new Map(sf.categories.map((c) => [c.id, c.name]));
  const products = catalogo.map((c) => toPublicProduct(c, c.product.categoryId ? catName.get(c.product.categoryId) : undefined));
  // Atacado (AT2, D259): vai para o navegador em toda loja que não é de rede (SuperDrop, D216, segue como antes).
  const lojaDeRede = !!sf.store.networkId && sf.store.kind !== "SUPPLIER_OWN";
  const atacado: AtacadoDaLoja | undefined = !lojaDeRede ? {
    regras: regrasMix,
    produtos: Object.fromEntries(products.map((p) => [p.id, { atacadoCents: p.atacadoCents, categoryId: p.categoryId ?? null }])),
    pacotes: Object.fromEntries(products.flatMap((p) => p.packs.map((pk) => [pk.id, pk.totalQuantity]))),
  } : undefined;
  const ctx = { slug, base: `/store/${slug}`, store: sf.store, brandCode: brandByCode(org?.brand).code, categories: sf.categories, products, planned: {}, hero: undefined, globals, page: "home" as const };
  return (
    <div style={vars} data-buttons={st.buttons} data-black={black ? "" : undefined} className="sf-root flex min-h-screen flex-col bg-white text-neutral-900">
      {showcase ? <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-neutral-900 px-4 py-2 text-center text-xs text-white" data-showcase-banner><span>Loja de demonstração do tema <b>{showcase.name}</b> · produtos de exemplo, nada aqui é vendido.</span><a href={`/temas/${showcase.key}`} target="_top" className="rounded bg-white px-2.5 py-1 font-semibold text-neutral-900">{showcase.release !== "released" ? "Ver detalhes do tema" : "Quero este tema"}</a></div> : null}
      {previewing ? <div className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900">Pré-visualização: esta loja não está publicada. Apenas você a vê. <Link href="/merchant/storefront" className="underline">Publicar</Link></div> : null}
      {preview ? <div className="bg-indigo-100 px-4 py-1.5 text-center text-xs text-indigo-900" data-preview-banner>Prévia do rascunho: o público ainda vê a versão publicada. <form action={exitThemePreviewAction} className="inline"><button className="underline">Sair da prévia</button></form></div> : null}
      {trial ? <div className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900" data-try-banner>Testando o tema <b>{trial.name}</b> com os seus produtos. Nada foi instalado. <form action={exitTryThemeAction} className="inline"><button className="underline">Sair do teste</button></form></div> : null}
      {black ? <FaixaBlackLoja fim={black.fim} restanteMs={black.restanteMs} codigo={black.codigo} percentual={black.percentual} catalogo={`/store/${slug}/catalog`} /> : null}
      {campaign ? (
        <div className="px-4 py-2 text-center text-sm font-medium" style={{ background: "var(--sf-accent)", color: "var(--sf-on-accent)" }} data-campaign>
          {campaign.linkUrl && isSafeLink(campaign.linkUrl) ? <Link href={campaign.linkUrl} className="underline-offset-2 hover:underline">{campaign.text}</Link> : campaign.text}
        </div>
      ) : null}
      {!previewing && !showcase ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(orgLd) }} /> : null}
      {preview ? <PreviewBridge /> : null}
      {/* Visitas da loja (D185): nem a prévia do editor nem a vitrine de demonstração contam. */}
      {publico ? <ContadorDeVisitas slug={slug} /> : null}
      {publico && sf.store.metaPixelId ? <PixelMeta pixelId={sf.store.metaPixelId} /> : null}
      {publico ? <IntegracoesNaLoja cfg={sf.store.integrations ?? {}} /> : null}
      {/* Atendimento da loja (D206): só na E-commerce por enquanto; a conversa vai para o painel do lojista. */}
      {publico && org?.brand === "NEXTLEVEL_COMMERCE" ? <ChatDaLoja slug={slug} loja={sf.store.name} /> : null}
      {publico && sf.store.integrations?.maioridade ? <Maioridade loja={sf.store.name} /> : null}
      {lancando && donoVendo ? <div className="bg-sky-100 px-4 py-1.5 text-center text-xs text-sky-900" data-launch-banner>Loja em lançamento: o público vê a página &quot;abrimos em breve&quot; com a lista de espera. Só você vê a loja. <Link href="/merchant/migrar#lancamento" className="underline">Abrir a loja</Link></div> : null}
      <CartProvider storeSlug={slug} atacado={atacado}>
        <SectionList template={globals.header} ctx={ctx} region="header" />
        <BarraDeNavegacao logo={false} />
        <main className="flex-1"><EntradaDaLoja>{lancando && !donoVendo ? <ListaDeEspera slug={slug} loja={sf.store.name} /> : children}</EntradaDaLoja></main>
      </CartProvider>
      <SectionList template={globals.footer} ctx={ctx} region="footer" />
      {/* Assinatura fixa da NextLevel em todas as lojas geradas pelo sistema (não é editável). */}
      <div className="border-t border-neutral-200 bg-neutral-50 py-4 text-neutral-500" data-nextlevel-footer>
        <div className="mx-auto flex max-w-6xl justify-center px-4"><NextLevelSignature compact product={productName} className="justify-center text-center" /></div>
      </div>
    </div>
  );
}
