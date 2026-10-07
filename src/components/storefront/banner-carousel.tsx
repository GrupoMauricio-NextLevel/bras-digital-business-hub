"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Carrossel do destaque. As imagens dos slides só entram na página quando o slide vai aparecer (o primeiro já vem do
 * servidor; o seguinte é preparado logo antes): o visitante não baixa todos os originais de uma vez.
 * Automático só se ligado; pausa no mouse, no foco do teclado, com botão próprio e para quem pediu menos movimento.
 */
export function BannerCarousel({ slides, autoplay, seconds, label = "Destaques", className }: { slides: React.ReactNode[]; autoplay: boolean; seconds: number; label?: string; className?: string }) {
  const n = slides.length;
  const [i, setI] = React.useState(0);
  const [seen, setSeen] = React.useState<Set<number>>(() => new Set([0]));
  const [paused, setPaused] = React.useState(false);
  const [stopped, setStopped] = React.useState(false);
  const reduced = useReducedMotion();
  const go = React.useCallback((k: number) => { const to = (k + n) % n; setSeen((s) => new Set([...s, to, (to + 1) % n])); setI(to); }, [n]);
  React.useEffect(() => { if (n < 2) return; const t = setTimeout(() => setSeen((s) => new Set([...s, 1 % n])), 2500); return () => clearTimeout(t); }, [n]);
  const running = autoplay && n > 1 && !paused && !stopped && !reduced;
  React.useEffect(() => { if (!running) return; const t = setInterval(() => go(i + 1), seconds * 1000); return () => clearInterval(t); }, [running, i, go, seconds]);
  const touch = React.useRef<number | null>(null);
  return (
    <section aria-roledescription="carrossel" aria-label={label} className={cn("relative overflow-hidden", className)}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => { touch.current = e.touches[0]?.clientX ?? null; }} onTouchEnd={(e) => { const x0 = touch.current; touch.current = null; const x1 = e.changedTouches[0]?.clientX; if (x0 !== null && x1 !== undefined && Math.abs(x1 - x0) > 40) go(i + (x1 < x0 ? 1 : -1)); }}>
      <div className="grid [&>*]:[grid-area:1/1]">
        {slides.map((node, k) => (
          <div key={k} role="group" aria-roledescription="slide" aria-label={`${k + 1} de ${n}`} aria-hidden={k !== i} inert={k !== i} className={cn("transition-opacity duration-700 motion-reduce:transition-none", k === i ? "opacity-100" : "pointer-events-none opacity-0")}>
            {seen.has(k) ? node : <div aria-hidden className="h-full w-full" />}
          </div>
        ))}
      </div>
      {n > 1 ? <>
        <button type="button" onClick={() => go(i - 1)} aria-label="Slide anterior" className="absolute left-3 top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow hover:bg-white sm:flex"><ChevronLeft className="size-5" aria-hidden /></button>
        <button type="button" onClick={() => go(i + 1)} aria-label="Próximo slide" className="absolute right-3 top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow hover:bg-white sm:flex"><ChevronRight className="size-5" aria-hidden /></button>
        <div className="absolute inset-x-0 bottom-2 z-20 flex items-center justify-center gap-1" role="group" aria-label="Escolher slide">
          {autoplay && !reduced ? <button type="button" onClick={() => setStopped((v) => !v)} aria-label={stopped ? "Retomar a troca automática" : "Pausar a troca automática"} className="flex size-9 items-center justify-center rounded-full text-white">{stopped ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}</button> : null}
          {slides.map((_, k) => <button key={k} type="button" onClick={() => go(k)} aria-label={`Ir para o slide ${k + 1}`} aria-current={k === i} className="flex h-9 min-w-9 items-center justify-center"><span className={cn("block h-2 rounded-full shadow transition-all", k === i ? "w-6 bg-white" : "w-2 bg-white/70")} /></button>)}
        </div>
      </> : null}
    </section>
  );
}

const QUERY = "(prefers-reduced-motion: reduce)";
/** Preferência do visitante por menos movimento (no servidor, considera que não). */
export function useReducedMotion(): boolean {
  return React.useSyncExternalStore((cb) => { const m = window.matchMedia(QUERY); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); }, () => window.matchMedia(QUERY).matches, () => false);
}
