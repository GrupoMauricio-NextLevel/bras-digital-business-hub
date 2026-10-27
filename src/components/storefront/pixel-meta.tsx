"use client";
import * as React from "react";
import { usePathname } from "next/navigation";

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
declare global { interface Window { fbq?: Fbq; _fbq?: Fbq } }

/** Evento do Pixel da Meta, se a loja tiver pixel (D187). Nunca quebra a loja. */
export function eventoMeta(nome: "AddToCart" | "Purchase" | "ViewContent" | "InitiateCheckout", dados?: Record<string, unknown>, eventID?: string) {
  try { window.fbq?.("track", nome, dados ?? {}, eventID ? { eventID } : undefined); } catch { /* sem pixel */ }
}

/** Pixel da Meta da loja (D187): carrega o código oficial da Meta e conta página vista e produto visto. */
export function PixelMeta({ pixelId }: { pixelId: string }) {
  const caminho = usePathname();
  React.useEffect(() => {
    if (window.fbq) return;
    const f: Fbq = function (...args: unknown[]) { if (f.callMethod) f.callMethod(...args); else f.queue!.push(args); } as Fbq;
    f.queue = []; f.loaded = true; f.version = "2.0"; f.push = f;
    window.fbq = f; window._fbq = f;
    const s = document.createElement("script"); s.async = true; s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
    f("init", pixelId);
  }, [pixelId]);
  React.useEffect(() => {
    try { window.fbq?.("track", "PageView"); if (/\/product\//.test(caminho)) window.fbq?.("track", "ViewContent"); } catch { /* sem pixel */ }
  }, [caminho]);
  return null;
}

/** Compra confirmada na página do pedido (D187): o mesmo número do pedido vai para o servidor, então a Meta não conta duas vezes. */
export function CompraMeta({ orderId, valorCents }: { orderId: string; valorCents: number }) {
  React.useEffect(() => {
    const chave = `nl-meta-compra:${orderId}`;
    try { if (sessionStorage.getItem(chave)) return; sessionStorage.setItem(chave, "1"); } catch { /* segue */ }
    eventoMeta("Purchase", { currency: "BRL", value: valorCents / 100 }, orderId);
  }, [orderId, valorCents]);
  return null;
}
