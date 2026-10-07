import * as React from "react";
import { preload } from "react-dom";
import Link from "next/link";
import { BannerCarousel } from "@/components/storefront/banner-carousel";
import { BannerVideo } from "@/components/storefront/banner-video";
import { liveBlocks } from "@/lib/themes/banners";
import { avifOf } from "@/lib/themes/avif";
import { resolveLink } from "@/lib/themes/template";
import { cn } from "@/lib/utils";
import type { SectionProps } from "./types";

type S = SectionProps["settings"];
const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);

/** Larguras que /assets/[id] sabe gerar (WebP); imagens do acervo estático usam o arquivo como está. */
const ASSET_WIDTHS = [480, 640, 960, 1280, 1600, 1920];
const srcSetOf = (src: string) => (/^\/assets\/ast_[a-z0-9]+$/i.test(src) ? ASSET_WIDTHS.map((w) => `${src}?w=${w} ${w}w`).join(", ") : undefined);

/**
 * Imagem de banner: original preservado (só derivados redimensionados), versão de celular com fonte própria, ponto de
 * foco por aparelho e descrição (ou alt vazio, se decorativa). Só a imagem acima da dobra recebe prioridade.
 */
export function BannerImage({ s, sizes, priority, className }: { s: S; sizes: string; priority: boolean; className?: string }) {
  const desktop = str(s.image); const mobile = str(s.imageMobile) || desktop;
  const alt = s.decorative === true ? "" : str(s.alt) || str(s.title);
  const vars = { "--fx": `${num(s.focusX, 50)}%`, "--fy": `${num(s.focusY, 50)}%`, "--mx": `${num(s.focusMobileX, 50)}%`, "--my": `${num(s.focusMobileY, 50)}%` } as React.CSSProperties;
  // A imagem principal (acima da dobra) é pedida já no início do HTML, antes de o navegador montar a página.
  // Com imagem própria de celular não há como pedir só a certa por aqui; o <picture> escolhe sozinho.
  const avifD = avifOf(desktop); const avifM = avifOf(mobile);
  if (priority && desktop && mobile === desktop) {
    if (avifD) preload(avifD, { as: "image", type: "image/avif", fetchPriority: "high" });
    else preload(srcSetOf(desktop) ? `${desktop}?w=1280` : desktop, { as: "image", fetchPriority: "high", imageSrcSet: srcSetOf(desktop), imageSizes: sizes });
  }
  if (!desktop) {
    // Sem imagem enviada: fundo nas cores da loja (nunca foto aleatória). O editor mostra o aviso de imagem pendente.
    return <div aria-hidden className={cn("absolute inset-0", className)} style={{ background: "linear-gradient(135deg, var(--sf-primary), color-mix(in srgb, var(--sf-accent) 55%, var(--sf-primary)))" }} data-banner-empty />;
  }
  return (
    <picture className={cn("absolute inset-0 block", className)} style={vars}>
      {mobile !== desktop && avifM ? <source media="(max-width: 767px)" type="image/avif" srcSet={avifM} /> : null}
      {mobile !== desktop ? <source media="(max-width: 767px)" srcSet={srcSetOf(mobile) ?? mobile} sizes="100vw" /> : null}
      {avifD ? <source type="image/avif" srcSet={avifD} /> : null}
      <img src={srcSetOf(desktop) ? `${desktop}?w=1280` : desktop} srcSet={srcSetOf(desktop)} sizes={sizes} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async"
        className="size-full object-cover [object-position:var(--mx)_var(--my)] md:[object-position:var(--fx)_var(--fy)]" />
    </picture>
  );
}

const ALIGN: Record<string, string> = { left: "items-start text-left", center: "items-center text-center", right: "items-end text-right" };
/**
 * Links de banner não são pré-carregados: a seleção de campanha (/catalog?produtos=…) deixava a conexão de pré-carga
 * aberta no navegador; a página abre normalmente no clique.
 */
