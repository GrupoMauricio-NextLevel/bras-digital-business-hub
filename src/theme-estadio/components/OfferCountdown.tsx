"use client";

import * as React from "react";

function toClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function OfferCountdown({ endsAt }: { endsAt: string }) {
  const [left, setLeft] = React.useState(() => new Date(endsAt).getTime() - Date.now());
  React.useEffect(() => {
    const id = window.setInterval(() => setLeft(new Date(endsAt).getTime() - Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);
  return (
    <div className="stadium-card flex items-center justify-between gap-3 p-4" role="status" aria-live="polite">
      <div>
        <p className="stadium-title text-lg">Oferta de hoje</p>
        <p className="text-sm text-[var(--stadium-muted)]">Condição especial enquanto o cronômetro estiver ativo.</p>
      </div>
      <div className="rounded-lg bg-black/20 px-3 py-2 text-xl font-bold tabular-nums">{toClock(left)}</div>
    </div>
  );
}
