import type { IntegracoesLoja } from "./integracoes-tipos";

export type { IntegracoesLoja } from "./integracoes-tipos";

/**
 * Integrações só de configuração (Rodada A, D189; fila em docs/prompts/integracoes-aplicativos-fila.md, I-01 a I-11).
 * Regra de segurança: o lojista NUNCA cola script livre. Cada campo aceita só o formato do código daquele parceiro
 * (ou o trecho oficial, de onde tiramos só o código); o script que vai para a loja é escrito por nós.
 */
export const CAMPOS = {
  ga4: { nome: "Google Analytics 4", re: /^G-[A-Z0-9]{4,15}$/, exemplo: "G-ABC123XYZ" },
  gtm: { nome: "Google Tag Manager", re: /^GTM-[A-Z0-9]{4,10}$/, exemplo: "GTM-AB12CD3" },
  googleVerificacao: { nome: "Google Search Console", re: /^[A-Za-z0-9_-]{20,100}$/, exemplo: "código da meta tag" },
  googleAdsId: { nome: "Google Ads", re: /^AW-\d{6,12}$/, exemplo: "AW-123456789" },
  googleAdsRotulo: { nome: "Rótulo da conversão do Google Ads", re: /^[A-Za-z0-9_-]{4,40}$/, exemplo: "AbC-D_efG123" },
  tiktokPixel: { nome: "Pixel do TikTok", re: /^[A-Z0-9]{15,25}$/, exemplo: "C1ABCDEFGHIJ2KLMNOPQ" },
  pinterestTag: { nome: "Tag do Pinterest", re: /^\d{10,16}$/, exemplo: "2612345678901" },
  tawk: { nome: "Tawk.to", re: /^[a-f0-9]{24}\/[a-z0-9]{6,12}$/, exemplo: "64f0c0ffee0123456789abcd/1h2j3k4l5" },
  jivo: { nome: "JivoChat", re: /^[A-Za-z0-9]{8,12}$/, exemplo: "AbCd1234Ef" },
} as const;

/** Tira o código do que o lojista colou: aceita o código puro, a meta tag do Google ou o endereço do Tawk/Jivo. */
export function extrairCodigo(campo: keyof typeof CAMPOS, colado: string): string {
  let v = colado.trim();
  if (campo === "googleVerificacao") v = v.match(/content=["']([^"']+)["']/)?.[1] ?? v;
  if (campo === "tawk") v = v.match(/embed\.tawk\.to\/([a-f0-9]{24}\/[a-z0-9]+)/i)?.[1] ?? v;
  if (campo === "jivo") v = v.match(/code\.jivo(?:site)?\.(?:com|ru)\/widget\/([A-Za-z0-9]+)/)?.[1] ?? v;
  if (campo === "ga4" || campo === "gtm" || campo === "googleAdsId" || campo === "tiktokPixel") v = v.toUpperCase();
  return v;
}

export type EntradaIntegracoes = {
  ga4?: string; gtm?: string; googleVerificacao?: string; googleAdsId?: string; googleAdsRotulo?: string;
  tiktokPixel?: string; pinterestTag?: string; chatProvedor?: "" | "TAWK" | "JIVO"; chatId?: string; pwa?: boolean; maioridade?: boolean;
};

