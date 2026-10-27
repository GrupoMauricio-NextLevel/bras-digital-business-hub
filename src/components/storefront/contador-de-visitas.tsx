"use client";
import * as React from "react";
import { usePathname } from "next/navigation";

/** Guarda a campanha da chegada (utm) para o checkout levar ao pedido (D185). */
export const CHAVE_UTM = "nl_utm";

/**
 * Avisa a visita depois que a página abriu (D185): `sendBeacon` não segura a navegação nem a página. Não conta dentro do
 * editor de tema (página dentro de outra) nem na prévia de tema.
 */
export function ContadorDeVisitas({ slug }: { slug: string }) {
  const caminho = usePathname();
  React.useEffect(() => {
    try {
      if (window.self !== window.top) return;
      const q = new URLSearchParams(window.location.search);
      if (q.has("preview") || q.has("tema") || q.has("theme")) return;
      const utm = { source: q.get("utm_source") ?? undefined, medium: q.get("utm_medium") ?? undefined, campaign: q.get("utm_campaign") ?? undefined };
      if (utm.source) { try { sessionStorage.setItem(CHAVE_UTM, JSON.stringify(utm)); } catch { /* sem armazenamento: segue sem campanha */ } }
      const corpo = JSON.stringify({ caminho, ref: document.referrer || undefined, utm: utm.source });
      const url = `/api/v/${encodeURIComponent(slug)}`;
      if (!navigator.sendBeacon?.(url, new Blob([corpo], { type: "application/json" }))) void fetch(url, { method: "POST", body: corpo, keepalive: true, headers: { "content-type": "application/json" } });
    } catch { /* a contagem nunca atrapalha a loja */ }
  }, [caminho, slug]);
  return null;
}

/** Campanha guardada na chegada (ou nada). */
export function utmGuardada(): { source?: string; medium?: string; campaign?: string } | undefined {
  try { const v = sessionStorage.getItem(CHAVE_UTM); return v ? JSON.parse(v) : undefined; } catch { return undefined; }
}
