import * as React from "react";
import { preload } from "react-dom";
import Link from "next/link";
import { ImmersiveScroll, LayerMotion } from "@/components/storefront/hero-motion";
import { WelcomeCouponDialog } from "@/components/storefront/welcome-coupon";
import { avifOf } from "@/lib/themes/avif";
import { resolveLink } from "@/lib/themes/template";
import { cn } from "@/lib/utils";
import { BannerImage, Emph } from "./banners";
import type { SectionProps } from "./types";

/**
 * Banners que organizam a navegação (D88): destaque em camadas (N3), destaque imersivo (N4), cartões de navegação,
 * banner da categoria e cupom de boas-vindas. Texto sempre escrito pelo sistema (nunca dentro da imagem).
 */
type S = SectionProps["settings"];
const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);

/** Imagem com fonte AVIF quando o acervo tem uma; sem ela, a imagem como está. */
function Pic({ src, alt, className, priority = false, sizes }: { src: string; alt: string; className?: string; priority?: boolean; sizes?: string }) {
  const avif = avifOf(src);
  return (
    <picture className="contents">
      {avif ? <source type="image/avif" srcSet={avif} /> : null}
      <img src={src} alt={alt} sizes={sizes} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={className} />
    </picture>
  );
}

/** Texto do destaque: linha de chamada, título com destaque, apoio, dois botões e microtexto. */
function HeroCopy({ s, ctx, heading, className, title }: { s: S; ctx: SectionProps["ctx"]; heading: "h1" | "h2"; className?: string; title?: string }) {
  const H = heading; const light = s.textColor !== "dark";
  const t = title ?? str(s.title); const cta = str(s.ctaLabel); const second = str(s.secondaryLabel);
  return (
    <div className={cn("flex max-w-[34rem] flex-col items-start gap-3", light ? "sf-on-image text-white" : "text-neutral-950", className)}>
      {str(s.eyebrow) ? <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-90">{str(s.eyebrow)}</p> : null}
      {t ? <H className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"><Emph text={t} /></H> : null}
      {str(s.subtitle) ? <p className="max-w-[30rem] text-base opacity-90 sm:text-lg">{str(s.subtitle)}</p> : null}
      {cta || second ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-3">
          {cta ? <Link href={resolveLink(ctx.base, str(s.link))} prefetch={false} className="sf-btn inline-flex h-12 items-center rounded-lg px-6 text-sm font-medium transition hover:brightness-95" style={{ background: "var(--sf-accent)", color: "var(--sf-on-accent)" }}>{cta}</Link> : null}
          {second ? <Link href={resolveLink(ctx.base, str(s.secondaryLink))} prefetch={false} className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4">{second}</Link> : null}
        </div>
      ) : null}
      {str(s.note) ? <p className="text-xs opacity-80">{str(s.note)}</p> : null}
    </div>
  );
}

// Véu do lado do texto: forte onde está o título, some antes do produto (legibilidade AA sobre fotos claras).
const scrim = (s: S) => {
  const a = num(s.overlay, 25) / 100;
  return s.textColor === "dark" ? `linear-gradient(90deg, rgba(255,255,255,${a + 0.45}) 0%, rgba(255,255,255,${a + 0.2}) 40%, transparent 70%)` : `linear-gradient(90deg, rgba(0,0,0,${a + 0.4}) 0%, rgba(0,0,0,${a + 0.2}) 40%, transparent 70%)`;
};
const scrimMobile = (s: S) => {
  const a = num(s.overlay, 25) / 100;
  return s.textColor === "dark" ? `linear-gradient(180deg, transparent 30%, rgba(255,255,255,${a + 0.5}) 70%)` : `linear-gradient(180deg, transparent 30%, rgba(0,0,0,${a + 0.45}) 70%)`;
};
const bgSettings = (s: S): S => ({ image: str(s.background), imageMobile: str(s.backgroundMobile), focusX: num(s.focusX, 50), focusY: num(s.focusY, 50), focusMobileX: num(s.focusX, 50), focusMobileY: num(s.focusY, 50), decorative: true });

/** Destaque em camadas (N3): fundo + produto recortado que acompanha o mouse e a rolagem. */
export function HeroLayers({ id, settings: s, ctx }: SectionProps) {
  const first = ctx.firstId === id; const cutout = str(s.cutout);
  if (!ctx.editing && !str(s.background) && !cutout && !str(s.title)) return null;
  if (first && cutout) preload(avifOf(cutout) ?? cutout, { as: "image", fetchPriority: "high", ...(avifOf(cutout) ? { type: "image/avif" } : {}) });
  return (
    <LayerMotion enabled={s.motion !== false} aria-label={str(s.title).replace(/\*/g, "") || "Destaque"} data-banner-position="hero-layers"
      className="group/lay relative left-1/2 w-screen -translate-x-1/2 overflow-hidden" style={{ background: "var(--sf-primary)" }}>
      <div className="relative aspect-[4/5] w-full sm:aspect-[4/3] md:aspect-[21/9] md:min-h-[520px]">
        <div className="absolute inset-0 will-change-transform motion-safe:[transform:translate3d(calc(var(--px,0)*-8px),calc(var(--sp,0)*40px),0)_scale(1.04)]">
          <BannerImage s={bgSettings(s)} sizes="100vw" priority={first && !cutout} />
        </div>
        <div aria-hidden className="absolute inset-0 hidden md:block" style={{ background: scrim(s) }} />
        <div aria-hidden className="absolute inset-0 md:hidden" style={{ background: scrimMobile(s) }} />
        {cutout ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[6%] flex items-end justify-center md:left-auto md:right-[4%] md:top-[8%] md:w-[46%] md:justify-end">
            <div className="h-[62%] w-full will-change-transform md:h-full motion-safe:[transform:translate3d(calc(var(--px,0)*18px),calc(var(--py,0)*12px+var(--sp,0)*-70px),0)] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out">
              <Pic src={cutout} alt={str(s.alt)} priority={first} className="h-full w-full object-contain object-bottom drop-shadow-[0_24px_40px_rgba(0,0,0,0.35)]" />
            </div>
          </div>
        ) : null}
        <div className="relative z-10 mx-auto flex h-full max-w-6xl items-end px-5 pb-8 sm:px-10 md:items-center md:pb-0">
          <HeroCopy s={s} ctx={ctx} heading={first ? "h1" : "h2"} />
        </div>
      </div>
    </LayerMotion>
  );
}

const IMM_HEIGHT: Record<number, string> = { 1: "data-[immersive=on]:h-[150svh]", 2: "data-[immersive=on]:h-[210svh]", 3: "data-[immersive=on]:h-[270svh]" };
const STEP_SHOW = ["group-data-[step=0]/imm:opacity-100 group-data-[step=0]/imm:translate-y-0", "group-data-[step=1]/imm:opacity-100 group-data-[step=1]/imm:translate-y-0", "group-data-[step=2]/imm:opacity-100 group-data-[step=2]/imm:translate-y-0"];
const DOT_ON = ["group-data-[step=0]/imm:bg-white", "group-data-[step=1]/imm:bg-white", "group-data-[step=2]/imm:bg-white"];
const FRAME_SHOW = ["group-data-[step=0]/imm:opacity-100", "group-data-[step=1]/imm:opacity-100", "group-data-[step=2]/imm:opacity-100"];

/**
 * Destaque imersivo (N4): fundo, recorte e primeiro plano em velocidades diferentes; até três quadros e três textos
 * trocados pela rolagem. A primeira dobra funciona só com o fundo (quadros e camadas carregam depois).
 */
export function HeroImmersive({ id, settings: s, blocks, ctx }: SectionProps) {
  const first = ctx.firstId === id;
  const steps = blocks.filter((b) => str(b.settings.title) || str(b.settings.subtitle)).slice(0, 3);
  const frames = [s.frame1, s.frame2, s.frame3].map(str).filter(Boolean).slice(0, Math.max(1, steps.length));
  if (!ctx.editing && !str(s.background) && !frames.length && !steps.length) return null;
  const n = Math.max(1, steps.length);
  const cutout = str(s.cutout); const fg = str(s.foreground); const light = s.textColor !== "dark";
  const shared: S = { ...s, title: "", eyebrow: "", subtitle: "" };
  return (
    <ImmersiveScroll steps={n} aria-label={steps.map((b) => str(b.settings.title).replace(/\*/g, "")).join(" ") || "Destaque"} data-banner-position="hero-immersive"
      className={cn("group/imm relative left-1/2 w-screen -translate-x-1/2", IMM_HEIGHT[n])} style={{ background: "var(--sf-primary)" }}>
      <div className="relative h-[100svh] max-h-[920px] min-h-[540px] overflow-hidden group-data-[immersive=on]/imm:sticky group-data-[immersive=on]/imm:top-0">
        <div className="absolute inset-0 will-change-transform motion-safe:[transform:translate3d(0,calc(var(--p,0)*-30px),0)_scale(calc(1.06+var(--p,0)*0.06))]">
          <BannerImage s={bgSettings(s)} sizes="100vw" priority={first} />
          {frames.map((f, k) => (
            <Pic key={k} src={f} alt="" sizes="100vw" className={cn("absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-700 motion-reduce:transition-none", FRAME_SHOW[k], frames.length === 1 && "opacity-100", "group-data-[immersive=off]/imm:opacity-0", k === frames.length - 1 && "group-data-[immersive=off]/imm:opacity-100")} />
          ))}
        </div>
        <div aria-hidden className="absolute inset-0 hidden md:block" style={{ background: scrim(s) }} />
        <div aria-hidden className="absolute inset-0 md:hidden" style={{ background: scrimMobile(s) }} />
        {cutout ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[8%] flex items-end justify-center md:left-auto md:right-[5%] md:w-[44%] md:justify-end">
            <div className="h-[58%] w-full will-change-transform md:h-[92%] motion-safe:[transform:translate3d(0,calc(var(--p,0)*-90px),0)_scale(calc(0.94+var(--p,0)*0.1))]">
              <Pic src={cutout} alt={str(s.alt)} className="h-full w-full object-contain object-bottom drop-shadow-[0_30px_50px_rgba(0,0,0,0.4)]" />
            </div>
          </div>
        ) : null}
        {fg ? <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] will-change-transform motion-safe:[transform:translate3d(0,calc(var(--p,0)*-200px),0)]"><Pic src={fg} alt="" className="h-full w-full object-cover object-bottom blur-[1px]" /></div> : null}
        <div className="relative z-10 mx-auto grid h-full max-w-6xl items-end px-5 pb-10 pt-24 sm:px-10 md:items-center md:pb-0">
          <div className="grid [&>*]:[grid-area:1/1]">
            {steps.map((b, k) => {
              const last = k === steps.length - 1;
              return (
                <div key={b.id} className={cn("flex translate-y-3 flex-col gap-3 opacity-0 transition duration-700 motion-reduce:transition-none", STEP_SHOW[k], last ? "group-data-[immersive=off]/imm:translate-y-0 group-data-[immersive=off]/imm:opacity-100" : "group-data-[immersive=off]/imm:hidden")}>
                  <HeroCopy s={{ ...shared, eyebrow: b.settings.eyebrow ?? "", subtitle: b.settings.subtitle ?? "", textColor: s.textColor ?? "light", ...(last ? {} : { ctaLabel: "", secondaryLabel: "", note: "" }) }} ctx={ctx}
                    heading={first && k === 0 ? "h1" : "h2"} title={str(b.settings.title)} className={cn(last && str(s.mobileTitle) && "max-md:[&_h1]:hidden max-md:[&_h2]:hidden")} />
                  {last && str(s.mobileTitle) ? <p className={cn("order-first text-balance text-4xl font-semibold [font-family:var(--sf-font-heading)] leading-[1.05] tracking-tight md:hidden", light ? "sf-on-image text-white" : "text-neutral-950")}><Emph text={str(s.mobileTitle)} /></p> : null}
                </div>
              );
            })}
          </div>
        </div>
        {n > 1 ? (
          <div aria-hidden className="absolute bottom-5 right-5 z-10 hidden gap-1.5 group-data-[immersive=on]/imm:flex">
            {steps.map((b, k) => <span key={b.id} className={cn("h-1 w-6 rounded-full bg-white/40 transition-colors", DOT_ON[k])} />)}
          </div>
        ) : null}
      </div>
    </ImmersiveScroll>
  );
}

