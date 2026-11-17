import type { Metadata } from "next";

/**
 * Verificação do site no Google Search Console e no Bing Webmaster Tools (D324, plano de busca v3, fase S0). O dono cola
 * no Render o código que a ferramenta mostra (a tag inteira ou só o código): `GOOGLE_SITE_VERIFICATION` e
 * `BING_SITE_VERIFICATION`. Vale só nas páginas públicas da NextLevel Commerce. Sem as variáveis, nada muda.
 */
export function codigoDeVerificacao(v: string | undefined | null): string | null {
  const bruto = (v ?? "").trim();
  if (!bruto) return null;
  const daTag = /content\s*=\s*["']([^"']+)["']/i.exec(bruto)?.[1];
  const codigo = (daTag ?? bruto).trim();
  return /^[A-Za-z0-9_\-]{8,120}$/.test(codigo) ? codigo : null;
}

export function verificacaoBuscadores(env: Record<string, string | undefined> = process.env): Metadata["verification"] | undefined {
  const google = codigoDeVerificacao(env.GOOGLE_SITE_VERIFICATION);
  const bing = codigoDeVerificacao(env.BING_SITE_VERIFICATION);
  if (!google && !bing) return undefined;
  return { ...(google ? { google } : {}), ...(bing ? { other: { "msvalidate.01": bing } } : {}) };
}
