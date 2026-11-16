"use client";
import { useEffect } from "react";

/** Conta a visita depois que a página abriu (nunca atrasa a página). */
export function ContarVisita({ slug, utm }: { slug: string; utm: string }) {
  useEffect(() => {
    try {
      const corpo = JSON.stringify({ ref: document.referrer, utm });
      if (navigator.sendBeacon) navigator.sendBeacon(`/api/academia/${slug}/visita`, new Blob([corpo], { type: "application/json" }));
      else void fetch(`/api/academia/${slug}/visita`, { method: "POST", body: corpo, keepalive: true, headers: { "content-type": "application/json" } });
    } catch { /* nada */ }
  }, [slug, utm]);
  return null;
}
