"use client";
import * as React from "react";
import Link from "next/link";
import { Flame, Lock, Package, Play, ShoppingBag, Star } from "lucide-react";
import { formatBRL } from "@/lib/money";

/**
 * Cartão de uma descoberta (D95): o Shorts com fachada leve (até o clique só carrega a miniatura, sem o player do YouTube),
 * o sinal de tendência (público) e, para o membro, veredito, nota e preço da caixa. A importadora nunca aparece aqui.
 */
export function BrasVideoCard({ youtubeId, title, summary, buy, tone = "dark", offer, trendSignal, verdict, score }: {
  youtubeId: string; title: string; summary?: string | null;
  /** Só chega aqui para membro ativo (a fronteira de dados filtra no servidor). */
  offer?: { priceBoxCents: number; unitsPerBox: number; boxesAvailable: number | null } | null;
  trendSignal?: string | null;
  verdict?: string | null;
  score?: number | null;
  buy: { href: string; label: string; external?: boolean; note?: string };
  tone?: "dark" | "light";
}) {
  const [playing, setPlaying] = React.useState(false);
  const dark = tone === "dark";
  const btn = "bd-btn bd-btn--fogo w-full !min-h-11 !px-3 !text-sm sm:!min-h-12 sm:!text-base";
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
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 size-full focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-[#fb8342]" aria-label={`Assistir a descoberta: ${title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura servida pelo próprio YouTube */}
            <img src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" className="size-full object-cover opacity-90 transition group-hover:opacity-100" />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />
            {trendSignal ? <span className="absolute left-2.5 top-2.5 inline-flex max-w-[calc(100%-1.25rem)] items-center gap-1 truncate rounded-full bg-[#fb8342] px-2.5 py-1 text-[11px] font-bold text-[#101b34] sm:text-xs"><Flame className="size-3.5 shrink-0" aria-hidden />{trendSignal}</span> : null}
            <span aria-hidden className="absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#fb8342] text-[#101b34] shadow-lg transition group-hover:scale-105 sm:size-16"><Play className="ml-1 size-5 fill-current sm:size-7" /></span>
            <span className="absolute bottom-2.5 left-2.5 right-2.5 text-left text-sm font-bold leading-snug text-white sm:bottom-3 sm:left-3 sm:right-3 sm:text-base">{title}</span>
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-2.5 sm:gap-3 sm:p-4">
        {summary ? <p className={`hidden text-sm leading-relaxed sm:block ${dark ? "text-[var(--bd-tinta-suave)]" : "text-muted-foreground"}`}>{summary}</p> : null}
        {verdict || score != null ? (
          <p className="flex items-start gap-1.5 text-xs font-semibold sm:text-sm">
            {score != null ? <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-[var(--bd-navy)] px-1.5 py-0.5 text-white tabular-nums"><Star className="size-3 fill-current text-[#fb8342]" aria-hidden />{score}/10</span> : null}
            {verdict ? <span className="line-clamp-2">{verdict}</span> : null}
          </p>
        ) : null}
        {offer ? (
          <div className={`mt-auto rounded-xl px-2.5 py-2 sm:px-3 ${dark ? "bg-black/25" : "bg-surface-muted"}`}>
            <p className="text-lg font-extrabold leading-tight tabular-nums sm:text-xl">{formatBRL(offer.priceBoxCents)}<span className="ml-1 text-xs font-semibold opacity-75">a caixa</span></p>
            <p className="mt-0.5 text-xs font-medium opacity-80">{offer.unitsPerBox} un. por caixa · {formatBRL(Math.round(offer.priceBoxCents / offer.unitsPerBox))}/un.</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold"><Package className="size-3.5 shrink-0" aria-hidden />{offer.boxesAvailable == null ? "Caixas: consultar" : offer.boxesAvailable === 0 ? "Sem caixas agora" : `${offer.boxesAvailable} caixa${offer.boxesAvailable === 1 ? "" : "s"} disponíve${offer.boxesAvailable === 1 ? "l" : "is"}`}</p>
          </div>
        ) : (
          <p className={`mt-auto flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold sm:px-3 sm:text-sm ${dark ? "bg-black/25" : "bg-surface-muted"}`}>
            <Lock className="size-4 shrink-0" aria-hidden />{buy.note ?? "Análise de mercado e preço da caixa: só para membros"}
          </p>
        )}
        {buy.external
          ? <a href={buy.href} target="_blank" rel="noreferrer" className={btn}><ShoppingBag className="size-4 sm:size-5" aria-hidden />{buy.label}<span className="sr-only"> ({title})</span></a>
          : <Link href={buy.href} className={btn}><ShoppingBag className="size-4 sm:size-5" aria-hidden />{buy.label}<span className="sr-only"> ({title})</span></Link>}
      </div>
    </article>
  );
}

/** Player horizontal (16:9) com fachada: análise completa ou trecho. */
export function BrasWidePlayer({ youtubeId, title, label }: { youtubeId: string; title: string; label: string }) {
  const [playing, setPlaying] = React.useState(false);
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      {playing ? (
        <iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="absolute inset-0 size-full border-0" />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 size-full focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-[#fb8342]" aria-label={`${label}: ${title}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- miniatura servida pelo próprio YouTube */}
          <img src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" className="size-full object-cover opacity-90 transition group-hover:opacity-100" />
          <span aria-hidden className="absolute inset-0 bg-black/30" />
          <span aria-hidden className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#fb8342] text-[#101b34] shadow-lg transition group-hover:scale-105"><Play className="ml-1 size-7 fill-current" /></span>
          <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">{label}</span>
        </button>
      )}
    </div>
  );
}