/** Texto por cima da imagem, com escurecimento ajustável para legibilidade. */
function Overlay({ s, ctx, heading, compact = false }: { s: S; ctx: SectionProps["ctx"]; heading: "h1" | "h2" | "h3"; compact?: boolean }) {
  const H = heading; const light = s.textColor !== "dark";
  const title = str(s.title); const sub = str(s.subtitle); const cta = str(s.ctaLabel); const href = resolveLink(ctx.base, str(s.link));
  if (!title && !sub && !cta) return null;
  return (
    <>
      <div aria-hidden className="absolute inset-0" style={{ background: light ? `linear-gradient(to top, rgba(0,0,0,${num(s.overlay, 30) / 100 + 0.15}), rgba(0,0,0,${num(s.overlay, 30) / 100 * 0.6}))` : `rgba(255,255,255,${num(s.overlay, 30) / 100})` }} />
      <div className={cn("relative z-10 flex h-full w-full flex-col justify-end gap-2", compact ? "p-4 sm:p-5" : "mx-auto max-w-6xl px-5 py-8 sm:px-10 sm:py-12", ALIGN[str(s.align)] ?? ALIGN.left, light ? "sf-on-image text-white" : "text-neutral-950")}>
        {title ? <H className={cn("max-w-[34rem] font-semibold tracking-tight", compact ? "text-lg sm:text-xl" : "text-3xl leading-tight sm:text-5xl")}>{title}</H> : null}
        {sub ? <p className={cn("max-w-[30rem] opacity-90", compact ? "text-sm" : "text-base sm:text-lg")}>{sub}</p> : null}
        {cta ? <Link href={href} prefetch={false} className={cn("sf-btn mt-1 inline-flex items-center rounded-lg font-medium transition hover:brightness-95", compact ? "h-10 px-4 text-sm" : "h-12 px-6 text-sm")} style={{ background: "var(--sf-accent)", color: "var(--sf-on-accent)" }}>{cta}</Link> : null}
      </div>
    </>
  );
}

/** Peça inteira clicável quando há link e não há botão (bom para mosaico e apoio). */
function Tile({ s, ctx, children, className }: { s: S; ctx: SectionProps["ctx"]; children: React.ReactNode; className?: string }) {
  const href = str(s.link); const label = str(s.title) || str(s.alt) || "Ver";
  if (href && !str(s.ctaLabel)) return <Link href={resolveLink(ctx.base, href)} prefetch={false} aria-label={label} className={cn("group relative block overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2", className)}>{children}</Link>;
  return <div className={cn("relative overflow-hidden", className)}>{children}</div>;
}

const HERO_RATIO: Record<string, string> = { sm: "md:aspect-[3/1]", md: "md:aspect-[21/9]", lg: "md:aspect-[16/9]" };
/**
 * Na loja publicada, peça de banner sem imagem e sem texto não aparece (não vira um bloco vazio), e o destaque sem nenhuma
 * imagem fica baixo, só com título e chamada. Na prévia do editor tudo aparece, para o lojista ver onde falta a foto.
 */
const hasImage = (b: { settings: S }) => !!str(b.settings.image);
const showable = (b: { settings: S }, editing?: boolean) => editing || hasImage(b);

/** Destaque com banners (N1: 1 imagem; N2: 2 slides; N3+: carrossel; N4: vídeo e agendamento). */
export function HeroBanner({ id, settings, blocks, ctx }: SectionProps) {
  const live = liveBlocks(blocks, { now: ctx.now ?? new Date(), page: ctx.page, categoryId: ctx.categoryId });
  if (!live.length) return null;
  const first = ctx.firstId === id; const fw = settings.fullWidth !== false;
  const compact = !ctx.editing && !live.some(hasImage);
  const frame = compact ? "relative flex min-h-[260px] w-full items-end sm:min-h-[320px]" : cn("relative aspect-[4/5] w-full sm:aspect-[4/3]", HERO_RATIO[str(settings.height)] ?? HERO_RATIO.md);
  const slide = (b: (typeof live)[number], k: number) => (
    <div key={b.id} className={frame} data-banner-slide={b.id}>
      {str(b.settings.video) ? <BannerVideo src={str(b.settings.video)} poster={str(b.settings.image)} /> : null}
      <BannerImage s={b.settings} sizes="100vw" priority={first && k === 0} className={str(b.settings.video) ? "motion-safe:hidden" : undefined} />
      <Overlay s={b.settings} ctx={ctx} heading={first && k === 0 ? "h1" : "h2"} />
    </div>
  );
  const wrap = cn("mt-0 overflow-hidden", fw ? "relative left-1/2 w-screen -translate-x-1/2" : "mt-6 rounded-[var(--sf-radius,16px)]");
  if (live.length === 1) return <section className={wrap} aria-label={str(live[0]!.settings.title) || "Destaque"} data-banner-position="hero">{slide(live[0]!, 0)}</section>;
  return <div className={wrap} data-banner-position="hero"><BannerCarousel slides={live.map(slide)} autoplay={settings.autoplay === true} seconds={num(settings.interval, 6)} /></div>;
}