/** Cartões de navegação: Novidades, Ofertas, Mais vendidos, Kits (ou "Como comprar" no atacado). */
export function NavCards({ settings, blocks, ctx }: SectionProps) {
  const cards = blocks.filter((b) => ctx.editing || str(b.settings.image) || str(b.settings.title)).slice(0, 4);
  if (!cards.length) return null;
  return (
    <section aria-label={str(settings.heading) || "Navegue pela loja"} className="mt-10" data-banner-position="nav-cards">
      {str(settings.heading) ? <h2 className="mb-4 text-xl font-semibold tracking-tight sm:text-2xl">{str(settings.heading)}</h2> : null}
      <div className={cn("grid grid-cols-2 gap-3 sm:gap-4", cards.length > 2 && "md:grid-cols-4")}>
        {cards.map((b) => {
          const s = b.settings; const href = resolveLink(ctx.base, str(s.link));
          return (
            <Link key={b.id} href={href} prefetch={false} className="group relative block aspect-[4/5] overflow-hidden rounded-[var(--sf-radius,16px)] focus-visible:outline-2 focus-visible:outline-offset-2" data-nav-card>
              <BannerImage s={{ image: str(s.image), alt: str(s.alt), decorative: !str(s.alt) }} sizes="(min-width: 768px) 25vw, 50vw" priority={false} className="transition duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" />
              {/* Sobre foto clara, o véu sobe até o título e a palavra em destaque fica branca (itálico), sem a cor de destaque. */}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 via-50% to-black/10" />
              <div className="sf-on-image absolute inset-x-0 bottom-0 flex flex-col items-start gap-1 p-4 text-white sm:p-5 [&_em]:!text-current">
                {str(s.eyebrow) ? <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-90">{str(s.eyebrow)}</p> : null}
                {str(s.title) ? <h3 className="text-lg font-semibold leading-tight sm:text-2xl"><Emph text={str(s.title)} /></h3> : null}
                {str(s.subtitle) ? <p className="hidden text-sm opacity-90 sm:block">{str(s.subtitle)}</p> : null}
                {str(s.ctaLabel) ? <span className="mt-2 inline-flex min-h-9 items-center rounded-full bg-white/95 px-4 text-xs font-semibold text-neutral-950 transition group-hover:bg-white">{str(s.ctaLabel)}</span> : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** Banner do topo da categoria: o da categoria aberta; sem categoria, o banner "geral" (categoria vazia). */
export function CategoryBanner({ blocks, ctx }: SectionProps) {
  // A categoria do banner pode ser o id (escolhida no editor) ou o endereço (temas instalados com o catálogo de exemplo).
  const open = ctx.categories.find((c) => c.id === ctx.categoryId);
  const matches = (v: string) => (open ? v === open.id || v === open.slug : v === "");
  const b = blocks.find((x) => matches(str(x.settings.category)));
  if (!b) return null;
  const s = b.settings; const cat = ctx.categories.find((c) => c.id === str(s.category) || c.slug === str(s.category));
  const title = str(s.title) || cat?.name || "Todos os produtos";
  if (!ctx.editing && !str(s.image)) return null;
  const light = s.textColor !== "dark"; const a = num(s.overlay, 25) / 100;
  return (
    <section aria-label={title.replace(/\*/g, "")} className="relative -mt-2 mb-6 overflow-hidden rounded-[var(--sf-radius,16px)]" data-banner-position="category-banner">
      <div className="relative aspect-[3/2] w-full sm:aspect-[3/1] md:aspect-[4/1]">
        <BannerImage s={{ ...s, decorative: !str(s.alt) }} sizes="(min-width: 1152px) 1152px, 100vw" priority />
        <div aria-hidden className="absolute inset-0" style={{ background: light ? `linear-gradient(90deg, rgba(0,0,0,${a + 0.3}), rgba(0,0,0,${a * 0.4}) 70%)` : `linear-gradient(90deg, rgba(255,255,255,${a + 0.4}), transparent 70%)` }} />
        <div className={cn("relative z-10 flex h-full max-w-[36rem] flex-col justify-end gap-1 p-5 sm:justify-center sm:p-8", light ? "sf-on-image text-white" : "text-neutral-950")}>
          <p className="text-2xl font-semibold leading-tight tracking-tight [font-family:var(--sf-font-heading)] sm:text-4xl"><Emph text={title} /></p>
          {str(s.subtitle) ? <p className="text-sm opacity-90 sm:text-base">{str(s.subtitle)}</p> : null}
        </div>
      </div>
    </section>
  );
}

/** Cupom de boas-vindas: só aparece com cupom válido; no editor vira um cartão na página para o lojista ver. */
export function WelcomeCoupon({ settings: s, ctx }: SectionProps) {
  if (!ctx.welcome && !ctx.editing) return null;
  const offer = ctx.welcome ?? { label: "Cupom não encontrado ou fora do prazo", minText: "Escolha um cupom ativo em Marketing › Cupons para a janela aparecer na loja." };
  return (
    <WelcomeCouponDialog slug={ctx.slug} storeId={ctx.store.id} preview={!!ctx.editing} delay={num(s.delay, 8)} trigger={str(s.trigger) === "saida" || str(s.trigger) === "tempo" ? (str(s.trigger) as "saida" | "tempo") : "ambos"}
      image={str(s.image)} imageAvif={avifOf(str(s.image)) ?? ""} alt={str(s.alt)} eyebrow={str(s.eyebrow)} title={str(s.title)} subtitle={str(s.subtitle)} ctaLabel={str(s.ctaLabel) || "Receber cupom"} note={str(s.note)} offer={offer} />
  );
}
