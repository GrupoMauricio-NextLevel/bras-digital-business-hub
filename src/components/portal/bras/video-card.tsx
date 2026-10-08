"use client";
import * as React from "react";
import Link from "next/link";
import { Lock, Package, Play, ShoppingBag } from "lucide-react";
import { formatBRL } from "@/lib/money";

/**
 * Vídeo de análise do YouTube com fachada leve: até o clique só carrega a miniatura (sem o player de ~1 MB do YouTube).
 * Embaixo, o preço trancado e o botão de compra, que leva ao cadastro (ou à ação que a área do membro passar em `buy`).
 */
export function BrasVideoCard({ youtubeId, title, summary, buy, tone = "dark", offer }: {
  youtubeId: string; title: string; summary?: string | null;
  /** Só chega aqui para membro ativo (a fronteira de dados filtra no servidor). */
  offer?: { priceBoxCents: number; unitsPerBox: number; boxesAvailable: number | null; importerName: string } | null;
  buy: { href: string; label: string; external?: boolean; note?: string };
  tone?: "dark" | "light";
}) {
  const [playing, setPlaying] = React.useState(false);
  const dark = tone === "dark";
  return (
    <article className={`flex h-full flex-col overflow-hidden rounded-[18px] sm:rounded-[22px] ${dark ? "bg-[var(--bd-navy-2)] text-[var(--bd-tinta-clara)]" : "border border-border bg-surface text-foreground"}`}>
      <div className="relative aspect-[9/16] w-full bg-black">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 size-full focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-[#fb8342]" aria-label={`Assistir: ${title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura servida pelo próprio YouTube */}
            <img src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" className="size-full object-cover opacity-90 transition group-hover:opacity-100" />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <span aria-hidden className="absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 sm:size-16 items-center justify-center rounded-full bg-[#fb8342] text-[#101b34] shadow-lg transition group-hover:scale-105"><Play className="ml-1 size-5 fill-current sm:size-7" /></span>
            <span className="absolute bottom-2.5 left-2.5 right-2.5 text-left text-sm font-bold leading-snug text-white sm:bottom-3 sm:left-3 sm:right-3 sm:text-base">{title}</span>
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-2.5 sm:gap-3 sm:p-4">
        {summary ? <p className={`hidden text-sm leading-relaxed sm:block ${dark ? "text-[var(--bd-tinta-suave)]" : "text-muted-foreground"}`}>{summary}</p> : null}
        {offer ? (
          <div className={`mt-auto rounded-xl px-2.5 py-2 sm:px-3 ${dark ? "bg-black/25" : "bg-surface-muted"}`}>
            <p className="text-lg font-extrabold leading-tight tabular-nums sm:text-xl">{formatBRL(offer.priceBoxCents)}<span className="ml-1 text-xs font-semibold opacity-75">a caixa</span></p>
            <p className="mt-0.5 text-xs font-medium opacity-80">{offer.unitsPerBox} un. por caixa · {formatBRL(Math.round(offer.priceBoxCents / offer.unitsPerBox))}/un.</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold"><Package className="size-3.5 shrink-0" aria-hidden />{offer.boxesAvailable == null ? "Caixas: consultar" : offer.boxesAvailable === 0 ? "Sem caixas agora" : `${offer.boxesAvailable} caixa${offer.boxesAvailable === 1 ? "" : "s"} disponíve${offer.boxesAvailable === 1 ? "l" : "is"}`}</p>
            <p className="mt-0.5 truncate text-xs opacity-70">{offer.importerName}</p>
          </div>
        ) : (
          <p className={`mt-auto flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold sm:px-3 sm:text-sm ${dark ? "bg-black/25" : "bg-surface-muted"}`}>
            <Lock className="size-4 shrink-0" aria-hidden />{buy.note ?? "Preço e estoque em caixas: só para membros"}
          </p>
        )}
        {buy.external
          ? <a href={buy.href} target="_blank" rel="noreferrer" className="bd-btn bd-btn--fogo w-full !min-h-11 !px-3 !text-sm sm:!min-h-12 sm:!text-base"><ShoppingBag className="size-4 sm:size-5" aria-hidden />{buy.label}<span className="sr-only"> ({title})</span></a>
          : <Link href={buy.href} className="bd-btn bd-btn--fogo w-full !min-h-11 !px-3 !text-sm sm:!min-h-12 sm:!text-base"><ShoppingBag className="size-4 sm:size-5" aria-hidden />{buy.label}<span className="sr-only"> ({title})</span></Link>}
      </div>
    </article>
  );
}
