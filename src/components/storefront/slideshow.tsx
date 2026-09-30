"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Slide = { id: string; bg: string; heading: string; text: string; ctaLabel: string; ctaHref: string; align: "left" | "center" | "right"; light: boolean };
const HEIGHTS = { sm: "min-h-[260px]", md: "min-h-[400px]", lg: "min-h-[540px]", full: "min-h-[calc(100dvh-8rem)]" } as const;
const ALIGN = { left: "items-start text-left", center: "items-center text-center", right: "items-end text-right" } as const;

/** Slides que se alternam com fade. Automático (pausa com o mouse, o foco e com "reduzir movimento"), setas e pontos. */
export function Slideshow({ slides, autoplay, seconds, height, dots, arrows, fullWidth, firstHeading }: { slides: Slide[]; autoplay: boolean; seconds: number; height: keyof typeof HEIGHTS; dots: boolean; arrows: boolean; fullWidth: boolean; firstHeading: boolean }) {
  const [i, setI] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const n = slides.length;
  React.useEffect(() => {
    if (!autoplay || paused || n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), seconds * 1000);
    return () => clearInterval(t);
  }, [autoplay, paused, n, seconds]);
  if (n === 0) return null;
  const go = (d: number) => setI((x) => (x + d + n) % n);
  return (
    <section aria-roledescription="carrossel" aria-label="Destaques" className={cn("relative mt-6 overflow-hidden", fullWidth ? "left-1/2 w-screen -translate-x-1/2" : "rounded-[var(--sf-radius,16px)]", HEIGHTS[height])} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
      {slides.map((s, k) => {
        const H = (firstHeading && k === 0 ? "h1" : "h2") as "h1" | "h2";
        return (
          <div key={s.id} role="group" aria-roledescription="slide" aria-label={`${k + 1} de ${n}`} aria-hidden={k !== i} className={cn("absolute inset-0 transition-opacity duration-700", k === i ? "opacity-100" : "pointer-events-none opacity-0")} style={{ background: s.bg }}>
            <div className="absolute inset-0 bg-black/35" aria-hidden />
            <div className={cn("relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col justify-center gap-4 px-6 py-12 sm:px-14", ALIGN[s.align], s.light ? "text-white" : "text-neutral-900")}>
              <H className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">{s.heading}</H>
              {s.text ? <p className="max-w-xl text-base opacity-90 sm:text-lg">{s.text}</p> : null}
              {s.ctaLabel ? <Link tabIndex={k === i ? 0 : -1} href={s.ctaHref} className="sf-btn mt-2 inline-flex h-12 items-center rounded-lg px-6 text-sm font-medium transition hover:brightness-95" style={{ background: "var(--sf-accent)", color: "var(--sf-on-accent)" }}>{s.ctaLabel}</Link> : null}
            </div>
          </div>
        );
      })}
      {arrows && n > 1 ? <>
        <button type="button" onClick={() => go(-1)} aria-label="Slide anterior" className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/85 p-2 text-neutral-900 shadow hover:bg-white"><ChevronLeft className="size-5" aria-hidden /></button>
        <button type="button" onClick={() => go(1)} aria-label="Próximo slide" className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/85 p-2 text-neutral-900 shadow hover:bg-white"><ChevronRight className="size-5" aria-hidden /></button>
      </> : null}
      {dots && n > 1 ? <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-2" role="group" aria-label="Escolher slide">{slides.map((s, k) => <button key={s.id} type="button" onClick={() => setI(k)} aria-label={`Ir para o slide ${k + 1}`} aria-current={k === i} className={cn("h-2 rounded-full transition-all", k === i ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white/80")} />)}</div> : null}
    </section>
  );
}
