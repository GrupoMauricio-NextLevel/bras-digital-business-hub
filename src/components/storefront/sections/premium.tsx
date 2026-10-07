import * as React from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { ProductArt } from "@/components/app/product-art";
import { Countdown } from "@/components/storefront/countdown";
import { Slideshow, type Slide } from "@/components/storefront/slideshow";
import { StoreHeader, type MenuItem } from "@/components/storefront/header";
import { renderMarkdownLite } from "@/lib/ds/text";
import { youtubeIdOf } from "@/lib/themes/settings";
import { resolveLink } from "@/lib/themes/template";
import { cn } from "@/lib/utils";
import type { SectionProps } from "./types";

const str = (v: unknown) => (typeof v === "string" ? v : "");
const HEIGHTS = { sm: "min-h-[260px]", md: "min-h-[400px]", lg: "min-h-[540px]", full: "min-h-[calc(100dvh-8rem)]" } as Record<string, string>;
const ALIGN = { left: "items-start text-left", center: "items-center text-center", right: "items-end text-right" } as Record<string, string>;
const COLS = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" } as Record<number, string>;
const TONES = { primary: ["var(--sf-primary)", "var(--sf-on-primary)"], accent: ["var(--sf-accent)", "var(--sf-on-accent)"], neutral: ["#171717", "#ffffff"], light: ["#f5f5f5", "#171717"] } as Record<string, [string, string]>;
const tone = (t: unknown) => TONES[str(t)] ?? TONES.primary!;
const cssUrl = (u: string) => `url("${u.replace(/["\\)\s]/g, (c) => encodeURIComponent(c))}")`;
/** Fundo com imagem (se houver) ou degradê nas cores da loja. */
export const heroBackground = (image: string) => (image ? { backgroundImage: cssUrl(image), backgroundSize: "cover", backgroundPosition: "center" } : { background: "linear-gradient(135deg, var(--sf-primary), color-mix(in srgb, var(--sf-accent) 60%, var(--sf-primary)))" });
const full = (on: boolean) => (on ? "relative left-1/2 w-screen -translate-x-1/2" : "rounded-[var(--sf-radius,16px)]");

function Buttons({ settings, ctx }: { settings: SectionProps["settings"]; ctx: SectionProps["ctx"] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-3">
      {str(settings.ctaLabel) ? <Link href={resolveLink(ctx.base, str(settings.ctaLink))} className="sf-btn inline-flex h-12 items-center rounded-lg px-6 text-sm font-medium transition hover:brightness-95" style={{ background: "var(--sf-accent)", color: "var(--sf-on-accent)" }}>{str(settings.ctaLabel)}</Link> : null}
      {str(settings.secondaryLabel) ? <Link href={resolveLink(ctx.base, str(settings.secondaryLink))} className="inline-flex h-12 items-center rounded-lg border border-current px-6 text-sm font-medium transition hover:bg-white/10">{str(settings.secondaryLabel)}</Link> : null}
    </div>
  );
}

