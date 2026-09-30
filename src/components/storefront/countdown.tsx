"use client";
import * as React from "react";
import Link from "next/link";

const pad = (n: number) => String(n).padStart(2, "0");

/** Contagem regressiva até `until` (AAAA-MM-DDTHH:mm, hora do visitante). Depois do prazo, mostra o texto de encerramento. */
export function Countdown({ until, heading, text, ctaLabel, ctaHref, expiredText, bg, fg }: { until: string; heading: string; text: string; ctaLabel: string; ctaHref: string; expiredText: string; bg: string; fg: string }) {
  const target = until ? new Date(until).getTime() : NaN;
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => { const first = requestAnimationFrame(() => setNow(Date.now())); const t = setInterval(() => setNow(Date.now()), 1000); return () => { cancelAnimationFrame(first); clearInterval(t); }; }, []);
  const left = now === null || Number.isNaN(target) ? null : Math.max(0, target - now);
  const expired = left === 0;
  const d = left === null ? 0 : Math.floor(left / 86_400_000), h = left === null ? 0 : Math.floor((left % 86_400_000) / 3_600_000), m = left === null ? 0 : Math.floor((left % 3_600_000) / 60_000), s = left === null ? 0 : Math.floor((left % 60_000) / 1000);
  return (
    <section className="mt-10 rounded-[var(--sf-radius,16px)] px-6 py-8 text-center sm:px-12" style={{ background: bg, color: fg }}>
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{heading}</h2>
      {text ? <p className="mt-1 text-sm opacity-85">{text}</p> : null}
      {expired ? <p className="mt-4 text-lg font-medium" role="status">{expiredText}</p> : (
        <div className="mt-4 flex justify-center gap-3" role="timer" aria-label={left === null ? "Contagem regressiva" : `${d} dias, ${h} horas, ${m} minutos e ${s} segundos restantes`}>
          {([["dias", d], ["horas", h], ["min", m], ["seg", s]] as const).map(([label, v]) => <div key={label} className="min-w-16 rounded-lg bg-white/15 px-3 py-2"><div className="text-2xl font-semibold tabular-nums" suppressHydrationWarning>{left === null ? "--" : pad(v)}</div><div className="text-[11px] uppercase tracking-wide opacity-80">{label}</div></div>)}
        </div>
      )}
      {ctaLabel && !expired ? <Link href={ctaHref} className="sf-btn mt-5 inline-flex h-11 items-center rounded-lg bg-white px-6 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100">{ctaLabel}</Link> : null}
    </section>
  );
}
