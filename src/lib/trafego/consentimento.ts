/**
 * Consentimento de cookies (TR0, D290). Três grupos:
 * - necessários (sempre): sessão, segurança, carrinho, preferências e a origem de indicação/campanha (D90, regra de comissão);
 * - medição: o primeiro toque e, depois (TR2), a medição própria anônima do site;
 * - anúncios: Pixel da Meta e tags do Google (TR4). Só carregam com "sim".
 * Sem escolha registrada, a medição própria segue ligada (legítimo interesse, avisado no aviso e na política; em revisão
 * jurídica) e os anúncios ficam DESLIGADOS. Pura: lida no navegador (aviso) e no servidor (proxy, pixels).
 */
export const CONSENT_COOKIE = "nl-consent";
/** Muda quando o texto da política sobre cookies mudar: a escolha antiga deixa de valer e o aviso volta. */
export const CONSENT_VERSION = "2026-11-13";
export const CONSENT_MAX_AGE = 365 * 86_400;

export type Consentimento = { versao: string; medicao: boolean; anuncios: boolean; em: string };

export function lerConsentimento(raw: string | null | undefined): Consentimento | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(decodeURIComponent(raw)) as Partial<Consentimento>;
    if (v.versao !== CONSENT_VERSION || typeof v.medicao !== "boolean" || typeof v.anuncios !== "boolean") return null;
    return { versao: v.versao, medicao: v.medicao, anuncios: v.anuncios, em: typeof v.em === "string" ? v.em.slice(0, 10) : "" };
  } catch { return null; }
}

export function gravarConsentimento(escolha: { medicao: boolean; anuncios: boolean }, agora = new Date()): string {
  return encodeURIComponent(JSON.stringify({ versao: CONSENT_VERSION, medicao: escolha.medicao, anuncios: escolha.anuncios, em: agora.toISOString().slice(0, 10) }));
}

/** Medição própria permitida? Sem escolha: sim (avisado). Com escolha: o que a pessoa marcou. */
export const podeMedir = (c: Consentimento | null) => c ? c.medicao : true;
/** Pixel e tags de anúncio: só com "sim" explícito. */
export const podeAnunciar = (c: Consentimento | null) => !!c?.anuncios;
