"use client";
import Link from "next/link";
import * as React from "react";
import { Check } from "lucide-react";
import { BrowserFrame, StoreMock } from "./store-mock";
import type { DemoStore } from "./demo-stores";

export type GalleryTheme = { key: string; name: string; priceLabel: string; tagline: string; features: string[] };

/** Três lojas de demonstração em segmentos diferentes. Trocar de aba é a única interação; sem rotação automática. */
export function StoreGallery({ stores, themes, ctaHref }: { stores: DemoStore[]; themes: Record<string, GalleryTheme>; ctaHref: string }) {
  const [i, setI] = React.useState(0);
  const s = stores[i]!;
  const t = themes[s.theme];
  const tabs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, n: number) => {
    const next = e.key === "ArrowRight" ? (n + 1) % stores.length : e.key === "ArrowLeft" ? (n - 1 + stores.length) % stores.length : -1;
    if (next >= 0) { e.preventDefault(); setI(next); tabs.current[next]?.focus(); }
  };
  return (
    <div>
      <div role="tablist" aria-label="Lojas de exemplo" className="flex flex-wrap gap-x-5 gap-y-1 border-b sm:gap-x-8 border-[var(--ec-gelo)]/20">
        {stores.map((x, n) => (
          <button key={x.key} ref={(el) => { tabs.current[n] = el; }} role="tab" id={`tab-${x.key}`} aria-selected={n === i} aria-controls="painel-loja" tabIndex={n === i ? 0 : -1} type="button" onClick={() => setI(n)} onKeyDown={(e) => onKey(e, n)}
            className={`-mb-px border-b-2 py-3 text-left text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent)] ${n === i ? "border-[var(--ds-accent)] text-[var(--ec-gelo)]" : "border-transparent text-[var(--ec-gelo)]/65 hover:text-[var(--ec-gelo)]"}`}>
            {x.segment}
          </button>
        ))}
      </div>
      <div id="painel-loja" role="tabpanel" aria-labelledby={`tab-${s.key}`} className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <BrowserFrame label={`Loja de demonstração: ${s.name}. Nomes, produtos e preços fictícios.`}><StoreMock store={s} /></BrowserFrame>
        {t ? (
          <div className="text-[var(--ec-gelo)]">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--ds-accent)]">Tema {t.name} · {t.priceLabel}</p>
            <h3 className="mt-2 font-[family-name:var(--nl-font-display)] text-2xl font-extrabold leading-tight">{s.name}: {s.tagline.toLowerCase()}</h3>
            <p className="mt-3 text-[var(--ec-gelo)]/80">{t.tagline}. Esta loja de exemplo usa o estilo do tema {t.name}.</p>
            <ul className="mt-5 space-y-2.5">{t.features.map((f) => <li key={f} className="flex gap-2.5 text-[15px] text-[var(--ec-gelo)]/90"><Check className="mt-0.5 size-4 shrink-0 text-[var(--ds-accent)]" aria-hidden />{f}</li>)}</ul>
            <Link href={ctaHref} className="mt-7 inline-flex h-11 items-center rounded-md border border-[var(--ec-gelo)]/45 px-5 text-sm font-semibold text-[var(--ec-gelo)] hover:bg-[var(--ec-gelo)]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent)]">Quero uma loja assim</Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
