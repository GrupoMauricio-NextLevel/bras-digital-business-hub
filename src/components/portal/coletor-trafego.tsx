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

function enviar(t: Tipo, extra: { s?: string; r?: string; d?: Record<string, string | number> } = {}) {
  if (!permitido()) return;
  const corpo = JSON.stringify({ t, p: location.pathname, ...extra });
  try {
    if (navigator.sendBeacon?.(new URL("/api/t", location.origin), new Blob([corpo], { type: "text/plain" }))) return;
  } catch { /* segue para o fetch */ }
  void fetch("/api/t", { method: "POST", body: corpo, keepalive: true, headers: { "content-type": "text/plain" } }).catch(() => undefined);
}

type NavegadorComDicas = Navigator & {
  userAgentData?: { getHighEntropyValues?: (k: string[]) => Promise<{ model?: string; platformVersion?: string }> };
  connection?: { effectiveType?: string; type?: string };
};
let dicas: Promise<{ m?: string; pv?: string }> | null = null;
/** Tela, idioma, rede e, no Android com Chrome, o modelo e a versão real do sistema (dicas do próprio navegador). */
async function detalhes(): Promise<Record<string, string | number>> {
  const n = navigator as NavegadorComDicas;
  dicas ??= (async () => {
    try {
      const v = await Promise.race([n.userAgentData?.getHighEntropyValues?.(["model", "platformVersion"]), new Promise<undefined>((r) => setTimeout(() => r(undefined), 300))]);
      return { ...(v?.model ? { m: v.model } : {}), ...(v?.platformVersion ? { pv: v.platformVersion } : {}) };
    } catch { return {}; }
  })();
  const rede = n.connection?.type === "wifi" ? "wifi" : n.connection?.effectiveType;
  return { w: screen.width, h: screen.height, l: navigator.language, ...(rede ? { rede } : {}), ...(await dicas) };
}

/**
 * Código da visita na mensagem pronta do WhatsApp (TR3, D293): a equipe cola o código no Comercial e o contato herda a
 * origem (anúncio, campanha, cidade). Só se a medição foi permitida; não muda links que já têm o código.
 */
function comCodigo(a: HTMLAnchorElement, u: URL) {
  if (!permitido()) return;
  const cv = document.cookie.split("; ").find((c) => c.startsWith("nl-cv="))?.slice(6);
  if (!cv || !/^[A-HJ-NP-Z2-9]{5}$/.test(cv)) return;
  const texto = u.searchParams.get("text") ?? "Olá!";
  if (/c[óo]digo [A-Z0-9]{5}/i.test(texto)) return;
  u.searchParams.set("text", `${texto} (código ${cv})`);
  a.href = u.toString();
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
    const r = primeira.current ? document.referrer : undefined;
    primeira.current = false;
    void detalhes().then((d) => enviar("PAGE_VIEW", { s: location.search, r, d }));
  }, [caminho]);

  React.useEffect(() => {
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") enviar("PING"); }, 30_000);
    const clique = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a?.href) return;
      let u: URL; try { u = new URL(a.href, location.href); } catch { return; }
      if (/(^|\.)(wa\.me|whatsapp\.com)$/.test(u.hostname)) { comCodigo(a, u); enviar("CLIQUE_WHATSAPP"); }
      else if (CADASTRO.test(u.pathname)) enviar("INICIO_CADASTRO");
    };
    document.addEventListener("click", clique, { capture: true });
    return () => { window.clearInterval(timer); document.removeEventListener("click", clique, { capture: true }); };
  }, []);
  return null;
}
