import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Clock, Heart, RefreshCw, Search, ShieldCheck, Star, Truck, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ProductArt } from "@/components/app/product-art";
import { ProductCard } from "@/components/storefront/product-card";
import { StoreHeader } from "@/components/storefront/header";
import { BuyBox } from "@/components/storefront/buy-box";
import { ThumbsGallery } from "@/components/storefront/product-gallery";
import { CartView } from "@/app/store/[slug]/cart/cart-view";
import { SortSelect } from "@/components/storefront/sort-select";
import { renderMarkdownLite } from "@/lib/ds/text";
import { resolveLink } from "@/lib/themes/template";
import { cn } from "@/lib/utils";
import type { BrandCode } from "@/lib/brand";
import { lojaAceitaCartao, MAX_PARCELAS_LOJA } from "@/lib/pagamento-loja";
import { parseShippingConfig } from "@/lib/shipping/quote";

/** Frete grátis a partir de quanto (a mesma regra que a cotação aplica). Sem regra válida, nada é prometido. */
const ehEcommerce = (ctx: SectionProps["ctx"]) => ctx.brandCode === "NEXTLEVEL_COMMERCE";
const freteGratisDe = (store: SectionProps["ctx"]["store"]) => { try { return parseShippingConfig(store.shippingConfig).freeFromCents; } catch { return null; } };
import type { SectionProps } from "./types";

const str = (v: unknown) => (typeof v === "string" ? v : "");
const COLS = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" } as Record<number, string>;
const TONE_BG = { primary: ["var(--sf-primary)", "var(--sf-on-primary)"], accent: ["var(--sf-accent)", "var(--sf-on-accent)"], neutral: ["#171717", "#ffffff"] } as const;
const tone = (t: unknown) => TONE_BG[(t as keyof typeof TONE_BG) in TONE_BG ? (t as keyof typeof TONE_BG) : "primary"];
const ICONS: Record<string, LucideIcon> = { truck: Truck, shield: ShieldCheck, refresh: RefreshCw, star: Star, heart: Heart, clock: Clock };

export function AnnouncementBar({ settings, ctx }: SectionProps) {
  const text = str(settings.text).trim(); if (!text) return null;
  const [bg, fg] = tone(settings.tone); const link = str(settings.link).trim();
  const inner = <div className="px-4 py-2 text-center text-xs font-medium" style={{ background: bg, color: fg }}>{text}</div>;
  return link ? <Link href={resolveLink(ctx.base, link)} className="block">{inner}</Link> : inner;
}

/** O cabeçalho é um componente de cliente (carrinho e menu); as configurações chegam por propriedades. */
export function HeaderSection({ settings, ctx }: SectionProps) {
  return <StoreHeader slug={ctx.slug} name={ctx.store.name} logoText={ctx.store.logoText} logoUrl={ctx.store.logoUrl} logoHeight={Number(settings.logoHeight) || 36} whatsapp={ctx.store.whatsapp} sticky={settings.sticky !== false} showWhatsapp={settings.showWhatsapp !== false} tone={settings.tone === "dark" ? "dark" : "light"} />;
}