const DUO_RATIO: Record<string, string> = { landscape: "sm:aspect-[4/3]", portrait: "sm:aspect-[4/5]", square: "sm:aspect-square" };
/** Dois banners de apoio lado a lado (empilhados no celular). */
export function BannerDuo({ settings, blocks, ctx }: SectionProps) {
  const live = liveBlocks(blocks, { now: ctx.now ?? new Date(), page: ctx.page, categoryId: ctx.categoryId }).filter((b) => showable(b, ctx.editing)).slice(0, 2);
  if (!live.length) return null;
  return (
    <section aria-label="Banners" className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4" data-banner-position="duo">
      {live.map((b) => <Tile key={b.id} s={b.settings} ctx={ctx} className={cn("aspect-[4/3] rounded-[var(--sf-radius,16px)]", DUO_RATIO[str(settings.ratio)] ?? DUO_RATIO.landscape)}><BannerImage s={b.settings} sizes="(min-width: 640px) 50vw, 100vw" priority={false} className="transition duration-500 group-hover:scale-[1.02] motion-reduce:transition-none" /><Overlay s={b.settings} ctx={ctx} heading="h2" compact /></Tile>)}
    </section>
  );
}

const STRIP_RATIO: Record<string, string> = { sm: "md:aspect-[4/1]", md: "md:aspect-[3/1]" };
/** Faixa de campanha: uma imagem larga com texto e botão. */
export function BannerStrip({ settings, blocks, ctx }: SectionProps) {
  const b = liveBlocks(blocks, { now: ctx.now ?? new Date(), page: ctx.page, categoryId: ctx.categoryId })[0];
  if (!b || (!showable(b, ctx.editing) && !str(b.settings.title))) return null;
  return <section aria-label={str(b.settings.title) || "Campanha"} className="mt-8" data-banner-position="strip"><Tile s={b.settings} ctx={ctx} className={cn("aspect-[3/2] rounded-[var(--sf-radius,16px)]", STRIP_RATIO[str(settings.height)] ?? STRIP_RATIO.sm)}><BannerImage s={b.settings} sizes="100vw" priority={false} /><Overlay s={b.settings} ctx={ctx} heading="h2" compact /></Tile></section>;
}

/** Mosaico (N3+): uma peça grande e menores, em grade assimétrica. */
export function BannerMosaic({ settings, blocks, ctx }: SectionProps) {
  const live = liveBlocks(blocks, { now: ctx.now ?? new Date(), page: ctx.page, categoryId: ctx.categoryId }).filter((b) => showable(b, ctx.editing));
  if (!live.length) return null;
  const layout = str(settings.layout) || "1-2"; const big = layout !== "2-2";
  return (
    <section aria-label={str(settings.heading) || "Mosaico de banners"} className="mt-10" data-banner-position="mosaic">
      {str(settings.heading) ? <h2 className="mb-4 text-xl font-semibold tracking-tight sm:text-2xl">{str(settings.heading)}</h2> : null}
      <div className={cn("grid grid-cols-2 gap-3 sm:gap-4", big ? (layout === "1-4" ? "md:grid-cols-4" : "md:grid-cols-[1.2fr_1fr]") : "md:grid-cols-4")}>
        {live.map((b, k) => {
          const isBig = big && k === 0;
          return <Tile key={b.id} s={b.settings} ctx={ctx} className={cn("rounded-[var(--sf-radius,16px)]", isBig ? cn("col-span-2 aspect-[4/5] sm:aspect-[16/10] md:aspect-auto", layout === "1-4" ? "md:col-span-2 md:row-span-2" : "md:col-span-1 md:row-span-2") : "aspect-square", !isBig && layout === "1-2" && "md:aspect-[16/10]")}><BannerImage s={b.settings} sizes={isBig ? "(min-width: 768px) 55vw, 100vw" : "(min-width: 768px) 25vw, 50vw"} priority={false} className="transition duration-500 group-hover:scale-[1.02] motion-reduce:transition-none" /><Overlay s={b.settings} ctx={ctx} heading="h3" compact /></Tile>;
        })}
      </div>
    </section>
  );
}