/** Valida tudo e devolve a configuração limpa (vazio = desligado) ou a lista de erros por campo. */
export function validarIntegracoes(e: EntradaIntegracoes): { ok: true; valor: IntegracoesLoja } | { ok: false; erros: Record<string, string> } {
  const erros: Record<string, string> = {};
  const pega = (campo: keyof typeof CAMPOS, bruto: string | undefined, chave = campo as string): string | undefined => {
    if (!bruto?.trim()) return undefined;
    const v = extrairCodigo(campo, bruto);
    if (!CAMPOS[campo].re.test(v)) { erros[chave] = `${CAMPOS[campo].nome}: formato inválido (exemplo: ${CAMPOS[campo].exemplo}).`; return undefined; }
    return v;
  };
  const valor: IntegracoesLoja = {};
  const ga4 = pega("ga4", e.ga4); if (ga4) valor.ga4 = ga4;
  const gtm = pega("gtm", e.gtm); if (gtm) valor.gtm = gtm;
  const gv = pega("googleVerificacao", e.googleVerificacao); if (gv) valor.googleVerificacao = gv;
  const adsId = pega("googleAdsId", e.googleAdsId); const adsRot = pega("googleAdsRotulo", e.googleAdsRotulo);
  if (adsId) valor.googleAds = { id: adsId, ...(adsRot ? { rotulo: adsRot } : {}) };
  else if (adsRot && !erros.googleAdsRotulo) erros.googleAdsId = "Google Ads: informe o ID (AW-…) junto com o rótulo.";
  const tt = pega("tiktokPixel", e.tiktokPixel); if (tt) valor.tiktokPixel = tt;
  const pin = pega("pinterestTag", e.pinterestTag); if (pin) valor.pinterestTag = pin;
  if (e.chatProvedor) {
    const id = pega(e.chatProvedor === "TAWK" ? "tawk" : "jivo", e.chatId, "chatId");
    if (id) valor.chat = { provedor: e.chatProvedor, id };
    else if (!erros.chatId) erros.chatId = "Informe o código do chat.";
  }
  if (e.pwa) valor.pwa = true;
  if (e.maioridade) valor.maioridade = true;
  return Object.keys(erros).length ? { ok: false, erros } : { ok: true, valor };
}

/** O que a página da loja precisa (sem nada além dos códigos públicos). */
export const temAlgumaMedicao = (i: IntegracoesLoja | null | undefined, pixelMeta?: string | null) =>
  !!(pixelMeta || i?.ga4 || i?.gtm || i?.googleAds || i?.tiktokPixel || i?.pinterestTag);

const escSvg = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const corValida = (c: string | null | undefined, padrao: string) => (c && /^#[0-9a-fA-F]{6}$/.test(c) ? c : padrao);

/** Manifesto da loja instalável no celular (I-10). Ícone: o logo da loja, quando há, e sempre o ícone com as iniciais. */
export function manifestoDaLoja(loja: { name: string; logoText: string | null; logoUrl: string | null; primaryColor: string | null }, base: string) {
  const cor = corValida(loja.primaryColor, "#0f172a");
  const icons: { src: string; sizes: string; type: string; purpose?: string }[] = [{ src: `${base}/icone.svg`, sizes: "any", type: "image/svg+xml", purpose: "any maskable" }];
  if (loja.logoUrl && /^(\/|https:\/\/)/.test(loja.logoUrl)) icons.unshift({ src: loja.logoUrl, sizes: "any", type: /\.png($|\?)/i.test(loja.logoUrl) ? "image/png" : /\.svg($|\?)/i.test(loja.logoUrl) ? "image/svg+xml" : "image/webp" });
  return { name: loja.name, short_name: loja.name.slice(0, 12), start_url: `${base}?origem=app`, scope: `${base}`, display: "standalone", background_color: "#ffffff", theme_color: cor, lang: "pt-BR", icons };
}

/** Ícone quadrado com as iniciais da loja na cor dela (SVG escrito por nós; nada vem do lojista além do texto). */
export function iconeDaLoja(loja: { logoText: string | null; primaryColor: string | null }, corDoTexto: string) {
  const cor = corValida(loja.primaryColor, "#0f172a");
  const texto = escSvg((loja.logoText || "L").slice(0, 3));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${cor}"/><text x="256" y="256" dy=".35em" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-weight="700" font-size="${texto.length > 2 ? 150 : 200}" fill="${corValida(corDoTexto, "#ffffff")}">${texto}</text></svg>`;
}

/** O formulário parte do que está salvo. */
export const entradaDe = (i: IntegracoesLoja): EntradaIntegracoes => ({
  ga4: i.ga4 ?? "", gtm: i.gtm ?? "", googleVerificacao: i.googleVerificacao ?? "", googleAdsId: i.googleAds?.id ?? "", googleAdsRotulo: i.googleAds?.rotulo ?? "",
  tiktokPixel: i.tiktokPixel ?? "", pinterestTag: i.pinterestTag ?? "", chatProvedor: i.chat?.provedor ?? "", chatId: i.chat?.id ?? "", pwa: !!i.pwa, maioridade: !!i.maioridade,
});