export function Hero({ settings, ctx }: SectionProps) {
  const layout = str(settings.layout) || "split"; const wide = layout === "wide"; const centered = layout === "centered";
  const bgKey = str(settings.background) || "soft"; const onPrimary = bgKey === "primary";
  const background = bgKey === "primary" ? "var(--sf-primary)" : bgKey === "neutral" ? "#f5f5f5" : "color-mix(in srgb, var(--sf-accent) 10%, white)";
  const color = onPrimary ? "var(--sf-on-primary)" : undefined;
  const showProduct = settings.showProduct !== false && !centered && ctx.hero;
  const wa = ctx.store.whatsapp && settings.showWhatsapp !== false;
  return (
    <section className={cn("mt-6 grid gap-6 overflow-hidden rounded-[var(--sf-radius,16px)]", wide ? "min-h-[520px] lg:grid-cols-5" : centered ? "text-center" : "lg:grid-cols-2")} style={{ background, color }}>
      <div className={cn("flex flex-col justify-center p-8 sm:p-12", wide && "lg:col-span-3", centered && "items-center py-16 sm:py-20")}>
        {settings.showTagline !== false && ctx.store.tagline ? <span className="mb-3 inline-flex w-fit rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-neutral-700">{ctx.store.tagline}</span> : null}
        <h1 className={cn("font-semibold tracking-tight", !onPrimary && "text-neutral-900", wide ? "text-4xl sm:text-6xl" : "text-3xl sm:text-5xl")}>{str(settings.title)}</h1>
        <p className={cn("mt-4 max-w-md text-base", !onPrimary && "text-neutral-600", centered && "mx-auto")}>{str(settings.subtitle)}</p>
        <div className={cn("mt-8 flex flex-wrap gap-3", centered && "justify-center")}>
          {str(settings.ctaLabel) ? <Link href={resolveLink(ctx.base, str(settings.ctaLink))} className="sf-btn inline-flex h-12 items-center gap-2 rounded-lg px-6 text-sm font-medium transition-all hover:brightness-95" style={onPrimary ? { background: "var(--sf-accent)", color: "var(--sf-on-accent)" } : { background: "var(--sf-primary)", color: "var(--sf-on-primary)" }}>{str(settings.ctaLabel)} <ArrowRight className="size-4" /></Link> : null}
          {wa ? <a href={`https://wa.me/${ctx.store.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center rounded-lg border border-neutral-300 bg-white px-6 text-sm font-medium text-neutral-900 hover:bg-neutral-50">Falar no WhatsApp</a> : null}
        </div>
      </div>
      {showProduct ? <div className={cn("relative hidden items-center justify-center p-8 lg:flex", wide && "lg:col-span-2")}><Link href={`${ctx.base}/product/${ctx.hero!.slug}`} aria-label={`Ver ${ctx.hero!.name}`} className="w-full max-w-sm transition-transform hover:scale-[1.02]"><ProductArt images={ctx.hero!.images} size="lg" className="rounded-2xl bg-white shadow-xl" /></Link></div> : null}
    </section>
  );
}

const TRUST_COLS: Record<number, string> = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4", 5: "sm:grid-cols-3 lg:grid-cols-5", 6: "sm:grid-cols-3 lg:grid-cols-6" };
export function TrustBar({ blocks }: SectionProps) {
  if (!blocks.length) return null;
  return (
    <section className={cn("mt-6 grid gap-3", TRUST_COLS[blocks.length] ?? "sm:grid-cols-3")}>
      {blocks.map((b) => { const Icon = ICONS[str(b.settings.icon)] ?? Truck; return (
        <div key={b.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3"><Icon className="size-5 text-neutral-500" /><div><div className="text-sm font-medium">{str(b.settings.title)}</div><div className="text-xs text-neutral-500">{str(b.settings.text)}</div></div></div>
      ); })}
    </section>
  );
}

export function CategoryChips({ settings, ctx }: SectionProps) {
  if (!ctx.categories.length) return null;
  return (
    <section className="mt-10">
      {str(settings.heading) ? <h2 className="mb-3 text-xl font-semibold tracking-tight">{str(settings.heading)}</h2> : null}
      <div className="nl-scroll flex gap-2 overflow-x-auto pb-1">
        {ctx.categories.map((c) => <Link key={c.id} href={`${ctx.base}/catalog?category=${c.slug}`} className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-neutral-300 px-4 text-sm hover:border-neutral-900">{c.name}</Link>)}
      </div>
    </section>
  );
}

export function ProductShowcase({ id, settings, ctx }: SectionProps) {
  const list = ctx.planned[id] ?? []; if (!list.length) return null;
  const cols = COLS[Number(settings.columns)] ?? COLS[4]!;
  return (
    <section className="mt-10">
      <div className="mb-5 flex items-end justify-between"><div><h2 className="text-xl font-semibold tracking-tight">{str(settings.title)}</h2>{str(settings.subtitle) ? <p className="text-sm text-neutral-500">{str(settings.subtitle)}</p> : null}</div>{str(settings.linkLabel) ? <Link href={resolveLink(ctx.base, str(settings.linkHref))} className="inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline">{str(settings.linkLabel)}</Link> : null}</div>
      <div className={cn("grid grid-cols-2 gap-4 sm:gap-6", cols)}>{list.map((p) => <ProductCard key={p.id} product={p} slug={ctx.slug} quickView={ctx.globals.style.quickView} />)}</div>
    </section>
  );
}

export function PromoBanners({ blocks, ctx }: SectionProps) {
  if (!blocks.length) return null;
  return (
    <section className={cn("mt-12 grid gap-4", blocks.length > 1 && "sm:grid-cols-2")}>
      {blocks.map((b) => { const [bg, fg] = tone(b.settings.tone); return (
        <Link key={b.id} href={resolveLink(ctx.base, str(b.settings.link))} className="flex min-h-[160px] flex-col justify-end rounded-[var(--sf-radius,16px)] p-6 transition-transform hover:-translate-y-0.5" style={{ background: bg, color: fg }}><div className="text-xl font-semibold">{str(b.settings.title)}</div><div className="text-sm">{str(b.settings.subtitle)}</div></Link>
      ); })}
    </section>
  );
}

export function ProductGrid({ id, settings, ctx }: SectionProps) {
  const list = ctx.planned[id] ?? []; if (!list.length) return null;
  const cols = COLS[Number(settings.columns)] ?? COLS[4]!;
  return (
    <section className="mt-12">
      <h2 className="mb-5 text-xl font-semibold tracking-tight">{str(settings.title)}</h2>
      <div className={cn("grid grid-cols-2 gap-4 sm:gap-6", cols)}>{list.map((p) => <ProductCard key={p.id} product={p} slug={ctx.slug} quickView={ctx.globals.style.quickView} />)}</div>
    </section>
  );
}

export function RichText({ settings }: SectionProps) {
  const center = settings.align === "center";
  return (
    <section className={cn("mx-auto mt-12 max-w-2xl", center && "text-center")}>
      {str(settings.heading) ? <h2 className="mb-3 text-xl font-semibold tracking-tight">{str(settings.heading)}</h2> : null}
      <div className="space-y-3 text-neutral-600 [&_a]:underline [&_li]:ml-5 [&_li]:list-disc" dangerouslySetInnerHTML={{ __html: renderMarkdownLite(str(settings.body)) }} />
    </section>
  );
}

export function Footer({ settings, ctx }: SectionProps) {
  const { store } = ctx; const dark = settings.tone === "dark";
  return (
    <footer className={cn("border-t", dark ? "border-white/10 bg-neutral-950 text-neutral-300" : "border-neutral-200 bg-neutral-50")}>
      <div className={cn("mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6", !dark && "text-neutral-500")}>
        <div>{str(settings.text) || store.name}{settings.showLegal !== false && (store.legalName || store.cnpj || store.contactEmail || store.address) ? <div className="mt-1 text-xs opacity-80">{[store.legalName, store.cnpj ? `${store.cnpj.length === 11 ? "CPF" : "CNPJ"} ${store.cnpj}` : "", store.address, store.contactEmail].filter(Boolean).join(" · ")}</div> : null}</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {settings.showInstagram !== false && store.instagram ? <span>@{store.instagram.replace("@", "")}</span> : null}
          {settings.showBadges !== false ? <><span>Pagamento seguro</span><span>Envio para todo o Brasil</span></> : null}
          {store.offer !== "STORE_OWN" && ctx.brandCode === "SUPERDROP" ? <span className={cn("flex items-center gap-1.5", dark ? "text-neutral-400" : "text-neutral-600")}>Tecnologia <Logo tone={dark ? "on-dark" : "on-light"} className="h-4" /></span> : null}
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Página de produto, catálogo e carrinho
// ---------------------------------------------------------------------------
export function ProductMain({ settings, ctx }: SectionProps) {
  const product = ctx.product; if (!product) return null;
  const base = ctx.base; const gallery = str(settings.gallery) || "stacked";
  const real = product.images.filter((i) => /^https?:\/\//.test(i) || i.startsWith("data:image"));
  return (
    <>
      {settings.showBreadcrumb !== false ? <nav className="mb-6 flex items-center gap-1 text-xs text-neutral-500"><Link href={base} className="hover:text-neutral-900">Início</Link><ChevronRight className="size-3" /><Link href={`${base}/catalog`} className="hover:text-neutral-900">Catálogo</Link><ChevronRight className="size-3" /><span className="text-neutral-900">{product.name}</span></nav> : null}
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {gallery === "thumbs" ? <ThumbsGallery images={product.images} name={product.name} /> : gallery === "grid" && real.length > 1 ? (
          <div className="grid grid-cols-2 gap-3">{real.slice(0, 6).map((img, i) => <ProductArt key={i} images={[img]} size="lg" alt={i === 0 ? product.name : ""} className={cn("rounded-2xl bg-neutral-100", i === 0 && "col-span-2")} />)}</div>
        ) : (
          <div className="space-y-3">
            <ProductArt images={product.images} size="lg" className="rounded-2xl bg-neutral-100" />
            <div className="grid grid-cols-4 gap-3">{[0, 1, 2, 3].map((i) => <ProductArt key={i} images={product.images} size="md" className="rounded-xl bg-neutral-100 opacity-70" />)}</div>
          </div>
        )}
        <BuyBox product={product} slug={ctx.slug} shippingNote={str(settings.shippingNote)} stickyBar={settings.stickyBuyBar === true} parcelas={lojaAceitaCartao(ctx.brandCode as BrandCode | undefined) ? MAX_PARCELAS_LOJA : undefined} freeFromCents={ehEcommerce(ctx) ? freteGratisDe(ctx.store) : null} extras={ehEcommerce(ctx)} />
      </div>
    </>
  );
}

export function ProductRelated({ settings, ctx }: SectionProps) {
  const list = (ctx.related ?? []).slice(0, Number(settings.count) || 4); if (!list.length) return null;
  const cols = COLS[Number(settings.columns)] ?? COLS[4]!;
  return (
    <section className="mt-16">
      <h2 className="mb-5 text-xl font-semibold tracking-tight">{str(settings.title)}</h2>
      <div className={cn("grid grid-cols-2 gap-4 sm:gap-6", cols)}>{list.map((p) => <ProductCard key={p.id} product={p} slug={ctx.slug} quickView={ctx.globals.style.quickView} />)}</div>
    </section>
  );
}

export function CollectionHeader({ settings, ctx }: SectionProps) {
  const base = `${ctx.base}/catalog`; const { category, q } = ctx.query ?? {};
  const cat = ctx.categories.find((c) => c.slug === category); const count = ctx.products.length;
  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">{cat?.name ?? (ctx.query?.produtos ? "Seleção" : "Catálogo")}</h1>{settings.showCount !== false ? <p className="text-sm text-neutral-500">{count} produto{count === 1 ? "" : "s"}</p> : null}</div>
        {settings.showSearch !== false ? (
          <form className="relative w-full sm:w-72" action={base}>
            {category ? <input type="hidden" name="category" value={category} /> : null}
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <input name="q" defaultValue={q} placeholder="Buscar produto…" aria-label="Buscar produto" className="h-11 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-neutral-900" />
          </form>
        ) : null}
        {settings.showSort === true ? <SortSelect value={ctx.query?.sort ?? ""} /> : null}
      </div>
      {settings.showCategories !== false ? (
        <div className="nl-scroll mb-6 flex gap-2 overflow-x-auto pb-1">
          <Link href={base} className={cn("inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm", !category ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 hover:border-neutral-900")}>Todos</Link>
          {ctx.categories.map((c) => <Link key={c.id} href={`${base}?category=${c.slug}`} className={cn("inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm", category === c.slug ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 hover:border-neutral-900")}>{c.name}</Link>)}
        </div>
      ) : null}
    </>
  );
}

export function CollectionGrid({ settings, ctx }: SectionProps) {
  const cols = COLS[Number(settings.columns)] ?? COLS[4]!;
  if (ctx.products.length === 0) return <div className="rounded-xl border border-dashed border-neutral-300 p-12 text-center text-sm text-neutral-500">{str(settings.emptyText)}</div>;
  return <div className={cn("grid grid-cols-2 gap-4 sm:gap-6", cols)}>{ctx.products.map((p) => <ProductCard key={p.id} product={p} slug={ctx.slug} quickView={ctx.globals.style.quickView} />)}</div>;
}

export function CartMain({ ctx }: SectionProps) { return <CartView slug={ctx.slug} freeFromCents={ehEcommerce(ctx) ? freteGratisDe(ctx.store) : null} />; }
