"use client";
import * as React from "react";
import { youtubeIdOf } from "@/lib/themes/settings";
import { useReducedMotion } from "./banner-carousel";

/**
 * Vídeo do destaque (N4): sem som, em loop, com a imagem do banner como capa. Para quem pediu menos movimento, não
 * toca: fica a imagem (o componente nem monta o vídeo). Só carrega depois da primeira pintura.
 */
export function BannerVideo({ src, poster }: { src: string; poster: string }) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { const t = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(t); }, []);
  if (!mounted || reduced) return null;
  const yt = youtubeIdOf(src);
  if (yt) return <iframe title="" aria-hidden tabIndex={-1} className="pointer-events-none absolute inset-0 z-0 h-full w-full scale-[1.35]" src={`https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&mute=1&loop=1&playlist=${yt}&controls=0&modestbranding=1&playsinline=1&rel=0`} allow="autoplay; encrypted-media" loading="lazy" />;
  return <video aria-hidden className="absolute inset-0 z-0 size-full object-cover" src={src} poster={poster || undefined} autoPlay muted loop playsInline preload="none" />;
}
