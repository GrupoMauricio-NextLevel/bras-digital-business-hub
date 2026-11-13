"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import { CONSENT_COOKIE, lerConsentimento, podeMedir } from "@/lib/trafego/consentimento";

type Tipo = "PAGE_VIEW" | "PING" | "CLIQUE_WHATSAPP" | "INICIO_CADASTRO";

function permitido(): boolean {
  try {
    const par = document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
    return podeMedir(lerConsentimento(par?.slice(CONSENT_COOKIE.length + 1)));
  } catch { return false; }
}

function enviar(t: Tipo, extra: { s?: string; r?: string } = {}) {
  if (!permitido()) return;
  const corpo = JSON.stringify({ t, p: location.pathname, ...extra });
  try {
    if (navigator.sendBeacon?.(new URL("/api/t", location.origin), new Blob([corpo], { type: "text/plain" }))) return;
  } catch { /* segue para o fetch */ }
  void fetch("/api/t", { method: "POST", body: corpo, keepalive: true, headers: { "content-type": "text/plain" } }).catch(() => undefined);
}

const CADASTRO = /^\/(cadastro|quero-minha-loja|ativar|fornecer)(\/|$)/;

/**
 * Medição própria do site (TR2, D291): sinal ao abrir cada página, "ainda aqui" a cada 30 s com a aba visível, clique no
 * WhatsApp e no cadastro. Respeita o "não" do aviso de cookies. Só nas páginas públicas das marcas (portal), nunca nas lojas.
 */
export function ColetorTrafego() {
  const caminho = usePathname();
  const primeira = React.useRef(true);

  const ultimo = React.useRef({ chave: "", em: 0 });

  React.useEffect(() => {
    // A mesma página duas vezes em menos de 2 s (efeito repetido do React, recarga dupla) conta uma vez só.
    const chave = location.pathname + location.search;
    if (ultimo.current.chave === chave && Date.now() - ultimo.current.em < 2000) return;
    ultimo.current = { chave, em: Date.now() };
    // Na primeira página manda o site de origem; nas seguintes a navegação é interna.
    enviar("PAGE_VIEW", { s: location.search, r: primeira.current ? document.referrer : undefined });
    primeira.current = false;
  }, [caminho]);

  React.useEffect(() => {
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") enviar("PING"); }, 30_000);
    const clique = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a?.href) return;
      let u: URL; try { u = new URL(a.href, location.href); } catch { return; }
      if (/(^|\.)(wa\.me|whatsapp\.com)$/.test(u.hostname)) enviar("CLIQUE_WHATSAPP");
      else if (CADASTRO.test(u.pathname)) enviar("INICIO_CADASTRO");
    };
    document.addEventListener("click", clique, { capture: true });
    return () => { window.clearInterval(timer); document.removeEventListener("click", clique, { capture: true }); };
  }, []);
  return null;
}
