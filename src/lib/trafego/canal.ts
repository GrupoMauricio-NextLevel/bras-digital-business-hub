/**
 * Canal de uma visita (TR1, D290): a regra ÚNICA que diz de onde a pessoa veio (anúncio da Meta, do Google, orgânico do
 * Instagram, busca, IA, WhatsApp, indicação, direto). Pura e sem banco: roda no proxy, no coletor e nos relatórios.
 * Ordem: clique pago (identificador do anúncio ou etiqueta paga) > indicação (código do parceiro) > etiqueta > site de
 * origem > direto. A comissão do parceiro NÃO depende disto (regra D90); aqui é só medição.
 */

export const CANAIS = [
  "meta-pago", "google-pago", "tiktok-pago", "outros-pago", "indicacao", "instagram-organico", "facebook-organico", "google-organico",
  "outras-buscas", "tiktok-organico", "youtube-organico", "ia", "whatsapp", "email", "outros-sites", "direto",
] as const;
export type Canal = (typeof CANAIS)[number];

export const ROTULO_CANAL: Record<Canal, string> = {
  "meta-pago": "Anúncio Meta (Instagram/Facebook)",
  "google-pago": "Anúncio Google",
  "tiktok-pago": "Anúncio TikTok",
  "outros-pago": "Outro anúncio pago",
  indicacao: "Indicação de parceiro",
  "instagram-organico": "Instagram (orgânico)",
  "facebook-organico": "Facebook (orgânico)",
  "google-organico": "Busca do Google (orgânico)",
  "outras-buscas": "Outros buscadores",
  "tiktok-organico": "TikTok (orgânico)",
  "youtube-organico": "YouTube (orgânico)",
  ia: "Assistentes de IA (ChatGPT e outros)",
  whatsapp: "WhatsApp",
  email: "E-mail",
  "outros-sites": "Outros sites",
  direto: "Direto (digitou ou salvou o endereço)",
};

/** Identificadores de clique que os anúncios põem no link (a "chave" para devolver a venda à plataforma depois). */
export const CLICK_IDS = ["fbclid", "gclid", "gbraid", "wbraid", "ttclid"] as const;
export type ClickId = (typeof CLICK_IDS)[number];

/** Robôs e pré-visualizações ficam fora de toda contagem (mesma regra das visitas das lojas, D185). */
const ROBO = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp\/|preview|headless|lighthouse|pagespeed|curl|wget|python|axios|node-fetch|go-http|monitor|uptime/i;
export const ehRobo = (ua: string | null | undefined) => !ua || ROBO.test(ua);

const PAGO = /^(pago|paid|cpc|ppc|cpm|cpv|ads?|anuncio|remarketing|retargeting|paid[-_]?social|display)$/;

/** Etiqueta (`utm_source`) → canal orgânico. */
const FONTES: [RegExp, Canal][] = [
  [/^(meta|facebook|fb)$/, "facebook-organico"],
  [/^(instagram|ig|insta)$/, "instagram-organico"],
  [/^google$/, "google-organico"],
  [/^(bing|duckduckgo|yahoo|ecosia)$/, "outras-buscas"],
  [/^tiktok$/, "tiktok-organico"],
  [/^(youtube|yt)$/, "youtube-organico"],
  [/^(whatsapp|wa|zap)$/, "whatsapp"],
  [/^(email|e-mail|newsletter|mail)$/, "email"],
  [/^(chatgpt|openai|perplexity|gemini|copilot|claude|ia)$/, "ia"],
  [/^(parceiro|afiliado|indicacao)$/, "indicacao"],
];

/** Site de origem → canal (a ordem importa: gemini.google.com é IA, não busca). */
const SITES: [RegExp, Canal][] = [
  [/(^|\.)(chatgpt\.com|chat\.openai\.com|perplexity\.ai|gemini\.google\.com|copilot\.microsoft\.com|claude\.ai)$/, "ia"],
  [/(^|\.)(mail\.google\.com|outlook\.(live|office)\.com|mail\.yahoo\.com)$/, "email"],
  [/(^|\.)instagram\.com$/, "instagram-organico"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, "facebook-organico"],
  [/(^|\.)google\.[a-z.]+$/, "google-organico"],
  [/(^|\.)(bing\.com|duckduckgo\.com|search\.yahoo\.com|ecosia\.org|br\.search\.yahoo\.com)$/, "outras-buscas"],
  [/(^|\.)tiktok\.com$/, "tiktok-organico"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube-organico"],
  [/(^|\.)(wa\.me|whatsapp\.com)$/, "whatsapp"],
];

const limpa = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();
const hostDe = (url: string | null | undefined) => {
  if (!url) return "";
  try { return new URL(url).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
};

export type EntradaCanal = {
  utm_source?: string | null; utm_medium?: string | null; ref?: string | null;
  fbclid?: string | null; gclid?: string | null; gbraid?: string | null; wbraid?: string | null; ttclid?: string | null;
  /** Endereço de onde a pessoa veio (cabeçalho Referer) ou só o host dele. */
  referrer?: string | null;
  /** Host do próprio site: navegação interna conta como direto. */
  hostProprio?: string | null;
};

export function canalDe(e: EntradaCanal): Canal {
  const src = limpa(e.utm_source);
  const med = limpa(e.utm_medium);
  const pago = PAGO.test(med);
  if (e.gclid || e.gbraid || e.wbraid) return "google-pago";
  if (e.ttclid) return "tiktok-pago";
  if (pago) {
    if (/^(meta|facebook|fb|instagram|ig|insta)$/.test(src) || e.fbclid) return "meta-pago";
    if (src === "google" || src === "youtube") return "google-pago";
    if (src === "tiktok") return "tiktok-pago";
    return "outros-pago";
  }
  if (e.ref) return "indicacao";
  if (src) {
    for (const [re, canal] of FONTES) if (re.test(src)) return canal;
    return "outros-sites";
  }
  const host = e.referrer?.includes("/") ? hostDe(e.referrer) : limpa(e.referrer).replace(/^www\./, "");
  const proprio = limpa(e.hostProprio).split(":")[0]!.replace(/^www\./, "");
  if (host && host !== proprio) {
    for (const [re, canal] of SITES) if (re.test(host)) return canal;
    return "outros-sites";
  }
  // fbclid sem etiqueta paga e sem site de origem: link do Facebook/Instagram fora de anúncio (o Instagram costuma esconder a origem).
  if (e.fbclid) return "facebook-organico";
  return "direto";
}

export const ehCanalPago = (c: Canal) => c.endsWith("-pago");
