"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import type { IntegracoesLoja } from "@/lib/domain/integracoes-tipos";

/**
 * Integrações só de configuração na loja publicada (Rodada A, D189): Google Analytics 4, Tag Manager, Google Ads,
 * TikTok, Pinterest e chat. Os scripts são os oficiais de cada parceiro, escritos por nós; da loja vem só o código.
 */
type Fila = ((...args: unknown[]) => void) & { queue?: unknown[]; q?: unknown[] };
type TikTok = { page: () => void; track: (n: string, d?: Record<string, unknown>, o?: Record<string, unknown>) => void; load: (id: string) => void; _i?: Record<string, unknown>; methods?: string[] } & Record<string, unknown>;
declare global { interface Window { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; ttq?: TikTok; pintrk?: Fila; Tawk_API?: unknown } }

function script(src: string, id: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script"); s.async = true; s.src = src; s.id = id; document.head.appendChild(s);
}

export function IntegracoesNaLoja({ cfg }: { cfg: IntegracoesLoja }) {
  const caminho = usePathname();
  const primeira = React.useRef(true);
  React.useEffect(() => {
    try {
      // Google (Analytics 4 e Ads usam o mesmo gtag.js).
      const gIds = [cfg.ga4, cfg.googleAds?.id].filter(Boolean) as string[];
      if (gIds.length && !window.gtag) {
        window.dataLayer = window.dataLayer ?? [];
        window.gtag = function gtag() { window.dataLayer!.push(arguments); }; // eslint-disable-line prefer-rest-params
        window.gtag("js", new Date());
        for (const id of gIds) window.gtag("config", id);
        script(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gIds[0]!)}`, "nl-gtag");
      }
      if (cfg.gtm && !document.getElementById("nl-gtm")) {
        window.dataLayer = window.dataLayer ?? [];
        window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
        script(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(cfg.gtm)}`, "nl-gtm");
      }
      if (cfg.tiktokPixel && !window.ttq) {
        const q: unknown[] = [];
        const t = { _q: q } as unknown as TikTok;
        for (const m of ["page", "track", "identify", "load"]) (t as Record<string, unknown>)[m] = (...a: unknown[]) => q.push([m, ...a]);
        window.ttq = t;
        script(`https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${encodeURIComponent(cfg.tiktokPixel)}&lib=ttq`, "nl-tiktok");
      }
      if (cfg.pinterestTag && !window.pintrk) {
        const p: Fila = function (...a: unknown[]) { p.queue!.push(Array.prototype.slice.call(a)); } as Fila;
        p.queue = []; window.pintrk = p;
        script("https://s.pinimg.com/ct/core.js", "nl-pinterest");
        p("load", cfg.pinterestTag);
      }
      if (cfg.chat?.provedor === "TAWK") script(`https://embed.tawk.to/${cfg.chat.id}`, "nl-chat");
      if (cfg.chat?.provedor === "JIVO") script(`https://code.jivosite.com/widget/${encodeURIComponent(cfg.chat.id)}`, "nl-chat");
    } catch { /* integração nunca quebra a loja */ }
  }, [cfg]);
  React.useEffect(() => {
    try {
      if (!primeira.current) window.gtag?.("event", "page_view", { page_path: caminho });
      primeira.current = false;
      window.ttq?.page();
      window.pintrk?.("page");
      if (/\/product\//.test(caminho)) { window.gtag?.("event", "view_item"); window.ttq?.track("ViewContent"); }
    } catch { /* idem */ }
  }, [caminho]);
  return null;
}

/** Eventos para as redes do Google, TikTok e Pinterest (a Meta continua em `pixel-meta.tsx`). Nunca lança. */
export function eventoRedes(nome: "AddToCart" | "Purchase", dados: { value: number; currency: "BRL"; orderId?: string; adsSendTo?: string }) {
  try {
    if (nome === "AddToCart") {
      window.gtag?.("event", "add_to_cart", { currency: dados.currency, value: dados.value });
      window.ttq?.track("AddToCart", { currency: dados.currency, value: dados.value });
      window.pintrk?.("track", "addtocart", { currency: dados.currency, value: dados.value });
    } else {
      window.gtag?.("event", "purchase", { transaction_id: dados.orderId, currency: dados.currency, value: dados.value });
      if (dados.adsSendTo) window.gtag?.("event", "conversion", { send_to: dados.adsSendTo, transaction_id: dados.orderId, currency: dados.currency, value: dados.value });
      window.ttq?.track("CompletePayment", { currency: dados.currency, value: dados.value }, dados.orderId ? { event_id: dados.orderId } : undefined);
      window.pintrk?.("track", "checkout", { currency: dados.currency, value: dados.value, order_id: dados.orderId });
    }
  } catch { /* sem redes */ }
}
