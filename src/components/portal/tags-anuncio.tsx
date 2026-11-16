"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import type { ConfigTagsNavegador } from "@/lib/domain/trafego/tags";
import { CONSENT_COOKIE, lerConsentimento, podeAnunciar } from "@/lib/trafego/consentimento";
import { EVENTO_CONSENTIMENTO } from "./aviso-cookies";

type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
type Janela = Window & { fbq?: Fbq; _fbq?: Fbq; dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; __nlTags?: ConfigTagsNavegador };

const bruto = () => { try { return document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`))?.slice(CONSENT_COOKIE.length + 1) ?? ""; } catch { return ""; } };
const assinar = (cb: () => void) => { window.addEventListener(EVENTO_CONSENTIMENTO, cb); return () => window.removeEventListener(EVENTO_CONSENTIMENTO, cb); };

function carregar(cfg: ConfigTagsNavegador) {
  const w = window as Janela;
  w.__nlTags = cfg;
  if (cfg.meta && !w.fbq) {
    const f: Fbq = function (...args: unknown[]) { if (f.callMethod) f.callMethod(...args); else f.queue!.push(args); } as Fbq;
    f.queue = []; f.loaded = true; f.version = "2.0"; f.push = f;
    w.fbq = f; w._fbq = f;
    const s = document.createElement("script"); s.async = true; s.src = "https://connect.facebook.net/en_US/fbevents.js"; s.id = "nl-fbq";
    document.head.appendChild(s);
    f("init", cfg.meta);
    f("track", "PageView");
  }
  const ids = [cfg.googleAds, cfg.ga4].filter(Boolean) as string[];
  if (ids.length && !w.gtag) {
    w.dataLayer = w.dataLayer ?? [];
    w.gtag = function gtag() { w.dataLayer!.push(arguments); }; // eslint-disable-line prefer-rest-params
    w.gtag("consent", "default", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "granted" });
    w.gtag("js", new Date());
    for (const id of ids) w.gtag("config", id);
    const s = document.createElement("script"); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ids[0]!)}`; s.id = "nl-gtag";
    document.head.appendChild(s);
  }
}

/**
 * Conversão no navegador (TR4, D295): o mesmo identificador vai para o servidor depois (TR5), então a Meta e o Google
 * não contam duas vezes. Sem tags carregadas (sem consentimento ou sem números no Master), não faz nada.
 */
export function conversaoAnuncio(tipo: "Lead" | "Contact", eventoId?: string) {
  try {
    const w = window as Janela;
    if (!w.__nlTags) return;
    w.fbq?.("track", tipo, {}, eventoId ? { eventID: eventoId } : undefined);
    if (tipo === "Lead") {
      if (w.__nlTags.leadSendTo) w.gtag?.("event", "conversion", { send_to: w.__nlTags.leadSendTo, ...(eventoId ? { transaction_id: eventoId } : {}) });
      w.gtag?.("event", "generate_lead");
    } else w.gtag?.("event", "contato_whatsapp");
  } catch { /* medir nunca quebra o site */ }
}

/**
 * Pixel da Meta, Google Ads e Google Analytics no site da NextLevel (TR4, D295). Só carregam depois que a pessoa aceitou
 * "Anúncios" no aviso de cookies; se ela tirar o aceite depois, as tags param de receber eventos (revogação na Meta e no
 * Google). Os números vêm do Master → Tráfego e campanhas → Conexões.
 */
export function TagsAnuncio({ cfg }: { cfg: ConfigTagsNavegador }) {
  const consent = React.useSyncExternalStore(assinar, bruto, () => "");
  const aceito = podeAnunciar(lerConsentimento(consent));
  const caminho = usePathname();
  const primeira = React.useRef(true);

  React.useEffect(() => {
    const w = window as Janela;
    if (aceito) {
      carregar(cfg);
      w.fbq?.("consent", "grant");
      w.gtag?.("consent", "update", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "granted" });
    } else if (w.__nlTags) {
      w.fbq?.("consent", "revoke");
      w.gtag?.("consent", "update", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" });
      w.__nlTags = undefined;
    }
  }, [aceito, cfg]);

  React.useEffect(() => {
    // A primeira página já conta ao carregar; as seguintes (navegação dentro do site) contam aqui.
    if (primeira.current) { primeira.current = false; return; }
    const w = window as Janela;
    if (!w.__nlTags) return;
    try { w.fbq?.("track", "PageView"); w.gtag?.("event", "page_view", { page_path: caminho }); } catch { /* segue */ }
  }, [caminho]);

  React.useEffect(() => {
    const clique = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a");
      if (a?.href && /(^|\.)(wa\.me|whatsapp\.com)$/.test((() => { try { return new URL(a.href).hostname; } catch { return ""; } })())) conversaoAnuncio("Contact");
    };
    document.addEventListener("click", clique, { capture: true });
    return () => document.removeEventListener("click", clique, { capture: true });
  }, []);
  return null;
}