export function ArenaHero({ id, settings, ctx }: SectionProps) {
  const H = ctx.firstId === id ? "h1" : "h2";
  const product = settings.showProduct !== false ? ctx.hero : undefined;
  return (
    <section className="relative left-1/2 mt-0 w-screen -translate-x-1/2 overflow-hidden bg-[#07110c] text-white">
      <div className="absolute inset-0 opacity-30" aria-hidden style={{ backgroundImage: "linear-gradient(rgba(34,197,94,.13) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,.13) 1px, transparent 1px)", backgroundSize: "44px 44px", maskImage: "linear-gradient(to right, black, transparent 82%)" }} />
      <div className="absolute -left-24 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-[var(--sf-accent)] opacity-10 blur-3xl" aria-hidden />
      <div className="relative mx-auto grid min-h-[560px] max-w-6xl items-center gap-8 px-6 py-16 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:px-6">
        <div className="relative z-10 max-w-2xl">
          {str(settings.eyebrow) ? <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold tracking-[0.18em] text-[var(--sf-accent)]"><span className="size-1.5 rounded-full bg-[var(--sf-accent)]" aria-hidden />{str(settings.eyebrow)}</div> : null}
          <H className="max-w-3xl text-4xl font-black uppercase leading-[.92] tracking-[-0.035em] sm:text-6xl lg:text-7xl">{str(settings.heading)}</H>
          {str(settings.text) ? <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">{str(settings.text)}</p> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            {str(settings.ctaLabel) ? <Link href={resolveLink(ctx.base, str(settings.ctaLink))} className="sf-btn inline-flex h-12 items-center rounded-lg px-6 text-sm font-bold uppercase tracking-wide transition hover:-translate-y-0.5 hover:brightness-110" style={{ background: "var(--sf-accent)", color: "var(--sf-on-accent)" }}>{str(settings.ctaLabel)}</Link> : null}
            {str(settings.secondaryLabel) ? <Link href={resolveLink(ctx.base, str(settings.secondaryLink))} className="inline-flex h-12 items-center rounded-lg border border-white/20 bg-white/5 px-6 text-sm font-semibold transition hover:bg-white/10">{str(settings.secondaryLabel)}</Link> : null}
          </div>
        </div>
        {product ? (
          <div className="relative mx-auto hidden w-full max-w-md lg:block">
            <div className="absolute -inset-8 rounded-full bg-[var(--sf-accent)] opacity-15 blur-3xl" aria-hidden />
            <Link href={`${ctx.base}/product/${product.slug}`} className="group relative block rotate-[2deg] overflow-hidden rounded-2xl border border-white/10 bg-white p-5 shadow-2xl transition duration-500 hover:rotate-0 hover:scale-[1.02]">
              <ProductArt images={product.images} size="lg" alt={product.name} className="aspect-[4/5] rounded-xl bg-neutral-100 object-contain" />
              <div className="mt-4 flex items-end justify-between gap-3 text-neutral-950">
                <div className="min-w-0"><div className="text-[10px] font-bold tracking-[.16em] text-emerald-700">{str(settings.productBadge)}</div><div className="mt-1 truncate text-base font-bold">{product.name}</div></div>
                <span className="shrink-0 rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-bold text-white">VER</span>
              </div>
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function ImageHero({ id, settings, ctx }: SectionProps) {
  const H = ctx.firstId === id ? "h1" : "h2"; const fw = settings.fullWidth === true; const light = settings.textColor !== "dark";
  return (
    <section className={cn("sf-on-image relative mt-6 flex overflow-hidden", full(fw), HEIGHTS[str(settings.height)] ?? HEIGHTS.md)} style={heroBackground(str(settings.image))}>
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${Number(settings.overlay) / 100})` }} aria-hidden />
      <div className={cn("relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-center gap-4 px-6 py-12 sm:px-12", ALIGN[str(settings.align)] ?? ALIGN.left, light ? "text-white" : "text-neutral-900")}>
        <H className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">{str(settings.heading)}</H>
        {str(settings.text) ? <p className="max-w-xl text-base opacity-90 sm:text-lg">{str(settings.text)}</p> : null}
        <Buttons settings={settings} ctx={ctx} />
      </div>
    </section>
  );
}

export function SlideshowSection({ id, settings, blocks, ctx }: SectionProps) {
  const slides: Slide[] = blocks.map((b) => ({ id: b.id, bg: str(b.settings.image) ? `${cssUrl(str(b.settings.image))} center / cover` : "linear-gradient(135deg, var(--sf-primary), color-mix(in srgb, var(--sf-accent) 60%, var(--sf-primary)))", heading: str(b.settings.heading), text: str(b.settings.text), ctaLabel: str(b.settings.ctaLabel), ctaHref: resolveLink(ctx.base, str(b.settings.ctaLink)), align: (str(b.settings.align) || "left") as Slide["align"], light: b.settings.textColor !== "dark" }));
  return <Slideshow slides={slides} autoplay={settings.autoplay !== false} seconds={Number(settings.interval) || 6} height={(str(settings.height) || "md") as "sm" | "md" | "lg" | "full"} dots={settings.showDots !== false} arrows={settings.showArrows !== false} fullWidth={settings.fullWidth === true} firstHeading={ctx.firstId === id} />;
}

export function VideoHero({ id, settings, ctx }: SectionProps) {
  const H = ctx.firstId === id ? "h1" : "h2"; const url = str(settings.video); const yt = youtubeIdOf(url); const fw = settings.fullWidth === true; const poster = str(settings.poster);
  return (
    <section className={cn("relative mt-6 flex overflow-hidden bg-neutral-900", full(fw), HEIGHTS[str(settings.height)] ?? HEIGHTS.md)} style={poster ? heroBackground(poster) : undefined}>
      {yt ? <iframe title="" aria-hidden tabIndex={-1} className="sf-video pointer-events-none absolute inset-0 h-full w-full scale-[1.35]" src={`https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&mute=1&loop=1&playlist=${yt}&controls=0&modestbranding=1&playsinline=1&rel=0`} allow="autoplay; encrypted-media" loading="lazy" />
        : url ? <video className="sf-video absolute inset-0 h-full w-full object-cover" src={url} poster={poster || undefined} autoPlay muted loop playsInline preload="metadata" aria-hidden /> : null}
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${Number(settings.overlay) / 100})` }} aria-hidden />
      <div className={cn("relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-center gap-4 px-6 py-12 text-white sm:px-12", ALIGN[str(settings.align)] ?? ALIGN.left)}>
        <H className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">{str(settings.heading)}</H>
        {str(settings.text) ? <p className="max-w-xl text-base opacity-90 sm:text-lg">{str(settings.text)}</p> : null}
        <Buttons settings={settings} ctx={ctx} />
      </div>
    </section>
  );
}

export function CategoryGrid({ settings, blocks, ctx }: SectionProps) {
  if (!ctx.categories.length) return null;
  const key = (x: string) => x.trim().toLowerCase();
  const own = new Map(blocks.filter((b) => str(b.settings.image)).map((b) => [key(str(b.settings.category)), str(b.settings.image)]));
  const cols = COLS[Number(settings.columns)] ?? COLS[4]!; const circles = settings.style === "circles";
  return (
    <section className="mt-12">
      {str(settings.heading) ? <h2 className="mb-5 text-xl font-semibold tracking-tight">{str(settings.heading)}</h2> : null}
      <ul className={cn("grid grid-cols-2 gap-4 sm:gap-6", cols)}>
        {ctx.categories.map((c) => {
          const items = ctx.products.filter((p) => p.categoryId === c.id);
          return (
            <li key={c.id}><Link href={`${ctx.base}/catalog?category=${c.slug}`} className="group block text-center">
              <div className={cn("overflow-hidden bg-neutral-100 transition-transform duration-300 group-hover:-translate-y-0.5", circles ? "mx-auto aspect-square w-full max-w-[200px] rounded-full" : "rounded-xl")}>
                <ProductArt images={own.get(key(c.name)) ?? own.get(key(c.slug)) ? [(own.get(key(c.name)) ?? own.get(key(c.slug)))!] : items[0]?.images ?? []} alt="" size={circles ? "md" : "lg"} className={cn("bg-neutral-100 transition-transform duration-500 group-hover:scale-[1.04]", circles && "rounded-full")} />
              </div>
              <div className="mt-3 text-sm font-medium group-hover:underline">{c.name}</div>
              {settings.showCount !== false ? <div className="text-xs text-neutral-500">{items.length} produto{items.length === 1 ? "" : "s"}</div> : null}
            </Link></li>
          );
        })}
      </ul>
    </section>
  );
}

const RATIO = { portrait: "aspect-[4/5]", square: "aspect-square", landscape: "aspect-[3/2]" } as Record<string, string>;
export function ImageWithText({ settings, ctx }: SectionProps) {
  const img = str(settings.image);
  // Sem foto na loja publicada: só o texto, centralizado (sem bloco vazio). Na prévia do editor o espaço da foto aparece.
  const textOnly = !img && !ctx.editing;
  return (
    <section className={cn("mt-16 grid items-center gap-8 md:gap-14", textOnly ? "mx-auto max-w-2xl text-center" : "md:grid-cols-2")}>
      <div className={cn(settings.reverse === true && "md:order-2", textOnly && "hidden")}>
        {img ? <ProductArt images={[img]} size="md" alt={str(settings.heading)} className={cn("w-full rounded-[var(--sf-radius,16px)] bg-neutral-100", RATIO[str(settings.ratio)] ?? RATIO.portrait)} /> : <div className={cn("w-full rounded-[var(--sf-radius,16px)]", RATIO[str(settings.ratio)] ?? RATIO.portrait)} style={heroBackground("")} aria-hidden />}
      </div>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{str(settings.heading)}</h2>
        <div className="mt-4 space-y-3 text-neutral-600 [&_a]:underline [&_li]:ml-5 [&_li]:list-disc" dangerouslySetInnerHTML={{ __html: renderMarkdownLite(str(settings.body)) }} />
        {str(settings.ctaLabel) ? <Link href={resolveLink(ctx.base, str(settings.ctaLink))} className="sf-btn mt-6 inline-flex h-12 items-center rounded-lg px-6 text-sm font-medium transition hover:brightness-95" style={{ background: "var(--sf-primary)", color: "var(--sf-on-primary)" }}>{str(settings.ctaLabel)}</Link> : null}
      </div>
    </section>
  );
}

export function Testimonials({ settings, blocks }: SectionProps) {
  if (!blocks.length) return null; const stars = Math.max(0, Math.min(5, Number(settings.stars) || 0));
  return (
    <section className="mt-16">
      {str(settings.heading) ? <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight">{str(settings.heading)}</h2> : null}
      <ul className="grid gap-4 md:grid-cols-3">
        {blocks.map((b) => (
          <li key={b.id} className="rounded-[var(--sf-radius,16px)] border border-neutral-200 bg-white p-6">
            {stars ? <div className="mb-3 flex gap-0.5 text-amber-500" role="img" aria-label={`${stars} de 5 estrelas`}>{Array.from({ length: stars }).map((_, i) => <Star key={i} className="size-4 fill-current" aria-hidden />)}</div> : null}
            <blockquote className="text-sm leading-relaxed text-neutral-700">“{str(b.settings.text)}”</blockquote>
            <p className="mt-4 text-sm font-semibold">{str(b.settings.name)}{str(b.settings.role) ? <span className="font-normal text-neutral-500"> · {str(b.settings.role)}</span> : null}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Faq({ settings, blocks }: SectionProps) {
  if (!blocks.length) return null;
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: blocks.map((b) => ({ "@type": "Question", name: str(b.settings.question), acceptedAnswer: { "@type": "Answer", text: str(b.settings.answer) } })) };
  return (
    <section className="mx-auto mt-16 max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      {str(settings.heading) ? <h2 className="mb-5 text-2xl font-semibold tracking-tight">{str(settings.heading)}</h2> : null}
      <div className="divide-y divide-neutral-200 rounded-[var(--sf-radius,16px)] border border-neutral-200">
        {blocks.map((b) => <details key={b.id} className="group px-5 py-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">{str(b.settings.question)}<span aria-hidden className="text-neutral-400 transition group-open:rotate-45">+</span></summary><p className="mt-2 text-sm leading-relaxed text-neutral-600">{str(b.settings.answer)}</p></details>)}
      </div>
    </section>
  );
}

/** Com menos de 5 looks, as peças menores se esticam para a grade não ficar com buraco. */
function lookSpan(i: number, n: number) {
  const rest = n - 1, last = i === n - 1;
  return cn(rest % 2 === 1 && last && "col-span-2", rest === 1 ? "md:col-span-2 md:row-span-2" : rest === 2 ? "md:col-span-2" : rest === 3 && last ? "md:col-span-2" : "");
}
export function Lookbook({ settings, blocks: all, ctx }: SectionProps) {
  // Na loja publicada, look sem imagem não aparece; na prévia do editor aparece para indicar onde falta a foto.
  const blocks = ctx.editing ? all : all.filter((b) => str(b.settings.image));
  if (!blocks.length) return null;
  return (
    <section className="mt-16">
      <div className="mb-6"><h2 className="text-2xl font-semibold tracking-tight">{str(settings.heading)}</h2>{str(settings.subtitle) ? <p className="mt-1 text-sm text-neutral-500">{str(settings.subtitle)}</p> : null}</div>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2 md:gap-4">
        {blocks.map((b, i) => (
          <li key={b.id} className={cn(i === 0 ? "col-span-2 row-span-2" : lookSpan(i, blocks.length))}>
            <Link href={resolveLink(ctx.base, str(b.settings.link))} prefetch={false} className="group relative block h-full min-h-[180px] overflow-hidden rounded-[var(--sf-radius,16px)] bg-neutral-100" style={heroBackground(str(b.settings.image))}>
              <span className="absolute inset-0 bg-black/20 transition group-hover:bg-black/35" aria-hidden />
              <span className="absolute inset-x-0 bottom-0 p-4 text-sm font-medium text-white sm:text-base">{str(b.settings.title)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CountdownSection({ settings, ctx }: SectionProps) {
  const [bg, fg] = tone(settings.tone);
  return <Countdown until={str(settings.until)} heading={str(settings.heading)} text={str(settings.text)} ctaLabel={str(settings.ctaLabel)} ctaHref={resolveLink(ctx.base, str(settings.ctaLink))} expiredText={str(settings.expiredText)} bg={bg} fg={fg} />;
}

export function CtaBanner({ settings, ctx }: SectionProps) {
  const [bg, fg] = tone(settings.tone); const center = settings.align !== "left";
  return (
    <section className={cn("mt-16 rounded-[var(--sf-radius,16px)] px-6 py-12 sm:px-12", center && "text-center")} style={{ background: bg, color: fg }}>
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{str(settings.heading)}</h2>
      {str(settings.text) ? <p className={cn("mt-2 max-w-xl text-base opacity-85", center && "mx-auto")}>{str(settings.text)}</p> : null}
      {str(settings.buttonLabel) ? <a href={str(settings.buttonLink) ? resolveLink(ctx.base, str(settings.buttonLink)) : ctx.store.whatsapp ? `https://wa.me/${ctx.store.whatsapp}` : ctx.base} className="sf-btn mt-6 inline-flex h-12 items-center rounded-lg bg-white px-6 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100">{str(settings.buttonLabel)}</a> : null}
    </section>
  );
}

export function ProductTabs({ blocks, ctx }: SectionProps) {
  if (!blocks.length) return null;
  return (
    <section className="mt-12 divide-y divide-neutral-200 rounded-[var(--sf-radius,16px)] border border-neutral-200">
      {blocks.map((b, i) => { const html = b.settings.useProductDescription === true ? `<p>${str(ctx.product?.description).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>` : renderMarkdownLite(str(b.settings.body)); return (
        <details key={b.id} open={i === 0} className="group px-5 py-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">{str(b.settings.title)}<span aria-hidden className="text-neutral-400 transition group-open:rotate-45">+</span></summary><div className="mt-2 space-y-2 text-sm leading-relaxed text-neutral-600 [&_a]:underline [&_li]:ml-5 [&_li]:list-disc" dangerouslySetInnerHTML={{ __html: html }} /></details>
      ); })}
    </section>
  );
}

/** Submenu escrito uma linha por link ("Nome | /endereço"). Linhas inválidas são ignoradas. */
export function parseMenuChildren(text: string): { label: string; href: string }[] {
  return text.split(/\r?\n/).flatMap((line) => { const [label, href] = line.split("|").map((x) => x.trim()); return label && href ? [{ label, href }] : []; }).slice(0, 12);
}

export function HeaderPlus({ settings, blocks, ctx }: SectionProps) {
  const menu: MenuItem[] = blocks.map((b) => ({ label: str(b.settings.label), href: resolveLink(ctx.base, str(b.settings.link)), children: parseMenuChildren(str(b.settings.children)) }));
  const products = ctx.products.slice(0, 200).map((p) => ({ name: p.name, slug: p.slug, category: p.categoryName, priceCents: p.priceCents }));
  return <StoreHeader slug={ctx.slug} name={ctx.store.name} logoText={ctx.store.logoText} logoUrl={ctx.store.logoUrl} logoHeight={Number(settings.logoHeight) || 36} whatsapp={ctx.store.whatsapp} sticky={settings.sticky !== false} showWhatsapp={settings.showWhatsapp !== false} tone={settings.tone === "dark" ? "dark" : "light"} menu={menu} searchProducts={products} showSearch={settings.showSearch !== false} />;
}
